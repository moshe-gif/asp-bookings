// Zero-dependency Node proxy. Holds secrets server-side, gates /api/* behind verified
// auth, encrypts sensitive state at rest. Run behind nginx+TLS via pm2. See SETUP.md.
const http = require('http');
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

// ── Secrets: from env or a 0600 file — NEVER hardcode in a committed file ────────
const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY || '';
const APP_ORIGIN    = process.env.APP_ORIGIN || 'https://app.your-domain.com'; // lock CORS to this
const STATE_FILE    = '/var/www/state.json';
const STATE_KEY_FILE= '/var/www/.state-key';

// ── Encryption at rest (AES-256-GCM) for any sensitive tokens we persist ─────────
function getStateKey(){
  try{ if(fs.existsSync(STATE_KEY_FILE)){ const k=fs.readFileSync(STATE_KEY_FILE,'utf8').trim();
    if(k.length>=64) return Buffer.from(k.slice(0,64),'hex'); } }catch(e){}
  const nk=crypto.randomBytes(32);
  try{ fs.writeFileSync(STATE_KEY_FILE, nk.toString('hex'), {mode:0o600}); }catch(e){}
  return nk;
}
const STATE_K = getStateKey();
function loadST(){ try{ const j=JSON.parse(fs.readFileSync(STATE_FILE,'utf8'));
  if(j&&j.__enc===1){ const d=crypto.createDecipheriv('aes-256-gcm',STATE_K,Buffer.from(j.iv,'hex'));
    d.setAuthTag(Buffer.from(j.tag,'hex'));
    return JSON.parse(Buffer.concat([d.update(Buffer.from(j.ct,'hex')),d.final()]).toString('utf8')); }
  return j; }catch(e){ return {}; } }
function saveST(s){ try{ const iv=crypto.randomBytes(12);
  const e=crypto.createCipheriv('aes-256-gcm',STATE_K,iv);
  const ct=Buffer.concat([e.update(JSON.stringify(s),'utf8'),e.final()]);
  fs.writeFileSync(STATE_FILE,JSON.stringify({__enc:1,iv:iv.toString('hex'),
    ct:ct.toString('hex'),tag:e.getAuthTag().toString('hex')})); }catch(e){} }
let ST = loadST();

// ── Verify a Supabase-issued session JWT ─────────────────────────────────────────
// The app's real IdP is Supabase (magic-link + passkey), not Firebase -- verify against
// Supabase's own JWKS (asymmetric ES256/RS256; every project publishes one, key rotation
// included), matching this project's SUPABASE_URL. Authorization (admin vs artist, which
// desk) is looked up from admin_users/artists in Postgres, not an env-var allowlist here --
// that keeps one source of truth (the same RLS-backed tables the browser already reads),
// see supabase/migrations/0001_initial_schema.sql's is_admin()/current_admin_role().
const SUPABASE_URL = process.env.SUPABASE_URL || '';
let jwksCache = null, jwksCacheAt = 0;
function fetchJwks(cb){
  if(jwksCache && Date.now() - jwksCacheAt < 3600000) return cb(null, jwksCache);
  https.get(SUPABASE_URL + '/auth/v1/.well-known/jwks.json', res=>{
    let body=''; res.on('data',c=>body+=c);
    res.on('end',()=>{
      try{ jwksCache = JSON.parse(body).keys; jwksCacheAt = Date.now(); cb(null, jwksCache); }
      catch(e){ cb('bad jwks response'); }
    });
  }).on('error', e=>cb(e.message));
}
function b64url(s){ return Buffer.from(s.replace(/-/g,'+').replace(/_/g,'/'), 'base64'); }
function verifyIdToken(token, cb){
  if(!token) return cb('no token');
  if(!SUPABASE_URL) return cb('SUPABASE_URL not configured');
  const parts = token.split('.');
  if(parts.length !== 3) return cb('malformed token');
  let header, payload;
  try{
    header = JSON.parse(b64url(parts[0]));
    payload = JSON.parse(b64url(parts[1]));
  }catch(e){ return cb('malformed token'); }
  fetchJwks((err, keys)=>{
    if(err) return cb('could not load signing keys: ' + err);
    const jwk = keys.find(k=>k.kid === header.kid);
    if(!jwk) return cb('unknown signing key');
    let publicKey;
    try{ publicKey = crypto.createPublicKey({ key: jwk, format: 'jwk' }); }
    catch(e){ return cb('bad signing key'); }
    const signedData = parts[0] + '.' + parts[1];
    const signature = b64url(parts[2]);
    let ok;
    try{
      ok = header.alg === 'ES256'
        ? crypto.verify('sha256', Buffer.from(signedData), { key: publicKey, dsaEncoding: 'ieee-p1363' }, signature)
        : crypto.verify('RSA-SHA256', Buffer.from(signedData), publicKey, signature);
    }catch(e){ return cb('signature check failed'); }
    if(!ok) return cb('invalid signature');
    const now = Math.floor(Date.now()/1000);
    if(payload.exp && payload.exp < now) return cb('token expired');
    if(payload.iss !== SUPABASE_URL + '/auth/v1') return cb('wrong issuer');
    cb(null, { uid: payload.sub, email: payload.email });
  });
}

// ── Per-token rate limiting (simple sliding window) ─────────────────────────────
const RL = new Map();
function rateLimited(key, max=60, windowMs=60000){
  const now=Date.now(); const a=(RL.get(key)||[]).filter(t=>now-t<windowMs);
  a.push(now); RL.set(key,a); return a.length>max;
}

function sendJson(res, code, obj){
  res.writeHead(code,{'Content-Type':'application/json','Access-Control-Allow-Origin':APP_ORIGIN});
  res.end(JSON.stringify(obj));
}
function proxyReq(req, res, host, path, hdrs){
  let body=''; req.on('data',c=>body+=c);
  req.on('end',()=>{ const opts={hostname:host,path,method:req.method,
    headers:Object.assign({'Content-Type':'application/json'},hdrs)};
    if(body) opts.headers['Content-Length']=Buffer.byteLength(body);
    https.request(opts,pr=>{ res.writeHead(pr.statusCode,
      {'Content-Type':'application/json','Access-Control-Allow-Origin':APP_ORIGIN}); pr.pipe(res); })
      .on('error',e=>{res.writeHead(500);res.end(JSON.stringify({error:e.message}));}).end(body||undefined);
  });
}

http.createServer((req,res)=>{
  res.setHeader('Access-Control-Allow-Origin', APP_ORIGIN);              // CORS locked, not *
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');
  if(req.method==='OPTIONS'){ res.writeHead(200); res.end(); return; }
  const url = req.url.split('?')[0];

  if(url==='/api/health') return sendJson(res,200,{ok:true});

  // Gate every other /api/* route behind a verified ID token.
  if(url.indexOf('/api/')===0){
    const m=(req.headers['authorization']||'').match(/^Bearer\s+(.+)$/i);
    return verifyIdToken(m?m[1]:null,(err,user)=>{
      if(err) return sendJson(res,401,{error:'unauthorized',detail:err});
      if(rateLimited(user.uid)) return sendJson(res,429,{error:'rate limited'});
      req._user=user; route(req,res,url);
    });
  }
  res.writeHead(404); res.end();
}).listen(3001,()=>console.log('proxy :3001 (behind nginx/TLS) | CORS '+APP_ORIGIN));

function route(req,res,url){
  if(req.method==='POST' && url==='/api/claude')
    return proxyReq(req,res,'api.anthropic.com','/v1/messages',
      {'x-api-key':ANTHROPIC_KEY,'anthropic-version':'2023-06-01'});
  res.writeHead(404); res.end();
}
