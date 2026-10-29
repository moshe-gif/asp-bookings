// ASP workspace module. Extracted verbatim from the former single-file frontend/index.html
// (Phase 1a of the parent-app plan) -- a scope-only move, no logic changed. Exposes the
// mount/unmount contract the shell (shell.js) will use once a real workspace switcher lands
// in Phase 1b; for now this still self-executes on load exactly as it always has, so
// mount()/unmount() are contract-shape stubs, not yet wired to real pause/resume behavior.
(function(){
"use strict";

/* ============ ICONS (tiny inline svg) ============ */
const ICO = {
  pencil:'<svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  dash:'<svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
  cal:'<svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  leads:'<svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19V6a2 2 0 0 1 2-2h9l5 5v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/><path d="M14 4v5h5"/></svg>',
  artists:'<svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3.2"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="18" cy="8" r="2.6"/><path d="M16 13.2a5.2 5.2 0 0 1 5.5 5.2"/></svg>',
  money:'<svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 10v0M18 14v0"/></svg>',
  plane:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4Z"/></svg>',
  check:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg>',
  mail:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m3 6 9 7 9-7"/></svg>',
  bell:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>',
  gear:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
  x:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  chev:(d)=>`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" style="transform:rotate(${d==='l'?90:-90}deg)"><path d="m6 9 6 6 6-6"/></svg>`,
  clock:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
  pin:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s7-6.3 7-11.5A7 7 0 0 0 5 9.5C5 14.7 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.3"/></svg>',
  logout:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></svg>',
  alert:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4M12 17h.01M10.3 3.9 2.5 18a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>',
  share:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v13"/><path d="m7 8 5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>',
  plus:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
  kebab:'<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>',
  trash:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/><path d="M10 11v6M14 11v6"/></svg>',
  upload:'<svg class="ico" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M7 9l5-5 5 5M5 20h14"/></svg>',
  wa:'<svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 20.5l1.3-4A8.5 8.5 0 1 1 8 19.6z"/><path d="M9 9.5c.3 1.8 2.6 4.2 4.6 4.6l1-1.2 1.9.9c-.3 1.2-1.3 1.7-2.2 1.6C11 15 8.6 12.6 8.1 9.9c-.1-.9.4-1.9 1.6-2.2l.9 1.9z"/></svg>',
  film:'<svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M10 9l5 3-5 3z"/></svg>',
  kanban:'<svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="9.5" y="4" width="5" height="10" rx="1.5"/><rect x="16" y="4" width="5" height="13" rx="1.5"/></svg>',
  sparkle:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/></svg>',
  tag:'<svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12.5 3H5a2 2 0 0 0-2 2v7.5a2 2 0 0 0 .586 1.414l9 9a2 2 0 0 0 2.828 0l7.5-7.5a2 2 0 0 0 0-2.828l-9-9A2 2 0 0 0 12.5 3Z"/><circle cx="8.5" cy="8.5" r="1.5"/></svg>',
  sms:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"/></svg>',
  settings:'<svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
  menu:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
  key:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>',
  mic:'<svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="7.5" r="4.5"/><path d="M9 6.2h6M9 8.8h6"/><path d="M12 12v9"/></svg>',
  car:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 17h-.5a1.5 1.5 0 0 1-1.5-1.5v-2a2 2 0 0 1 .15-.76l1.7-4A2 2 0 0 1 6.7 7.5h10.6a2 2 0 0 1 1.85 1.24l1.7 4c.1.24.15.5.15.76v2a1.5 1.5 0 0 1-1.5 1.5H19"/><path d="M5 17h9"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>',
  suitcase:'<svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M2 13h20"/></svg>',
  checkSquare:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3.5" y="3.5" width="17" height="17" rx="3"/></svg>',
  edit:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  image:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>',
  download:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>',
  up:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="m5 15 7-7 7 7"/></svg>',
  down:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="m5 9 7 7 7-7"/></svg>',
};
// Photo mic used specifically in the artist "My Gigs" area (nav icon + Today's Gig card) in place
// of the generic ICO.mic line-art icon -- same .ico sizing rules apply since width/height are CSS.
const MIC_PHOTO_ICON = '<img class="ico" src="assets/mic-artist.jpg" alt="Microphone" style="object-fit:cover;border-radius:3px;vertical-align:middle;"/>';
// The ASP logo (the owner's brand files, assets/brand/, 2026-10-14). brandLogoHtml() gives two images:
// dark ink for light paper and white ink for the app's dark theme (styles.css swaps them). The white
// one carries an inline display:none, so an email -- which never sees the app's CSS -- shows only the
// dark-ink logo. Documents and emails use the production address (the same HTML is emailed and frozen
// into signing links, so it must never point at a test or preview host); the app's own chrome uses
// the copy it was loaded from (local: true).
const BRAND_ASSET_BASE = 'https://app.aspmgmt.com/assets/brand/';
function brandLogoHtml({ width=170, kind='horizontal', alt='ASP Management', local=false } = {}){
  const base = local ? 'assets/brand/' : BRAND_ASSET_BASE;
  const st = `width:${width}px;max-width:100%;height:auto;border:0;`;
  return `<img class="brand-logo logo-on-light" src="${base}asp-${kind}-dark.png" alt="${esc(alt)}" width="${width}" style="display:block;${st}"/>`
    + `<img class="brand-logo logo-on-dark" src="${base}asp-${kind}-light.png" alt="" aria-hidden="true" width="${width}" style="display:none;${st}"/>`;
}
// Email-only HTML (always white paper): just the dark-ink logo.
function brandLogoEmailHtml(width=170){
  return `<img src="${BRAND_ASSET_BASE}asp-horizontal-dark.png" alt="ASP Management" width="${width}" style="display:block;width:${width}px;max-width:100%;height:auto;border:0;"/>`;
}
// The logo's "A" with its eight blue bars, drawn as SVG (traced from the owner's logo file) so the
// bars can move: the loading indicator wherever something needs a moment, and the opener.
function aspIconSvg({ height=16, animate=false } = {}){
  const h = height, w = Math.round(height * 780 / 586);
  return `<svg class="asp-a${animate?' asp-a-live':''}" viewBox="0 0 780 586" width="${w}" height="${h}" aria-hidden="true" focusable="false"><path fill="currentColor" d="M5 582 L330 18 Q336 6 350 6 L438 6 Q452 6 458 18 L775 582 L659 582 L404 110 Q394 96 384 110 L109 582 Z"/><g class="asp-bars" fill="#80A0D0"><rect x="229" y="394" width="25" height="81" rx="12.5"/><rect x="271" y="325" width="25" height="188" rx="12.5"/><rect x="311" y="397" width="25" height="77" rx="12.5"/><rect x="353" y="226" width="26" height="338" rx="13"/><rect x="406" y="287" width="27" height="216" rx="13.5"/><rect x="447" y="394" width="24" height="82" rx="12"/><rect x="489" y="324" width="24" height="192" rx="12"/><rect x="529" y="394" width="25" height="80" rx="12.5"/></g></svg>`;
}
function markLoader(heightPx){
  return `<span class="mark-loader" role="img" aria-label="Loading">${aspIconSvg({ height: heightPx||16, animate:true })}</span>`;
}

/* ============ LOCAL PERSISTENCE ============ */
// Every collection still lives in this browser's localStorage (the only copy -- see CLAUDE.md).
// persist() is the one write path for them: a full quota or blocked storage is reported to the
// user instead of silently losing the change (was an empty catch in 10 save functions; 2026-10-09
// audit 3.4). Returns {ok}.
function persist(key, value, label){
  try{ localStorage.setItem(key, JSON.stringify(value)); return { ok:true }; }
  catch(e){
    console.error('save failed', key, e);
    try{ toast(`Could not save ${label||'your change'} — your browser storage may be full or unavailable. Back up your data (Settings) before continuing.`, 'system'); }catch(_){}
    return { ok:false, error:e };
  }
}

/* ============ SEED DATA ============ */
function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const rng = mulberry32(88771);
const pick = (arr)=>arr[Math.floor(rng()*arr.length)];
const randInt = (a,b)=>Math.floor(rng()*(b-a+1))+a;

let ARTISTS = [
  {id:'baruch', name:'Baruch Levine', slot:1, initials:'BL', email:'baruch@aspmanagement.com', role:'Singer'},
  {id:'benny',  name:'Benny Friedman', slot:2, initials:'BF', email:'benny@aspmanagement.com', role:'Singer'},
  {id:'moshe',  name:'Moshe Tischler', slot:3, initials:'MT', email:'moshe@aspmanagement.com', role:'Singer'},
  {id:'yaakov', name:'Yaakov Rosenblum', slot:4, initials:'YR', email:'yaakov@aspmanagement.com', role:'Singer'},
  {id:'eli',    name:'Eli Marcus', slot:7, initials:'EM', email:'eli@aspmanagement.com', role:'Singer'},
  {id:'dovie',  name:'Dovie Nueberger', slot:6, initials:'DN', email:'dovie@aspmanagement.com', role:'Comedian'},
  {id:'shmili', name:'Shmili Landau', slot:5, initials:'SL', email:'shmili@aspmanagement.com', role:'DJ'},
];
const artistById = (id)=>ARTISTS.find(a=>a.id===id);
const NO_ARTIST = { id:'', name:'Gig', initials:'?', slot:0 }; // a crew-calendar gig with no singer set yet
// Supabase tables reference artists by their row uuid (artists.id), while the app's id is the
// legacy_id ('baruch') when there is one -- convert at that boundary (2026-10-26: adding Baruch's
// mailbox failed with "invalid input syntax for type uuid").
const artistDbId = (id)=>{ const a = artistById(id); return (a && a.dbId) || (/^[0-9a-f-]{36}$/i.test(id||'') ? id : null); };
const artistByDbId = (uuid)=>ARTISTS.find(a=>a.dbId===uuid || a.id===uuid);
const ARTISTS_LS_KEY = 'asp_mock_artists_v1';
function loadArtists(){ try{ const raw = localStorage.getItem(ARTISTS_LS_KEY); if(raw) return JSON.parse(raw); }catch(e){} return null; }
function saveArtists(){ return persist(ARTISTS_LS_KEY, ARTISTS, 'the artist roster'); }
// The roster's owner is Supabase `artists` (0037, audit 3.6): syncArtistRoster() loads it at
// sign-in and it wins. The list above is only the first paint before then; localStorage is a cache.
const SEED_ARTIST_IDS = ARTISTS.map(a=>a.id);
{ const saved = loadArtists();
  if(saved && saved.length){ saved.forEach(a=>{ if(!a.role) a.role = 'Singer'; }); ARTISTS = saved; }
  saveArtists();
}

/* ============ PROJECTS ============ */
// Projects no longer have a type/stage-pipeline concept — every project is just "General".
// Kept as a single-entry lookup (rather than inlining) since makeProject/buildProjectTasks/
// seedProjects still call getProjectType() for the empty stages/checklist shape.
const PROJECT_TYPES = [
  { name:'General', stages:['Active'], checklist:{} },
];
function getProjectType(name){ return PROJECT_TYPES.find(t=>t.name===name) || PROJECT_TYPES[0]; }

function buildProjectTasks(type){
  const pt = getProjectType(type);
  const tasks = [];
  Object.entries(pt.checklist||{}).forEach(([stage, items])=>{
    items.forEach(text=> tasks.push({id:'T-'+Math.random().toString(36).slice(2,9), stage, text, done:false, assignedTo:null}));
  });
  return tasks;
}
const BOARD_CARD_ACCENTS = ['--cat-1','--cat-2','--cat-3','--cat-4','--cat-5','--cat-6','--cat-7'];
function boardCardColor(header){
  const s = (header||'').trim().toLowerCase();
  if(!s) return 'var(--border-strong)';
  let hash=0; for(let i=0;i<s.length;i++){ hash = (hash*31 + s.charCodeAt(i))|0; }
  return `var(${BOARD_CARD_ACCENTS[Math.abs(hash)%BOARD_CARD_ACCENTS.length]})`;
}
function buildDefaultBoardCards(){
  return ['Contacts','Musicians','Venue'].map(h=>({id:'BC-'+Math.random().toString(36).slice(2,9), header:h, items:[]}));
}
let PROJID = 1;
function makeProject(artist, type, title, stageIdx, doneUpTo, dueDate, opts={}){
  // Durable booking record / data-layer refactor (PR 14): artist is optional -- non-gig/general
  // work (production, outside-act coordination, office projects) doesn't need a fake roster pick
  // just to satisfy this shape, matching the DB-level relaxation already done in migration 0020.
  const stages = getProjectType(type).stages;
  const tasks = buildProjectTasks(type);
  tasks.forEach(t=>{ if(stages.indexOf(t.stage) < doneUpTo) t.done = true; });
  return {
    id:'PR-'+(PROJID++), artistId: artist? artist.id : null, type, title, subtitle: opts.subtitle||'', stage:stages[stageIdx], tasks, comments:[], dueDate: dueDate||null, images:[], links:[],
    coverImage: null, boardCards: buildDefaultBoardCards(),
    people: opts.people || [],
    financials: { income:[], expenses:[] },
    recordingEventId: opts.recordingEventId || null,
    createdAt: fmtISO(addDays(new Date(), -randInt(10,120))),
    log:[{ts:new Date().toISOString(), type:'system', text: artist? `Project "${title}" created for ${artist.name}.` : `Project "${title}" created.`}],
  };
}
function seedProjects(){
  const projects = [];
  const titles = { Album:['Unreleased','Chapter Two','Live Sessions'], Tour:['Fall Tour','Winter Run'], 'Music Video':['Lead Single','Behind the Scenes'], Show:['Anniversary Concert','Charity Gala'] };
  const seedTypes = ['Album','Tour','Music Video','Show'];
  ARTISTS.slice(0,4).forEach((artist,i)=>{
    const type = seedTypes[i % 4];
    const stages = getProjectType(type).stages;
    const stageIdx = randInt(0, stages.length-1);
    const dueDate = rng()<0.75 ? fmtISO(addDays(new Date(), randInt(-10,90))) : null;
    projects.push(makeProject(artist, type, pick(titles[type]), stageIdx, stageIdx, dueDate));
  });
  const benny = artistById('benny');
  if(benny){
    projects.push(makeProject(benny, 'Podcast Episode', 'Episode — Rabbi Dovid Orlofsky', 1, 1, fmtISO(addDays(new Date(),6)), {
      subtitle:'Guest: Rabbi Dovid Orlofsky',
      people:[{id:'PPL-'+randInt(1,999999), role:'Guest', name:'Rabbi Dovid Orlofsky'}, {id:'PPL-'+randInt(1,999999), role:'Sponsor', name:'Continental Ballroom'}],
    }));
    projects.push(makeProject(benny, 'Podcast Episode', 'Episode — Yossi Green', 1, 1, fmtISO(addDays(new Date(),13)), {
      subtitle:'Guest: Yossi Green',
      people:[{id:'PPL-'+randInt(1,999999), role:'Guest', name:'Yossi Green'}],
    }));
  }
  return projects;
}
const PROJECTS_LS_KEY = 'asp_mock_projects_v1';
function loadProjects(){ try{ const raw = localStorage.getItem(PROJECTS_LS_KEY); if(raw) return JSON.parse(raw); }catch(e){} return null; }
function saveProjects(){ const r = persist(PROJECTS_LS_KEY, PROJECTS, 'projects'); if(SHARED) SHARED.projects.schedule(); return r; }
let PROJECTS = loadProjects();
// Fresh browsers start EMPTY: the seeders below created made-up projects/invoices/bookings that
// mixed into real financials (2026-10-09 audit 2.15). Kept only as reference fixtures, not called.
if(!PROJECTS){ PROJECTS = []; saveProjects(); }
else {
  PROJID = PROJECTS.reduce((max,p)=>{ const n=parseInt(String(p.id).split('-')[1],10); return isNaN(n)?max:Math.max(max,n+1); }, PROJID);
  let migrated = false;
  PROJECTS.forEach(p=>{
    if(!p.comments){ p.comments = []; migrated = true; }
    if(!p.images){ p.images = []; migrated = true; }
    if(!p.links){ p.links = []; migrated = true; }
    if(p.dueDate === undefined){ p.dueDate = null; migrated = true; }
    if(p.type==='Video'){ p.type='Music Video'; migrated = true; }
    if(!p.people){ p.people = []; migrated = true; }
    p.people.forEach(person=>{
      if(person.kind===undefined){ person.kind = 'external'; migrated = true; }
      if(person.email===undefined){ person.email = ''; migrated = true; }
      if(person.phone===undefined){ person.phone = ''; migrated = true; }
      if(person.refId===undefined){ person.refId = null; migrated = true; }
    });
    if(!p.financials){ p.financials = {income:[], expenses:[]}; migrated = true; }
    if(p.recordingEventId===undefined){ p.recordingEventId = null; migrated = true; }
    if(p.subtitle===undefined){ p.subtitle = ''; migrated = true; }
    if(p.coverImage===undefined){ p.coverImage = null; migrated = true; }
    if(!p.boardCards){ p.boardCards = buildDefaultBoardCards(); migrated = true; }
    (p.tasks||[]).forEach(t=>{ if(t.assignedTo===undefined){ t.assignedTo = null; migrated = true; } });
  });
  if(migrated) saveProjects();
}
function getProject(id){ return PROJECTS.find(p=>p.id===id); }
function projectFinancials(p){
  const income = (p.financials?.income||[]).reduce((s,i)=>s+(Number(i.amount)||0),0);
  const expenses = (p.financials?.expenses||[]).reduce((s,i)=>s+(Number(i.amount)||0),0);
  return {income, expenses, net: income-expenses};
}

/* ============ CUSTOM INVOICES ============ */
let INVID = 1;
function invoiceTotal(inv){ return (inv.items||[]).reduce((s,it)=>s+(Number(it.amount)||0),0); }
function makeInvoice(clientName, clientEmail, items, notes, status, daysAgo){
  const created = addDays(new Date(), -daysAgo);
  const log = [{ts:created.toISOString(), type:'system', text:`Invoice created for ${clientName}.`}];
  const paid = status==='paid';
  if(paid) log.push({ts:addDays(created, Math.max(1,Math.round(daysAgo/2))).toISOString(), type:'success', text:'Marked paid.'});
  return {
    id:'INV-'+(INVID++), clientName, clientEmail, items, notes: notes||'', createdTs: created.toISOString(),
    status, createdAt: fmtISO(created), sentAt: fmtISO(created),
    paidAt: paid? fmtISO(addDays(created, Math.max(1,Math.round(daysAgo/2)))) : null,
    log,
  };
}
function seedCustomInvoices(){
  return [
    makeInvoice('Continental Ballroom', 'ap@continentalballroom.com', [{id:'LI-1',label:'Sound & production rider reimbursement',amount:850}], 'Reimbursement for Aug 8 event', 'open', 4),
    makeInvoice('Merkaz Hall Events', 'billing@merkazhall.com', [{id:'LI-2',label:'Merch table fee',amount:200},{id:'LI-3',label:'Extra chairs & staging',amount:300}], '', 'open', 11),
    makeInvoice('Sarah Klein', 'sarah.klein@example.com', [{id:'LI-4',label:'Private vocal coaching session',amount:400}], '', 'paid', 22),
  ];
}
const INVOICES_LS_KEY = 'asp_mock_invoices_v1';
function loadCustomInvoices(){ try{ const raw = localStorage.getItem(INVOICES_LS_KEY); if(raw) return JSON.parse(raw); }catch(e){} return null; }
function saveCustomInvoices(){ const r = persist(INVOICES_LS_KEY, CUSTOM_INVOICES, 'invoices'); if(SHARED) SHARED.invoices.schedule(); return r; }
let CUSTOM_INVOICES = loadCustomInvoices();
if(!CUSTOM_INVOICES){ CUSTOM_INVOICES = []; saveCustomInvoices(); }
else {
  // One-time cleanup of the old fake seed invoices, matched exactly by their made-up billing emails.
  { const fake = ['ap@continentalballroom.com','billing@merkazhall.com','sarah.klein@example.com'];
    const kept = CUSTOM_INVOICES.filter(inv=>!fake.includes(inv.clientEmail));
    if(kept.length!==CUSTOM_INVOICES.length){ CUSTOM_INVOICES = kept; saveCustomInvoices(); } } INVID = CUSTOM_INVOICES.reduce((max,i)=>{ const n=parseInt(String(i.id).split('-')[1],10); return isNaN(n)?max:Math.max(max,n+1); }, INVID); }
function getInvoice(id){ return CUSTOM_INVOICES.find(i=>i.id===id); }

/* ============ OUTSIDE BOOKINGS (jobs that don't involve one of our own artists) ============ */
let OBID = 1;
function outsideBookingPayout(b){ return (b.totalAmount||0) - (b.aspCut||0); }
// Additive-defaults migration (same convention as migrateContract()/migratePayeeProfiles()) for
// the External Events expansion -- every already-saved outside booking opens unchanged, just with
// the new fields defaulted. See supabase/migrations/0011_external_events_and_reminders.sql for
// the eventual real-backend shape this mirrors.
function migrateOutsideBooking(b){
  let migrated = false;
  if(b.performerArtistId===undefined){ b.performerArtistId = null; migrated = true; }
  if(b.performerContact===undefined){ b.performerContact = ''; migrated = true; }
  if(b.eventName===undefined){ b.eventName = ''; migrated = true; }
  if(b.eventType===undefined){ b.eventType = ''; migrated = true; }
  if(b.startTime===undefined){ b.startTime = ''; migrated = true; }
  if(b.endTime===undefined){ b.endTime = ''; migrated = true; }
  if(b.timezone===undefined){ b.timezone = 'America/New_York'; migrated = true; }
  if(b.address===undefined){ b.address = ''; migrated = true; }
  if(b.clientPhone===undefined){ b.clientPhone = ''; migrated = true; }
  if(b.source===undefined){ b.source = ''; migrated = true; }
  if(b.showOnAspCalendar===undefined){ b.showOnAspCalendar = false; migrated = true; }
  if(!b.reminders){ b.reminders = []; migrated = true; }
  if(b.flightNeeded===undefined){ b.flightNeeded = false; migrated = true; }
  if(b.flightBooked===undefined){ b.flightBooked = false; migrated = true; }
  if(b.flight===undefined){ b.flight = null; migrated = true; }
  if(b.groundTransportNeeded===undefined){ b.groundTransportNeeded = false; migrated = true; }
  if(b.groundTransportBooked===undefined){ b.groundTransportBooked = false; migrated = true; }
  if(b.groundTransport===undefined){ b.groundTransport = null; migrated = true; }
  if(b.hotelNeeded===undefined){ b.hotelNeeded = false; migrated = true; }
  if(b.hotel===undefined){ b.hotel = null; migrated = true; }
  return migrated;
}
function makeOutsideBooking(performerName, clientName, clientEmail, date, venue, city, state, totalAmount, aspCut, notes, status, daysAgo){
  const created = addDays(new Date(), -daysAgo);
  const log = [{ts:created.toISOString(), type:'system', text:`Other booking created — ${performerName} for ${clientName}.`}];
  const paid = status==='paid';
  if(paid) log.push({ts:addDays(created, Math.max(1,Math.round(daysAgo/2))).toISOString(), type:'success', text:'Marked paid.'});
  return {
    id:'OB-'+(OBID++), performerArtistId:null, performerName, performerContact:'', clientName, clientEmail: clientEmail||'', clientPhone:'',
    eventName:'', eventType:'', date, startTime:'', endTime:'', timezone:'America/New_York',
    venue: venue||'', address:'', city: city||'', state: state||'',
    totalAmount, aspCut, notes: notes||'', source:'', status, showOnAspCalendar:false,
    reminders: [],
    flightNeeded:false, flightBooked:false, flight:null,
    groundTransportNeeded:false, groundTransportBooked:false, groundTransport:null,
    hotelNeeded:false, hotel:null,
    createdAt: fmtISO(created), log,
  };
}
function seedOutsideBookings(){
  return [
    makeOutsideBooking('The Zemer Boys', 'Weiss Family', 'weiss.family@example.com', fmtISO(addDays(new Date(),18)), 'Prospect Hall', 'Brooklyn', 'NY', 4200, 500, 'Referred out — our roster was fully booked that night.', 'open', 6),
    makeOutsideBooking('DJ Meir Spins', 'Continental Ballroom', 'events@continentalballroom.com', fmtISO(addDays(new Date(),-30)), 'Continental Ballroom', 'Chicago', 'IL', 1800, 1800, 'Coordination fee only — client paid the DJ directly.', 'paid', 35),
  ];
}
const OUTSIDE_BOOKINGS_LS_KEY = 'asp_mock_outside_bookings_v1';
function loadOutsideBookings(){ try{ const raw = localStorage.getItem(OUTSIDE_BOOKINGS_LS_KEY); if(raw) return JSON.parse(raw); }catch(e){} return null; }
function saveOutsideBookings(){ const r = persist(OUTSIDE_BOOKINGS_LS_KEY, OUTSIDE_BOOKINGS, 'external events'); if(SHARED) SHARED.outside_bookings.schedule(); return r; }
let OUTSIDE_BOOKINGS = loadOutsideBookings();
if(!OUTSIDE_BOOKINGS){ OUTSIDE_BOOKINGS = []; saveOutsideBookings(); }
else {
  // One-time cleanup of the old fake seed external events, matched exactly by their made-up emails.
  { const fake = ['weiss.family@example.com','events@continentalballroom.com'];
    const kept = OUTSIDE_BOOKINGS.filter(b=>!fake.includes(b.clientEmail));
    if(kept.length!==OUTSIDE_BOOKINGS.length){ OUTSIDE_BOOKINGS = kept; saveOutsideBookings(); } }
  let anyObMigrated = false;
  OUTSIDE_BOOKINGS.forEach(b=>{ if(migrateOutsideBooking(b)) anyObMigrated = true; });
  if(anyObMigrated) saveOutsideBookings();
  OBID = OUTSIDE_BOOKINGS.reduce((max,b)=>{ const n=parseInt(String(b.id).split('-')[1],10); return isNaN(n)?max:Math.max(max,n+1); }, OBID);
}
function getOutsideBooking(id){ return OUTSIDE_BOOKINGS.find(b=>b.id===id); }

/* ============ DOCUMENTS (general doc builder — contracts, proposals, riders; any subject) ============ */
// Brand / sender (2026-10-09 audit 3.13): Supabase `brand_config` (migration 0015) is the one owner --
// letterhead label, the legal name that signs, sender name, reply-to and office email, read on every
// document and passed to the email Edge Function (which reads the same row server-side). The literals
// below are only the first paint / signed-out fallback and mirror the table's seed exactly.
const BRAND_FALLBACK = {
  asp:  { label:'ASP Artist Management', signer:'ASP Management Services LLC', senderName:'ASP Management', replyTo:'office@aspmgmt.com', email:'office@aspmgmt.com', phone:'929-392-6076' },
};
const BRAND_KEYS = Object.keys(BRAND_FALLBACK); // ASP only: SING Entertainment removed (owner 2026-10-13, 0055); old 'sing' records render as ASP
let BRAND_CONFIG_CACHE = null;
async function loadBrandConfig(){
  if(!supabaseClient) return;
  // Signed out there is no session: skip the call rather than log a failed request.
  try{
    const { data: { session } } = await supabaseClient.auth.getSession();
    if(!session) return;
    const { data, error } = await supabaseClient.from('brand_config').select('*');
    if(error || !data) return;
    const map = {};
    data.forEach(row=>{ map[row.brand_key] = {
      label: row.display_name, signer: row.legal_name, senderName: row.sender_name, replyTo: row.reply_to, email: row.email, phone: row.phone,
    }; });
    if(Object.keys(map).length){ BRAND_CONFIG_CACHE = map; render(); }
  }catch(err){ console.error('brand config load failed', err); }
}
// A field the table leaves empty falls back to the seed text, so a document never prints a blank.
function getBrandConfig(key){
  const k = BRAND_FALLBACK[key] ? key : 'asp';
  const row = (BRAND_CONFIG_CACHE && BRAND_CONFIG_CACHE[k]) || {};
  const out = { ...BRAND_FALLBACK[k] };
  Object.keys(out).forEach(f=>{ if(row[f]) out[f] = row[f]; });
  return out;
}
let DOCID = 1;
const DOCUMENTS_LS_KEY = 'asp_mock_documents_v1';
function loadDocuments(){ try{ const raw = localStorage.getItem(DOCUMENTS_LS_KEY); if(raw) return JSON.parse(raw); }catch(e){} return null; }
function saveDocuments(){ const r = persist(DOCUMENTS_LS_KEY, DOCUMENTS, 'documents'); if(SHARED) SHARED.documents.schedule(); return r; }
let DOCUMENTS = loadDocuments();
if(!DOCUMENTS){
  // One-time migration: promote any doc saved on an outside booking (from before this was
  // generalized beyond Outside Bookings) into its own DOCUMENTS record.
  DOCUMENTS = [];
  let legacyFound = false;
  OUTSIDE_BOOKINGS.forEach(b=>{
    if(b.doc){
      DOCUMENTS.push(Object.assign({id:'DOC-'+(DOCID++), subjectType:'outside', subjectId:b.id, title:`Document — ${b.performerName}`}, b.doc));
      delete b.doc;
      legacyFound = true;
    }
  });
  saveDocuments();
  if(legacyFound) saveOutsideBookings();
} else {
  DOCID = DOCUMENTS.reduce((max,d)=>{ const n=parseInt(String(d.id).split('-')[1],10); return isNaN(n)?max:Math.max(max,n+1); }, DOCID);
}
function getDocument(id){ return DOCUMENTS.find(d=>d.id===id); }

// Moved up from just after ADMIN_USERS (its original spot) so the Contract Builder block below
// -- which seeds its clause library from EVENT_TYPES at load time -- can reference it without a
// temporal-dead-zone error. Still declared once, still used everywhere else exactly as before.
const EVENT_TYPES = ['Wedding','Bar Mitzvah','Sheva Brachos','Concert','Melave Malka','Chinese Auction','Private Simcha','Other'];
const DRESS_CODES = ['Black tie','Formal — dark suit','Business casual','All black','Uniform provided by venue'];
const INTERNAL_EVENT_TYPES = ['Recording Day','Filming Day','Rehearsal','Studio Session','Unavailable','Other'];

/* ============ CONTRACT BUILDER (real-template, per-artist contracts) ============ */
// v2 -- replaces the earlier clause-library/brand-driven version with a small set of concrete
// templates (Standard / Comedian / Multiline) mirroring the real documents ASP's office sends,
// plus per-artist payee profiles.

/* ---- Payee profiles (contracting entity + payment details + defaults, per artist) ---- */
const PAYEE_PROFILES_LS_KEY = 'asp_mock_payee_profiles_v1';
let PPID = 1;
function loadPayeeProfiles(){ try{ const raw = localStorage.getItem(PAYEE_PROFILES_LS_KEY); if(raw) return JSON.parse(raw); }catch(e){} return null; }
function savePayeeProfiles(){ const r = persist(PAYEE_PROFILES_LS_KEY, PAYEE_PROFILES, 'payee profiles'); if(SHARED) SHARED.payee_profiles.schedule(); return r; }
function blankBoilerplateDefaults(){
  return { mechitza:false, mechitzaWithDancingOnly:false, noSecularSongs:false, noMixedDancing:false, weatherReturnsDeposit:false,
    postponementCreditsReschedule:false, runOfShowApproval:false, bandSoundLightingApproval:false, adsGraphicsApproval:false,
    mediaReleaseApproval:false, recordingPermission:false, acceptanceClause:false,
    noRecording:false, ipVideoClause:false, noWaitstaffWalkthrough:false, audienceSeatingClose:false,
    artistCancelsReturnsDeposit:false, notBindingUntilDeposit:false };
}
const BOILERPLATE_TOGGLES = [
  ['mechitza','Mechitza required at all events with dancing'],
  ['mechitzaWithDancingOnly','Performer only performs at events with a Mechitza + dancing'],
  ['noSecularSongs','Artist may refuse non-Jewish/secular songs'],
  ['noMixedDancing','Chassidish DJ — stops music if mixed dancing occurs'],
  ['weatherReturnsDeposit','Weather/travel cancellation returns the deposit'],
  ['postponementCreditsReschedule','Postponement credits deposit toward reschedule'],
  ['runOfShowApproval','Run of show must be approved by the Artist'],
  ['bandSoundLightingApproval','Band, sound, and lighting must be approved by Artist'],
  ['adsGraphicsApproval','All ads and graphics must be sent to and approved by Artist'],
  ['mediaReleaseApproval','Media/posters/flyers/photos with Artist\'s name or photo need Artist approval'],
  ['recordingPermission','Artist grants recording/livestream permission (50% revenue share if released)'],
  ['acceptanceClause','Acceptance clause (deposit payment = acceptance, signature optional)'],
  ['noRecording','No Recording Clause (comedian — prohibits audience recording)'],
  ['ipVideoClause','Short IP clause (no video without consent)'],
  ['noWaitstaffWalkthrough','No staff walkthroughs during the performance'],
  ['audienceSeatingClose','Audience seating must be close to the stage'],
  ['artistCancelsReturnsDeposit','If the Artist cancels, the deposit is returned in full'],
  ['notBindingUntilDeposit','This contract is not binding until the deposit is received'],
];
function seedPayeeProfiles(){
  const blArtist = ARTISTS.find(a=>/baruch levine/i.test(a.name||''));
  const emArtist = ARTISTS.find(a=>/eli marcus/i.test(a.name||''));
  const slArtist = ARTISTS.find(a=>/shmili landau/i.test(a.name||''));
  const mtArtist = ARTISTS.find(a=>/moshe tischler/i.test(a.name||''));
  const yrArtist = ARTISTS.find(a=>/yaakov rosenblum/i.test(a.name||''));
  const bfArtist = ARTISTS.find(a=>/benny friedman/i.test(a.name||''));
  return [
    { id:'PP-'+(PPID++), artistId:null, entityName:'ASP Management Services LLC',
      zelle:'billing@aspmgmt.com', checkPayee:'ASP Management Services', checkAddress:'1098 East 21st St, Brooklyn, NY 11210',
      wireBankName:'Chase Bank', wireBankAddress:'', wireAccountName:'ASP Management Services LLC', wireAccountNumber:'2909266806', wireRoutingNumber:'021000021', wireSwift:'', notes:'',
      defaultBoilerplate: blankBoilerplateDefaults(), defaultOvertimeInterval:'half_hour' },
    { id:'PP-'+(PPID++), artistId: blArtist ? blArtist.id : null, entityName:'Baruch Levine Music Inc.',
      zelle:'', checkPayee:'Baruch Levine Music Inc.', checkAddress:'',
      wireBankName:'TD Bank', wireBankAddress:'', wireAccountName:'Baruch Levine Music Inc.', wireAccountNumber:'', wireRoutingNumber:'', wireSwift:'',
      notes:'Client must provide Stage. Media/photo release requires Baruch Levine approval.',
      defaultBoilerplate: { ...blankBoilerplateDefaults(), mechitzaWithDancingOnly:true, noSecularSongs:true, weatherReturnsDeposit:true }, defaultOvertimeInterval:'half_hour' },
    { id:'PP-'+(PPID++), artistId: emArtist ? emArtist.id : null, entityName:'Eli Marcus',
      zelle:'elimarcusmusic@gmail.com', checkPayee:'Eli Marcus', checkAddress:'Brooklyn, NY',
      wireBankName:'', wireBankAddress:'', wireAccountName:'', wireAccountNumber:'', wireRoutingNumber:'', wireSwift:'', notes:'Payment plans: WhatsApp 929-392-6076.',
      defaultBoilerplate: { ...blankBoilerplateDefaults(), mechitza:true, noSecularSongs:true, weatherReturnsDeposit:true }, defaultOvertimeInterval:'half_hour' },
    { id:'PP-'+(PPID++), artistId: slArtist ? slArtist.id : null, entityName:'Tantz Vee A Yid LLC',
      zelle:'ShmiliLandauMusic@gmail.com', checkPayee:'Tantz Vee A Yid LLC', checkAddress:'4906 11th Ave, Brooklyn, NY 11219',
      wireBankName:'Chase Bank', wireBankAddress:'', wireAccountName:'Tantz Vee A Yid LLC', wireAccountNumber:'591669059', wireRoutingNumber:'021000021', wireSwift:'',
      notes:'For deposit via check, send a picture of front & back via WhatsApp to 929-392-6076.',
      defaultBoilerplate: { ...blankBoilerplateDefaults(), mechitza:true, noSecularSongs:true, noMixedDancing:true, weatherReturnsDeposit:true }, defaultOvertimeInterval:'15_min' },
    { id:'PP-'+(PPID++), artistId: null, entityName:'Airschnitz Productions LLC',
      zelle:'airschnitzprod@gmail.com', checkPayee:'Airschnitz Productions LLC', checkAddress:'50 Lawrence Ave, Lawrence, NY 11559',
      wireBankName:'Chase Bank', wireBankAddress:'2219 Broadway, New York, NY 10024', wireAccountName:'Airschnitz Productions LLC', wireAccountNumber:'611993269', wireRoutingNumber:'021000021', wireSwift:'',
      notes:'Shared payee entity used for Benny Friedman, Dovi Neuburger, and similar bookings.',
      defaultBoilerplate: { ...blankBoilerplateDefaults(), weatherReturnsDeposit:true, postponementCreditsReschedule:true }, defaultOvertimeInterval:'half_hour' },
    { id:'PP-'+(PPID++), artistId: mtArtist ? mtArtist.id : null, entityName:'Moshe Tischler Inc',
      zelle:'mtischlermusic@gmail.com', checkPayee:'Moshe Tischler Inc', checkAddress:'',
      wireBankName:'', wireBankAddress:'', wireAccountName:'', wireAccountNumber:'', wireRoutingNumber:'', wireSwift:'',
      notes:'For deposit via check, send a picture of the front & back via WhatsApp to 929-392-6076.',
      defaultBoilerplate: { ...blankBoilerplateDefaults(), bandSoundLightingApproval:true, mediaReleaseApproval:true, postponementCreditsReschedule:true, artistCancelsReturnsDeposit:true }, defaultOvertimeInterval:'half_hour' },
    { id:'PP-'+(PPID++), artistId: yrArtist ? yrArtist.id : null, entityName:'Airschnitz Productions LLC',
      zelle:'airschnitzprod@gmail.com', checkPayee:'Airschnitz Productions LLC', checkAddress:'50 Lawrence Ave, Lawrence, NY 11559',
      wireBankName:'Chase Bank', wireBankAddress:'2219 Broadway, New York, NY 10024', wireAccountName:'Airschnitz Productions LLC', wireAccountNumber:'611993269', wireRoutingNumber:'021000021', wireSwift:'', notes:'',
      defaultBoilerplate: { ...blankBoilerplateDefaults(), mechitza:true, noSecularSongs:true, weatherReturnsDeposit:true }, defaultOvertimeInterval:'half_hour',
      defaultCancellation: { type:'full_within_days', withinDays:40 } },
    { id:'PP-'+(PPID++), artistId: bfArtist ? bfArtist.id : null, entityName:'Airschnitz Productions LLC',
      zelle:'airschnitzprod@gmail.com', checkPayee:'Airschnitz Productions LLC', checkAddress:'50 Lawrence Ave, Lawrence, NY 11559',
      wireBankName:'Chase Bank', wireBankAddress:'2219 Broadway, New York, NY 10024', wireAccountName:'Airschnitz Productions LLC', wireAccountNumber:'611993269', wireRoutingNumber:'021000021', wireSwift:'', notes:'',
      defaultBoilerplate: blankBoilerplateDefaults(), defaultOvertimeInterval:'half_hour',
      defaultTravelClause: { flightsCount:1, flightsClass:'business', hotelRooms:1, hotelNights:1, hotelTier:'standard', food:false, shabbos:false, groundTransport:false } },
  ];
}
let PAYEE_PROFILES = loadPayeeProfiles();
// A browser with no stored profiles starts from the seed; the shared list replaces it on sign-in (never the reverse).
const PAYEE_PROFILES_FROM_SEED = !PAYEE_PROFILES;
if(!PAYEE_PROFILES){ PAYEE_PROFILES = seedPayeeProfiles(); savePayeeProfiles(); }
else { PPID = PAYEE_PROFILES.reduce((max,p)=>{ const n=parseInt(String(p.id).split('-')[1],10); return isNaN(n)?max:Math.max(max,n+1); }, PPID); }
// One-time-per-field backfill for already-stored profiles -- fills in real payment details that
// were seeded blank before the office-drive audit, and adds the artist profiles that were missing
// entirely (Moshe Tischler/Yaakov Rosenblum/Benny Friedman). Never overwrites a field someone
// already filled in or edited themselves -- only touches fields still at their blank/seed default.
function migratePayeeProfiles(){
  // Once this browser syncs the shared list, edits and deletes made there are final -- re-running the
  // backfill would resurrect deleted profiles and refill cleared fields for every admin.
  try{ if(localStorage.getItem('asp_sync_payee_profiles')) return; }catch(e){}
  let migrated = false;
  const airschnitz = PAYEE_PROFILES.find(p=>!p.artistId && /airschnitz/i.test(p.entityName||''));
  if(airschnitz){
    const fill = { zelle:'airschnitzprod@gmail.com', checkPayee:'Airschnitz Productions LLC', checkAddress:'50 Lawrence Ave, Lawrence, NY 11559',
      wireBankName:'Chase Bank', wireBankAddress:'2219 Broadway, New York, NY 10024', wireAccountName:'Airschnitz Productions LLC', wireAccountNumber:'611993269', wireRoutingNumber:'021000021' };
    Object.keys(fill).forEach(k=>{ if(!airschnitz[k]){ airschnitz[k] = fill[k]; migrated = true; } });
  }
  PAYEE_PROFILES.forEach(p=>{ if(p.wireBankAddress===undefined){ p.wireBankAddress = ''; migrated = true; } });
  // Zelle QR fields (ops automation spec item 5) -- additive, matches the versioned-migration
  // convention used everywhere else in this collection.
  PAYEE_PROFILES.forEach(p=>{
    if(p.zelleQrDataUrl===undefined){ p.zelleQrDataUrl = null; migrated = true; }
    if(p.zelleRecipientLabel===undefined){ p.zelleRecipientLabel = ''; migrated = true; }
    if(p.zelleInstructions===undefined){ p.zelleInstructions = ''; migrated = true; }
    if(p.zelleActive===undefined){ p.zelleActive = true; migrated = true; }
  });
  const mtArtist = ARTISTS.find(a=>/moshe tischler/i.test(a.name||''));
  if(mtArtist && !PAYEE_PROFILES.some(p=>p.artistId===mtArtist.id)){
    PAYEE_PROFILES.push({ id:'PP-'+(PPID++), artistId: mtArtist.id, entityName:'Moshe Tischler Inc',
      zelle:'mtischlermusic@gmail.com', checkPayee:'Moshe Tischler Inc', checkAddress:'',
      wireBankName:'', wireBankAddress:'', wireAccountName:'', wireAccountNumber:'', wireRoutingNumber:'', wireSwift:'',
      notes:'For deposit via check, send a picture of the front & back via WhatsApp to 929-392-6076.',
      defaultBoilerplate: { ...blankBoilerplateDefaults(), bandSoundLightingApproval:true, mediaReleaseApproval:true, postponementCreditsReschedule:true, artistCancelsReturnsDeposit:true }, defaultOvertimeInterval:'half_hour' });
    migrated = true;
  }
  const yrArtist = ARTISTS.find(a=>/yaakov rosenblum/i.test(a.name||''));
  if(yrArtist && !PAYEE_PROFILES.some(p=>p.artistId===yrArtist.id)){
    PAYEE_PROFILES.push({ id:'PP-'+(PPID++), artistId: yrArtist.id, entityName:'Airschnitz Productions LLC',
      zelle:'airschnitzprod@gmail.com', checkPayee:'Airschnitz Productions LLC', checkAddress:'50 Lawrence Ave, Lawrence, NY 11559',
      wireBankName:'Chase Bank', wireBankAddress:'2219 Broadway, New York, NY 10024', wireAccountName:'Airschnitz Productions LLC', wireAccountNumber:'611993269', wireRoutingNumber:'021000021', wireSwift:'', notes:'',
      defaultBoilerplate: { ...blankBoilerplateDefaults(), mechitza:true, noSecularSongs:true, weatherReturnsDeposit:true }, defaultOvertimeInterval:'half_hour',
      defaultCancellation: { type:'full_within_days', withinDays:40 } });
    migrated = true;
  }
  const bfArtist = ARTISTS.find(a=>/benny friedman/i.test(a.name||''));
  if(bfArtist && !PAYEE_PROFILES.some(p=>p.artistId===bfArtist.id)){
    PAYEE_PROFILES.push({ id:'PP-'+(PPID++), artistId: bfArtist.id, entityName:'Airschnitz Productions LLC',
      zelle:'airschnitzprod@gmail.com', checkPayee:'Airschnitz Productions LLC', checkAddress:'50 Lawrence Ave, Lawrence, NY 11559',
      wireBankName:'Chase Bank', wireBankAddress:'2219 Broadway, New York, NY 10024', wireAccountName:'Airschnitz Productions LLC', wireAccountNumber:'611993269', wireRoutingNumber:'021000021', wireSwift:'', notes:'',
      defaultBoilerplate: blankBoilerplateDefaults(), defaultOvertimeInterval:'half_hour',
      defaultTravelClause: { flightsCount:1, flightsClass:'business', hotelRooms:1, hotelNights:1, hotelTier:'standard', food:false, shabbos:false, groundTransport:false } });
    migrated = true;
  }
  // Standard pricing (PR 19, 2026-10-06) -- real 2026-27 contract/calendar fee data he supplied,
  // per artist. Each is the single clearest "standard" anchor figure from his notes (usually the
  // wedding rate -- Baruch and Dovie's primary booking type is "events," not weddings, so those
  // use their standard-event figure instead); the fuller range/context he gave goes in notes so
  // the office sees it's an approximation, not a quote. Never overwrites a defaultFee someone's
  // already set (0/undefined only) -- same "only touch the still-blank seed default" rule as the
  // rest of this migration.
  const STANDARD_PRICING = {
    benny:  { fee:12000, note:'Standard pricing (2026-10-06): wedding $12,000 (range $10-13k, $15k+ with extras). Bar mitzvah $12,000. Events/concerts vary widely ($12k dinner up to $25-40k big shows), no standard.' },
    moshe:  { fee:7500,  note:'Standard pricing (2026-10-06): wedding $7,500 (very consistent; $7k for repeat/mezumen clients). Events vary, no standard.' },
    eli:    { fee:6000,  note:'Standard pricing (2026-10-06): wedding $6,000 ($5.5k mezumen, $6.5k common upper end). Out-of-town wedding $8,000 + travel. Events $10-18k, no standard.' },
    yaakov: { fee:4500,  note:'Standard pricing (2026-10-06): wedding $4,500 ($4k for mezumen or with Manavich/Kunstler). Bar mitzvah $4,000. Out-of-town ~$6,000 + flights/hotel.' },
    shmili: { fee:6000,  note:'Standard pricing (2026-10-06): full wedding $6,000. Third dance/short set $3,500. Bar mitzvah/events $3,500-5,000. Out-of-town/camps $4-6k + travel.' },
    dovie:  { fee:6000,  note:'Standard pricing (2026-10-06): standard event $6,000 (recent bookings trending $6,500-8,000). Schools/camps/corporate $5-10k. Big shows $12k+, no standard.' },
    baruch: { fee:10000, note:'Standard pricing (2026-10-06): standard dinner/event $8,000-10,000 ($10k most common). Smaller events $4,000-7,700. Wedding/chuppah $4,500-5,500. Big weekends $11-26k, no standard.' },
  };
  PAYEE_PROFILES.forEach(p=>{
    const row = p.artistId && STANDARD_PRICING[p.artistId];
    if(!row) return;
    if(!p.defaultFee){ p.defaultFee = row.fee; migrated = true; }
    if(!p.notes || !p.notes.includes('Standard pricing (2026-10-06)')){
      p.notes = p.notes ? `${p.notes}\n\n${row.note}` : row.note;
      migrated = true;
    }
  });
  // Deposit: he gave one office-wide figure ($2,000 flat, not a per-artist percent), so it lives
  // on the house profile once -- doCreateContractFromLead() falls back to it for any artist that
  // doesn't have its own deposit default set.
  const house = PAYEE_PROFILES.find(p=>!p.artistId);
  if(house && !house.defaultDepositAmount){
    house.defaultDepositAmount = 2000;
    const depositNote = 'Standard pricing (2026-10-06): deposit typically $2,000 flat (mezumen-type weddings run roughly $500 lower on the total fee).';
    if(!house.notes || !house.notes.includes(depositNote)) house.notes = house.notes ? `${house.notes}\n\n${depositNote}` : depositNote;
    migrated = true;
  }
  if(migrated) savePayeeProfiles();
}
migratePayeeProfiles();
function getPayeeProfile(id){ return PAYEE_PROFILES.find(p=>p.id===id); }
// A contract that has gone out (sent/signed) shows the payee details it was sent with, frozen at
// that moment -- editing or deleting the payee profile later must not rewrite what the client
// received (2026-10-09 audit 2.10). Drafts follow the live profile.
function freezeContractPayee(c){ if(!c.payeeSnapshot){ const pp = getPayeeProfile(c.payeeProfileId); if(pp) c.payeeSnapshot = JSON.parse(JSON.stringify(pp)); } }
function contractPayeeProfile(c, fallback){ return (c.status!=='draft' && c.payeeSnapshot) || getPayeeProfile(c.payeeProfileId) || (fallback ? fallback() : null); }
function housePayeeProfile(){ return PAYEE_PROFILES.find(p=>!p.artistId) || PAYEE_PROFILES[0]; }
function defaultPayeeProfileForArtist(artistId){ return PAYEE_PROFILES.find(p=>p.artistId===artistId) || housePayeeProfile(); }

/* ---- Templates ---- */
const CONTRACT_TEMPLATES = [
  ['standard','Standard Artist Agreement'],
  ['comedian','Comedian Agreement'],
  ['multiline','Multi-Performer / Package Agreement'],
  ['creative','Creative/Video Production Agreement'],
];
// A wedding with one artist is always the Standard Artist Agreement (owner 2026-10-13), so creating
// its contract skips the template picker. Anything else (other types, extra performers) still asks.
function obviousTemplateFor(ev){
  return ev && ev.type==='Wedding' && ev.artistId && !(ev.additionalArtists||[]).length ? 'standard' : null;
}
// The one entry point for "make a contract for this gig": straight to the builder when the
// template is obvious, otherwise the picker.
function startContractForLead(id){
  const template = obviousTemplateFor(getEvent(id));
  if(template){ doCreateContractFromLead(id, template); return; }
  S.showTemplatePicker = true; S.templatePickerLeadId = id; render();
}
function contractTemplateLabel(t){ const m = CONTRACT_TEMPLATES.find(([k])=>k===t); return m ? m[1] : t; }

/* ---- Contracts (persisted, per-lead, versioned) ---- */
const CONTRACTS_LS_KEY = 'asp_mock_contracts_v1';
const CONTRACTS_SCHEMA_VERSION = 3;
let CTID = 1;
function loadContracts(){ try{ const raw = localStorage.getItem(CONTRACTS_LS_KEY); if(raw) return JSON.parse(raw); }catch(e){} return null; }
function saveContracts(){ const r = persist(CONTRACTS_LS_KEY, CONTRACTS, 'contracts'); if(SHARED) SHARED.contracts.schedule(); return r; }
// Additive-defaults migration, same convention as loadProjects() -- a versioned pass so future
// field additions never drop an already-saved contract. A v1 record (the clause-library shape
// shipped briefly this morning) has its old clauses/freeText folded into one customClauses entry
// so nothing already saved is silently dropped, then is brought up to the current v2 shape.
// A version snapshot is the contract as sent -- WITHOUT its own version history. Copying c whole
// nested every earlier version (and its HTML) inside each new one, doubling the record per send
// until storage filled up (2026-10-09 audit 3.3).
function contractVersionSnapshot(c){
  const { versions, _supabaseId, _migratedAt, ...terms } = c;
  return JSON.parse(JSON.stringify(terms));
}
function migrateContract(c){
  let migrated = false;
  (c.versions||[]).forEach(v=>{ if(v.snapshot && (v.snapshot.versions || v.snapshot._supabaseId || v.snapshot._migratedAt)){ delete v.snapshot.versions; delete v.snapshot._supabaseId; delete v.snapshot._migratedAt; migrated = true; } });
  if(c.schemaVersion === 1){
    const oldBits = [];
    (c.clauses||[]).forEach(cl=>{ if(cl.bodyText) oldBits.push(`${cl.title||'Clause'}: ${cl.bodyText}`); });
    (c.freeText||[]).forEach(f=>{ if(f.body) oldBits.push(`${f.title||'Note'}: ${f.body}`); });
    const folded = oldBits.length ? [{ id:'CC-'+Math.random().toString(36).slice(2,7), title:'Carried Over From Draft', body: oldBits.join('\n\n') }] : [];
    delete c.clauses; delete c.freeText; delete c.artists; delete c.brandId;
    const total = c.payment ? (Number(c.payment.total)||0) : (c.snapshot && c.snapshot.price) || 0;
    c.template = 'standard';
    c.performerArtistId = null; c.performerLabel = '';
    c.payeeProfileId = housePayeeProfile() ? housePayeeProfile().id : null;
    c.fee = { amount: total, note:'' };
    c.deposit = { amount:0, percent:0, nonRefundable:false };
    c.overtime = { rate:0, interval:'half_hour' };
    c.cancellationPolicy = { type:'flat_percent', flatPercent:80, tiers:[], creditWindowMonths:0 };
    c.boilerplate = blankBoilerplateDefaults();
    c.clientProvides = [];
    c.lineItems = []; c.addOns = [];
    c.customClauses = folded;
    c.notes = '';
    c.schemaVersion = 2;
    migrated = true;
  }
  if(c.schemaVersion === undefined){ c.schemaVersion = CONTRACTS_SCHEMA_VERSION; migrated = true; }
  if(!c.template){ c.template = 'standard'; migrated = true; }
  if(c.performerArtistId===undefined){ c.performerArtistId = null; migrated = true; }
  if(c.performerLabel===undefined){ c.performerLabel = ''; migrated = true; }
  if(!c.payeeProfileId){ c.payeeProfileId = housePayeeProfile() ? housePayeeProfile().id : null; migrated = true; }
  if(!c.fee){ c.fee = { amount:0, note:'' }; migrated = true; }
  if(!c.deposit){ c.deposit = { amount:0, percent:0, nonRefundable:false }; migrated = true; }
  if(!c.overtime){ c.overtime = { rate:0, interval:'half_hour' }; migrated = true; }
  // A rate already on a contract was typed or agreed: keep it. Only an empty one is auto (2026-10-12).
  if(c.overtime.manual===undefined){ c.overtime.manual = !!Number(c.overtime.rate); migrated = true; }
  if(!c.cancellationPolicy){ c.cancellationPolicy = { type:'flat_percent', flatPercent:80, tiers:[], creditWindowMonths:0 }; migrated = true; }
  if(!c.boilerplate){ c.boilerplate = blankBoilerplateDefaults(); migrated = true; }
  if(!c.clientProvides){ c.clientProvides = []; migrated = true; }
  if(!c.lineItems){ c.lineItems = []; migrated = true; }
  if(!c.addOns){ c.addOns = []; migrated = true; }
  if(!c.customClauses){ c.customClauses = []; migrated = true; }
  if(c.notes===undefined){ c.notes = ''; migrated = true; }
  if(!c.snapshot){ c.snapshot = {}; migrated = true; }
  if(c.status===undefined){ c.status = 'draft'; migrated = true; }
  if(c.signedAt===undefined){ c.signedAt = null; migrated = true; }
  if(c.qboInvoiceId===undefined){ c.qboInvoiceId = null; migrated = true; }
  if(c.qboInvoiceDocNumber===undefined){ c.qboInvoiceDocNumber = null; migrated = true; }
  if(c.calendarHoldsStatus===undefined){ c.calendarHoldsStatus = null; migrated = true; }
  // Durable booking record architecture (PR 5): an explicit admin approval gate before a contract
  // can be sent -- "money/term changes need approval before outbound comms" -- plus a local mirror
  // of Supabase's contract_versions (0010), written on every real send so there's an immutable
  // record of what was actually emailed, even for contracts never migrated to a real Supabase row.
  if(c.approvedBy===undefined){ c.approvedBy = null; migrated = true; }
  if(c.approvedAt===undefined){ c.approvedAt = null; migrated = true; }
  if(!c.versions){ c.versions = []; migrated = true; }
  // ---- v3 additions (office-drive audit against real contracts) ----
  if(c.snapshot.clientPhone===undefined){ c.snapshot.clientPhone = ''; migrated = true; }
  if(c.snapshot.eventName===undefined){ c.snapshot.eventName = ''; migrated = true; }
  if(c.hoursOfEngagement===undefined){ c.hoursOfEngagement = '5 hours'; migrated = true; }
  if(c.balanceDueTiming===undefined){ c.balanceDueTiming = 'prior'; migrated = true; }
  if(c.artistProvides===undefined){ c.artistProvides = ''; migrated = true; }
  if(!c.travelClause){ c.travelClause = blankTravelClause(); migrated = true; }
  if(!c.discount){ c.discount = { originalPrice:0, label:'repeat customer price' }; migrated = true; }
  if(c.performanceDuration===undefined){ c.performanceDuration = ''; migrated = true; }
  if(c.performanceType===undefined){ c.performanceType = ''; migrated = true; }
  if(c.additionalExpenses===undefined){ c.additionalExpenses = 'N/A'; migrated = true; }
  if(!c.barter){ c.barter = { label:'', description:'' }; migrated = true; }
  if(!c.creative){ c.creative = { projectName:'', filmingDays:3, revisionRounds:'one consolidated revision round following the first cut' }; migrated = true; }
  if(c.brand===undefined){ c.brand = 'asp'; migrated = true; }
  if(c.bsdHeader===undefined){ c.bsdHeader = true; migrated = true; }
  if(c.cancellationPolicy.withinDays===undefined){ c.cancellationPolicy.withinDays = 40; migrated = true; }
  if(c.boilerplate.adsRequireApproval!==undefined){
    if(c.boilerplate.adsRequireApproval){
      c.boilerplate.runOfShowApproval = true;
      c.boilerplate.bandSoundLightingApproval = true;
      c.boilerplate.adsGraphicsApproval = true;
      c.boilerplate.mediaReleaseApproval = true;
    }
    delete c.boilerplate.adsRequireApproval;
    migrated = true;
  }
  (c.lineItems||[]).forEach(li=>{
    if(li.notes===undefined){ li.notes = ''; migrated = true; }
    if(!li.travelClause){ li.travelClause = blankTravelClause(); migrated = true; }
  });
  return migrated;
}
let CONTRACTS = loadContracts();
if(!CONTRACTS){ CONTRACTS = []; }
else {
  let anyMigrated = false;
  CONTRACTS.forEach(c=>{ if(migrateContract(c)) anyMigrated = true; });
  if(anyMigrated) saveContracts();
  CTID = CONTRACTS.reduce((max,c)=>{ const n=parseInt(String(c.id).split('-')[1],10); return isNaN(n)?max:Math.max(max,n+1); }, CTID);
}
function getContract(id){ return CONTRACTS.find(c=>c.id===id); }
function contractsForLead(leadId){ return CONTRACTS.filter(c=>c.leadId===leadId).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)); }
// Flat shape (not nested sub-objects) so it addresses cleanly through the generic
// setContractFieldByPath path scheme, both top-level (c.travelClause) and per-line-item.
// Travel goes on a contract only when the gig needs a flight (owner 2026-10-14), and then it is a
// business-class flight and a hotel. Never from the artist's profile, which put travel on local gigs.
function gigTravelClause(ev){
  return ev && ev.flightNeeded ? { ...blankTravelClause(), flightsCount:1, flightsClass:'business', hotelRooms:1 } : blankTravelClause();
}
function blankTravelClause(){
  return { flightsCount:0, flightsClass:'economy', hotelRooms:0, hotelNights:0, hotelTier:'standard', food:false, shabbos:false, groundTransport:false };
}
const CONTRACT_STATUSES = [['draft','Draft'], ['sent','Sent'], ['signed','Signed'], ['void','Void']];
function contractStatusLabel(s){ const m = CONTRACT_STATUSES.find(([k])=>k===s); return m ? m[1] : s; }
function contractStatusPillClass(s){ return s==='signed' ? 'pill-good' : s==='sent' ? 'pill-accent' : s==='void' ? 'pill-crit' : 'pill-neutral'; }

/* ---- Naming, math, prose ---- */
function contractPerformerName(c){
  if(c.performerArtistId){ const a = artistById(c.performerArtistId); if(a) return a.name; }
  return c.performerLabel || 'the Artist';
}
const OVERTIME_INTERVAL_LABELS = { half_hour:'half hour', '15_min':'15 minutes', hour:'hour', not_applicable:'N/A' };
function overtimeIntervalLabel(interval){ return OVERTIME_INTERVAL_LABELS[interval] || 'half hour'; }
// Standing rule confirmed with Moshe: $6,500 fee -> $650 per half hour, i.e. fee/10.
// Overtime (owner decision 2026-10-12, replacing $250 / 1.5x / fee-10 -- audit 2.9): each extra half
// hour costs a full pro-rated hour, fee / booked hours, scaled to the contract's interval
// (15 min = half that, an hour = double). Filled in automatically and kept in step with the fee,
// hours and interval until someone types a rate (c.overtime.manual); clearing it goes back to auto.
const OVERTIME_HALF_HOURS_PER_INTERVAL = { half_hour:1, '15_min':0.5, hour:2 };
function hoursFromText(text){ const m = String(text||'').match(/\d+(\.\d+)?/); return m ? Number(m[0]) : 0; }
function suggestedOvertimeRate(fee, hoursText, interval){
  const hours = hoursFromText(hoursText), factor = OVERTIME_HALF_HOURS_PER_INTERVAL[interval||'half_hour'];
  return hours && factor ? Math.round((Number(fee)||0) / hours * factor) : 0;
}
function refreshAutoOvertime(c){
  if(!c.overtime || c.overtime.manual || c.overtime.interval==='not_applicable') return;
  c.overtime.rate = suggestedOvertimeRate(c.fee && c.fee.amount, c.hoursOfEngagement, c.overtime.interval);
}
// The contract's overtime sentence, the same on every template that has a booked duration.
function contractOvertimeHtml(c){
  if(c.overtime.interval==='not_applicable') return `<p style="font-size:12.5px;margin:4px 0 0;">Overtime: Not applicable.</p>`;
  if(!Number(c.overtime.rate)) return '';
  return `<p style="font-size:12.5px;margin:4px 0 0;">If the Artist is asked to stay beyond the agreed upon time, a ${money(Number(c.overtime.rate))} per ${esc(overtimeIntervalLabel(c.overtime.interval))} charge shall be paid in overtime fees.</p>`;
}
// "plus 1 business-class flight, hotel, food, and Shabbos accommodation" -- real-contract phrasing
// (Chabad of Bondi / Toronto examples), appended after the fee. Returns '' when nothing is set.
function contractTravelSentence(tc){
  if(!tc) return '';
  const parts = [];
  if(tc.flightsCount>0){
    const classLabel = tc.flightsClass==='first' ? 'First Class' : tc.flightsClass==='business' ? 'Business Class' : 'Economy Class';
    parts.push(tc.flightsCount>1 ? `${tc.flightsCount} ${classLabel} flights` : `${classLabel} flight`);
  }
  if(tc.hotelRooms>0 || tc.hotelNights>0) parts.push('Hotel');
  if(tc.food) parts.push('Food');
  if(tc.shabbos) parts.push('Shabbos accommodation');
  if(tc.groundTransport) parts.push('ground transportation');
  if(!parts.length) return '';
  const joined = parts.length>1 ? parts.slice(0,-1).join(', ') + ' and ' + parts[parts.length-1] : parts[0];
  return `plus ${joined}`;
}
// Struck-through original price + the actual (discounted) fee + label, e.g. for a repeat customer.
function contractFeeDisplayHtml(c, figures){
  const d = c.discount || {};
  if(!d.originalPrice || d.originalPrice<=figures.total) return money(figures.total);
  return `<s style="opacity:.55;">${money(d.originalPrice)}</s> ${money(figures.total)}${d.label?` (${esc(d.label)})`:''}`;
}
// fee.amount is the single source of truth on standard/comedian; on multiline it is kept in sync
// with lineItems+addOns by the CRUD actions below but remains a normal editable field, matching
// how the real package contracts (Stein, Greenwald) state one explicit total.
function contractLineItemsTotal(c){ return (c.lineItems||[]).reduce((sum,li)=>sum+(Number(li.fee)||0), 0) + (c.addOns||[]).reduce((sum,a)=>sum+(Number(a.amount)||0), 0); }
function contractPaymentFigures(c){
  const total = Number(c.fee.amount)||0;
  let deposit = Number(c.deposit.amount)||0;
  // Number(): the builder stores input values as strings, and "0" is truthy -- it means "use the $ amount".
  if(Number(c.deposit.percent) > 0){ deposit = Math.round(total * Number(c.deposit.percent) / 100); }
  const balance = Math.max(0, total - deposit);
  return { total, deposit, balance };
}
function ordinal(n){
  n = Number(n)||0;
  const s = ['th','st','nd','rd'], v = n % 100;
  return n + (s[(v-20)%10] || s[v] || s[0]);
}
function contractDateSentence(c){
  const d = c.snapshot.eventDate ? new Date(c.snapshot.eventDate+'T00:00:00') : null;
  const today = new Date();
  const day = ordinal(today.getDate());
  const month = today.toLocaleString('en-US', { month:'long' });
  const year = today.getFullYear();
  return `This contractual agreement is made this ${day} day of the month of ${month} ${year}`;
}
function contractCancellationText(c){
  const p = c.cancellationPolicy || {};
  if(p.type==='credit_future'){
    // Dovi's own wording (owner 2026-10-26, from his signed contracts).
    const m = p.creditWindowMonths||6;
    return `Cancellation Clause: In the event of cancellation for any reason, the Client agrees to pay 80% of the contracted amount. This is due to the fact that we reserve the event date(s) exclusively and turn down other potential bookings for that period. However, we are happy to apply the full amount paid toward a future event scheduled within the next ${m} to ${m+2} months from the original event date, subject to availability and mutual agreement.`;
  }
  if(p.type==='credit_reschedule'){
    return 'In the event of cancellation or postponement, the Artist will use the deposit towards the rescheduled date (pending availability).';
  }
  if(p.type==='full_within_days'){
    return `Should the Artist be canceled within ${p.withinDays||40} days prior to the event, full payment is required.`;
  }
  if(p.type==='tiered'){
    const lines = (p.tiers||[]).map(t=>`If the Client cancels within ${t.withinDays} days of the event date, the Client agrees to pay ${t.percent}% of the total contracted amount, inclusive of any deposit already paid.`);
    return `In the event of cancellation by the Client, the following terms shall apply: ${lines.join(' ')} All cancellations must be submitted in writing and are not effective until acknowledged in writing. Amounts owed are due within fourteen days of the cancellation notice.`;
  }
  return `The Client understands that this is a binding contract and that upon acceptance, the Artist will not accept any conflicting engagements for this day. Therefore, if the Client cancels, the Client agrees to pay ${p.flatPercent||80}% of the payment.`;
}
function contractBoilerplateLines(c){
  const b = c.boilerplate || {}, who = contractPerformerName(c);
  const lines = [];
  if(b.mechitzaWithDancingOnly) lines.push(`${who} only performs at events where there is a Mechitza with dancing.`);
  else if(b.mechitza) lines.push(`A Mechitza is required at all events with dancing.`);
  if(b.noSecularSongs) lines.push('The Artist may refuse to sing any non-Jewish or secular songs at his discretion.');
  if(b.noMixedDancing) lines.push(`As a Chassidish DJ, ${who} does not perform at events with mixed dancing. If mixed dancing occurs, the music will stop immediately.`);
  if(b.weatherReturnsDeposit) lines.push('If the event is cancelled due to weather or travel issues, the Artist agrees to return the deposit.');
  if(b.postponementCreditsReschedule) lines.push('If the event is postponed, the deposit will be credited toward a mutually agreed rescheduled date.');
  if(b.runOfShowApproval) lines.push('The run of show must be approved by the Artist prior to the event.');
  if(b.bandSoundLightingApproval) lines.push('Band, sound, and lighting must be approved by Artist.');
  if(b.adsGraphicsApproval) lines.push('All ads and graphics must be sent to and approved by Artist.');
  if(b.mediaReleaseApproval) lines.push('Any media, posters, flyers, photos etc. with the Artist\'s name and/or photo may only be released with approval from the Artist.');
  if(b.recordingPermission) lines.push('The Artist grants the organizers of the event full permission to record and/or livestream the performance. The Artist retains full and sole discretion over release of any such recording, and, if released, is entitled to fifty percent (50%) of any revenue generated.');
  if(b.noWaitstaffWalkthrough) lines.push('There shall be no staff walkthroughs or crossing in front of the stage during the performance.');
  if(b.audienceSeatingClose) lines.push('Audience seating must be arranged close to the stage for the performance.');
  if(b.artistCancelsReturnsDeposit) lines.push('In the event of cancellation on behalf of the Artist, the deposit will be returned in full.');
  if(b.notBindingUntilDeposit) lines.push('This contract is not binding until the deposit is received.');
  return lines;
}
function contractAcceptanceText(c){
  return `Acceptance. Payment of the deposit constitutes the Client's acceptance of this agreement and of all terms set forth herein, with the same effect as a signature. The date is not held until the deposit is received.`;
}
function contractBalanceDueText(c, figures){
  const timing = c.balanceDueTiming==='at_event' ? 'at the event' : c.balanceDueTiming==='on_completion' ? 'when the project is complete' : 'prior to the engagement';
  return `The remaining balance of ${money(figures.balance)} shall be paid ${timing}.`;
}
function contractClientContactLine(c){
  const parts = [];
  if(c.snapshot.clientName) parts.push(c.snapshot.clientName);
  if(c.snapshot.clientEmail) parts.push(c.snapshot.clientEmail);
  if(c.snapshot.clientPhone) parts.push(c.snapshot.clientPhone);
  return parts.length>1 ? `Client contact: ${parts.join(' - ')}` : '';
}
function contractIpClauseText(){
  return 'Videos of the performance may not be taken and/or disseminated in any way without the express consent of the performer.';
}
function contractNoRecordingText(){
  // Dovi's own wording (owner 2026-10-26, from his signed contracts).
  return 'No Recording Clause. The Artist strictly prohibits any form of video or audio recording of the performance, including but not limited to filming, live streaming, or posting on social media, without prior written consent. The Venue and Client shall ensure that all attendees, staff, and third parties comply with this restriction. Any unauthorized recording constitutes a material breach of this Agreement and may result in immediate termination of the performance without refund, and the Artist reserves the right to pursue legal remedies.';
}

/* ---- Contract CRUD (direct-mutate + autosave, same convention as project board cards/tasks) ---- */
function defaultArtistProvides(template, performerName, role, hours){
  if(template==='comedian') return `Live comedy show by ${performerName}`;
  return `Vocal performance for up to ${hours}`;
}
function airschnitzPayeeProfile(){ return PAYEE_PROFILES.find(p=>/airschnitz/i.test(p.entityName||'')) || housePayeeProfile(); }
function doCreateContractFromLead(eventId, template){
  const ev = getEvent(eventId); if(!ev) return;
  const now = new Date().toISOString();
  const performerArtistId = ev.artistId || null;
  const performerArtist = performerArtistId ? artistById(performerArtistId) : null;
  const payeeProfile = template==='creative' ? airschnitzPayeeProfile()
    : performerArtistId ? defaultPayeeProfileForArtist(performerArtistId) : housePayeeProfile();
  // His ask (2026-10-06): the fee shouldn't just be whatever ev.price happens to be (often 0 --
  // not every lead has a negotiated price yet) -- it should prefill from each artist's own
  // standard rate, like hours/overtime/cancellation already do via the payee profile. ev.price
  // still wins when it's a real known figure (never override an actual negotiated price with a
  // generic default); the payee profile's defaultFee/defaultHours/defaultDeposit* are opt-in per
  // artist (Settings -> Payee Profiles) -- populated from his real 2026-27 pricing data, never
  // invented here. Deposit is usually a flat amount, not a %, across the roster (he gave one
  // number -- $2,000 -- not a per-artist percent), so percent only wins when someone's actually
  // set one for that artist; otherwise fall back to the artist's own flat amount, then the house
  // profile's (the office-wide $2,000 figure lives there, not duplicated onto every artist).
  const hours = (payeeProfile && payeeProfile.defaultHours) || '5 hours';
  const houseDepositAmount = housePayeeProfile().defaultDepositAmount || 0;
  const depositPercent = (payeeProfile && payeeProfile.defaultDepositPercent) || 0;
  const depositAmount = (payeeProfile && payeeProfile.defaultDepositAmount) || houseDepositAmount || 0;
  const contract = {
    id:'CT-'+(CTID++), schemaVersion: CONTRACTS_SCHEMA_VERSION, leadId: ev.id, template: template||'standard', status:'draft',
    createdAt: now, updatedAt: now,
    snapshot: { clientName: ev.clientName||'', clientEmail: ev.clientEmail||'', clientPhone: ev.clientPhone||'', eventName:'', eventDate: ev.date||'', venue: ev.venue||'', address: ev.address||'', city: ev.city||'', state: ev.state||'', occasion: ev.type||'' },
    performerArtistId, performerLabel:'',
    payeeProfileId: payeeProfile ? payeeProfile.id : null,
    fee: { amount: ev.price || (payeeProfile && payeeProfile.defaultFee) || 0, note:'' },
    deposit: depositPercent ? { amount:0, percent:depositPercent, nonRefundable:false }
      : depositAmount ? { amount:depositAmount, percent:0, nonRefundable:false }
      : { amount:0, percent:15, nonRefundable:false },
    overtime: { rate:0, interval: payeeProfile ? payeeProfile.defaultOvertimeInterval : 'half_hour', manual:false },
    cancellationPolicy: { type:'flat_percent', flatPercent:80, tiers:[], creditWindowMonths:6, withinDays:40, ...(payeeProfile&&payeeProfile.defaultCancellation||{}) },
    boilerplate: payeeProfile ? { ...payeeProfile.defaultBoilerplate, notBindingUntilDeposit:true } : { ...blankBoilerplateDefaults(), notBindingUntilDeposit:true },
    clientProvides: [],
    lineItems: [], addOns: [],
    customClauses: [],
    notes: '',
    hoursOfEngagement: hours,
    balanceDueTiming: 'prior',
    artistProvides: defaultArtistProvides(template, performerArtist?performerArtist.name:'the Artist', performerArtist?performerArtist.role:'Singer', hours),
    travelClause: gigTravelClause(ev),
    discount: { originalPrice:0, label:'repeat customer price' },
    performanceDuration: '',
    performanceType: template==='comedian' ? `Live comedy show by ${performerArtist?performerArtist.name:'the Artist'}` : '',
    additionalExpenses: 'N/A',
    barter: { label:'', description:'' },
    creative: { projectName:'', filmingDays:3, revisionRounds:'one consolidated revision round following the first cut' },
    brand: 'asp',
    bsdHeader: true,
  };
  if(template==='comedian'){
    // As in Dovi's contracts (owner 2026-10-26): a non-refundable deposit, mic + spotlight, 45 min - 1 hour.
    // The deposit %, his other terms and where it's paid come from his payee profile (PP for 'dovie').
    contract.deposit.nonRefundable = true;
    if(!contract.clientProvides.length) contract.clientProvides = ['Appropriate Venue & Sound System', 'Wired Microphone & Spotlight'];
    contract.performanceDuration = '45 min – 1 hour';
    contract.boilerplate.acceptanceClause = true;
    contract.boilerplate.noRecording = true;
    contract.cancellationPolicy = { type:'credit_future', flatPercent:80, tiers:[], creditWindowMonths:6, withinDays:40 };
  } else if(template==='creative'){
    contract.boilerplate = { notBindingUntilDeposit:true };
    contract.balanceDueTiming = 'on_completion';
    contract.deposit = { amount:0, percent:0, nonRefundable:false };
    contract.cancellationPolicy = { type:'credit_reschedule', flatPercent:80, tiers:[], creditWindowMonths:6, withinDays:40 };
  } else {
    contract.boilerplate.acceptanceClause = true;
    contract.deposit = { amount:0, percent:15, nonRefundable:true }; // the office's deposit (owner 2026-10-14)
  }
  if(template==='multiline'){
    contract.deposit = { amount:0, percent:0, nonRefundable:false };
    contract.cancellationPolicy = { type:'tiered', flatPercent:80, tiers:[
      { id:'TR-1', withinDays:60, percent:0 }, { id:'TR-2', withinDays:30, percent:80 }, { id:'TR-3', withinDays:0, percent:100 },
    ], creditWindowMonths:0, withinDays:40 };
    // New Artist Event workflow (item 2, "select one or more ASP artists"): a multi-artist lead
    // already carries its full roster on ev.additionalArtists -- pre-fill one line item per artist
    // (primary + additional) instead of leaving the editor empty, since the data already exists.
    if((ev.additionalArtists||[]).length){
      contract.lineItems = [
        { id:'LI-'+Math.random().toString(36).slice(2,7), label: performerArtist?performerArtist.name:'', performerArtistId, fee: ev.price || (payeeProfile && payeeProfile.defaultFee) || 0, date:'', overtimeRate:'', notes:'', travelClause: blankTravelClause() },
        ...ev.additionalArtists.map(x=>{
          const a = artistById(x.artistId);
          return { id:'LI-'+Math.random().toString(36).slice(2,7), label: a?a.name:x.artistId, performerArtistId: x.artistId, fee: x.feeAmount||0, date:'', overtimeRate:'', notes:'', travelClause: blankTravelClause() };
        }),
      ];
      contract.fee.amount = contractLineItemsTotal(contract);
    }
  }
  refreshAutoOvertime(contract);
  CONTRACTS.unshift(contract); saveContracts();
  S.showContractBuilder = true; S.contractBuilderId = contract.id;
  render();
}
function doRefreshContractFromLead(id){
  const c = getContract(id); if(!c) return;
  const ev = getEvent(c.leadId); if(!ev){ toast('The original lead no longer exists.', 'system'); return; }
  c.snapshot = { clientName: ev.clientName||'', clientEmail: ev.clientEmail||'', clientPhone: ev.clientPhone||'', eventName: c.snapshot.eventName||'', eventDate: ev.date||'', venue: ev.venue||'', address: ev.address||'', city: ev.city||'', state: ev.state||'', occasion: c.snapshot.occasion || ev.type||'' };
  // The lead's negotiated price wins; otherwise keep the fee already on the contract (typed or prefilled); the profile default only fills a blank.
  if(c.template!=='multiline'){ const profile = getPayeeProfile(c.payeeProfileId); c.fee.amount = ev.price || Number(c.fee.amount) || (profile && profile.defaultFee) || 0; }
  refreshAutoOvertime(c);
  c.updatedAt = new Date().toISOString();
  saveContracts();
  toast('Refreshed from lead.', 'success');
  render();
}
function doDeleteContract(id){
  if(!confirm('Delete this contract? This can’t be undone.')) return;
  const gone = getContract(id); if(gone) revokeOpenSignLinks(gone);
  CONTRACTS = CONTRACTS.filter(c=>c.id!==id);
  saveContracts();
  S.showContractBuilder=false; S.contractBuilderId=null;
  toast('Contract deleted.', 'system');
  render();
}
function doSetContractPerformer(contractId, artistId){
  const c = getContract(contractId); if(!c) return;
  c.performerArtistId = artistId || null;
  const artist = artistId ? artistById(artistId) : null;
  const profile = artistId ? defaultPayeeProfileForArtist(artistId) : housePayeeProfile();
  if(profile){
    c.payeeProfileId = profile.id;
    c.boilerplate = { ...c.boilerplate, ...profile.defaultBoilerplate };
    c.overtime.interval = profile.defaultOvertimeInterval;
    refreshAutoOvertime(c);
    if(profile.defaultCancellation) c.cancellationPolicy = { ...c.cancellationPolicy, ...profile.defaultCancellation };
  }
  c.artistProvides = defaultArtistProvides(c.template, artist?artist.name:'the Artist', artist?artist.role:'Singer', c.hoursOfEngagement||'5 hours');
  if(c.template==='comedian') c.performanceType = `Live comedy show by ${artist?artist.name:'the Artist'}`;
  c.updatedAt = new Date().toISOString(); saveContracts(); render();
}
function doAddLineItem(contractId){
  const c = getContract(contractId); if(!c) return;
  c.lineItems.push({ id:'LI-'+Math.random().toString(36).slice(2,7), label:'', performerArtistId:null, fee:0, date:'', overtimeRate:'', notes:'', travelClause: blankTravelClause() });
  c.updatedAt = new Date().toISOString(); saveContracts(); render();
}
function doRemoveLineItem(contractId, liId){
  const c = getContract(contractId); if(!c) return;
  c.lineItems = c.lineItems.filter(li=>li.id!==liId);
  c.fee.amount = contractLineItemsTotal(c);
  c.updatedAt = new Date().toISOString(); saveContracts(); render();
}
function doAddAddOn(contractId){
  const c = getContract(contractId); if(!c) return;
  c.addOns.push({ id:'AO-'+Math.random().toString(36).slice(2,7), label:'', amount:0 });
  c.updatedAt = new Date().toISOString(); saveContracts(); render();
}
function doRemoveAddOn(contractId, aoId){
  const c = getContract(contractId); if(!c) return;
  c.addOns = c.addOns.filter(a=>a.id!==aoId);
  c.fee.amount = contractLineItemsTotal(c);
  c.updatedAt = new Date().toISOString(); saveContracts(); render();
}
function doAddCancellationTier(contractId){
  const c = getContract(contractId); if(!c) return;
  c.cancellationPolicy.tiers.push({ id:'TR-'+Math.random().toString(36).slice(2,7), withinDays:30, percent:80 });
  c.updatedAt = new Date().toISOString(); saveContracts(); render();
}
function doRemoveCancellationTier(contractId, tierId){
  const c = getContract(contractId); if(!c) return;
  c.cancellationPolicy.tiers = c.cancellationPolicy.tiers.filter(t=>t.id!==tierId);
  c.updatedAt = new Date().toISOString(); saveContracts(); render();
}
function doAddCustomClause(contractId){
  const c = getContract(contractId); if(!c) return;
  c.customClauses.push({ id:'CC-'+Math.random().toString(36).slice(2,7), title:'', body:'' });
  c.updatedAt = new Date().toISOString(); saveContracts(); render();
}
function doRemoveCustomClause(contractId, ccId){
  const c = getContract(contractId); if(!c) return;
  c.customClauses = c.customClauses.filter(cc=>cc.id!==ccId);
  c.updatedAt = new Date().toISOString(); saveContracts(); render();
}
function doAddClientProvides(contractId, label){
  const c = getContract(contractId); if(!c || !label) return;
  if(!c.clientProvides.includes(label)) c.clientProvides.push(label);
  c.updatedAt = new Date().toISOString(); saveContracts(); render();
}
function doRemoveClientProvides(contractId, idx){
  const c = getContract(contractId); if(!c) return;
  c.clientProvides.splice(idx,1);
  c.updatedAt = new Date().toISOString(); saveContracts(); render();
}
// Generic field-path writer for the contract editor's inputs -- direct-mutate the live CONTRACTS
// record (see the [data-contract-field] binder in bindGlobal()) rather than staging through the
// generic flat data-field->form-object binder, which can't address nested arrays/objects.
function setContractFieldByPath(c, path, value){
  const parts = path.split('.');
  const kind = parts[0];
  if(kind==='snapshot') c.snapshot[parts[1]] = value;
  else if(kind==='fee'){
    c.fee[parts[1]] = value;
  }
  else if(kind==='deposit') c.deposit[parts[1]] = value;
  else if(kind==='overtime'){
    c.overtime[parts[1]] = value;
    if(parts[1]==='rate') c.overtime.manual = String(value).trim()!=='';
  }
  else if(kind==='cancellation') c.cancellationPolicy[parts[1]] = value;
  else if(kind==='tier'){ const t=c.cancellationPolicy.tiers.find(x=>x.id===parts[1]); if(t) t[parts[2]] = value; }
  else if(kind==='boilerplate') c.boilerplate[parts[1]] = value;
  else if(kind==='lineitem'){ const li=c.lineItems.find(x=>x.id===parts[1]); if(li){ li[parts[2]] = value; c.fee.amount = contractLineItemsTotal(c); } }
  else if(kind==='addon'){ const a=c.addOns.find(x=>x.id===parts[1]); if(a){ a[parts[2]] = value; c.fee.amount = contractLineItemsTotal(c); } }
  else if(kind==='customclause'){ const cc=c.customClauses.find(x=>x.id===parts[1]); if(cc) cc[parts[2]] = value; }
  else if(kind==='performerLabel') c.performerLabel = value;
  else if(kind==='notes') c.notes = value;
  else if(kind==='travel') c.travelClause[parts[1]] = value;
  else if(kind==='lineitemtravel'){ const li=c.lineItems.find(x=>x.id===parts[1]); if(li) li.travelClause[parts[2]] = value; }
  else if(kind==='barter') c.barter[parts[1]] = value;
  else if(kind==='discount') c.discount[parts[1]] = value;
  else if(kind==='creative') c.creative[parts[1]] = value;
  else if(kind==='top') c[parts[1]] = value;
  refreshAutoOvertime(c);
}
// Re-render while preserving focus/caret on the field the user is actively typing in -- used for
// fields that must recompute something live (fee/deposit/balance figures); every other
// contract-editor field follows the rest of the app's convention of storing silently and
// rendering on the next explicit action, so typing in a paragraph textarea never loses its cursor.
function renderPreservingFocus(){
  const active = document.activeElement;
  const key = active && active.dataset ? active.dataset.focusKey : null;
  const selStart = active && 'selectionStart' in active ? active.selectionStart : null;
  const selEnd = active && 'selectionEnd' in active ? active.selectionEnd : null;
  render();
  if(key){
    const el = document.querySelector(`[data-focus-key="${key.replace(/"/g,'\\"')}"]`);
    if(el){ el.focus(); if(selStart!==null && el.setSelectionRange){ try{ el.setSelectionRange(selStart, selEnd); }catch(err){} } }
  }
}

/* ---- Payee profile management (Settings) ---- */
function doSavePayeeProfile(){
  const f = S.payeeProfileForm;
  const entityName = (f.entityName||'').trim();
  if(!entityName){ toast('Enter an entity name.', 'system'); return; }
  if(S.editingPayeeProfileId){
    const p = getPayeeProfile(S.editingPayeeProfileId);
    if(p) Object.assign(p, {
      entityName, artistId: f.artistId||null, zelle:(f.zelle||'').trim(), checkPayee:(f.checkPayee||'').trim(), checkAddress:(f.checkAddress||'').trim(),
      wireBankName:(f.wireBankName||'').trim(), wireAccountName:(f.wireAccountName||'').trim(), wireAccountNumber:(f.wireAccountNumber||'').trim(),
      wireRoutingNumber:(f.wireRoutingNumber||'').trim(), wireSwift:(f.wireSwift||'').trim(), notes:(f.notes||'').trim(),
      defaultOvertimeInterval: f.defaultOvertimeInterval||'half_hour',
      zelleRecipientLabel:(f.zelleRecipientLabel||'').trim(), zelleInstructions:(f.zelleInstructions||'').trim(),
      zelleActive: f.zelleActive!==false, zelleQrDataUrl: f.zelleQrDataUrl||null, zelleQrUrl: f.zelleQrDataUrl ? (f.zelleQrUrl||null) : null,
      defaultFee: f.defaultFee? Number(f.defaultFee) : 0,
      defaultHours: (f.defaultHours||'').trim(),
      defaultDepositAmount: f.defaultDepositAmount? Number(f.defaultDepositAmount) : 0,
      defaultDepositPercent: f.defaultDepositPercent? Number(f.defaultDepositPercent) : 0,
    });
  } else {
    PAYEE_PROFILES.push({
      id:'PP-'+(PPID++), entityName, artistId: f.artistId||null, zelle:(f.zelle||'').trim(), checkPayee:(f.checkPayee||'').trim(), checkAddress:(f.checkAddress||'').trim(),
      wireBankName:(f.wireBankName||'').trim(), wireAccountName:(f.wireAccountName||'').trim(), wireAccountNumber:(f.wireAccountNumber||'').trim(),
      wireRoutingNumber:(f.wireRoutingNumber||'').trim(), wireSwift:(f.wireSwift||'').trim(), notes:(f.notes||'').trim(),
      defaultBoilerplate: blankBoilerplateDefaults(), defaultOvertimeInterval: f.defaultOvertimeInterval||'half_hour',
      zelleRecipientLabel:(f.zelleRecipientLabel||'').trim(), zelleInstructions:(f.zelleInstructions||'').trim(),
      zelleActive: f.zelleActive!==false, zelleQrDataUrl: f.zelleQrDataUrl||null, zelleQrUrl: f.zelleQrDataUrl ? (f.zelleQrUrl||null) : null,
      defaultFee: f.defaultFee? Number(f.defaultFee) : 0,
      defaultHours: (f.defaultHours||'').trim(),
      defaultDepositAmount: f.defaultDepositAmount? Number(f.defaultDepositAmount) : 0,
      defaultDepositPercent: f.defaultDepositPercent? Number(f.defaultDepositPercent) : 0,
    });
  }
  savePayeeProfiles();
  S.showPayeeProfileForm=false; S.payeeProfileForm={}; S.editingPayeeProfileId=null;
  toast('Payee profile saved.', 'success');
  render();
}
function doDeletePayeeProfile(id){
  if(PAYEE_PROFILES.length<=1){ toast('At least one payee profile is required.', 'system'); return; }
  const p = getPayeeProfile(id);
  if(p && !p.artistId && !PAYEE_PROFILES.some(x=>x.id!==id && !x.artistId)){ toast('At least one house (no-artist) profile is required.', 'system'); return; }
  if(!confirm('Delete this payee profile? Any contract still using it will fall back to the house profile.')) return;
  PAYEE_PROFILES = PAYEE_PROFILES.filter(p=>p.id!==id);
  savePayeeProfiles();
  toast('Payee profile deleted.', 'system');
  render();
}

/* ---- Data Migration: move localStorage records into the real Supabase tables (0010-0016) ----
   Preview-then-confirm, admin-only, idempotent (each local record gets a _supabaseId/_migratedAt
   marker once written, so re-running only picks up what's still unmigrated -- safe to click
   repeatedly, safe to leave half-run). Scoped to payee_profiles + contracts for now: events
   themselves (215 real imported gigs, all still needsReview) and external_events are their own
   careful follow-up pass, not bundled in here. */
function computeMigrationCounts(){
  const pp = { total: PAYEE_PROFILES.length, migrated: PAYEE_PROFILES.filter(p=>p._supabaseId).length };
  const ct = { total: CONTRACTS.length, migrated: CONTRACTS.filter(c=>c._supabaseId).length };
  return { payeeProfiles: pp, contracts: ct };
}
function payeeProfileToSupabaseRow(p){
  return {
    legacy_id: p.id, artist_id: null, // artist FK resolved by the caller (needs a local-id -> real-uuid map); left null if unresolved
    entity_name: p.entityName, zelle: p.zelle||'', check_payee: p.checkPayee||'', check_address: p.checkAddress||'',
    wire_bank_name: p.wireBankName||'', wire_bank_address: p.wireBankAddress||'', wire_account_name: p.wireAccountName||'',
    wire_account_number: p.wireAccountNumber||'', wire_routing_number: p.wireRoutingNumber||'', wire_swift: p.wireSwift||'',
    notes: p.notes||'', default_boilerplate: p.defaultBoilerplate||{}, default_overtime_interval: p.defaultOvertimeInterval||'half_hour',
    default_travel_clause: p.defaultTravelClause||null, default_cancellation: p.defaultCancellation||null,
  };
}
function contractToSupabaseRow(c, payeeSupabaseId){
  return {
    legacy_id: c.id, legacy_lead_id: c.leadId||null, lead_id: null, // events aren't migrated yet -- see legacy_lead_id
    template: c.template, status: c.status, performer_artist_id: null, performer_label: c.performerLabel||'',
    payee_profile_id: payeeSupabaseId||null, brand: c.brand||'asp', bsd_header: !!c.bsdHeader,
    snapshot: c.snapshot||{}, fee: c.fee||{}, deposit: c.deposit||{}, overtime: c.overtime||{},
    cancellation_policy: c.cancellationPolicy||{}, boilerplate: c.boilerplate||{}, client_provides: c.clientProvides||[],
    line_items: c.lineItems||[], add_ons: c.addOns||[], custom_clauses: c.customClauses||[],
    hours_of_engagement: c.hoursOfEngagement||'', balance_due_timing: c.balanceDueTiming||'prior',
    artist_provides: c.artistProvides||'', travel_clause: c.travelClause||null, discount: c.discount||null,
    performance_duration: c.performanceDuration||'', performance_type: c.performanceType||'', additional_expenses: c.additionalExpenses||'N/A',
    barter: c.barter||null, creative: c.creative||null, notes: c.notes||'',
    qbo_invoice_id: c.qboInvoiceId||null, qbo_invoice_doc_number: c.qboInvoiceDocNumber||null, signed_at: c.signedAt||null,
  };
}
// Admin reconciliation queue (ops automation spec item 3/5): payments the qbo-webhook handler
// couldn't resolve to a known invoice land here with status='unmatched' rather than being
// silently discarded. Read-only for now -- resolving one (linking it to the right invoice, or
// marking it handled) happens directly in Supabase/QuickBooks until a resolve action is built;
// this pass is about making the queue visible and honest, not the full resolution workflow.
async function loadReconciliationQueue(){
  if(!supabaseClient) return;
  const { data: { session } } = await supabaseClient.auth.getSession();
  if(!session) return;
  S.reconciliationBusy = true; render();
  try{
    const { data, error } = await supabaseClient.from('payments').select('*').eq('status','unmatched').order('received_at', {ascending:false});
    if(error){ toast('Could not load the reconciliation queue: ' + error.message, 'system'); return; }
    S.reconciliationQueue = data||[];
  } finally {
    S.reconciliationBusy = false; render();
  }
}
async function doMigratePayeeProfilesToSupabase(){
  if(!supabaseClient){ toast('Sign in with your ASP account first.', 'system'); return; }
  const todo = PAYEE_PROFILES.filter(p=>!p._supabaseId);
  if(!todo.length){ toast('All payee profiles are already migrated.', 'system'); return; }
  let ok=0, failed=0;
  for(const p of todo){
    const { data, error } = await supabaseClient.from('payee_profiles').insert(payeeProfileToSupabaseRow(p)).select('id').single();
    if(error){ failed++; console.error('payee profile migration failed', p.id, error); continue; }
    p._supabaseId = data.id; p._migratedAt = new Date().toISOString(); ok++;
  }
  savePayeeProfiles();
  toast(`Payee profiles: ${ok} migrated${failed?`, ${failed} failed (see console)`:''}.`, failed? 'system':'success');
  render();
}
async function doMigrateContractsToSupabase(){
  if(!supabaseClient){ toast('Sign in with your ASP account first.', 'system'); return; }
  const todo = CONTRACTS.filter(c=>!c._supabaseId);
  if(!todo.length){ toast('All contracts are already migrated.', 'system'); return; }
  let ok=0, failed=0;
  for(const c of todo){
    const profile = getPayeeProfile(c.payeeProfileId);
    const payeeSupabaseId = profile && profile._supabaseId ? profile._supabaseId : null;
    const { data, error } = await supabaseClient.from('contracts').insert(contractToSupabaseRow(c, payeeSupabaseId)).select('id').single();
    if(error){ failed++; console.error('contract migration failed', c.id, error); continue; }
    c._supabaseId = data.id; c._migratedAt = new Date().toISOString(); ok++;
  }
  saveContracts();
  toast(`Contracts: ${ok} migrated${failed?`, ${failed} failed (see console)`:''}.`, failed? 'system':'success');
  render();
}

/* ---- Contract approval gate (durable booking record architecture, PR 5): "money/term changes
   need approval before outbound comms" -- doSendContractEmail() below refuses to send until
   c.approvedAt is set. Local-first like the rest of this app's contract state: the approval always
   lands on the local record immediately; syncing approved_by/approved_at onto a real Supabase
   contracts row (migration 0021) is best-effort and only possible once that contract has been
   migrated (c._supabaseId) and the current admin has a real Supabase admin_users row (adminRow.dbId,
   set at real sign-in) -- neither is guaranteed yet for most contracts/admins, so a sync failure
   here must never block the local approval itself. ---- */
// An approval covers exactly what was approved: any later change to anything the client sees --
// through any edit path (field binder, pickers, line items, performer, refresh-from-lead) -- voids
// it, because the fingerprint no longer matches. Deny-list, not allow-list: every contract field
// counts except bookkeeping that never reaches the client document. Canonical form (sorted keys,
// numeric strings as numbers) so retyping the same value doesn't void it. Approvals saved before
// this existed have no fingerprint and need one re-approval (the safe direction to fail in).
const CONTRACT_FINGERPRINT_IGNORED = ['payeeSnapshot','id','leadId','status','createdAt','updatedAt','approvedBy','approvedAt','approvedTermsFingerprint','versions','signedAt','clientSignature','qboInvoiceId','qboInvoiceDocNumber','calendarHoldsStatus','_supabaseId','_migratedAt','notes','schemaVersion'];
function contractTermsFingerprint(c){
  const canon = v => Array.isArray(v) ? v.map(canon)
    : (v && typeof v==='object') ? Object.keys(v).sort().reduce((o,k)=>{ o[k]=canon(v[k]); return o; }, {})
    : (typeof v==='string' && v.trim()!=='' && !isNaN(Number(v))) ? Number(v) : v;
  const terms = {}; Object.keys(c).filter(k=>!CONTRACT_FINGERPRINT_IGNORED.includes(k)).forEach(k=>{ terms[k] = c[k]; });
  return JSON.stringify(canon(terms));
}
function isContractApproved(c){ return !!c.approvedAt && c.approvedTermsFingerprint === contractTermsFingerprint(c); }
async function doApproveContractForSending(id){
  const c = getContract(id); if(!c) return;
  if(c.approvedTermsFingerprint && c.approvedTermsFingerprint!==contractTermsFingerprint(c)) revokeOpenSignLinks(c); // links to the old terms
  c.approvedBy = S.user; c.approvedAt = new Date().toISOString(); c.updatedAt = c.approvedAt;
  c.approvedTermsFingerprint = contractTermsFingerprint(c);
  saveContracts(); render();
  if(supabaseClient && c._supabaseId){
    const dbId = adminById(S.user) ? adminById(S.user).dbId : null;
    if(dbId){
      try{ await supabaseClient.from('contracts').update({ approved_by: dbId, approved_at: c.approvedAt }).eq('id', c._supabaseId); }
      catch(err){ console.error('contract approval sync failed', c.id, err); }
    }
  }
}
function doRevokeContractApproval(id){
  const c = getContract(id); if(!c) return;
  revokeOpenSignLinks(c);
  c.approvedBy = null; c.approvedAt = null; c.approvedTermsFingerprint = null; c.updatedAt = new Date().toISOString();
  saveContracts(); render();
  if(supabaseClient && c._supabaseId){
    supabaseClient.from('contracts').update({ approved_by:null, approved_at:null }).eq('id', c._supabaseId)
      .then(({error})=>{ if(error) console.error('contract approval revoke sync failed', c.id, error); });
  }
}

/* ---- Client online signing (migration 0052, Edge Function contract-sign, ops/CONTRACT_SIGN_SETUP.md) ----
   A signing link is a random token the client opens at /sign/#<token> (no login). The database keeps
   only the token's SHA-256, a frozen copy of the wording, and which contract (id + createdAt -- ids can
   be reused or re-numbered, the creation time can't) and terms (SHA-256 of the approved fingerprint)
   it was made from. contract_sign_requests is the source of truth for "the client signed"; the server
   never edits the contract. applyClientSignatures() does, in every admin browser, with the same values
   (so it's idempotent): a signature to the contract's CURRENT terms marks it Signed; one to older
   terms only shows a warning. A signature stays once applied -- a later void or status change by an
   admin is never undone. Harness contracts get a "CT-TEST-" key unique to the test browser (their ids
   are per-browser counters that would collide with real contracts); the server sends no email and
   writes no gig log for them. 2026-10-13. */
const isHarnessBrowser = ()=>!!(window.ASP_DISABLE_EVENT_SYNC || window.ASP_DISABLE_SHARED_SYNC);
function signLinkContractKey(c){ return isHarnessBrowser() ? `CT-TEST-${c.id}-${Date.parse(c.createdAt)||0}` : c.id; }
async function sha256Hex(str){
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
// pay: the deposit to collect on the same link ({ amountCents, cardFeeBps, description }, from
// contractDepositPayment), or null. If only the payment row fails, the link still works for signing.
async function createSignLink(c, html, clientEmail, pay){
  if(!supabaseClient || !S.realSession) return { ok:false, error:'Sign in with your ASP account to make a signing link.' };
  if(!isContractApproved(c)) return { ok:false, error:'This contract isn\'t approved for sending.' };
  // The server checks the link against the shared copy of the contract, so send this one's latest first.
  if(SHARED.contracts.on) await SHARED.contracts.flush();
  const token = newLinkToken();
  const tokenHash = await sha256Hex(token);
  const { error } = await supabaseClient.from('contract_sign_requests').insert({
    token_hash: tokenHash, contract_legacy_id: signLinkContractKey(c), contract_created_at: c.createdAt,
    terms_sha256: await sha256Hex(c.approvedTermsFingerprint), event_legacy_id: isHarnessBrowser() ? null : (c.leadId||null),
    brand_key: c.brand||null, client_name: c.snapshot.clientName||null, client_email: clientEmail||null, rendered_html: html,
  });
  if(error) return { ok:false, error:'Could not make a signing link: ' + error.message };
  let payError = null, withPay = false;
  if(pay){
    const { error: pErr } = await supabaseClient.from('payment_requests').insert({
      token_hash: tokenHash, kind:'contract_deposit', contract_legacy_id: signLinkContractKey(c), contract_created_at: c.createdAt,
      event_legacy_id: isHarnessBrowser() ? null : (c.leadId||null), brand_key: c.brand||null,
      client_name: c.snapshot.clientName||null, client_email: clientEmail||null,
      description: pay.description, amount_cents: pay.amountCents, card_fee_bps: pay.cardFeeBps,
    });
    if(pErr) payError = 'The online deposit payment couldn\'t be added (' + pErr.message + ') — the client can still sign.';
    else withPay = true;
  }
  return { ok:true, url: `${location.origin}/sign/#${token}`, withPay, payError };
}
// Cancels a contract's unsigned links (deleted, voided, approval revoked or replaced by new terms), so a
// client can't sign terms that no longer stand. Best-effort: the app also refuses to apply a signature
// to changed terms, and the server refuses to sign a void or deleted contract.
// A new link waits for these (doMakeSignLink): re-approving and then making a link at once could otherwise
// let the cancel land after the insert and kill the brand-new link too (2026-10-16).
let PENDING_SIGN_LINK_REVOKES = [];
function revokeOpenSignLinks(c){
  if(!supabaseClient || !S.realSession || !isAdminUser(S.user)) return;
  const p = supabaseClient.from('contract_sign_requests').update({ revoked_at: new Date().toISOString() })
    .eq('contract_legacy_id', signLinkContractKey(c)).eq('contract_created_at', c.createdAt)
    .is('signed_at', null).is('revoked_at', null)
    .then(({ error })=>{ if(error) console.warn('could not cancel signing links', c.id, error.message); }, ()=>{});
  PENDING_SIGN_LINK_REVOKES.push(p);
  p.finally(()=>{ PENDING_SIGN_LINK_REVOKES = PENDING_SIGN_LINK_REVOKES.filter(x=>x!==p); });
  revokeOpenPaymentLinks({ contract:c });
}
// Cancels unpaid payment links: a contract's (with its signing links, above, or once its deposit is
// verified by hand) or an invoice's (marked paid by hand). Best-effort: the server also refuses to
// charge a voided/changed contract, a deposit already received, or a paid invoice.
function revokeOpenPaymentLinks({ contract, invoice }){
  if(!supabaseClient || !S.realSession || !isAdminUser(S.user)) return;
  let q = supabaseClient.from('payment_requests').update({ revoked_at: new Date().toISOString() });
  q = contract ? q.eq('contract_legacy_id', signLinkContractKey(contract)).eq('contract_created_at', contract.createdAt)
    : q.eq('invoice_legacy_id', invoicePayKey(invoice)).eq('invoice_created_at', invoice.createdTs||'');
  const p = q.is('revoked_at', null).in('pay_status', ['open','failed'])
    .then(({ error })=>{ if(error) console.warn('could not cancel payment links', error.message); }, ()=>{});
  // Tracked like the signing-link cancel: it would otherwise also cancel the deposit row the next
  // createSignLink() makes, or an invoice's new link (2026-10-16).
  PENDING_SIGN_LINK_REVOKES.push(p);
  p.finally(()=>{ PENDING_SIGN_LINK_REVOKES = PENDING_SIGN_LINK_REVOKES.filter(x=>x!==p); });
}
// What the client receives: the contract as it reads once it has gone out. Rendered from a draft it
// would carry a "Draft" status pill on the letterhead (every emailed contract did, until 2026-10-13).
function clientContractHtml(c){ return contractEmailHtml(c.status==='draft' ? { ...c, status:'sent' } : c); }
function contractEmailWithSignButton(html, url, withPay){
  const button = `<div style="max-width:640px;margin:0 auto 16px;text-align:center;"><a href="${esc(url)}" style="display:inline-block;background:#4C6FA5;color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:8px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;">${withPay?'Review, sign &amp; pay online':'Review &amp; sign online'}</a></div>`;
  // At the bottom, after the contract and payment options (owner 2026-10-21: "move the pay button to bottom of email").
  const i = html.lastIndexOf('</body>');
  return i<0 ? html + button : html.slice(0, i) + button.replace('margin:0 auto 16px', 'margin:16px auto') + html.slice(i);
}
async function doMakeSignLink(id){
  const c = getContract(id); if(!c || S.signLinkBusy) return;
  if(c.status==='void'){ toast('This contract is void — it can\'t be signed.', 'system'); return; }
  // Status is read-only now (owner 2026-10-15): a signed contract whose terms changed goes back to Sent
  // when a link for the new version is made; an unchanged signed contract needs no new link.
  if(c.status==='signed' && !signedTermsChanged(c)){ toast('This contract is already signed.', 'system'); return; }
  if(c.status==='signed'){ c.status='sent'; c.updatedAt=new Date().toISOString(); saveContracts(); }
  if(!isContractApproved(c)){ toast(c.approvedAt ? 'Money/terms changed since this contract was approved — re-approve it first.' : 'Approve this contract for sending first — money/terms must be approved before a signing link can go out.', 'system'); return; }
  S.signLinkBusy = id; render();
  await Promise.all(PENDING_SIGN_LINK_REVOKES); // never let a cancel of the old links land after this one
  const link = await createSignLink(c, clientContractHtml(c), c.snapshot.clientEmail, contractDepositPayment(c));
  S.signLinkBusy = null;
  if(!link.ok){ toast(link.error, 'system'); render(); return; }
  if(link.payError) toast(link.payError, 'system');
  S.signLinks = { ...(S.signLinks||{}), [id]: link.url };
  // A link made for a draft is going out another way: same as marking it Sent by hand.
  if(c.status==='draft'){ freezeContractPayee(c); c.status='sent'; c.updatedAt=new Date().toISOString(); saveContracts(); advanceLeadForContract(c, `Signing link made for contract ${c.id} (sent outside the app).`); }
  render();
  try{ await navigator.clipboard.writeText(link.url); toast('Signing link copied — paste it to the client.', 'success'); }
  catch(e){ toast('Signing link ready — copy it from the box.', 'system'); }
}
// S.earlierClientSignatures: contract id → { name, at } -- signed online, but to terms since changed.
async function applyClientSignatures(){
  if(!supabaseClient || !S.realSession || !isAdminUser(S.user)) return;
  const { data, error } = await supabaseClient.from('contract_sign_requests')
    .select('id, contract_legacy_id, contract_created_at, terms_sha256, signer_name, signed_at')
    .not('signed_at', 'is', null).order('signed_at');
  if(error){ console.warn('could not load online signatures', error.message); return; }
  const earlier = {};
  let changed = false;
  for(const c of CONTRACTS){
    const mine = (data||[]).filter(r=>r.contract_legacy_id===signLinkContractKey(c) && r.contract_created_at===c.createdAt);
    if(!mine.length) continue;
    const terms = await sha256Hex(contractTermsFingerprint(c));
    const r = mine.find(x=>x.terms_sha256===terms);   // the first signature to the current terms
    if(!r){ const last = mine[mine.length-1]; earlier[c.id] = { name:last.signer_name, at:last.signed_at }; continue; }
    if(c.status==='void' || (c.clientSignature && c.clientSignature.termsSha256===terms)) continue;
    freezeContractPayee(c);
    Object.assign(c, { status:'signed', signedAt:r.signed_at, updatedAt:r.signed_at,
      clientSignature:{ name:r.signer_name, at:r.signed_at, requestId:r.id, termsSha256:r.terms_sha256, termsHash:hashStr(contractTermsFingerprint(c)) } });
    changed = true;
  }
  const earlierChanged = canon(earlier)!==canon(S.earlierClientSignatures||{});
  S.earlierClientSignatures = earlier;
  if(changed) saveContracts();
  if(changed || earlierChanged) renderPreservingFocus();
}
function earlierClientSignature(c){ return (S.earlierClientSignatures||{})[c.id] || null; }
// Signed online, then the money/terms were edited: the signature is to terms the contract no longer has.
function signedTermsChanged(c){ return !!(c.clientSignature && c.clientSignature.termsHash && c.clientSignature.termsHash!==hashStr(contractTermsFingerprint(c))); }
let clientSignatureChannel = null;
function startClientSignatureWatch(){
  if(clientSignatureChannel || !supabaseClient || !S.realSession || !isAdminUser(S.user)) return;
  clientSignatureChannel = supabaseClient.channel('contract-signatures')
    .on('postgres_changes', { event:'UPDATE', schema:'public', table:'contract_sign_requests' }, ()=>applyClientSignatures())
    .on('postgres_changes', { event:'UPDATE', schema:'public', table:'payment_requests' }, ()=>applyClientPayments())
    .subscribe();
  applyClientSignatures();
  applyClientPayments();
  startBankAlertWatch();
}
function stopClientSignatureWatch(){
  if(clientSignatureChannel){ supabaseClient.removeChannel(clientSignatureChannel); clientSignatureChannel = null; }
  S.earlierClientSignatures = {};
  S.clientPayments = {};
  stopBankAlertWatch();
}

/* ---- Client online payments (migration 0056, Edge Functions client-pay / stripe-webhook / stripe-status,
   ops/STRIPE_SETUP.md) ----
   A contract's deposit rides on its signing link: the same token gets a payment_requests row (amount
   and card fee frozen), and the client's /sign/ page shows "Pay your deposit" once they've signed. A
   custom invoice gets its own /pay/#<token> link. The server records the money (payments ledger, gig
   log, receipt); applyClientPayments() then does what Verify Deposit does -- in every admin browser,
   idempotently -- marks the deposit received and the gig Booked and sends the booking confirmation, or
   marks the invoice paid. The card fee (Settings, 0-3%) applies to credit cards only, never to gigs in
   states that ban surcharges. Owner 2026-10-13. */
const NO_CARD_FEE_STATES = ['CT','MA'];
// "Connecticut", "Conn.", "ct", "Mass." … → CT / MA; anything else as typed (upper-cased, no dots).
function normalizeState(s){
  const t = String(s||'').trim().toUpperCase().replace(/\./g,'').replace(/\s+/g,' ');
  if(['CT','CONN','CONNECTICUT'].includes(t)) return 'CT';
  if(['MA','MASS','MASSACHUSETTS'].includes(t)) return 'MA';
  return t;
}
function cardFeePercentSetting(){ const n = Number(ORG_SETTINGS.cardFeePercent)||0; return Math.min(Math.max(n, 0), 3); }
// The gig's state, or the contract's; a no-fee state in EITHER wins (contractCardFeeBps).
function contractGigStates(c){ const ev = getEvent(c.leadId); return [ev && ev.state, c.snapshot && c.snapshot.state].map(normalizeState).filter(Boolean); }
function contractGigState(c){ const all = contractGigStates(c); return all.find(x=>NO_CARD_FEE_STATES.includes(x)) || all[0] || ''; }
function stripeReady(){ return !!(S.stripeStatus && S.stripeStatus.connected); }
function contractCardFeeBps(c){
  return NO_CARD_FEE_STATES.includes(contractGigState(c)) ? 0 : Math.round(cardFeePercentSetting() * 100);
}
async function refreshStripeStatus(){
  const data = await callEdgeFunction('stripe-status', {});
  S.stripeStatus = data && data.ok ? data : { connected:false, error:(data && data.error) || 'Could not check Stripe.' };
  render();
  if(S.stripeStatus.connected) refreshStripePayees();
}
function contractDepositCents(c){ return Math.round((Number(contractPaymentFigures(c).deposit)||0) * 100); }
function contractDepositDescription(c){
  return `Deposit — ${c.snapshot.venue||'your event'}${c.snapshot.eventDate?` (${fmtDateShort(c.snapshot.eventDate)})`:''}`.slice(0, 200);
}
// The deposit for a signing link (same token), or null when it can't be paid online.
function contractDepositPayment(c){
  const cents = contractDepositCents(c);
  if(!stripeReady() || cents < 50) return null;
  return { amountCents: cents, cardFeeBps: contractCardFeeBps(c), description: contractDepositDescription(c) };
}
// Exact dollars and cents (money() rounds to whole dollars).
function moneyCents(n){ return '$' + (Number(n)||0).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 }); }
function newLinkToken(){
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function invoicePayKey(inv){ return isHarnessBrowser() ? `INV-TEST-${inv.id}-${Date.parse(inv.createdTs)||0}` : inv.id; }
// html(inv) builds the frozen copy AFTER the shared sync has settled the invoice's id.
async function createInvoicePayLink(inv, html){
  if(!supabaseClient || !S.realSession) return { ok:false, error:'Sign in with your ASP account to make a payment link.' };
  const cents = Math.round(invoiceTotal(inv) * 100);
  if(cents < 50) return { ok:false, error:'The invoice total is too small to pay online.' };
  if(!inv.createdTs){ inv.createdTs = new Date().toISOString(); saveCustomInvoices(); }
  // The server checks the link against the shared copy of the invoice, so send this one's latest first.
  if(SHARED.invoices.on) await SHARED.invoices.flush();
  await Promise.all(PENDING_SIGN_LINK_REVOKES); // an earlier cancel must not land after this link
  if(typeof html==='function') html = html(inv);
  const token = newLinkToken();
  const { error } = await supabaseClient.from('payment_requests').insert({
    token_hash: await sha256Hex(token), kind:'invoice', invoice_legacy_id: invoicePayKey(inv), invoice_created_at: inv.createdTs,
    rendered_html: html, brand_key:'asp', client_name: inv.clientName||null, client_email: inv.clientEmail||null,
    description: `Invoice ${inv.id}`, amount_cents: cents, card_fee_bps: inv.noCardFee ? 0 : Math.round(cardFeePercentSetting() * 100),
  });
  if(error) return { ok:false, error:'Could not make a payment link: ' + error.message };
  return { ok:true, url: `${location.origin}/pay/#${token}` };
}
function invoiceEmailHtml(inv, payUrl){
  const brand = getBrandConfig('asp');
  const rows = (inv.items||[]).map(it=>`<tr><td style="padding:8px 0;border-bottom:1px dashed #E1E1E6;">${esc(it.label)}</td><td style="padding:8px 0;border-bottom:1px dashed #E1E1E6;text-align:right;">${moneyCents(it.amount)}</td></tr>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"/></head><body style="margin:0;padding:24px;background:#F5F4EF;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#17171A;">
  <div style="max-width:640px;margin:0 auto;background:#fff;padding:32px;border-radius:10px;">
    <div style="padding-bottom:18px;border-bottom:2px solid #17171A;margin-bottom:22px;">${brandLogoEmailHtml(180)}</div>
    <div style="font-size:1.5rem;font-weight:700;text-align:center;margin:6px 0 2px;">INVOICE</div>
    <div style="text-align:center;font-size:11.5px;color:#9A9AA1;margin-bottom:26px;">${esc(inv.id)} &middot; ${esc(fmtDate(inv.createdAt))}</div>
    <p style="margin:0 0 18px;font-size:13.5px;"><span style="font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:#9A9AA1;font-weight:700;">Billed to</span><br/><strong>${esc(inv.clientName)}</strong>${inv.clientEmail?`<br/>${esc(inv.clientEmail)}`:''}</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">${rows}
      <tr><td style="padding:10px 0 0;font-weight:700;font-size:14.5px;">Total due</td><td style="padding:10px 0 0;text-align:right;font-weight:700;font-size:14.5px;">${moneyCents(invoiceTotal(inv))}</td></tr></table>
    ${inv.notes?`<p style="font-size:12.5px;color:#67676D;margin:18px 0 0;">${esc(inv.notes)}</p>`:''}
    ${paymentOptionsEmailBlock({ kind:'invoice', payUrl, amount:invoiceTotal(inv), memo:inv.id, zelle:depositZelle() })}
  </div></body></html>`;
}
async function doMakeInvoicePayLink(id){
  const inv = getInvoice(id); if(!inv || S.payLinkBusy) return;
  if(inv.status==='paid'){ toast('This invoice is already paid.', 'system'); return; }
  if(!stripeReady()){ toast('Online payments aren\'t set up yet — see Settings → Online payments.', 'system'); return; }
  S.payLinkBusy = id; render();
  const link = await createInvoicePayLink(inv, x=>invoiceEmailHtml(x, null));
  S.payLinkBusy = null;
  if(!link.ok){ toast(link.error, 'system'); render(); return; }
  S.payLinks = { ...(S.payLinks||{}), [id]: link.url };
  render();
  try{ await navigator.clipboard.writeText(link.url); toast('Payment link copied — paste it to the client.', 'success'); }
  catch(e){ toast('Payment link ready — copy it from the box.', 'system'); }
}
/* ---- Balances paid online, straight to the artist (Stripe Connect, migration 0063, Edge Functions
   stripe-connect / payee-onboard, ops/STRIPE_SETUP.md) ----
   Owner 2026-10-16: the deposit (ASP's commission) goes to ASP, the balance straight to the artist,
   and the client only ever deals with ASP. Each payee profile can have a Stripe account of its own
   (the artist sets it up from a link the office sends); a balance link pays the gig's balance to the
   gig's balance payee (zellePayeeProfileFor, the same payee as the balance Zelle). The server re-checks
   all of it -- amount, payee, account -- before charging. */
// S.stripePayees: payee profile id → its stripe_payees row, as Stripe last reported it.
async function refreshStripePayees(){
  const data = await callEdgeFunction('stripe-connect', { action:'refresh' });
  if(!data || !data.ok) return;
  S.stripePayees = Object.fromEntries((data.payees||[]).map(r=>[r.payee_profile_id, r]));
  renderPreservingFocus();
}
function stripePayeeOf(profileId){ return (S.stripePayees||{})[profileId] || null; }
// Ready to receive: Stripe says the account can take transfers, in the same mode (test/live) as ASP's key.
function stripePayeeActive(row){ return !!(row && row.transfers_active && !!row.livemode === (!!S.stripeStatus && S.stripeStatus.mode==='live')); }
function stripePayeeStatusPill(row){
  if(!row) return `<span class="pill pill-neutral">Not set up</span>`;
  if(stripePayeeActive(row)) return `<span class="pill pill-good" data-testid="payee-stripe-active">Active${row.livemode?'':' — test mode'}</span>`;
  if(row.details_submitted) return `<span class="pill pill-warn">Stripe is checking${row.requirements_due?' — more details needed':''}</span>`;
  return `<span class="pill pill-neutral">Setup link sent${row.setup_email?` to ${esc(row.setup_email)}`:''}</span>`;
}
function balancePayKey(ev){ return isHarnessBrowser() ? `EV-TEST-${ev.id}` : ev.id; }
function balanceDescription(ev){ return `Balance — ${ev.venue||ev.type||'your event'}${ev.date?` (${fmtDateShort(ev.date)})`:''}`.slice(0, 200); }
// Why a gig's balance can't be paid online now, or '' (the client still gets the artist's Zelle).
function balancePayBlocker(ev){
  if(!stripeReady()) return 'Online payments aren\'t set up yet (Settings → Online payments).';
  if(ev.balanceReceived) return 'The balance is already received.';
  if(!ev.depositReceived) return 'The deposit isn\'t in yet: the balance link goes out after it.';
  if(!isStandardPayment(ev)) return 'This gig\'s balance is paid another way.';
  if(Math.round(clientBalanceDue(ev)*100) < 50) return 'There\'s no balance left to pay.';
  const profile = zellePayeeProfileFor(ev);
  if(!profile) return 'This gig has no payee profile.';
  // One payment, split automatically (owner 2026-10-16): every artist on the gig gets their share, so
  // each one's payee must be set up -- the main artist's, and each additional artist's own profile.
  const payees = [profile];
  for(const x of gigExtraArtists(ev)){
    const a = artistById(x.artistId);
    const p = PAYEE_PROFILES.find(pp=>pp.artistId===x.artistId);
    if(!p) return `${a?a.name:'An artist on this gig'} has no payee profile.`;
    if(x.aspCut==null) return `${a?a.name:'An artist on this gig'}'s share isn't set on the gig.`;
    payees.push(p);
  }
  const notReady = payees.find(p=>!stripePayeeActive(stripePayeeOf(p.id)));
  if(notReady) return `${notReady.entityName||'A payee'} hasn't finished setting up online payouts (Settings → Payee Profiles).`;
  return '';
}
async function createBalancePayLink(ev){
  if(!supabaseClient || !S.realSession) return { ok:false, error:'Sign in with your ASP account to make a payment link.' };
  const why = balancePayBlocker(ev); if(why) return { ok:false, error:why };
  // The server checks the link against the shared copies of the gig, its contracts and payee profiles
  // (the amount and the payee), so send this browser's latest first.
  for(const k of ['events','contracts','payee_profiles']) if(SHARED[k].on) await SHARED[k].flush();
  const token = newLinkToken();
  const { error } = await supabaseClient.from('payment_requests').insert({
    token_hash: await sha256Hex(token), kind:'event_balance', event_legacy_id: balancePayKey(ev), payee_profile_id: zellePayeeProfileFor(ev).id,
    brand_key:'asp', client_name: ev.clientName||null, client_email: ev.clientEmail||null,
    description: balanceDescription(ev), amount_cents: Math.round(clientBalanceDue(ev)*100),
    card_fee_bps: NO_CARD_FEE_STATES.includes(normalizeState(ev.state)) ? 0 : Math.round(cardFeePercentSetting() * 100),
  });
  if(error) return { ok:false, error:'Could not make a payment link: ' + error.message };
  return { ok:true, url: `${location.origin}/pay/#${token}` };
}
// For the client emails: a balance link when one can be made, else null (the email shows Zelle only).
async function balancePayUrl(ev){
  // Right after sign-in (an online deposit's booking confirmation) the statuses may not be loaded yet;
  // re-read the payees so one who just finished setting up counts.
  if(!S.stripeStatus) await refreshStripeStatus();
  if(stripeReady()) await refreshStripePayees();
  if(balancePayBlocker(ev)) return null;
  const link = await createBalancePayLink(ev);
  if(!link.ok) console.warn('balance pay link', link.error);
  return link.ok ? link.url : null;
}
async function doMakeBalancePayLink(id){
  const ev = getEvent(id); if(!ev || S.payLinkBusy) return;
  const why = balancePayBlocker(ev); if(why){ toast(why, 'system'); return; }
  S.payLinkBusy = id; render();
  const link = await createBalancePayLink(ev);
  S.payLinkBusy = null;
  if(!link.ok){ toast(link.error, 'system'); render(); return; }
  S.payLinks = { ...(S.payLinks||{}), [id]: link.url };
  render();
  try{ await navigator.clipboard.writeText(link.url); toast('Balance payment link copied — paste it to the client.', 'success'); }
  catch(e){ toast('Balance payment link ready — copy it from the box.', 'system'); }
}
// Payee profile → Online balance payouts (the payee profile modal).
async function doPayeeStripeSetup(profileId, { send=false, shareFrom=null }={}){
  if(S.payeeStripeBusy) return;
  const email = String(payeeStripeEmailValue(profileId)||'').trim();
  if(send && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ toast('Enter the email to send the setup link to.', 'system'); return; }
  S.payeeStripeBusy = true; render();
  const data = await callEdgeFunction('stripe-connect', { action:'setup', payeeProfileId:profileId, shareFrom, email: send ? email : undefined, send });
  S.payeeStripeBusy = false;
  if(!data || !data.ok){ toast((data && data.error) || 'Could not set up payouts.', 'system'); render(); return; }
  if(data.payee) S.stripePayees = { ...(S.stripePayees||{}), [profileId]: data.payee };
  S.payeeStripeLink = { id:profileId, url:data.url };
  render();
  if(send) toast(data.sent ? `Setup link emailed to ${email}.` : `The email didn't go out (${data.sendError||'unknown error'}) — copy the link instead.`, data.sent?'success':'system');
  else { try{ await navigator.clipboard.writeText(data.url); toast('Setup link copied — send it to the artist.', 'success'); }catch(e){ toast('Setup link ready — copy it from the box.', 'system'); } }
}
// What the office typed, else where the last link went, else the artist's own email.
function payeeStripeEmailValue(profileId){
  if(S.payeeStripeEmail!=null) return S.payeeStripeEmail;
  const p = getPayeeProfile(profileId), row = stripePayeeOf(profileId), artist = p && p.artistId ? artistById(p.artistId) : null;
  return (row && row.setup_email) || (artist && artist.email) || '';
}
function renderPayeeStripeSection(profileId){
  const p = getPayeeProfile(profileId); if(!p || !stripeReady()) return '';
  const row = stripePayeeOf(profileId);
  const isAsp = !p.artistId && /^ASP\b/i.test(p.entityName||'');
  if(isAsp) return '';
  const link = S.payeeStripeLink && S.payeeStripeLink.id===profileId ? S.payeeStripeLink.url : '';
  const emailDefault = payeeStripeEmailValue(profileId);
  // Another profile of the same company that already has an account (e.g. Airschnitz for two artists).
  const norm = s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const twin = !row && PAYEE_PROFILES.find(x=>x.id!==p.id && norm(x.entityName)===norm(p.entityName) && stripePayeeOf(x.id) && !!stripePayeeOf(x.id).livemode===(S.stripeStatus.mode==='live'));
  const busy = S.payeeStripeBusy;
  return `<div class="field" data-testid="payee-stripe">
    <label>Online balance payouts (Stripe)</label>
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px;">${stripePayeeStatusPill(row)}</div>
    <p style="font-size:11.5px;color:var(--ink-3);margin:0 0 8px;">Clients pay the balance online and it goes straight to this payee's bank. The artist sets it up on Stripe's site from the link (their bank and tax ID; ASP never sees them).${row && row.requirements_due && !stripePayeeActive(row) ? ` Stripe still needs: ${esc(row.requirements_due)}.` : ''}</p>
    ${stripePayeeActive(row) ? '' : `
      ${twin ? `<button type="button" class="btn btn-sm" style="margin-bottom:8px;" data-action="payee-stripe-share" data-id="${esc(p.id)}" data-from="${esc(twin.id)}" ${busy?'disabled':''}>Use ${esc(twin.entityName)}'s Stripe account</button>` : ''}
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end;">
        <input data-field="payeeStripeEmail" data-form="payeestripe" type="email" value="${esc(emailDefault)}" placeholder="artist's email" style="flex:1 1 180px;min-width:0;"/>
        <button type="button" class="btn btn-sm btn-primary" data-action="payee-stripe-send" data-id="${esc(p.id)}" ${busy?'disabled':''}>${busy?'Working…':'Email setup link'}</button>
        <button type="button" class="btn btn-sm btn-ghost" data-action="payee-stripe-link" data-id="${esc(p.id)}" ${busy?'disabled':''}>Copy setup link</button>
      </div>`}
    ${link ? `<input readonly value="${esc(link)}" data-testid="payee-stripe-link" style="margin-top:8px;width:100%;font-size:12px;" onfocus="this.select()"/>` : ''}
  </div>`;
}
function paidOnlineText(r){
  const how = r.pay_method==='us_bank_account' ? `bank transfer${r.pay_last4?` ••${r.pay_last4}`:''}`
    : `${r.card_brand ? r.card_brand.charAt(0).toUpperCase()+r.card_brand.slice(1) : 'Card'}${r.card_funding==='credit'?' credit':r.card_funding==='debit'?' debit':''}${r.pay_last4?` ••${r.pay_last4}`:''}`;
  return `${moneyCents((r.total_cents||0)/100)} by ${how}${r.fee_cents?`, incl. ${moneyCents(r.fee_cents/100)} card fee`:''}`;
}
// S.clientPayments: "c|<contract key>|<createdAt>" / "i|<invoice key>|<createdTs>" → the payment row
// that took money (or is taking it: a bank transfer still processing).
function contractOnlinePayment(c){ return (S.clientPayments||{})[`c|${signLinkContractKey(c)}|${c.createdAt}`] || null; }
function invoiceOnlinePayment(inv){ return (S.clientPayments||{})[`i|${invoicePayKey(inv)}|${inv.createdTs}`] || null; }
function balanceOnlinePayment(ev){ return (S.clientPayments||{})[`b|${balancePayKey(ev)}`] || null; }
function contractPaymentPill(c){
  const r = contractOnlinePayment(c); if(!r) return '';
  if(r.pay_status==='processing') return `<span class="pill pill-wrap pill-neutral" data-testid="online-payment">Deposit: bank transfer processing (started ${fmtDateShort(String(r.processing_at||r.created_at).slice(0,10))})</span>`;
  const warn = r.pay_status==='refunded' ? ' — since refunded' : r.pay_status==='disputed' ? ' — disputed by the client, check Stripe' : '';
  return `<span class="pill pill-wrap ${warn?'pill-warn':'pill-good'}" data-testid="online-payment">Deposit paid online — ${esc(paidOnlineText(r))}, ${fmtDateShort(String(r.paid_at).slice(0,10))}${warn}</span>`;
}
const appliedOnlinePayments = new Set();
async function applyClientPayments(){
  if(!supabaseClient || !S.realSession || !isAdminUser(S.user)) return;
  const { data, error } = await supabaseClient.from('payment_requests')
    .select('id, kind, contract_legacy_id, contract_created_at, invoice_legacy_id, invoice_created_at, event_legacy_id, pay_status, pay_method, card_brand, card_funding, pay_last4, fee_cents, total_cents, amount_cents, processing_at, paid_at, applied_at, created_at')
    .in('pay_status', ['processing','paid','refunded','disputed']).order('created_at');
  if(error){ console.warn('could not load online payments', error.message); return; }
  const map = {};
  for(const r of data||[]){
    const k = r.kind==='invoice' ? `i|${r.invoice_legacy_id}|${r.invoice_created_at}` : r.kind==='event_balance' ? `b|${r.event_legacy_id}` : `c|${r.contract_legacy_id}|${r.contract_created_at}`;
    if(!map[k] || map[k].pay_status==='processing') map[k] = r;
  }
  const changed = canon(map)!==canon(S.clientPayments||{});
  S.clientPayments = map;
  // Each payment is applied once, by whichever admin browser claims it first (applied_at, 0057).
  for(const c of CONTRACTS){
    const r = contractOnlinePayment(c);
    if(!r || r.pay_status!=='paid' || r.applied_at || appliedOnlinePayments.has(r.id)) continue;
    const ev = getEvent(c.leadId);
    if(!ev) continue;   // its gig hasn't loaded yet: try again on the next change
    if(ev.depositVerification && ev.depositVerification.paymentRequestId===r.id){ appliedOnlinePayments.add(r.id); continue; }
    if(ev.depositReceived){
      // Verified another way (Zelle, check) AND paid online: the client paid twice. One browser says so.
      appliedOnlinePayments.add(r.id);
      if(await claimOnlinePayment(r)){
        logEvent(ev, 'system', `The client ALSO paid the deposit online (${paidOnlineText(r)}) after it was verified another way — refund one of the two payments in Stripe.`);
        reportEventSave(updateEvent(ev.id, {}), 'noting the second deposit payment');
        toast(`${ev.clientName||'A client'} paid the deposit twice (online and another way) — refund one in Stripe.`, 'system');
      }
      continue;
    }
    if(!(await claimOnlinePayment(r))){ appliedOnlinePayments.add(r.id); continue; }
    appliedOnlinePayments.add(r.id);
    applyOnlineDeposit(ev, c, r);
  }
  for(const ev of S.events){
    const r = balanceOnlinePayment(ev);
    if(!r || r.pay_status!=='paid' || r.applied_at || appliedOnlinePayments.has(r.id)) continue;
    if(ev.balanceVerification && ev.balanceVerification.paymentRequestId===r.id){ appliedOnlinePayments.add(r.id); continue; }
    appliedOnlinePayments.add(r.id);
    if(!(await claimOnlinePayment(r))) continue;
    if(ev.balanceReceived){
      // Marked received another way (Zelle, check) AND paid online: the client paid twice.
      logEvent(ev, 'system', `The client ALSO paid the balance online (${paidOnlineText(r)}) after it was marked received another way — refund one of the two payments in Stripe (tick Reverse transfer).`);
      reportEventSave(updateEvent(ev.id, {}), 'noting the second balance payment');
      toast(`${ev.clientName||'A client'} paid the balance twice (online and another way) — refund one in Stripe.`, 'system');
      continue;
    }
    applyOnlineBalance(ev, r);
  }
  let invChanged = false;
  for(const inv of CUSTOM_INVOICES){
    const r = invoiceOnlinePayment(inv);
    if(!r || r.pay_status!=='paid' || inv.status==='paid') continue;
    // Marking the invoice paid is the same in every browser, so no claim is needed for it.
    inv.status = 'paid'; inv.paidAt = String(r.paid_at).slice(0,10);
    inv.log = [...(inv.log||[]), { ts:r.paid_at, type:'success', text:`Paid online: ${paidOnlineText(r)}.` }];
    invChanged = true;
  }
  if(invChanged) saveCustomInvoices();
  if(changed || invChanged) renderPreservingFocus();
}
async function claimOnlinePayment(r){
  const { data, error } = await supabaseClient.from('payment_requests').update({ applied_at: new Date().toISOString() })
    .eq('id', r.id).is('applied_at', null).select('id');
  if(error){ console.warn('could not claim the online payment', r.id, error.message); return false; }
  return !!(data && data.length);
}
// What Verify Deposit does, for a deposit the client paid online: the gig is Booked, the deposit
// received, and the client gets the booking confirmation. Only the admin browser that claimed the
// payment (claimOnlinePayment) gets here.
function applyOnlineDeposit(ev, c, r){
  const text = paidOnlineText(r);
  logEvent(ev, 'success', `Deposit paid online (${text}) for contract ${c.id} — job officially booked & locked on calendar.`);
  const depositVerification = { method:'stripe', note:`Paid online: ${text}`, loggedBy:null, loggedAt:r.paid_at, paymentRequestId:r.id };
  const patch = { depositReceived:true, depositReceivedDate:String(r.paid_at).slice(0,10), depositVerification };
  if(STATUS_GROUPS.open.includes(ev.status)) patch.status = 'booked';
  const result = updateEvent(ev.id, patch);
  if(!result.ok){
    // Claimed but not saved here: tell the office rather than lose it (the money is recorded in Stripe and the ledger).
    toast(`${ev.clientName||'A client'} paid the deposit online, but this gig couldn't be updated — reload and use Verify Deposit.`, 'system');
    return;
  }
  toast(`${ev.clientName||'The client'} paid the deposit online — ${patch.status==='booked'?'booked':'deposit recorded'}.`, 'success');
  if(ev.clientEmail && patch.status==='booked' && !isHarnessBrowser()) doSendBookingConfirmationEmail(ev.id);
}

// What Mark Balance Received does, for a balance the client paid online (it went straight to the
// artist's Stripe account). Only the admin browser that claimed the payment gets here.
function applyOnlineBalance(ev, r){
  const text = paidOnlineText(r);
  const payee = zellePayeeProfileFor(ev);
  const names = [payee ? payee.entityName : 'the artist', ...gigExtraArtists(ev).map(x=>{ const p = PAYEE_PROFILES.find(pp=>pp.artistId===x.artistId); return p ? p.entityName : x.artistId; })];
  logEvent(ev, 'success', `Balance paid online (${text}), sent straight to ${names.length>1 ? `the artists' Stripe accounts (${names.join(', ')})` : `${names[0]}'s Stripe account`} — paid in full.`);
  const result = updateEvent(ev.id, { balanceReceived:true, balanceReceivedDate:String(r.paid_at).slice(0,10), status:'paid',
    balanceVerification:{ method:'stripe', note:`Paid online: ${text}`, loggedAt:r.paid_at, paymentRequestId:r.id } });
  if(!result.ok){ toast(`${ev.clientName||'A client'} paid the balance online, but this gig couldn't be updated — reload and mark the balance received.`, 'system'); return; }
  toast(`${ev.clientName||'The client'} paid the balance online — paid in full.`, 'success');
}

/* ---- Send Contract (real email, via the send-contract-email Supabase Edge Function) ---- */
// A contract going out (really emailed, or marked sent/signed by hand when it went out another way)
// moves its lead forward to contract_sent -- forward only, never back from booked/paid -- and records
// it on the lead in the same guarded write. This is the only path into contract_sent now that the
// event sheet's old button no longer fakes a send.
function advanceLeadForContract(c, logText){
  const lead = getEvent(c.leadId); if(!lead) return;
  const entry = { ts:new Date().toISOString(), type:'system', text: logText };
  const patch = { log: [...(lead.log||[]), entry] };
  if(['lead','negotiating'].includes(lead.status)) patch.status = 'contract_sent';
  reportEventSave(updateEvent(lead.id, patch), 'updating the lead for this contract');
}
async function doSendContractEmail(){
  const c = getContract(S.contractBuilderId); if(!c) return;
  if(!isContractApproved(c)){ toast(c.approvedAt ? 'Money/terms changed since this contract was approved — re-approve it before sending.' : 'Approve this contract for sending first — money/terms must be approved before it can go out.', 'system'); return; }
  // Capture every form value up front and use only these locals from here on -- S.sendContractForm
  // gets cleared as soon as the email step succeeds (so the confirm modal doesn't reopen stale),
  // and the QuickBooks step runs after that point. Reading S.sendContractForm.qboAmount there was
  // a real bug: it always resolved to 0 against the just-cleared form, so a requested QuickBooks
  // invoice silently never got created even when the email send reported success.
  const to = (S.sendContractForm.to||'').trim();
  const subject = (S.sendContractForm.subject||'').trim();
  const wantsInvoice = !!S.sendContractInvoice;
  const payOnline = !!S.sendContractPayOnline;
  const qboAmount = Number(S.sendContractForm.qboAmount)||0;
  const qboDescription = S.sendContractForm.qboDescription||'Deposit';
  if(!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)){ toast('Enter a valid recipient email.', 'system'); return; }
  if(!subject){ toast('Enter a subject.', 'system'); return; }
  if(!supabaseClient){ toast('Sign in with your ASP account to send email.', 'system'); return; }
  S.sendContractBusy = true; render();
  try{
    // A signed contract whose terms changed is a new version to sign: back to Sent first, so the new link
    // carries the new terms and deposit (the read-only status has no other way back; owner 2026-10-15).
    if(c.status==='signed' && signedTermsChanged(c)){ c.status='sent'; c.updatedAt=new Date().toISOString(); saveContracts(); }
    const html = clientContractHtml(c);
    const { data: { session } } = await supabaseClient.auth.getSession();
    // A session is required: falling back to the publishable key as a bearer token only produced
    // a confusing server-side auth failure (2026-10-09 audit 5.5).
    if(!session){ toast('Your sign-in has expired — sign in again to send email.', 'system'); return; }
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': SUPABASE_PUBLISHABLE_KEY,
    };
    // Retry-safe: re-sending after a prior failure re-runs the email step (send-contract-email has
    // no dedupe of its own yet), but never re-runs the QuickBooks step once it already succeeded --
    // c.qboInvoiceId is the idempotency marker.
    // The sign-online button (the client signs the exact wording below it). If the link can't be
    // made, the contract still goes out -- without the button -- and the admin is told.
    const link = c.status==='signed' ? { ok:false } : await createSignLink(c, html, to, payOnline ? contractDepositPayment(c) : null);
    if(!link.ok && link.error) toast(link.error + ' The contract will go out without the sign-online button.', 'system');
    if(link.payError) toast(link.payError, 'system');
    const sent = await sendEmail({ to, subject, html: link.ok ? contractEmailWithSignButton(html, link.url, link.withPay) : html, brand: c.brand });
    if(!sent.ok){ toast(sent.error, 'system'); return; }
    if(c.status==='draft'){ freezeContractPayee(c); c.status='sent'; c.updatedAt=new Date().toISOString(); saveContracts(); }
    // The real send is what moves the lead along (only forward: lead/negotiating -> contract_sent).
    advanceLeadForContract(c, `Contract ${c.id} emailed to ${to}.`);
    // Immutable snapshot of exactly what was sent (contract_versions, migration 0010) -- a contract
    // can be edited after sending; this is what proves what the client actually received on a given
    // date. Local mirror (c.versions) is always written so there's an audit trail even for contracts
    // never migrated to a real Supabase row; the real Supabase insert is best-effort and only
    // possible once c._supabaseId exists -- never blocks the send itself if it fails.
    c.versions = c.versions || [];
    const versionNumber = c.versions.length + 1;
    c.versions.push({ versionNumber, snapshot: contractVersionSnapshot(c), renderedHtml: html, sentTo: to, sentAt: new Date().toISOString() });
    saveContracts();
    if(supabaseClient && c._supabaseId && session){
      try{
        await supabaseClient.from('contract_versions').insert({
          contract_id: c._supabaseId, version_number: versionNumber, snapshot: contractVersionSnapshot(c), rendered_html: html, sent_to: to, created_by: session.user.id,
        });
      } catch(err){ console.error('contract_versions sync failed', c.id, err); }
    }
    toast(`Contract sent to ${to}.`, 'success');
    S.showSendContractConfirm=false; S.sendContractForm={};

    if(wantsInvoice && S.qboStatus && S.qboStatus.connected && qboAmount>0 && !c.qboInvoiceId){
      try{
        const invResp = await fetch(`${SUPABASE_URL}/functions/v1/qbo-create-invoice`, {
          method: 'POST', headers: authHeaders,
          // eventId/contractId are intentionally omitted unless already migrated to real Supabase
          // rows (c._supabaseId) -- c.leadId/c.id are local string ids ("EV-1063"/"CT-123"), not
          // real UUIDs, and qbo_invoices.event_id/contract_id are uuid FK columns: sending a
          // non-UUID string would fail the whole insert (including the qbo_invoice_id tracking
          // the webhook actually keys off), not just leave those two fields blank.
          // One stable key per contract deposit invoice: QuickBooks ignores repeats of the same key, so a
          // retry or a second tab can't bill the client twice. Contract ids are per-browser counters, so
          // the exact creation time is part of the key to keep two browsers' "CT-12" apart.
          body: JSON.stringify({ clientName: c.snapshot.clientName||to, clientEmail: to, amount: qboAmount, description: qboDescription, contractId: c._supabaseId||null, idempotencyKey: `${String(c.id).replace(/[^A-Za-z0-9-]/g,'')}-${Date.parse(c.createdAt)||0}` }),
        });
        const invData = await invResp.json().catch(()=>({ ok:false, error:'Unexpected response from the server.' }));
        if(!invResp.ok || invData.ok===false){
          toast('Contract sent, but the QuickBooks invoice failed: ' + (invData.error||'unknown error'), 'system');
        } else {
          c.qboInvoiceId = invData.invoiceId||null; c.qboInvoiceDocNumber = invData.docNumber||null; c.updatedAt = new Date().toISOString(); saveContracts();
          toast(`QuickBooks invoice ${invData.docNumber?('#'+invData.docNumber):''} sent to ${to}.`, 'success');
        }
      } catch(err){
        toast('Contract sent, but the QuickBooks invoice failed: ' + String(err), 'system');
      }
    }

    // Calendar holds (ops automation spec item 2/4): "create calendar holds" is part of the same
    // bundled action, but Google Calendar OAuth (Phase 4) hasn't been built/connected yet -- report
    // that honestly as a skipped step rather than silently doing nothing or claiming it happened.
    // c.calendarHoldsStatus is the idempotency marker for once Phase 4 ships: a retry after Phase 4
    // goes live should attempt this step even though the email/invoice steps already succeeded.
    if(c.calendarHoldsStatus!=='created'){
      const calResult = await doCreateCalendarHoldsForContract(c);
      // Only 'created' is sticky (blocks a future retry) -- 'skipped'/'error' must NOT be, or a
      // contract sent once before Google Calendar was configured would never retry this step even
      // after it gets connected/mapped later, which defeats the point of resending.
      c.calendarHoldsStatus = calResult.status==='created' ? 'created' : null;
      c.updatedAt = new Date().toISOString(); saveContracts();
      if(calResult.detail) toast(calResult.detail, calResult.status==='error'? 'system' : (calResult.status==='skipped'?'system':'success'));
    }

    // Balance reminders: already live via ev.reminderIntervalDays, set at lead creation -- this
    // step just confirms that mechanism is active for the linked lead rather than building a
    // second one, per "reuse... reminders" in the spec's own instruction.
    const lead = c.leadId ? getEvent(c.leadId) : null;
    if(lead && !lead.unpaid) toast(`Balance reminders active — every ${lead.reminderIntervalDays} days until paid.`, 'system');
  } catch(err){
    toast('Could not send the email: ' + String(err), 'system');
  } finally {
    S.sendContractBusy = false; render();
  }
}

// Phase 4 (Google Calendar HOLD/CONFIRMED sync): calls the real gcal-create-hold Edge Function
// once Google Calendar is configured -- still honestly reports "not connected" or "not mapped"
// when either piece is missing, rather than pretending. UNVERIFIED beyond that: no real Google
// account was available in this environment to confirm the created/updated events look right.
async function doCreateCalendarHoldsForContract(c){
  if(!GOOGLE_CALENDAR_CLIENT_ID){
    return { status:'skipped', detail:'Contract sent, but calendar holds were skipped — Google Calendar isn\'t connected yet (Settings → Google Calendar Sync).' };
  }
  const lead = c.leadId ? getEvent(c.leadId) : null;
  if(!lead) return { status:'skipped', detail:'Contract sent, but calendar holds were skipped — no linked lead to create an event for.' };
  // Stopgap (2026-10-09 audit 4.5): gcal-create-hold keys its calendar_links on the events table's
  // uuid, but gigs here still have local ids ("EV-1063"). Sending one made every send create a
  // duplicate Google hold. Skip honestly until gigs live in the shared events table.
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(String(lead.id))) return { status:'skipped', detail:'Contract sent. Calendar holds are paused until gigs move to the shared database (each send would otherwise add a duplicate hold).' };
  if(!supabaseClient) return { status:'skipped', detail:'Calendar holds need a signed-in session.' };
  try{
    const { data: { session } } = await supabaseClient.auth.getSession();
    if(!session) return { status:'skipped', detail:'Calendar holds need a signed-in session.' };
    const artist = artistById(lead.artistId);
    const artistIds = [lead.artistId, ...(lead.additionalArtists||[]).map(x=>x.artistId)].filter(Boolean);
    const startISO = `${lead.date}T${(lead.time||'19:00')}:00`;
    const endISO = lead.endTime ? `${lead.date}T${lead.endTime}:00` : `${lead.date}T${addMinutesToTime(lead.time||'19:00', 180)}:00`;
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/gcal-create-hold`, {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'Authorization': `Bearer ${session.access_token}`, 'apikey': SUPABASE_PUBLISHABLE_KEY },
      body: JSON.stringify({
        eventId: lead.id, summary: `${artist?artist.name:''} — ${lead.type}${lead.venue?` @ ${lead.venue}`:''}`,
        description: `Client: ${lead.clientName||''}`, startISO, endISO, timezone:'America/New_York',
        status:'hold', artistIds,
      }),
    });
    const data = await resp.json().catch(()=>({ok:false, error:'Unexpected response from the server.'}));
    if(!resp.ok || data.ok===false) return { status:'error', detail: 'Contract sent, but calendar holds failed: ' + (data.error||'unknown error') };
    const skipped = data.results.filter(r=>r.status==='skipped_not_mapped').length;
    const done = data.results.filter(r=>r.status==='created'||r.status==='updated').length;
    const errored = data.results.filter(r=>r.status==='error').length;
    if(errored) return { status:'error', detail: `Contract sent, but ${errored} calendar hold(s) failed.` };
    return { status: done? 'created' : 'skipped', detail: done? `Calendar hold created/updated on ${done} calendar(s)${skipped?`, ${skipped} not mapped`:''}.` : 'Contract sent, but calendar holds were skipped — no calendars mapped yet for this artist/ASP main.' };
  } catch(err){
    return { status:'error', detail: 'Contract sent, but calendar holds failed: ' + String(err) };
  }
}

// Navigation/data-layer refactor (PR 18): used to ship pre-seeded with 3 fake Demo Mode entries
// whose `id` was the literal role string ('admin_ceo' etc.) -- the exact same id a REAL admin
// session used then (linkRealSessionToRoster set S.user = adminRow.role). Since the push-if-missing
// check there keys on that same id, a real admin's session was silently shadowed by the demo
// entry's name/email instead of showing the real signed-in person (confirmed live: a real test
// account with role admin_bookings displayed as "ASP Office — Bookings" / bookings@aspmanagement.com,
// not its own real name). Starts empty now -- every real admin's entry is populated the first
// time they actually sign in, which is the only path left now that Demo Mode is gone.
const ADMIN_USERS = [];
// Admins are identified by their admin_users uuid (audit 3.7) -- the role is a separate field, so two
// admins with the same role stay two people. Records saved before 2026-10-11 stored the role slug
// ('admin_bookings') as the person; those still resolve, to an admin holding that role.
const adminById = (id)=>id ? (ADMIN_USERS.find(u=>u.id===id) || ADMIN_USERS.find(u=>u.role===id)) : undefined;
const isAdminUser = (id)=>!!adminById(id);
const adminRoleOf = (id)=>(adminById(id)||{}).role || null;
// Is this stored person reference the signed-in user? (their uuid, or a legacy role slug of theirs)
const isMeRef = (ref)=>!!ref && (ref===S.user || (isAdminUser(S.user) && ref===adminRoleOf(S.user) && !ADMIN_USERS.some(u=>u.id===ref)));

/* ============ ORG SETTINGS (ops automation spec: "never hardcoded" integration addresses) ============ */
// ASP-wide (not per-user) config that isn't tied to any one integration's own table -- currently
// just Rivky's real travel-booking email. Kept in its own tiny collection rather than folding into
// per-user getUserSettings() since this is an office-wide fact, not a personal preference.
const ORG_SETTINGS_LS_KEY = 'asp_mock_org_settings_v1';
// Venues the office books (owner 2026-10-15 sent the list): name + street, city, state, zip. The office's
// shared copy (app_records settings 'venues') wins at sign-in; this browser keeps a cache. New venues typed
// on a lead are added, so the list grows with use.
const VENUES_LS_KEY = 'asp_mock_venues_v1';
let VENUES = (()=>{ try{ return JSON.parse(localStorage.getItem(VENUES_LS_KEY)||'[]') || []; }catch(e){ return []; } })();
function saveVenues(){ const r = persist(VENUES_LS_KEY, VENUES, 'venues'); if(typeof SHARED!=='undefined' && SHARED) SHARED.settings.schedule(); return r; }
function findVenue(name){ const n = String(name||'').trim().toLowerCase(); return n ? VENUES.find(v=>v.name.toLowerCase()===n) : null; }
// Remember a venue the office typed with its address (case-insensitive by name; never overwrites a known one).
function rememberVenue(f){
  const name = String(f.venue||'').trim(); if(!name || findVenue(name) || !(f.address||'').trim() || !(f.city||'').trim()) return;
  VENUES.push({ name, address:String(f.address).trim(), city:String(f.city).trim(), state:String(f.state||'').trim(), zip:'' });
  VENUES.sort((a,b)=>a.name.localeCompare(b.name)); saveVenues();
}
// A venue the list doesn't know: look its address up on the web (venue-lookup, owner 2026-10-29: "why does it
// not auto fill address"). Fills only empty fields, fixes the name's spelling, and remembers the venue.
async function doVenueLookup(el){
  const formName = (el.closest('[data-form]')||{dataset:{}}).dataset.form;
  const target = formName==='lead' ? S.newLeadForm : formName==='editevent' ? S.editEventForm : null;
  // (The page may redraw while the lookup runs, so the fields are found again afterwards.)
  const q = k => document.querySelector(`[data-form="${formName}"] [data-field="${k}"]`);
  const name = el.value.trim();
  if(!target || name.length < 3 || findVenue(name) || String(target.address||'').trim() || S.venueLookupFor===name) return;
  S.venueLookupFor = name;
  if(q('address')) q('address').placeholder = 'Looking up the address…';
  const res = await callEdgeFunction('venue-lookup', { venue:name, city:target.city||'' });
  if(q('address')) q('address').placeholder = 'Street address';
  const live = formName==='lead' ? S.newLeadForm : S.editEventForm;
  if(live!==target || String(target.venue||'').trim()!==name || String(target.address||'').trim()) return;
  if(!res.ok){ toast('Address lookup failed: ' + (res.error||'unknown'), 'system'); return; }
  if(!res.found){ toast(`Couldn't find an address for "${name}" — type it in.`, 'system'); return; }
  const v = res.venue;
  const fill = { venue:v.name || name, address:[v.address, v.zip && !v.state ? v.zip : ''].filter(Boolean).join(' '), city:v.city, state:v.state };
  Object.entries(fill).forEach(([k,val])=>{
    if(!val || (k!=='venue' && String(target[k]||'').trim())) return;
    target[k] = val; const inp = q(k); if(inp) inp.value = val;
  });
  rememberVenue(target);
  toast(`Found ${fill.venue}: ${[v.address, v.city, v.state].filter(Boolean).join(', ')}. Check it before saving.`, 'success');
}
function bindVenueLookup(){
  document.querySelectorAll('[data-form="lead"] [data-field="venue"], [data-form="editevent"] [data-field="venue"]').forEach(el=>{
    el.addEventListener('change', ()=>doVenueLookup(el));
  });
}
function venueDatalistHtml(){ return `<datalist id="venueList">${VENUES.map(v=>`<option value="${esc(v.name)}">${esc([v.address, v.city].filter(Boolean).join(', '))}</option>`).join('')}</datalist>`; }
function loadOrgSettings(){ try{ const raw = localStorage.getItem(ORG_SETTINGS_LS_KEY); if(raw) return JSON.parse(raw); }catch(e){} return null; }
function saveOrgSettings(){ const r = persist(ORG_SETTINGS_LS_KEY, ORG_SETTINGS, 'office settings'); if(SHARED) SHARED.settings.schedule(); return r; }
let ORG_SETTINGS = loadOrgSettings();
if(!ORG_SETTINGS) ORG_SETTINGS = { rivkyEmail:'' };
if(ORG_SETTINGS.rivkyEmail===undefined) ORG_SETTINGS.rivkyEmail='';

/* ============ TRAVEL REQUESTS (Rivky workflow, ops automation spec item 7) ============ */
// Draft -> reviewed -> sent -> answered/completed flow for requesting flights/hotel/ground
// transport from ASP's travel booker. Never sent until an admin reviews it and Rivky's real email
// is configured in Settings (org-wide, never hardcoded -- see ORG_SETTINGS above). Reuses the
// existing send-contract-email Edge Function to actually send (it's a generic "send this HTML to
// this address" function, nothing contract-specific about it, so no second email function was
// needed). Automatic reply-monitoring/parsing would need Gmail API access (blocked on credentials,
// same as Phase 6) -- this pass covers manual status tracking + a manual follow-up resend instead
// of pretending to watch Rivky's inbox.
const TRAVEL_REQUESTS_LS_KEY = 'asp_mock_travel_requests_v1';
let TRVID = 1;
function loadTravelRequests(){ try{ const raw = localStorage.getItem(TRAVEL_REQUESTS_LS_KEY); if(raw) return JSON.parse(raw); }catch(e){} return null; }
function saveTravelRequests(){ const r = persist(TRAVEL_REQUESTS_LS_KEY, TRAVEL_REQUESTS, 'travel requests'); if(SHARED) SHARED.travel_requests.schedule(); return r; }
let TRAVEL_REQUESTS = loadTravelRequests();
if(!TRAVEL_REQUESTS) TRAVEL_REQUESTS = [];
TRVID = TRAVEL_REQUESTS.reduce((m,t)=>Math.max(m, Number((t.id||'TRV-0').split('-')[1])||0), 0) + 1;
function getTravelRequest(id){ return TRAVEL_REQUESTS.find(t=>t.id===id); }
function travelRequestsForEvent(eventId){ return TRAVEL_REQUESTS.filter(t=>t.eventId===eventId); }
function travelRequestStatusLabel(s){ return {draft:'Draft', sent:'Sent to Rivky', awaiting_reply:'Awaiting Reply', answered:'Answered', completed:'Completed'}[s] || s; }
function doCreateTravelRequest(eventId){
  const tr = makeTravelRequest(eventId); if(!tr) return;
  S.showTravelRequestDetail=true; S.travelRequestDetailId=tr.id;
  render();
}
// "Flight needed" emails Rivky on its own (owner 2026-10-14): one travel request per gig, created
// and sent the moment the flag is set. Skipped when one was already sent; when Rivky's email isn't
// set (Settings) the request is still created and the office is told.
async function autoRequestFlight(eventId){
  const existing = travelRequestsForEvent(eventId);
  if(existing.some(t=>t.sentAt)) return;
  const tr = existing[0] || makeTravelRequest(eventId); if(!tr) return;
  render(); // the gig sheet now shows the request
  if(!ORG_SETTINGS.rivkyEmail){ toast('Travel request created — set Rivky\'s email in Settings so it sends automatically.', 'system'); return; }
  await doSendTravelRequest(tr.id);
}
function travelRequestFromContract(eventId){
  const c = contractsForLead(eventId).find(x=>x.status!=='void');
  const t = c && c.travelClause;
  const plural = (n,w)=>`${n} ${w}${n===1?'':'s'}`;
  if(!t || !(t.flightsCount>0 || t.hotelRooms>0 || t.hotelNights>0)){
    return { flightClass:'business', flightQty:1, hotelNeeded:true, hotelPrefs:'1 room — nights to match the trip' };
  }
  const rooms = Number(t.hotelRooms)||0, nights = Number(t.hotelNights)||0;
  const extras = [t.shabbos && 'Shabbos accommodation', t.food && 'food'].filter(Boolean);
  return {
    flightClass: t.flightsClass || 'business', flightQty: Number(t.flightsCount)||0,
    hotelNeeded: rooms>0 || nights>0,
    hotelPrefs: rooms>0 || nights>0 ? [rooms? plural(rooms,'room') : '1 room', nights? plural(nights,'night') : 'nights to match the trip', ...extras].join(', ') : '',
    ...(t.groundTransport ? { groundTransportNeeded:true } : {}),
  };
}
function makeTravelRequest(eventId){
  const ev = getEvent(eventId); if(!ev) return null;
  const artist = artistById(ev.artistId);
  const tr = {
    id:'TRV-'+(TRVID++), eventId, status:'draft', createdAt:new Date().toISOString(),
    details: {
      passengers: artist? artist.name : '', eventDate: ev.date||'', eventTime: ev.time||'', eventTimezone: 'America/New_York',
      venue: ev.venue||'', city: ev.city||'', state: ev.state||'',
      origin:'', destination:'', arriveBy:'', departAfter:'',
      // The contract's Travel section, when there is one, decides what Rivky books (owner 2026-10-15:
      // "hotels have to be part of the travel requests to rivky"): class, flights, hotel rooms + nights, extras.
      groundTransportNeeded: !!ev.groundTransportNeeded, groundTransportNotes:'',
      ...travelRequestFromContract(eventId),
      notes:'',
    },
    sentAt:null, gmailThreadId:null, gmailMessageId:null, followUpAt:null, owner: S.user,
    flightSegments: [],
  };
  TRAVEL_REQUESTS.unshift(tr); saveTravelRequests();
  return tr;
}
// Flight tracking (ops automation spec item 8). No auto-extraction from Rivky's reply yet (needs
// Gmail, blocked same as Phase 6) -- admin enters confirmed details by hand once known through any
// channel, which the spec's own "admin approves parsed details" step already requires regardless
// of how they were sourced. "Check Status" calls the flightaware-status adapter for real once
// FLIGHTAWARE_API_KEY is configured; until then it reports that plainly rather than pretending.
function doAddFlightSegment(trId){
  const tr = getTravelRequest(trId); if(!tr) return;
  tr.flightSegments = tr.flightSegments||[];
  tr.flightSegments.push({ id:'FLT-'+Math.random().toString(36).slice(2,7), airline:'', flightNumber:'', confirmationCode:'', departureAirport:'', arrivalAirport:'', departureAt:'', arrivalAt:'', lastStatus:null, lastStatusAt:null });
  saveTravelRequests(); render();
}
function doRemoveFlightSegment(trId, segId){
  const tr = getTravelRequest(trId); if(!tr) return;
  tr.flightSegments = (tr.flightSegments||[]).filter(s=>s.id!==segId);
  saveTravelRequests(); render();
}
function setFlightSegmentFieldByPath(tr, segId, field, value){
  const seg = (tr.flightSegments||[]).find(s=>s.id===segId); if(!seg) return;
  seg[field] = value;
}
// The one real flight-status lookup (FlightAware via the flightaware-status Edge Function). Both
// the travel-request segment button and the event-sheet flight card use it. date (YYYY-MM-DD)
// picks the right leg of a flight number that repeats daily. Requires a real session -- never
// falls back to the publishable key as a bearer token.
async function fetchFlightStatus(ident, date){
  if(!supabaseClient) return { ok:false, error:'Sign in to check flight status.' };
  const { data: { session } } = await supabaseClient.auth.getSession();
  if(!session) return { ok:false, error:'Sign in to check flight status.' };
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/flightaware-status`, {
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'Authorization': `Bearer ${session.access_token}`, 'apikey': SUPABASE_PUBLISHABLE_KEY },
    body: JSON.stringify({ ident, date: date || undefined }),
  });
  const data = await resp.json().catch(()=>({ok:false, error:'Unexpected response from the server.'}));
  return (!resp.ok || data.ok===false) ? { ok:false, error: data.error || 'Could not check flight status.' } : data;
}
async function doCheckSegmentFlightStatus(trId, segId){
  const tr = getTravelRequest(trId); if(!tr) return;
  const seg = (tr.flightSegments||[]).find(s=>s.id===segId); if(!seg) return;
  if(!seg.airline || !seg.flightNumber){ toast('Enter the airline and flight number first.', 'system'); return; }
  S.flightStatusBusy = segId; render();
  try{
    const data = await fetchFlightStatus(`${seg.airline}${seg.flightNumber}`.replace(/\s+/g,''), (seg.departureAt||'').slice(0,10));
    if(!data.ok){ toast(data.error, 'system'); return; }
    seg.lastStatus = data.status || (data.cancelled? 'Cancelled' : null);
    seg.lastStatusAt = new Date().toISOString();
    saveTravelRequests();
    toast(`Status: ${seg.lastStatus||'unknown'}.`, 'success');
  } catch(err){
    toast('Could not check flight status: ' + String(err), 'system');
  } finally {
    S.flightStatusBusy = null; render();
  }
}
function setTravelRequestFieldByPath(tr, path, value){
  const parts = path.split('.');
  if(parts[0]==='details'){ tr.details[parts[1]] = value; }
}
function travelRequestEmailHtml(tr){
  const ev = getEvent(tr.eventId);
  const brand = getBrandConfig('asp');
  const d = tr.details;
  const rows = [
    ['Passenger(s)', d.passengers], ['Event Date', d.eventDate], ['Event Time', `${d.eventTime||''} ${d.eventTimezone||''}`],
    ['Venue', [d.venue, d.city, d.state].filter(Boolean).join(', ')],
    ['Origin', d.origin], ['Destination', d.destination],
    ['Arrive By', d.arriveBy], ['Depart After', d.departAfter],
    ['Flight Class', d.flightClass], ['Flight Qty', d.flightQty],
    ['Hotel Needed', d.hotelNeeded? (d.hotelPrefs||'Yes') : 'No'],
    ['Ground Transport', d.groundTransportNeeded? (d.groundTransportNotes||'Yes') : 'No'],
  ].filter(([,v])=>v);
  return `<!doctype html><html><head><meta charset="utf-8"/><style>
    body{ margin:0; padding:24px; background:#F5F4EF; font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif; color:#17171A; }
    .doc{ max-width:600px; margin:0 auto; background:#fff; padding:28px; border-radius:10px; }
    .wordmark{ font-size:1.1rem; font-weight:700; border-bottom:2px solid #17171A; padding-bottom:14px; margin-bottom:18px; }
    .doc-facts{ display:table; width:100%; font-size:13px; }
    .doc-facts > div{ display:table-row; }
    .doc-facts .k{ display:table-cell; font-size:10.5px; text-transform:uppercase; letter-spacing:.06em; color:#9A9AA1; font-weight:700; padding:5px 12px 5px 0; white-space:nowrap; vertical-align:top; }
    .doc-facts > div > span:last-child{ display:table-cell; padding:5px 0; }
    .doc-foot{ margin-top:22px; padding-top:12px; border-top:1px solid #E1E1E6; font-size:10.5px; color:#9A9AA1; }
  </style></head><body><div class="doc">
    <div class="wordmark">${brandLogoEmailHtml(170)}<div style="margin-top:8px;">Travel Request</div></div>
    <p style="font-size:13.5px;">Hi Rivky, could you help arrange travel for the following${ev?` (${esc(ev.type)})`:''}?</p>
    <div class="doc-facts">${rows.map(([k,v])=>`<div><span class="k">${esc(k)}</span><span>${esc(String(v))}</span></div>`).join('')}</div>
    ${d.notes? `<p style="font-size:13px;margin-top:16px;"><strong>Notes:</strong> ${esc(d.notes)}</p>` : ''}
    <div class="doc-foot">Sent from ${esc(brand.label||'ASP')} Bookings.</div>
  </div></body></html>`;
}
// Self-contained (no CSS custom properties -- those only exist inside the app's own stylesheet,
// not in a standalone outbound email) equivalent of renderZelleQrBlock() for real emails. Same
// zelleProfileForEvent() resolution, so "never cross-send one artist's QR to another" holds here
// exactly as it does in the in-app preview.
function zelleQrEmailBlock(ev, artist){
  const payee = zellePayeeFor(ev);
  if(!payee) return '';
  const profile = payee.profile;
  const usingRealQr = !!profile.zelleQrDataUrl;
  const label = payee.label;
  return `<div style="text-align:center;padding:16px;background:#F5F4EF;border-radius:10px;margin:16px 0;">
    <img src="${usingRealQr? safeDataUrl(profile.zelleQrDataUrl) : esc(zelleQrUrl(ev,artist,profile))}" alt="Zelle QR code" width="180" height="180" style="border-radius:8px;background:#fff;padding:8px;"/>
    <div style="font-size:11.5px;color:#67676D;margin-top:8px;">${esc(label)}</div>
    ${profile && profile.zelleInstructions? `<div style="font-size:11px;color:#9A9AA1;margin-top:4px;">${esc(profile.zelleInstructions)}</div>` : ''}
  </div>`;
}
/* ---- The client payment section (owner 2026-10-14; mockup "ASP Payment Mockup") ----
   One look wherever a client is asked to pay (contract, invoice, booking confirmation, reminders):
     1. Pay online (card or bank transfer): the main button, when there's a link;
     2. Zelle: "Scan here to pay the deposit/balance", with the right account's QR -- ASP's for
        deposits and invoices (Settings → Online payments), the artist's payee profile for balances;
     3. one footnote line: to pay by check or cash, call the office.
   Inline styles and plain blocks only, so it survives email clients. The server's twin for scheduled
   emails is supabase/functions/_shared/payblock.ts -- keep the two in step. */
function paymentOptionsEmailBlock({ kind='deposit', payUrl=null, amount=null, memo='', zelle=null }){
  // Zelle on the back burner (owner 2026-10-29: "process everything through stripe and mercury"): Settings →
  // Online payments → "Don't offer Zelle". Server twin: _shared/payblock.ts.
  if(ORG_SETTINGS.zelleOff) zelle = null;
  const what = kind==='balance' ? 'the balance' : kind==='invoice' ? 'this invoice' : 'the deposit';
  const amt = amount ? ` ${moneyCents(amount)}` : '';
  const phone = getBrandConfig('asp').phone;
  const label = kind==='invoice' ? `Pay${amt} online` : `Pay ${what}${amt ? ' of'+amt : ''} online`;
  const button = payUrl ? `<div style="text-align:center;margin:0 0 6px;"><a href="${esc(payUrl)}" style="display:inline-block;background:#4C6FA5;color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:8px;">${label}</a></div>
    <p style="text-align:center;font-size:11.5px;color:#67676D;margin:0 0 14px;">Card or bank transfer. No fee for bank transfer or debit cards.</p>` : '';
  const qr = zelle && /^https:\/\//.test(zelle.qrUrl||'') ? esc(zelle.qrUrl) : '';
  const memoLine = memo ? ` Put “${esc(memo)}” in the memo so we can match your payment.` : '';
  const heading = qr ? `${payUrl?'Or scan':'Scan'} here to pay ${what} with Zelle` : `${payUrl?'Or pay':'Pay'} ${what} with Zelle`;
  const zelleBox = !zelle || (!qr && !zelle.handle) ? '' : `<table role="presentation" style="width:100%;border-collapse:separate;border:1px solid #E1E1E6;border-radius:10px;margin:0 0 10px;"><tr>
      ${qr ? `<td style="width:132px;padding:12px;vertical-align:middle;"><img src="${qr}" alt="Zelle QR code" width="120" height="120" style="display:block;width:120px;height:120px;border-radius:6px;background:#fff;"/></td>` : ''}
      <td style="padding:12px;vertical-align:middle;font-size:13px;color:#67676D;line-height:1.5;">
        <strong style="display:block;color:#17171A;font-size:14px;margin-bottom:2px;">${heading}</strong>
        ${qr ? 'Open your bank app, choose Zelle, and scan.' : `Send it with Zelle to <strong style="color:#17171A;">${esc(zelle.handle)}</strong>.`}${memoLine}
        ${zelle.note ? `<div style="margin-top:4px;font-size:12px;color:#9A9AA1;">${esc(zelle.note)}</div>` : ''}
      </td></tr></table>`;
  const foot = !payUrl && !zelleBox
    ? `<p style="font-size:12.5px;color:#67676D;margin:0;">To pay, please call our office${phone?` at ${esc(phone)}`:''}, or use the Pay online link in our email.</p>`
    : `<p style="font-size:11.5px;color:#9A9AA1;margin:0;">* To pay by check or cash, please call our office${phone?` at ${esc(phone)}`:''}.</p>`;
  return `<div class="pay-options" style="margin:18px 0 0;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;">${button}${zelleBox}${foot}</div>`;
}
// Zelle for deposits and invoices: ASP's own (Settings → Online payments), else ASP's house payee
// profile. Never the artist's: the deposit (ASP's fee) goes to ASP -- creative/video contracts' too
// (owner 2026-10-16) -- and only the balance goes to the artist.
function aspHousePayeeProfile(){ return PAYEE_PROFILES.find(x=>!x.artistId && /^ASP\b/i.test(x.entityName||'')) || null; }
function depositZelle(){
  const qrUrl = ORG_SETTINGS.depositZelleQrUrl || null, handle = (ORG_SETTINGS.depositZelleHandle||'').trim();
  if(qrUrl || handle) return { qrUrl, handle, label: handle };
  const p = aspHousePayeeProfile();
  if(p && p.zelleActive!==false && (p.zelle || p.zelleQrUrl)) return { qrUrl: p.zelleQrUrl||null, handle: p.zelle||'', label: p.zelleRecipientLabel||p.zelle||'' };
  return null;
}
// Zelle for a gig's balance: the artist's payee profile (never another artist's -- zellePayeeFor).
// A gig with several artists gets none: one Zelle can't split its balance (the client pays online, or calls).
function balanceZelle(ev){
  if(gigExtraArtists(ev).length) return null;
  const payee = zellePayeeFor(ev); if(!payee) return null;
  const prof = payee.profile;
  // Only the public copy (https): an email can't show an image embedded as data:, so without one the
  // client gets the Zelle address instead.
  const qrUrl = /^https:\/\//.test(prof.zelleQrUrl||'') ? prof.zelleQrUrl : null;
  return { qrUrl, handle: payee.identifier, label: payee.label, note: prof.zelleInstructions||'' };
}
// Puts an image the office uploads (a Zelle QR) in the public "brand-public" store (0059) and returns
// its https:// address: email clients won't show images embedded in the message itself.
async function uploadBrandImage(file, prefix){
  if(!supabaseClient || !S.realSession) return { ok:false, error:'Sign in with your ASP account to upload.' };
  if(!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) return { ok:false, error:'Upload a PNG, JPG, WebP or GIF image.' };
  if(file.size > 2*1024*1024) return { ok:false, error:'That image is over 2 MB — use a smaller one.' };
  const ext = { 'image/png':'png', 'image/jpeg':'jpg', 'image/webp':'webp', 'image/gif':'gif' }[file.type];
  const path = `${prefix}-${crypto.randomUUID()}.${ext}`;   // unguessable: QRs carry a Zelle email/phone
  const { error } = await supabaseClient.storage.from('brand-public').upload(path, file, { contentType:file.type, upsert:false });
  if(error) return { ok:false, error:'Upload failed: ' + error.message };
  return { ok:true, url: supabaseClient.storage.from('brand-public').getPublicUrl(path).data.publicUrl };
}
function gigPaymentMemo(ev){ return `${ev.clientName||'Event'} ${fmtDateShort(ev.date)}`.trim(); }
// Client-facing notice emails (booking confirmation + balance reminder, ops automation spec item
// 5): same branded wrapper as travelRequestEmailHtml, parameterized by the one paragraph that
// actually differs between the two.
function clientNoticeEmailHtml(ev, artist, introHtml, payUrl){
  const brand = getBrandConfig('asp');
  const balance = clientBalanceDue(ev);
  return `<!doctype html><html><head><meta charset="utf-8"/><style>
    body{ margin:0; padding:24px; background:#F5F4EF; font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif; color:#17171A; }
    .doc{ max-width:560px; margin:0 auto; background:#fff; padding:28px; border-radius:10px; }
    .wordmark{ font-size:1.1rem; font-weight:700; border-bottom:2px solid #17171A; padding-bottom:14px; margin-bottom:18px; }
    .doc-foot{ margin-top:22px; padding-top:12px; border-top:1px solid #E1E1E6; font-size:10.5px; color:#9A9AA1; }
  </style></head><body><div class="doc">
    <div class="wordmark">${brandLogoEmailHtml(170)}</div>
    ${introHtml}
    ${hasLocation(ev)? `<p style="margin:0 0 8px;font-size:13px;">Venue: ${esc(fullLocation(ev))} — <a href="${gmapsUrl(ev)}" target="_blank" rel="noopener" style="color:#4C6FA5;">Open in Maps</a></p>` : ''}
    ${isStandardPayment(ev) && balance>0 ? paymentOptionsEmailBlock({ kind:'balance', payUrl, amount:balance, memo:gigPaymentMemo(ev), zelle:balanceZelle(ev) }) : ''}
    <div class="doc-foot">Sent from ${esc(brand.label||'ASP')}. Remaining balance: ${money(balance)}.</div>
  </div></body></html>`;
}
// The one way the app sends email: the send-contract-email Edge Function (admin-only). The sender
// name and reply-to come server-side from brand_config for `brand`. Requires a real session --
// signed out, supabaseClient still exists but a request would only fail (audit 5.5). Returns {ok, error}.
async function sendEmail({ to, subject, html, brand }){
  if(!supabaseClient) return { ok:false, error:'Sign in with your ASP account to send email.' };
  const { data: { session } } = await supabaseClient.auth.getSession();
  if(!session) return { ok:false, error:'Your sign-in has expired — sign in again to send email.' };
  try{
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/send-contract-email`, {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'Authorization': `Bearer ${session.access_token}`, 'apikey': SUPABASE_PUBLISHABLE_KEY },
      body: JSON.stringify({ to, subject, html, brand: BRAND_FALLBACK[brand] ? brand : 'asp' }),
    });
    const data = await resp.json().catch(()=>({ ok:false, error:'Unexpected response from the server.' }));
    if(!resp.ok || data.ok===false) return { ok:false, error: data.error || 'Could not send the email.' };
    return { ok:true };
  }catch(err){ return { ok:false, error:'Could not reach the email service: ' + String(err && err.message || err) }; }
}
function sendClientNoticeEmail(ev, subject, html){ return sendEmail({ to: ev.clientEmail, subject, html, brand:'asp' }); }
// Fires automatically right after a deposit is marked received (doMarkDeposit) -- "after verified
// payment... send an ASP-branded confirmation with balance + QR for the correct payee" (item 5).
// Also reachable manually via a Resend button on the preview, per "manual resend + audit log."
// How the client pays the balance, for the emails' sentence: online first when there's a link.
function balanceHowSentence(ev, payUrl){
  if(!isStandardPayment(ev)) return ` (${esc(paymentMethodLabel(ev))})`;
  if(payUrl) return ` — pay online with the button below${balanceZelle(ev)?', or by Zelle':''}`;
  return gigExtraArtists(ev).length ? ' — please contact our office for how to pay' : zellePaymentSentence(ev);
}
function bookingConfirmationIntroHtml(ev, artist, balance, payUrl){
  return `<p style="margin:0 0 8px;">Hi ${esc((ev.clientName||'').split(' ')[0])},</p>
    <p style="margin:0 0 8px;">You're all set — ${esc(artist.name)} is booked for your ${esc(ev.type)} on ${esc(fmtDate(ev.date))}${ev.time && ev.time!=='00:00' ? ` at ${esc(fmtTime(ev.time))}` : ''}.</p>
    <p style="margin:0 0 8px;">Remaining balance of ${money(balance)} is due before the event${balanceHowSentence(ev, payUrl)}.</p>`;
}
function reminderIntroHtml(ev, artist, balance, payUrl){
  return `<p style="margin:0 0 8px;">Hi ${esc((ev.clientName||'').split(' ')[0])},</p>
    <p style="margin:0 0 8px;">Just a reminder — the remaining balance of ${money(balance)} for ${esc(artist.name)}'s ${esc(ev.type)} on ${esc(fmtDate(ev.date))} is due${balanceHowSentence(ev, payUrl)}.</p>`;
}
async function doSendBookingConfirmationEmail(id){
  const ev = getEvent(id); if(!ev) return;
  const artist = artistById(ev.artistId);
  const balance = clientBalanceDue(ev);
  const subject = `You're booked! — ${artist.name}, ${fmtDateShort(ev.date)}`;
  S.bookingConfirmationBusy = true; render();
  const payUrl = await balancePayUrl(ev);
  const intro = bookingConfirmationIntroHtml(ev, artist, balance, payUrl);
  const html = clientNoticeEmailHtml(ev, artist, intro, payUrl);
  const result = await sendClientNoticeEmail(ev, subject, html);
  S.bookingConfirmationBusy = false;
  if(result.ok){
    logEvent(ev,'email',`Booking confirmation emailed to ${ev.clientEmail} (balance ${money(balance)}).`);
    if(reportEventSave(updateEvent(id, { bookingConfirmationSentAt: new Date().toISOString() }), 'sending the booking confirmation')) toast('Booking confirmation sent.', 'success');
  } else {
    logEvent(ev,'system',`Booking confirmation email failed: ${result.error}`);
    reportEventSave(updateEvent(id, {}), 'sending the booking confirmation');
    toast('Could not send booking confirmation: ' + result.error, 'system');
  }
  render();
}
async function doSendReminderEmail(id){
  const ev = getEvent(id); if(!ev) return;
  const artist = artistById(ev.artistId);
  const balance = clientBalanceDue(ev);
  const subject = `Balance reminder — ${artist.name}, ${fmtDateShort(ev.date)}`;
  S.reminderBusy = true; render();
  const payUrl = await balancePayUrl(ev);
  const intro = reminderIntroHtml(ev, artist, balance, payUrl);
  const html = clientNoticeEmailHtml(ev, artist, intro, payUrl);
  const result = await sendClientNoticeEmail(ev, subject, html);
  S.reminderBusy = false;
  if(result.ok){
    logEvent(ev,'email',`Balance reminder emailed to ${ev.clientEmail}.`);
    if(reportEventSave(updateEvent(id, { lastReminderSent: todayISO() }), 'sending the reminder')) toast('Reminder sent.', 'success');
  } else {
    logEvent(ev,'system',`Balance reminder email failed: ${result.error}`);
    reportEventSave(updateEvent(id, {}), 'sending the reminder');
    toast('Could not send reminder: ' + result.error, 'system');
  }
  render();
}
async function doSendTravelRequest(id){
  const tr = getTravelRequest(id); if(!tr) return;
  if(!ORG_SETTINGS.rivkyEmail){ toast('Set Rivky\'s email in Settings first — it is never hardcoded.', 'system'); return; }
  if(!supabaseClient){ toast('Sign in with your ASP account to send email.', 'system'); return; }
  S.travelRequestBusy = true; render();
  try{
    const ev = getEvent(tr.eventId);
    const html = travelRequestEmailHtml(tr);
    const subject = `Travel Request — ${ev? (artistById(ev.artistId)||{}).name||'' : ''}${tr.details.eventDate? ` (${fmtDateShort(tr.details.eventDate)})`:''}`;
    const sent = await sendEmail({ to: ORG_SETTINGS.rivkyEmail, subject, html, brand:'asp' });
    if(!sent.ok){ toast(sent.error || 'Could not send the travel request.', 'system'); return; }
    tr.status='sent'; tr.sentAt=new Date().toISOString(); saveTravelRequests();
    if(ev){ logEvent(ev, 'system', `Travel request sent to Rivky (${ORG_SETTINGS.rivkyEmail}).`); reportEventSave(updateEvent(ev.id, {}), 'sending the travel request'); }
    toast(`Travel request sent to ${ORG_SETTINGS.rivkyEmail}.`, 'success');
  } catch(err){
    toast('Could not send the travel request: ' + String(err), 'system');
  } finally {
    S.travelRequestBusy = false; render();
  }
}
function doSetTravelRequestStatus(id, status){
  const tr = getTravelRequest(id); if(!tr) return;
  tr.status = status; saveTravelRequests();
  const ev = getEvent(tr.eventId);
  if(ev){ logEvent(ev, 'system', `Travel request marked ${travelRequestStatusLabel(status)}.`); reportEventSave(updateEvent(ev.id, {}), 'updating the travel request status'); }
  render();
}
function doDeleteTravelRequest(id){
  TRAVEL_REQUESTS = TRAVEL_REQUESTS.filter(t=>t.id!==id);
  saveTravelRequests();
  S.showTravelRequestDetail=false; S.travelRequestDetailId=null;
  render();
}

/* ============ PRICING ============ */
const PRICING_LS_KEY = 'asp_mock_pricing_v1';
function seedPricing(){
  const p = {};
  ARTISTS.forEach(a=>{
    p[a.id] = {};
    EVENT_TYPES.forEach((type,i)=>{
      p[a.id][type] = { hourlyRate: 300 + a.slot*35 + i*15, includedHours: 2 };
    });
  });
  return p;
}
function loadPricing(){ try{ const raw = localStorage.getItem(PRICING_LS_KEY); if(raw) return JSON.parse(raw); }catch(e){} return null; }
function savePricing(){ const r = persist(PRICING_LS_KEY, PRICING, 'pricing'); if(SHARED) SHARED.settings.schedule(); return r; }
let PRICING = loadPricing();
if(!PRICING) PRICING = seedPricing();
ARTISTS.forEach(a=>{ if(!PRICING[a.id]) PRICING[a.id] = {}; EVENT_TYPES.forEach((type,i)=>{ if(!PRICING[a.id][type]) PRICING[a.id][type] = { hourlyRate: 300 + a.slot*35 + i*15, includedHours: 2 }; }); });
savePricing();
function getPricing(artistId, type){ return (PRICING[artistId] && PRICING[artistId][type]) || { hourlyRate:0, includedHours:2 }; }
function applyStandardPricing(){
  const f = S.newLeadForm;
  if(!f.artistId || !f.type || f.type==='Other') return;
  const p = getPricing(f.artistId, f.type);
  if(p.hourlyRate) f.price = p.hourlyRate * p.includedHours;
  if(!f.endTimeManual) delete f.endTime; // re-derive from the new artist/type
}
// New Lead end time (owner 2026-10-13): start + the artist's included hours for that event type
// (Pricing page; 2 hours when nothing is set), until someone types an end time. "Time TBD" leaves
// both blank, and clearing the end time leaves only the end TBD.
const LEAD_DEFAULT_START = '19:00';
function leadDefaultEndTime(f){
  const hours = getPricing(f.artistId, f.type).includedHours || 2;
  return addMinutesToTime(f.time || LEAD_DEFAULT_START, Math.round(hours*60));
}
function leadEndTime(f){ return f.endTime!==undefined ? f.endTime : leadDefaultEndTime(f); }
function setPricing(artistId, type, patch){
  PRICING[artistId] = PRICING[artistId] || {};
  PRICING[artistId][type] = Object.assign({hourlyRate:0,includedHours:2}, PRICING[artistId][type], patch);
  savePricing();
}
const CHARGE_PRESETS = ['Travel','Flights','Hotel & Lodging','Sound & Production Rider','Musicians & Band','Other'];

function addDays(base, days){ const d=new Date(base); d.setDate(d.getDate()+days); return d; }
function fmtISO(d){ return d.toISOString().slice(0,10); }
// fmtISO() is the UTC date -- after ~8pm US Eastern it is already tomorrow. Anything a person
// would call "today" (gigs today, date stamps like "received on", reminders, last-seen) uses the
// local calendar date instead (2026-10-09 audit 4.4).
function localISO(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function todayISO(){ return localISO(new Date()); }
function money(n){ return '$'+Math.round(n).toLocaleString('en-US'); }
function chargesTotal(ev){ return (ev.charges||[]).reduce((s,c)=>s+c.amount,0); }
// Navigation/data-layer refactor (PR 12): ev.balance used to be a stored field, set once at
// creation and only recomputed inside the edit-event save handler -- every other balance/payout
// read across financials/dashboard/CSV-export consumed that possibly-stale stored value directly,
// which is exactly how the Financials page's "All Jobs" table came to silently disagree with its
// own "Artist Payouts" table (and "payouts" vs. "owedTotal" a few lines apart on the very same
// page) whenever an event had post-signing charges. eventBalance() replaces the stored field with
// a pure derivation (the same formula the edit-handler already used) -- there is nothing left to
// go stale. artistPayout(), the one place that already got this right, now composes on top of it.
function eventBalance(ev){ return (ev.price||0) - (ev.commission||0); }
// What the artist is owed for a gig: the balance after ASP's commission, plus any charges -- whatever
// the payment method (was named zelleBalance, though it applies to cash/check too; 2026-10-09 audit 6.8).
function artistPayout(ev){ return eventBalance(ev) + chargesTotal(ev); }
// What the CLIENT still owes for the whole gig: every artist's fee plus the gig's charges, less the
// deposit (owner 2026-10-16: multi-artist balances; EV-5020: a 25% contract deposit leaves less than
// fee-less-commission). artistPayout() stays the main artist's own figure. The server twin is
// clientOwedCentsOf() in supabase/functions/_shared/connect.ts -- keep the two in step.
function gigExtraArtists(ev){ return (ev.additionalArtists||[]).filter(x=>x && x.artistId); }
function gigAspCuts(ev){ return (Number(ev.commission)||0) + gigExtraArtists(ev).reduce((t,x)=>t + (Number(x.aspCut)||0), 0); }
function clientOwed(ev, deposit){ return artistPayout(ev) + gigExtraArtists(ev).reduce((t,x)=>t + (Number(x.feeAmount)||0) - (Number(x.aspCut)||0), 0) + gigAspCuts(ev) - deposit; }
// The deposit the gig's newest signed (else sent, else any live) contract asked for; without one, ASP's
// cut from every artist (the usual deposit). Money paid early on top of the deposit counts as deposit
// (owner 2026-10-27): once received, ev.depositPaid (everything in so far) replaces it -- the server
// twin is depositCentsOf() in _shared/connect.ts.
function gigDepositDue(ev){
  if(ev.depositReceived && Number(ev.depositPaid) > 0) return Number(ev.depositPaid);
  const live = contractsForLead(ev.id).filter(c=>c.status!=='void').sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
  const c = live.find(x=>x.status==='signed') || live.find(x=>x.status==='sent') || live[0];
  const d = c && c.fee && c.deposit ? contractPaymentFigures(c).deposit : 0;
  return d > 0 ? d : gigAspCuts(ev);
}
function clientBalanceDue(ev){ return clientOwed(ev, gigDepositDue(ev)); }
// The standard ASP booking fee / commission. Single owner of the rate (it was a 0.15 literal in 3
// places and "15%"/"85%" label text in 4 -- 2026-10-09 audit 3.8). Each gig still stores its own
// ev.commission, which can differ (negotiated), so labels show the real figures, not this rate.
const COMMISSION_RATE = 0.15;
// The artist's own rate when the roster has one (artists.commission_pct, migration 0042 -- owner
// decision 2026-10-12: 15%, Dovie 10%), else the standard rate. Prefills a gig's commission only.
function commissionRateFor(artistId){
  const a = artistId && artistById(artistId);
  const pct = a && Number(a.commissionPct);
  return (pct || pct===0) && !Number.isNaN(pct) ? pct/100 : COMMISSION_RATE;
}
function standardCommission(amount, artistId){ return Math.round((Number(amount)||0) * commissionRateFor(artistId)); }
// Shared chart/total helpers (were copied 3 times; one copy summed all-time under a "last 6 mo"
// label -- audit 2.16/3.10).
function lastNMonths(n){ const out=[]; for(let i=n-1;i>=0;i--){ const d=new Date(); d.setDate(1); d.setMonth(d.getMonth()-i); out.push(d); } return out; }
function sumByMonth(events, months, valueFn){
  return months.map(md=>events.filter(e=>{ const ed=new Date(e.date+'T00:00:00'); return ed.getMonth()===md.getMonth() && ed.getFullYear()===md.getFullYear(); }).reduce((s,e)=>s+valueFn(e),0));
}
// What an artist sees about their own money on a gig (owner decision 2026-10-11): the gig amount,
// ASP's fee with that gig's own percentage (it varies by artist -- never COMMISSION_RATE), and what
// they receive. Never an "owes" state: nothing negative, no receivables. Artist-portal rows carry
// the figures from artist_finance_view; a local gig derives them the same way the view does. A
// shared gig without the artist's own money row is "being confirmed" -- no numbers at all.
function artistMoney(ev){
  if(ev.moneyPending || (!ev.fromArtistPortal && (ev.additionalArtists||[]).length)) return { pending:true };
  const gross = Number(ev.price)||0, cut = Number(ev.commission)||0;
  const pct = ev.aspCutPct!=null ? ev.aspCutPct : (gross>0 ? Math.round(cut/gross*10000)/100 : null);
  const net = ev.fromArtistPortal ? Number(ev.netAmount)||0 : gross - cut;
  return { pending:false, gross, cut, pct, net: Math.max(0, net) };
}
function fmtPct(p){ return `${Number(Number(p).toFixed(2))}%`; }
// Artist-facing status: about the artist's money, never what a client still owes.
function artistGigStatus(ev){
  if(ev.fromCrewPortal) return ev.crewStatus==='pending' ? { label:'Pending contract', cls:'pill-neutral' } : { label: isPast(ev.date) ? 'Completed' : 'Booked', cls: isPast(ev.date) ? 'pill-neutral' : 'pill-accent' };
  if(ev.unpaid) return { label: isPast(ev.date) ? 'Completed' : 'Office day', cls:'pill-neutral' };
  if(ev.artistPaidOut) return { label: ev.artistPaidOutDate ? `Paid to you ${fmtDateShort(ev.artistPaidOutDate)}` : 'Paid to you', cls:'pill-good' };
  if(ev.balanceReceived) return { label:'Client balance received', cls:'pill-good' };
  if(artistMoney(ev).pending) return { label:'Amount being confirmed', cls:'pill-neutral' };
  return { label: isPast(ev.date) ? 'Completed' : 'Booked', cls: isPast(ev.date) ? 'pill-neutral' : 'pill-accent' };
}
// Paid to the artist this calendar year (by the payout date).
function artistPaidYtd(events){
  const year = todayISO().slice(0,4);
  return events.filter(e=>e.artistPaidOut && String(e.artistPaidOutDate||'').slice(0,4)===year)
    .reduce((s,e)=>{ const m = artistMoney(e); return s + (m.pending ? 0 : m.net); }, 0);
}
// Year-to-date by the date's own year (a date-only string parsed as a Date is UTC midnight, which
// put Jan 1 payments in the previous year in US time zones).
function ytdPayoutOf(events){ const year = todayISO().slice(0,4); return events.filter(e=>e.balanceReceived && String(e.balanceReceivedDate||'').slice(0,4)===year).reduce((s,e)=>s+artistPayout(e),0); }

let EVID = 1000;

// Gig list (2026-10-07): the 215 calendar-imported gigs were removed at Moshe's request, to be
// replaced by a fresh upcoming-gigs import. This is the seed for a fresh browser (seedAll()).
const REAL_IMPORTED_EVENTS = [];

function seedAll(){
  return JSON.parse(JSON.stringify(REAL_IMPORTED_EVENTS));
}

/* ============ SUPABASE (auth, shared records, Edge Functions) ============ */
// Publishable/anon key is meant to be public -- real access control lives in RLS policies,
// not in keeping this secret. See supabase/migrations/ in the repo for the schema + policies.
const SUPABASE_URL = 'https://psgpxbkncuavlnpplykf.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Orec7KI9Lwqd_ZfsKaEq9g__ewGiEiT';
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { experimental: { passkey: true } },
}) : null;

/* ============ QUICKBOOKS ============ */
// Client ID is not secret (same reasoning as the Supabase publishable key above) -- it identifies
// the app to Intuit's OAuth screen, but nothing sensitive can be done with it alone. Set once the
// Intuit Developer app is registered; the Connect button in Settings stays disabled until it is.
// See ops/QUICKBOOKS_SETUP.md for the full setup.
const QBO_CLIENT_ID = '';
const QBO_REDIRECT_URI = SUPABASE_URL + '/functions/v1/qbo-oauth-callback';
// Connecting QuickBooks / Google Calendar / a Gmail mailbox: the OAuth `state` is a one-time value
// issued server-side to a signed-in admin (oauth-start) and checked by the callback -- it used to be
// Math.random() that nothing ever verified (2026-10-09 audit 1.2).
async function doOAuthConnect(provider, mailboxId){
  try{
    const { data: { session } } = await supabaseClient.auth.getSession();
    if(!session){ toast('Sign in again to connect this account.', 'system'); return; }
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/oauth-start`, {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'Authorization': `Bearer ${session.access_token}`, 'apikey': SUPABASE_PUBLISHABLE_KEY },
      body: JSON.stringify({ provider, mailboxId: mailboxId||undefined }),
    });
    const data = await resp.json().catch(()=>({ ok:false, error:'Unexpected response from the server.' }));
    if(!resp.ok || data.ok===false || !data.state){ toast('Could not start the connection: ' + (data.error||'unknown error'), 'system'); return; }
    location.href = provider==='qbo' ? qboAuthorizeUrl(data.state) : provider==='gcal' ? gcalAuthorizeUrl(data.state) : provider==='gdrive' ? driveAuthorizeUrl(data.state) : gmailAuthorizeUrl(data.state, mailboxId);
  } catch(err){ toast('Could not start the connection: ' + String(err), 'system'); }
}
function qboAuthorizeUrl(state){
  return `https://appcenter.intuit.com/connect/oauth2?client_id=${encodeURIComponent(QBO_CLIENT_ID)}&scope=com.intuit.quickbooks.accounting&redirect_uri=${encodeURIComponent(QBO_REDIRECT_URI)}&response_type=code&state=${state}`;
}

// Google Calendar HOLD/CONFIRMED sync (ops automation spec item 4). Same "client ID is not secret,
// Connect button stays disabled until it's set" reasoning as QBO_CLIENT_ID above. See
// ops/GOOGLE_CALENDAR_SETUP.md for the full setup once it exists.
const GOOGLE_CALENDAR_CLIENT_ID = '';
const GOOGLE_CALENDAR_REDIRECT_URI = SUPABASE_URL + '/functions/v1/gcal-oauth-callback';
function gcalAuthorizeUrl(state){
  const scope = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email';
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(GOOGLE_CALENDAR_CLIENT_ID)}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(GOOGLE_CALENDAR_REDIRECT_URI)}&response_type=code&access_type=offline&prompt=consent&state=${state}`;
}

// Gmail mailbox connections (ops automation spec item 6: Zelle matching from artist mailboxes).
// Unlike QBO/Google Calendar (one ASP-wide account), each mailbox here is authorized by its own
// owner -- state carries WHICH gmail_mailboxes row this consent is for (see gmail-oauth-callback).
// Narrowest read-only scope, per "narrowest scope" in the spec.
const GMAIL_CLIENT_ID = '139081512285-ehvftl99a7o8mkcmg1vsir2lr9ep802c.apps.googleusercontent.com';   // public (owner 2026-10-14)
const GMAIL_REDIRECT_URI = SUPABASE_URL + '/functions/v1/gmail-oauth-callback';
// The office's sending mailbox (type asp_sending) also needs gmail.send; other mailboxes are
// read-only. mailboxId is the gmail_mailboxes row id; its type comes from the gmail-status list.
function gmailAuthorizeUrl(state, mailboxId){
  const box = (S.gmailMailboxes||[]).find(m=>m.id===mailboxId);
  const scope = box && (box.mailbox_type||box.mailboxType)==='asp_sending'
    ? 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly'
    : 'https://www.googleapis.com/auth/gmail.readonly';
  // login_hint: Google opens on the mailbox's own account instead of whoever is signed in to the browser
  // (owner 2026-10-27 hit a block signing in with his personal account); select_account still lets them switch.
  const hint = box && box.email ? `&login_hint=${encodeURIComponent(box.email)}` : '';
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(GMAIL_CLIENT_ID)}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(GMAIL_REDIRECT_URI)}&response_type=code&access_type=offline&prompt=${encodeURIComponent('consent select_account')}${hint}&state=${encodeURIComponent(state)}`;
}

// The Video Library's Google Drive backup (0074): the same Google client and callback as Gmail, asking only
// for "drive.file" (the files and folders the app makes itself), signed in as the backup account.
const DRIVE_BACKUP_ACCOUNT = 'office@aspmgmt.com';
function driveAuthorizeUrl(state){
  const scope = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email';
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(GMAIL_CLIENT_ID)}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(GMAIL_REDIRECT_URI)}&response_type=code&access_type=offline&prompt=${encodeURIComponent('consent select_account')}&login_hint=${encodeURIComponent(DRIVE_BACKUP_ACCOUNT)}&state=${encodeURIComponent(state)}`;
}

/* ============ STATE ============ */
// NEVER bump this key to "reset" data: it silently discards every gig each browser holds (that
// happened on 2026-10-07, when v2→v3 cleared the gigs). Use additive migrations, or Settings →
// Back up / Restore. (The name says "mock" but this is real data -- see CLAUDE.md.)
const LS_KEY='asp_mock_state_v3';
let S = {
  user: null, // 'admin' or artist id
  view: 'dashboard',
  eventId: null,
  realSession: null, // {supabaseUserId, email} once someone signs in
  showRealSignIn: false,
  realSignInEmail: '',
  realSignInSent: false,
  realSignInCode: '', // the emailed one-time code, typed in once realSignInSent is true
  realSignInNotFound: false, // true if a real session resolved to no matching artists/admin_users row
  realPasskeys: null, // fetched async once a real session is active; null = not loaded yet
  realPasskeyBusy: false,
  realRoster: null, // {admins:[...], artists:[...]} of real (non-demo) people, fetched lazily
  realRosterBusy: false,
  showAddRealUser: false,
  addRealUserForm: {},
  showEditRealUser: false,
  editRealUserForm: {},
  showNewLead:false,
  showFlightForm:false,
  checkingFlightId:null,
  showTransportForm:false,
  transportForm:{},
  showItinerary:false,
  itineraryEventId:null,
  showBlockTime:false,
  blockTimeForm:{},
  showDressCodeForm:false,
  showEditEvent:false,
  editEventForm:{},
  dressCodeForm:{},
  showGigInfoForm:false,
  gigInfoForm:{},
  newGigContactForm:{},
  showGigInfoDoc:false,
  gigInfoDocEventId:null,
  contractSearchQuery:'',
  showNewInvoice:false,
  newInvoiceForm:{},
  showNewOutsideBooking:false,
  showOutsideBookingDetail:false,
  outsideBookingDetailId:null,
  newOutsideBookingForm:{},
  showDocumentBuilder:false,
  documentId:null,
  documentForm:{},
  showAiEditNotice:false,
  showInvoiceDoc:false,
  invoiceDocId:null,
  showAskAI:false,
  askAIForm:{},
  askAIHistory:[],
  showAddCharge:false,
  addChargeForm:{},
  dayListDate:null,
  showInstallBanner:false,
  showEventMenu:false,
  showAddArtist:false,
  addArtistForm:{},
  newArtistWelcome:null,
  projectArtistFilter:'all',
  pricingArtist: null,
  projectId:null,
  showNewProject:false,
  newProjectForm:{},
  newTaskText:'',
  newTaskAssignee:'',
  taskAssigneeFilter:null,
  newBoardItemText:{},
  showReminderPreview:false,
  showBookingConfirmation:false,
  showMobileMenu:false,
  projectTab:'tasks',
  newCommentText:'',
  newLinkForm:{},
  newPersonForm:{kind:'internal'},
  newFinIncomeLabel:'', newFinIncomeAmount:'',
  newFinExpenseLabel:'', newFinExpenseAmount:'',
  calMonth: (()=>{const d=new Date(); d.setDate(1); return d;})(),
  calViewMode: 'month',
  calDate: (()=>{const d=new Date(); d.setHours(0,0,0,0); return d;})(),
  calArtistFilter: [],
  finArtistFilter: 'all',
  leadsArtistFilter: 'all',
  needsReviewArtistFilter: 'all',
  newLeadForm: {},
  flightForm: {},
  // ---- Contract Builder (real-template contracts) ----
  showContractBuilder:false,
  contractBuilderId:null,
  showContractBuilderDoc:false,
  showTemplatePicker:false,
  templatePickerLeadId:null,
  showPayeeProfileForm:false,
  payeeProfileForm:{},
  editingPayeeProfileId:null,
  showSendContractConfirm:false,
  sendContractForm:{},
  sendContractBusy:false,
  // Durable booking record architecture (PR 6): the audited alternative to the blind one-click
  // "Mark Booking Fee Received" -- requires a real note on how the deposit was verified before the
  // booking is confirmed, alongside (not replacing) the existing button.
  showVerifyDeposit:false,
  verifyDepositEventId:null,
  verifyDepositForm:{},
  qboStatus:null, // null = unknown/not yet checked, else {connected, realmId, connectedAt}
  gcalStatus:null, // null = unknown/not yet checked, else {connected, email, connectedAt}
  calendarMappings:null, // null until checked, else array of integration_connections rows (type='google_calendar')
  calendarMappingsBusy:false,
  reconciliationQueue:null, // null until checked, else array of unmatched payments rows
  reconciliationBusy:false,
  zelleReviewQueue:null, // null until checked, else array of unmatched zelle_notifications rows
  zelleReviewQueueBusy:false,
  gmailMailboxes:null, // null until checked, else array of {id, mailboxType, artistId, email, connected, connectedAt, watchExpiresAt}
  gmailMailboxesBusy:false,
  newGmailMailboxForm:{},
  migrationPreview:null, // null until "Preview" clicked, else {payeeProfiles:{total,migrated}, contracts:{total,migrated}}
  sendContractInvoice:true,
  showTravelRequestDetail:false,
  travelRequestDetailId:null,
  travelRequestBusy:false,
  bookingConfirmationBusy:false,
  reminderBusy:false,
  flightStatusBusy:null, // null, or the flight-segment id currently being checked
  contractsSearchQuery:'',
  contractsStatusFilter:'all',
};
function loadEvents(){
  try{ const raw = localStorage.getItem(LS_KEY); if(raw) return JSON.parse(raw); }catch(e){}
  return seedAll();
}
function saveEvents(){
  // An artist session is read-only: its S.events are view rows held in memory (ARTIST PORTAL below),
  // never this browser's gigs cache.
  if(artistReadOnly()){ PENDING_LOG.clear(); return { ok:false, error:'read_only' }; }
  applyPendingLog();
  const r = persist(LS_KEY, S.events, 'gigs'); if(SHARED) SHARED.events.schedule(); return r;
}

/* ============ SHARED RECORDS (Supabase — migrations 0032 events, 0035 app_records) ============
   The office's records are shared: gigs in `events` (app_doc + legacy_id, with derived columns),
   and contracts, payee profiles, projects, invoices, external events, documents and travel
   requests in `app_records` (collection + legacy_id + app_doc). Each is stored whole, exactly as
   the app uses it. Signed-in admins load them, every save writes through, Supabase Realtime
   pushes other admins' changes live; localStorage is this browser's cache / offline copy.
   One engine (createSharedCollection) serves every collection. Rules -- each closes a data-loss
   path found in review (2026-10-10):
   - Comparisons use canon() (sorted keys): Postgres jsonb reorders keys.
   - A record is "dirty" when its canon differs from what the server last had. Dirty local
     records always win -- over Realtime echoes, resyncs and the next sign-in (the server's
     version of each synced record is remembered across reloads as a short hash).
   - Flushes send a snapshot taken before the network await (mid-upload edits go next time).
   - New records insert with ignoreDuplicates; if another browser already took that id, this
     record is re-numbered (references follow, via the collection's remapRefs) and retried.
   - First sync in a browser: local-only records are uploaded once; a local record whose id
     collides with a DIFFERENT shared record is re-numbered first; a backup is kept. A synced,
     clean record that's gone from the server was deleted elsewhere and is dropped here too.
   - Paged loads; resync on Realtime reconnect / waking / back online; one bad record can't
     block a batch (row-by-row retry, named in the toast); sign-out flushes first.
   Off for artists (RLS) and in the test harness (window.ASP_DISABLE_SHARED_SYNC). */
function canon(v){
  if(Array.isArray(v)) return '['+v.map(canon).join(',')+']';
  if(v && typeof v==='object') return '{'+Object.keys(v).sort().filter(k=>v[k]!==undefined).map(k=>JSON.stringify(k)+':'+canon(v[k])).join(',')+'}';
  return JSON.stringify(v===undefined ? null : v);
}
function hashStr(str){ let h=0x811c9dc5; for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,0x01000193); } return (h>>>0).toString(36)+':'+str.length; }
function sharedSyncAllowed(){ return !!(supabaseClient && S.realSession && isAdminUser(S.user) && !window.ASP_DISABLE_SHARED_SYNC && !window.ASP_DISABLE_EVENT_SYNC); }
function idNumber(id){ const n = parseInt(String(id).split('-').pop(), 10); return isNaN(n) ? null : n; }
// cfg: name, label, table, collection (app_records only), get(), set(list), saveLocal(),
//      prefix ('CT-'), getCounter(), setCounter(n), sameRecord(a,b), remapRefs(Map oldId→newId)
function createSharedCollection(cfg){
  const st = { on:false, starting:false, synced:new Map(), rowIds:new Map(), timer:null, channel:null, flushing:false, subscribedOnce:false, lastResync:0 };
  const markerKey = cfg.markerKey || ('asp_sync_' + cfg.name);
  const backupKey = cfg.backupKey || ('asp_presync_backup_' + cfg.name);
  const isApp = cfg.table === 'app_records';
  const loadMarker = ()=>{ try{ return JSON.parse(localStorage.getItem(markerKey)||'null'); }catch(e){ return null; } };
  const saveMarker = ()=>{ const m={}; st.synced.forEach((c,id)=>{ m[id]=hashStr(c); }); try{ localStorage.setItem(markerKey, JSON.stringify(m)); }catch(e){ console.error('could not save sync marker', cfg.name, e); } };
  const isDirty = r=>st.synced.get(r.id)!==canon(r);
  const base = ()=>{ let q = supabaseClient.from(cfg.table); return q; };
  const rowOf = (id, doc)=> isApp ? { collection:cfg.collection, legacy_id:id, app_doc:doc } : { legacy_id:id, app_doc:doc };
  const bumpCounter = ()=>{ const max = cfg.get().reduce((m,r)=>Math.max(m, (idNumber(r.id)||0)+1), 1); if(cfg.getCounter() < max) cfg.setCounter(max); };
  const nextFreeId = taken=>{ let n = cfg.getCounter(); while(taken.has(cfg.prefix+n)) n++; cfg.setCounter(n+1); return cfg.prefix+n; };
  async function fetchAll(){
    const rows=[]; const PAGE=1000;
    for(let from=0;;from+=PAGE){
      let q = base().select(isApp ? 'legacy_id, app_doc' : 'id, legacy_id, app_doc');
      q = isApp ? q.eq('collection', cfg.collection) : q.not('app_doc','is',null);
      const { data, error } = await q.order('legacy_id').range(from, from+PAGE-1);
      if(error) return { error };
      rows.push(...data);
      if(data.length < PAGE) return { rows };
    }
  }
  async function start(){
    if(st.on || st.starting || !sharedSyncAllowed()) return;
    st.starting = true;
    try{
      const { rows, error } = await fetchAll();
      if(!sharedSyncAllowed()) return;
      if(error){ toast(`Could not load the shared ${cfg.label} — working from this browser's copy for now. ` + (error.message||''), 'system'); return; }
      const marker = loadMarker();
      if(!marker && cfg.get().length){ try{ localStorage.setItem(backupKey, JSON.stringify({ savedAt:new Date().toISOString(), records:cfg.get() })); }catch(e){} }
      if(!marker && cfg.fromSeed && cfg.fromSeed() && rows.length){
        // This browser only holds the built-in seed, never real edits: the shared list wins outright, so
        // a fresh browser can't revert admins' edits or bring back records they deleted.
        cfg.set(rows.map(r=>r.app_doc));
        st.synced = new Map(rows.map(r=>[r.legacy_id, canon(r.app_doc)]));
        st.rowIds = new Map(rows.filter(r=>r.id).map(r=>[r.id, r.legacy_id]));
        const maxRemote = Math.max(1, ...rows.map(r=>(idNumber(r.legacy_id)||0)+1));
        if(cfg.getCounter() < maxRemote) cfg.setCounter(maxRemote);
        st.on = true; saveMarker(); cfg.saveLocal(); subscribe(); render(); schedule();
        return;
      }
      const known = marker || {};
      const remote = new Map(rows.map(r=>[r.legacy_id, r.app_doc]));
      st.synced = new Map(rows.map(r=>[r.legacy_id, canon(r.app_doc)]));
      st.rowIds = new Map(rows.filter(r=>r.id).map(r=>[r.id, r.legacy_id]));
      const taken = new Set([...remote.keys(), ...cfg.get().map(r=>r.id)]);
      const maxRemote = Math.max(1, ...[...remote.keys()].map(id=>(idNumber(id)||0)+1));
      if(cfg.getCounter() < maxRemote) cfg.setCounter(maxRemote);
      bumpCounter();
      const byId = new Map(rows.map(r=>[r.legacy_id, r.app_doc]));
      const remap = new Map();
      let uploaded = 0;
      for(const rec of cfg.get()){
        const shared = remote.get(rec.id);
        const lastServerHash = known[rec.id];
        const localHash = hashStr(canon(rec));
        if(!shared){
          if(lastServerHash && lastServerHash===localHash) continue;       // deleted elsewhere, no local edits → drop
          byId.set(rec.id, rec); uploaded++; continue;                      // never synced, or edited since → keep & upload
        }
        if(lastServerHash){ if(lastServerHash!==localHash && canon(rec)!==canon(shared)) byId.set(rec.id, rec); continue; } // unsent local edits win
        if(canon(rec)===canon(shared)) continue;
        // Office settings: a browser that never synced this doc (e.g. an old cache from before the venue
        // list existed) must not overwrite the shared copy -- that is how the venues were wiped (2026-10-21).
        if(cfg.serverWinsUnsynced) continue;
        if(cfg.sameRecord(rec, shared)){ byId.set(rec.id, rec); continue; } // same record, this browser's version wins once (backup kept)
        const newId = nextFreeId(taken); taken.add(newId);                   // a DIFFERENT record with the same id
        remap.set(rec.id, newId); byId.set(newId, { ...rec, id:newId }); uploaded++;
      }
      cfg.set([...byId.values()]);
      if(remap.size) cfg.remapRefs(remap);
      bumpCounter();
      st.on = true;
      saveMarker();
      cfg.saveLocal();
      await flush();
      if(uploaded) toast(`Shared ${uploaded} ${uploaded===1 ? cfg.one : cfg.label} from this browser with the office.`, 'success');
      subscribe();
      render();
    } finally { st.starting = false; }
  }
  function schedule(){ if(!st.on) return; clearTimeout(st.timer); st.timer = setTimeout(flush, 400); }
  async function upsertRows(rows, opts){
    const sel = isApp ? 'legacy_id' : 'id, legacy_id';
    const { data, error } = await base().upsert(rows, opts).select(sel);
    if(!error) return { saved:data||[], failed:[] };
    const saved=[], failed=[];
    for(const r of rows){
      const one = await base().upsert([r], opts).select(sel);
      if(one.error) failed.push({ r, message:one.error.message }); else saved.push(...(one.data||[]));
    }
    return { saved, failed };
  }
  async function flush(){
    if(!st.on) return;
    if(st.flushing){ schedule(); return; }
    st.flushing = true;
    try{
      const snap = cfg.get().map(r=>({ id:r.id, c:canon(r) })).filter(x=>st.synced.get(x.id)!==x.c);
      const isNew = x=>!st.synced.has(x.id);
      const conflictKey = isApp ? 'collection,legacy_id' : 'legacy_id';
      const problems = [];
      for(const [group, opts] of [[snap.filter(isNew), { onConflict:conflictKey, ignoreDuplicates:true }], [snap.filter(x=>!isNew(x)), { onConflict:conflictKey }]]){
        if(!group.length) continue;
        const { saved, failed } = await upsertRows(group.map(x=>rowOf(x.id, JSON.parse(x.c))), opts);
        saved.forEach(r=>{ if(r.id) st.rowIds.set(r.id, r.legacy_id); });
        const savedIds = new Set(saved.map(r=>r.legacy_id));
        group.forEach(x=>{ if(savedIds.has(x.id)) st.synced.set(x.id, x.c); });
        failed.forEach(f=>problems.push(f.r.legacy_id+' ('+f.message+')'));
        if(opts.ignoreDuplicates){
          const collided = group.filter(x=>!savedIds.has(x.id) && !failed.some(f=>f.r.legacy_id===x.id));
          if(collided.length){
            const taken = new Set([...st.synced.keys(), ...cfg.get().map(r=>r.id)]);
            const remap = new Map(collided.map(x=>{ const n=nextFreeId(taken); taken.add(n); return [x.id, n]; }));
            cfg.get().forEach(r=>{ if(remap.has(r.id)) r.id = remap.get(r.id); });
            cfg.remapRefs(remap); cfg.saveLocal();
            schedule();
          }
        }
      }
      const current = new Set(cfg.get().map(r=>r.id));
      const deletes = [...st.synced.keys()].filter(id=>!current.has(id));
      if(deletes.length){
        let q = base().delete().in('legacy_id', deletes);
        if(isApp) q = q.eq('collection', cfg.collection);
        const { error } = await q;
        if(error) problems.push('removing '+deletes.length+' ('+error.message+')');
        else deletes.forEach(id=>st.synced.delete(id));
      }
      saveMarker();
      if(problems.length) toast(`Some ${cfg.label} could not be saved to the shared list (kept in this browser, will retry): ` + problems.slice(0,3).join('; '), 'system');
    } finally { st.flushing = false; }
  }
  function applyRemote(row){
    if(!row || !row.legacy_id || !row.app_doc) return false;
    if(isApp && row.collection && row.collection!==cfg.collection) return false;
    if(row.id) st.rowIds.set(row.id, row.legacy_id);
    const c = canon(row.app_doc);
    const list = cfg.get();
    const i = list.findIndex(r=>r.id===row.legacy_id);
    if(i>=0 && isDirty(list[i])) return false;                   // unsent local edits win
    if(st.synced.get(row.legacy_id)===c && i>=0) return false;   // our own save echoing back
    st.synced.set(row.legacy_id, c);
    if(i>=0) list[i] = row.app_doc; else list.push(row.app_doc);
    return true;
  }
  function afterRemoteChange(){ bumpCounter(); saveMarker(); cfg.saveLocal(); renderPreservingFocus(); }
  function subscribe(){
    if(st.channel) return;
    st.subscribedOnce = false;
    const filter = isApp ? { event:'*', schema:'public', table:'app_records', filter:'collection=eq.'+cfg.collection } : { event:'*', schema:'public', table:cfg.table };
    const onChange = (payload)=>{
      let changed = false;
      if(payload.eventType==='DELETE'){
        const old = payload.old || {};
        if(isApp && old.collection && old.collection!==cfg.collection) return;
        const id = old.legacy_id || st.rowIds.get(old.id);
        if(id && st.synced.has(id)){
          if(old.id) st.rowIds.delete(old.id);
          st.synced.delete(id);
          if(cfg.get().some(r=>r.id===id)){ cfg.set(cfg.get().filter(r=>r.id!==id)); changed = true; }
        }
      } else changed = applyRemote(payload.new);
      if(changed) afterRemoteChange();
    };
    let ch = supabaseClient.channel('shared-'+cfg.name).on('postgres_changes', filter, onChange);
    // Supabase can't filter DELETE notices, so app_records collections also listen to all deletes
    // (onChange ignores other collections' ids; a delete seen twice is a no-op).
    if(isApp) ch = ch.on('postgres_changes', { event:'DELETE', schema:'public', table:'app_records' }, onChange);
    st.channel = ch
      .subscribe((status)=>{ if(status==='SUBSCRIBED'){ if(st.subscribedOnce) resync(); st.subscribedOnce = true; } });
  }
  async function resync(){
    if(!st.on || Date.now()-st.lastResync < 5000) return;
    st.lastResync = Date.now();
    const { rows, error } = await fetchAll();
    if(error || !st.on) return;
    const remoteIds = new Set(rows.map(r=>r.legacy_id));
    rows.forEach(applyRemote);
    cfg.set(cfg.get().filter(r=>remoteIds.has(r.id) || !st.synced.has(r.id) || isDirty(r)));
    [...st.synced.keys()].forEach(id=>{ if(!remoteIds.has(id)) st.synced.delete(id); });
    afterRemoteChange();
    flush();
  }
  function stop(){
    clearTimeout(st.timer);
    if(st.channel && supabaseClient) supabaseClient.removeChannel(st.channel);
    st.channel = null; st.on = false; st.synced = new Map(); st.rowIds = new Map();
  }
  async function flushAndStop(){ if(st.on){ clearTimeout(st.timer); try{ await flush(); }catch(e){} } stop(); }
  return { name:cfg.name, start, schedule, flush, resync, stop, flushAndStop, isDirty, get on(){ return st.on; } };
}
// Re-numbering a record must carry every reference to it along.
function remapIn(list, field, map){ let hit=false; list.forEach(x=>{ if(x && map.has(x[field])){ x[field]=map.get(x[field]); hit=true; } }); return hit; }
function remapState(keys, map){ keys.forEach(k=>{ if(map.has(S[k])) S[k]=map.get(S[k]); }); }
// Only full timestamps can tell two records with the same id apart; a bare date (invoices, external
// events, documents, projects) can't, so those collisions always re-number (worst case a duplicate, never a loss).
const sameByCreated = (a,b)=>!!a.createdAt && String(a.createdAt).length>10 && a.createdAt===b.createdAt;
// Office-wide settings documents (0036): one record each, wrapping the live objects. A browser's own
// copy is only ever defaults or older edits, so the office's shared copy wins at first sign-in.
function settingsDocs(){ return [{ id:'org', value:ORG_SETTINGS }, { id:'pricing', value:PRICING }, { id:'venues', value:VENUES }]; }
let SETTINGS_DOCS = settingsDocs();
function adoptSettingsDocs(list){
  const by = new Map(list.map(d=>[d.id, d]));
  if(by.get('org') && by.get('org').value) ORG_SETTINGS = by.get('org').value;
  if(by.get('pricing') && by.get('pricing').value) PRICING = by.get('pricing').value;
  if(by.get('venues') && Array.isArray(by.get('venues').value)) VENUES = by.get('venues').value;
  SETTINGS_DOCS = list.filter(d=>d.id==='org' || d.id==='pricing' || d.id==='venues');
  settingsDocs().forEach(d=>{ if(!by.has(d.id)) SETTINGS_DOCS.push(d); });
}
var SHARED = {
  events: createSharedCollection({ name:'events', label:'gigs', one:'gig', table:'events', markerKey:'asp_events_synced', backupKey:'asp_events_presync_backup',
    get:()=>S.events, set:v=>{ S.events = v; }, saveLocal:()=>persist(LS_KEY, S.events, 'gigs'),
    prefix:'EV-', getCounter:()=>EVID, setCounter:n=>{ EVID = n; },
    sameRecord:(a,b)=>a.artistId===b.artistId && a.date===b.date && (a.clientName||'')===(b.clientName||''),
    remapRefs:map=>{ if(remapIn(CONTRACTS,'leadId',map)) saveContracts(); if(remapIn(TRAVEL_REQUESTS,'eventId',map)) saveTravelRequests(); if(remapIn(PROJECTS,'recordingEventId',map)) saveProjects();
      remapState(['eventId','gigInfoDocEventId','itineraryEventId','verifyDepositEventId','templatePickerLeadId'], map); } }),
  contracts: createSharedCollection({ name:'contracts', label:'contracts', one:'contract', table:'app_records', collection:'contracts',
    get:()=>CONTRACTS, set:v=>{ CONTRACTS = v; }, saveLocal:()=>persist(CONTRACTS_LS_KEY, CONTRACTS, 'contracts'),
    prefix:'CT-', getCounter:()=>CTID, setCounter:n=>{ CTID = n; },
    sameRecord:(a,b)=>a.leadId===b.leadId && a.createdAt===b.createdAt, remapRefs:map=>remapState(['contractBuilderId'], map) }),
  payee_profiles: createSharedCollection({ name:'payee_profiles', label:'payee profiles', one:'payee profile', table:'app_records', collection:'payee_profiles',
    get:()=>PAYEE_PROFILES, set:v=>{ PAYEE_PROFILES = v; }, fromSeed:()=>PAYEE_PROFILES_FROM_SEED, saveLocal:()=>persist(PAYEE_PROFILES_LS_KEY, PAYEE_PROFILES, 'payee profiles'),
    prefix:'PP-', getCounter:()=>PPID, setCounter:n=>{ PPID = n; },
    sameRecord:(a,b)=>(a.entityName||'')===(b.entityName||'') && (a.artistId||null)===(b.artistId||null),
    remapRefs:map=>{ if(remapIn(CONTRACTS,'payeeProfileId',map)) saveContracts(); remapState(['editingPayeeProfileId'], map); } }),
  projects: createSharedCollection({ name:'projects', label:'projects', one:'project', table:'app_records', collection:'projects',
    get:()=>PROJECTS, set:v=>{ PROJECTS = v; }, saveLocal:()=>persist(PROJECTS_LS_KEY, PROJECTS, 'projects'),
    prefix:'PR-', getCounter:()=>PROJID, setCounter:n=>{ PROJID = n; }, sameRecord:sameByCreated, remapRefs:map=>remapState(['projectId'], map) }),
  invoices: createSharedCollection({ name:'invoices', label:'invoices', one:'invoice', table:'app_records', collection:'invoices',
    get:()=>CUSTOM_INVOICES, set:v=>{ CUSTOM_INVOICES = v; }, saveLocal:()=>persist(INVOICES_LS_KEY, CUSTOM_INVOICES, 'invoices'),
    prefix:'INV-', getCounter:()=>INVID, setCounter:n=>{ INVID = n; }, sameRecord:sameByCreated, remapRefs:map=>remapState(['invoiceDocId'], map) }),
  outside_bookings: createSharedCollection({ name:'outside_bookings', label:'external events', one:'external event', table:'app_records', collection:'outside_bookings',
    get:()=>OUTSIDE_BOOKINGS, set:v=>{ OUTSIDE_BOOKINGS = v; }, saveLocal:()=>persist(OUTSIDE_BOOKINGS_LS_KEY, OUTSIDE_BOOKINGS, 'external events'),
    prefix:'OB-', getCounter:()=>OBID, setCounter:n=>{ OBID = n; }, sameRecord:sameByCreated,
    remapRefs:map=>{ let hit=false; DOCUMENTS.forEach(d=>{ if(d.subjectType==='outside' && map.has(d.subjectId)){ d.subjectId=map.get(d.subjectId); hit=true; } }); if(hit) saveDocuments(); remapState(['outsideBookingDetailId'], map);
      if(S.documentForm && map.has(S.documentForm.subjectId)) S.documentForm.subjectId = map.get(S.documentForm.subjectId); } }),
  documents: createSharedCollection({ name:'documents', label:'documents', one:'document', table:'app_records', collection:'documents',
    get:()=>DOCUMENTS, set:v=>{ DOCUMENTS = v; }, saveLocal:()=>persist(DOCUMENTS_LS_KEY, DOCUMENTS, 'documents'),
    prefix:'DOC-', getCounter:()=>DOCID, setCounter:n=>{ DOCID = n; }, sameRecord:sameByCreated, remapRefs:map=>remapState(['documentId'], map) }),
  travel_requests: createSharedCollection({ name:'travel_requests', label:'travel requests', one:'travel request', table:'app_records', collection:'travel_requests',
    get:()=>TRAVEL_REQUESTS, set:v=>{ TRAVEL_REQUESTS = v; }, saveLocal:()=>persist(TRAVEL_REQUESTS_LS_KEY, TRAVEL_REQUESTS, 'travel requests'),
    prefix:'TRV-', getCounter:()=>TRVID, setCounter:n=>{ TRVID = n; }, sameRecord:sameByCreated, remapRefs:map=>remapState(['travelRequestDetailId'], map) }),
  settings: createSharedCollection({ name:'settings', label:'office settings', one:'office setting', table:'app_records', collection:'settings',
    get:()=>SETTINGS_DOCS, set:v=>adoptSettingsDocs(v), fromSeed:()=>true,
    saveLocal:()=>{ adoptSettingsDocs(SETTINGS_DOCS); persist(ORG_SETTINGS_LS_KEY, ORG_SETTINGS, 'office settings'); persist(PRICING_LS_KEY, PRICING, 'pricing'); persist(VENUES_LS_KEY, VENUES, 'venues'); },
    prefix:'SET-', getCounter:()=>1, setCounter:()=>{}, sameRecord:()=>true, serverWinsUnsynced:true, remapRefs:()=>{} }),
};
async function startSharedSync(){
  // Payee profiles before contracts, gigs before what references them: re-numbering upstream first.
  for(const k of ['settings','events','payee_profiles','contracts','outside_bookings','documents','projects','invoices','travel_requests']){ await SHARED[k].start(); }
}
function stopSharedSync(){ Object.values(SHARED).forEach(c=>c.stop()); }
async function flushAndStopSharedSync(){ for(const c of Object.values(SHARED)) await c.flushAndStop(); }
window.addEventListener('online', ()=>Object.values(SHARED).forEach(c=>c.resync()));
document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='visible') Object.values(SHARED).forEach(c=>c.resync()); });

/* ============ ARTIST PORTAL (Supabase views, migration 0038) ============
   Artists can't read the shared events table (admin-only RLS since 0026) and never sync. Their gigs
   and money come from two views scoped to the signed-in artist: artist_gig_view (gig, client, venue,
   logistics, co-performer names) and artist_finance_view (their own money; a shared gig's money only
   from their own event_artists row, otherwise "being confirmed"). Rows become event-shaped objects in
   S.events IN MEMORY ONLY: an artist session is read-only (saveEvents/updateEvent refuse), this
   browser's gigs cache is never written, and sign-out restores it. Refreshed on focus and every 5 min.
   The harness seeds local gigs instead (ASP_DISABLE_EVENT_SYNC), except the live-data spec. */
S.artistPortal = { on:false, loading:false, error:null, loadedAt:null };
let artistPortalTimer = null;
const ARTIST_PORTAL_REFRESH_MS = 5*60*1000;
function artistReadOnly(){ return !!(S.realSession && S.user && !isAdminUser(S.user)); }
// Crew (0069): Tzvi (social: every gig, assigns the videographer) and Lilker (videographer: his gigs).
// Read-only like an artist (artistReadOnly() is true), with their own pages and no money anywhere.
function crewUser(){ return (S.crew && S.user===S.crew.id) ? S.crew : null; }
function startArtistPortal(){
  if(!supabaseClient || !artistReadOnly() || window.ASP_DISABLE_EVENT_SYNC) return;
  S.artistPortal.on = true; S.artistPortal.error = null; S.artistPortal.loadedAt = null;
  S.events = []; // never show an artist this browser's cached office gigs, even for a moment
  clearInterval(artistPortalTimer);
  artistPortalTimer = setInterval(loadArtistPortalData, ARTIST_PORTAL_REFRESH_MS);
  loadArtistPortalData();
}
function stopArtistPortal(){
  if(!S.artistPortal.on) return;
  clearInterval(artistPortalTimer); artistPortalTimer = null;
  S.artistPortal = { on:false, loading:false, error:null, loadedAt:null };
  S.events = loadEvents(); // this browser's own cache, untouched during the artist session
}
async function loadArtistPortalData(){
  if(!S.artistPortal.on || S.artistPortal.loading) return;
  S.artistPortal.loading = true;
  const user = S.user;
  try{
    if(crewUser()){
      const [g, c] = await Promise.all([
        supabaseClient.from('crew_gig_view').select('*').order('date'),
        supabaseClient.from('crew_directory').select('id, name, initials, kind, active').eq('active', true).order('name'), // 0070: no emails / phones
      ]);
      if(g.error || c.error) throw new Error((g.error || c.error).message);
      if(!S.artistPortal.on || S.user!==user) return;
      S.events = (g.data||[]).map(crewPortalEvent);
      S.crewRoster = c.data || [];
      S.artistPortal.error = null; S.artistPortal.loadedAt = Date.now();
      return;
    }
    const [g, f] = await Promise.all([
      supabaseClient.from('artist_gig_view').select('*'),
      supabaseClient.from('artist_finance_view').select('*'),
    ]);
    if(g.error || f.error) throw new Error((g.error || f.error).message);
    if(!S.artistPortal.on || S.user!==user) return; // signed out meanwhile
    const moneyByEvent = new Map((f.data||[]).map(r=>[r.event_id, r]));
    S.events = (g.data||[]).map(r=>artistPortalEvent(r, moneyByEvent.get(r.event_id), user));
    S.artistPortal.error = null; S.artistPortal.loadedAt = Date.now();
  }catch(err){
    console.error('artist portal load failed', err);
    S.artistPortal.error = String(err && err.message || err);
  }finally{
    S.artistPortal.loading = false;
    if(S.artistPortal.on) render();
  }
}
// One view row pair -> the event shape the existing renderers use. No finance row = "being confirmed".
function artistPortalEvent(g, m, artistId){
  const day = d=>d ? String(d).slice(0,10) : null;
  const pending = !m || !!m.money_pending;
  const num = v=>(v===null || v===undefined || pending) ? 0 : Number(v)||0;
  return {
    id: g.legacy_id || g.event_id, artistId, fromArtistPortal: true, unpaid: !!g.unpaid,
    type: g.type || 'Other', status: g.status, date: day(g.date), time: g.time || '', endTime: g.end_time || null,
    clientName: g.client_name || '', clientPhone: g.client_phone || '', clientEmail: g.client_email || '',
    venue: g.venue || '', address: g.address || '', city: g.city || '', state: g.state || '', mapQuery: g.map_query || '',
    dressCode: g.dress_code || '', band: g.band || null, bandSize: g.band_size || null,
    isPrimary: !!g.is_primary,
    flightNeeded: !!g.flight_needed, flightBooked: !!(g.flight_booked && g.flight), flight: g.flight || null,
    groundTransportNeeded: !!g.ground_transport_needed, groundTransportBooked: !!(g.ground_transport_booked && g.ground_transport), groundTransport: g.ground_transport || null,
    travel: g.travel || null, gigInfoSheet: g.gig_sheet || null, // itinerary + gig sheet (0060)
    coPerformers: Array.isArray(g.co_performers) ? g.co_performers : [],
    // What to collect at the event on a gig not paid the standard way, e.g. Mezumin (0066; main artist only).
    collectMethod: g.collect_method || null, collectNote: g.collect_note || null,
    collectAmount: g.collect_amount==null ? null : Number(g.collect_amount),
    moneyPending: pending,
    price: num(m && m.gross_amount), commission: num(m && m.asp_cut), netAmount: num(m && m.net_amount),
    aspCutPct: (pending || !m || m.asp_cut_pct===null) ? null : Number(m.asp_cut_pct),
    depositReceived: !!(m && m.deposit_received), depositReceivedDate: day(m && m.deposit_received_date),
    balanceReceived: !!(m && m.balance_received), balanceReceivedDate: day(m && m.balance_received_date),
    artistPaidOut: !!(m && m.paid_to_you), artistPaidOutDate: day(m && m.paid_to_you_date),
    charges: [], log: [],
  };
}
// Crew (0069): one crew_gig_view row -> the event shape the calendar uses. No money fields at all.
function crewPortalEvent(g){
  const singers = Array.isArray(g.singers) ? g.singers : [];
  return {
    id: g.legacy_id || g.event_id, eventUuid: g.event_id, fromCrewPortal: true,
    artistId: singers[0] ? singers[0].id : '', singers, additionalArtists: singers.slice(1).map(x=>({ artistId:x.id })),
    type: g.type || 'Other', title: g.title || '', crewStatus: g.status, status: g.status==='pending' ? 'contract_sent' : 'booked',
    date: g.date ? String(g.date).slice(0,10) : null, time: g.time || '', endTime: g.end_time || null,
    clientName: g.client_name || '', venue: g.venue || '', address: g.address || '', city: g.city || '', state: g.state || '', mapQuery: g.map_query || '',
    dressCode: g.dress_code || '', band: g.band || null, gigInfoSheet: g.gig_sheet || null,
    crew: Array.isArray(g.crew) ? g.crew : [], myStatus: g.my_status || null, charges: [], log: [],
  };
}
window.addEventListener('focus', ()=>{ if(S.artistPortal.on) loadArtistPortalData(); });
// iOS Safari ignores user-scalable=no for pinch; its gesture events can still be cancelled (owner: no zoom).
document.addEventListener('gesturestart', e=>e.preventDefault(), { passive:false });
document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='visible' && S.artistPortal.on) loadArtistPortalData(); });
S.events = loadEvents();
EVID = S.events.reduce((max,e)=>{ const n=parseInt(String(e.id).split('-')[1],10); return isNaN(n)? max : Math.max(max,n+1); }, EVID);

/* ============ REAL AUTH (Supabase) ============ */
// A session never touches the ARTISTS/ADMIN_USERS roster lists except to add exactly the one matching row for whoever just signed in, so the
// rest of the app's isAdminUser()/artistById()/adminById() logic works completely unchanged.
// INITIAL_SESSION and SIGNED_IN can arrive back to back: run one roster link at a time.
let rosterLinkInFlight = null;
function linkRealSessionToRoster(session){
  if(!rosterLinkInFlight) rosterLinkInFlight = linkRealSessionToRosterNow(session).finally(()=>{ rosterLinkInFlight = null; });
  return rosterLinkInFlight;
}
async function linkRealSessionToRosterNow(session){
  S.realSession = { supabaseUserId: session.user.id, email: session.user.email };
  // A failed lookup (network, outage) is NOT "your account isn't set up" -- show a retry instead
  // of sending staff to the office about a problem that isn't theirs (2026-10-09 audit 4.3).
  let adminRow = null, artistRow = null, crewRow = null;
  try{
    const [a, r] = await Promise.all([
      supabaseClient.from('admin_users').select('*').eq('user_id', session.user.id).maybeSingle(),
      supabaseClient.from('artists').select('*').eq('user_id', session.user.id).maybeSingle(),
    ]);
    if(a.error || r.error) throw new Error((a.error||r.error).message);
    adminRow = a.data; artistRow = r.data;
    if(!adminRow && !artistRow){
      // Crew (0069): link a crew row added after this account already existed, then read it.
      const claim = await supabaseClient.rpc('claim_crew_account');
      if(claim.error) throw new Error(claim.error.message);
      const c = await supabaseClient.from('crew_members').select('*').eq('user_id', session.user.id).eq('active', true).maybeSingle();
      if(c.error) throw new Error(c.error.message);
      crewRow = c.data;
    }
  }catch(err){
    S.realSignInError = String(err && err.message || err);
    S.realSignInNotFound = false; S.showRealSignIn = false;
    render();
    return;
  }
  S.realSignInError = null;
  const row = adminRow || artistRow || crewRow;
  if(!row){
    S.realSignInNotFound = true;
    S.showRealSignIn = false; S.realSignInSent = false;
    render();
    return;
  }
  if(adminRow){
    // Pull the full office roster (not just this person) so office-wide pickers -- e.g. the project
    // assignee dropdown -- list everyone even before they've signed in themselves. Each admin is
    // keyed by their own uuid; role-based checks go through adminRoleOf().
    const { data: allAdmins } = await supabaseClient.from('admin_users').select('*').order('created_at');
    (allAdmins||[adminRow]).forEach(row=>{
      const existing = ADMIN_USERS.find(u=>u.id===row.id);
      const fields = {name:row.name, email:row.email, initials:row.initials, role:row.role, dbId:row.id, libraryAccess:!!row.library_access, whatsappAccess:!!row.whatsapp_access};
      if(existing) Object.assign(existing, fields);
      else ADMIN_USERS.push({id:row.id, ...fields});
    });
    S.user = adminRow.id;
  } else if(crewRow){
    S.crew = { id:crewRow.id, name:crewRow.name, kind:crewRow.kind, initials:crewRow.initials || crewRow.name.split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase() };
    S.user = crewRow.id;
  } else {
    // Mirrors the admin branch's own trick above: artists.id is a real uuid, but every seeded/
    // imported gig (event.artistId, S.events) keys to the ORIGINAL short string id ('baruch'
    // etc.) the app has always used -- a fresh uuid would match zero existing gigs. artists.
    // legacy_id (migration 0029) bridges a real artist back to their pre-existing legacy entry
    // when one exists; a brand-new real artist with no legacy data falls back to their own uuid,
    // same as before.
    const legacyId = artistRow.legacy_id;
    const existing = legacyId && ARTISTS.find(a=>a.id===legacyId);
    if(existing){
      Object.assign(existing, {name:artistRow.name, email:artistRow.email, initials:artistRow.initials, dbId:artistRow.id});
      S.user = legacyId;
    } else {
      if(!ARTISTS.some(a=>a.id===artistRow.id)) ARTISTS.push({id:artistRow.id, name:artistRow.name, slot:artistRow.slot, initials:artistRow.initials, email:artistRow.email, role:artistRow.role});
      S.user = artistRow.id;
    }
  }
  // Keep the view the URL asked for (reload / deep link) when this user may open it.
  if(!viewAllowed(S.view, !!adminRow)) S.view = homeViewFor(!!adminRow);
  S.showRealSignIn = false; S.realSignInSent = false; S.realSignInNotFound = false; S.realSignInError = null;
  S.realPasskeys = null;
  pendingViewTransition = true;
  pendingViewDirection = 'right';
  syncURL();
  if(!adminRow) startArtistPortal(); // before the first paint, so no cached office gig ever shows
  render();
  // Loaded once the person is known (audit 5.7): before, these ran only at page load, so a fresh
  // sign-in showed QuickBooks/Calendar as "not connected" until a reload, and an artist's reload
  // called the admin-only status functions.
  loadBrandConfig();
  if(adminRow){ refreshQboStatus(); refreshGcalStatus(); refreshStripeStatus(); loadInbox(); refreshMercuryStatus(); loadCrewRoster(); }
  await syncArtistRoster();
  startSharedSync().then(startClientSignatureWatch); // after contracts load, so signatures land on them
}
// Load the roster from Supabase (any signed-in user may read it) and let it win: names, slots,
// roles and emails come from the table, keyed in the app by legacy_id ('benny') or the row's uuid.
// On an admin browser's first roster sync, artists it added locally that the table doesn't have are
// uploaded once (never the built-in list, so a removed artist can't come back). Local entries the
// table no longer has stay only while a gig or project still points at them.
const ROSTER_SYNCED_KEY = 'asp_sync_artists';
async function syncArtistRoster(){
  if(!supabaseClient || !S.realSession) return;
  // Artists read the name-only directory (0050): other artists' emails and commission rates are
  // the office's business, not theirs. Only admins read the full table.
  const { data: rows, error } = isAdminUser(S.user)
    ? await supabaseClient.from('artists').select('id, legacy_id, name, slot, initials, email, role, commission_pct').order('created_at')
    : await supabaseClient.from('artist_directory').select('id, legacy_id, name, slot, initials, role').order('created_at');
  if(error || !rows){ if(error) console.error('roster load failed', error); return; }
  const appIdOf = r=>r.legacy_id || r.id;
  const onServer = new Set(rows.map(appIdOf));
  let firstSync = false; try{ firstSync = !localStorage.getItem(ROSTER_SYNCED_KEY); }catch(e){}
  if(firstSync && sharedSyncAllowed()){
    for(const a of ARTISTS.filter(a=>!onServer.has(a.id) && !SEED_ARTIST_IDS.includes(a.id))){
      const { data, error: e } = await supabaseClient.from('artists').insert(artistRowFor(a)).select('id, legacy_id, name, slot, initials, email, role').single();
      if(e) toast(`Could not add ${a.name} to the shared roster: ${e.message}`, 'system');
      else { rows.push(data); onServer.add(a.id); }
    }
  }
  rows.forEach(r=>{
    const fields = { name:r.name, slot:r.slot, initials:r.initials, role:r.role, dbId:r.id,
      ...(r.email!==undefined ? { email:r.email||'' } : {}),
      ...(r.commission_pct!==undefined && r.commission_pct!==null ? { commissionPct: Number(r.commission_pct) } : {}) };
    const a = ARTISTS.find(x=>x.id===appIdOf(r));
    if(a) Object.assign(a, fields); else ARTISTS.push({ id:appIdOf(r), ...fields });
  });
  const inUse = id=>S.events.some(e=>e.artistId===id || (e.additionalArtists||[]).some(x=>x.artistId===id)) || PROJECTS.some(p=>p.artistId===id);
  ARTISTS = ARTISTS.filter(a=>onServer.has(a.id) || inUse(a.id) || a.id===S.user);
  if(sharedSyncAllowed()){ try{ localStorage.setItem(ROSTER_SYNCED_KEY, new Date().toISOString()); }catch(e){} }
  saveArtists();
  render();
}
function artistRowFor(a){
  return { legacy_id:a.id, name:a.name, slot:a.slot||1, initials:a.initials||'?', role: ARTIST_ROLES.includes(a.role) ? a.role : 'Singer', email: a.email || null };
}
async function doSendSignInCode(){
  const email = (S.realSignInEmail||'').trim();
  if(!email){ toast('Enter your email.', 'system'); return; }
  // Navigation/data-layer refactor (PR 17): shouldCreateUser:false closes a real open-signup
  // hole -- without it, Supabase happily mints a brand-new (if ultimately useless, since app
  // access is separately roster-gated) auth.users row for any email a stranger types in here.
  // "Block open signups: only emails the office has added can get an account" (the brief). This
  // also fails fast with a clear message instead of sending an email that leads to "No account
  // set up yet" only after the person clicks through it.
  // Sign-in is by emailed one-time code, not link: the email carries {{ .Token }} (Supabase
  // Dashboard → Auth → Email Templates → Magic Link) and doVerifySignInCode() exchanges it for a
  // session here in the same tab. emailRedirectTo is kept only so any link a template still
  // includes lands back on this page.
  const { error } = await supabaseClient.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: window.location.href.split('#')[0] } });
  if(error){
    const notFound = /not.*found|signups.*not.*allowed|user.*not.*found/i.test(error.message||'');
    toast(notFound ? 'That email isn\'t set up yet — contact the office to get added.' : 'Could not send sign-in code: ' + error.message, 'system');
    return;
  }
  S.realSignInSent = true; S.realSignInCode = '';
  render();
}
async function doVerifySignInCode(){
  const email = (S.realSignInEmail||'').trim();
  const token = (S.realSignInCode||'').replace(/\s/g,'');
  if(!/^\d{6,10}$/.test(token)){ toast('Enter the code from your email.', 'system'); return; }
  const { error } = await supabaseClient.auth.verifyOtp({ email, token, type: 'email' });
  if(error){ toast(/expired|invalid/i.test(error.message||'') ? 'That code is wrong or has expired — check it, or send a new one.' : 'Could not sign in: ' + error.message, 'system'); return; }
  // On success, onAuthStateChange's SIGNED_IN handler takes over from here.
}
// Same check supabase-js runs before any passkey call (it fails with "Browser does not support
// WebAuthn" otherwise) -- used to hide passkey buttons in browsers that can't use them, e.g.
// in-app/embedded browsers, rather than offering a button that can only error.
function browserSupportsPasskeys(){
  return !!(window.PublicKeyCredential && navigator.credentials && typeof navigator.credentials.get==='function' && typeof navigator.credentials.create==='function');
}
async function doRealSignInPasskey(){
  try{
    const { error } = await supabaseClient.auth.signInWithPasskey();
    if(error){ toast('Passkey sign-in failed: ' + error.message, 'system'); }
    // On success, onAuthStateChange's SIGNED_IN handler takes over from here.
  }catch(e){
    toast('Passkey sign-in was cancelled or is not available on this device.', 'system');
  }
}
// The one sign-out path (2026-10-09 audit 1.11): the menu's Log Out, the "not set up"/retry screens,
// and a sign-out that happens elsewhere (another tab, expired session) all end in the same reset.
// Business data in this browser's storage is deliberately kept -- it is still the only copy.
function resetAfterSignOut(){
  stopSharedSync();
  stopClientSignatureWatch();
  stopArtistPortal();
  closeAllOverlays();
  stopWhatsAppLive(); S.wa = null; S.waContact = null;
  S.user = null; S.previewFrom = null; S.crew = null; S.crewRoster = null; S.gigCrew = null; S.lib = null; S.libUrls = null; S.libTab = null; S.libAt = null; S.libF = null; S.libQ = null; S.drive = null; S.realSession = null; S.realPasskeys = null; S.realRoster = null;
  S.realSignInNotFound = false; S.realSignInError = null; S.showRealSignIn = false;
  S.eventId = null; S.showNewLead = false; S.showMobileMenu = false;
  history.pushState(null, '', location.pathname + location.search);
  render();
}
async function doRealSignOut(){
  await flushAndStopSharedSync(); // send any edits still waiting before the session ends
  if(supabaseClient && S.realSession){ try{ await supabaseClient.auth.signOut(); }catch(e){ console.error('signOut failed', e); } }
  resetAfterSignOut();
}
// Passkey field names (friendly_name/created_at) are a best guess -- Supabase's passkey API is
// experimental/BETA and its exact response shape isn't fully documented; adjust here if it
// turns out to differ once tested against a real registered passkey on the live domain.
async function loadRealPasskeys(){
  S.realPasskeyBusy = true;
  try{
    const { data, error } = await supabaseClient.auth.passkey.list();
    if(error){ toast('Could not load passkeys: ' + error.message, 'system'); S.realPasskeys = []; }
    else S.realPasskeys = (data||[]).map(p=>({ id: p.id, label: p.friendly_name || p.name || 'Passkey', addedAt: p.created_at }));
  }catch(e){
    S.realPasskeys = [];
  }
  S.realPasskeyBusy = false;
  render();
}
async function doAddRealPasskey(){
  const { error } = await supabaseClient.auth.registerPasskey();
  if(error){ toast('Could not add passkey: ' + error.message, 'system'); return; }
  toast('Passkey added.', 'success');
  S.realPasskeys = null;
  render();
}
async function doRemoveRealPasskey(id){
  const { error } = await supabaseClient.auth.passkey.delete({ passkeyId: id }); // supabase-js expects passkeyId, not id
  if(error){ toast('Could not remove passkey: ' + error.message, 'system'); return; }
  toast('Passkey removed.', 'system');
  S.realPasskeys = null;
  render();
}
// ============ USERS DASHBOARD (real people, admin-only) ============
// Self-serve onboarding: an admin adds a real person's name/email/role here, which inserts a
// real row into admin_users/artists (RLS already allows any is_admin() session to do this --
// "admin manages roster"/"admin manages office list" in supabase/migrations/0001). That person
// can then sign in for real; linkRealSessionToRoster()'s existing email-match trigger links
// their auth.users row to this one automatically the first time they do.
const ADMIN_ROLE_LABELS = { admin_bookings:'Bookings', admin_bookkeeping:'Bookkeeping', admin_ceo:'CEO', admin_coo:'COO' };
async function loadRealRoster(){
  S.realRosterBusy = true;
  const [{data: admins, error: e1}, {data: artists, error: e2}] = await Promise.all([
    supabaseClient.from('admin_users').select('*').order('created_at'),
    supabaseClient.from('artists').select('*').order('created_at'),
  ]);
  if(e1 || e2) toast('Could not load the users list: ' + (e1||e2).message, 'system');
  S.realRoster = { admins: admins||[], artists: artists||[] };
  S.realRosterBusy = false;
  render();
}
function doAddRealUser(){
  const f = S.addRealUserForm;
  const name = (f.name||'').trim();
  const email = (f.email||'').trim().toLowerCase();
  if(!name || !email){ toast('Enter a name and email.', 'system'); return; }
  const parts = name.split(/\s+/);
  const initials = (parts[0][0] + (parts[1]? parts[1][0] : '')).toUpperCase();
  const kind = f.kind || 'artist';
  const table = kind==='admin' ? 'admin_users' : 'artists';
  const row = kind==='admin'
    ? { name, email, initials, role: f.adminRole || 'admin_bookings' }
    : { name, email, initials, role: f.artistRole || 'Singer', slot: ((S.realRoster?.artists.length||0) % 6) + 1 };
  supabaseClient.from(table).insert(row).then(({error})=>{
    if(error){ toast('Could not add that person: ' + error.message, 'system'); return; }
    toast(`${name} added. They can sign in at ${email} with a passkey or an emailed sign-in code.`, 'success');
    S.showAddRealUser = false; S.addRealUserForm = {};
    loadRealRoster();
  });
}
// Remove a person (admin-only, via the admin-remove-user Edge Function -- deleting a login needs the
// server). Their login, sessions and passkeys go; the roster row goes too unless bookings or
// contracts still reference them (then they stay listed, without a login, so history keeps its name).
async function doRemoveRealUser(){
  const f = S.editRealUserForm;
  const name = f.name || 'this person';
  if(!confirm(`Remove ${name} from ASP Bookings?\n\nTheir login is deleted right away: they're signed out everywhere and can't sign in again (passkeys and email codes stop working). This can't be undone — you'd have to add them again.`)) return;
  try{
    const { data: { session } } = await supabaseClient.auth.getSession();
    if(!session){ toast('Sign in again to remove people.', 'system'); return; }
    S.removeRealUserBusy = true; render();
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/admin-remove-user`, {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'Authorization': `Bearer ${session.access_token}`, 'apikey': SUPABASE_PUBLISHABLE_KEY },
      body: JSON.stringify({ kind: f.kind, rosterId: f.id }),
    });
    const data = await resp.json().catch(()=>({ ok:false, error:'Unexpected response from the server.' }));
    if(!resp.ok || data.ok===false){ toast('Could not remove ' + name + ': ' + (data.error || 'unknown error'), 'system'); return; }
    toast(data.note || `${name} was removed.`, 'success');
    S.showEditRealUser = false; S.editRealUserForm = {};
    loadRealRoster();
    if(f.kind!=='admin') syncArtistRoster();
  } catch(err){
    toast('Could not remove ' + name + ': ' + String(err), 'system');
  } finally {
    S.removeRealUserBusy = false; render();
  }
}
function doEditRealUser(){
  const f = S.editRealUserForm;
  const name = (f.name||'').trim();
  const email = (f.email||'').trim().toLowerCase();
  if(!name || !email){ toast('Enter a name and email.', 'system'); return; }
  const parts = name.split(/\s+/);
  const initials = (parts[0][0] + (parts[1]? parts[1][0] : '')).toUpperCase();
  const table = f.kind==='admin' ? 'admin_users' : 'artists';
  const pct = Number(f.commissionPct);
  if(f.kind!=='admin' && (f.commissionPct==='' || Number.isNaN(pct) || pct<0 || pct>100)){ toast('Enter a commission between 0 and 100%.', 'system'); return; }
  const patch = f.kind==='admin'
    ? { name, email, initials, role: f.adminRole }
    : { name, email, initials, role: f.artistRole, commission_pct: pct };
  supabaseClient.from(table).update(patch).eq('id', f.id).then(({error})=>{
    if(error){ toast('Could not save that account: ' + error.message, 'system'); return; }
    toast(`${name} updated.`, 'success');
    S.showEditRealUser = false; S.editRealUserForm = {};
    loadRealRoster();
    if(f.kind!=='admin') syncArtistRoster();
  });
}
if(supabaseClient){
  supabaseClient.auth.onAuthStateChange((event, session)=>{
    if((event==='SIGNED_IN' || event==='INITIAL_SESSION') && session && !S.user) linkRealSessionToRoster(session);
    if(event==='SIGNED_OUT' && (S.user || S.realSession)) resetAfterSignOut();
  });
}
// One way to call an Edge Function as the signed-in user (CLAUDE.md: hand-rolled fetches are being
// phased out into this). Returns the function's JSON, or { ok:false, error } when there is no
// session, the network fails, or the reply isn't JSON.
async function callEdgeFunction(name, body){
  if(!supabaseClient) return { ok:false, error:'Not connected.' };
  const { data: { session } } = await supabaseClient.auth.getSession();
  if(!session) return { ok:false, error:'Sign in again to do that.' };
  try{
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
      method:'POST',
      headers:{ 'Authorization':`Bearer ${session.access_token}`, 'apikey':SUPABASE_PUBLISHABLE_KEY, 'Content-Type':'application/json' },
      body: JSON.stringify(body||{}),
    });
    const data = await resp.json().catch(()=>null);
    return data || { ok:false, error:`Server error (${resp.status}).` };
  }catch(err){ return { ok:false, error:'Network error: ' + String(err && err.message || err) }; }
}
// New Lead "paste a message" auto-fill (owner 2026-10-13): parse-lead (Claude) suggests the fields;
// only empty answers are skipped, and the office reviews the form before saving.
async function doParseLeadPaste(){
  const f = S.newLeadForm;
  const text = (f.pasteText||'').trim();
  if(!text){ toast('Paste a message first.', 'system'); return; }
  S.parseLeadBusy = true; render();
  try{
    const res = await callEdgeFunction('parse-lead', { text, today: todayISO(), eventTypes: EVENT_TYPES });
    if(!res.ok){ toast(res.error || 'Could not read that message.', 'system'); return; }
    fillLeadFormFrom(f, res.fields || {});
    toast('Filled from the message — check everything before saving.', 'success');
  } finally {
    S.parseLeadBusy = false; render();
  }
  // A venue it isn't known yet: look its address up.
  const venueEl = document.querySelector('[data-form="lead"] [data-field="venue"]');
  if(venueEl && String(f.venue||'').trim() && !String(f.address||'').trim()) doVenueLookup(venueEl);
}
// Shared by the paste box and the Inbox's "Create lead": copy the reader's fields into the New Lead form.
function fillLeadFormFrom(f, x){
    const set = (k, v)=>{ if(v) f[k] = v; };
    set('clientName', x.clientName); set('clientEmail', x.clientEmail); set('clientPhone', x.clientPhone);
    set('date', x.date); set('venue', x.venue); set('city', x.city); set('state', x.state); set('price', x.price);
    if(x.type && EVENT_TYPES.includes(x.type)) f.type = x.type;
    if(x.artistName){ const a = ARTISTS.find(a=>a.name===x.artistName); if(a) f.artistId = a.id; }
    if(x.time){ f.time = x.time; f.timeTbd = false; }
    if(x.endTime){ f.endTime = x.endTime; f.endTimeManual = true; } else if(!f.endTimeManual) delete f.endTime;
    if(x.notes) f.pasteNotes = x.notes;
    // A venue the list knows brings its address (the same as typing it in).
    const known = findVenue(f.venue);
    if(known && !String(f.address||'').trim()){ f.address = known.address; f.city = f.city || known.city; f.state = f.state || known.state; }
}
async function refreshQboStatus(){
  if(!supabaseClient) return;
  try{
    const { data: { session } } = await supabaseClient.auth.getSession();
    if(!session) return;
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/qbo-status`, {
      headers: { 'Authorization': `Bearer ${session.access_token}`, 'apikey': SUPABASE_PUBLISHABLE_KEY },
    });
    const data = await resp.json().catch(()=>null);
    if(resp.ok && data && data.ok) S.qboStatus = data;
    render();
  }catch(err){ /* Settings just shows "not connected" if this fails -- non-critical */ }
}
async function loadCalendarMappings(){
  if(!supabaseClient) return;
  const { data: { session } } = await supabaseClient.auth.getSession();
  if(!session) return;
  S.calendarMappingsBusy = true; render();
  try{
    const { data, error } = await supabaseClient.from('integration_connections').select('*').eq('type','google_calendar');
    if(error){ toast('Could not load calendar mappings: ' + error.message, 'system'); return; }
    S.calendarMappings = data||[];
  } finally {
    S.calendarMappingsBusy = false; render();
  }
}
async function doSaveCalendarMapping(target, calendarId){
  if(!supabaseClient) return;
  const artistId = target==='asp_main' ? null : artistDbId(target);
  if(target!=='asp_main' && !artistId){ toast('That artist isn\'t saved in Supabase yet — reload and try again.', 'system'); return; }
  const label = artistId ? (artistByDbId(artistId)||{}).name || target : 'ASP Main Calendar';
  const existing = (S.calendarMappings||[]).find(m=> artistId? m.artist_id===artistId : !m.artist_id);
  if(existing){
    const { error } = await supabaseClient.from('integration_connections').update({ config:{calendar_id:calendarId}, account_label:label, updated_at:new Date().toISOString() }).eq('id', existing.id);
    if(error){ toast('Could not save mapping: ' + error.message, 'system'); return; }
    existing.config = {calendar_id:calendarId};
  } else {
    const { data, error } = await supabaseClient.from('integration_connections').insert({ type:'google_calendar', artist_id:artistId, account_label:label, config:{calendar_id:calendarId}, status: calendarId? 'connected':'not_connected' }).select().single();
    if(error){ toast('Could not save mapping: ' + error.message, 'system'); return; }
    S.calendarMappings = S.calendarMappings||[]; S.calendarMappings.push(data);
  }
}
async function loadGmailStatus(){
  if(!supabaseClient) return;
  const { data: { session } } = await supabaseClient.auth.getSession();
  if(!session) return;
  S.gmailMailboxesBusy = true; render();
  try{
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/gmail-status`, {
      headers: { 'Authorization': `Bearer ${session.access_token}`, 'apikey': SUPABASE_PUBLISHABLE_KEY },
    });
    const data = await resp.json().catch(()=>null);
    if(resp.ok && data && data.ok) S.gmailMailboxes = data.mailboxes;
    else toast((data&&data.error) || 'Could not load Gmail mailboxes.', 'system');
  } finally {
    S.gmailMailboxesBusy = false; render();
  }
}
async function doAddGmailMailbox(){
  if(!supabaseClient){ toast('Sign in with your ASP account.', 'system'); return; }
  const f = S.newGmailMailboxForm||{};
  const email = (f.email||'').trim();
  if(!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ toast('Enter a valid mailbox email.', 'system'); return; }
  const { error } = await supabaseClient.from('gmail_mailboxes').insert({
    // No artist picked = the office's sending mailbox (the dropdown's first option); it always saved as artist_payment before.
    mailbox_type: f.artistId==='__payments' ? 'payments' : f.artistId ? 'artist_payment' : 'asp_sending', artist_id: f.artistId && f.artistId!=='__payments' ? artistDbId(f.artistId) : null, email,
  });
  if(error){ toast(/duplicate key|gmail_mailboxes_email_key/.test(error.message) ? `${email} is already added — click Connect next to it below.` : 'Could not add mailbox: ' + error.message, 'system'); loadGmailStatus(); return; }
  S.newGmailMailboxForm = {};
  toast('Mailbox added -- click Connect to authorize it.', 'success');
  loadGmailStatus();
}
async function refreshGcalStatus(){
  if(!supabaseClient) return;
  try{
    const { data: { session } } = await supabaseClient.auth.getSession();
    if(!session) return;
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/gcal-status`, {
      headers: { 'Authorization': `Bearer ${session.access_token}`, 'apikey': SUPABASE_PUBLISHABLE_KEY },
    });
    const data = await resp.json().catch(()=>null);
    if(resp.ok && data && data.ok) S.gcalStatus = data;
    render();
  }catch(err){ /* Settings just shows "not connected" if this fails -- non-critical */ }
}
(function checkGmailRedirect(){
  const params = new URLSearchParams(location.search);
  const gmail = params.get('gmail');
  if(!gmail) return;
  history.replaceState(null, '', location.pathname + location.hash);
  if(gmail==='connected'){ toast('Gmail mailbox connected.', 'success'); loadGmailStatus(); }
  else if(gmail==='error'){ toast('Could not connect that Gmail mailbox -- check the setup and try again.', 'system'); }
  else if(gmail==='mismatch'){ toast('Not connected: the Google account you signed in with is not the mailbox being connected. Sign in to Google as that mailbox and try again.', 'system'); }
})();
(function checkDriveRedirect(){
  const params = new URLSearchParams(location.search);
  const r = params.get('gdrive');
  if(!r) return;
  history.replaceState(null, '', location.pathname + location.hash);
  if(r==='connected'){ toast('Google Drive connected. The library is backing up now.', 'success'); setTimeout(()=>doDriveBackupNow(true), 1500); }
  else if(r==='mismatch'){ toast(`Not connected: sign in to Google as ${DRIVE_BACKUP_ACCOUNT} and try again.`, 'system'); }
  else { toast('Could not connect Google Drive. Try again.', 'system'); }
})();
(function checkGcalRedirect(){
  const params = new URLSearchParams(location.search);
  const gcal = params.get('gcal');
  if(!gcal) return;
  history.replaceState(null, '', location.pathname + location.hash);
  if(gcal==='connected'){ toast('Google Calendar connected.', 'success'); refreshGcalStatus(); }
  else if(gcal==='error'){ toast('Could not connect Google Calendar -- check the setup and try again.', 'system'); }
})();
(function checkQboRedirect(){
  const params = new URLSearchParams(location.search);
  const qbo = params.get('qbo');
  if(!qbo) return;
  history.replaceState(null, '', location.pathname + location.hash);
  if(qbo==='connected'){ toast('QuickBooks connected.', 'success'); refreshQboStatus(); }
  else if(qbo==='error'){ toast('Could not connect QuickBooks -- check the setup and try again.', 'system'); }
})();

/* ============ THEME PREF ============ */
const THEME_LS_KEY = 'asp_theme_pref';
function loadThemePref(){ try{ return localStorage.getItem(THEME_LS_KEY) || 'light'; }catch(e){ return 'light'; } }
function applyThemePref(pref){ document.documentElement.dataset.theme = pref==='dark' ? 'dark' : 'light'; }
let THEME_PREF = loadThemePref();
applyThemePref(THEME_PREF);
function setThemePref(pref){
  THEME_PREF = pref;
  try{ localStorage.setItem(THEME_LS_KEY, pref); }catch(e){}
  applyThemePref(pref);
  render();
}

/* ============ SETTINGS ============ */
const SETTINGS_LS_KEY = 'asp_mock_settings_v1';
function loadAllSettings(){ try{ const raw = localStorage.getItem(SETTINGS_LS_KEY); if(raw) return JSON.parse(raw); }catch(e){} return {}; }
let ALL_SETTINGS = loadAllSettings();
function saveAllSettings(){ return persist(SETTINGS_LS_KEY, ALL_SETTINGS, 'your settings'); }
function defaultUserSettings(){
  return {
    passkeys: [{id:'pk-'+randInt(1,999999), label:'This device', addedAt: todayISO()}],
    calendarConnected: false,
    calendarEmail: '',
    notify: {
      newLeads: {inApp:true, email:false},
      balanceReminders: {inApp:true, email:false},
      bookingConfirmations: {inApp:true, email:false},
      weeklyGigDigest: {inApp:false, email:false},
      dayOfReminder: {inApp:false, email:false},
    },
  };
}
function getUserSettings(userId){
  // Settings saved before 2026-10-11 were keyed by role slug: carry them over to this admin once.
  const legacyKey = adminRoleOf(userId);
  if(!ALL_SETTINGS[userId] && legacyKey && legacyKey!==userId && ALL_SETTINGS[legacyKey]) ALL_SETTINGS[userId] = JSON.parse(JSON.stringify(ALL_SETTINGS[legacyKey]));
  if(!ALL_SETTINGS[userId]) ALL_SETTINGS[userId] = defaultUserSettings();
  const st = ALL_SETTINGS[userId];
  Object.keys(st.notify).forEach(k=>{ if(typeof st.notify[k]==='boolean') st.notify[k] = {inApp: st.notify[k], email:false}; });
  NOTIFY_ITEMS.forEach(([key])=>{ if(!st.notify[key]) st.notify[key] = {inApp:false, email:false}; });
  return st;
}

/* ============ HELPERS ============ */
function esc(s){ return String(s??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
// Uploaded files are stored as data: URLs and put into src/href -- only allow real image/PDF data
// (never javascript: or HTML data URLs), escaped for the attribute (2026-10-09 audit 1.9).
function safeDataUrl(u){ return /^data:(image\/(png|jpe?g|gif|webp|svg\+xml|heic|heif|avif|bmp)|application\/pdf);base64,[A-Za-z0-9+\/=]+$/.test(String(u||'')) ? esc(u) : ''; }
function eventsFor(artistId){ return S.events.filter(e=>e.artistId===artistId); }
function getEvent(id){ return S.events.find(e=>e.id===id); }
/* ---- EventStore (navigation/data-layer refactor, Wave A): a real revision check + visible save
   failures on top of the existing getEvent()/saveEvents() primitives -- without changing their
   underlying storage shape (still one S.events array, one localStorage key). New call sites
   should prefer updateEvent(id, patch) over the established "mutate the object returned by
   getEvent(), then remember to call saveEvents()" pattern; existing call sites are migrated
   incrementally across several PRs, not all at once -- see the plan file for the full sequence.
   Conflict detection: re-reads what's ACTUALLY persisted in localStorage right now (not just this
   tab's in-memory S.events) and compares updatedAt against what this tab last knew for the same
   event. A mismatch means something else -- another tab, a stale reload -- wrote a newer version
   since this tab loaded; the previous code had no such check and would silently clobber it
   (saveEvents() just serializes the whole in-memory array over whatever's in localStorage).
   Deliberately does NOT require ev.updatedAt to already be set: most seeded/legacy events have
   never been through updateEvent() and so have no updatedAt yet at all -- that first-ever write
   is exactly the common case this needs to protect, not just the second and later ones. */
function updateEvent(id, patch, opts={}){
  if(artistReadOnly()){ PENDING_LOG.delete(id); return { ok:false, error:'read_only' }; }
  const ev = getEvent(id);
  if(!ev){ PENDING_LOG.delete(id); return { ok:false, error:'not_found' }; }
  if(!opts.force){
    let persisted = null;
    try{ const raw = localStorage.getItem(LS_KEY); if(raw) persisted = JSON.parse(raw).find(e=>e.id===id); }catch(e){}
    if(persisted && persisted.updatedAt && persisted.updatedAt !== (ev.updatedAt||null)){
      PENDING_LOG.delete(id);
      return { ok:false, error:'conflict', persisted };
    }
  }
  Object.assign(ev, patch, { updatedAt: new Date().toISOString() });
  const saved = saveEvents();
  if(!saved.ok) return { ok:false, error:'save_failed' };
  return { ok:true, event: ev };
}
// Shared toast for the many updateEvent() call sites migrated in PR 14 -- one consistent message
// shape instead of hand-writing the same conflict/failure text at each of them. Returns true on
// success (nothing shown) so callers can write `if(!reportEventSave(result, '...')) return;`.
function reportEventSave(result, actionLabel){
  if(result.ok) return true;
  toast(result.error==='conflict' ? `This gig changed elsewhere since you loaded it — reload before ${actionLabel}.`
    : result.error==='read_only' ? 'Only the office can change gig details.' : 'Could not save.', 'system');
  return false;
}
function fmtDate(iso){ const d=new Date(iso+'T00:00:00'); return d.toLocaleDateString('en-US',{weekday:'short', month:'short', day:'numeric', year:'numeric'}); }
function fmtDateShort(iso){ const d=new Date(iso+'T00:00:00'); return d.toLocaleDateString('en-US',{month:'short', day:'numeric'}); }
function fmtDateWeekday(iso){ const d=new Date(iso+'T00:00:00'); return d.toLocaleDateString('en-US',{weekday:'short', month:'short', day:'numeric'}); }
function fmtTime(t){ const [h,m]=t.split(':').map(Number); const ap=h>=12?'PM':'AM'; const hh=((h+11)%12)+1; return `${hh}:${String(m).padStart(2,'0')} ${ap}`; }
function fmtTimeRange(start, end){ if(!start) return 'Time TBD'; if(start==='00:00' && !end) return 'All day'; return end? `${fmtTime(start)} – ${fmtTime(end)}` : fmtTime(start); }
function hoursBetween(start, end){
  if(!start || !end) return null;
  const [sh,sm] = start.split(':').map(Number), [eh,em] = end.split(':').map(Number);
  let mins = (eh*60+em) - (sh*60+sm);
  if(mins <= 0) mins += 24*60;
  const hrs = mins/60;
  return Number.isInteger(hrs) ? String(hrs) : hrs.toFixed(1);
}
function fmtFlightDateTime(s){
  if(!s || s==='—') return '—';
  const [datePart, timePart] = s.split(' ');
  if(!datePart || !timePart) return s;
  return `${fmtDateShort(datePart)} · ${fmtTime(timePart)}`;
}
function addMinutesToTime(t, mins){ const [h,m]=t.split(':').map(Number); const total=(h*60+m+mins+1440)%1440; return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`; }
function daysUntil(iso){ const today=new Date(); today.setHours(0,0,0,0); const d=new Date(iso+'T00:00:00'); return Math.round((d-today)/86400000); }
function isPast(iso){ return daysUntil(iso) < 0; }
// Standard follow-up cadence: every 2 weeks, tightening to weekly once the gig is under a month out.
function defaultReminderCadence(iso){ return daysUntil(iso) > 30 ? 14 : 7; }
function fullLocation(ev){
  const parts = [ev.venue, ev.city, ev.state].filter(Boolean);
  return parts.length? parts.join(', ') : 'Location TBD';
}
function hasLocation(ev){ return !!(ev.venue || ev.address || ev.city || ev.state); }
// Navigation links for a gig's venue. Artist-portal rows carry the view's map_query; local gigs
// join the same parts.
function mapLinks(ev){
  const mapQuery = ev.mapQuery || [ev.venue, ev.address, ev.city, ev.state].filter(Boolean).join(', ');
  return {
    waze: 'https://waze.com/ul?q=' + encodeURIComponent(mapQuery) + '&navigate=yes',
    google: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(mapQuery),
  };
}
function gmapsUrl(ev){ return mapLinks(ev).google; }
function wazeUrl(ev){ return mapLinks(ev).waze; }
// data-action="external-link" keeps a click on the link from also opening the row it sits in.
function renderMapLinks(ev){
  if(!hasLocation(ev)) return '';
  const l = mapLinks(ev);
  const a = (href, text)=>`<a href="${esc(href)}" target="_blank" rel="noopener" data-action="external-link" style="font-size:11px;font-weight:700;color:var(--accent);text-decoration:none;">${text}</a>`;
  return `<span style="display:flex;gap:10px;flex-wrap:wrap;margin-top:4px;">${a(l.waze, 'Navigate (Waze)')}${a(l.google, 'Google Maps')}</span>`;
}
const US_STATES = new Set(['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC']);
function isInternational(ev){ const s=(ev.state||'').trim().toUpperCase(); return s.length>0 && !US_STATES.has(s); }
// Scheduling conflicts compare TIMES, not just dates (owner 2026-10-13): two things on the same day
// conflict only if their time ranges overlap. A gig with no end time is taken as 3 hours (same as
// the calendar export); one ending at or before its start runs past midnight. "All day" and "Time
// TBD" items hold the whole day. A booked flight holds depart -> arrive (a side with no time holds
// its whole day).
const HOUR_MS = 3600000, DAY_MS = 86400000;
function dayStartMs(iso){ return new Date(iso+'T00:00:00').getTime(); }
function eventBusyRanges(ev){
  const ranges = [];
  if(ev.date){
    if(!ev.time || (ev.time==='00:00' && !ev.endTime)) ranges.push([dayStartMs(ev.date), dayStartMs(ev.date)+DAY_MS]);
    else {
      const start = new Date(ev.date+'T'+ev.time+':00').getTime();
      let end = ev.endTime ? new Date(ev.date+'T'+ev.endTime+':00').getTime() : start + 3*HOUR_MS;
      if(end <= start) end += DAY_MS;
      ranges.push([start, end]);
    }
  }
  if(ev.flight){
    const at = v=>{ const m = String(v||'').match(/^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}))?/);
      return m ? { day: dayStartMs(m[1]), ms: m[2] && m[2]!=='00:00' ? new Date(m[1]+'T'+m[2]+':00').getTime() : null } : null; };
    const dep = at(ev.flight.depart), arr = at(ev.flight.arrive);
    if(dep && arr && dep.ms!==null && arr.ms!==null && arr.ms > dep.ms) ranges.push([dep.ms, arr.ms]);
    else [dep, arr].forEach(x=>{ if(x) ranges.push(x.ms!==null ? [x.ms, x.ms+HOUR_MS] : [x.day, x.day+DAY_MS]); });
  }
  return ranges;
}
function findConflicts(ev){
  const mine = eventBusyRanges(ev);
  return S.events.filter(e=>{
    if(e.id===ev.id || e.artistId!==ev.artistId) return false;
    return eventBusyRanges(e).some(([s2,e2])=>mine.some(([s1,e1])=> s1 < e2 && s2 < e1));
  });
}
function allConflictPairs(){
  const seen = new Set(); const pairs = [];
  S.events.forEach(ev=>{
    findConflicts(ev).forEach(other=>{
      const key = [ev.id, other.id].sort().join('|');
      if(!seen.has(key)){ seen.add(key); pairs.push([ev, other]); }
    });
  });
  return pairs;
}
// The booking pipeline, in order -- single owner of the status keys, their order and the short
// timeline labels (statusMeta() below owns the pill labels). Groups/predicates replace the ~20
// inline ['booked','paid'] / ['lead','negotiating','contract_sent'] lists (2026-10-09 audit 3.9).
const EVENT_PIPELINE = [
  {key:'lead', step:'Lead'}, {key:'negotiating', step:'Negotiating'}, {key:'contract_sent', step:'Contract Sent'},
  {key:'booked', step:'Booked'}, {key:'paid', step:'Paid in Full'},
];
const STATUS_GROUPS = { open:['lead','negotiating','contract_sent'], confirmed:['booked','paid'] };
function isOpenLead(e){ return STATUS_GROUPS.open.includes(e.status); }
function isConfirmed(e){ return STATUS_GROUPS.confirmed.includes(e.status); }
function statusMeta(ev){
  const map = {
    lead:      {label:'New Lead', cls:'pill-neutral'},
    negotiating:{label:'Negotiating', cls:'pill-warn'},
    contract_sent:{label:'Contract Sent', cls:'pill-warn'},
    booked:    {label: ev.balanceReceived? 'Paid in Full':'Booked · Balance Pending', cls: ev.balanceReceived? 'pill-good':'pill-accent'},
    paid:      {label: isPast(ev.date)?'Completed':'Paid in Full', cls:'pill-good'},
    scheduled: {label: isPast(ev.date)?'Completed':'Scheduled', cls:'pill-neutral'},
  };
  return map[ev.status] || {label:ev.status, cls:'pill-neutral'};
}
function toast(msg, type){
  const wrap = document.getElementById('toasts');
  const el = document.createElement('div');
  el.className='toast';
  const ic = type==='email'? ICO.mail : type==='success'? ICO.check : ICO.bell;
  el.innerHTML = `<span style="color:var(--accent);margin-top:1px;">${ic}</span><span>${esc(msg)}</span>`;
  wrap.appendChild(el);
  setTimeout(()=>{ el.style.transition='.25s ease'; el.style.opacity='0'; el.style.transform='translateY(6px)'; setTimeout(()=>el.remove(),260); }, 4200);
}
// Activity-log lines wait for the gig's next save and are written in that same write (saveEvents),
// so a save that updateEvent() refuses -- a conflict, an artist session -- leaves no half-applied
// log behind; the refused lines are dropped with it (2026-10-09 audit 3.15).
const PENDING_LOG = new Map();
function logEvent(ev, type, text){
  const q = PENDING_LOG.get(ev.id) || [];
  q.push({ ts:new Date().toISOString(), type, text });
  PENDING_LOG.set(ev.id, q);
}
function applyPendingLog(){
  PENDING_LOG.forEach((entries, id)=>{ const ev = getEvent(id); if(ev) ev.log = [...(ev.log||[]), ...entries]; });
  PENDING_LOG.clear();
}

/* ============ INSTALL PROMPT ============ */
let deferredInstallPrompt = null;
function isStandalone(){ return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true; }
function isIOS(){ return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream; }
function isMobileUA(){ return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent); }
function shouldShowInstallBanner(){
  if(isStandalone() || !isMobileUA()) return false;
  const dismissedAt = Number(localStorage.getItem('aspInstallDismissedAt')||0);
  if(Date.now() - dismissedAt < 14*24*60*60*1000) return false;
  return true;
}
window.addEventListener('beforeinstallprompt', (e)=>{ e.preventDefault(); deferredInstallPrompt = e; render(); });
window.addEventListener('appinstalled', ()=>{ deferredInstallPrompt=null; S.showInstallBanner=false; render(); });
function renderInstallBanner(){
  if(!S.showInstallBanner) return '';
  const ios = isIOS();
  const canPrompt = !!deferredInstallPrompt;
  return `<div class="install-banner">
    <span class="ib-icon">ASP</span>
    <div class="ib-text">
      <strong>Add ASP Bookings to your Home Screen</strong>
      ${ios
        ? `Tap <span class="ib-steps">${ICO.share} Share</span>, then <span class="ib-steps">${ICO.plus} Add to Home Screen</span>.`
        : canPrompt
          ? `Install it for one-tap access, like a real app.`
          : `Open your browser menu and choose <strong>Add to Home Screen</strong> or <strong>Install app</strong>.`}
    </div>
    ${(!ios && canPrompt) ? `<button class="btn btn-sm btn-primary" data-action="install-app">Install</button>` : ''}
    <button class="ib-close" data-action="dismiss-install" title="Dismiss">${ICO.x}</button>
  </div>`;
}

S.showInstallBanner = shouldShowInstallBanner();

function closeAllOverlays(){
  S.eventId=null; S.projectId=null; S.showNewLead=false; S.showAddArtist=false; S.newArtistWelcome=null;
  S.dayListDate=null; S.showNewProject=false; S.showFlightForm=false;
  S.showTransportForm=false; S.showItinerary=false; S.itineraryEventId=null; S.showBlockTime=false; S.showAskAI=false; S.showDressCodeForm=false;
  S.showEditEvent=false;
  S.showGigInfoForm=false; S.gigInfoForm={}; S.newGigContactForm={}; S.showGigInfoDoc=false; S.gigInfoDocEventId=null;
  S.showTravelDrop=false; S.travelDropForm={}; S.travelDropFiles=[]; S.travelDropResult=null; S.showClientContact=false;
  S.showNewInvoice=false; S.showInvoiceDoc=false; S.invoiceDocId=null; S.showNewOutsideBooking=false;
  S.showOutsideBookingDetail=false; S.outsideBookingDetailId=null;
  S.showDocumentBuilder=false; S.documentId=null; S.showAiEditNotice=false;
  S.showAddCharge=false; S.showEventMenu=false; S.projectTab='tasks'; S.taskAssigneeFilter=null; S.showReminderPreview=false; S.showBookingConfirmation=false;
  S.showMobileMenu=false; S.showAddRealUser=false; S.showEditRealUser=false;
  S.showContractBuilder=false; S.contractBuilderId=null; S.showContractBuilderDoc=false;
  S.showTemplatePicker=false; S.templatePickerLeadId=null;
  S.showPayeeProfileForm=false; S.payeeProfileForm={}; S.editingPayeeProfileId=null;
  S.showSendContractConfirm=false; S.sendContractForm={}; S.sendContractBusy=false;
  S.showVerifyDeposit=false; S.verifyDepositEventId=null; S.verifyDepositForm={};
  S.showTravelRequestDetail=false; S.travelRequestDetailId=null;
}
let pendingViewTransition = false;
let pendingViewDirection = 'right';
function slideDirection(oldView, newView){
  const oldIdx = navOrderIndex(oldView), newIdx = navOrderIndex(newView);
  return (oldIdx!==-1 && newIdx!==-1 && newIdx<oldIdx) ? 'left' : 'right';
}
/* ============ URL ROUTING (hash-based -- works on static hosting with no server config) ============ */
function pathForState(){
  let seg = S.view;
  if(S.view==='artist_detail' && S.artistDetailId) seg += '/'+S.artistDetailId;
  if(S.view==='project_detail' && S.projectId) seg += '/'+S.projectId;
  return '#/'+seg;
}
function syncURL(){
  const path = pathForState();
  if(location.hash !== path) history.pushState(null, '', path);
}
function applyHashToState(){
  const hash = location.hash.replace(/^#\/?/, '');
  if(!hash) return;
  const [view, id] = hash.split('/');
  if(view==='artist_detail'){ S.view='artist_detail'; S.artistDetailId=id; }
  else if(view==='project_detail'){ S.view='project_detail'; S.projectId=id; }
  else { S.view = view; }
}
window.addEventListener('popstate', ()=>{
  const oldView = S.view;
  closeAllOverlays();
  applyHashToState();
  pendingViewTransition = true;
  pendingViewDirection = slideDirection(oldView, S.view);
  render();
});
window.addEventListener('resize', repositionNavSliders);
window.addEventListener('orientationchange', ()=> setTimeout(repositionNavSliders, 60));
function navigate(view, opts={}){
  const oldView = S.view;
  closeAllOverlays();
  const changed = oldView!==view;
  S.view=view;
  Object.assign(S, opts);
  if(changed){ pendingViewTransition = true; pendingViewDirection = slideDirection(oldView, view); }
  markSeen(view);
  syncURL();
  render();
  window.scrollTo({top:0});
}
function openEvent(id){ closeAllOverlays(); S.eventId=id; render(); }
function closeSheet(){ closeAllOverlays(); render(); }

/* ============ GOOGLE CAL / ICS ============ */
// A gig with no time yet (imported gigs) goes in as an all-day entry.
function calendarSpan(ev){
  const day = ev.date.replace(/-/g,'');
  if(!ev.time){ const next = new Date(ev.date+'T00:00:00'); next.setDate(next.getDate()+1); return { start: day, end: localISO(next).replace(/-/g,''), allDay:true }; }
  const start = day+'T'+ev.time.replace(':','')+'00';
  const endDate = ev.endTime ? new Date(ev.date+'T'+ev.endTime+':00') : new Date(ev.date+'T'+ev.time+':00');
  if(!ev.endTime) endDate.setHours(endDate.getHours()+3);
  return { start, end: endDate.toISOString().slice(0,19).replace(/[-:]/g,''), allDay:false };
}
function gcalUrl(ev){
  const artist = artistById(ev.artistId);
  const { start, end } = calendarSpan(ev);
  const details = `${ev.type} for ${artist.name}.${ev.clientName ? ` Client: ${ev.clientName}.` : ''} Booked via ASP.`;
  const params = new URLSearchParams({action:'TEMPLATE', text:`${artist.name} — ${ev.type}`, dates:`${start}/${end}`, details, location:fullLocation(ev)});
  return 'https://calendar.google.com/calendar/render?'+params.toString();
}
function downloadIcs(ev){
  const artist = artistById(ev.artistId);
  const { start, end, allDay } = calendarSpan(ev);
  const ics = ['BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT',`UID:${ev.id}@asp-bookings`,allDay?`DTSTART;VALUE=DATE:${start}`:`DTSTART:${start}`,allDay?`DTEND;VALUE=DATE:${end}`:`DTEND:${end}`,`SUMMARY:${artist.name} — ${ev.type}`,`LOCATION:${fullLocation(ev)}`,`DESCRIPTION:${ev.clientName ? `Client ${ev.clientName}. ` : ''}Booked via ASP.`,'END:VEVENT','END:VCALENDAR'].join('\r\n');
  const blob = new Blob([ics], {type:'text/calendar'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${artist.name.replace(/\s/g,'_')}_${ev.date}.ics`; a.click();
}

function exportCSV(){
  const filt = S.finArtistFilter==='all' ? S.events : S.events.filter(e=>e.artistId===S.finArtistFilter);
  const rows = filt.filter(e=>isConfirmed(e));
  const cols = ['Artist','Client','Date','Type','Venue','City','State','Price','Charges','Commission','Payout','Status'];
  const csvEsc = (v)=>{ const s=String(v??''); return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; };
  const lines = [cols.join(',')];
  rows.sort((a,b)=>a.date.localeCompare(b.date)).forEach(e=>{
    const a = artistById(e.artistId); const sm = statusMeta(e);
    lines.push([a.name, e.clientName, e.date, e.type, e.venue, e.city, e.state, e.price, chargesTotal(e), e.commission, artistPayout(e), sm.label].map(csvEsc).join(','));
  });
  const blob = new Blob([lines.join('\r\n')], {type:'text/csv'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `asp-bookings-${S.finArtistFilter}-${todayISO()}.csv`; a.click();
  toast('CSV exported.', 'system');
}

function positionOneNavSlider(container, sliderClass, oldRect, axis){
  const active = container.querySelector('.active');
  if(!active) return;
  const slider = document.createElement('div');
  slider.className = sliderClass;
  container.insertBefore(slider, container.firstChild);
  const newRect = axis==='vertical'
    ? {top:active.offsetTop, height:active.offsetHeight}
    : {left:active.offsetLeft, width:active.offsetWidth};
  if(oldRect){
    slider.style.transition = 'none';
    if(axis==='vertical'){ slider.style.top = oldRect.top+'px'; slider.style.height = oldRect.height+'px'; }
    else { slider.style.left = oldRect.left+'px'; slider.style.width = oldRect.width+'px'; }
    void slider.offsetHeight;
    slider.style.transition = '';
  }
  if(axis==='vertical'){ slider.style.top = newRect.top+'px'; slider.style.height = newRect.height+'px'; }
  else { slider.style.left = newRect.left+'px'; slider.style.width = newRect.width+'px'; }
}
// containerSel can match more than one element at once (e.g. the desktop rail's
// .rail-nav is still in the DOM, just hidden, while the mobile slide-out menu
// renders its own .rail-nav) -- every match needs its own slider, paired with the
// old rect captured from the same position in DOM order.
function positionNavSlider(containerSel, sliderClass, oldRects, axis){
  document.querySelectorAll(containerSel).forEach((container, i)=>{
    positionOneNavSlider(container, sliderClass, (oldRects||[])[i]||null, axis);
  });
}
function captureNavRects(containerSel, axis){
  return Array.from(document.querySelectorAll(containerSel)).map(container=>{
    const active = container.querySelector('.active');
    if(!active) return null;
    return axis==='vertical' ? {top:active.offsetTop, height:active.offsetHeight} : {left:active.offsetLeft, width:active.offsetWidth};
  });
}
// Viewport size changes (phone rotation, window resize) don't go through render(), but the
// nav sliders' position/size is inline-styled pixels captured at the last render -- so a
// container that resizes via CSS (e.g. .bottom-nav's safe-area-driven left/right insets)
// leaves the slider stale. Re-measure the *existing* slider elements in place (no new
// element, no animation) rather than reusing positionNavSlider, which always inserts a
// fresh slider div and would double them up here.
function repositionNavSliders(){
  document.querySelectorAll('.rail-nav').forEach(container=>{
    const active = container.querySelector('.active'), slider = container.querySelector('.rail-slider');
    if(!active || !slider) return;
    slider.style.transition = 'none';
    slider.style.top = active.offsetTop+'px'; slider.style.height = active.offsetHeight+'px';
    void slider.offsetHeight;
    slider.style.transition = '';
  });
  document.querySelectorAll('.bottom-nav').forEach(container=>{
    const active = container.querySelector('.active'), slider = container.querySelector('.bn-slider');
    if(!active || !slider) return;
    slider.style.transition = 'none';
    slider.style.left = active.offsetLeft+'px'; slider.style.width = active.offsetWidth+'px';
    void slider.offsetHeight;
    slider.style.transition = '';
  });
}
/* ============ RENDER: SHELL ============ */
// Search boxes that re-render on every keystroke need their cursor back after render -- but only
// if they had it, or just appeared (a modal opened). Focusing them unconditionally on every render
// stole the cursor from whatever field the user was typing in (2026-10-09 audit 4.8).
const AUTO_FOCUS_INPUT_IDS = ['contractsSearchInput','askAIInput','contractSearchInput'];
let autoFocusBeforeRender = { focusedId:null, present:[] };
function shouldRefocus(id){ return autoFocusBeforeRender.focusedId===id || !autoFocusBeforeRender.present.includes(id); }
// A render asked for while one is running -- e.g. tearing down a focused field fires blur -> change
// -> render() -- runs right after it instead of inside it. Nested, it removed DOM the outer render
// was still using ("The node to be removed is no longer a child of this node").
let renderDepth = 0, renderQueued = false;
function render(){
  if(renderDepth){ renderQueued = true; return; }
  renderDepth++;
  try{ renderNow(); } finally { renderDepth--; }
  if(renderQueued){ renderQueued = false; render(); }
}
function renderNow(){
  autoFocusBeforeRender = { focusedId: document.activeElement && document.activeElement.id || null, present: AUTO_FOCUS_INPUT_IDS.filter(id=>document.getElementById(id)) };
  const app = document.getElementById('app');
  const prevScroll = { sheet: document.querySelector('.sheet')?.scrollTop, modal: document.querySelector('.modal')?.scrollTop };
  const hadOverlay = !!document.querySelector('.overlay');
  const oldRailRects = captureNavRects('.rail-nav', 'vertical');
  const oldBnRects = captureNavRects('.bottom-nav', 'horizontal');
  let exitClone = null, exitDir = null;
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(pendingViewTransition && !reduceMotion){
    const oldContent = document.querySelector('.content');
    const r = oldContent ? oldContent.getBoundingClientRect() : null;
    if(r && r.width && r.height){
      exitDir = pendingViewDirection;
      exitClone = oldContent.cloneNode(true);
      exitClone.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
      exitClone.className = 'content-exit-clone ' + (exitDir==='right' ? 'exit-left' : 'exit-right');
      exitClone.style.top = r.top+'px'; exitClone.style.left = r.left+'px';
      exitClone.style.width = r.width+'px'; exitClone.style.height = r.height+'px';
    }
  }
  if(!S.user){ app.innerHTML = renderLogin() + renderInstallBanner(); bindGlobal(); return; }
  const isAdmin = isAdminUser(S.user);
  app.innerHTML = `
    <div class="shell">
      ${isAdmin ? renderRail() : ''}
      <div class="main">
        ${S.previewFrom ? `<div class="preview-banner" data-testid="preview-banner"><span>Previewing <strong>${esc((artistById(S.user)||{}).name||'')}</strong>'s app · read-only, built from the office's copy of their gigs</span><button class="btn btn-sm" data-action="exit-preview">Exit preview</button></div>` : ''}
        ${isAdmin ? '' : renderArtistTopTabs()}
        <div class="topbar">
          <div style="display:flex;align-items:center;gap:6px;min-width:0;overflow:hidden;">
            <button class="icon-btn hamburger-btn" data-action="open-mobile-menu" title="Menu" aria-label="Menu">${ICO.menu}</button>
            <h1 style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${pageTitle()}</h1>
          </div>
          <div style="display:flex;align-items:center;gap:10px;flex:none;">
            ${crewUser() ? '' : `<button class="btn askai-btn" data-action="open-ask-ai" title="Ask AI" style="background:var(--accent-wash);color:var(--accent-ink);border-color:transparent;">${ICO.sparkle}<span class="btn-label">Ask AI</span></button>`}
            ${isAdmin ? `<button class="btn btn-primary newlead-btn" data-action="open-new-lead">${ICO.leads}<span class="btn-label">New Lead</span></button>` : ''}
            ${renderUserChip()}
          </div>
        </div>
        <div class="content${pendingViewTransition?(' view-enter-'+pendingViewDirection):''}">${renderView()}</div>
      </div>
    </div>
    ${renderBottomNav(isAdmin)}
    ${S.showMobileMenu ? renderMobileMenu(isAdmin) : ''}
    ${S.showNewLead ? renderNewLeadModal() : ''}
    ${S.showBlockTime ? renderBlockTimeModal() : ''}
    ${S.showAskAI ? renderAskAIModal() : ''}
    ${S.showNewInvoice ? renderNewInvoiceModal() : ''}
    ${S.showNewOutsideBooking ? renderNewOutsideBookingModal() : ''}
    ${S.showOutsideBookingDetail ? renderOutsideBookingDetailSheet() : ''}
    ${S.showDocumentBuilder ? renderDocumentBuilderModal() : ''}
    ${S.showAddArtist ? renderAddArtistModal() : ''}
    ${S.newArtistWelcome ? renderWelcomeEmailPreview() : ''}
    ${S.showAddRealUser ? renderAddRealUserModal() : ''}
    ${S.showEditRealUser ? renderEditRealUserModal() : ''}
    ${S.showPayeeProfileForm ? renderPayeeProfileFormModal() : ''}
    ${S.dayListDate ? renderDayList() : ''}
    ${S.showNewProject ? renderNewProjectModal() : ''}
    ${S.eventId ? (crewUser() ? renderCrewGigSheet(getEvent(S.eventId)) : renderEventSheet(getEvent(S.eventId))) : ''}
    ${S.showTravelRequestDetail ? renderTravelRequestDetailSheet() : ''}
    ${S.showReminderPreview ? renderReminderPreview() : ''}
    ${S.showBookingConfirmation ? renderBookingConfirmationPreview() : ''}
    ${renderInstallBanner()}
  `;
  pendingViewTransition = false;
  bindGlobal();
  positionNavSlider('.rail-nav', 'rail-slider', oldRailRects, 'vertical');
  positionNavSlider('.bottom-nav', 'bn-slider', oldBnRects, 'horizontal');
  if(exitClone){
    document.body.appendChild(exitClone);
    setTimeout(()=>{ exitClone.remove(); }, 280);
  }
  if(hadOverlay){
    document.querySelectorAll('.overlay, .modal, .sheet, .doc').forEach(el=>{ el.style.animationDuration='0.001ms'; });
  }
  if(prevScroll.sheet){ const s=document.querySelector('.sheet'); if(s) s.scrollTop = prevScroll.sheet; }
  if(prevScroll.modal){ const m=document.querySelector('.modal'); if(m) m.scrollTop = prevScroll.modal; }
}

function renderDayEventRow(e, isAdmin, action, opts={}){
  const a = artistById(e.artistId) || NO_ARTIST; const sm = isAdminUser(S.user) ? statusMeta(e) : artistGigStatus(e);
  const timeLabel = !e.time ? 'Time TBD' : e.time==='00:00'?'All day':fmtTime(e.time);
  let primary, secondary;
  if(opts.showDate){
    // Multi-day lists (dashboard "upcoming"/"open leads") need the date on the row —
    // single-day contexts (day-list popover, week/day calendar) already show the date
    // as their own heading, so they keep the original time-led layout below.
    if(isAdmin){
      primary = `${esc(a.name)} — ${fmtDateWeekday(e.date)}`;
      secondary = `${timeLabel} &middot; ${esc(e.clientName||e.type)}`;
    } else {
      primary = `${fmtDateWeekday(e.date)} &middot; ${timeLabel}`;
      secondary = `${esc(e.venue||'Location TBD')} <span style="font-size:10px;opacity:.7;">&middot; ${esc(e.clientName||e.type)}</span>`;
    }
  } else {
    primary = `${timeLabel} — ${isAdmin?esc(a.name):esc(e.clientName||e.type)}`;
    secondary = `${isAdmin?esc(e.clientName||e.type):esc(e.venue)} &middot; ${esc(e.type)}`;
  }
  return `<button class="chooser-row" data-action="${action}" data-id="${e.id}">
    <span class="avatar" data-slot="${a.slot}" style="width:32px;height:32px;font-size:11px;">${esc(a.initials)}</span>
    <span style="flex:1;min-width:0;"><strong>${primary}</strong><span class="chooser-email">${secondary}</span></span>
    <span class="pill ${sm.cls}">${esc(sm.label)}</span>
  </button>`;
}
function renderDayList(){
  const iso = S.dayListDate;
  const isAdmin = isAdminUser(S.user);
  const evs = S.events.filter(e=>e.date===iso && (isAdmin || crewUser() || e.artistId===S.user)).sort((a,b)=>a.time.localeCompare(b.time)); // crew: S.events is already their own list
  return `<div class="overlay center" data-action="dayoverlay-close">
    <div class="modal" data-stop style="width:400px;">
      <div class="sheet-head"><h2 style="font-size:1.1rem;">${fmtDate(iso)}</h2><button class="icon-btn" data-action="close-daylist" aria-label="Close">${ICO.x}</button></div>
      <div class="sheet-body" style="padding-top:8px;gap:2px;">
        ${evs.length? evs.map(e=>renderDayEventRow(e, isAdmin, 'open-event-from-day')).join('') : `<p style="color:var(--ink-3);font-size:13px;margin:0;">Nothing on this date.</p>`}
      </div>
    </div>
  </div>`;
}

function pageTitle(){
  if(S.showNewLead) return (S.newLeadForm.kind==='internal') ? 'New Internal Day' : 'New Lead';
  if(S.eventId){ const ev=getEvent(S.eventId); return ev ? artistById(ev.artistId).name : ''; }
  const v = VIEWS[S.view];
  const t = v && (typeof v.title==='function' ? v.title() : v.title);
  return t || 'ASP Bookings';
}

function renderUserChip(){
  if(isAdminUser(S.user)){
    const u = adminById(S.user);
    return `<div class="user-chip"><span class="avatar" data-slot="0" style="background:var(--ink);color:var(--page);width:22px;height:22px;font-size:10px;">${esc(u.initials)}</span> <span class="chip-name">${esc(u.name)}</span>
      <button class="icon-btn" data-action="logout" title="Switch user" aria-label="Switch user">${ICO.logout}</button></div>`;
  }
  const a = crewUser() || artistById(S.user);
  return `<div class="user-chip"><span class="avatar" data-slot="${a.slot||0}" style="width:22px;height:22px;font-size:10px;">${esc(a.initials)}</span> <span class="chip-name">${esc(a.name)}</span>
    <button class="icon-btn" data-action="logout" title="Switch user" aria-label="Switch user">${ICO.logout}</button></div>`;
}

const MGMT_NAV_ITEMS = [
  ['dashboard','Dashboard',ICO.dash], ['calendar','Calendar',ICO.cal], ['leads','Leads',ICO.leads],
  ['artists','Artists',ICO.artists], ['travel','Travel',ICO.suitcase], ['projects','Projects',ICO.kanban], ['pricing','Pricing',ICO.tag], ['financials','Financials',ICO.money],
  ['contracts','Contracts',ICO.leads],
  ['contract_builder','Contract Builder',ICO.edit],
  ['messages','Inbox',ICO.sms],
  ['videos','Media',ICO.film],
  ['whatsapp','WhatsApp',ICO.wa],
];
// External Events (outside_bookings) and Documents were removed from the menu for everyone
// (2026-10-09, Moshe's call) -- their pages still exist and open by URL (#/outside_bookings,
// #/documents). Contract Builder is office/bookkeeping work Ilan (CEO) doesn't need on his
// simplified view — hidden for that login only.
const CEO_HIDDEN_NAV_VIEWS = ['contract_builder'];
function mgmtNavItemsFor(userId){
  return MGMT_NAV_ITEMS.filter(([v])=> !(CEO_HIDDEN_NAV_VIEWS.includes(v) && adminRoleOf(userId)==='admin_ceo') && (v!=='videos' || canSeeLibrary()) && (v!=='whatsapp' || canUseWhatsApp()));
}
/* ============ "NEW SINCE YOU LAST LOOKED" BADGES ============ */
// Per-section last-visited date (YYYY-MM-DD), persisted so the badge survives a reload.
// A key with no stored date is seeded to today on first load, rather than treating all
// existing history as "new" the moment this feature ships.
const LAST_SEEN_LS_KEY = 'asp_mock_lastseen_v1';
function loadLastSeen(){ try{ const raw = localStorage.getItem(LAST_SEEN_LS_KEY); if(raw) return JSON.parse(raw); }catch(e){} return null; }
function saveLastSeen(){ try{ localStorage.setItem(LAST_SEEN_LS_KEY, JSON.stringify(LAST_SEEN)); }catch(e){} }
let LAST_SEEN = loadLastSeen() || {};
['leads','financials','messages'].forEach(k=>{ if(!LAST_SEEN[k]) LAST_SEEN[k] = todayISO(); });
saveLastSeen();
function markSeen(key){ if(LAST_SEEN[key]===undefined) return; LAST_SEEN[key] = todayISO(); saveLastSeen(); }
function newLeadsCount(){
  const since = LAST_SEEN.leads;
  return S.events.filter(e=>isOpenLead(e) && e.createdAt && e.createdAt>since).length;
}
function newPaymentsCount(){
  const since = LAST_SEEN.financials;
  return S.events.filter(e=>(e.depositReceivedDate && e.depositReceivedDate>since) || (e.balanceReceivedDate && e.balanceReceivedDate>since)).length;
}
function newMessagesCount(){ return (S.inboxItems||[]).length; } // emails waiting in the Inbox (0062)
function navBadgeCount(v){
  if(v==='leads') return newLeadsCount();
  if(v==='financials') return newPaymentsCount();
  if(v==='messages') return newMessagesCount();
  return 0;
}
function navBadge(v){
  const n = navBadgeCount(v);
  return n>0 ? `<span class="nav-badge">${n>9?'9+':n}</span>` : '';
}
const CREW_NAV_ITEMS = [['c_home','Today',ICO.dash], ['c_calendar','Calendar',ICO.cal], ['videos','Media',ICO.film]];
// The non-office menu: crew or artist.
function portalNavItems(){ return crewUser() ? CREW_NAV_ITEMS : ARTIST_NAV_ITEMS; }
const ARTIST_NAV_ITEMS = [
  ['a_dashboard','Dashboard',ICO.dash], ['a_calendar','Calendar',ICO.cal], ['a_gigs','My Gigs',MIC_PHOTO_ICON], ['a_travel','Travel',ICO.suitcase], ['a_financials','Financials',ICO.money], ['a_projects','Projects',ICO.kanban],
];
const APP_VERSION = 'v1.9.47'; // bump on every release so a phone can tell it has updated. v1.9.47: a switch to stop offering Zelle (Stripe + Mercury only). v1.9.46: Media Library counts photos everywhere. v1.9.45: a new venue's address is looked up and filled in. v1.9.44: Media Library (photos too; artist cards show a picture); removing a login works; Confirm Booking on a lead. v1.9.43: Video Library backs up to Google Drive (office@). v1.9.42: the Video Library browses inside the app (no embedded page). v1.9.41: drag and drop PDFs onto Flight Info and Travel Confirmations. v1.9.40: WhatsApp shows reactions, plays voice notes / photos / videos / documents, and contacts can be named. v1.9.39: WhatsApp in the owner's phone bar (in Projects' place). v1.9.38: WhatsApp tab (owner only): the office number's chats, live, with replies. v1.9.37: Preview a singer's app (Artists -> singer -> Preview their app); phones never scroll sideways or zoom; library tabs become a dropdown on phones. v1.9.36: crew accounts (social media sees every gig without money and asks the videographer; videographer confirms his gigs); Video Library private (owner, Ilan, crew). v1.9.35: Video Library tidied (pill tabs, styled fields, singer photo circles, copy link; public page restyled). v1.9.34: the Videos tab opens on the library itself (Library tab). v1.9.33: Video Library -- public /videos/ page, bulk upload and tagging
function navOrderIndex(v){
  const list = isAdminUser(S.user) ? MGMT_NAV_ITEMS : portalNavItems();
  return list.findIndex(([x])=>x===v);
}
function isNavActive(v){ return S.view===v || (v==='artists' && S.view==='artist_detail') || ((v==='projects'||v==='a_projects') && S.view==='project_detail'); }

function renderRail(){
  return `<div class="rail">
    <div class="wordmark">${brandLogoHtml({ width:150, local:true })}</div>
    <div class="rail-nav">
      ${mgmtNavItemsFor(S.user).map(([v,l,ic])=>`<a href="#" class="rail-link ${isNavActive(v)?'active':''}" data-action="nav" data-view="${v}"><span class="nav-icon-wrap">${ic}${navBadge(v)}</span>${l}</a>`).join('')}
      <a href="#" class="rail-link ${isNavActive('settings')?'active':''}" data-action="nav" data-view="settings">${ICO.settings}Settings</a>
    </div>
    <div class="rail-foot">
      <div style="padding:10px 10px 0;font-size:11px;color:var(--ink-3);">${APP_VERSION}</div>
    </div>
  </div>`;
}

function renderArtistTopTabs(){
  return `<div class="artist-top-tabs">
  <div class="topbar" style="border-bottom:none;padding-bottom:0;">
    <div class="wordmark">${brandLogoHtml({ width:140, local:true })}</div>
    <button class="icon-btn artist-settings-btn" data-action="nav" data-view="settings" title="Settings" aria-label="Settings">${ICO.settings}</button>
  </div>
  <div style="padding:0 28px;">
    <div class="tabbar">
      ${portalNavItems().map(([v,l])=>`<a href="#" class="tab ${isNavActive(v)?'active':''}" data-action="nav" data-view="${v}">${l}</a>`).join('')}
    </div>
  </div>
  </div>`;
}
function renderBottomNav(isAdmin){
  // Same role filter as the sidebar/hamburger menu (it used the raw list, so a CEO-hidden page was
  // only kept off the phone bar by a CSS hide-list).
  const items = isAdmin ? mgmtNavItemsFor(S.user) : portalNavItems();
  // The owner's phone bar (2026-10-29: "on the phone i want it [WhatsApp] on the slider menu, remove another
  // one"): WhatsApp takes Projects' place for whoever has WhatsApp access; Projects stays in the ☰ menu.
  return `<div class="bottom-nav${crewUser()?' crew':''}${isAdmin && canUseWhatsApp()?' has-wa':''}">
    ${items.map(([v,l,ic])=>`<a href="#" class="bn-item ${isNavActive(v)?'active':''}" data-action="nav" data-view="${v}"><span class="nav-icon-wrap">${ic}${navBadge(v)}</span><span>${l}</span></a>`).join('')}
  </div>`;
}
function renderMobileMenu(isAdmin){
  const who = isAdmin ? adminById(S.user) : (crewUser() || artistById(S.user));
  return `<div class="overlay left" data-action="mobilemenu-close">
    <div class="mobile-menu-panel" data-stop>
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div class="wordmark">${brandLogoHtml({ width:140, local:true })}</div>
        <button class="icon-btn" data-action="close-mobile-menu" aria-label="Close">${ICO.x}</button>
      </div>
      <div class="rail-nav">
        ${(isAdmin ? mgmtNavItemsFor(S.user) : portalNavItems()).map(([v,l,ic])=>`<a href="#" class="rail-link ${isNavActive(v)?'active':''}" data-action="nav" data-view="${v}"><span class="nav-icon-wrap">${ic}${navBadge(v)}</span>${l}</a>`).join('')}
        <a href="#" class="rail-link ${isNavActive('settings')?'active':''}" data-action="nav" data-view="settings">${ICO.settings}Settings</a>
      </div>
      <div class="rail-foot">
        <div style="display:flex;align-items:center;gap:10px;padding:4px 10px 12px;">
          <span class="avatar" data-slot="${isAdmin?'0':(who.slot||0)}" style="width:32px;height:32px;font-size:11px;${isAdmin?'background:var(--ink);color:var(--page);':''}">${esc(who.initials)}</span>
          <span style="font-size:13px;font-weight:600;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(who.name)}</span>
        </div>
        <a href="#" class="rail-link" data-action="logout" style="color:var(--crit);">${ICO.logout} Log Out</a>
        <div style="padding:10px 10px 0;font-size:11px;color:var(--ink-3);">${APP_VERSION}</div>
      </div>
    </div>
  </div>`;
}

// One registry of pages (2026-10-09 audit 5.1, first step): each page's title, who may open it and
// how it renders live here -- renderView(), pageTitle() and the URL guard all read it. (Menu order
// still comes from MGMT_NAV_ITEMS / ARTIST_NAV_ITEMS.) A reload or shared link keeps its page when
// the signed-in user may open it; anything else lands on their home page, never a blank screen.
// who: 'admin' | 'artist' | 'all'. title: string or function.
const VIEWS = {
  settings:         { who:'all',    title:'Settings',                   render:()=>renderSettingsPage() },
  project_detail:   { who:'all',    title:()=>{ const p=getProject(S.projectId); return p ? p.title : 'Project'; }, render:()=>renderProjectDetail() },
  dashboard:        { who:'admin',  title:'Dashboard',                  render:()=>renderMgmtDashboard() },
  calendar:         { who:'admin',  title:'Calendar',                   render:()=>renderCalendarPage(S.events, {showFilter:true}) },
  leads:            { who:'admin',  title:'Open Leads',                 render:()=>renderLeadsPage() },
  needs_review:     { who:'admin',  title:'Needs Review',               render:()=>renderNeedsReviewPage() },
  artists:          { who:'admin',  title:'Artists',                    render:()=>renderArtistsPage() },
  artist_detail:    { who:'admin',  title:()=>artistById(S.artistDetailId)?.name || '', render:()=>renderArtistDetailPage(S.artistDetailId) },
  financials:       { who:'admin',  title:'Financials',                 render:()=>renderFinancialsPage() },
  outside_bookings: { who:'admin',  title:'Other Bookings',             render:()=>renderOutsideBookingsPage() },
  documents:        { who:'admin',  title:'Documents',                  render:()=>renderDocumentsPage() },
  contracts:        { who:'admin',  title:'Contracts',                  render:()=>renderContractsPage() },
  contract_builder: { who:'admin',  title:'Contract Builder',           render:()=>renderContractsBuilderListPage() },
  messages:         { who:'admin',  title:'Inbox',                      render:()=>renderMessagesPage() },
  videos:           { who:'library', title:'Media Library',             render:()=>renderVideoLibraryPage() },
  whatsapp:         { who:'whatsapp', title:'WhatsApp',                 render:()=>renderWhatsAppPage() },
  projects:         { who:'admin',  title:'Projects',                   render:()=>renderProjectsBoard() },
  pricing:          { who:'admin',  title:'Pricing',                    render:()=>renderPricingPage() },
  international:    { who:'admin',  title:'International Opportunities', render:()=>renderInternationalPage() },
  daily_digest:     { who:'admin',  title:'Daily Digest',               render:()=>renderDailyDigestPage() },
  travel:           { who:'admin',  title:'Travel',                     render:()=>renderTravelPage(S.events) },
  a_dashboard:      { who:'artist', title:'My Dashboard',               render:()=>renderArtistDashboard(S.user) },
  a_calendar:       { who:'artist', title:'Calendar',                   render:()=>renderCalendarPage(eventsFor(S.user), {noLegend:true, singleArtist:true, showBlockButton:true}) },
  a_gigs:           { who:'artist', title:'My Gigs',                    render:()=>renderArtistGigs(S.user) },
  a_financials:     { who:'artist', title:'Financials',                 render:()=>renderArtistFinancials(S.user) },
  a_travel:         { who:'artist', title:'Travel',                     render:()=>renderTravelPage(eventsFor(S.user), {singleArtist:true}) },
  a_projects:       { who:'artist', title:'My Projects',                render:()=>renderArtistProjects(S.user) },
  c_home:           { who:'crew',   title:'Today',                      render:()=>renderCrewHome() },
  c_calendar:       { who:'crew',   title:'Calendar',                   render:()=>renderCalendarPage(S.events, crewUser() && crewUser().kind==='social' ? {showFilter:true} : {noLegend:true}) },
};
function homeViewFor(isAdmin){ return crewUser() ? 'c_home' : isAdmin ? 'dashboard' : 'a_dashboard'; }
// 'library' = the Video Library's people (0069): admins given library access, and crew.
function viewAllowed(view, isAdmin){
  const v = VIEWS[view]; if(!v) return false;
  if(v.who==='library') return canSeeLibrary();
  if(v.who==='whatsapp') return canUseWhatsApp();
  if(crewUser()) return v.who==='crew' || view==='settings';
  return v.who==='all' || v.who===(isAdmin?'admin':'artist');
}
function renderView(){
  if(S.user && !viewAllowed(S.view, isAdminUser(S.user))){ S.view = homeViewFor(isAdminUser(S.user)); syncURL(); }
  const v = VIEWS[S.view];
  return v ? v.render() : '';
}

/* ============ SETTINGS ============ */
const THEME_OPTIONS = [
  ['light', 'Light', '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>'],
  ['dark', 'Dark', '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>'],
];
const NOTIFY_ITEMS = [
  ['newLeads', 'New leads', 'A new booking request comes in', 'ASP books a new gig for you'],
  ['balanceReminders', 'Balance reminders', "A client's remaining balance is coming due", "A client's remaining balance is coming due"],
  ['bookingConfirmations', 'Booking confirmations', 'A gig is signed and officially locked in', 'A gig is signed and officially locked in'],
  ['weeklyGigDigest', 'Weekly gig digest', '', 'A weekly email listing your gigs for the coming week', true],
  ['dayOfReminder', 'Day-of reminder', '', "A reminder email the morning of each gig", true],
];
function renderRealPasskeySection(){
  if(S.realPasskeyBusy || S.realPasskeys===null){
    return `<div style="display:flex;align-items:center;gap:10px;padding:6px 0 10px;color:var(--ink-3);font-size:12.5px;">${markLoader(16)} Loading passkeys…</div>`;
  }
  const list = S.realPasskeys;
  return `
    ${list.length===0 ? `<p style="color:var(--ink-3);font-size:12.5px;margin:0 0 12px;">No passkeys yet on this account.</p>` : list.map(pk=>`<div class="passkey-row">
      <div class="passkey-ico">${ICO.key}</div>
      <div style="flex:1;min-width:0;"><strong style="font-size:13px;">${esc(pk.label)}</strong><br/><span style="font-size:11.5px;color:var(--ink-3);">${pk.addedAt?'Added '+fmtDateShort(pk.addedAt):''}</span></div>
      <button class="icon-btn" data-action="remove-real-passkey" data-id="${esc(pk.id)}" title="Remove" aria-label="Remove">${ICO.x}</button>
    </div>`).join('')}
    ${browserSupportsPasskeys() ? `<button class="btn btn-sm" style="margin-top:12px;" data-action="add-real-passkey">${ICO.plus} Add a passkey</button>` : `<p style="color:var(--ink-3);font-size:12px;margin:12px 0 0;">This browser can't use passkeys. Open ASP Bookings in Safari or Chrome to add one.</p>`}
  `;
}
function renderUsersDashboardCard(){
  const roster = S.realRoster;
  return `<div class="card card-pad" style="margin-bottom:20px;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
      <h3 style="margin:0;">Users</h3>
      <button class="btn btn-sm btn-primary" data-action="open-add-real-user">${ICO.plus} Add Person</button>
    </div>
    ${!roster ? `<p style="font-size:12.5px;color:var(--ink-3);margin:0;">Loading...</p>` : `
    <p style="font-size:11.5px;color:var(--ink-3);margin:0 0 12px;">Real accounts for ASP Bookings. Add someone here, then they sign in themselves with a passkey or an emailed sign-in code at that address.</p>
    <div class="u-label" style="margin-bottom:6px;">Office</div>
    ${roster.admins.length? roster.admins.map(u=>`<div class="settings-row">
      <div><h4>${esc(u.name)} <span style="font-weight:400;color:var(--ink-3);">— ${esc(ADMIN_ROLE_LABELS[u.role]||u.role)}</span></h4><p>${esc(u.email)}</p></div>
      <span style="display:flex;align-items:center;gap:8px;flex:none;">
        <span class="pill ${u.user_id?'pill-good':''}">${u.user_id?'Active':'Invited'}</span>
        <button class="icon-btn" data-action="open-edit-real-user" data-kind="admin" data-id="${u.id}" title="Edit" aria-label="Edit">${ICO.pencil}</button>
      </span>
    </div>`).join('') : `<p style="font-size:12px;color:var(--ink-3);margin:0 0 12px;">No office accounts yet.</p>`}
    <div class="u-label" style="margin:14px 0 6px;">Artists</div>
    ${roster.artists.length? roster.artists.map(a=>`<div class="settings-row">
      <div><h4>${esc(a.name)} <span style="font-weight:400;color:var(--ink-3);">— ${esc(a.role)}</span></h4><p>${esc(a.email)}</p></div>
      <span style="display:flex;align-items:center;gap:8px;flex:none;">
        <span class="pill ${a.user_id?'pill-good':''}">${a.user_id?'Active':'Invited'}</span>
        <button class="icon-btn" data-action="open-edit-real-user" data-kind="artist" data-id="${a.id}" title="Edit" aria-label="Edit">${ICO.pencil}</button>
      </span>
    </div>`).join('') : `<p style="font-size:12px;color:var(--ink-3);margin:0;">No real artist accounts yet.</p>`}
    `}
  </div>`;
}
function renderAddRealUserModal(){
  const f = S.addRealUserForm;
  const kind = f.kind || 'artist';
  const adminRole = f.adminRole || 'admin_bookings';
  const artistRole = f.artistRole || 'Singer';
  return `<div class="overlay center" data-action="overlay-close-addrealuser">
    <div class="modal" data-stop data-form="addrealuser" style="width:420px;">
      <div class="sheet-head"><h2 style="font-size:1.3rem;">Add Person</h2><button class="icon-btn" data-action="close-add-real-user" aria-label="Close">${ICO.x}</button></div>
      <div class="sheet-body">
        <div class="chip-row" style="margin-bottom:4px;">
          <button class="filter-chip ${kind==='artist'?'sel':''}" data-action="pick-real-user-kind" data-kind="artist">Artist</button>
          <button class="filter-chip ${kind==='admin'?'sel':''}" data-action="pick-real-user-kind" data-kind="admin">Office</button>
        </div>
        <div class="field"><label>Full Name</label><input data-field="name" value="${esc(f.name||'')}" placeholder="Full name" autofocus/></div>
        <div class="field"><label>Real Email</label><input type="email" data-field="email" value="${esc(f.email||'')}" placeholder="them@realdomain.com"/></div>
        ${kind==='artist' ? `<div class="field"><label>Role</label>
          <div class="chip-row">${ARTIST_ROLES.map(r=>`<button class="filter-chip ${artistRole===r?'sel':''}" data-action="pick-real-artist-role" data-role="${r}">${r}</button>`).join('')}</div>
        </div>` : `<div class="field"><label>Desk</label>
          <div class="chip-row">${Object.entries(ADMIN_ROLE_LABELS).map(([k,l])=>`<button class="filter-chip ${adminRole===k?'sel':''}" data-action="pick-real-admin-role" data-role="${k}">${l}</button>`).join('')}</div>
        </div>`}
        <p style="font-size:11px;color:var(--ink-3);margin:0;">This creates a real account. They sign in themselves at this email — nothing is emailed automatically yet.</p>
        <button class="btn btn-primary btn-block" data-action="confirm-add-real-user">Add Person</button>
      </div>
    </div>
  </div>`;
}
// His ask (2026-10-06): real admin/artist accounts had no edit path at all -- only Add Person
// existed, so a typo'd name/email or a role picked wrong (e.g. the admin_ceo placeholder used
// to bootstrap Moshe's real account) had no fix short of a direct SQL update. Same field set as
// Add Person, minus the kind toggle (you're editing an existing row, not choosing what to create).
function renderEditRealUserModal(){
  const f = S.editRealUserForm;
  const kind = f.kind;
  const adminRole = f.adminRole || 'admin_bookings';
  const artistRole = f.artistRole || 'Singer';
  return `<div class="overlay center" data-action="overlay-close-editrealuser">
    <div class="modal" data-stop data-form="edituser" style="width:420px;">
      <div class="sheet-head"><h2 style="font-size:1.3rem;">Edit ${kind==='admin'?'Office':'Artist'} Account</h2><button class="icon-btn" data-action="close-edit-real-user" aria-label="Close">${ICO.x}</button></div>
      <div class="sheet-body">
        <div class="field"><label>Full Name</label><input data-field="name" value="${esc(f.name||'')}" placeholder="Full name" autofocus/></div>
        <div class="field"><label>Real Email</label><input type="email" data-field="email" value="${esc(f.email||'')}" placeholder="them@realdomain.com"/></div>
        ${kind==='artist' ? `<div class="field"><label>Role</label>
          <div class="chip-row">${ARTIST_ROLES.map(r=>`<button class="filter-chip ${artistRole===r?'sel':''}" data-action="pick-edit-artist-role" data-role="${r}">${r}</button>`).join('')}</div>
        </div>
        <div class="field"><label>ASP Commission (%)</label><input type="number" min="0" max="100" step="0.5" data-field="commissionPct" value="${esc(String(f.commissionPct ?? ''))}"/>
          <p style="font-size:11px;color:var(--ink-3);margin:4px 0 0;">Prefills the commission on this artist's new gigs. Existing gigs keep theirs.</p></div>` : `<div class="field"><label>Desk</label>
          <div class="chip-row">${Object.entries(ADMIN_ROLE_LABELS).map(([k,l])=>`<button class="filter-chip ${adminRole===k?'sel':''}" data-action="pick-edit-admin-role" data-role="${k}">${l}</button>`).join('')}</div>
        </div>`}
        ${f.email!==f.originalEmail? `<p style="font-size:11px;color:var(--ink-3);margin:0;">Changing the email does not move their existing sign-in -- they'll still sign in with the old address until this one is updated to match a real account.</p>` : ''}
        <button class="btn btn-primary btn-block" data-action="confirm-edit-real-user">Save Changes</button>
        <button class="btn btn-block btn-ghost" style="margin-top:8px;color:var(--crit);" data-action="remove-real-user" ${S.removeRealUserBusy?'disabled':''}>${S.removeRealUserBusy?'Removing…':'Remove from ASP Bookings'}</button>
      </div>
    </div>
  </div>`;
}
function renderSettingsPage(){
  const isAdmin = isAdminUser(S.user);
  const who = isAdmin ? adminById(S.user) : (crewUser() || artistById(S.user));
  const st = getUserSettings(S.user);
  const themeIdx = THEME_OPTIONS.findIndex(([k])=>k===THEME_PREF);
  const isReal = !!S.realSession;
  if(isReal && S.realPasskeys===null && !S.realPasskeyBusy) loadRealPasskeys();
  if(isReal && isAdmin && S.realRoster===null && !S.realRosterBusy) loadRealRoster();
  return `
  <div class="card card-pad" style="margin-bottom:20px;">
    <h3 style="margin-bottom:12px;">Sign-in &amp; Security</h3>
    ${isReal ? renderRealPasskeySection() : `
    ${st.passkeys.map(pk=>`<div class="passkey-row">
      <div class="passkey-ico">${ICO.key}</div>
      <div style="flex:1;min-width:0;"><strong style="font-size:13px;">${esc(pk.label)}</strong><br/><span style="font-size:11.5px;color:var(--ink-3);">Added ${fmtDateShort(pk.addedAt)}</span></div>
      ${st.passkeys.length>1 ? `<button class="icon-btn" data-action="remove-passkey" data-id="${pk.id}" title="Remove" aria-label="Remove">${ICO.x}</button>` : ''}
    </div>`).join('')}
    <button class="btn btn-sm" style="margin-top:12px;" data-action="add-passkey">${ICO.plus} Add a passkey</button>
    `}
  </div>

  ${isReal && isAdmin ? renderUsersDashboardCard() : ''}

  ${isAdmin ? renderPayeeProfilesCard() : ''}

  ${isAdmin && QBO_CLIENT_ID ? renderQuickBooksCard() : ''}
  ${isAdmin ? renderOnlinePaymentsCard() : ''}
  ${isAdmin ? renderMercuryCard() : ''}

  ${isAdmin ? renderGoogleCalendarSyncCard() : ''}

  ${isAdmin && QBO_CLIENT_ID ? renderReconciliationCard() : ''}

  ${isAdmin ? renderGmailMailboxesCard() : ''}

  ${isAdmin ? renderZelleReviewQueueCard() : ''}

  ${isAdmin ? renderBackupCard() : ''}
  ${isAdmin ? renderDataMigrationCard() : ''}

  ${isAdmin ? renderTravelSettingsCard() : ''}


  ${crewUser() ? '' : `<div class="card card-pad" style="margin-bottom:20px;">
    <h3 style="margin-bottom:8px;">Notifications</h3>
    ${NOTIFY_ITEMS.filter(([,,,,artistOnly])=>!artistOnly||!isAdmin).map(([key,label,adminSub,artistSub])=>`
    <div class="settings-row">
      <div><h4>${label}</h4><p>${isAdmin?adminSub:artistSub}</p></div>
      ${isAdmin
        ? `<label class="switch"><input type="checkbox" data-action="toggle-notif" data-key="${key}" data-channel="inApp" ${st.notify[key].inApp?'checked':''}/><span class="switch-track"></span></label>`
        : `<div style="display:flex;gap:14px;">
            <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
              <span class="u-label" style="font-size:9px;">In-app</span>
              <label class="switch"><input type="checkbox" data-action="toggle-notif" data-key="${key}" data-channel="inApp" ${st.notify[key].inApp?'checked':''}/><span class="switch-track"></span></label>
            </div>
            <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
              <span class="u-label" style="font-size:9px;">Email</span>
              <label class="switch"><input type="checkbox" data-action="toggle-notif" data-key="${key}" data-channel="email" ${st.notify[key].email?'checked':''}/><span class="switch-track"></span></label>
            </div>
          </div>`}
    </div>`).join('')}
  </div>`}

  <div class="card card-pad" style="margin-bottom:20px;">
    <h3 style="margin-bottom:8px;">Appearance</h3>
    <div class="settings-row" style="border-bottom:none;">
      <h4>Theme</h4>
      <div class="seg">
        <div class="seg-thumb" style="transform:translateX(${themeIdx*38}px);"></div>
        ${THEME_OPTIONS.map(([k,l,ic])=>`<button class="${k===THEME_PREF?'active':''}" data-action="set-theme" data-theme-pref="${k}" title="${l}">${ic}</button>`).join('')}
      </div>
    </div>
  </div>

  <div class="card card-pad">
    <h3 style="margin-bottom:2px;">About</h3>
    <p style="font-size:12.5px;color:var(--ink-2);margin:0;">Signed in as <strong>${esc(who.name)}</strong></p>
    <p style="font-size:11px;color:var(--ink-3);margin:4px 0 0;">ASP Bookings ${APP_VERSION}</p>
  </div>
  `;
}

/* ============ LOGIN ============ */
// A host shell (e.g. Moshe's Desk) can set window.ASP_BRAND_OVERRIDE = {name, tagline} before
// this script loads to relabel the login screen -- this file's own login flow is real (emailed
// code/passkey/roster lookup all happen here), so a host reusing it shouldn't have to fork the
// whole login UI just to change two words. Unset here (undefined) on the plain ASP site --
// zero behavior change there.
function loginWordmark(){
  const brand = window.ASP_BRAND_OVERRIDE || {};
  const tagline = brand.tagline || 'Bookings';
  if(!brand.name) return `<div class="wordmark" style="flex-direction:column;gap:8px;align-items:center;justify-content:center;">${brandLogoHtml({ width:240, local:true })}<small>${esc(tagline)}</small></div>`;
  return `<div class="wordmark" style="font-size:1.6rem;justify-content:center;"><span class="mark"><i></i><i></i><i></i><i></i><i></i></span>${esc(brand.name)}<small>${esc(tagline)}</small></div>`;
}
function renderLogin(){
  if(S.showRealSignIn) return renderRealSignIn();
  if(S.realSignInNotFound) return renderRealSignInNotFound();
  if(S.realSignInError) return `<div class="login-wrap"><div class="login-card" style="text-align:center;">
    ${loginWordmark()}
    <h2 style="font-size:1.05rem;margin:16px 0 6px;">Couldn't reach ASP Bookings</h2>
    <p style="color:var(--ink-2);font-size:13px;margin:0 0 22px;">You're signed in, but loading your account didn't work (${esc(S.realSignInError)}). This is usually a connection problem — try again in a moment.</p>
    <button class="btn btn-primary btn-block" data-action="retry-roster-link">Try again</button>
    <button class="btn btn-block btn-ghost" style="margin-top:8px;" data-action="real-signout">Sign Out</button>
  </div></div>`;
  return `<div class="login-wrap"><div class="login-card" style="text-align:center;">
    ${loginWordmark()}
    <p style="color:var(--ink-2);font-size:13.5px;margin:16px 0 26px;">Sign in to view your schedule and bookings.</p>
    ${supabaseClient ? `
    ${browserSupportsPasskeys() ? `
    <button class="btn btn-primary btn-block" data-action="real-signin-passkey">${ICO.key} Sign in with Passkey</button>
    <button class="btn btn-block btn-ghost" style="margin-top:8px;" data-action="open-real-signin">Sign in with email</button>
    ` : `
    <button class="btn btn-primary btn-block" data-action="open-real-signin">Sign in with email</button>
    `}
    ` : `<p style="color:var(--crit);font-size:12.5px;">Sign-in is unavailable right now — the app could not reach its backend. Try reloading.</p>`}
  </div></div>`;
}
function renderRealSignIn(){
  const f = S.realSignInEmail;
  if(S.realSignInSent){
    return `<div class="login-wrap"><div class="login-card" style="text-align:center;">
      ${loginWordmark()}
      <h2 style="font-size:1.05rem;margin:16px 0 6px;">Check your email</h2>
      <p style="color:var(--ink-2);font-size:13px;margin:0 0 20px;">We sent a sign-in code to <strong>${esc(f)}</strong>. Enter it below.</p>
      <div class="field" data-form="realsignin" style="text-align:left;"><input id="realSignInCodeInput" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="10" data-field="realSignInCode" value="${esc(S.realSignInCode)}" placeholder="Sign-in code" style="text-align:center;letter-spacing:.3em;font-size:1.1rem;"/></div>
      <button class="btn btn-primary btn-block" style="margin-top:10px;" data-action="verify-signin-code">Sign In</button>
      <button class="btn btn-block btn-ghost" style="margin-top:8px;" data-action="send-signin-code">Send a new code</button>
      <button class="btn btn-block btn-ghost" data-action="close-real-signin">Use a different email</button>
    </div></div>`;
  }
  return `<div class="login-wrap"><div class="login-card" style="text-align:center;">
    <button class="icon-btn chooser-back" data-action="close-real-signin" aria-label="Close">${ICO.chev('l')}</button>
    ${loginWordmark()}
    <p style="color:var(--ink-2);font-size:13.5px;margin:16px 0 20px;">Enter your email and we'll send you a sign-in code.</p>
    <div class="field" data-form="realsignin" style="text-align:left;"><input id="realSignInEmailInput" type="email" data-field="realSignInEmail" value="${esc(f)}" placeholder="you@aspmanagement.com" autofocus/></div>
    <button class="btn btn-primary btn-block" style="margin-top:10px;" data-action="send-signin-code">Send Sign-In Code</button>
  </div></div>`;
}
function renderRealSignInNotFound(){
  return `<div class="login-wrap"><div class="login-card" style="text-align:center;">
    ${loginWordmark()}
    <h2 style="font-size:1.05rem;margin:16px 0 6px;">No account set up yet</h2>
    <p style="color:var(--ink-2);font-size:13px;margin:0 0 22px;">You're signed in as <strong>${esc(S.realSession?.email||'')}</strong>, but the office hasn't added you to ASP Bookings yet. Contact the office to get set up.</p>
    <button class="btn btn-block btn-ghost" data-action="real-signout">Sign Out</button>
  </div></div>`;
}
/* ============ MGMT DASHBOARD ============ */
function renderWelcomeHeader(name){
  return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
    <span style="flex:none;">${brandLogoHtml({ kind:'icon', width:30, alt:'', local:true })}</span>
    <h2 style="font-family:var(--font-display);font-size:1.4rem;margin:0;">Welcome, ${esc(name)}</h2>
  </div>`;
}
function renderMgmtDashboard(){
  const isCEO = adminRoleOf(S.user)==='admin_ceo';
  if(isCEO){
    return `
    ${renderWelcomeHeader((adminById(S.user).name||'').split(' ')[0])}
    ${renderUpcomingGigsCard(S.events, {days:7, showArtist:true})}
    ${renderOpenLeadsCard(S.events)}
    `;
  }
  const open = S.events.filter(e=>isOpenLead(e));
  const awaitingDeposit = S.events.filter(e=>e.status==='contract_sent');
  const awaitingBalance = S.events.filter(e=>e.status==='booked' && !e.balanceReceived);
  const upcoming30 = S.events.filter(e=>!isPast(e.date) && daysUntil(e.date)<=30 && isConfirmed(e));
  const conflictPairs = allConflictPairs().filter(([a,b])=>!isPast(a.date)||!isPast(b.date));
  const intlTrips = S.events.filter(e=>isInternational(e) && !e.intlOpportunityDismissed && !isPast(e.date) && isConfirmed(e)).sort((a,b)=>a.date.localeCompare(b.date));
  const needsTravel = S.events.filter(e=>!isPast(e.date) && ((e.flightNeeded && !e.flightBooked) || (e.groundTransportNeeded && !e.groundTransportBooked)));
  const todayGigs = S.events.filter(e=>e.date===todayISO() && isConfirmed(e));

  return `
  ${renderWelcomeHeader((adminById(S.user).name||'').split(' ')[0])}
  <div class="grid stat-row" style="margin-bottom:20px;">
    <div class="card stat-tile" style="cursor:pointer;" data-action="nav-today-gigs"><span class="u-label">Gigs Today</span><span class="val">${todayGigs.length}</span><span class="sub">${fmtDateShort(todayISO())}</span></div>
    <div class="card stat-tile" style="cursor:pointer;" data-action="nav" data-view="calendar"><span class="u-label">Upcoming Gigs · 30 days</span><span class="val">${upcoming30.length}</span><span class="sub">Booked or paid, next 30 days</span></div>
    <div class="card stat-tile" style="cursor:pointer;" data-action="nav" data-view="leads"><span class="u-label">Open Leads</span><span class="val">${open.length}</span><span class="sub">Awaiting contract / deposit</span></div>
    <div class="card stat-tile" style="cursor:pointer;" data-action="nav" data-view="leads"><span class="u-label">Awaiting Balance</span><span class="val">${awaitingBalance.length}</span><span class="sub">Booked, balance not yet in</span></div>
  </div>
  <div class="grid stat-row" style="margin-bottom:20px;">
    ${statTile('International Opportunities', intlTrips.length, 'Artist traveling — worth adding nearby bookings', 'international')}
    ${statTile('Travel To Arrange', needsTravel.length, 'Flights or drivers still needed', 'travel')}
    ${statTile('Daily Digest', new Set([...open, ...awaitingBalance, ...altPaymentFollowUps()].map(e=>e.id)).size, 'Leads to follow up + payments due', 'daily_digest')}
    ${statTile('Inbox', S.inboxItems? String(S.inboxItems.length) : '—', 'emails waiting', 'messages')}
  </div>

  ${conflictPairs.length ? `
  <div class="card card-pad" style="margin-bottom:20px;border-color:var(--crit);background:var(--crit-wash);">
    <div style="display:flex;align-items:center;gap:8px;color:var(--crit-ink);font-weight:700;font-size:13px;">${ICO.alert} Scheduling conflicts (${conflictPairs.length})</div>
    <div style="display:flex;flex-direction:column;gap:6px;margin-top:10px;">
      ${conflictPairs.map(([x,y])=>{const ax=artistById(x.artistId);
        return `<div style="display:flex;justify-content:space-between;align-items:center;font-size:12.5px;color:var(--crit-ink);cursor:pointer;" data-action="open-event" data-id="${x.id}">
        <span><strong>${esc(ax.name)}</strong> — ${fmtDateShort(x.date)} (${esc(x.clientName||x.type)}) overlaps ${fmtDateShort(y.date)} (${esc(y.clientName||y.type)})</span>
        <span style="text-decoration:underline;">Resolve</span></div>`;}).join('')}
    </div>
  </div>` : ''}

  <div class="section-head"><h2>Open Leads</h2><button class="btn btn-sm btn-ghost" data-action="nav" data-view="leads">View all ${ICO.chev('r')}</button></div>
  ${renderEventTable(open.slice(0,6), {showArtist:true})}
  `;
}
function statTile(label, val, sub, view){
  const clickable = view ? `style="cursor:pointer;" data-action="nav" data-view="${view}"` : '';
  return `<div class="card stat-tile" ${clickable}>
    <span class="u-label">${label}</span><span class="val">${val}</span><span class="sub">${sub}</span></div>`;
}
function renderUpcomingGigsCard(events, opts={}){
  const days = opts.days || 7;
  const upcoming = events.filter(e=>!isPast(e.date) && daysUntil(e.date)<days && isConfirmed(e))
    .sort((a,b)=> a.date===b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date));
  return `
  <div class="section-head"><h2>Upcoming — Next ${days} Days</h2></div>
  ${upcoming.length? `<div class="card">${upcoming.map(e=>renderDayEventRow(e, !!opts.showArtist, 'open-event', {showDate:true})).join('')}</div>`
    : `<div class="card empty">Nothing coming up in the next ${days} days.</div>`}
  `;
}
function renderOpenLeadsCard(events){
  const open = events.filter(e=>isOpenLead(e)).sort((a,b)=>a.date.localeCompare(b.date));
  return `
  <div class="section-head" style="margin-top:20px;"><h2>Open Leads (${open.length})</h2></div>
  ${open.length? `<div class="card">${open.map(e=>renderDayEventRow(e, true, 'open-event', {showDate:true})).join('')}</div>`
    : `<div class="card empty">No open leads right now.</div>`}
  `;
}
function subpageBack(){
  return `<button class="icon-btn" data-action="nav" data-view="dashboard" title="Back to Dashboard" style="margin-bottom:14px;" aria-label="Back to Dashboard">${ICO.chev('l')}</button>`;
}
function buildDailyDigestWhatsAppText(openLeads){
  const lines = [`Good morning! Here's today's follow-up list:`, ''];
  lines.push(`📋 Open Leads (${openLeads.length})`);
  if(openLeads.length) openLeads.forEach(e=>{ const a=artistById(e.artistId); lines.push(`• ${a.name} — ${e.clientName||e.type}, ${fmtDateShort(e.date)} (${-daysUntil(e.createdAt)}d old)`); });
  else lines.push('None — all caught up.');
  lines.push('', `Let's follow up on these today!`);
  return lines.join('\n');
}
function renderDailyDigestPage(){
  const openLeads = S.events.filter(e=>isOpenLead(e)).sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
  const awaitingDeposit = S.events.filter(e=>e.status==='contract_sent');
  const awaitingBalance = S.events.filter(e=>e.status==='booked' && !e.balanceReceived);
  const altPayment = altPaymentFollowUps();
  const row = (e, extra)=>{ const a=artistById(e.artistId); return `<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:13px;padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer;" data-action="open-event" data-id="${e.id}">
    <span><strong>${esc(a.name)}</strong> — ${esc(e.clientName||e.type)}, ${fmtDateShort(e.date)}</span>
    <span class="u-label">${esc(extra)}</span>
  </div>`; };
  return `
  ${subpageBack()}
  <div class="section-head"><h2>Daily Digest</h2></div>
  <p style="font-size:12.5px;color:var(--ink-3);margin:-8px 0 20px;">A preview of what the morning email will contain once it's wired to a real send — see WORKFLOWS.md §1.</p>

  <div class="section-head"><h2>Open Leads Needing Follow-Up (${openLeads.length})</h2></div>
  ${openLeads.length? `<div class="card card-pad" style="margin-bottom:20px;">${openLeads.map(e=>row(e, `${-daysUntil(e.createdAt)}d old`)).join('')}</div>` : `<div class="card empty" style="margin-bottom:20px;">Nothing open — all caught up.</div>`}

  <div class="section-head"><h2>Awaiting Down Payment (${awaitingDeposit.length})</h2></div>
  ${awaitingDeposit.length? `<div class="card card-pad" style="margin-bottom:20px;">${awaitingDeposit.map(e=>row(e, money(e.commission))).join('')}</div>` : `<div class="card empty" style="margin-bottom:20px;">Nothing outstanding.</div>`}

  <div class="section-head"><h2>Awaiting Final Payment (${awaitingBalance.length})</h2></div>
  ${awaitingBalance.length? `<div class="card card-pad" style="margin-bottom:20px;">${awaitingBalance.map(e=>row(e, money(artistPayout(e)))).join('')}</div>` : `<div class="card empty" style="margin-bottom:20px;">Nothing outstanding.</div>`}

  <div class="section-head"><h2>Payment Follow-Up — Alternative Method (${altPayment.length})</h2></div>
  <p style="font-size:11.5px;color:var(--ink-3);margin:-14px 0 8px;">Not on QuickBooks/Zelle — no automated reminder, follow up directly.</p>
  ${altPayment.length? `<div class="card card-pad" style="margin-bottom:20px;">${altPayment.map(e=>row(e, `${paymentMethodLabel(e)} · ${money(e.depositReceived? artistPayout(e) : e.commission)}`)).join('')}</div>` : `<div class="card empty" style="margin-bottom:20px;">Nothing outstanding.</div>`}

  <button class="btn btn-primary" data-action="copy-daily-digest">${ICO.share} Copy WhatsApp Message for Ilan (Open Leads)</button>
  `;
}
function renderInternationalPage(){
  const intlTrips = S.events.filter(e=>isInternational(e) && !e.intlOpportunityDismissed && !isPast(e.date) && isConfirmed(e)).sort((a,b)=>a.date.localeCompare(b.date));
  return `
  ${subpageBack()}
  <div class="section-head"><h2>International Opportunities (${intlTrips.length})</h2></div>
  ${!intlTrips.length ? `<div class="card empty">Nothing here yet.</div>` : `
  <div class="card card-pad" style="display:flex;flex-direction:column;gap:10px;">
    ${intlTrips.map(e=>{const ae=artistById(e.artistId);
      return `<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:13px;padding:6px 0;border-bottom:1px solid var(--border);">
      <span style="cursor:pointer;" data-action="open-event" data-id="${e.id}"><strong>${esc(ae.name)}</strong> — ${esc(e.city)}, ${esc(e.state)}, ${fmtDateShort(e.date)}</span>
      <span style="display:flex;align-items:center;gap:10px;flex:none;">
        <span style="cursor:pointer;text-decoration:underline;" data-action="open-event" data-id="${e.id}">View</span>
        <button class="icon-btn" data-action="dismiss-intl" data-id="${e.id}" title="Dismiss" style="width:22px;height:22px;" aria-label="Dismiss">${ICO.x}</button>
      </span></div>`;}).join('')}
  </div>`}
  `;
}
function renderTravelPage(events, opts={}){
  const showArtist = !opts.singleArtist;
  const upcoming = e=>!isPast(e.date);
  const needsFlight = events.filter(e=>upcoming(e) && e.flightNeeded && !e.flightBooked);
  const needsTransport = events.filter(e=>upcoming(e) && e.groundTransportNeeded && !e.groundTransportBooked);
  const readyItineraries = events.filter(e=>upcoming(e) && (e.flightBooked || e.groundTransportBooked)).sort((a,b)=>a.date.localeCompare(b.date));
  const travelRow = (e, needLabel)=>{
    const a = artistById(e.artistId);
    return `<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:13px;padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer;" data-action="open-event" data-id="${e.id}">
      <span>${showArtist?`<strong>${esc(a.name)}</strong> — `:''}${esc(e.type)}${e.clientName?` (${esc(e.clientName)})`:''}, ${fmtDateShort(e.date)}</span>
      <span class="pill pill-warn">${needLabel}</span>
    </div>`;
  };
  return `
  ${opts.singleArtist ? '' : `
  <div class="section-head"><h2>Needs Arranging</h2></div>
  ${(!needsFlight.length && !needsTransport.length) ? `<div class="card empty">Nothing needs arranging right now.</div>` : `
  <div class="card card-pad" style="display:flex;flex-direction:column;gap:2px;margin-bottom:20px;">
    ${needsFlight.map(e=>travelRow(e,'Needs flight')).join('')}
    ${needsTransport.map(e=>travelRow(e,'Needs driver')).join('')}
  </div>`}
  `}

  <div class="section-head"><h2>Upcoming Itineraries (${readyItineraries.length})</h2></div>
  ${!readyItineraries.length ? `<div class="card empty">Nothing here yet.</div>` : `
  <div class="card table-cards"><table>
    <thead><tr>${showArtist?'<th>Artist</th>':''}<th>Type</th><th>Date</th><th>Flight</th><th>Ground</th><th></th></tr></thead>
    <tbody>
      ${readyItineraries.map(e=>{
        const a = artistById(e.artistId);
        return `<tr>
          ${showArtist?`<td data-label="Artist"><span style="display:flex;align-items:center;gap:7px;"><span class="avatar" data-slot="${a.slot}" style="width:22px;height:22px;font-size:9px;">${esc(a.initials)}</span>${esc(a.name)}</span></td>`:''}
          <td data-label="Type">${esc(e.type)}</td><td data-label="Date" class="u-mono">${fmtDateShort(e.date)}</td>
          <td data-label="Flight">${e.flightBooked?`<span class="pill pill-good">Booked</span>`:'—'}</td>
          <td data-label="Ground">${e.groundTransportBooked?`<span class="pill pill-good">Booked</span>`:'—'}</td>
          <td data-label=""><button class="btn btn-sm" data-action="view-itinerary" data-id="${e.id}">${ICO.suitcase} Itinerary</button></td>
        </tr>`;
      }).join('')}
    </tbody></table></div>`}
  `;
}

/* ============ CALENDAR ============ */
function renderCalendarPage(events, opts={}){
  const filtered = S.calArtistFilter.length ? events.filter(e=>S.calArtistFilter.includes(e.artistId)) : events;
  const isAdmin = isAdminUser(S.user);
  const mode = opts.miniEmbed ? 'month' : (S.calViewMode||'month');
  const todayIso = todayISO();

  const modeToggle = opts.miniEmbed ? '' : `<div class="chip-row" style="margin-left:auto;flex-wrap:nowrap;">
    ${['month','week','day'].map(mv=>`<button class="filter-chip ${mode===mv?'sel':''}" data-action="cal-view-mode" data-mode="${mv}">${mv[0].toUpperCase()+mv.slice(1)}</button>`).join('')}
  </div>`;

  const head = (label)=>`
    <div class="cal-head">
      <div class="cal-nav">
        <button class="icon-btn" data-action="cal-prev" aria-label="Previous">${ICO.chev('l')}</button>
        <strong style="font-family:var(--font-display);font-size:1.05rem;min-width:150px;text-align:center;">${label}</strong>
        <button class="icon-btn" data-action="cal-next" aria-label="Next">${ICO.chev('r')}</button>
        <button class="btn btn-sm btn-ghost" data-action="cal-today">Today</button>
        ${opts.showBlockButton && !artistReadOnly() ? `<button class="btn btn-sm" data-action="open-block-time">${ICO.clock} Block Time</button>` : ''}
        ${modeToggle}
      </div>
      ${opts.showFilter ? `<div class="chip-row">${ARTISTS.map(a=>`<button class="filter-chip ${S.calArtistFilter.includes(a.id)?'sel':''}" data-action="cal-filter" data-id="${a.id}"><span class="dot" data-slot="${a.slot}"></span>${esc(a.name.split(' ')[0])}</button>`).join('')}</div>`:''}
    </div>`;

  if(mode==='week'){
    const start = new Date(S.calDate); start.setDate(start.getDate()-start.getDay());
    const days = [...Array(7)].map((_,i)=>{ const d=new Date(start); d.setDate(d.getDate()+i); return d; });
    const rangeLabel = `${days[0].toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${days[6].toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`;
    return head(rangeLabel) + `<div style="display:flex;flex-direction:column;gap:10px;">
      ${days.map(d=>{
        const iso = fmtISO(d);
        const evs = filtered.filter(e=>e.date===iso).sort((a,b)=>a.time.localeCompare(b.time));
        return `<div class="card card-pad">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:${evs.length?'6px':'0'};">
            <strong style="font-family:var(--font-display);">${d.toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'})}</strong>
            ${iso===todayIso?'<span class="pill pill-accent">Today</span>':''}
            ${isAdmin? `<button class="icon-btn" data-action="quick-add-event" data-date="${iso}" title="Add event" style="margin-left:auto;width:26px;height:26px;" aria-label="Add event">${ICO.plus}</button>`:''}
          </div>
          ${evs.length? evs.map(e=>renderDayEventRow(e, isAdmin, 'open-event')).join('') : `<p style="color:var(--ink-3);font-size:12.5px;margin:0;">Nothing scheduled.</p>`}
        </div>`;
      }).join('')}
    </div>`;
  }

  if(mode==='day'){
    const iso = fmtISO(S.calDate);
    const evs = filtered.filter(e=>e.date===iso).sort((a,b)=>a.time.localeCompare(b.time));
    return head(S.calDate.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})) + `
      ${isAdmin? `<button class="btn btn-sm btn-primary" data-action="quick-add-event" data-date="${iso}" style="margin-bottom:12px;">${ICO.plus} Add Event</button>` : ''}
      <div class="card card-pad">
      ${evs.length? evs.map(e=>renderDayEventRow(e, isAdmin, 'open-event')).join('') : `<p style="color:var(--ink-3);font-size:13px;margin:0;">Nothing scheduled today.</p>`}
    </div>`;
  }

  const month = S.calMonth;
  const y = month.getFullYear(), m = month.getMonth();
  const first = new Date(y,m,1); const startDow = first.getDay();
  const daysInMonth = new Date(y,m+1,0).getDate();
  const prevDays = new Date(y,m,0).getDate();
  const byDate = {};
  filtered.forEach(e=>{ (byDate[e.date] = byDate[e.date]||[]).push(e); });
  const cells=[];
  for(let i=startDow-1;i>=0;i--) cells.push({d:prevDays-i, out:true});
  for(let d=1;d<=daysInMonth;d++) cells.push({d, out:false, iso: `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`});
  { let nextDay=1; while(cells.length%7!==0) cells.push({d:nextDay++, out:true}); }

  const monthLabel = month.toLocaleDateString('en-US',{month:'long', year:'numeric'});
  return head(monthLabel) + `
    <div class="cal-grid">
      ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>`<div class="cal-dow">${d}</div>`).join('')}
      ${cells.map(c=>{
        if(c.out) return `<div class="cal-cell out"><span class="cal-date">${c.d}</span></div>`;
        const evs = (byDate[c.iso]||[]).sort((a,b)=>a.time.localeCompare(b.time));
        const max = 3;
        return `<div class="cal-cell ${c.iso===todayIso?'today':''}" data-action="open-day-view" data-date="${c.iso}" style="cursor:pointer;">
          ${isAdmin? `<button class="cal-add-btn" data-action="quick-add-event" data-date="${c.iso}" title="Add event">${ICO.plus}</button>`:''}
          <span class="cal-date">${c.d}</span>
          ${evs.slice(0,max).map(e=>{const a=artistById(e.artistId)||NO_ARTIST; const label = opts.singleArtist? (e.clientName||e.type).split(' ')[0] : a.name.split(' ')[0]; const timePrefix = (!e.time || e.time==='00:00') ? '' : fmtTime(e.time).replace(':00','')+' '; return `<div class="cal-evt" data-action="open-event" data-id="${e.id}"><span class="dot" data-slot="${a.slot}"></span><span>${timePrefix}${esc(label)}</span></div>`;}).join('')}
          ${evs.length>max? `<span class="cal-more" data-action="open-day" data-date="${c.iso}">+${evs.length-max} more</span>`:''}
        </div>`;
      }).join('')}
    </div>
    ${(!opts.noLegend) ? `<div class="legend">${ARTISTS.map(a=>`<span class="legend-item"><span class="dot" data-slot="${a.slot}"></span>${esc(a.name)}</span>`).join('')}</div>`:''}
  `;
}

/* ============ LEADS TABLE ============ */
// Office tables. An artist's own My Gigs list is renderArtistGigTable (their money, map links).
function renderEventTable(events, opts={}){
  if(!events.length) return `<div class="card empty">Nothing here yet.</div>`;
  return `<div class="card table-cards"><table>
    <thead><tr>
      ${opts.showArtist?'<th>Artist</th>':''}
      <th>Client</th><th>Type</th><th>Date</th><th>Location</th><th>Price</th><th>Status</th>
    </tr></thead>
    <tbody>
      ${events.map(e=>{
        const a = artistById(e.artistId); const sm = statusMeta(e);
        const amountCell = e.unpaid? '—' : money(e.price);
        return `<tr class="row-link" data-action="open-event" data-id="${e.id}">
          ${opts.showArtist?`<td data-label="Artist"><span style="display:flex;align-items:center;gap:7px;"><span class="avatar" data-slot="${a.slot}" style="width:22px;height:22px;font-size:9px;">${esc(a.initials)}</span>${esc(a.name)}</span></td>`:''}
          <td data-label="Client">${e.clientName? esc(e.clientName) : '—'}${e.needsReview? ` <span class="pill pill-warn" title="Imported from calendar -- not yet confirmed">Needs Review</span>` : ''}</td><td data-label="Type">${esc(e.type)}</td><td data-label="Date" class="u-mono">${fmtDateShort(e.date)}</td>
          <td data-label="Location">${esc(e.venue)||'—'}</td><td data-label="Price" class="u-mono">${amountCell}</td>
          <td data-label="Status"><span class="pill ${sm.cls}">${esc(sm.label)}</span></td>
        </tr>`;
      }).join('')}
    </tbody></table></div>`;
}
function renderArtistFilterRow(current, action, opts={}){
  const dotOrAvatar = a => opts.avatar
    ? `<span class="avatar" data-slot="${a.slot}" style="width:18px;height:18px;font-size:8px;">${esc(a.initials)}</span>`
    : `<span class="dot" data-slot="${a.slot}"></span>`;
  return `
    <div class="chip-row artist-filter-chips" style="margin-bottom:16px;">
      ${opts.noAll ? '' : `<button class="filter-chip ${current==='all'?'sel':''}" data-action="${action}" data-id="all">All Artists</button>`}
      ${ARTISTS.map(a=>`<button class="filter-chip ${current===a.id?'sel':''}" data-action="${action}" data-id="${a.id}">${dotOrAvatar(a)}${esc(a.name.split(' ')[0])}</button>`).join('')}
    </div>
    <select class="artist-filter-select" data-action="${action}">
      ${opts.noAll ? '' : `<option value="all" ${current==='all'?'selected':''}>All Artists</option>`}
      ${ARTISTS.map(a=>`<option value="${a.id}" ${current===a.id?'selected':''}>${esc(a.name)}</option>`).join('')}
    </select>
  `;
}
function renderLeadsPage(){
  const artistFilter = S.leadsArtistFilter||'all';
  const base = artistFilter==='all' ? S.events : S.events.filter(e=>e.artistId===artistFilter);
  const needsReviewCount = base.filter(e=>e.needsReview).length;
  const open = base.filter(e=>isOpenLead(e)).sort((a,b)=>a.date.localeCompare(b.date));
  const pending = base.filter(e=>e.status==='booked' && !e.balanceReceived).sort((a,b)=>a.date.localeCompare(b.date));
  return `
    ${renderArtistFilterRow(artistFilter, 'filter-leads-artist')}
    ${needsReviewCount? `<div class="card card-pad" style="border-color:var(--warn);background:var(--warn-wash);margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;gap:10px;">
      <div style="font-size:13px;color:var(--warn-ink);font-weight:700;">${needsReviewCount} gig${needsReviewCount===1?'':'s'} imported from calendar, not yet reviewed</div>
      <button class="btn btn-sm" data-action="nav" data-view="needs_review">Review Now</button>
    </div>` : ''}
    <div class="section-head"><h2>Pipeline (${open.length})</h2></div>
    ${renderEventTable(open, {showArtist:true})}
    <div class="section-head" style="margin-top:26px;"><h2>Booked — Balance Pending (${pending.length})</h2></div>
    ${renderEventTable(pending, {showArtist:true})}
  `;
}

/* ---- Needs Review: triage queue for gigs imported from a calendar export, not yet confirmed ---- */
function renderNeedsReviewPage(){
  const artistFilter = S.needsReviewArtistFilter||'all';
  let items = S.events.filter(e=>e.needsReview);
  if(artistFilter!=='all') items = items.filter(e=>e.artistId===artistFilter);
  items = items.sort((a,b)=>a.date.localeCompare(b.date));
  return `
    ${renderArtistFilterRow(artistFilter, 'filter-needsreview-artist')}
    <div class="section-head"><h2>Needs Review (${items.length})</h2></div>
    <p style="font-size:12px;color:var(--ink-3);margin:-8px 0 16px;">These were imported from a Google Calendar export. Price, deposit, and status are a best-effort read of free-text notes -- not authoritative. Open each gig, confirm or correct the details, then mark it reviewed.</p>
    ${!items.length? `<div class="empty">Nothing left to review.</div>` : items.map(e=>{
      const a = artistById(e.artistId); const sm = statusMeta(e);
      return `<div class="card card-pad" style="display:flex;flex-direction:column;gap:8px;margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
          <div style="cursor:pointer;flex:1;min-width:0;" data-action="open-event" data-id="${e.id}">
            <div style="display:flex;align-items:center;gap:7px;margin-bottom:3px;">
              <span class="avatar" data-slot="${a.slot}" style="width:20px;height:20px;font-size:8px;">${esc(a.initials)}</span>
              <strong style="font-size:13.5px;">${e.clientName? esc(e.clientName) : '—'}</strong>
              <span class="pill ${sm.cls}">${esc(sm.label)}</span>
            </div>
            <div style="font-size:12px;color:var(--ink-2);">${esc(e.type)} &middot; ${fmtDateShort(e.date)}${e.venue?` &middot; ${esc(e.venue.split('\\n')[0])}`:''}${e.price?` &middot; ${money(e.price)}`:''}</div>
          </div>
          <button class="btn btn-sm" data-action="mark-event-reviewed" data-id="${e.id}">${ICO.check} Mark Reviewed</button>
        </div>
        <details style="font-size:11.5px;color:var(--ink-3);">
          <summary style="cursor:pointer;font-weight:600;">Original calendar notes</summary>
          <pre style="white-space:pre-wrap;font-family:var(--font-body);margin:6px 0 0;">${esc(e.importNotes||'')}</pre>
        </details>
      </div>`;
    }).join('')}
  `;
}

/* ============ ARTISTS ROSTER ============ */
function renderArtistsPage(){
  return `<div class="section-head"><h2>Roster (${ARTISTS.length})</h2><button class="btn btn-sm btn-primary" data-action="open-add-artist">${ICO.plus} Add Artist</button></div>
  <div class="grid grid-3">
    ${ARTISTS.map(a=>{
      const evs = eventsFor(a.id);
      const upcoming = evs.filter(e=>!isPast(e.date) && isConfirmed(e)).length;
      const ytdPayout = ytdPayoutOf(evs);
      return `<div class="card card-pad" style="cursor:pointer;display:flex;flex-direction:column;gap:10px;" data-action="open-artist" data-id="${a.id}">
        <div style="display:flex;align-items:center;gap:10px;">
          <span class="avatar" data-slot="${a.slot}" style="width:44px;height:44px;font-size:15px;">${esc(a.initials)}</span>
          <div><strong style="font-family:var(--font-display);font-size:1.05rem;display:block;">${esc(a.name)}</strong><span class="u-label">${esc(a.role||'Artist')}</span></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:12.5px;color:var(--ink-2);padding-top:6px;border-top:1px solid var(--border);">
          <span>${upcoming} upcoming</span><span class="u-mono">${money(ytdPayout)} YTD payout</span>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}
function renderArtistDetailPage(artistId){
  const a = artistById(artistId);
  const evs = eventsFor(artistId).sort((a,b)=>a.date.localeCompare(b.date));
  const upcoming = evs.filter(e=>!isPast(e.date));
  return `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;">
      <span class="avatar" data-slot="${a.slot}" style="width:52px;height:52px;font-size:17px;">${esc(a.initials)}</span>
      <div style="flex:1;min-width:0;"><h2 style="font-size:1.5rem;">${esc(a.name)}</h2><span class="u-label">${esc(a.role||'Artist')} · Viewing as Management</span></div>
      <button class="btn btn-sm" data-action="preview-as-artist" data-id="${esc(artistId)}" title="See the app the way ${esc(a.name.split(' ')[0])} sees it (read-only)">Preview their app</button>
    </div>
    <div class="card card-pad" style="margin-bottom:20px;">${renderCalendarPage(evs, {noLegend:true, singleArtist:true, miniEmbed:true})}</div>
    <div class="section-head"><h2>Upcoming (${upcoming.length})</h2></div>
    ${renderEventTable(upcoming, {})}
  `;
}

/* ============ FINANCIALS ============ */
/* ============ INBOX (owner 2026-10-15: "keep an eye on the inbox ... if anything coming in it should mark it") ============ */
// The inbox-scan job (Edge Function, every 10 minutes) reads office@'s Gmail, has Claude classify each email
// and match it to a gig, and stores it in inbox_items (0062). This page lists what's waiting, each with the
// one action that fits; nothing changes on a gig until that action's own form is saved. Payment notices
// only open Verify Deposit (never mark anything paid by themselves).
const INBOX_KINDS = { travel_confirmation:['Travel','pill-accent'], booking_inquiry:['New inquiry','pill-good'], payment_notice:['Payment','pill-warn'], gig_info:['Gig info','pill-accent'], client_reply:['Client','pill-neutral'], other:['Other','pill-neutral'] };
const INBOX_ACTION_LABEL = { travel_confirmation:'Add to itinerary', booking_inquiry:'Create lead', payment_notice:'Verify deposit', gig_info:'Add to gig sheet', client_reply:'Open gig', other:'Open gig' };
async function loadInbox(){
  if(!supabaseClient || !S.realSession || S.inboxBusy) return;
  S.inboxBusy = true;
  try{
    const { data, error } = await supabaseClient.from('inbox_items').select('*').eq('status','new').order('received_at', { ascending:false }).limit(200);
    if(error){ toast('Could not load the inbox: ' + error.message, 'system'); S.inboxItems = S.inboxItems || []; return; }
    S.inboxItems = data || [];
  } finally { S.inboxBusy = false; render(); }
}
async function doInboxCheckNow(){
  S.inboxScanBusy = true; render();
  try{
    const res = await callEdgeFunction('inbox-scan', {});
    if(!res.ok) toast(res.error || 'Could not check the inbox.', 'system');
    else toast(res.scanned ? `Checked ${res.scanned} new email${res.scanned===1?'':'s'}.` : 'No new email.', 'success');
  } finally { S.inboxScanBusy = false; await loadInbox(); }
}
async function doInboxMark(id, status){
  const { error } = await supabaseClient.from('inbox_items').update({ status, handled_at:new Date().toISOString() }).eq('id', id);
  if(error){ toast('Could not update: ' + error.message, 'system'); return; }
  S.inboxItems = (S.inboxItems||[]).filter(x=>x.id!==id); render();
}
function doInboxAct(id){
  const it = (S.inboxItems||[]).find(x=>x.id===id); if(!it) return;
  const x = it.extracted || {};
  const gig = it.event_legacy_id && getEvent(it.event_legacy_id);
  if(it.kind==='booking_inquiry'){
    closeAllOverlays(); S.newLeadForm = { kind:'client' }; fillLeadFormFrom(S.newLeadForm, x); S.showNewLead = true; render(); return;
  }
  if(!gig){ toast("This email isn't matched to a gig — open the gig yourself.", 'system'); return; }
  openEvent(gig.id);
  if(it.kind==='travel_confirmation'){
    S.showTravelDrop=true; S.travelDropForm={}; S.travelDropFiles=[];
    S.travelDropResult={ flights:x.flights||[], hotels:x.hotels||[], ground:x.ground||[], notes:x.notes||'' }; render();
  } else if(it.kind==='gig_info'){
    const sheet = gigInfoSheetOf(gig);
    S.gigInfoForm={ text:sheet.text, band:gig.band||'', bandSize:gig.bandSize||'', choir:sheet.choir, otherSingers:sheet.otherSingers, startTime:sheet.startTime, scheduleText:gigScheduleText(sheet), songsText:gigSongsText(sheet) };
    fillGigFormFrom(S.gigInfoForm, x); S.gigInfoFile=null; S.newGigContactForm={}; S.showGigInfoForm=true; render();
  } else if(it.kind==='payment_notice' && !gig.depositReceived){
    S.verifyDepositEventId=gig.id; S.showVerifyDeposit=true; S.verifyDepositForm={ method:'zelle', note:`From email: ${it.summary||''}`.slice(0,300) }; render();
  }
}
/* ---- Money in (0064, owner 2026-10-21: "i need all emails integrated into the app so it can moniter money
   coming in") ----
   inbox-scan reads every connected mailbox and, for a payment email, records in it.money what it pays
   (match: an open invoice, a gig's deposit or its balance), the amount, and whether it is a bank's own
   DKIM-signed alert. A bank alert whose amount is exactly what's due is recorded here on its own; any
   other payment email (a client saying "I sent it", a partial amount) waits for one click. Each email is
   recorded once, by whichever admin browser claims it first (money_applied_at). */
function inboxMoneyTarget(it){
  const m = it.money && it.money.match; if(!m) return null;
  if(m.kind==='invoice'){ const inv = getInvoice(m.ref); return inv ? { inv } : null; }
  const ev = getEvent(m.ref); return ev ? { ev } : null;
}
function inboxMoneyRecorded(it){
  const m = it.money && it.money.match, t = inboxMoneyTarget(it); if(!m || !t) return false;
  return m.kind==='invoice' ? t.inv.status==='paid' : m.kind==='deposit' ? !!t.ev.depositReceived : !!t.ev.balanceReceived;
}
function inboxMoneyText(x){
  return `${x.amount_cents ? moneyCents(x.amount_cents/100) : 'Amount not stated'}${x.method?` by ${x.method}`:''}${x.payer?` from ${x.payer}`:''}${x.date?` (${fmtDateShort(x.date)})`:''}`;
}
const INBOX_MONEY_METHOD = m=>/zelle/i.test(m||'') ? 'zelle' : /wire/i.test(m||'') ? 'wire' : /check/i.test(m||'') ? 'check' : 'other';
async function applyInboxMoney(it, auto){
  const m = it.money && it.money.match, t = inboxMoneyTarget(it);
  if(!m || !t || !supabaseClient || !S.realSession || !isAdminUser(S.user)) return false;
  if(inboxMoneyRecorded(it)){ if(!auto) toast('That payment is already recorded.', 'system'); return false; }
  const now = new Date().toISOString();
  const { data, error } = await supabaseClient.from('inbox_items').update({ money_applied_at:now, status:'done', handled_at:now })
    .eq('id', it.id).is('money_applied_at', null).select('id');
  if(error){ if(!auto) toast('Could not record it: ' + error.message, 'system'); return false; }
  S.inboxItems = (S.inboxItems||[]).filter(x=>x.id!==it.id);
  if(!data || !data.length) return false;   // another admin's browser recorded it
  const note = `${inboxMoneyText(it.money)} — ${auto ? `${it.money.bank} alert, recorded automatically` : 'from the email'}: ${it.subject||''}`.slice(0, 300);
  if(m.kind==='invoice'){
    const inv = t.inv;
    inv.status = 'paid'; inv.paidAt = it.money.date || todayISO();
    inv.log = [...(inv.log||[]), { ts:now, type:'success', text:`Paid: ${note}.` }];
    if(inv.createdTs) revokeOpenPaymentLinks({ invoice:inv });
    saveCustomInvoices();
    toast(`Invoice ${inv.id} marked paid (${inboxMoneyText(it.money)}).`, 'success');
  } else if(m.kind==='deposit'){
    // What an online deposit does (applyOnlineDeposit): deposit received with its evidence, an open lead
    // becomes booked, the contract's pay links close, and the client gets the booking confirmation only
    // when this is what booked it (many gigs were booked before their deposit was recorded).
    const ev = t.ev, booking = STATUS_GROUPS.open.includes(ev.status);
    logEvent(ev, 'success', `Deposit received: ${note}.${booking ? ' Job officially booked & locked on calendar.' : ''}`);
    const patch = { depositReceived:true, depositReceivedDate: it.money.date || todayISO(),
      depositVerification:{ method: INBOX_MONEY_METHOD(it.money.method), note, loggedBy: auto ? null : S.user, loggedAt: now, inboxItemId: it.id } };
    if(booking) patch.status = 'booked';
    if(!reportEventSave(updateEvent(ev.id, patch), 'recording the deposit')) return false;
    contractsForLead(ev.id).forEach(c=>revokeOpenPaymentLinks({ contract:c }));
    toast(`${ev.clientName||'The client'} paid the deposit${booking ? ' — booked' : ''}.`, 'success');
    if(booking && ev.clientEmail && !ev.bookingConfirmationSentAt && !isHarnessBrowser()) doSendBookingConfirmationEmail(ev.id);
  } else {
    const ev = t.ev;
    logEvent(ev, 'success', `Balance received: ${note} — paid in full.`);
    if(reportEventSave(updateEvent(ev.id, { balanceReceived:true, balanceReceivedDate: it.money.date || todayISO(), status:'paid',
      balanceVerification:{ method: INBOX_MONEY_METHOD(it.money.method), note, loggedBy: auto ? null : S.user, loggedAt: now, inboxItemId: it.id } }), 'recording the balance'))
      toast(`${ev.clientName||'The client'} paid the balance — paid in full.`, 'success');
  }
  render();
  return true;
}
// Bank alerts that match exactly are recorded without anyone opening the Inbox: checked at sign-in and
// every few minutes after (the scan itself runs every 10).
async function applyBankAlertPayments(){
  if(!supabaseClient || !S.realSession || !isAdminUser(S.user)) return;
  const { data, error } = await supabaseClient.from('inbox_items').select('*').eq('status','new').is('money_applied_at', null).not('money','is',null);
  if(error) return;
  for(const it of data||[]){
    const x = it.money||{}, m = x.match;
    if(x.bank_verified && m && m.exact && inboxMoneyTarget(it) && !inboxMoneyRecorded(it)) await applyInboxMoney(it, true);
  }
}
let bankAlertTimer = null;
function startBankAlertWatch(){
  if(bankAlertTimer || !supabaseClient || !S.realSession || !isAdminUser(S.user)) return;
  bankAlertTimer = setInterval(applyBankAlertPayments, 5*60*1000);
  setTimeout(applyBankAlertPayments, 4000);   // after the gigs and invoices have loaded
}
function stopBankAlertWatch(){ if(bankAlertTimer){ clearInterval(bankAlertTimer); bankAlertTimer = null; } }
function inboxMoneyHtml(it){
  const x = it.money; if(!x) return '';
  const m = x.match, t = inboxMoneyTarget(it), done = inboxMoneyRecorded(it);
  const what = !m || !t ? 'Not matched to an invoice or gig yet'
    : m.kind==='invoice' ? `Invoice ${esc(m.ref)} (${esc(t.inv.clientName||'')}) — ${moneyCents(invoiceTotal(t.inv))} due`
    : `${m.kind==='deposit'?'Deposit':'Balance'} for ${esc((artistById(t.ev.artistId)||{}).name||'')} · ${esc(fmtDateShort(t.ev.date))} · ${esc(t.ev.clientName||'')}${m.due_cents?` — ${moneyCents(m.due_cents/100)} due`:''}`;
  const fit = !m || !t ? '' : done ? '<span class="pill pill-good">Already recorded</span>'
    : m.exact ? '<span class="pill pill-good">Exact amount</span>'
    : x.amount_cents && m.due_cents ? `<span class="pill pill-warn">${x.amount_cents < m.due_cents ? `Partial — ${moneyCents((m.due_cents-x.amount_cents)/100)} still due` : 'More than what is due'}</span>`
    : '<span class="pill pill-neutral">Amount not stated — check the bank</span>';
  return `<div style="font-size:13px;overflow-wrap:anywhere;"><strong>${esc(inboxMoneyText(x))}</strong>${x.bank_verified?` <span class="pill pill-good">${esc(x.bank)} alert</span>`:''}</div>
    <div style="font-size:12px;color:var(--ink-2);overflow-wrap:anywhere;">Pays: ${what} ${fit}</div>`;
}
function renderMessagesPage(){
  if(S.inboxItems==null && !S.inboxBusy) setTimeout(loadInbox, 0);
  const items = (S.inboxItems || []).slice().sort((a,b)=>(b.money?1:0)-(a.money?1:0));
  const when = iso=>{ if(!iso) return ''; return new Date(iso).toLocaleString('en-US',{ month:'short', day:'numeric', hour:'numeric', minute:'2-digit' }); };
  return `
  <div class="section-head"><h2>Inbox${items.length?` (${items.length})`:''}</h2>
    <button class="btn btn-sm" data-action="inbox-check-now" ${S.inboxScanBusy?'disabled':''}>${S.inboxScanBusy?'Checking…':'Check now'}</button></div>
  ${renderMercuryTransfers()}
  <p style="font-size:11.5px;color:var(--ink-3);margin:-8px 0 12px;">Every connected mailbox (Settings → Gmail Mailboxes) is read every 10 minutes. Each email is matched to its gig with a suggested next step. Payments come first: a bank's own alert for exactly what's due is recorded automatically; anything else waits for your click.</p>
  ${S.inboxItems==null? `<div class="card card-pad" style="font-size:13px;color:var(--ink-2);">Loading…</div>`
  : !items.length? `<div class="card empty">Nothing waiting — you're all caught up.</div>`
  : items.map(it=>{ const [label, cls] = INBOX_KINDS[it.kind] || INBOX_KINDS.other; const gig = it.event_legacy_id && getEvent(it.event_legacy_id);
      const canAct = it.kind==='booking_inquiry' || (gig && !(it.kind==='payment_notice' && gig.depositReceived));
      const mm = it.money && it.money.match;
      const moneyAct = mm && inboxMoneyTarget(it) && !inboxMoneyRecorded(it)
        ? (mm.kind==='invoice' ? `Mark ${mm.ref} paid` : mm.kind==='deposit' ? 'Record deposit & book' : (mm.exact ? 'Record balance — paid in full' : '')) : '';
      return `<div class="card card-pad" style="margin-bottom:10px;display:flex;flex-direction:column;gap:6px;" data-testid="inbox-item">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;"><span class="pill ${cls}">${esc(label)}</span>
          <strong style="font-size:13px;min-width:0;overflow-wrap:anywhere;">${esc(it.subject||'(no subject)')}</strong>
          <span style="margin-left:auto;font-size:11px;color:var(--ink-3);">${esc(when(it.received_at))}</span></div>
        <div style="font-size:12px;color:var(--ink-3);overflow-wrap:anywhere;">${esc(it.from_addr||'')}</div>
        <div style="font-size:13px;overflow-wrap:anywhere;">${esc(it.summary||'')}</div>
        ${inboxMoneyHtml(it)}
        ${gig? `<div style="font-size:12px;"><a href="#" data-action="open-event" data-id="${esc(gig.id)}" style="color:var(--accent);">${esc((artistById(gig.artistId)||{}).name||'')} · ${esc(fmtDateShort(gig.date))} · ${esc(gig.clientName||gig.type||'')}</a></div>`
          : it.event_legacy_id? `<div style="font-size:12px;color:var(--ink-3);">Gig ${esc(it.event_legacy_id)}</div>` : ''}
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;">
          ${moneyAct? `<button class="btn btn-sm btn-primary" data-action="inbox-money" data-id="${esc(it.id)}">${esc(moneyAct)}</button>`
            : canAct? `<button class="btn btn-sm btn-primary" data-action="inbox-act" data-id="${esc(it.id)}">${esc(INBOX_ACTION_LABEL[it.kind]||'Open gig')}</button>` : ''}
          ${it.gmail_thread_id? `<a class="btn btn-sm" href="https://mail.google.com/mail/u/?authuser=${encodeURIComponent(it.mailbox_email||'office@aspmgmt.com')}#all/${esc(it.gmail_thread_id)}" target="_blank" rel="noopener" data-action="external-link">Open email</a>` : ''}
          <button class="btn btn-sm btn-ghost" data-action="inbox-done" data-id="${esc(it.id)}">Done</button>
          <button class="btn btn-sm btn-ghost" data-action="inbox-dismiss" data-id="${esc(it.id)}">Dismiss</button>
        </div>
      </div>`; }).join('')}
  `;
}
/* ---- Video library (0068, owner 2026-10-28: "a searchable video library for a music agency's singers. Think
   Splice, but for performance videos") ----
   It is browsed inside the app (renderLibBrowse; /videos/ is a private standalone copy). The office manages it: bulk upload
   into a singer (straight to storage, resumable, so big files survive a shaky connection; the thumbnail and
   length are taken in this browser first), a tagging table (one Event / Tempo / Crowd per video, or several
   rows at once), and the singers and tag lists. Everything is in Supabase (library_* tables, bucket
   'library'); nothing is kept in this browser. */
const LIB_CATS = [['event','Event'],['tempo','Tempo'],['lifestyle','Crowd']];
const LIB_BUCKET = 'library';
// The bucket is private (0069): files open through signed links, made in batches and kept 6 hours.
const LIB_URL = p => (S.libUrls && S.libUrls[p]) || '';
async function libSignPaths(paths){
  S.libUrls = S.libUrls || {};
  const todo = [...new Set(paths.filter(p=>p && !S.libUrls[p]))];
  for(let i=0; i<todo.length; i+=500){
    const { data, error } = await supabaseClient.storage.from(LIB_BUCKET).createSignedUrls(todo.slice(i, i+500), 6*3600);
    if(error){ console.error('library links failed', error); return; }
    (data||[]).forEach(d=>{ if(d.signedUrl) S.libUrls[d.path] = d.signedUrl; });
  }
}
// Who may open the library (0069): admins given library access (the owner, Ilan), and crew. Managing
// it (upload, tag, singers): the same admins and social crew. The database enforces both.
function canSeeLibrary(){ return !!crewUser() || !!(adminById(S.user) && adminById(S.user).libraryAccess); }
function canManageLibrary(){ const c = crewUser(); return c ? c.kind==='social' : !!(adminById(S.user) && adminById(S.user).libraryAccess); }
const LIB_PHOTO_TYPES = { jpg:'image/jpeg', jpeg:'image/jpeg', png:'image/png', webp:'image/webp' };
const libIsPhoto = v => /^image\//.test((v && v.mime) || '');
const LIB_VIDEO_TYPES = { mp4:'video/mp4', m4v:'video/x-m4v', mov:'video/quicktime', webm:'video/webm', avi:'video/x-msvideo', mpg:'video/mpeg', mpeg:'video/mpeg' };
const TUS_SRC = 'https://cdn.jsdelivr.net/npm/tus-js-client@4.2.3/dist/tus.min.js';
const TUS_SRI = 'sha384-VRMVp3dn5fs5skaKWWUXMrg1rovVl5rGo6H7a1AFrZCdgXtOdQ8TnhsOLTvqRuus';
function libSlug(name){ return String(name||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60) || 'singer'; }
async function loadLibrary(){
  if(!supabaseClient || !S.realSession || S.libBusy) return;
  S.libBusy = true;
  try{
    const [s, t, v] = await Promise.all([
      supabaseClient.from('library_singers').select('*').order('sort').order('name'),
      supabaseClient.from('library_tags').select('*').order('category').order('sort').order('name'),
      supabaseClient.from('library_videos').select('*, library_video_tags(tag_id)').order('created_at', { ascending:false }).limit(2000),
    ]);
    const err = s.error || t.error || v.error;
    if(err){ toast('Could not load the media library: ' + err.message, 'system'); return; }
    S.lib = { singers:s.data||[], tags:t.data||[], videos:(v.data||[]).map(x=>({ ...x, tagIds:(x.library_video_tags||[]).map(y=>y.tag_id) })) };
    S.libUrls = {};
    await libSignPaths([...S.lib.videos.flatMap(x=>[x.video_path, x.thumb_path]), ...S.lib.singers.map(x=>x.photo_path)]);
  } finally { S.libBusy = false; render(); }
}
function libTagsOf(cat){ return ((S.lib && S.lib.tags) || []).filter(t=>t.category===cat); }
function libVideoTag(v, cat){ const ids = new Set(libTagsOf(cat).map(t=>t.id)); return v.tagIds.find(id=>ids.has(id)) || ''; }
function libUntagged(v){ return LIB_CATS.some(([c])=>!libVideoTag(v, c)); }
// Sets one filter's tag on these videos (replacing what they had for it; '' clears it).
async function libSetTag(videoIds, cat, tagId){
  const catIds = libTagsOf(cat).map(t=>t.id);
  const del = await supabaseClient.from('library_video_tags').delete().in('video_id', videoIds).in('tag_id', catIds);
  if(del.error){ toast('Could not save the tag: ' + del.error.message, 'system'); return false; }
  if(tagId){
    const ins = await supabaseClient.from('library_video_tags').insert(videoIds.map(id=>({ video_id:id, tag_id:tagId })));
    if(ins.error){ toast('Could not save the tag: ' + ins.error.message, 'system'); return false; }
  }
  S.lib.videos.forEach(v=>{ if(videoIds.includes(v.id)) v.tagIds = [...v.tagIds.filter(id=>!catIds.includes(id)), ...(tagId?[tagId]:[])]; });
  return true;
}
async function libUpdateVideo(id, patch){
  const { error } = await supabaseClient.from('library_videos').update({ ...patch, updated_at:new Date().toISOString() }).eq('id', id);
  if(error){ toast('Could not save: ' + error.message, 'system'); return false; }
  const v = S.lib.videos.find(x=>x.id===id); if(v) Object.assign(v, patch);
  return true;
}
async function libDeleteVideos(ids){
  const vids = S.lib.videos.filter(v=>ids.includes(v.id));
  if(!vids.length || !confirm(`Delete ${vids.length===1 ? `"${vids[0].title}"` : `${vids.length} files`}? The file${vids.length===1?' is':'s are'} removed from the library for good.`)) return;
  const { error } = await supabaseClient.from('library_videos').delete().in('id', ids);
  if(error){ toast('Could not delete: ' + error.message, 'system'); return; }
  await supabaseClient.storage.from(LIB_BUCKET).remove(vids.flatMap(v=>[v.video_path, v.thumb_path].filter(Boolean)));
  S.lib.videos = S.lib.videos.filter(v=>!ids.includes(v.id));
  S.libSelected = new Set([...(S.libSelected||[])].filter(id=>!ids.includes(id)));
  toast(`Deleted ${vids.length} file${vids.length===1?'':'s'}.`, 'success'); render();
}
// The first frame worth showing (a fifth of the way in, at most 30s) and the length, read in this browser.
function libThumbOf(file){
  return new Promise(resolve=>{
    const url = URL.createObjectURL(file), el = document.createElement('video');
    let done = false;
    const finish = (blob, duration)=>{ if(done) return; done = true; URL.revokeObjectURL(url); el.removeAttribute('src'); el.load(); resolve({ blob, duration }); };
    setTimeout(()=>finish(null, Number.isFinite(el.duration) ? el.duration : null), 20000);
    el.muted = true; el.playsInline = true; el.preload = 'auto';
    el.addEventListener('error', ()=>finish(null, null));
    // (A file with no stated length -- some browser recordings -- gets its picture from second 1.)
    el.addEventListener('loadedmetadata', ()=>{ el.currentTime = Number.isFinite(el.duration) ? Math.min(el.duration * 0.2, 30) : 1; });
    el.addEventListener('seeked', ()=>{
      try{
        const w = 640, h = Math.round(w * (el.videoHeight||9) / (el.videoWidth||16));
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        c.getContext('2d').drawImage(el, 0, 0, w, h);
        const len = Number.isFinite(el.duration) ? el.duration : null;
        c.toBlob(b=>finish(b, len), 'image/jpeg', 0.82);
      }catch(e){ finish(null, Number.isFinite(el.duration) ? el.duration : null); }
    });
    el.src = url;
  });
}
// A photo's small copy for the grid (640px wide), made in this browser.
async function libPhotoThumbOf(file){
  try{
    const bmp = await createImageBitmap(file);
    const w = Math.min(640, bmp.width), h = Math.round(w * bmp.height / bmp.width);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    c.getContext('2d').drawImage(bmp, 0, 0, w, h); bmp.close && bmp.close();
    return { blob: await new Promise(r=>c.toBlob(r, 'image/jpeg', 0.85)), duration:null };
  }catch(e){ return { blob:null, duration:null }; }
}
let tusLoading = null;
function loadTus(){
  if(window.tus) return Promise.resolve(window.tus);
  return tusLoading = tusLoading || new Promise((resolve, reject)=>{
    const s = document.createElement('script');
    s.src = TUS_SRC; s.integrity = TUS_SRI; s.crossOrigin = 'anonymous';
    s.onload = ()=>resolve(window.tus); s.onerror = ()=>{ tusLoading = null; reject(new Error('Could not load the uploader.')); };
    document.head.appendChild(s);
  });
}
// Resumable upload straight to storage (Supabase's TUS endpoint; 6 MB chunks, as it requires).
async function libUploadFile(file, path, contentType, onProgress){
  const tus = await loadTus();
  return new Promise((resolve, reject)=>{
    const up = new tus.Upload(file, {
      endpoint: SUPABASE_URL.replace('.supabase.co', '.storage.supabase.co') + '/storage/v1/upload/resumable',
      retryDelays: [0, 3000, 5000, 10000, 20000],
      uploadDataDuringCreation: true, removeFingerprintOnSuccess: true, chunkSize: 6*1024*1024,
      metadata: { bucketName:LIB_BUCKET, objectName:path, contentType, cacheControl:'31536000' },
      headers: { 'x-upsert':'false' },
      // A long upload can outlast the sign-in token: each request takes the current one.
      onBeforeRequest: async req=>{ const { data:{ session } } = await supabaseClient.auth.getSession(); req.setHeader('authorization', `Bearer ${session ? session.access_token : ''}`); req.setHeader('apikey', SUPABASE_PUBLISHABLE_KEY); },
      onError: err=>reject(err),
      onProgress: (sent, total)=>onProgress(total ? sent/total : 0),
      onSuccess: ()=>resolve(),
    });
    up.findPreviousUploads().then(prev=>{ if(prev.length) up.resumeFromPreviousUpload(prev[0]); up.start(); });
  });
}
// Upload progress is drawn in place, not by render(): a full redraw every few seconds would close the
// dropdown or steal the field someone is tagging in meanwhile.
function libShowProgress(it){
  const row = document.querySelector(`[data-lib-up="${it.key}"]`); if(!row) return;
  row.querySelector('[data-pct]').textContent = `${Math.round(it.pct*100)}%`;
  row.querySelector('[data-bar]').style.width = `${Math.round(it.pct*100)}%`;
}
async function libUploadFiles(files){
  const singer = (S.lib.singers||[]).find(s=>s.id===S.libUploadSinger);
  if(!singer){ toast('Pick the artist first.', 'system'); return; }
  const items = [...files].map(file=>{
    const ext = (file.name.split('.').pop()||'').toLowerCase();
    return { key:crypto.randomUUID(), file, ext, type: file.type || LIB_VIDEO_TYPES[ext] || LIB_PHOTO_TYPES[ext] || '', name:file.name, pct:0, status:'waiting', error:'' };
  });
  const bad = items.filter(x=>!Object.values(LIB_VIDEO_TYPES).includes(x.type) && !Object.values(LIB_PHOTO_TYPES).includes(x.type));
  if(bad.length) toast(`Skipped ${bad.length} file${bad.length===1?'':'s'} the library can't show (videos: mp4, mov, m4v, webm; photos: JPG, PNG, WebP).`, 'system');
  const todo = items.filter(x=>!bad.includes(x));
  S.libUploads = [...(S.libUploads||[]).filter(x=>x.status!=='done'), ...todo]; render();
  let next = 0;
  const worker = async ()=>{
    while(next < todo.length){
      const it = todo[next++];
      try{
        it.status = 'preparing'; render();
        const photo = it.type.startsWith('image/');
        const { blob, duration } = photo ? await libPhotoThumbOf(it.file) : await libThumbOf(it.file);
        const id = crypto.randomUUID(), path = `${photo ? 'photos' : 'videos'}/${singer.id}/${id}.${it.ext || (photo ? 'jpg' : 'mp4')}`;
        it.status = 'uploading'; render();
        let shown = 0;
        await libUploadFile(it.file, path, it.type, p=>{ it.pct = p; if(p - shown > 0.01 || p===1){ shown = p; libShowProgress(it); } });
        let thumb = null;
        if(blob){ const tp = `thumbs/${id}.jpg`; const r = await supabaseClient.storage.from(LIB_BUCKET).upload(tp, blob, { contentType:'image/jpeg', cacheControl:'31536000' }); if(!r.error) thumb = tp; }
        const title = it.name.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200) || 'Untitled';
        const { data, error } = await supabaseClient.from('library_videos').insert({ id, singer_id:singer.id, title, duration_s: duration ? Math.round(duration) : null,
          video_path:path, thumb_path:thumb, file_name:it.name.slice(0, 200), size_bytes:it.file.size, mime:it.type }).select('*').single();
        if(error) throw new Error(error.message);
        S.lib.videos.unshift({ ...data, tagIds:[] });
        await libSignPaths([data.video_path, data.thumb_path]);
        it.status = 'done'; it.pct = 1;
      }catch(err){ it.status = 'failed'; it.error = String(err && err.message || err).slice(0, 200); }
      render();
    }
  };
  await Promise.all([worker(), worker()]);
  const ok = todo.filter(x=>x.status==='done').length;
  if(ok){ S.libFilterSinger = singer.id; S.libUntaggedOnly = true; toast(`${ok} file${ok===1?'':'s'} uploaded — tag them below.`, 'success'); }
  render();
}
async function libSaveSinger(id, patch){
  const { error } = await supabaseClient.from('library_singers').update(patch).eq('id', id);
  if(error){ toast('Could not save: ' + error.message, 'system'); return false; }
  Object.assign(S.lib.singers.find(s=>s.id===id)||{}, patch); render(); return true;
}
async function libAddSinger(){
  const name = String((S.libNewSinger||'')).trim();
  if(!name){ toast('Type the singer\'s name.', 'system'); return; }
  let slug = libSlug(name);
  if(S.lib.singers.some(s=>s.slug===slug)) slug = `${slug}-${S.lib.singers.length+1}`;
  const sort = Math.max(0, ...S.lib.singers.map(s=>s.sort||0)) + 1;
  const { data, error } = await supabaseClient.from('library_singers').insert({ name, slug, sort }).select('*').single();
  if(error){ toast('Could not add: ' + error.message, 'system'); return; }
  S.lib.singers.push(data); S.libNewSinger = ''; toast(`${name} added.`, 'success'); render();
}
async function libDeleteSinger(id){
  const s = S.lib.singers.find(x=>x.id===id); if(!s) return;
  const vids = S.lib.videos.filter(v=>v.singer_id===id);
  if(!confirm(`Remove ${s.name} from the library${vids.length ? ` and delete their ${libCountLine(vids)}` : ''}? This can't be undone.`)) return;
  const { error } = await supabaseClient.from('library_singers').delete().eq('id', id);
  if(error){ toast('Could not remove: ' + error.message, 'system'); return; }
  const files = [...vids.flatMap(v=>[v.video_path, v.thumb_path]), s.photo_path].filter(Boolean);
  for(let i=0; i<files.length; i+=100) await supabaseClient.storage.from(LIB_BUCKET).remove(files.slice(i, i+100));
  S.lib.singers = S.lib.singers.filter(x=>x.id!==id); S.lib.videos = S.lib.videos.filter(v=>v.singer_id!==id);
  toast(`${s.name} removed.`, 'success'); render();
}
async function libSingerPhoto(id, file){
  if(!file || !/^image\/(jpeg|png|webp)$/.test(file.type)){ toast('Pick a JPG, PNG or WebP photo.', 'system'); return; }
  const s = S.lib.singers.find(x=>x.id===id); if(!s) return;
  const path = `singers/${id}-${Date.now()}.${file.type.split('/')[1].replace('jpeg','jpg')}`;
  const { error } = await supabaseClient.storage.from(LIB_BUCKET).upload(path, file, { contentType:file.type, cacheControl:'31536000' });
  if(error){ toast('Could not upload the photo: ' + error.message, 'system'); return; }
  const old = s.photo_path;
  if(await libSaveSinger(id, { photo_path:path })){ await libSignPaths([path]); render(); if(old) supabaseClient.storage.from(LIB_BUCKET).remove([old]); }
}
async function libAddTag(cat){
  const name = String((S.libNewTag||{})[cat]||'').trim(); if(!name) return;
  const sort = Math.max(0, ...libTagsOf(cat).map(t=>t.sort||0)) + 1;
  const { data, error } = await supabaseClient.from('library_tags').insert({ category:cat, name, sort }).select('*').single();
  if(error){ toast(/duplicate|unique/i.test(error.message) ? `“${name}” is already there.` : 'Could not add: ' + error.message, 'system'); return; }
  S.lib.tags.push(data); S.libNewTag[cat] = ''; render();
}
async function libRenameTag(id, name){
  name = String(name||'').trim(); const t = S.lib.tags.find(x=>x.id===id); if(!t || !name || name===t.name) return;
  const { error } = await supabaseClient.from('library_tags').update({ name }).eq('id', id);
  if(error){ toast('Could not rename: ' + error.message, 'system'); render(); return; }
  t.name = name; toast('Renamed.', 'success'); render();
}
async function libDeleteTag(id){
  const t = S.lib.tags.find(x=>x.id===id); if(!t) return;
  const n = S.lib.videos.filter(v=>v.tagIds.includes(id)).length;
  if(!confirm(`Delete the “${t.name}” option?${n ? ` It comes off ${n} video${n===1?'':'s'}.` : ''}`)) return;
  const { error } = await supabaseClient.from('library_tags').delete().eq('id', id);
  if(error){ toast('Could not delete: ' + error.message, 'system'); return; }
  S.lib.tags = S.lib.tags.filter(x=>x.id!==id); S.lib.videos.forEach(v=>{ v.tagIds = v.tagIds.filter(x=>x!==id); }); render();
}
function libTagSelect(cat, value, attrs){
  return `<select ${attrs} aria-label="${esc(LIB_CATS.find(([c])=>c===cat)[1])}" style="max-width:100%;"><option value="">—</option>${libTagsOf(cat).map(t=>`<option value="${esc(t.id)}" ${t.id===value?'selected':''}>${esc(t.name)}</option>`).join('')}</select>`;
}

/* ============ CREW: videographer + social media (0069) ============
   Owner 2026-10-28: Tzvi (social) sees the calendar and every gig -- no money -- and assigns Lilker;
   Lilker (videographer) sees only the gigs he's asked to film, confirms them, and gets the directions.
   Gigs come from crew_gig_view (no money columns); assignments go through the `crew` Edge Function,
   which checks who may do what and sends Lilker the WhatsApp. Nobody here creates or cancels a gig. */
const CREW_STATUS = { requested:['Asked','pill-warn'], confirmed:['Confirmed','pill-good'], declined:["Can't make it",'pill-neutral'] };
// Office: the crew list and every assignment, keyed by the gig's app id.
async function loadCrewRoster(){
  if(!supabaseClient || !S.realSession) return;
  const [c, g] = await Promise.all([
    supabaseClient.from('crew_members').select('id, name, initials, kind, phone, email, active').order('name'),
    supabaseClient.from('gig_crew').select('crew_id, status, notify_result, events(legacy_id)'),
  ]);
  if(c.error || g.error){ console.error('crew load failed', c.error || g.error); return; }
  S.crewRoster = c.data || [];
  const name = id => (S.crewRoster.find(x=>x.id===id)||{}).name || '';
  S.gigCrew = {};
  (g.data||[]).forEach(r=>{ const id = r.events && r.events.legacy_id; if(id) (S.gigCrew[id] = S.gigCrew[id] || []).push({ crewId:r.crew_id, name:name(r.crew_id), status:r.status, notify:r.notify_result }); });
  render();
}
function crewCanAssign(){ return isAdminUser(S.user) || (crewUser() && crewUser().kind==='social'); }
// The videographer card: who is asked / confirmed, and (office, Tzvi) ask or take it back.
function renderGigCrewCard(evId, entries){
  const vids = (S.crewRoster||[]).filter(c=>c.kind==='videographer' && c.active!==false);
  const assigned = new Map(entries.map(e=>[e.crewId, e]));
  const canAssign = crewCanAssign();
  if(!entries.length && !(canAssign && vids.length)) return '';
  return `<div class="card card-pad" data-testid="gig-crew">
    <div class="u-label" style="margin-bottom:8px;">Videographer</div>
    ${entries.map(e=>{ const [label, cls] = CREW_STATUS[e.status] || [e.status, 'pill-neutral'];
      return `<div class="kv-row" style="align-items:center;"><span style="min-width:0;"><strong>${esc(e.name)}</strong>${e.notify && e.status==='requested' ? `<br/><span style="font-size:11px;color:var(--ink-3);">${esc(e.notify.startsWith('not sent') ? 'WhatsApp ' + e.notify : 'WhatsApp sent' + (e.notify.includes('test') ? ' (test mode)' : ''))}</span>` : ''}</span>
        <span style="display:flex;align-items:center;gap:6px;flex:none;"><span class="pill ${cls}">${esc(label)}</span>
        ${canAssign ? `<button class="icon-btn" data-action="crew-unassign" data-id="${esc(evId)}" data-crew="${esc(e.crewId)}" title="Take back" aria-label="Take back">${ICO.x}</button>` : ''}</span></div>`; }).join('')}
    ${canAssign ? vids.filter(v=>!assigned.has(v.id) || assigned.get(v.id).status==='declined').map(v=>`<button class="btn btn-sm" style="margin-top:8px;" data-action="crew-assign" data-id="${esc(evId)}" data-crew="${esc(v.id)}" ${S.crewBusy?'disabled':''}>${ICO.plus} ${assigned.has(v.id)?'Ask again':'Ask'} ${esc(v.name.split(/\s+/)[0])} to film</button>`).join(' ') : ''}
  </div>`;
}
async function doCrewCall(body, okMsg){
  if(S.crewBusy) return;
  S.crewBusy = true; render();
  try{
    const res = await callEdgeFunction('crew', body);
    if(!res.ok){ toast(res.error || 'That did not go through.', 'system'); return; }
    const wa = res.whatsapp;
    toast(okMsg + (wa ? (wa.ok ? (wa.testRedirect ? ' WhatsApp sent (test mode: to your phone).' : ' WhatsApp sent.') : ` WhatsApp not sent: ${wa.error}`) : ''), wa && !wa.ok ? 'system' : 'success');
  } finally {
    S.crewBusy = false;
    if(crewUser()) await loadArtistPortalData(); else await loadCrewRoster();
  }
}
const crewSingers = ev => (ev.singers||[]).map(x=>x.name).join(' & ') || 'Gig';
function crewGigRow(ev, opts={}){
  const d = new Date(ev.date+'T00:00:00');
  const me = crewUser();
  const confirmed = (ev.crew||[]).filter(c=>c.status==='confirmed');
  const where = [ev.venue, ev.city].filter(Boolean).join(', ');
  return `<div class="card card-pad crew-gig" data-testid="crew-gig">
    <div style="display:flex;gap:14px;align-items:flex-start;min-width:0;cursor:pointer;" data-action="open-event" data-id="${esc(ev.id)}">
      <div class="crew-date"><span>${d.toLocaleDateString('en-US',{month:'short'})}</span><strong>${d.getDate()}</strong></div>
      <div style="min-width:0;flex:1;">
        <strong style="display:block;font-size:14.5px;overflow-wrap:anywhere;">${esc(crewSingers(ev))}</strong>
        <span style="font-size:12.5px;color:var(--ink-2);overflow-wrap:anywhere;">${esc(d.toLocaleDateString('en-US',{weekday:'short'}))}${ev.time && ev.time!=='00:00' ? ' · ' + esc(fmtTimeRange(ev.time, ev.endTime)) : ''} · ${esc(ev.type)}${where ? ' · ' + esc(where) : ''}</span>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;">
          ${ev.crewStatus==='pending' ? `<span class="pill pill-neutral">Pending contract</span>` : ''}
          ${me && me.kind==='videographer' && ev.myStatus ? `<span class="pill ${(CREW_STATUS[ev.myStatus]||[])[1]||''}">${esc(ev.myStatus==='requested' ? 'Waiting for your answer' : (CREW_STATUS[ev.myStatus]||[ev.myStatus])[0])}</span>` : ''}
          ${me && me.kind==='social' ? (confirmed.length ? `<span class="pill pill-good">${ICO.check} ${esc(confirmed.map(c=>c.name.split(/\s+/)[0]).join(', '))} filming</span>` : (ev.crew||[]).some(c=>c.status==='requested') ? `<span class="pill pill-warn">Videographer asked</span>` : `<span class="pill pill-neutral">No videographer</span>`) : ''}
        </div>
      </div>
    </div>
    ${opts.directions ? renderMapLinks(ev) : ''}
    ${me && me.kind==='videographer' && ev.myStatus==='requested' ? `<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
      <button class="btn btn-sm btn-primary" data-action="crew-respond" data-id="${esc(ev.id)}" data-accept="1" ${S.crewBusy?'disabled':''}>${ICO.check} Confirm</button>
      <button class="btn btn-sm" data-action="crew-respond" data-id="${esc(ev.id)}" data-accept="0" ${S.crewBusy?'disabled':''}>Can't make it</button></div>` : ''}
  </div>`;
}
function renderCrewHome(){
  const me = crewUser(); if(!me) return '';
  const p = S.artistPortal;
  if(!p.loadedAt) return `<div class="card card-pad" style="font-size:13px;color:var(--ink-2);">${p.error ? 'Could not load the gigs: ' + esc(p.error) : 'Loading…'}</div>`;
  const today = todayISO();
  const byDate = (a,b)=>(a.date+(a.time||'')).localeCompare(b.date+(b.time||''));
  const evs = S.events.filter(e=>e.date).slice().sort(byDate);
  const todays = evs.filter(e=>e.date===today);
  const waiting = me.kind==='videographer' ? evs.filter(e=>e.date>today && e.myStatus==='requested') : []; // today's ask shows under Today
  const upcoming = evs.filter(e=>e.date>today && !waiting.includes(e)).slice(0, me.kind==='social' ? 30 : 50);
  const sec = (title, list, empty, opts)=>`<div class="section-head" style="margin-top:22px;"><h2>${title}</h2></div>
    ${list.length ? `<div style="display:flex;flex-direction:column;gap:10px;">${list.map(e=>crewGigRow(e, opts)).join('')}</div>` : `<div class="card card-pad" style="font-size:13px;color:var(--ink-3);">${empty}</div>`}`;
  return `<p style="margin:0;color:var(--ink-2);font-size:13.5px;">${esc(new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'}))} · Hi ${esc(me.name.split(/\s+/)[0])}</p>
    ${waiting.length ? sec('Waiting for your answer', waiting, '', {directions:false}) : ''}
    ${sec('Today', todays, me.kind==='videographer' ? 'Nothing to film today.' : 'No gigs today.', {directions:true})}
    ${sec('Coming up', upcoming, me.kind==='videographer' ? 'No gigs booked for you yet. When we ask you to film one, it shows up here and on WhatsApp.' : 'No upcoming gigs.', {directions:false})}`;
}
function renderCrewGigSheet(ev){
  if(!ev) return '';
  const me = crewUser();
  const d = ev.date ? fmtDate(ev.date) : 'Date TBD';
  return `<div class="overlay overlay-window" data-action="overlay-close">
    <div class="sheet sheet-window" data-stop>
      <div class="sheet-head">
        <div style="min-width:0;"><strong style="font-family:var(--font-display);font-size:1.2rem;display:block;overflow-wrap:anywhere;">${esc(crewSingers(ev))}</strong>
          <span class="pill ${ev.crewStatus==='pending'?'pill-neutral':'pill-accent'}">${ev.crewStatus==='pending'?'Pending contract':'Booked'}</span></div>
        <button class="icon-btn" data-action="close-sheet" aria-label="Close">${ICO.x}</button>
      </div>
      <div class="sheet-body">
        ${me.kind==='videographer' && ev.myStatus==='requested' ? `<div class="card card-pad" style="display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;">
          <strong>Can you film this one?</strong><span style="display:flex;gap:8px;">
          <button class="btn btn-sm btn-primary" data-action="crew-respond" data-id="${esc(ev.id)}" data-accept="1" ${S.crewBusy?'disabled':''}>${ICO.check} Confirm</button>
          <button class="btn btn-sm" data-action="crew-respond" data-id="${esc(ev.id)}" data-accept="0" ${S.crewBusy?'disabled':''}>Can't make it</button></span></div>` : ''}
        <div class="card card-pad" style="display:flex;flex-direction:column;gap:9px;">
          <div class="kv-row"><span style="color:var(--ink-2);">${ICO.clock} Date &amp; Time</span><strong class="u-mono" style="text-align:right;">${esc(d)}${ev.time && ev.time!=='00:00' ? ' · ' + esc(fmtTimeRange(ev.time, ev.endTime)) : ''}</strong></div>
          <div class="kv-row"><span style="color:var(--ink-2);">Event</span><strong style="text-align:right;">${esc(ev.type)}${ev.clientName ? `<br/><span style="font-weight:500;color:var(--ink-2);">${esc(ev.clientName)}</span>` : ''}</strong></div>
          <div class="kv-row"><span style="color:var(--ink-2);">${ICO.pin} Venue</span><span style="text-align:right;"><strong>${ev.venue ? esc(ev.venue) : '<span style="color:var(--ink-3);font-weight:500;">TBD</span>'}${ev.address ? `<br/><span style="font-weight:500;color:var(--ink-2);">${esc(ev.address)}</span>` : ''}${ev.city||ev.state ? `<br/><span style="font-weight:500;color:var(--ink-2);">${esc([ev.city, ev.state].filter(Boolean).join(', '))}</span>` : ''}</strong>
            <span style="display:flex;justify-content:flex-end;">${renderMapLinks(ev)}</span></span></div>
          ${ev.dressCode ? `<div class="kv-row"><span style="color:var(--ink-2);">Dress Code</span><strong style="text-align:right;">${esc(ev.dressCode)}</strong></div>` : ''}
        </div>
        ${me.kind==='social' ? renderGigCrewCard(ev.id, ev.crew||[]) : ''}
        ${renderPrepAndGigInfoCard(ev, false)}
      </div>
    </div>
  </div>`;
}


/* ============ WHATSAPP (0071) ============
   Owner 2026-10-29: "make a whatsapp tab on the app only visible to my account". The office number's
   conversations: every message the app sends (logged by _shared/whatsapp.ts) and every message people send
   to the office (whatsapp-webhook, from 360dialog), live. Only admins given whatsapp_access (set by SQL) can
   open it; the database refuses everyone else. Replies go through whatsapp-send, so test mode applies. */
function canUseWhatsApp(){ const a = adminById(S.user); return !!(a && a.whatsappAccess); }
let waChannel = null;
function stopWhatsAppLive(){ if(waChannel && supabaseClient){ supabaseClient.removeChannel(waChannel); } waChannel = null; }
async function loadWhatsApp(){
  if(!supabaseClient || !S.realSession || (S.wa && S.wa.loading)) return;
  S.wa = { ...(S.wa||{}), loading:true };
  const [m, st, ct] = await Promise.all([
    supabaseClient.from('whatsapp_messages').select('*').order('created_at', { ascending:false }).limit(2000),
    callEdgeFunction('whatsapp-send', { action:'status' }),
    supabaseClient.from('whatsapp_contacts').select('contact, name'),
  ]);
  S.wa = { loading:false, loaded:true, messages:m.data||[], error:m.error ? m.error.message : null, status: st && st.ok ? st : null,
    contacts: new Map((ct.data||[]).map(c=>[c.contact, c.name])) };
  if(!waChannel){
    waChannel = supabaseClient.channel('whatsapp-messages').on('postgres_changes', { event:'*', schema:'public', table:'whatsapp_messages' }, p=>{
      if(!S.wa || !S.wa.messages || !p.new || !p.new.id) return;
      const i = S.wa.messages.findIndex(x=>x.id===p.new.id);
      if(i>=0) S.wa.messages[i] = p.new; else S.wa.messages.unshift(p.new);
      if(S.view==='whatsapp') renderPreservingFocus();
    }).subscribe();
  }
  render();
}
function waPhone(d){ d = String(d||''); return d.length===11 && d[0]==='1' ? `+1 (${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7)}` : (d ? '+' + d : ''); }
function waTime(iso){ const d = new Date(iso), today = new Date(); return d.toDateString()===today.toDateString() ? d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}) : d.toLocaleDateString('en-US',{month:'short',day:'numeric'}) + ' ' + d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}); }
// A client's chat is named from their gig (owner 2026-10-29: "automatically added as contact with the date of
// the event"): the soonest upcoming gig with that phone, else the latest past one. Derived, never stored.
function waGigNames(){
  const today = todayISO(), best = new Map();
  for(const e of S.events||[]){
    const d = String(e.clientPhone||'').replace(/\D/g,''); if(d.length < 10 || e.unpaid) continue;
    const k = d.length===10 ? '1' + d : d, cur = best.get(k);
    const better = !cur || (e.date>=today && (cur.date<today || e.date<cur.date)) || (e.date<today && cur.date<today && e.date>cur.date);
    if(better) best.set(k, e);
  }
  const out = new Map();
  best.forEach((e,k)=>out.set(k, `${e.clientName || 'Client'} · ${e.type} ${fmtDateShort(e.date)}`));
  return out;
}
// Conversations, newest first. A contact's name: the name the owner saved for the number (0073), else their gig
// (client · event date), else a crew member on file, else the WhatsApp profile name they sent, else the number.
function waConversations(){
  const by = new Map();
  for(const m of (S.wa && S.wa.messages)||[]){ const c = by.get(m.contact) || { contact:m.contact, msgs:[] }; c.msgs.push(m); by.set(m.contact, c); }
  const known = new Map(((S.crewRoster||[]).filter(c=>c.phone)).map(c=>[String(c.phone).replace(/\D/g,'').replace(/^(\d{10})$/,'1$1'), c.name]));
  const gigs = waGigNames();
  return [...by.values()].map(c=>{ c.msgs.sort((a,b)=>a.created_at.localeCompare(b.created_at)); const last = c.msgs[c.msgs.length-1];
    c.name = (S.wa.contacts && S.wa.contacts.get(c.contact)) || gigs.get(c.contact) || known.get(c.contact) || (c.msgs.slice().reverse().find(m=>m.contact_name)||{}).contact_name || waPhone(c.contact);
    c.last = last; c.lastIn = c.msgs.filter(m=>m.direction==='in').pop() || null; return c; })
    .sort((a,b)=>b.last.created_at.localeCompare(a.last.created_at));
}
const WA_TICKS = { sent:'✓', delivered:'✓✓', read:'✓✓', failed:'!' };
function renderWhatsAppPage(){
  if(!S.wa || (!S.wa.loaded && !S.wa.loading)){ setTimeout(loadWhatsApp, 0); return `<div class="card card-pad" style="font-size:13px;color:var(--ink-2);">Loading…</div>`; }
  if(!S.wa.loaded) return `<div class="card card-pad" style="font-size:13px;color:var(--ink-2);">Loading…</div>`;
  const st = S.wa.status || {};
  const convs = waConversations();
  const cur = S.waContact==='new' ? null : convs.find(c=>c.contact===S.waContact) || null;
  const showThread = !!(cur || S.waContact==='new');
  const banner = `<div class="wa-status">
      <span>${st.connected ? `<span class="pill pill-good">Connected</span>` : `<span class="pill pill-warn">Not connected</span>`}
      ${st.testMode ? ` <span class="pill pill-warn">Test mode</span> <span style="color:var(--ink-2);">every message goes to ${esc(waPhone(String(st.testTo||'').replace(/\D/g,'')))}</span>` : ''}
      ${Object.keys(st.templates||{}).length ? `<span style="color:var(--ink-2);" title="Automatic messages to people who haven't written in 24 hours need Meta-approved templates">· Templates: ${Object.entries(st.templates).map(([k,v])=>`${esc(k.replace(/_/g,' '))} <strong style="color:${v==='approved'?'var(--good-ink)':v==='rejected'?'var(--crit)':'var(--warn-ink)'};">${esc(v)}</strong>`).join(', ')}</span>` : ''}</span>
      ${st.incoming===false ? `<span style="color:var(--ink-2);">Incoming messages aren't connected yet.</span>` : `<button class="btn btn-sm btn-ghost" data-action="wa-setup-webhook" ${S.waBusy?'disabled':''} title="Point 360dialog's incoming messages at the app">Reconnect incoming</button>`}
    </div>`;
  const list = `<div class="wa-list card">
      <div class="wa-list-head"><strong>Chats</strong><button class="btn btn-sm btn-primary" data-action="wa-new">${ICO.plus} New</button></div>
      ${convs.length ? convs.map(c=>`<button class="wa-conv ${cur && cur.contact===c.contact ? 'active' : ''}" data-action="wa-open" data-id="${esc(c.contact)}" data-testid="wa-conv">
        <span class="avatar" data-slot="0" style="width:36px;height:36px;font-size:12px;">${esc(String(c.name).replace(/[^A-Za-z ]/g,'').trim().split(/\s+/).map(w=>w[0]||'').join('').slice(0,2).toUpperCase() || '#')}</span>
        <span style="min-width:0;flex:1;text-align:left;"><span style="display:flex;justify-content:space-between;gap:6px;"><strong class="wa-ellipsis">${esc(c.name)}</strong><span style="font-size:11px;color:var(--ink-3);flex:none;">${esc(waTime(c.last.created_at))}</span></span>
          <span class="wa-ellipsis" style="display:block;font-size:12.5px;color:var(--ink-2);">${c.last.direction==='out' ? 'You: ' : ''}${esc(c.last.body||'')}</span></span></button>`).join('')
        : `<p style="padding:14px;margin:0;font-size:13px;color:var(--ink-3);">No messages yet. Messages the app sends, and messages people send to the office number, show up here.</p>`}
    </div>`;
  let thread = '';
  if(showThread){
    const outside = cur && (!cur.lastIn || Date.now() - new Date(cur.lastIn.created_at).getTime() > 24*3600*1000);
    thread = `<div class="wa-thread card">
      <div class="wa-thread-head"><button class="icon-btn wa-back" data-action="wa-back" aria-label="Back">${ICO.chev('l')}</button>
        ${cur ? (S.waEditName===cur.contact
            ? `<div style="display:flex;gap:6px;flex:1;min-width:0;"><input class="wa-to" data-wa-name value="${esc((S.wa.contacts && S.wa.contacts.get(cur.contact)) || '')}" placeholder="Name for ${esc(waPhone(cur.contact))}"/><button class="btn btn-sm btn-primary" data-action="wa-save-name" data-id="${esc(cur.contact)}">Save</button></div>`
            : `<div style="min-width:0;flex:1;"><strong class="wa-ellipsis" style="display:block;">${esc(cur.name)}</strong><span style="font-size:12px;color:var(--ink-3);">${esc(waPhone(cur.contact))}</span></div>
               <button class="icon-btn" data-action="wa-edit-name" data-id="${esc(cur.contact)}" title="Name this contact" aria-label="Name this contact">${ICO.edit}</button>`)
          : `<input class="wa-to" data-wa-to placeholder="Phone number, e.g. 516 555 0123" value="${esc(S.waTo||'')}" inputmode="tel"/>`}</div>
      <div class="wa-msgs" id="wa-msgs">${cur ? cur.msgs.map(m=>`<div class="wa-msg ${m.direction}" data-testid="wa-msg">
          <div class="wa-bubble">${m.media_id ? waMediaHtml(m) : ''}${m.media_id && /^\[[a-z]+\]$/.test(m.body||'') ? '' : esc(m.body||'')}${m.real_to ? `<div class="wa-note">Test mode: meant for ${esc(waPhone(m.real_to))}</div>` : ''}${m.error ? `<div class="wa-err">${esc(m.error)}</div>` : ''}
          <span class="wa-meta">${esc(waTime(m.created_at))}${m.direction==='out' ? ` <span class="${m.status==='read'?'wa-read':''}">${WA_TICKS[m.status]||''}</span>` : ''}</span></div></div>`).join('') : ''}</div>
      ${st.incoming===false ? `<div class="wa-hint">Incoming messages aren't connected yet, so the app can't see their replies. A typed message only arrives if they've written to the office number in the last 24 hours.</div>`
        : outside ? `<div class="wa-hint">They haven't written in the last 24 hours, so WhatsApp only delivers an approved template, not a typed message.</div>` : ''}
      ${st.testMode ? `<div class="wa-hint">Test mode: what you send goes to ${esc(waPhone(String(st.testTo||'').replace(/\D/g,'')))}, not to them.</div>` : ''}
      <div class="wa-compose"><textarea data-wa-draft rows="1" placeholder="Message">${esc(S.waDraft||'')}</textarea>
        <button class="btn btn-primary" data-action="wa-send" ${S.waBusy?'disabled':''}>Send</button></div>
    </div>`;
  }
  return `<div class="wa">${banner}<div class="wa-grid ${showThread?'has-thread':''}">${list}${thread || `<div class="wa-thread card wa-empty"><p>Choose a chat, or start a new one.</p></div>`}</div></div>`;
}
const WA_MEDIA_LABEL = { audio:'Play voice note', voice:'Play voice note', image:'Show photo', sticker:'Show sticker', video:'Play video', document:'Open document' };
function waMediaHtml(m){
  const url = (S.waMedia||{})[m.media_id];
  if(url === 'loading') return `<div class="wa-media-btn">Loading…</div>`;
  if(url && url.startsWith('error:')) return `<div class="wa-err">${esc(url.slice(6))}</div>`;
  if(!url) return `<button class="btn btn-sm wa-media-btn" data-action="wa-media" data-id="${esc(m.media_id)}">${esc(WA_MEDIA_LABEL[m.kind] || 'Open file')}</button>`;
  if(m.kind==='image' || m.kind==='sticker') return `<a href="${esc(url)}" target="_blank" rel="noopener"><img class="wa-img" src="${esc(url)}" alt=""/></a>`;
  if(m.kind==='audio' || m.kind==='voice') return `<audio controls src="${esc(url)}" class="wa-audio"></audio>`;
  if(m.kind==='video') return `<video controls playsinline src="${esc(url)}" class="wa-img"></video>`;
  return `<a class="btn btn-sm" href="${esc(url)}" download="${esc(m.body && !/^\[/.test(m.body) ? m.body : 'file')}">Download file</a>`;
}
// The file comes through whatsapp-send (it holds the WhatsApp key); kept in memory for this session only.
async function doWhatsAppMedia(id){
  S.waMedia = S.waMedia || {}; S.waMedia[id] = 'loading'; render();
  try{
    const { data: { session } } = await supabaseClient.auth.getSession();
    const r = await fetch(`${SUPABASE_URL}/functions/v1/whatsapp-send`, { method:'POST', headers:{ Authorization:`Bearer ${session.access_token}`, apikey:SUPABASE_PUBLISHABLE_KEY, 'Content-Type':'application/json' }, body:JSON.stringify({ action:'media', mediaId:id }) });
    if(!r.ok){ const j = await r.json().catch(()=>({})); S.waMedia[id] = 'error:' + (j.error || 'Could not load it.'); }
    else S.waMedia[id] = URL.createObjectURL(await r.blob());
  }catch(e){ S.waMedia[id] = 'error:Could not load it.'; }
  render();
}
async function doWhatsAppSaveName(contact){
  const el = document.querySelector('[data-wa-name]'); const name = String(el && el.value || '').trim();
  const { error } = name ? await supabaseClient.from('whatsapp_contacts').upsert({ contact, name, updated_at:new Date().toISOString() })
    : await supabaseClient.from('whatsapp_contacts').delete().eq('contact', contact);
  if(error){ toast('Could not save the name: ' + error.message, 'system'); return; }
  if(name) S.wa.contacts.set(contact, name); else S.wa.contacts.delete(contact);
  S.waEditName = null; render();
}
async function doWhatsAppSend(){
  const text = String(S.waDraft||'').trim();
  const to = S.waContact==='new' ? String(S.waTo||'').replace(/\D/g,'') : S.waContact;
  if(!text){ toast('Type a message first.', 'system'); return; }
  if(!to || to.length < 10){ toast('Enter the phone number.', 'system'); return; }
  S.waBusy = true; render();
  try{
    const res = await callEdgeFunction('whatsapp-send', { to:'+' + (to.length===10 ? '1' + to : to), text });
    if(!res.ok){ toast('Not sent: ' + (res.error || 'WhatsApp refused it.'), 'system'); return; }
    S.waDraft = ''; if(S.waContact==='new'){ S.waContact = res.testRedirect ? String(S.wa.status.testTo).replace(/\D/g,'') : (to.length===10 ? '1' + to : to); S.waTo = ''; }
    toast(res.testRedirect ? 'Sent to the test phone (test mode).' : 'Sent.', 'success');
  } finally { S.waBusy = false; render(); }
}
async function doWhatsAppSetupWebhook(){
  S.waBusy = true; render();
  try{
    const res = await callEdgeFunction('whatsapp-send', { action:'setup-webhook' });
    toast(res.ok ? 'Incoming messages connected.' : 'Could not connect: ' + (res.error || 'unknown'), res.ok ? 'success' : 'system');
    if(res.ok) S.wa = null;
  } finally { S.waBusy = false; render(); }
}
function bindWhatsApp(){
  if(S.view!=='whatsapp') return;
  const box = document.getElementById('wa-msgs'); if(box) box.scrollTop = box.scrollHeight;
  document.querySelectorAll('[data-wa-draft]').forEach(el=>{
    el.addEventListener('input', ()=>{ S.waDraft = el.value; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 140) + 'px'; });
    el.addEventListener('keydown', e=>{ if(e.key==='Enter' && !e.shiftKey && window.matchMedia('(pointer:fine)').matches){ e.preventDefault(); doWhatsAppSend(); } });
  });
  document.querySelectorAll('[data-wa-to]').forEach(el=>el.addEventListener('input', ()=>{ S.waTo = el.value; }));
}

const LIB_TABS = [['browse','Library'],['videos','Upload & tag'],['singers','Singers'],['tags','Tags']];
function renderVideoLibraryPage(){
  if(!S.lib && !S.libBusy) setTimeout(loadLibrary, 0);
  if(!S.lib) return `<div class="card card-pad" style="font-size:13px;color:var(--ink-2);">Loading…</div>`;
  if(!canManageLibrary()) return `<div class="lib">${renderLibBrowse()}</div>`;
  const tab = S.libTab || 'browse';
  return `<div class="lib">
  <div class="lib-head">
    <div class="lib-tabs" role="tablist">${LIB_TABS.map(([k,l])=>`<button type="button" role="tab" aria-selected="${tab===k}" class="${tab===k?'active':''}" data-action="lib-tab" data-id="${k}">${l}</button>`).join('')}</div>
    <select class="tab-select lib-tab-select" aria-label="Section">${LIB_TABS.map(([k,l])=>`<option value="${k}" ${tab===k?'selected':''}>${l}</option>`).join('')}</select>
    <div class="lib-share">${renderDriveBackupBadge()}</div>
  </div>
  ${tab==='browse' ? renderLibBrowse()
    : tab==='singers' ? renderLibSingers() : tab==='tags' ? renderLibTags() : renderLibVideos()}</div>`;
}
// Google Drive backup (0074), for the people who run the library (not crew).
function canRunDriveBackup(){ return !crewUser() && !!(adminById(S.user) && adminById(S.user).libraryAccess); }
async function loadDriveBackup(){
  if(!canRunDriveBackup() || S.driveLoading) return;
  S.driveLoading = true;
  try{
    const res = await callEdgeFunction('library-drive-backup', { action:'status' });
    S.drive = res && res.ok ? res : { error:(res && res.error) || 'unknown' };
  } finally { S.driveLoading = false; render(); }
}
async function doDriveBackupNow(quiet){
  if(S.driveBusy) return;
  S.driveBusy = true; render();
  try{
    const res = await callEdgeFunction('library-drive-backup', { action:'run' });
    if(!quiet) toast(res.ok ? (res.skipped ? 'A backup is already running.' : `Backed up ${res.backedUp||0} video${res.backedUp===1?'':'s'}${res.error?' (one had a problem: '+res.error+')':''}.`) : 'Backup failed: ' + (res.error||'unknown'), res.ok && !res.error ? 'success' : 'system');
  } finally { S.driveBusy = false; S.drive = null; loadDriveBackup(); }
}
function renderDriveBackupBadge(){
  if(!canRunDriveBackup()) return `<span>Private: only people with access, signed in</span>`;
  const d = S.drive;
  if(!d){ setTimeout(loadDriveBackup, 0); return `<span>Google Drive backup…</span>`; }
  if(d.error) return `<span title="${esc(d.error)}">Google Drive backup: couldn't check</span>`;
  if(!d.connected) return `<span>Not backed up yet</span><button class="btn btn-sm" data-action="drive-connect" data-testid="drive-connect">Connect Google Drive</button>`;
  const waiting = d.total - d.backedUp;
  return `<span title="${esc(`${d.email} · ASP Media Library folder${d.lastRunAt ? ' · last checked ' + new Date(d.lastRunAt).toLocaleString() : ''}${d.lastError ? ' · ' + d.lastError : ''}`)}" data-testid="drive-status">Google Drive: ${waiting ? `${d.backedUp} of ${d.total} backed up${d.failing ? ` · ${d.failing} failing` : ''}` : `all ${d.total} backed up`}</span>
    ${waiting ? `<button class="btn btn-sm" data-action="drive-backup-now" ${S.driveBusy?'disabled':''}>${S.driveBusy?'Backing up…':'Back up now'}</button>` : ''}`;
}
/* ---- Browsing the library, inside the app (owner 2026-10-29: "i want it to look as part of the app not a
   seperate window"). Singers first, then one singer's videos (or all of them) with Event / Tempo / Crowd
   chips and a search; a video plays in an overlay and downloads as the original file. Only shown singers
   and published videos appear here, the same as the standalone /videos/ page. ---- */
const LIB_FILTERS = [['singer','Singer'], ...LIB_CATS];
function libBrowsePool(){
  const L = S.lib, shown = new Set(L.singers.filter(s=>s.active).map(s=>s.id));
  const vids = L.videos.filter(v=>v.published && shown.has(v.singer_id));
  return S.libAt==='all' ? vids : vids.filter(v=>v.singer_id===S.libAt);
}
// The picture on an artist's card: the one chosen for them, else their newest photo in the library.
function libSingerPic(s){
  if(s.photo_path && LIB_URL(s.photo_path)) return LIB_URL(s.photo_path);
  const p = S.lib.videos.find(v=>v.singer_id===s.id && v.published && libIsPhoto(v) && LIB_URL(v.thumb_path || v.video_path));
  return p ? LIB_URL(p.thumb_path || p.video_path) : '';
}
function libCountLine(items){
  const ph = items.filter(libIsPhoto).length, vi = items.length - ph;
  return [vi || !ph ? `${vi} video${vi===1?'':'s'}` : '', ph ? `${ph} photo${ph===1?'':'s'}` : ''].filter(Boolean).join(' · ');
}
// Makes a library photo the artist's card picture (a copy, so deleting the photo later keeps the picture).
async function libUseAsSingerPhoto(videoId){
  const v = S.lib.videos.find(x=>x.id===videoId), s = v && S.lib.singers.find(x=>x.id===v.singer_id); if(!v || !s) return;
  const path = `singers/${s.id}-${Date.now()}.${(v.video_path.split('.').pop()||'jpg').toLowerCase()}`;
  const { error } = await supabaseClient.storage.from(LIB_BUCKET).copy(v.video_path, path);
  if(error){ toast('Could not set the picture: ' + error.message, 'system'); return; }
  const old = s.photo_path;
  if(await libSaveSinger(s.id, { photo_path:path })){ await libSignPaths([path]); toast(`${s.name}'s card picture is set.`, 'success'); render(); if(old) supabaseClient.storage.from(LIB_BUCKET).remove([old]); }
}
function libInitials(name){ return esc(String(name||'?').split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase()); }
function libFmtLen(s){ s = Math.round(Number(s)||0); if(!s) return ''; const h=Math.floor(s/3600), m=Math.floor(s%3600/60), x=s%60; return (h?h+':'+String(m).padStart(2,'0'):m)+':'+String(x).padStart(2,'0'); }
function libDownloadUrl(v){ const u = LIB_URL(v.video_path); return u ? `${u}&download=${encodeURIComponent(v.file_name || (v.title + '.mp4'))}` : ''; }
function renderLibBrowse(){
  const L = S.lib;
  const singers = L.singers.filter(s=>s.active);
  const at = S.libAt && (S.libAt==='all' || singers.some(s=>s.id===S.libAt)) ? S.libAt : '';
  if(!at){
    const count = id => libCountLine(L.videos.filter(v=>v.published && v.singer_id===id));
    return `<div data-testid="lib-browse">
      <div class="lib-bar"><div style="min-width:0;"><div class="lib-label">Videos &amp; photos</div><h2 class="lib-h">Choose an artist</h2></div>
        <button class="btn btn-sm" data-action="lib-at" data-id="all">Search everything</button></div>
      ${singers.length ? `<div class="lib-singers">${singers.map(s=>`<button type="button" class="lib-singer" data-action="lib-at" data-id="${esc(s.id)}" data-testid="singer-card">
        <span class="lib-singer-ph">${libSingerPic(s) ? `<img src="${esc(libSingerPic(s))}" alt="" loading="lazy"/>` : libInitials(s.name)}</span>
        <span class="lib-singer-nm"><strong>${esc(s.name)}</strong><span>${count(s.id)}</span></span></button>`).join('')}</div>`
        : `<div class="card lib-empty">No artists yet.</div>`}</div>`;
  }
  const singer = at==='all' ? null : singers.find(s=>s.id===at);
  const pool = libBrowsePool();
  const F = S.libF || (S.libF = {});
  const used = new Set(pool.flatMap(v=>v.tagIds));
  const kinds = new Set(pool.map(v=>libIsPhoto(v) ? 'photo' : 'video'));
  const kindRow = kinds.size > 1 ? `<div class="lib-frow"><span class="lib-label">Show</span><div class="lib-chips">${[['','Everything'],['video','Videos'],['photo','Photos']].map(([k,l])=>`<button type="button" class="lib-chip" data-action="lib-kind" data-id="${k}" aria-pressed="${(S.libKind||'')===k}">${l}</button>`).join('')}</div></div>` : '';
  const rows = kindRow + LIB_FILTERS.map(([c,label])=>{
    const opts = c==='singer' ? (singer || singers.length<2 ? [] : singers) : libTagsOf(c).filter(t=>used.has(t.id));
    return opts.length ? `<div class="lib-frow"><span class="lib-label">${label}</span><div class="lib-chips">${opts.map(t=>`<button type="button" class="lib-chip" data-action="lib-chip" data-cat="${c}" data-id="${esc(t.id)}" aria-pressed="${!!(F[c]||[]).includes(t.id)}">${esc(t.name)}</button>`).join('')}</div></div>` : '';
  }).join('');
  return `<div data-testid="lib-browse">
    <div class="lib-bar"><div style="display:flex;align-items:center;gap:12px;min-width:0;">
        <button class="icon-btn" data-action="lib-at" data-id="" title="All singers" aria-label="All singers">${ICO.chev('l')}</button>
        ${singer ? `<span class="lib-av">${libSingerPic(singer) ? `<img src="${esc(libSingerPic(singer))}" alt=""/>` : libInitials(singer.name)}</span>` : ''}
        <div style="min-width:0;"><div class="lib-label">Videos &amp; photos</div><h2 class="lib-h">${esc(singer ? singer.name : 'All artists')}</h2></div></div></div>
    ${rows ? `<div class="card card-pad lib-filters">${rows}</div>` : ''}
    <div class="lib-toolbar"><input type="search" placeholder="Search titles and songs" data-lib-q value="${esc(S.libQ||'')}" style="flex:1 1 200px;max-width:340px;"/>
      <span style="display:flex;align-items:center;gap:10px;margin-left:auto;"><span style="font-size:12px;color:var(--ink-3);" data-lib-count></span>
        <button class="btn btn-sm btn-ghost" data-action="lib-clear">Clear all</button></span></div>
    <div data-lib-results>${renderLibResults()}</div></div>`;
}
// Within a filter any chosen option matches; across filters all must.
function libBrowseList(){
  const F = S.libF || {}, q = String(S.libQ||'').trim().toLowerCase(), kind = S.libKind || '';
  return libBrowsePool().filter(v=>(!kind || (kind==='photo') === libIsPhoto(v)) && LIB_FILTERS.every(([c])=>{ const want = F[c]||[]; return !want.length || (c==='singer' ? want.includes(v.singer_id) : v.tagIds.some(id=>want.includes(id))); })
    && (!q || `${v.title} ${v.songs||''}`.toLowerCase().includes(q)))
    .sort((a,b)=>String(b.recorded_on||'').localeCompare(String(a.recorded_on||'')) || String(b.created_at).localeCompare(String(a.created_at)));
}
function renderLibResults(){
  const L = S.lib, list = libBrowseList();
  const tagName = new Map(L.tags.map(t=>[t.id,t]));
  const singerName = id => (L.singers.find(s=>s.id===id)||{}).name || '';
  const any = Object.values(S.libF||{}).some(a=>a.length) || String(S.libQ||'').trim() || S.libKind;
  const html = list.length ? `<div class="lib-grid">${list.map(v=>{
    const tags = LIB_CATS.flatMap(([c])=>v.tagIds.map(id=>tagName.get(id)).filter(t=>t && t.category===c));
    const sub = [S.libAt==='all' ? singerName(v.singer_id) : '', v.songs].filter(Boolean).join(' · ');
    return `<div class="card lib-vid" data-testid="video-card">
      <button type="button" class="lib-thumb ${libIsPhoto(v) ? 'is-photo' : ''}" data-action="lib-play" data-id="${esc(v.id)}" aria-label="${libIsPhoto(v) ? 'View' : 'Play'} ${esc(v.title)}">${LIB_URL(v.thumb_path || (libIsPhoto(v) ? v.video_path : '')) ? `<img src="${esc(LIB_URL(v.thumb_path || v.video_path))}" alt="" loading="lazy"/>` : ''}
        ${libIsPhoto(v) ? '' : `<span class="lib-play"><svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg></span>${libFmtLen(v.duration_s) ? `<span class="lib-dur">${libFmtLen(v.duration_s)}</span>` : ''}`}</button>
      <div class="lib-vb"><div class="lib-vt">${esc(v.title)}</div>${sub ? `<div class="lib-vs">${esc(sub)}</div>` : ''}
        ${tags.length ? `<div class="lib-badges">${tags.map(t=>`<span class="pill">${esc(t.name)}</span>`).join('')}</div>` : ''}
        <div class="lib-vf"><span>${v.recorded_on ? esc(new Date(v.recorded_on+'T00:00:00').toLocaleDateString('en-US',{ month:'short', year:'numeric' })) : ''}</span>
          <a class="btn btn-sm" href="${esc(libDownloadUrl(v))}" data-action="external-link" data-testid="download">${ICO.download} Download</a></div></div></div>`; }).join('')}</div>`
    : `<div class="card lib-empty">${any ? 'Nothing matches. Try removing a filter.' : 'Nothing here yet.'}</div>`;
  return html + `<span hidden data-lib-n="${list.length}"></span>`;
}
function libRefreshResults(){
  const box = document.querySelector('[data-lib-results]'); if(!box) return;
  libStopPreviews(); box.innerHTML = renderLibResults(); libSyncCount(); bindLibPreviews();
}
function libSyncCount(){
  const n = document.querySelector('[data-lib-n]'), c = document.querySelector('[data-lib-count]');
  if(n && c){ const k = Number(n.dataset.libN); c.textContent = `${k} item${k===1?'':'s'}`; }
}
function libStopPreviews(){ document.querySelectorAll('video[data-lib-preview]').forEach(el=>{ el.pause(); el.removeAttribute('src'); el.load(); el.remove(); }); }
// A muted preview on hover (mouse only; on a phone a tap opens the player).
function bindLibPreviews(){
  if(!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  document.querySelectorAll('.lib-thumb[data-id]:not(.is-photo)').forEach(b=>{
    let t = null;
    b.addEventListener('mouseenter', ()=>{ t = setTimeout(()=>{
      const v = S.lib && S.lib.videos.find(x=>x.id===b.dataset.id); if(!v || !LIB_URL(v.video_path)) return;
      libStopPreviews();
      const el = document.createElement('video');
      el.muted = true; el.playsInline = true; el.preload = 'metadata'; el.setAttribute('data-lib-preview','');
      el.src = LIB_URL(v.video_path) + '#t=' + Math.max(0, Math.round((Number(v.duration_s)||0) * 0.2));
      el.addEventListener('loadeddata', ()=>{ el.play().catch(()=>{}); });
      b.appendChild(el);
    }, 350); });
    b.addEventListener('mouseleave', ()=>{ clearTimeout(t); libStopPreviews(); });
  });
}
// The player sits outside the app's page so a re-render (a live update elsewhere) never stops the video.
function libOpenPlayer(id){
  const v = S.lib && S.lib.videos.find(x=>x.id===id); if(!v) return;
  libStopPreviews();
  const ov = document.createElement('div');
  ov.className = 'lib-ov';
  const photo = libIsPhoto(v), singer = S.lib.singers.find(x=>x.id===v.singer_id);
  ov.innerHTML = `<div class="lib-player" role="dialog" aria-label="${esc(v.title)}"><div class="lib-player-bar"><strong style="overflow-wrap:anywhere;min-width:0;">${esc(v.title)}</strong>
      <span style="display:flex;gap:8px;flex-wrap:wrap;">${photo && singer && canManageLibrary() ? `<button class="btn btn-sm" data-lib-cover data-testid="lib-use-photo">Use as ${esc(singer.name.split(/\s+/)[0])}'s card picture</button>` : ''}<a class="btn btn-sm btn-primary" href="${esc(libDownloadUrl(v))}">${ICO.download} Download</a><button class="btn btn-sm" data-lib-close>Close</button></span></div>
    ${photo ? `<img src="${esc(LIB_URL(v.video_path))}" alt="${esc(v.title)}"/>` : `<video controls autoplay playsinline src="${esc(LIB_URL(v.video_path))}"${v.thumb_path ? ` poster="${esc(LIB_URL(v.thumb_path))}"` : ''}></video>`}</div>`;
  const close = ()=>{ const el = ov.querySelector('video'); if(el){ el.pause(); el.removeAttribute('src'); el.load(); } ov.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = e=>{ if(e.key==='Escape') close(); };
  ov.addEventListener('click', e=>{ if(e.target.closest('[data-lib-cover]')){ close(); libUseAsSingerPhoto(v.id); return; } if(e.target===ov || e.target.closest('[data-lib-close]')) close(); });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(ov);
}
function renderLibVideos(){
  const L = S.lib, sel = S.libSelected || (S.libSelected = new Set());
  const singerName = id => (L.singers.find(s=>s.id===id)||{}).name || '';
  const q = String(S.libSearch||'').trim().toLowerCase();
  const list = L.videos.filter(v=>(!S.libFilterSinger || v.singer_id===S.libFilterSinger) && (!S.libUntaggedOnly || libUntagged(v)) && (!q || `${v.title} ${v.songs||''}`.toLowerCase().includes(q)));
  const ups = S.libUploads || [];
  const fmtLen = s=>{ s = Math.round(Number(s)||0); return s ? `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}` : ''; };
  const selCount = [...sel].filter(id=>list.some(v=>v.id===id)).length;
  return `
  <div class="card card-pad" style="margin-bottom:14px;" data-testid="lib-upload">
    <div style="display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-bottom:12px;">
      <h3 style="margin:0;">Upload videos &amp; photos</h3>
      <select data-lib-upload-singer style="max-width:100%;min-width:200px;"><option value="">Choose the artist…</option>${L.singers.map(s=>`<option value="${esc(s.id)}" ${s.id===S.libUploadSinger?'selected':''}>${esc(s.name)}</option>`).join('')}</select>
    </div>
    <label class="lib-drop ${S.libUploadSinger?'':'off'}" data-lib-drop>
      <span class="lib-drop-ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M7 9l5-5 5 5M5 20h14"/></svg></span>
      <strong style="font-size:14px;">${S.libUploadSinger ? 'Drop videos and photos here, or click to choose' : 'Choose the artist first, then drop files here'}</strong>
      <span style="font-size:12px;color:var(--ink-3);">As many as you like at once · videos: mp4, mov, m4v, webm, up to 5 GB · photos: JPG, PNG, WebP</span>
      <input type="file" accept="video/*,image/jpeg,image/png,image/webp,.mov,.m4v" multiple data-lib-files style="display:none;" ${S.libUploadSinger?'':'disabled'}/>
    </label>
    ${ups.length ? `<div style="margin-top:10px;display:flex;flex-direction:column;gap:6px;">${ups.map(u=>`<div style="font-size:12.5px;min-width:0;" data-lib-up="${esc(u.key)}">
      <div style="display:flex;justify-content:space-between;gap:8px;"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;">${esc(u.name)}</span>
        <span data-pct style="flex:none;color:${u.status==='failed'?'var(--warn-ink)':'var(--ink-3)'};">${u.status==='uploading'?`${Math.round(u.pct*100)}%`:u.status==='done'?'Done':u.status==='failed'?'Failed':u.status==='preparing'?'Reading…':'Waiting'}</span></div>
      <div style="height:4px;border-radius:2px;background:var(--border);overflow:hidden;"><div data-bar style="height:100%;width:${Math.round(u.pct*100)}%;background:${u.status==='failed'?'var(--warn-ink)':'var(--accent)'};"></div></div>
      ${u.error?`<div style="color:var(--warn-ink);overflow-wrap:anywhere;">${esc(u.error)}</div>`:''}</div>`).join('')}</div>` : ''}
  </div>
  <div class="lib-toolbar">
    <select data-lib-filter-singer style="max-width:100%;"><option value="">All singers</option>${L.singers.map(s=>`<option value="${esc(s.id)}" ${s.id===S.libFilterSinger?'selected':''}>${esc(s.name)}</option>`).join('')}</select>
    <input type="search" placeholder="Search titles and songs" data-lib-search value="${esc(S.libSearch||'')}" style="flex:1 1 180px;max-width:300px;"/>
    <label class="lib-check"><input type="checkbox" data-lib-untagged ${S.libUntaggedOnly?'checked':''}/> Needs tags only</label>
    <span style="font-size:12px;color:var(--ink-3);margin-left:auto;">${list.length} file${list.length===1?'':'s'}</span>
  </div>
  ${selCount ? `<div class="card card-pad" style="margin-bottom:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;" data-testid="lib-bulk">
    <strong style="font-size:13px;">${selCount} selected:</strong>
    ${LIB_CATS.map(([c,l])=>`<label style="display:flex;align-items:center;gap:4px;font-size:12.5px;">${l} ${libTagSelect(c, '', `data-lib-bulk="${c}"`)}</label>`).join('')}
    <button class="btn btn-sm btn-ghost" data-action="lib-bulk-delete">Delete</button>
    <button class="btn btn-sm btn-ghost" data-action="lib-select-none">Clear selection</button>
  </div>` : ''}
  ${list.length ? `<div class="card table-cards"><table>
    <thead><tr><th><input type="checkbox" data-lib-select-all ${selCount && selCount===list.length?'checked':''} aria-label="Select all"/></th><th>File</th><th>Title &amp; songs</th>${LIB_CATS.map(([,l])=>`<th>${l}</th>`).join('')}<th>Shown</th><th></th></tr></thead>
    <tbody>${list.map(v=>`<tr data-testid="lib-row">
      <td data-label="Select"><input type="checkbox" data-lib-select="${esc(v.id)}" ${sel.has(v.id)?'checked':''} aria-label="Select"/></td>
      <td data-label="File"><a href="${esc(LIB_URL(v.video_path))}" target="_blank" rel="noopener" data-action="external-link" style="display:block;width:120px;max-width:100%;aspect-ratio:16/9;border-radius:6px;overflow:hidden;background:#000;position:relative;">${v.thumb_path?`<img src="${esc(LIB_URL(v.thumb_path))}" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;"/>`:''}${fmtLen(v.duration_s)?`<span style="position:absolute;right:4px;bottom:4px;background:rgba(0,0,0,.7);color:#fff;font-size:10px;padding:0 4px;border-radius:3px;">${fmtLen(v.duration_s)}</span>`:''}</a>
        ${!S.libFilterSinger?`<div style="font-size:11px;color:var(--ink-3);margin-top:3px;">${esc(singerName(v.singer_id))}</div>`:''}</td>
      <td data-label="Title"><input value="${esc(v.title)}" data-lib-title="${esc(v.id)}" aria-label="Title" style="width:100%;min-width:0;"/>
        <input value="${esc(v.songs||'')}" data-lib-songs="${esc(v.id)}" placeholder="Song name(s)" aria-label="Songs" style="width:100%;min-width:0;margin-top:4px;font-size:12px;"/>
        <input type="date" value="${esc(v.recorded_on||'')}" data-lib-date="${esc(v.id)}" aria-label="Date" style="margin-top:4px;font-size:12px;"/></td>
      ${LIB_CATS.map(([c,l])=>`<td data-label="${l}">${libTagSelect(c, libVideoTag(v,c), `data-lib-tag="${c}" data-id="${esc(v.id)}"`)}</td>`).join('')}
      <td data-label="Shown"><input type="checkbox" data-lib-published="${esc(v.id)}" ${v.published?'checked':''} aria-label="Shown in the library"/></td>
      <td><button class="icon-btn" data-action="lib-delete-video" data-id="${esc(v.id)}" title="Delete" aria-label="Delete">${ICO.trash}</button></td>
    </tr>`).join('')}</tbody></table></div>`
  : `<div class="card lib-empty">${L.videos.length ? 'Nothing matches.' : 'Nothing yet — choose an artist and drop videos or photos in above.'}</div>`}`;
}
function renderLibSingers(){
  const L = S.lib, count = id => L.videos.filter(v=>v.singer_id===id).length;
  return `<div class="card card-pad" style="margin-bottom:14px;">
    ${L.singers.map((s,i)=>`<div class="settings-row" style="flex-wrap:wrap;gap:10px;" data-testid="lib-singer">
      <div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1 1 240px;">
        <label class="lib-photo" title="${s.photo_path?'Change':'Add'} photo"><span class="lib-photo-av">${s.photo_path?`<img src="${esc(LIB_URL(s.photo_path))}" alt=""/>`:esc(String(s.name||'?').split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase())}</span><span class="lib-photo-cam">${ICO.image}</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" data-lib-photo="${esc(s.id)}" style="display:none;"/></label>
        <div style="min-width:0;flex:1;"><input class="lib-inline" value="${esc(s.name)}" data-lib-singer-name="${esc(s.id)}" aria-label="Name" style="width:100%;font-weight:600;font-size:14.5px;"/>
          <p style="margin:2px 0 0 9px;font-size:11.5px;color:var(--ink-3);">${libCountLine(L.videos.filter(v=>v.singer_id===s.id))}${s.photo_path?'':' · no card picture yet: tap the circle, or open one of their photos in the Library and choose “Use as card picture”'}</p></div>
      </div>
      <div style="display:flex;gap:6px;align-items:center;">
        <label class="lib-check"><input type="checkbox" data-lib-singer-active="${esc(s.id)}" ${s.active?'checked':''}/> Shown</label>
        <button class="icon-btn" data-action="lib-singer-up" data-id="${esc(s.id)}" ${i===0?'disabled':''} title="Move up" aria-label="Move up">${ICO.up}</button>
        <button class="icon-btn" data-action="lib-singer-down" data-id="${esc(s.id)}" ${i===L.singers.length-1?'disabled':''} title="Move down" aria-label="Move down">${ICO.down}</button>
        <button class="icon-btn" data-action="lib-delete-singer" data-id="${esc(s.id)}" title="Remove" aria-label="Remove">${ICO.trash}</button>
      </div></div>`).join('')}
    <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;"><input placeholder="New singer's name" data-lib-new-singer value="${esc(S.libNewSinger||'')}" style="flex:1 1 200px;max-width:320px;"/>
      <button class="btn btn-sm btn-primary" data-action="lib-add-singer">${ICO.plus} Add singer</button></div>
  </div>`;
}
function renderLibTags(){
  S.libNewTag = S.libNewTag || {};
  return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:14px;">${LIB_CATS.map(([c,l])=>`<div class="card card-pad">
    <h3 style="margin:0 0 10px;">${l}</h3>
    ${libTagsOf(c).map(t=>`<div class="lib-tagrow"><input class="lib-inline" value="${esc(t.name)}" data-lib-tag-name="${esc(t.id)}" aria-label="Name" style="flex:1;min-width:0;"/>
      <button class="icon-btn" data-action="lib-delete-tag" data-id="${esc(t.id)}" title="Delete" aria-label="Delete">${ICO.trash}</button></div>`).join('')}
    <div style="display:flex;gap:6px;margin-top:10px;"><input placeholder="Add an option" data-lib-new-tag="${c}" value="${esc(S.libNewTag[c]||'')}" style="flex:1;min-width:0;"/>
      <button class="btn btn-sm" data-action="lib-add-tag" data-id="${c}">${ICO.plus} Add</button></div>
  </div>`).join('')}</div>`;
}
async function libMoveSinger(id, dir){
  const list = S.lib.singers, i = list.findIndex(s=>s.id===id), j = i + dir;
  if(i<0 || j<0 || j>=list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  const res = await Promise.all(list.map((s, k)=>s.sort===k ? null : supabaseClient.from('library_singers').update({ sort:k }).eq('id', s.id).then(r=>{ if(!r.error) s.sort = k; return r; })));
  if(res.some(r=>r && r.error)) toast('Could not save the order.', 'system');
  render();
}
function bindVideoLibrary(){
  if(S.view!=='videos' || !S.lib) return;
  const q = sel => document.querySelectorAll(sel);
  libSyncCount(); bindLibPreviews();
  q('[data-lib-q]').forEach(el=>el.addEventListener('input', ()=>{ S.libQ = el.value; libRefreshResults(); }));
  q('.lib-tab-select').forEach(el=>el.addEventListener('change', ()=>{ S.libTab = el.value; render(); }));
  q('[data-lib-upload-singer]').forEach(el=>el.addEventListener('change', ()=>{ S.libUploadSinger = el.value; render(); }));
  q('[data-lib-files]').forEach(el=>el.addEventListener('change', ()=>{ const f = [...(el.files||[])]; el.value = ''; if(f.length) libUploadFiles(f); }));
  q('[data-lib-drop]').forEach(el=>{
    el.addEventListener('dragover', e=>{ e.preventDefault(); el.style.borderColor = 'var(--accent)'; });
    el.addEventListener('dragleave', ()=>{ el.style.borderColor = ''; });
    el.addEventListener('drop', e=>{ e.preventDefault(); el.style.borderColor = ''; if(!S.libUploadSinger){ toast('Pick the artist first.', 'system'); return; } const f = [...(e.dataTransfer.files||[])]; if(f.length) libUploadFiles(f); });
  });
  q('[data-lib-filter-singer]').forEach(el=>el.addEventListener('change', ()=>{ S.libFilterSinger = el.value; render(); }));
  q('[data-lib-untagged]').forEach(el=>el.addEventListener('change', ()=>{ S.libUntaggedOnly = el.checked; render(); }));
  q('[data-lib-search]').forEach(el=>el.addEventListener('change', ()=>{ S.libSearch = el.value; render(); }));
  q('[data-lib-select]').forEach(el=>el.addEventListener('change', ()=>{ el.checked ? S.libSelected.add(el.dataset.libSelect) : S.libSelected.delete(el.dataset.libSelect); render(); }));
  q('[data-lib-select-all]').forEach(el=>el.addEventListener('change', ()=>{ document.querySelectorAll('[data-lib-select]').forEach(x=>{ el.checked ? S.libSelected.add(x.dataset.libSelect) : S.libSelected.delete(x.dataset.libSelect); }); render(); }));
  q('[data-lib-tag]').forEach(el=>el.addEventListener('change', async ()=>{ await libSetTag([el.dataset.id], el.dataset.libTag, el.value); render(); }));
  q('[data-lib-bulk]').forEach(el=>el.addEventListener('change', async ()=>{
    const ids = [...S.libSelected].filter(id=>S.lib.videos.some(v=>v.id===id)); if(!ids.length || !el.value) return;
    const name = (S.lib.tags.find(t=>t.id===el.value)||{}).name;
    if(await libSetTag(ids, el.dataset.libBulk, el.value)) toast(`${name} set on ${ids.length} video${ids.length===1?'':'s'}.`, 'success');
    render();
  }));
  q('[data-lib-title]').forEach(el=>el.addEventListener('change', ()=>{ const t = el.value.trim().slice(0,200); if(t) libUpdateVideo(el.dataset.libTitle, { title:t }); }));
  q('[data-lib-songs]').forEach(el=>el.addEventListener('change', ()=>libUpdateVideo(el.dataset.libSongs, { songs:el.value.trim().slice(0,300) || null })));
  q('[data-lib-date]').forEach(el=>el.addEventListener('change', ()=>libUpdateVideo(el.dataset.libDate, { recorded_on:el.value || null })));
  q('[data-lib-published]').forEach(el=>el.addEventListener('change', ()=>libUpdateVideo(el.dataset.libPublished, { published:el.checked })));
  q('[data-lib-photo]').forEach(el=>el.addEventListener('change', ()=>{ const f = el.files && el.files[0]; el.value = ''; libSingerPhoto(el.dataset.libPhoto, f); }));
  q('[data-lib-singer-name]').forEach(el=>el.addEventListener('change', ()=>{ const n = el.value.trim().slice(0,120); if(n) libSaveSinger(el.dataset.libSingerName, { name:n }); }));
  q('[data-lib-singer-active]').forEach(el=>el.addEventListener('change', ()=>libSaveSinger(el.dataset.libSingerActive, { active:el.checked })));
  q('[data-lib-new-singer]').forEach(el=>el.addEventListener('input', ()=>{ S.libNewSinger = el.value; }));
  q('[data-lib-new-tag]').forEach(el=>el.addEventListener('input', ()=>{ S.libNewTag[el.dataset.libNewTag] = el.value; }));
  q('[data-lib-tag-name]').forEach(el=>el.addEventListener('change', ()=>libRenameTag(el.dataset.libTagName, el.value)));
}
function renderPricingPage(){
  const artistId = S.pricingArtist || ARTISTS[0].id;
  const artist = artistById(artistId);
  return `
  <p style="font-size:12.5px;color:var(--ink-3);margin:0 0 16px;max-width:640px;">Standard hourly rates by artist and event type — the reference bookkeeping quotes from before negotiating a final flat price. Overtime: each extra half hour costs a full hour at the gig's rate (the fee ÷ booked hours) — contracts fill it in automatically and it stays editable.</p>
  ${renderArtistFilterRow(artistId, 'pricing-artist', {noAll:true})}
  <div class="card table-cards">
    <table>
      <thead><tr><th>Event Type</th><th>Hourly Rate</th><th>Included Hours</th><th>Overtime (per ½ hour)</th></tr></thead>
      <tbody>
        ${EVENT_TYPES.map(type=>{
          const p = getPricing(artistId, type);
          return `<tr>
            <td data-label="Event Type">${esc(type)}</td>
            <td data-label="Hourly Rate"><span class="u-mono" style="margin-right:2px;">$</span><input type="number" min="0" step="25" value="${p.hourlyRate}" data-action="set-hourly-rate" data-artist="${artistId}" data-type="${esc(type)}" style="width:90px;padding:6px 8px;border-radius:6px;border:1px solid var(--border-strong);background:var(--surface);font-family:var(--font-mono);"/></td>
            <td data-label="Included Hours"><input type="number" min="0" step="0.5" value="${p.includedHours}" data-action="set-included-hours" data-artist="${artistId}" data-type="${esc(type)}" style="width:70px;padding:6px 8px;border-radius:6px;border:1px solid var(--border-strong);background:var(--surface);font-family:var(--font-mono);"/></td>
            <td data-label="Overtime" class="u-mono">${money(p.hourlyRate)}/½ hr</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>
  <p style="font-size:11px;color:var(--ink-3);margin-top:10px;">Editing ${esc(artist.name)}'s rates — changes save automatically.</p>
  `;
}
function renderFinancialsPage(){
  const filt = S.finArtistFilter==='all' ? S.events : S.events.filter(e=>e.artistId===S.finArtistFilter);
  const booked = filt.filter(e=>isConfirmed(e));
  const gross = booked.reduce((s,e)=>s+e.price,0);
  const commission = booked.reduce((s,e)=>s+e.commission,0);
  const payouts = booked.reduce((s,e)=>s+artistPayout(e),0);
  const avg = booked.length ? Math.round(gross/booked.length) : 0;
  const openInvoices = CUSTOM_INVOICES.filter(i=>i.status==='open');
  const openInvoiceTotal = openInvoices.reduce((s,i)=>s+invoiceTotal(i),0);
  const payoutEligible = filt.filter(e=>e.balanceReceived);
  const owedToArtists = payoutEligible.filter(e=>!e.artistPaidOut);
  const owedTotal = owedToArtists.reduce((s,e)=>s+artistPayout(e),0);
  const paidOutTotal = payoutEligible.filter(e=>e.artistPaidOut).reduce((s,e)=>s+artistPayout(e),0);

  const months = lastNMonths(6);
  const monthlyGross = sumByMonth(booked, months, e=>e.price).map((val,i)=>({label: months[i].toLocaleDateString('en-US',{month:'short'}), val}));
  const maxMonthly = Math.max(...monthlyGross.map(m=>m.val),1);

  return `
  ${renderArtistFilterRow(S.finArtistFilter, 'fin-filter')}
  <div class="grid stat-row" style="margin-bottom:20px;">
    <div class="card stat-tile"><span class="u-label">Gross Booked</span><span class="val">${money(gross)}</span><span class="sub">${booked.length} jobs</span></div>
    <div class="card stat-tile"><span class="u-label">ASP Commission</span><span class="val">${money(commission)}</span><span class="sub">${gross? Math.round(commission/gross*100) : Math.round(COMMISSION_RATE*100)}% of gross</span></div>
    <div class="card stat-tile"><span class="u-label">Artist Payouts</span><span class="val">${money(payouts)}</span><span class="sub">after commission, incl. charges</span></div>
    <div class="card stat-tile"><span class="u-label">Avg Job Size</span><span class="val">${money(avg)}</span><span class="sub">per booking</span></div>
  </div>

  <div class="grid" style="grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;">
    <div class="card stat-tile" style="cursor:pointer;" data-action="nav" data-view="financials"><span class="u-label">Open Invoices</span><span class="val">${openInvoices.length}</span><span class="sub">Non-gig billing awaiting payment</span></div>
    <div class="card stat-tile" style="cursor:pointer;" data-action="nav" data-view="financials"><span class="u-label">Open Invoice Total</span><span class="val">${money(openInvoiceTotal)}</span><span class="sub">Across ${openInvoices.length} open invoice${openInvoices.length===1?'':'s'}</span></div>
  </div>

  <div class="grid" style="grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;">
    <div class="card stat-tile"><span class="u-label">Owed to Artists</span><span class="val">${money(owedTotal)}</span><span class="sub">${owedToArtists.length} gig${owedToArtists.length===1?'':'s'} paid by client, not yet paid out</span></div>
    <div class="card stat-tile"><span class="u-label">Paid Out</span><span class="val">${money(paidOutTotal)}</span><span class="sub">Settled with artists</span></div>
  </div>

  <div class="section-head"><h2>Artist Payouts — Gig Breakdown (${payoutEligible.length})</h2></div>
  ${payoutEligible.length? `<div class="card table-cards" style="margin-bottom:22px;"><table>
    <thead><tr><th>Artist</th><th>Client</th><th>Date</th><th>Fee</th><th>ASP Cut</th><th>Charges</th><th>Payout</th><th>Status</th><th></th></tr></thead>
    <tbody>${payoutEligible.sort((a,b)=>b.date.localeCompare(a.date)).map(e=>{const a=artistById(e.artistId); const amt=artistPayout(e);
      return `<tr>
        <td data-label="Artist">${esc(a.name)}</td><td data-label="Client">${esc(e.clientName)}</td>
        <td data-label="Date" class="u-mono">${fmtDateShort(e.date)}</td>
        <td data-label="Fee" class="u-mono">${money(e.price)}</td><td data-label="ASP Cut" class="u-mono">${money(e.commission)}</td>
        <td data-label="Charges" class="u-mono">${money(chargesTotal(e))}</td><td data-label="Payout" class="u-mono"><strong>${money(amt)}</strong></td>
        <td data-label="Status"><span class="pill ${e.artistPaidOut?'pill-good':'pill-warn'}">${e.artistPaidOut? 'Paid Out':'Owed'}</span></td>
        <td data-label=""><button class="btn btn-sm ${e.artistPaidOut?'btn-ghost':'btn-primary'}" data-action="toggle-artist-paidout" data-id="${e.id}">${e.artistPaidOut? 'Unmark':'Mark Paid Out'}</button></td>
      </tr>`;}).join('')}
    </tbody></table></div>` : `<div class="card empty" style="margin-bottom:22px;">No completed gigs yet — payouts appear here once a client's balance is received.</div>`}

  <div class="card card-pad" style="margin-bottom:20px;">
    <div class="section-head"><h2>Monthly Gross Revenue</h2></div>
    <div class="fin-chart" style="display:flex;gap:14px;align-items:flex-end;height:120px;">
      ${monthlyGross.map(m=>`<div style="flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;justify-content:flex-end;">
        <span class="u-mono" style="font-size:11px;color:var(--ink-2);">${m.val?money(m.val):''}</span>
        <div style="width:100%;max-width:46px;height:${Math.max(4,(m.val/maxMonthly)*80)}px;background:var(--accent);border-radius:4px 4px 0 0;opacity:.85;"></div>
        <span class="u-label">${m.label}</span>
      </div>`).join('')}
    </div>
  </div>

  <div class="section-head"><h2>Per-Artist Trend</h2></div>
  <div class="grid grid-3" style="margin-bottom:22px;">
    ${ARTISTS.map(a=>{
      const ae = S.events.filter(e=>e.artistId===a.id && isConfirmed(e));
      const spark = sumByMonth(ae, months, e=>e.price);
      const total = spark.reduce((s,v)=>s+v,0);
      const mx = Math.max(...spark,1);
      return `<div class="card card-pad">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <span class="avatar" data-slot="${a.slot}" style="width:26px;height:26px;font-size:10px;">${esc(a.initials)}</span>
          <strong style="font-size:13px;">${esc(a.name)}</strong>
        </div>
        <div class="sparkbar">${spark.map(v=>`<b style="height:${Math.max(6,(v/mx)*100)}%;"></b>`).join('')}</div>
        <div class="u-mono" style="font-size:15px;font-weight:700;margin-top:6px;">${money(total)}</div>
        <span class="u-label">gross, last 6 mo</span>
      </div>`;
    }).join('')}
  </div>

  <div class="section-head"><h2>Custom Invoices (${CUSTOM_INVOICES.length})</h2><button class="btn btn-sm btn-primary" data-action="open-new-invoice">+ New Invoice</button></div>
  <div class="card table-cards" style="margin-bottom:22px;"><table>
    <thead><tr><th>Client</th><th>Items</th><th>Total</th><th>Date</th><th>Status</th><th></th></tr></thead>
    <tbody>${CUSTOM_INVOICES.length? CUSTOM_INVOICES.slice().sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).map(inv=>{
      const t = invoiceTotal(inv);
      const itemsSummary = inv.items.length===1? inv.items[0].label : `${inv.items[0].label} +${inv.items.length-1} more`;
      return `<tr class="row-link" data-action="view-invoice" data-id="${inv.id}">
        <td data-label="Client">${esc(inv.clientName)}</td><td data-label="Items">${esc(itemsSummary)}</td>
        <td data-label="Total" class="u-mono">${money(t)}</td><td data-label="Date" class="u-mono">${fmtDateShort(inv.createdAt)}</td>
        <td data-label="Status"><span class="pill ${inv.status==='paid'?'pill-good':'pill-warn'}">${inv.status==='paid'?'Paid':'Open'}</span></td>
        <td data-label="">${inv.status==='open'? `<button class="btn btn-sm" data-action="mark-invoice-paid" data-id="${inv.id}">Mark Paid</button>` : ''}</td></tr>`;
    }).join('') : `<tr><td colspan="6" style="text-align:center;color:var(--ink-3);padding:20px;">No custom invoices yet.</td></tr>`}
    </tbody></table></div>

  <div class="section-head"><h2>All Jobs (${booked.length})</h2><button class="btn btn-sm" data-action="export-csv">${ICO.leads} Export CSV</button></div>
  <div class="card table-cards"><table>
    <thead><tr><th>Artist</th><th>Client</th><th>Date</th><th>Price</th><th>Commission</th><th>Payout</th><th>Status</th></tr></thead>
    <tbody>${booked.sort((a,b)=>b.date.localeCompare(a.date)).map(e=>{const a=artistById(e.artistId); const sm=statusMeta(e);
      return `<tr class="row-link" data-action="open-event" data-id="${e.id}">
        <td data-label="Artist">${esc(a.name)}</td><td data-label="Client">${esc(e.clientName)}</td><td data-label="Date" class="u-mono">${fmtDateShort(e.date)}</td>
        <td data-label="Price" class="u-mono">${money(e.price)}</td><td data-label="Commission" class="u-mono">${money(e.commission)}</td><td data-label="Payout" class="u-mono">${money(artistPayout(e))}</td>
        <td data-label="Status"><span class="pill ${sm.cls}">${esc(sm.label)}</span></td></tr>`;}).join('')}
    </tbody></table></div>
  `;
}

/* ============ OUTSIDE BOOKINGS PAGE (own nav tab — office/bookkeeping only, not CEO) ============ */
function outsideBookingOpenReminders(b){ return (b.reminders||[]).filter(r=>!r.completedAt && (!r.snoozedUntil || r.snoozedUntil<=todayISO())); }
function renderOutsideBookingsPage(){
  return `
  <div class="grid" style="grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;">
    <div class="card stat-tile"><span class="u-label">Other Bookings Open</span><span class="val">${OUTSIDE_BOOKINGS.filter(b=>b.status==='open').length}</span><span class="sub">Not yet paid</span></div>
    <div class="card stat-tile"><span class="u-label">ASP Earned (External)</span><span class="val">${money(OUTSIDE_BOOKINGS.reduce((s,b)=>s+b.aspCut,0))}</span><span class="sub">Across ${OUTSIDE_BOOKINGS.length} event${OUTSIDE_BOOKINGS.length===1?'':'s'}</span></div>
  </div>

  <div class="section-head"><h2>Other Bookings (${OUTSIDE_BOOKINGS.length})</h2><button class="btn btn-sm btn-primary" data-action="open-new-outside-booking">+ New Other Booking</button></div>
  <p style="font-size:11.5px;color:var(--ink-3);margin:-8px 0 12px;">Jobs that don't involve one of our own roster artists — outside acts we coordinate or refer. Kept separate from ASP's own leads/calendar unless explicitly shown there.</p>
  <div class="card table-cards"><table>
    <thead><tr><th>Performer</th><th>Event</th><th>Client</th><th>Date</th><th>Total</th><th>ASP Cut</th><th>Payout</th><th>Reminders</th><th>Status</th><th></th></tr></thead>
    <tbody>${OUTSIDE_BOOKINGS.length? OUTSIDE_BOOKINGS.slice().sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).map(b=>{
      const openReminders = outsideBookingOpenReminders(b);
      return `<tr class="row-link" data-action="open-outside-booking-detail" data-id="${b.id}">
        <td data-label="Performer">${esc(b.performerName)}${b.showOnAspCalendar? ` <span class="pill pill-accent" title="Shown on ASP main calendar">ASP Cal</span>`:''}</td>
        <td data-label="Event">${esc(b.eventName)||'—'}</td>
        <td data-label="Client">${esc(b.clientName)}</td>
        <td data-label="Date" class="u-mono">${fmtDateShort(b.date)}</td><td data-label="Total" class="u-mono">${money(b.totalAmount)}</td>
        <td data-label="ASP Cut" class="u-mono">${money(b.aspCut)}</td><td data-label="Payout" class="u-mono">${money(outsideBookingPayout(b))}</td>
        <td data-label="Reminders">${openReminders.length? `<span class="pill pill-warn">${openReminders.length} due</span>` : `<span style="color:var(--ink-3);">—</span>`}</td>
        <td data-label="Status"><span class="pill ${b.status==='paid'?'pill-good':'pill-warn'}">${b.status==='paid'?'Paid':'Open'}</span></td>
        <td data-label="" style="display:flex;gap:6px;flex-wrap:wrap;">
          ${b.status==='open'? `<button class="btn btn-sm" data-action="mark-outside-booking-paid" data-id="${b.id}">Mark Paid</button>` : ''}
          <button class="btn btn-sm" data-action="open-outside-doc-builder" data-id="${b.id}">${DOCUMENTS.some(d=>d.subjectType==='outside'&&d.subjectId===b.id)?'Edit Document':'Document'}</button>
        </td>
      </tr>`;
    }).join('') : `<tr><td colspan="10" style="text-align:center;color:var(--ink-3);padding:20px;">No external events yet.</td></tr>`}
    </tbody></table></div>
  `;
}
function renderOutsideBookingTravelSection(b){
  return `<div class="card card-pad" style="display:flex;flex-direction:column;gap:10px;">
    <h3 style="font-size:13.5px;margin:0;">Travel</h3>
    <label style="display:flex;align-items:center;gap:8px;font-size:12.5px;"><input type="checkbox" data-outside-field="top.flightNeeded" ${b.flightNeeded?'checked':''}/> Flight needed</label>
    ${b.flightNeeded? `<div class="field-row">
      <div class="field"><label>Airline</label><input data-outside-field="flight.airline" value="${esc((b.flight&&b.flight.airline)||'')}"/></div>
      <div class="field"><label>Confirmation</label><input data-outside-field="flight.confirmation" value="${esc((b.flight&&b.flight.confirmation)||'')}"/></div>
    </div>` : ''}
    <label style="display:flex;align-items:center;gap:8px;font-size:12.5px;"><input type="checkbox" data-outside-field="top.groundTransportNeeded" ${b.groundTransportNeeded?'checked':''}/> Ground transport needed</label>
    ${b.groundTransportNeeded? `<div class="field-row">
      <div class="field"><label>Driver</label><input data-outside-field="groundTransport.driverName" value="${esc((b.groundTransport&&b.groundTransport.driverName)||'')}"/></div>
      <div class="field"><label>Phone</label><input data-outside-field="groundTransport.driverPhone" value="${esc((b.groundTransport&&b.groundTransport.driverPhone)||'')}"/></div>
    </div>` : ''}
    <label style="display:flex;align-items:center;gap:8px;font-size:12.5px;"><input type="checkbox" data-outside-field="top.hotelNeeded" ${b.hotelNeeded?'checked':''}/> Hotel needed</label>
    ${b.hotelNeeded? `<div class="field-row">
      <div class="field"><label>Hotel Name</label><input data-outside-field="hotel.name" value="${esc((b.hotel&&b.hotel.name)||'')}"/></div>
      <div class="field"><label>Confirmation</label><input data-outside-field="hotel.confirmation" value="${esc((b.hotel&&b.hotel.confirmation)||'')}"/></div>
    </div>` : ''}
  </div>`;
}
function renderOutsideBookingRemindersSection(b){
  return `<div class="card card-pad" style="display:flex;flex-direction:column;gap:10px;">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <h3 style="font-size:13.5px;margin:0;">Reminders</h3>
      <button class="btn btn-sm" data-action="add-outside-booking-reminder" data-id="${b.id}">${ICO.plus} Add Reminder</button>
    </div>
    ${b.reminders.length? b.reminders.map(r=>`<div style="display:flex;flex-direction:column;gap:6px;padding:8px;background:var(--surface-2);border-radius:8px;">
      <div class="field-row" style="align-items:flex-end;flex-wrap:wrap;">
        <div class="field"><label>Due</label><input type="date" data-outside-reminder-field="${r.id}.dueAt" value="${r.dueAt?r.dueAt.slice(0,10):''}"/></div>
        <div class="field"><label>Owner</label><input data-outside-reminder-field="${r.id}.owner" value="${esc(r.owner||'')}" placeholder="e.g. Rivky"/></div>
        <div class="field" style="width:120px;"><label>Repeat (days)</label><input type="number" data-outside-reminder-field="${r.id}.recurrenceDays" value="${r.recurrenceDays||''}" placeholder="one-time"/></div>
        <button class="icon-btn" data-action="remove-outside-booking-reminder" data-clause="${b.id}" data-id="${r.id}" title="Remove" style="flex:none;" aria-label="Remove">${ICO.trash}</button>
      </div>
      <input data-outside-reminder-field="${r.id}.notes" value="${esc(r.notes||'')}" placeholder="What's this reminder for?"/>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        ${r.completedAt? `<span class="pill pill-good">Completed ${fmtDateShort(r.completedAt.slice(0,10))}</span>` : `<button class="btn btn-sm" data-action="complete-outside-booking-reminder" data-clause="${b.id}" data-id="${r.id}">Mark Done</button><button class="btn btn-sm btn-ghost" data-action="snooze-outside-booking-reminder" data-clause="${b.id}" data-id="${r.id}">Snooze 3 days</button>`}
        ${r.snoozedUntil && !r.completedAt? `<span class="pill pill-neutral">Snoozed to ${fmtDateShort(r.snoozedUntil)}</span>` : ''}
      </div>
    </div>`).join('') : `<p style="font-size:12px;color:var(--ink-3);margin:0;">No reminders yet.</p>`}
  </div>`;
}
function renderOutsideBookingDetailSheet(){
  const b = getOutsideBooking(S.outsideBookingDetailId); if(!b) return '';
  return `<div class="overlay" data-action="outsidebookingdetail-overlay-close">
    <div class="sheet" data-stop>
      <div class="sheet-head">
        <div>
          <h2 style="font-size:1.2rem;margin-bottom:4px;">${esc(b.eventName||b.performerName)}</h2>
          <span class="pill pill-accent">Other Booking</span>
          <span class="pill ${b.status==='paid'?'pill-good':'pill-warn'}">${b.status==='paid'?'Paid':'Open'}</span>
        </div>
        <button class="icon-btn" data-action="close-outside-booking-detail" aria-label="Close">${ICO.x}</button>
      </div>
      <div class="sheet-body">
        <div class="field-row">
          <div class="field"><label>Performer</label><input data-outside-field="top.performerName" value="${esc(b.performerName||'')}"/></div>
          <div class="field"><label>Performer Contact</label><input data-outside-field="top.performerContact" value="${esc(b.performerContact||'')}"/></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Event Name</label><input data-outside-field="top.eventName" value="${esc(b.eventName||'')}"/></div>
          <div class="field"><label>Event Type</label><input data-outside-field="top.eventType" value="${esc(b.eventType||'')}" placeholder="e.g. Wedding, Corporate"/></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Date</label><input type="date" data-outside-field="top.date" value="${b.date||''}"/></div>
          <div class="field"><label>Start Time</label><input type="time" data-outside-field="top.startTime" value="${b.startTime||''}"/></div>
          <div class="field"><label>End Time</label><input type="time" data-outside-field="top.endTime" value="${b.endTime||''}"/></div>
        </div>
        <div class="field"><label>Timezone</label><input data-outside-field="top.timezone" value="${esc(b.timezone||'')}"/></div>
        <div class="field-row">
          <div class="field"><label>Venue</label><input data-outside-field="top.venue" value="${esc(b.venue||'')}"/></div>
          <div class="field"><label>Full Address</label><input data-outside-field="top.address" value="${esc(b.address||'')}"/></div>
        </div>
        <div class="field-row">
          <div class="field"><label>City</label><input data-outside-field="top.city" value="${esc(b.city||'')}"/></div>
          <div class="field"><label>State</label><input data-outside-field="top.state" value="${esc(b.state||'')}"/></div>
        </div>
        ${hasLocation(b)? `<div style="display:flex;gap:14px;margin:-6px 0 4px;">
          <a href="${gmapsUrl(b)}" target="_blank" rel="noopener" style="font-size:12px;font-weight:700;color:var(--accent);text-decoration:none;">Maps</a>
          <a href="${wazeUrl(b)}" target="_blank" rel="noopener" style="font-size:12px;font-weight:700;color:var(--accent);text-decoration:none;">Waze</a>
        </div>` : ''}
        <div class="field-row">
          <div class="field"><label>Client Name</label><input data-outside-field="top.clientName" value="${esc(b.clientName||'')}"/></div>
          <div class="field"><label>Client Email</label><input data-outside-field="top.clientEmail" value="${esc(b.clientEmail||'')}"/></div>
        </div>
        <div class="field"><label>Client Phone</label><input data-outside-field="top.clientPhone" value="${esc(b.clientPhone||'')}"/></div>
        <div class="field-row">
          <div class="field"><label>Total Amount</label><input type="number" data-outside-field="top.totalAmount" value="${b.totalAmount||0}"/></div>
          <div class="field"><label>ASP Cut</label><input type="number" data-outside-field="top.aspCut" value="${b.aspCut||0}"/></div>
        </div>
        <div class="field"><label>Source</label><input data-outside-field="top.source" value="${esc(b.source||'')}" placeholder="e.g. referral, direct inquiry"/></div>
        <label style="display:flex;align-items:center;gap:8px;font-size:12.5px;"><input type="checkbox" data-outside-field="top.showOnAspCalendar" ${b.showOnAspCalendar?'checked':''}/> Show on ASP main calendar</label>
        <div class="field"><label>Notes</label><textarea data-outside-field="top.notes" rows="2" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--border-strong);background:var(--surface);font-size:12.5px;font-family:var(--font-body);color:var(--ink);">${esc(b.notes||'')}</textarea></div>

        ${renderOutsideBookingTravelSection(b)}
        ${renderOutsideBookingRemindersSection(b)}

        <div style="display:flex;gap:8px;">
          ${b.status==='open'? `<button class="btn btn-sm" data-action="mark-outside-booking-paid" data-id="${b.id}">Mark Paid</button>` : ''}
          <button class="btn btn-sm" data-action="open-outside-doc-builder" data-id="${b.id}">${DOCUMENTS.some(d=>d.subjectType==='outside'&&d.subjectId===b.id)?'Edit Document':'Document'}</button>
          <button class="btn btn-sm btn-primary btn-block" data-action="close-outside-booking-detail">Done</button>
        </div>
      </div>
    </div>
  </div>`;
}

/* ============ DOCUMENTS PAGE (general doc builder hub — office/bookkeeping only, not CEO) ============ */
function renderDocumentsPage(){
  return `
  <div class="section-head"><h2>Documents (${DOCUMENTS.length})</h2><button class="btn btn-sm btn-primary" data-action="open-new-document">${ICO.plus} New Document</button></div>
  <p style="font-size:11.5px;color:var(--ink-3);margin:-8px 0 12px;">Contracts, proposals, riders — for one of our own artists, an outside act, or general use. ASP letterhead and signature throughout (or SING Entertainment's, when that's the signing party).</p>
  ${DOCUMENTS.length? `<div class="card table-cards"><table>
    <thead><tr><th>Title</th><th>For</th><th>Letterhead</th><th>Date</th><th>Status</th></tr></thead>
    <tbody>${DOCUMENTS.slice().sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).map(d=>{
      return `<tr class="row-link" data-action="open-document" data-id="${d.id}">
        <td data-label="Title">${esc(d.title)}</td>
        <td data-label="For">${esc(documentSubjectLabel(d))}</td>
        <td data-label="Letterhead">${esc(getBrandConfig(d.brand).label)}</td>
        <td data-label="Date" class="u-mono">${fmtDateShort(d.createdAt)}</td>
        <td data-label="Status"><span class="pill ${d.signedAt?'pill-good':'pill-neutral'}">${d.signedAt?'Signed':'Draft'}</span></td>
      </tr>`;
    }).join('')}
    </tbody></table></div>` : `<div class="card empty">No documents yet.</div>`}
  `;
}

/* ============ CONTRACTS (searchable) ============ */
// One contract system (2026-10-09 audit 2.11): the Contract Builder's records (CONTRACTS) are the
// contracts. This page is the read-first index of them -- a row opens the real contract document,
// exactly what was (or will be) sent. The old per-booking document generated straight from the gig
// (its own terms, "booking fee" = deposit, a hardcoded overtime line) is gone. Bookings that are
// contracted but have no contract record yet are listed underneath so none drops off the index.
function contractedEvents(){
  return S.events.filter(e=>!e.unpaid && ['contract_sent','booked','paid'].includes(e.status));
}
function renderContractsPage(){
  const q = (S.contractSearchQuery||'').trim().toLowerCase();
  const matches = (...texts)=>!q || texts.some(t=>String(t||'').toLowerCase().includes(q));
  const live = CONTRACTS.filter(c=>c.status!=='void')
    .filter(c=>matches(c.snapshot.clientName, contractPerformerName(c)))
    .sort((a,b)=>String(b.snapshot.eventDate||'').localeCompare(String(a.snapshot.eventDate||'')));
  const withContract = new Set(CONTRACTS.map(c=>c.leadId));
  const missing = contractedEvents().filter(e=>!withContract.has(e.id))
    .filter(e=>matches(e.clientName, (artistById(e.artistId)||{}).name))
    .sort((a,b)=>b.date.localeCompare(a.date));
  return `
  <div class="section-head"><h2>Contracts (${live.length})</h2></div>
  <p style="font-size:11.5px;color:var(--ink-3);margin:-8px 0 12px;">Every contract, searchable by client or artist. Open one to see the exact document; edit it from the gig or the Contract Builder.</p>
  <div class="field" style="max-width:340px;margin-bottom:14px;">
    <input id="contractSearchInput" value="${esc(S.contractSearchQuery||'')}" placeholder="Search client or artist..."/>
  </div>
  ${live.length? `<div class="card table-cards"><table>
    <thead><tr><th>Client</th><th>Artist</th><th>Template</th><th>Event Date</th><th>Status</th></tr></thead>
    <tbody>${live.map(c=>`<tr class="row-link" data-action="open-contract-doc" data-id="${esc(c.id)}">
        <td data-label="Client">${esc(c.snapshot.clientName)||'—'}</td>
        <td data-label="Artist">${esc(contractPerformerName(c))}</td>
        <td data-label="Template">${esc(contractTemplateLabel(c.template))}</td>
        <td data-label="Event Date" class="u-mono">${c.snapshot.eventDate? fmtDateShort(c.snapshot.eventDate) : '—'}</td>
        <td data-label="Status"><span class="pill ${contractStatusPillClass(c.status)}">${esc(contractStatusLabel(c.status))}</span></td>
      </tr>`).join('')}
    </tbody></table></div>` : `<div class="card empty">${q? 'No contracts match that search.' : 'No contracts yet — create one from a gig.'}</div>`}
  ${missing.length? `
  <div class="section-head" style="margin-top:26px;"><h2>Booked Without a Contract (${missing.length})</h2></div>
  <p style="font-size:11.5px;color:var(--ink-3);margin:-8px 0 12px;">Contracted or booked gigs with no contract record in the app (e.g. imported, or signed outside it).</p>
  <div class="card table-cards"><table>
    <thead><tr><th>Client</th><th>Artist</th><th>Date</th><th>Contract</th></tr></thead>
    <tbody>${missing.map(e=>`<tr class="row-link" data-action="open-event" data-id="${esc(e.id)}">
        <td data-label="Client">${esc(e.clientName||e.type)}</td>
        <td data-label="Artist">${esc((artistById(e.artistId)||{}).name||'—')}</td>
        <td data-label="Date" class="u-mono">${fmtDateShort(e.date)}</td>
        <td data-label="Contract"><button class="btn btn-sm" data-action="create-contract" data-id="${esc(e.id)}">${ICO.plus} Create Contract</button></td>
      </tr>`).join('')}
    </tbody></table></div>` : ''}
  `;
}

/* ============ PROJECTS ============ */
function renderProjectFolderCard(p, opts={}){
  // artistById(p.artistId) is legitimately undefined for a general/non-gig project (PR 14 --
  // projects no longer require a fake artist pick), so every a.* read below has to tolerate that.
  const a = artistById(p.artistId);
  const isAdmin = isAdminUser(S.user);
  const overdue = p.dueDate && isPast(p.dueDate);
  const coverStyle = p.coverImage? `background-image:url('${safeDataUrl(p.coverImage)}');` : `background:var(--cat-${a?.slot||1});`;
  return `<div class="project-folder" data-action="open-project" data-id="${p.id}">
    <div class="project-folder-cover" style="${coverStyle}">
      ${!p.coverImage? `<span class="project-folder-cover-fallback">${esc((p.title||'?').trim().slice(0,1).toUpperCase())}</span>`:''}
      ${isAdmin? `<label class="project-folder-cover-upload" data-action="upload-project-cover" data-id="${p.id}" title="Set cover image">
        ${ICO.image}
        <input type="file" accept="image/*" data-action="upload-project-cover" data-id="${p.id}" style="display:none;"/>
      </label>` : ''}
      ${p.coverImage && isAdmin? `<button class="icon-btn project-folder-cover-remove" data-action="remove-project-cover" data-id="${p.id}" title="Remove cover" style="width:24px;height:24px;" aria-label="Remove cover">${ICO.x}</button>`:''}
    </div>
    <div class="project-folder-body">
      ${opts.showArtist? `<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;"><span class="avatar" data-slot="${a?a.slot:0}" style="width:18px;height:18px;font-size:8px;">${a?esc(a.initials):'—'}</span><span style="font-size:11px;color:var(--ink-2);">${a?esc(a.name):'General'}</span></div>`:''}
      <strong style="font-family:var(--font-display);font-size:14px;display:block;">${esc(p.title)}</strong>
      ${p.subtitle? `<div style="font-size:11.5px;color:var(--ink-2);margin-top:2px;">${esc(p.subtitle)}</div>`:''}
      ${p.dueDate? `<div style="display:flex;align-items:center;gap:6px;margin-top:8px;flex-wrap:wrap;">
        <span class="pill ${overdue?'pill-crit':'pill-neutral'}">${overdue?'Overdue · ':''}${fmtDateShort(p.dueDate)}</span>
      </div>`:''}
    </div>
  </div>`;
}
function renderProjectsBoard(){
  const isAdmin = isAdminUser(S.user);
  const artistFilter = S.projectArtistFilter||'all';
  const projects = artistFilter==='all' ? PROJECTS : PROJECTS.filter(p=>p.artistId===artistFilter);
  return `
  ${renderArtistFilterRow(artistFilter, 'filter-project-artist', {avatar:true})}
  <div class="section-head">
    <h2>${artistFilter==='all'? 'All Projects' : esc(artistById(artistFilter).name)+`’s Projects`} (${projects.length})</h2>
    <div style="display:flex;gap:6px;">
      ${isAdmin? `<button class="btn btn-sm btn-primary" data-action="open-new-project">${ICO.plus} New Project</button>`:''}
    </div>
  </div>
  ${projects.length? `<div class="grid grid-folders">${projects.map(p=>renderProjectFolderCard(p, {showArtist: artistFilter==='all'})).join('')}</div>`
    : `<div class="card empty">No projects ${artistFilter==='all'?'yet':'for '+esc(artistById(artistFilter).name)+' yet'}.</div>`}
  `;
}
function renderArtistProjects(artistId){
  const projects = PROJECTS.filter(p=>p.artistId===artistId);
  return `
    <div class="section-head"><h2>My Projects (${projects.length})</h2></div>
    ${projects.length? `<div class="grid grid-folders">${projects.map(p=>renderProjectFolderCard(p)).join('')}</div>` : `<div class="card empty">No projects yet.</div>`}
  `;
}
function personInitials(name){
  return (name||'?').trim().split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase() || '?';
}
function renderPersonAvatar(person, size){
  size = size||16;
  const artist = person.kind==='internal' ? artistById(person.refId) : null;
  if(artist) return `<span class="avatar" data-slot="${artist.slot}" style="width:${size}px;height:${size}px;font-size:${Math.round(size*0.44)}px;flex:none;">${esc(artist.initials)}</span>`;
  return `<span class="avatar" style="width:${size}px;height:${size}px;font-size:${Math.round(size*0.44)}px;flex:none;background:var(--ink);color:var(--page);">${esc(personInitials(person.name))}</span>`;
}
function renderAssigneeChip(p, personId){
  const person = personId ? (p.people||[]).find(x=>x.id===personId) : null;
  if(!person) return `<span style="font-size:11px;color:var(--ink-3);">Unassigned</span>`;
  const isMe = person.kind==='internal' && isMeRef(person.refId);
  return `<span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;${isMe?'font-weight:700;color:var(--accent-ink);':'color:var(--ink-2);'}">${renderPersonAvatar(person,16)}${isMe?'You':esc(person.name)}</span>`;
}
function renderTaskAssigneeSelect(p, t){
  return `<select class="task-assignee-select" data-id="${p.id}" data-taskid="${t.id}" style="font-size:11px;padding:3px 5px;border-radius:6px;border:1px solid var(--border-strong);background:var(--surface);max-width:120px;color:var(--ink);">
    <option value="">Unassigned</option>
    ${(p.people||[]).map(person=>`<option value="${person.id}" ${t.assignedTo===person.id?'selected':''}>${esc(person.name)}</option>`).join('')}
  </select>`;
}
function taskAssigneeCounts(p){
  const counts = {};
  (p.tasks||[]).filter(t=>!t.done).forEach(t=>{
    const key = t.assignedTo || '__unassigned';
    counts[key] = (counts[key]||0)+1;
  });
  return counts;
}
function renderWaitingOnStrip(p){
  const counts = taskAssigneeCounts(p);
  const entries = Object.entries(counts);
  if(!entries.length) return '';
  const chips = entries.map(([key,n])=>{
    if(key==='__unassigned') return `<button class="filter-chip ${S.taskAssigneeFilter==='__unassigned'?'sel':''}" data-action="filter-tasks-by-assignee" data-pid="__unassigned">Unassigned (${n})</button>`;
    const person = (p.people||[]).find(x=>x.id===key);
    if(!person) return '';
    const isMe = person.kind==='internal' && isMeRef(person.refId);
    return `<button class="filter-chip ${S.taskAssigneeFilter===key?'sel':''}" data-action="filter-tasks-by-assignee" data-pid="${key}">${isMe?'You':esc(person.name)} (${n})</button>`;
  }).join('');
  return `<div style="display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-bottom:12px;">
    <span class="u-label" style="margin-right:2px;">Waiting on</span>${chips}
    ${S.taskAssigneeFilter? `<button class="filter-chip" data-action="filter-tasks-by-assignee" data-pid="">Show all</button>`:''}
  </div>`;
}
function renderBoardCard(pid, c){
  const isAdmin = isAdminUser(S.user);
  const items = c.items||[];
  return `<div class="sticky-card" style="--card-accent:${boardCardColor(c.header)}">
    <div class="sticky-card-head">
      <input class="blend-input" data-action="set-board-card-header" data-id="${pid}" data-cardid="${c.id}" value="${esc(c.header)}" placeholder="Card title…" ${isAdmin?'':'readonly'}/>
      ${isAdmin? `<button class="icon-btn" data-action="remove-board-card" data-id="${pid}" data-cardid="${c.id}" title="Remove card" style="width:24px;height:24px;flex:none;" aria-label="Remove card">${ICO.x}</button>`:''}
    </div>
    <div class="sticky-card-items">
      ${items.length? items.map(it=>`<div class="sticky-card-item">
        <span>${esc(it.text)}</span>
        ${isAdmin? `<button data-action="remove-board-item" data-id="${pid}" data-cardid="${c.id}" data-itemid="${it.id}" title="Remove">${ICO.x}</button>`:''}
      </div>`).join('') : `<p class="sticky-card-empty">Nothing yet.</p>`}
    </div>
    ${isAdmin? `<div style="display:flex;gap:6px;margin-top:8px;">
      <input class="board-item-input" data-cardid="${c.id}" data-projectid="${pid}" placeholder="Type here…" style="flex:1;min-width:0;padding:6px 8px;border-radius:6px;border:1px solid var(--border-strong);background:var(--surface);font-size:12px;" value="${esc((S.newBoardItemText||{})[c.id]||'')}"/>
      <button class="icon-btn" data-action="add-board-item" data-id="${pid}" data-cardid="${c.id}" style="width:28px;height:28px;flex:none;" aria-label="Add item">${ICO.plus}</button>
    </div>` : ''}
  </div>`;
}
function renderProjectDetail(){
  const p = getProject(S.projectId); if(!p) return `<div class="card empty">Project not found. <a href="#" data-action="nav" data-view="${isAdminUser(S.user)?'projects':'a_projects'}" style="color:var(--accent);">Back to Projects</a></div>`;
  const a = artistById(p.artistId);
  const isAdmin = isAdminUser(S.user);
  const fin = projectFinancials(p);
  const recordingSiblings = p.recordingEventId ? PROJECTS.filter(x=>x.recordingEventId===p.recordingEventId && x.id!==p.id) : [];
  const recordingEvent = p.recordingEventId ? getEvent(p.recordingEventId) : null;
  const backView = isAdmin ? 'projects' : 'a_projects';

  return `
    <button class="icon-btn" data-action="nav" data-view="${backView}" title="Back to Projects" style="margin-bottom:14px;" aria-label="Back to Projects">${ICO.chev('l')}</button>
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
      <span class="avatar" data-slot="${a?a.slot:0}" style="width:44px;height:44px;flex:none;">${a?esc(a.initials):'—'}</span>
      <div style="min-width:0;flex:1;">
      ${isAdmin? `<input class="blend-input" data-action="set-project-title" data-id="${p.id}" value="${esc(p.title)}" placeholder="Project name…" style="font-family:var(--font-display);font-size:1.3rem;font-weight:600;padding:0;"/>`
        : `<strong style="font-family:var(--font-display);font-size:1.3rem;display:block;">${esc(p.title)}</strong>`}
      <span class="pill pill-accent">${a?esc(a.name):'General'}</span></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:18px;">
        <div class="card card-pad">
          <div class="u-label" style="margin-bottom:10px;">Project Info</div>
          <div style="display:flex;flex-direction:column;gap:10px;font-size:12.5px;">
            <div style="display:flex;justify-content:space-between;align-items:center;"><span style="color:var(--ink-2);">Artist</span>
              ${a? `<span style="display:flex;align-items:center;gap:6px;font-weight:600;${isAdmin?'cursor:pointer;':''}" ${isAdmin?`data-action="open-artist" data-id="${a.id}"`:''}><span class="avatar" data-slot="${a.slot}" style="width:20px;height:20px;font-size:8px;">${esc(a.initials)}</span>${esc(a.name)}</span>`
                : `<span style="color:var(--ink-3);">None — general project</span>`}</div>
            <div style="display:flex;justify-content:space-between;align-items:center;"><span style="color:var(--ink-2);">Who it's for</span>
              ${isAdmin? `<input data-action="set-project-subtitle" data-id="${p.id}" value="${esc(p.subtitle||'')}" placeholder="e.g. client / label" style="padding:5px 8px;border-radius:6px;border:1px solid var(--border-strong);background:var(--surface);font-size:12.5px;text-align:right;max-width:160px;"/>`
                : (p.subtitle? `<span>${esc(p.subtitle)}</span>` : `<span style="color:var(--ink-3);">Not set</span>`)}
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;"><span style="color:var(--ink-2);">Target Date</span>
              ${isAdmin? `<input type="date" data-action="set-project-due" data-id="${p.id}" value="${p.dueDate||''}" style="padding:5px 8px;border-radius:6px;border:1px solid var(--border-strong);background:var(--surface);font-size:12.5px;"/>`
                : (p.dueDate? `<span style="color:${isPast(p.dueDate)?'var(--crit)':'var(--ink-2)'};">${fmtDateShort(p.dueDate)}</span>` : `<span style="color:var(--ink-3);">Not set</span>`)}
            </div>
            ${recordingEvent? `<div style="display:flex;justify-content:space-between;align-items:center;"><span style="color:var(--ink-2);">Recording Day</span>
              <span style="cursor:pointer;color:var(--accent);text-decoration:underline;" data-action="open-event" data-id="${recordingEvent.id}">${fmtDateShort(recordingEvent.date)}${recordingSiblings.length? ` · +${recordingSiblings.length} other episode${recordingSiblings.length===1?'':'s'}` : ''}</span></div>` : ''}
          </div>

          <div style="margin-top:16px;">
            <div class="u-label" style="margin-bottom:8px;">Who's Involved</div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:${isAdmin?'10px':'0'};">
              ${(p.people||[]).length? p.people.map(person=>`<span class="pill pill-neutral" style="display:inline-flex;align-items:center;gap:6px;">${renderPersonAvatar(person,15)}${esc(person.role)}: ${esc(person.name)}${isAdmin?`<button data-action="remove-person" data-id="${p.id}" data-pid="${person.id}" aria-label="Remove ${esc(person.name)}" style="border:none;background:none;cursor:pointer;color:var(--ink-3);padding:0;display:flex;">${ICO.x}</button>`:''}</span>`).join('') : `<span style="font-size:12px;color:var(--ink-3);">Nobody added yet.</span>`}
            </div>
            ${isAdmin? `
            <div class="chip-row" style="margin-bottom:8px;">
              <button class="filter-chip ${(S.newPersonForm.kind||'internal')==='internal'?'sel':''}" data-action="set-person-kind" data-kind="internal">Internal</button>
              <button class="filter-chip ${S.newPersonForm.kind==='external'?'sel':''}" data-action="set-person-kind" data-kind="external">External</button>
            </div>
            ${(S.newPersonForm.kind||'internal')==='internal' ? `
            <div data-form="person" style="display:flex;gap:6px;flex-wrap:wrap;">
              <select class="person-refid-select" style="flex:1;min-width:140px;padding:7px 9px;border-radius:6px;border:1px solid var(--border-strong);background:var(--surface);font-size:12px;color:var(--ink);">
                <option value="">Pick a person…</option>
                <optgroup label="ASP Office">${ADMIN_USERS.map(u=>`<option value="${u.id}" ${S.newPersonForm.refId===u.id?'selected':''}>${esc(u.name)}</option>`).join('')}</optgroup>
                <optgroup label="Artists">${ARTISTS.map(a=>`<option value="${a.id}" ${S.newPersonForm.refId===a.id?'selected':''}>${esc(a.name)}</option>`).join('')}</optgroup>
              </select>
              <input data-field="role" placeholder="Role (e.g. Point of Contact)" style="flex:1;min-width:110px;padding:7px 9px;border-radius:6px;border:1px solid var(--border-strong);background:var(--surface);font-size:12px;" value="${esc(S.newPersonForm.role||'')}"/>
              <button class="btn btn-sm" data-action="add-person" data-id="${p.id}">Add</button>
            </div>
            ` : `
            <div data-form="person" style="display:flex;gap:6px;flex-wrap:wrap;">
              <input data-field="name" placeholder="Name" style="flex:1;min-width:100px;padding:7px 9px;border-radius:6px;border:1px solid var(--border-strong);background:var(--surface);font-size:12px;" value="${esc(S.newPersonForm.name||'')}"/>
              <input data-field="email" placeholder="Email (optional)" style="flex:1;min-width:130px;padding:7px 9px;border-radius:6px;border:1px solid var(--border-strong);background:var(--surface);font-size:12px;" value="${esc(S.newPersonForm.email||'')}"/>
              <input data-field="role" placeholder="Role (e.g. Guest)" style="flex:1;min-width:90px;padding:7px 9px;border-radius:6px;border:1px solid var(--border-strong);background:var(--surface);font-size:12px;" value="${esc(S.newPersonForm.role||'')}"/>
              <button class="btn btn-sm" data-action="add-person" data-id="${p.id}">Add</button>
            </div>
            `}
            ` : ''}
          </div>
        </div>

        <div class="card card-pad">
          <div class="section-head" style="margin-bottom:12px;"><h2 style="font-size:1rem;">Board</h2></div>
          ${(p.boardCards||[]).length? `<div class="sticky-board">${p.boardCards.map(c=>renderBoardCard(p.id,c)).join('')}</div>` : `<p style="font-size:12.5px;color:var(--ink-3);margin:0;">No cards yet — add one below.</p>`}
          ${isAdmin? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:12px;">
            ${['Contacts','Musicians','Venue','Notes'].map(h=>`<button class="filter-chip" data-action="add-board-card" data-id="${p.id}" data-preset="${esc(h)}">${ICO.plus} ${esc(h)}</button>`).join('')}
            <button class="btn btn-sm" data-action="add-board-card" data-id="${p.id}">${ICO.plus} Blank Card</button>
          </div>` : ''}
        </div>

        <div>
          <div class="tabbar tabbar-row" style="margin-bottom:14px;">
            <a href="#" class="tab ${S.projectTab==='tasks'?'active':''}" data-action="set-project-tab" data-tab="tasks">Tasks</a>
            <a href="#" class="tab ${S.projectTab==='conversation'?'active':''}" data-action="set-project-tab" data-tab="conversation">Conversation</a>
            <a href="#" class="tab ${S.projectTab==='media'?'active':''}" data-action="set-project-tab" data-tab="media">Media</a>
            <a href="#" class="tab ${S.projectTab==='financials'?'active':''}" data-action="set-project-tab" data-tab="financials">Financials</a>
            <a href="#" class="tab ${S.projectTab==='activity'?'active':''}" data-action="set-project-tab" data-tab="activity">Activity</a>
          </div>
          <select class="tab-select" data-action="set-project-tab-select">
            <option value="tasks" ${S.projectTab==='tasks'?'selected':''}>Tasks</option>
            <option value="conversation" ${S.projectTab==='conversation'?'selected':''}>Conversation</option>
            <option value="media" ${S.projectTab==='media'?'selected':''}>Media</option>
            <option value="financials" ${S.projectTab==='financials'?'selected':''}>Financials</option>
            <option value="activity" ${S.projectTab==='activity'?'selected':''}>Activity</option>
          </select>

          ${S.projectTab==='tasks' ? `
          ${renderWaitingOnStrip(p)}
          <div class="log">
            ${p.tasks.filter(t=> !S.taskAssigneeFilter || (S.taskAssigneeFilter==='__unassigned'? !t.assignedTo : t.assignedTo===S.taskAssigneeFilter)).map(t=>{
              const assignedPerson = t.assignedTo ? (p.people||[]).find(x=>x.id===t.assignedTo) : null;
              const isMine = assignedPerson && assignedPerson.kind==='internal' && isMeRef(assignedPerson.refId);
              return `<div class="log-item" style="align-items:center;flex-wrap:wrap;gap:8px;${isMine&&!t.done?'background:var(--accent-wash);border-radius:8px;':''}">
              <input type="checkbox" ${t.done?'checked':''} data-action="toggle-task" data-id="${p.id}" data-taskid="${t.id}" style="width:16px;height:16px;flex:none;"/>
              <span style="flex:1;min-width:120px;${t.done?'text-decoration:line-through;color:var(--ink-3);':''}">${esc(t.text)}</span>
              ${isAdmin? renderTaskAssigneeSelect(p,t) : renderAssigneeChip(p, t.assignedTo)}
              ${isAdmin?`<button class="icon-btn" data-action="remove-task" data-id="${p.id}" data-taskid="${t.id}" style="width:24px;height:24px;" aria-label="Remove task">${ICO.x}</button>`:''}
            </div>`;
            }).join('') || `<p style="font-size:12.5px;color:var(--ink-3);margin:0;">${S.taskAssigneeFilter? 'No tasks match this filter.' : 'No tasks yet.'}</p>`}
          </div>
          ${isAdmin? `<div data-form="task" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;">
            <input data-field="newTaskText" placeholder="Add a task…" style="flex:1;min-width:140px;padding:8px 10px;border-radius:6px;border:1px solid var(--border-strong);background:var(--surface);" value="${esc(S.newTaskText||'')}"/>
            <select class="new-task-assignee-select" style="padding:8px 10px;border-radius:6px;border:1px solid var(--border-strong);background:var(--surface);font-size:12.5px;color:var(--ink);">
              <option value="">Unassigned</option>
              ${(p.people||[]).map(person=>`<option value="${person.id}" ${S.newTaskAssignee===person.id?'selected':''}>${esc(person.name)}</option>`).join('')}
            </select>
            <button class="btn btn-sm" data-action="add-task" data-id="${p.id}">Add</button>
          </div>`:''}
          <p style="font-size:11.5px;color:var(--ink-3);margin:10px 0 0;">Checking off a task doesn't capture details — post the actual decision (which cities, which venue, etc.) in Conversation.</p>
          ` : ''}

          ${S.projectTab==='conversation' ? `
          <div class="log">
            ${(p.comments||[]).length? (p.comments||[]).map(c=>{const author = isAdminUser(c.authorId)? (adminById(c.authorId)?.name||'Office') : (artistById(c.authorId)?.name||'Artist');
              return `<div class="log-item"><span class="log-ico">${ICO.bell}</span>
              <span><div><strong>${esc(author)}:</strong> ${esc(c.text)}</div><div class="log-time">${new Date(c.ts).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</div></span></div>`;
            }).join('') : `<p style="font-size:12.5px;color:var(--ink-3);margin:0;">No messages yet — this is where decisions and details (like which cities got picked) get logged.</p>`}
          </div>
          <div data-form="comment" style="display:flex;gap:6px;margin-top:10px;">
            <input data-field="newCommentText" placeholder="Post an update or decision…" style="flex:1;padding:8px 10px;border-radius:6px;border:1px solid var(--border-strong);background:var(--surface);" value="${esc(S.newCommentText||'')}"/>
            <button class="btn btn-sm" data-action="add-comment" data-id="${p.id}">Post</button>
          </div>
          ` : ''}

          ${S.projectTab==='media' ? `
          <div class="u-label" style="margin-bottom:8px;">Images</div>
          <label style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:22px 12px;border:1.5px dashed var(--border-strong);border-radius:var(--r-md);cursor:pointer;margin-bottom:14px;color:var(--ink-2);">
            ${ICO.plus}<strong style="font-size:13px;">Upload Image</strong><span style="font-size:11px;color:var(--ink-3);">Reference photos, cover art drafts, etc.</span>
            <input type="file" accept="image/*" data-action="upload-project-image" data-id="${p.id}" multiple style="display:none;"/>
          </label>
          ${p.images.length? `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:20px;">
            ${p.images.map(img=>`<div style="position:relative;">
              <a href="${safeDataUrl(img.dataUrl)}" target="_blank" rel="noopener" style="display:block;aspect-ratio:1;border-radius:8px;overflow:hidden;border:1px solid var(--border);"><img src="${safeDataUrl(img.dataUrl)}" alt="${esc(img.name)}" style="width:100%;height:100%;object-fit:cover;"/></a>
              <button class="icon-btn" data-action="remove-project-image" data-id="${p.id}" data-imgid="${img.id}" style="position:absolute;top:2px;right:2px;background:rgba(0,0,0,.55);color:#fff;width:22px;height:22px;" aria-label="Remove image">${ICO.x}</button>
            </div>`).join('')}
          </div>` : `<p style="font-size:12.5px;color:var(--ink-3);margin:0 0 20px;">No images yet.</p>`}

          <div class="u-label" style="margin-bottom:8px;">Video Links</div>
          <div class="log" style="margin-bottom:10px;">
            ${p.links.length? p.links.map(l=>`<div class="log-item" style="align-items:center;">
              <span class="log-ico">${ICO.share}</span>
              <a href="${esc(safeWebUrl(l.url) || '#')}" target="_blank" rel="noopener" style="flex:1;color:var(--accent);text-decoration:none;font-size:12.5px;word-break:break-all;">${esc(l.label||l.url)}</a>
              <button class="icon-btn" data-action="remove-project-link" data-id="${p.id}" data-linkid="${l.id}" style="width:24px;height:24px;" aria-label="Remove project link">${ICO.x}</button>
            </div>`).join('') : `<p style="font-size:12.5px;color:var(--ink-3);margin:0;">No links yet.</p>`}
          </div>
          <div data-form="projectlink" style="display:flex;gap:6px;flex-wrap:wrap;">
            <input data-field="label" placeholder="Label (optional)" style="flex:1;min-width:100px;padding:8px 10px;border-radius:6px;border:1px solid var(--border-strong);background:var(--surface);" value="${esc(S.newLinkForm.label||'')}"/>
            <input data-field="url" placeholder="https://…" style="flex:2;min-width:140px;padding:8px 10px;border-radius:6px;border:1px solid var(--border-strong);background:var(--surface);" value="${esc(S.newLinkForm.url||'')}"/>
            <button class="btn btn-sm" data-action="add-project-link" data-id="${p.id}">Add</button>
          </div>
          ` : ''}

          ${S.projectTab==='financials' ? `
          <div class="card card-pad" style="margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;font-size:13px;"><span>Income</span><strong style="color:var(--good);">${money(fin.income)}</strong></div>
            <div style="display:flex;justify-content:space-between;font-size:13px;margin-top:6px;"><span>Expenses</span><strong style="color:var(--crit);">${money(fin.expenses)}</strong></div>
            <div style="height:1px;background:var(--border);margin:10px 0;"></div>
            <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:700;"><span>Net</span><span style="color:${fin.net>=0?'var(--good)':'var(--crit)'};">${money(fin.net)}</span></div>
          </div>

          <div class="u-label" style="margin-bottom:8px;">Income</div>
          <div class="log" style="margin-bottom:10px;">
            ${(p.financials.income||[]).length? p.financials.income.map(i=>`<div class="log-item" style="align-items:center;">
              <span style="flex:1;font-size:12.5px;">${esc(i.label)}</span><strong style="font-size:12.5px;">${money(i.amount)}</strong>
              ${isAdmin?`<button class="icon-btn" data-action="remove-fin-item" data-id="${p.id}" data-kind="income" data-itemid="${i.id}" style="width:22px;height:22px;" aria-label="Remove fin item">${ICO.x}</button>`:''}
            </div>`).join('') : `<p style="font-size:12px;color:var(--ink-3);margin:0;">No income logged.</p>`}
          </div>
          ${isAdmin? `<div data-form="finincome" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:20px;">
            <input data-field="newFinIncomeLabel" placeholder="e.g. Sponsor — Continental Ballroom" style="flex:2;min-width:140px;padding:8px 10px;border-radius:6px;border:1px solid var(--border-strong);background:var(--surface);" value="${esc(S.newFinIncomeLabel||'')}"/>
            <input data-field="newFinIncomeAmount" type="number" placeholder="Amount" style="flex:1;min-width:80px;padding:8px 10px;border-radius:6px;border:1px solid var(--border-strong);background:var(--surface);" value="${esc(S.newFinIncomeAmount||'')}"/>
            <button class="btn btn-sm" data-action="add-fin-item" data-id="${p.id}" data-kind="income">Add</button>
          </div>`:''}

          <div class="u-label" style="margin-bottom:8px;">Expenses</div>
          <div class="log" style="margin-bottom:10px;">
            ${(p.financials.expenses||[]).length? p.financials.expenses.map(i=>`<div class="log-item" style="align-items:center;">
              <span style="flex:1;font-size:12.5px;">${esc(i.label)}</span><strong style="font-size:12.5px;">${money(i.amount)}</strong>
              ${isAdmin?`<button class="icon-btn" data-action="remove-fin-item" data-id="${p.id}" data-kind="expenses" data-itemid="${i.id}" style="width:22px;height:22px;" aria-label="Remove fin item">${ICO.x}</button>`:''}
            </div>`).join('') : `<p style="font-size:12px;color:var(--ink-3);margin:0;">No expenses logged.</p>`}
          </div>
          ${isAdmin? `<div data-form="finexpense" style="display:flex;gap:6px;flex-wrap:wrap;">
            <input data-field="newFinExpenseLabel" placeholder="e.g. Studio time" style="flex:2;min-width:140px;padding:8px 10px;border-radius:6px;border:1px solid var(--border-strong);background:var(--surface);" value="${esc(S.newFinExpenseLabel||'')}"/>
            <input data-field="newFinExpenseAmount" type="number" placeholder="Amount" style="flex:1;min-width:80px;padding:8px 10px;border-radius:6px;border:1px solid var(--border-strong);background:var(--surface);" value="${esc(S.newFinExpenseAmount||'')}"/>
            <button class="btn btn-sm" data-action="add-fin-item" data-id="${p.id}" data-kind="expenses">Add</button>
          </div>`:''}
          ` : ''}

          ${S.projectTab==='activity' ? `
          <div class="log">${p.log.slice().reverse().map(l=>`<div class="log-item">
            <span class="log-ico">${l.type==='email'?ICO.mail:l.type==='sms'?ICO.sms:l.type==='success'?ICO.check:ICO.bell}</span>
            <span><div>${esc(l.text)}</div><div class="log-time">${new Date(l.ts).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</div></span>
          </div>`).join('')}</div>
          ` : ''}
        </div>
    </div>
  `;
}
function renderNewProjectModal(){
  const f = S.newProjectForm;
  const isBatch = f.mode==='recordingday';
  const count = f.episodeCount || 2;
  return `<div class="overlay center" data-action="overlay-close-newproject">
    <div class="modal" data-stop data-form="newproject">
      <div class="sheet-head"><h2 style="font-size:1.3rem;">${isBatch? 'New Recording Day' : 'New Project'}</h2><button class="icon-btn" data-action="close-new-project" aria-label="Close">${ICO.x}</button></div>
      <div class="sheet-body">
        <div class="field"><label>Artist${isBatch?'':' (optional — leave unset for a general, non-gig project)'}</label>
          <div class="artist-pick">${ARTISTS.map(a=>`<div class="artist-opt ${f.artistId===a.id?'sel':''}" data-action="pick-project-artist" data-id="${a.id}">
            <span class="avatar" data-slot="${a.slot}" style="width:34px;height:34px;font-size:12px;">${esc(a.initials)}</span><span>${esc(a.name)}</span></div>`).join('')}
          ${!isBatch? `<div class="artist-opt ${!f.artistId?'sel':''}" data-action="pick-project-artist" data-id="">
            <span class="avatar" style="width:34px;height:34px;font-size:12px;background:var(--surface-2);color:var(--ink-3);">—</span><span>None</span></div>` : ''}</div>
        </div>
        ${isBatch ? `
        <p style="font-size:11.5px;color:var(--ink-3);margin:0 0 14px;">Book the shared studio day once, then track each guest's episode as its own project with its own release date. <a href="#" data-action="new-project-mode" data-mode="simple" style="color:var(--accent);">Back to a plain project →</a></p>
        <div class="field"><label>Recording Date</label><input type="date" data-field="recordingDate" value="${f.recordingDate||''}"/></div>
        <div class="field"><label>How many episodes that day?</label>
          <div class="chip-row">${[2,3].map(n=>`<button class="filter-chip ${count===n?'sel':''}" data-action="pick-episode-count" data-count="${n}">${n}</button>`).join('')}</div>
        </div>
        ${Array.from({length:count}).map((_,i)=>`<div class="field"><label>Guest ${i+1}</label><input data-field="guest${i+1}" value="${esc(f['guest'+(i+1)]||'')}" placeholder="Guest name"/></div>`).join('')}
        <div class="field"><label>First Release Date</label><input type="date" data-field="releaseDate" value="${f.releaseDate||''}"/></div>
        <div class="field"><label>Days Between Releases</label><input type="number" data-field="releaseCadenceDays" value="${f.releaseCadenceDays||7}"/></div>
        <button class="btn btn-primary btn-block" data-action="confirm-add-project" style="margin-top:6px;">Book Recording Day + Create Episodes</button>
        ` : `
        <div class="field"><label>Title</label><input data-field="title" value="${esc(f.title||'')}" placeholder="e.g. Fall Tour 2026"/></div>
        <div class="field"><label>Who it's for (optional)</label><input data-field="whoFor" value="${esc(f.whoFor||'')}" placeholder="e.g. client / label / event name"/></div>
        <div class="field"><label>Target Date (optional)</label><input type="date" data-field="dueDate" value="${f.dueDate||''}"/></div>
        <button class="btn btn-primary btn-block" data-action="confirm-add-project" style="margin-top:6px;">Create Project</button>
        <a href="#" data-action="new-project-mode" data-mode="recordingday" style="display:block;text-align:center;font-size:12px;color:var(--ink-3);margin-top:10px;">Booking multiple podcast episodes on one recording day? →</a>
        `}
      </div>
    </div>
  </div>`;
}

/* ============ ARTIST-SIDE ============ */
function renderArtistDashboard(artistId){
  const a = artistById(artistId);
  const evs = eventsFor(artistId);
  const todayGig = evs.find(e=>e.date===todayISO() && isConfirmed(e));
  return `
  ${renderWelcomeHeader(a.name.split(' ')[0])}
  ${renderArtistPortalStatus()}
  ${todayGig? `<div class="card card-pad" style="margin-bottom:20px;border-color:var(--accent);background:var(--accent-wash);">
    <div style="display:flex;align-items:center;gap:8px;color:var(--accent-ink);font-weight:700;font-size:13px;margin-bottom:10px;">${MIC_PHOTO_ICON} Today's Gig</div>
    <div style="font-family:var(--font-display);font-size:1.15rem;font-weight:600;margin-bottom:4px;cursor:pointer;" data-action="open-event" data-id="${todayGig.id}">${esc(todayGig.type)}${todayGig.clientName?` — ${esc(todayGig.clientName)}`:''}</div>
    <div style="font-size:13px;color:var(--ink-2);margin-bottom:2px;">${fmtTimeRange(todayGig.time, todayGig.endTime)}</div>
    <div style="font-size:13px;color:${hasLocation(todayGig)?'var(--ink-2)':'var(--ink-3)'};margin-bottom:14px;">${hasLocation(todayGig)? esc(fullLocation(todayGig)) : 'Location TBD'}</div>
    ${hasLocation(todayGig)? `<div style="display:flex;gap:8px;">
      <a href="${esc(wazeUrl(todayGig))}" target="_blank" rel="noopener" data-action="external-link" class="btn btn-primary" style="flex:1;">${ICO.pin} Navigate (Waze)</a>
      <a href="${esc(gmapsUrl(todayGig))}" target="_blank" rel="noopener" data-action="external-link" class="btn" style="flex:1;background:var(--surface);">${ICO.pin} Google Maps</a>
    </div>` : ''}
  </div>` : ''}
  ${renderArtistTravelCard(evs)}
  ${renderUpcomingGigsCard(evs, {days:7, showArtist:false})}
  `;
}
// "Your Travel" (owner 2026-10-15: "a box that will have a itinerary on the artist end ... they can just
// click on their itinerary and see all of their information"): every upcoming gig with travel booked.
function hasItinerary(ev){ const t = travelOf(ev); return !!(ev.flightBooked || ev.groundTransportBooked || t.flights.length || t.hotels.length || t.ground.length); }
function renderArtistTravelCard(evs){
  const trips = evs.filter(e=>!isPast(e.date) && hasItinerary(e)).sort((a,b)=>a.date.localeCompare(b.date));
  if(!trips.length) return '';
  return `<div class="card card-pad" style="margin-bottom:20px;">
    <div style="display:flex;align-items:center;gap:8px;font-weight:700;font-size:13px;margin-bottom:10px;">${ICO.suitcase} Your Travel</div>
    ${trips.map(e=>{ const t = travelOf(e); const f0 = t.flights[0] || (e.flightBooked ? e.flight : null);
      return `<button class="btn btn-block" style="justify-content:space-between;margin-bottom:6px;text-align:left;" data-action="view-itinerary" data-id="${e.id}">
        <span style="min-width:0;"><strong>${esc(fmtDateShort(e.date))} &middot; ${esc(e.city||e.venue||e.type||'')}</strong>${f0? `<br/><span style="font-size:11.5px;color:var(--ink-3);">${esc([f0.airline, f0.flightNumber].filter(Boolean).join(' '))}${t.hotels.length? ` &middot; ${esc(t.hotels[0].name)}` : ''}</span>` : ''}</span>
        <span style="flex:none;color:var(--accent);">Itinerary ›</span></button>`; }).join('')}
  </div>`;
}
// Shown above the artist's pages while their gigs load from the artist views, or when that failed.
function renderArtistPortalStatus(){
  if(!S.artistPortal.on) return '';
  if(S.artistPortal.error) return `<div class="card card-pad" role="alert" style="border-color:var(--crit);background:var(--crit-wash);margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
    <div style="font-size:13px;color:var(--crit-ink);min-width:0;"><strong>Couldn't load your gigs.</strong> ${S.artistPortal.loadedAt ? 'Showing what loaded earlier. ' : ''}${esc(S.artistPortal.error)}</div>
    <button class="btn btn-sm" data-action="retry-artist-portal">Try again</button>
  </div>`;
  if(!S.artistPortal.loadedAt) return `<div class="card card-pad" style="margin-bottom:16px;font-size:13px;color:var(--ink-2);">Loading your gigs…</div>`;
  return '';
}
function renderArtistFinancials(artistId){
  const jobs = eventsFor(artistId).filter(e=>isConfirmed(e)).sort((a,b)=>b.date.localeCompare(a.date));
  const priced = jobs.filter(e=>!artistMoney(e).pending);
  const pendingCount = jobs.length - priced.length;
  const paidYtd = artistPaidYtd(jobs);
  const expected = priced.filter(e=>!e.artistPaidOut).reduce((s,e)=>s+artistMoney(e).net, 0);
  const pcts = [...new Set(priced.map(e=>artistMoney(e).pct).filter(p=>p!=null))].sort((a,b)=>a-b);
  const pctLabel = !pcts.length ? '—' : pcts.length===1 ? fmtPct(pcts[0]) : `${fmtPct(pcts[0])}–${fmtPct(pcts[pcts.length-1])}`;

  const months = lastNMonths(6);
  const monthly = sumByMonth(priced, months, e=>artistMoney(e).net).map((val,i)=>({label: months[i].toLocaleDateString('en-US',{month:'short'}), val}));
  const maxMonthly = Math.max(...monthly.map(m=>m.val),1);

  return `
  ${renderArtistPortalStatus()}
  <div class="grid stat-row" style="margin-bottom:20px;">
    <div class="card stat-tile"><span class="u-label">Paid to You (YTD)</span><span class="val">${money(paidYtd)}</span><span class="sub">Paid out this year</span></div>
    <div class="card stat-tile"><span class="u-label">Expected</span><span class="val">${money(expected)}</span><span class="sub">Booked, not yet paid out</span></div>
    <div class="card stat-tile"><span class="u-label">Gigs</span><span class="val">${jobs.length}</span><span class="sub">${pendingCount ? `${pendingCount} amount${pendingCount===1?'':'s'} being confirmed` : 'Booked'}</span></div>
    <div class="card stat-tile"><span class="u-label">ASP Fee</span><span class="val">${esc(pctLabel)}</span><span class="sub">Per gig, shown on each job</span></div>
  </div>

  <div class="card card-pad" style="margin-bottom:20px;">
    <div class="section-head"><h2>You Receive, by Month</h2></div>
    <div class="fin-chart" style="display:flex;gap:14px;align-items:flex-end;height:120px;">
      ${monthly.map(m=>`<div style="flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;justify-content:flex-end;">
        <span class="u-mono" style="font-size:11px;color:var(--ink-2);">${m.val?money(m.val):''}</span>
        <div style="width:100%;max-width:46px;height:${Math.max(4,(m.val/maxMonthly)*80)}px;background:var(--accent);border-radius:4px 4px 0 0;opacity:.85;"></div>
        <span class="u-label">${esc(m.label)}</span>
      </div>`).join('')}
    </div>
  </div>

  <div class="section-head"><h2>My Jobs (${jobs.length})</h2></div>
  ${jobs.length ? `<div class="card table-cards"><table>
    <thead><tr><th>Client</th><th>Date</th><th>Gig Amount</th><th>ASP Fee</th><th>You Receive</th><th>Status</th></tr></thead>
    <tbody>${jobs.map(e=>{ const m = artistMoney(e); const st = artistGigStatus(e);
      return `<tr class="row-link" data-action="open-event" data-id="${esc(e.id)}">
        <td data-label="Client">${e.clientName ? esc(e.clientName) : '—'}</td><td data-label="Date" class="u-mono">${fmtDateShort(e.date)}</td>
        ${m.pending ? `<td data-label="Money" colspan="3">Amount being confirmed</td>` : `
        <td data-label="Gig Amount" class="u-mono">${money(m.gross)}</td>
        <td data-label="ASP Fee" class="u-mono">${m.pct!=null ? `${esc(fmtPct(m.pct))} · ` : ''}${money(m.cut)}</td>
        <td data-label="You Receive" class="u-mono">${money(m.net)}</td>`}
        <td data-label="Status"><span class="pill ${st.cls}">${esc(st.label)}</span></td></tr>`; }).join('')}
    </tbody></table></div>` : `<div class="card empty">No booked gigs yet.</div>`}
  `;
}
function renderArtistGigTable(events){
  if(!events.length) return `<div class="card empty">Nothing here yet.</div>`;
  return `<div class="card table-cards"><table>
    <thead><tr><th>Client</th><th>Type</th><th>Date &amp; Time</th><th>Location</th><th>You Receive</th><th>Status</th></tr></thead>
    <tbody>${events.map(e=>{ const m = artistMoney(e); const st = artistGigStatus(e);
      return `<tr class="row-link" data-action="open-event" data-id="${esc(e.id)}">
        <td data-label="Client">${e.clientName ? esc(e.clientName) : '—'}</td>
        <td data-label="Type">${esc(e.type)}</td>
        <td data-label="Date &amp; Time" class="u-mono">${fmtDateShort(e.date)} · ${esc(fmtTimeRange(e.time, e.endTime))}</td>
        <td data-label="Location"><span style="display:block;min-width:0;">${e.venue ? esc(e.venue) : (hasLocation(e) ? esc(fullLocation(e)) : '—')}${renderMapLinks(e)}</span></td>
        <td data-label="You Receive" class="u-mono">${e.unpaid ? '—' : m.pending ? 'Being confirmed' : money(m.net)}</td>
        <td data-label="Status"><span class="pill ${st.cls}">${esc(st.label)}</span></td>
      </tr>`; }).join('')}
    </tbody></table></div>`;
}
function renderArtistGigs(artistId){
  const evs = eventsFor(artistId).sort((a,b)=>a.date.localeCompare(b.date));
  const upcoming = evs.filter(e=>!isPast(e.date));
  const past = evs.filter(e=>isPast(e.date));
  return `
    ${renderArtistPortalStatus()}
    <div class="section-head"><h2>Upcoming</h2></div>
    ${renderArtistGigTable(upcoming)}
    <div class="section-head" style="margin-top:26px;"><h2>Past</h2></div>
    ${renderArtistGigTable(past)}
  `;
}

/* ============ NEW LEAD MODAL ============ */
function renderLeadChargesSection(f){
  const charges = f.charges || [];
  const preset = f.chargePreset || CHARGE_PRESETS[0];
  return `<div class="field">
    <label>Additional Fees (optional)</label>
    ${charges.length? `<div class="ledger" style="margin-bottom:8px;">${charges.map((c,i)=>`<div class="ledger-row"><span>${esc(c.label)} <a href="#" data-action="remove-lead-charge" data-idx="${i}" style="color:var(--crit);text-decoration:none;margin-left:4px;">×</a></span><span class="amt">${money(c.amount)}</span></div>`).join('')}</div>`:''}
    <div style="display:flex; gap:6px; align-items:flex-end; flex-wrap:wrap;">
      <div class="field" style="flex:1;min-width:120px;"><label style="font-size:10px;">Type</label>
        <select data-lead-charge-preset>${CHARGE_PRESETS.map(p=>`<option ${preset===p?'selected':''}>${p}</option>`).join('')}</select>
      </div>
      ${preset==='Other'? `<div class="field" style="flex:1;min-width:100px;"><label style="font-size:10px;">Label</label><input data-field="chargeCustomLabel" value="${esc(f.chargeCustomLabel||'')}" placeholder="Describe"/></div>`:''}
      <div class="field" style="width:90px;"><label style="font-size:10px;">Amount</label><input type="number" data-field="chargeAmount" value="${f.chargeAmount||''}" placeholder="250"/></div>
      <button class="btn btn-sm" data-action="add-lead-charge">+ Add</button>
    </div>
  </div>`;
}
// Wedding-only extra: which live band is playing, and roughly how many pieces. No band roster
// exists in the data model yet (only ASP's own ARTISTS roster of singers/comedians/DJs), so this
// is a free-text field rather than a dropdown -- swap in a real list here if one gets added.
// Shared by both the new-lead form (f = S.newLeadForm) and the edit-details form (f =
// S.editEventForm, ev = the event being edited, for its saved values).
function renderBandFieldsSection(f, ev){
  const band = f.band!==undefined ? f.band : (ev? (ev.band||'') : '');
  const bandSize = f.bandSize!==undefined ? f.bandSize : (ev? (ev.bandSize||'') : '');
  return `<div class="field-row">
    <div class="field"><label>Which Band Is Playing</label><input data-field="band" value="${esc(band)}" placeholder="e.g. Simcha Players"/></div>
    <div class="field"><label>Band Size (optional)</label><input type="number" min="0" data-field="bandSize" value="${esc(bandSize)}" placeholder="e.g. 5"/></div>
  </div>`;
}
// New Artist Event workflow (ops automation spec item 2): "select one or more ASP artists" for a
// single booking. events.artistId stays the one primary/booking artist everywhere else in the app
// (matches the Supabase event_artists design -- primary via events.artist_id, full roster via a
// separate additive table); this is the local-storage equivalent, additive on the event record
// (ev.additionalArtists, each {artistId, feeAmount}) so none of the existing single-artist call
// sites need to change. When set, doCreateContractFromLead defaults to the multiline template and
// pre-fills one line item per artist -- that template already models "multiple performers, one
// event" so no new contract shape is needed.
function renderAdditionalArtistsSection(f){
  const others = ARTISTS.filter(a=>a.id!==f.artistId);
  const selected = f.additionalArtists||[];
  // Collapsed behind a checkbox (owner 2026-10-13); it stays open while any extra artist is picked.
  const open = f.showAdditionalArtists || selected.length>0;
  const toggle = `<label style="display:flex;align-items:center;gap:8px;font-size:12.5px;"><input type="checkbox" data-field="showAdditionalArtists" ${open?'checked':''} ${selected.length?'disabled':''} style="width:16px;height:16px;"/> Additional artist</label>`;
  if(!open) return toggle;
  return `${toggle}<div class="field">
    <label>Additional ASP Artists</label>
    <div class="chip-row">${others.map(a=>{
      const on = selected.some(x=>x.artistId===a.id);
      return `<button type="button" class="filter-chip ${on?'sel':''}" data-action="toggle-additional-artist" data-id="${a.id}"><span class="avatar" data-slot="${a.slot}" style="width:18px;height:18px;font-size:8px;">${esc(a.initials)}</span>${esc(a.name.split(' ')[0])}</button>`;
    }).join('')}</div>
    ${selected.length? `<p style="font-size:11.5px;color:var(--ink-3);margin:6px 0 0;">Each additional artist gets their own fee. Only admin sees another artist's numbers on a shared event.</p>
    ${selected.map(x=>{ const a=artistById(x.artistId); return `<div class="field-row" style="margin-top:4px;">
      <div class="field" style="flex:none;width:90px;"><label style="font-size:10px;">${esc(a?a.name.split(' ')[0]:x.artistId)}</label></div>
      <div class="field"><label>Fee ($)</label><input type="number" data-lead-artist-fee="${x.artistId}" value="${x.feeAmount||''}" placeholder="0"/></div>
    </div>`; }).join('')}` : ''}
  </div>`;
}
function renderNewLeadModal(){
  const f = S.newLeadForm;
  const kind = f.kind || 'client';
  const isInternal = kind==='internal';
  const typeList = isInternal ? INTERNAL_EVENT_TYPES : EVENT_TYPES;
  return `<div class="overlay center" data-action="overlay-close">
    <div class="modal" data-stop data-form="lead">
      <div class="sheet-head"><h2 style="font-size:1.3rem;">${isInternal?'New Internal Day':'New Lead'}</h2><button class="icon-btn" data-action="close-sheet" aria-label="Close">${ICO.x}</button></div>
      <div class="sheet-body">
        <div class="chip-row">
          <button class="filter-chip ${!isInternal?'sel':''}" data-action="pick-booking-kind" data-kind="client">Client Booking</button>
          <button class="filter-chip ${isInternal?'sel':''}" data-action="pick-booking-kind" data-kind="internal">Internal Day</button>
          <button class="filter-chip" data-action="switch-to-outside-booking">Other Booking</button>
        </div>
        <p style="font-size:12px;color:var(--ink-3);margin:0;">${isInternal? 'For recording days, filming days, rehearsals — no client, no payment, just pencils the artist’s time in.' : "Only the artist, client name, and date are required — everything else can be filled in once it's known."}</p>
        ${!isInternal? `<div class="field"><label>Paste a message (optional)</label>
          <textarea data-field="pasteText" rows="3" placeholder="Paste the client's WhatsApp or email message and the fields fill themselves" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--border-strong);font:inherit;">${esc(f.pasteText||'')}</textarea>
          <button type="button" class="btn btn-sm" style="margin-top:6px;align-self:flex-start;" data-action="parse-lead-paste" ${S.parseLeadBusy?'disabled':''}>${S.parseLeadBusy? 'Reading…' : 'Fill from message'}</button>
          ${f.pasteNotes? `<p style="font-size:11.5px;color:var(--ink-3);margin:6px 0 0;">Also in the message: ${esc(f.pasteNotes)}</p>` : ''}
        </div>` : ''}
        <div class="field"><label>Artist</label>
          <div class="chip-row">${ARTISTS.map(a=>`<button type="button" class="filter-chip ${f.artistId===a.id?'sel':''}" data-action="pick-artist" data-id="${a.id}"><span class="avatar" data-slot="${a.slot}" style="width:18px;height:18px;font-size:8px;">${esc(a.initials)}</span>${esc(a.name.split(' ')[0])}</button>`).join('')}</div>
        </div>
        ${!isInternal? renderAdditionalArtistsSection(f) : ''}
        <div class="field-row">
          ${!isInternal? `<div class="field"><label>Client Name</label><input data-field="clientName" value="${esc(f.clientName||'')}" placeholder="Full name"/></div>` : ''}
          <div class="field"><label>Event Type</label><select data-action="pick-event-type">${typeList.map(t=>`<option ${f.type===t?'selected':''}>${t}</option>`).join('')}</select></div>
        </div>
        ${f.type==='Other'? `<div class="field"><label>Describe the Event Type</label><input data-field="customType" value="${esc(f.customType||'')}" placeholder="${isInternal?'e.g. Photo Shoot':'e.g. Bris, Vort, Studio Session'}"/></div>` : ''}
        ${f.type==='Wedding'? renderBandFieldsSection(f) : ''}
        ${!isInternal? `<div class="field-row">
          <div class="field"><label>Client Email</label><input data-field="clientEmail" value="${esc(f.clientEmail||'')}" placeholder="name@example.com"/></div>
          <div class="field"><label>Client Phone</label><input data-field="clientPhone" value="${esc(f.clientPhone||'')}" placeholder="(555) 555-5555"/></div>
        </div>` : ''}
        <div class="field"><label>Date</label><input type="date" data-field="date" value="${f.date||''}"/></div>
        ${f.timeTbd? '' : `<div class="field-row">
          <div class="field"><label>Start Time</label><input type="time" data-field="time" value="${f.time||LEAD_DEFAULT_START}"/></div>
          <div class="field"><label>End Time</label><input type="time" data-field="endTime" value="${leadEndTime(f)||''}"/></div>
        </div>`}
        <label style="display:flex;align-items:center;gap:8px;font-size:12.5px;"><input type="checkbox" data-field="timeTbd" ${f.timeTbd?'checked':''} style="width:16px;height:16px;"/> Time TBD</label>
        <div class="field"><label>Venue Name</label><input data-field="venue" list="venueList" autocomplete="off" value="${esc(f.venue||'')}" placeholder="${isInternal?'Studio name':'Start typing — e.g. Ateres Chaya Hall'}"/>${venueDatalistHtml()}</div>
        <div class="field"><label>Address</label><input data-field="address" value="${esc(f.address||'')}" placeholder="Street address"/></div>
        <div class="field-row">
          <div class="field"><label>City</label><input data-field="city" value="${esc(f.city||'')}" placeholder="Lakewood"/></div>
          <div class="field"><label>State</label><input data-field="state" value="${esc(f.state||'')}" placeholder="NJ"/></div>
        </div>
        <div class="field-row">
          ${!isInternal? `<div class="field"><label>Price</label><input type="number" data-field="price" value="${f.price||''}" placeholder="4500"/>
            <button type="button" class="filter-chip ${f.mezumin?'sel':''}" style="margin-top:6px;align-self:flex-start;" data-action="toggle-lead-mezumin">Mezumin (cash)</button></div>` : ''}
          <div class="field" style="justify-content:flex-end;flex-direction:row;align-items:center;gap:8px;padding-top:18px;">
            <input type="checkbox" id="flightck" data-field="flightNeeded" ${f.flightNeeded?'checked':''} style="width:16px;height:16px;"/>
            <label for="flightck" style="text-transform:none;font-size:13px;color:var(--ink);font-weight:500;">Flight needed</label>
          </div>
        </div>
        <div class="field" style="flex-direction:row;align-items:center;gap:8px;">
          <input type="checkbox" id="transportck" data-field="groundTransportNeeded" ${f.groundTransportNeeded?'checked':''} style="width:16px;height:16px;"/>
          <label for="transportck" style="text-transform:none;font-size:13px;color:var(--ink);font-weight:500;">Ground transport / driver needed</label>
        </div>
        ${!isInternal? renderLeadChargesSection(f) : ''}
        <button class="btn btn-primary btn-block" data-action="submit-lead" style="margin-top:6px;">${isInternal? 'Add Internal Day — Pencil into Calendar' : 'Add Lead — Pencil into Calendar'}</button>
      </div>
    </div>
  </div>`;
}

function renderBlockTimeModal(){
  const f = S.blockTimeForm;
  const allDay = f.allDay!==false;
  return `<div class="overlay center" data-action="overlay-close">
    <div class="modal" data-stop data-form="blocktime" style="width:380px;">
      <div class="sheet-head"><h2 style="font-size:1.3rem;">Block Time</h2><button class="icon-btn" data-action="close-sheet" aria-label="Close">${ICO.x}</button></div>
      <div class="sheet-body">
        <p style="font-size:12px;color:var(--ink-3);margin:0;">Marks you unavailable — the office will see it and won't book you those dates.</p>
        <div class="field-row">
          <div class="field"><label>From</label><input type="date" data-field="date" value="${f.date||''}"/></div>
          <div class="field"><label>To (optional)</label><input type="date" data-field="endDate" value="${f.endDate||''}"/></div>
        </div>
        <div class="field" style="flex-direction:row;align-items:center;gap:8px;">
          <input type="checkbox" id="blockAllDay" data-field="allDay" ${allDay?'checked':''} style="width:16px;height:16px;"/>
          <label for="blockAllDay" style="text-transform:none;font-size:13px;color:var(--ink);font-weight:500;">All day</label>
        </div>
        ${!allDay? `<div class="field-row">
          <div class="field"><label>Start Time</label><input type="time" data-field="startTime" value="${f.startTime||''}"/></div>
          <div class="field"><label>End Time</label><input type="time" data-field="endTime" value="${f.endTime||''}"/></div>
        </div>` : ''}
        <div class="field"><label>Note (optional)</label><input data-field="note" value="${esc(f.note||'')}" placeholder="e.g. Family vacation"/></div>
        <button class="btn btn-primary btn-block" data-action="submit-block-time" style="margin-top:6px;">Block Time — Add to Calendar</button>
      </div>
    </div>
  </div>`;
}

function renderAskAIModal(){
  const history = S.askAIHistory;
  const f = S.askAIForm;
  const suggestions = isAdminUser(S.user) ? [
    'How many open leads do we have?',
    'What gigs are booked this month?',
    'Any scheduling conflicts?',
    'How is Benny Friedman doing?',
  ] : [
    'When is my next gig?',
    'How many gigs do I have this month?',
    'What is my YTD payout?',
  ];
  return `<div class="overlay center" data-action="overlay-close">
    <div class="modal" data-stop data-form="askai" style="width:460px;display:flex;flex-direction:column;max-height:80vh;">
      <div class="sheet-head"><h2 style="font-size:1.2rem;display:flex;align-items:center;gap:8px;">${ICO.sparkle} Ask AI</h2><button class="icon-btn" data-action="close-sheet" aria-label="Close">${ICO.x}</button></div>
      <div style="flex:1;overflow-y:auto;padding:16px 20px;display:flex;flex-direction:column;gap:12px;">
        ${!history.length ? `
          <p style="font-size:12.5px;color:var(--ink-3);margin:0;">Ask about gigs, leads, or an artist's schedule.</p>
          <div style="display:flex;flex-direction:column;gap:6px;">
            ${suggestions.map(s=>`<button class="btn btn-sm btn-ghost" style="justify-content:flex-start;" data-action="ask-ai-suggestion" data-q="${esc(s)}">${esc(s)}</button>`).join('')}
          </div>
        ` : history.map(h=>`
          <div style="align-self:flex-end;max-width:85%;background:var(--accent);color:#fff;padding:9px 13px;border-radius:14px 14px 4px 14px;font-size:13px;">${esc(h.q)}</div>
          <div style="align-self:flex-start;max-width:85%;background:var(--surface-2);padding:9px 13px;border-radius:14px 14px 14px 4px;font-size:13px;line-height:1.5;white-space:pre-line;">${h.a===null? markLoader(14) : esc(h.a)}</div>
        `).join('')}
      </div>
      <div style="padding:12px 16px;border-top:1px solid var(--border);display:flex;gap:8px;">
        <input id="askAIInput" data-field="query" value="${esc(f.query||'')}" placeholder="Ask a question…" style="flex:1;padding:9px 14px;border-radius:999px;border:1px solid var(--border-strong);background:var(--surface);font-size:16px;"/>
        <button class="icon-btn" style="background:var(--accent);color:#fff;border-radius:50%;" data-action="submit-ask-ai" title="Send" aria-label="Send">${ICO.chev('r')}</button>
      </div>
    </div>
  </div>`;
}

const ARTIST_ROLES = ['Singer','Comedian','DJ'];
function renderAddArtistModal(){
  const f = S.addArtistForm;
  const role = f.role || 'Singer';
  return `<div class="overlay center" data-action="overlay-close-addartist">
    <div class="modal" data-stop data-form="addartist" style="width:420px;">
      <div class="sheet-head"><h2 style="font-size:1.3rem;">Add Artist</h2><button class="icon-btn" data-action="close-add-artist" aria-label="Close">${ICO.x}</button></div>
      <div class="sheet-body">
        <div class="field"><label>Full Name</label><input data-field="name" value="${esc(f.name||'')}" placeholder="Full name" autofocus/></div>
        <div class="field"><label>Role</label>
          <div class="chip-row">${ARTIST_ROLES.map(r=>`<button class="filter-chip ${role===r?'sel':''}" data-action="pick-artist-role" data-role="${r}">${r}</button>`).join('')}</div>
        </div>
        <p style="font-size:12px;color:var(--ink-3);margin:0;">This adds them to the roster here. To give them a login, add them under Settings → Users → Add Person.</p>
        <button class="btn btn-primary btn-block" data-action="confirm-add-artist">Add Artist</button>
      </div>
    </div>
  </div>`;
}

/* ============ PAYMENT METHOD (deposit exceptions) ============ */
// Default is 'standard' (QuickBooks invoice for the deposit + Zelle for the balance, per
// WORKFLOWS.md). No paymentMethod field at all means standard too -- undefined behaves as
// 'standard' everywhere it's read, same convention as the rest of this file's optional fields,
// so existing saved events never need a migration.
const PAYMENT_METHODS = [
  ['standard', 'Standard (QuickBooks + Zelle)'],
  ['cash', 'Mezumin (cash)'],
  ['check', 'Check'],
  ['other', 'Other'],
];
function isStandardPayment(ev){ return !ev.paymentMethod || ev.paymentMethod === 'standard'; }
function paymentMethodLabel(ev){
  const m = PAYMENT_METHODS.find(([k])=>k===(ev.paymentMethod||'standard'));
  return m ? m[1] : 'Other';
}
// Any active (not internal, not fully paid) event on a non-standard payment method needs a
// manual follow-up -- there's no automated QuickBooks invoice or Zelle reminder to carry it.
function altPaymentFollowUps(){
  return S.events.filter(e=>!e.unpaid && !isStandardPayment(e) && ['contract_sent','booked'].includes(e.status));
}
// Resolves strictly through the event's own artistId -- there is no path here that could hand
// back a different artist's payee profile, which is what makes "never cross-send one artist's QR
// to another" (ops automation spec item 5) hold structurally rather than by convention.
function zelleProfileForEvent(ev, artist){
  const profile = defaultPayeeProfileForArtist(ev.artistId);
  return (profile && profile.zelleActive!==false) ? profile : null;
}
// Who the client pays by Zelle (2026-10-09 audit 2.4) -- in order:
//   1. the payee on the lead's latest sent/signed contract (what the client agreed to pay), else
//   2. the artist's OWN payee profile.
// Never the artist's app login email (not a Zelle address), and never a silent fallback to the
// house or another artist's profile. null (→ client is told to contact the office) when that payee
// has no active Zelle details. zellePayeeReason() explains a null to staff.
function zellePayeeProfileFor(ev){
  const sent = contractsForLead(ev.id).find(c=>c.status==='sent' || c.status==='signed');
  return (sent && contractPayeeProfile(sent)) || PAYEE_PROFILES.find(p=>p.artistId===ev.artistId) || null;
}
function zellePayeeFor(ev){
  const profile = zellePayeeProfileFor(ev);
  if(!profile || profile.zelleActive===false || !(profile.zelle || profile.zelleQrDataUrl)) return null;
  return { identifier: profile.zelle || '', label: profile.zelleRecipientLabel || profile.zelle || '', profile };
}
function zellePayeeReason(ev){
  const profile = zellePayeeProfileFor(ev);
  if(!profile) return 'has no payee profile yet';
  if(profile.zelleActive===false) return `has Zelle switched off on the "${profile.entityName||profile.displayName||'payee'}" profile`;
  return `has no Zelle details on the "${profile.entityName||profile.displayName||'payee'}" profile`;
}
function zellePaymentSentence(ev){
  const payee = zellePayeeFor(ev);
  if(!payee) return ' via Zelle — please contact the office for the Zelle details';
  return payee.identifier ? ' via Zelle — scan the code below or send directly to '+esc(payee.identifier) : ' via Zelle — scan the code below';
}
function zelleQrUrl(ev, artist, profile){
  const identifier = profile.zelle;
  const zelleText = `Zelle payment to ${identifier} — ${money(artistPayout(ev))} for ${artist.name} (${ev.type}, ${fmtDateShort(ev.date)})`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(zelleText)}`;
}
function renderZelleQrBlock(ev, artist){
  const payee = zellePayeeFor(ev);
  if(payee) return `<div style="background:#fff;color:#17171A;border-radius:var(--r-md);padding:4px 12px 12px;">${paymentOptionsEmailBlock({ kind:'balance', amount:clientBalanceDue(ev), memo:gigPaymentMemo(ev), zelle:balanceZelle(ev) })}</div>
    ${(balanceZelle(ev)||{}).qrUrl || gigExtraArtists(ev).length ? '' : `<p style="font-size:10.5px;color:var(--ink-3);margin:10px 0 0;text-align:center;">No Zelle QR uploaded for this artist yet, so the email shows their Zelle address instead. Upload it in Settings → Payee Profiles.</p>`}`;
  if(!payee) return `<p style="font-size:12px;color:var(--warn-ink);background:var(--warn-wash);padding:10px 12px;border-radius:var(--r-md);margin:0;">${esc(artist.name)} ${esc(zellePayeeReason(ev))} — the client will be told to contact the office for Zelle details. Fix it in Settings → Payee Profiles.</p>`;
  const profile = payee.profile;
  const usingRealQr = !!profile.zelleQrDataUrl;
  const label = payee.label;
  return `<div style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px;background:var(--surface-2);border-radius:var(--r-md);">
    <img src="${usingRealQr? safeDataUrl(profile.zelleQrDataUrl) : esc(zelleQrUrl(ev,artist,profile))}" alt="Zelle QR code" width="180" height="180" style="border-radius:8px;background:#fff;padding:8px;"/>
    <span class="u-mono" style="font-size:11.5px;color:var(--ink-2);">${esc(label)}</span>
    ${profile && profile.zelleInstructions? `<span style="font-size:11px;color:var(--ink-3);text-align:center;">${esc(profile.zelleInstructions)}</span>` : ''}
  </div>
  ${usingRealQr? '' : `<p style="font-size:10.5px;color:var(--ink-3);margin:14px 0 0;text-align:center;">QR points to a mock Zelle reference — upload this artist's real Zelle QR on their Payee Profile once available.</p>`}`;
}
function renderReminderPreview(){
  const ev = getEvent(S.eventId); if(!ev) return '';
  const artist = artistById(ev.artistId);
  const balance = clientBalanceDue(ev);
  return `<div class="overlay center" data-action="overlay-close-reminderpreview">
    <div class="doc" data-stop style="width:440px;">
      <div class="sheet-head"><h2 style="font-size:1.1rem;">Reminder Email Preview</h2><button class="icon-btn" data-action="close-reminder-preview" aria-label="Close">${ICO.x}</button></div>
      <div class="doc-body" style="padding:24px 26px 30px;">
        <div style="font-size:12.5px;line-height:1.6;margin-bottom:16px;">
          <div><strong>To:</strong> ${esc(ev.clientEmail)}</div>
          <div><strong>Subject:</strong> Balance reminder — ${esc(artist.name)}, ${esc(fmtDateShort(ev.date))}</div>
          <hr style="border:none;border-top:1px solid var(--border);margin:10px 0;"/>
          ${reminderIntroHtml(ev, artist, balance, balancePayBlocker(ev) ? null : 'preview')}
          ${hasLocation(ev)? `<p style="margin:0 0 8px;">Venue: ${esc(fullLocation(ev))} — <a href="${gmapsUrl(ev)}" target="_blank" rel="noopener" style="color:var(--accent);">Open in Maps</a></p>` : ''}
        </div>
        ${isStandardPayment(ev)? renderZelleQrBlock(ev, artist) : ''}
        <button class="btn btn-primary btn-block" style="margin-top:14px;" data-action="resend-reminder" data-id="${ev.id}" ${S.reminderBusy?'disabled':''}>${S.reminderBusy?'Sending…':'Send'}</button>
        ${ev.lastReminderSent? `<p style="font-size:11px;color:var(--ink-3);text-align:center;margin:8px 0 0;">Last sent ${fmtDateShort(ev.lastReminderSent)}</p>` : ''}
      </div>
    </div>
  </div>`;
}
function renderBookingConfirmationPreview(){
  const ev = getEvent(S.eventId); if(!ev) return '';
  const artist = artistById(ev.artistId);
  const balance = clientBalanceDue(ev);
  const busy = !!S.bookingConfirmationBusy;
  return `<div class="overlay center" data-action="overlay-close-bookingconfirmation">
    <div class="doc" data-stop style="width:440px;">
      <div class="sheet-head"><h2 style="font-size:1.1rem;">Booking Confirmation</h2><button class="icon-btn" data-action="close-booking-confirmation" aria-label="Close">${ICO.x}</button></div>
      <div class="doc-body" style="padding:24px 26px 30px;">
        <div style="font-size:12.5px;line-height:1.6;margin-bottom:16px;">
          <div><strong>To:</strong> ${esc(ev.clientEmail)}</div>
          <div><strong>Subject:</strong> You're booked! — ${esc(artist.name)}, ${esc(fmtDateShort(ev.date))}</div>
          <hr style="border:none;border-top:1px solid var(--border);margin:10px 0;"/>
          ${bookingConfirmationIntroHtml(ev, artist, balance, balancePayBlocker(ev) ? null : 'preview')}
          ${hasLocation(ev)? `<p style="margin:0 0 8px;">Venue: ${esc(fullLocation(ev))} — <a href="${gmapsUrl(ev)}" target="_blank" rel="noopener" style="color:var(--accent);">Open in Maps</a></p>` : ''}
        </div>
        ${isStandardPayment(ev)? renderZelleQrBlock(ev, artist) : ''}
        <button class="btn btn-primary btn-block" style="margin-top:14px;" data-action="resend-booking-confirmation" data-id="${ev.id}" ${busy?'disabled':''}>${busy?'Sending…':(ev.bookingConfirmationSentAt?'Resend':'Send')}</button>
        ${ev.bookingConfirmationSentAt? `<p style="font-size:11px;color:var(--ink-3);text-align:center;margin:8px 0 0;">Sent ${fmtDateShort(ev.bookingConfirmationSentAt.slice(0,10))}</p>` : ''}
      </div>
    </div>
  </div>`;
}
function renderWelcomeEmailPreview(){
  const w = S.newArtistWelcome; if(!w) return '';
  return `<div class="overlay center" data-action="overlay-close-welcome">
    <div class="doc" data-stop style="width:480px;">
      <div class="sheet-head"><h2 style="font-size:1.1rem;">${ICO.check} Artist Added</h2><button class="icon-btn" data-action="close-welcome" aria-label="Close">${ICO.x}</button></div>
      <div class="doc-body" style="padding:26px 28px 30px;">
        <p style="font-size:13px;color:var(--ink-2);margin:0 0 16px;"><strong style="color:var(--ink);">${esc(w.name)}</strong> was added to the roster with login <strong style="color:var(--ink);">${esc(w.email)}</strong>. A welcome email was sent:</p>
        <div class="card card-pad" style="background:var(--surface-2);">
          <div class="u-label" style="margin-bottom:8px;">Email Preview</div>
          <div style="font-size:12.5px;line-height:1.6;">
            <div><strong>To:</strong> ${esc(w.email)}</div>
            <div><strong>Subject:</strong> Welcome to ASP Management</div>
            <hr style="border:none;border-top:1px solid var(--border);margin:10px 0;"/>
            <p style="margin:0 0 8px;">Hi ${esc(w.name.split(' ')[0])},</p>
            <p style="margin:0 0 8px;">Welcome to ASP! Your bookings dashboard is ready — you'll see every upcoming gig, its details, and your payout breakdown in one place.</p>
            <p style="margin:0 0 8px;">Sign in any time at ${esc(w.email)} — no separate password needed.</p>
            <p style="margin:0;">— ASP Artist Management</p>
          </div>
        </div>
        <button class="btn btn-primary btn-block" data-action="close-welcome" style="margin-top:16px;">Done</button>
      </div>
    </div>
  </div>`;
}

/* ============ EVENT SHEET ============ */
function renderEventSheet(ev){
  if(!ev) return '';
  const a = artistById(ev.artistId);
  const isAdmin = isAdminUser(S.user);
  const sm = isAdmin ? statusMeta(ev) : artistGigStatus(ev);
  const steps = EVENT_PIPELINE.map(p=>({ key:p.key, label:p.step }));
  const curIdx = EVENT_PIPELINE.findIndex(p=>p.key===ev.status);

  return `<div class="overlay overlay-window" data-action="overlay-close">
    <div class="sheet sheet-window" data-stop>
      ${S.showEventMenu? `<div class="kebab-scrim"></div>`:''}
      <div class="sheet-head">
        <div style="display:flex;align-items:center;gap:10px;">
          <span class="avatar" data-slot="${a.slot}" style="width:38px;height:38px;">${esc(a.initials)}</span>
          <div><strong style="font-family:var(--font-display);font-size:1.2rem;display:block;">${esc(a.name)}</strong>
          <span class="pill ${sm.cls}">${esc(sm.label)}</span></div>
        </div>
        <div class="kebab-menu-wrap" style="display:flex;gap:4px;align-items:center;position:relative;">
          ${isAdmin? `<button class="icon-btn" data-action="open-edit-event" title="Edit details" aria-label="Edit details">${ICO.edit}</button>`:''}
          <button class="icon-btn" data-action="toggle-event-menu" aria-label="Toggle event menu">${ICO.kebab}</button>
          ${S.showEventMenu? `<div class="kebab-dropdown">
            <button class="kebab-item" data-action="share-event" data-id="${ev.id}">${ICO.share} Share</button>
            ${isAdmin? `<button class="kebab-item danger" data-action="delete-event" data-id="${ev.id}">${ICO.trash} Delete ${ev.unpaid?'Internal Day':ev.status==='lead'?'Lead':'Gig'}</button>` : ''}
          </div>`:''}
          <button class="icon-btn" data-action="close-sheet" aria-label="Close">${ICO.x}</button>
        </div>
      </div>
      <div class="sheet-body">

        ${!ev.unpaid ? `<div class="timeline">
          ${steps.map((s,i)=>`<div class="tl-step ${i<curIdx?'done':''} ${i===curIdx?'current':''}"><span class="tl-line"></span>
            <span class="tl-dot">${i<curIdx?ICO.check:i+1}</span><span class="tl-label">${s.label}</span></div>`).join('')}
        </div>` : ''}

        <div class="card card-pad" style="display:flex;flex-direction:column;gap:9px;">
          ${!ev.unpaid ? `<div class="kv-row" ${isAdmin?`data-action="open-client-contact" data-id="${ev.id}" style="cursor:pointer;"`:''}><span style="color:var(--ink-2);">${ICO.pin} Client</span><strong${isAdmin?' style="color:var(--accent);"':''}>${esc(ev.clientName)}</strong></div>` : ''}
          <div class="kv-row"><span style="color:var(--ink-2);">Type</span><strong>${esc(ev.type)}</strong></div>
          ${ev.type==='Wedding' ? `<div class="kv-row"><span style="color:var(--ink-2);">Band</span><strong style="text-align:right;">${ev.band? esc(ev.band) : `<span style="color:var(--ink-3);font-weight:500;">${isAdmin?'Not set':'TBD'}</span>`}${ev.bandSize?`<br/><span style="font-weight:500;color:var(--ink-2);">${esc(String(ev.bandSize))} piece${Number(ev.bandSize)===1?'':'s'}</span>`:''}</strong></div>` : ''}
          <div class="kv-row"><span style="color:var(--ink-2);">${ICO.clock} Date &amp; Time</span><strong class="u-mono">${fmtDate(ev.date)} · ${fmtTimeRange(ev.time, ev.endTime)}</strong></div>
          <div class="kv-row">
            <span style="color:var(--ink-2);">${ICO.pin} Venue</span>
            <span style="text-align:right;">
              <strong>${ev.venue? esc(ev.venue) : `<span style="color:var(--ink-3);font-weight:500;">TBD</span>`}${!isAdmin && ev.address?`<br/><span style="font-weight:500;color:var(--ink-2);">${esc(ev.address)}</span>`:''}${(ev.city||ev.state)?`<br/><span style="font-weight:500;color:var(--ink-2);">${esc(ev.city)}${ev.city&&ev.state?', ':''}${esc(ev.state)}</span>`:''}</strong>
              ${!isAdmin ? `<span style="display:flex;justify-content:flex-end;">${renderMapLinks(ev)}</span>` : hasLocation(ev)? `<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:4px;">
                <a href="${gmapsUrl(ev)}" target="_blank" rel="noopener" style="font-size:11px;font-weight:700;color:var(--accent);text-decoration:none;">Maps</a>
                <a href="${wazeUrl(ev)}" target="_blank" rel="noopener" style="font-size:11px;font-weight:700;color:var(--accent);text-decoration:none;">Waze</a>
              </div>`:''}
            </span>
          </div>
          <div class="kv-row" style="align-items:center;">
            <span style="color:var(--ink-2);">Dress Code</span>
            <span style="display:flex;align-items:center;gap:6px;">
              <strong style="text-align:right;">${ev.dressCode? esc(ev.dressCode) : `<span style="color:var(--ink-3);font-weight:500;">${isAdmin?'Not set':'TBD'}</span>`}</strong>
              ${isAdmin? `<button class="icon-btn" data-action="open-dresscode-form" style="width:20px;height:20px;" title="Edit dress code" aria-label="Edit dress code">${ICO.edit}</button>`:''}
            </span>
          </div>
          ${isAdmin && !ev.unpaid?`<div class="kv-row" data-action="open-client-contact" data-id="${ev.id}" style="cursor:pointer;"><span style="color:var(--ink-2);">${ICO.mail} Contact</span><strong style="text-align:right;color:var(--accent);">${ev.clientEmail||ev.clientPhone? `${esc(ev.clientEmail)}${ev.clientEmail&&ev.clientPhone?'<br/>':''}<span style="font-weight:500;">${esc(ev.clientPhone)}</span>` : '<span style="font-weight:500;">+ Add contact</span>'}</strong></div>`:''}
          ${!isAdmin && !ev.unpaid && (ev.clientPhone || ev.clientEmail) ? `<div class="kv-row"><span style="color:var(--ink-2);">${ICO.mail} Contact</span><strong style="text-align:right;">${ev.clientPhone?`<a href="tel:${esc(telHref(ev.clientPhone))}" style="color:var(--accent);text-decoration:none;">${esc(ev.clientPhone)}</a>`:''}${ev.clientPhone&&ev.clientEmail?'<br/>':''}${ev.clientEmail?`<a href="mailto:${esc(ev.clientEmail)}" style="color:var(--accent);text-decoration:none;font-weight:500;">${esc(ev.clientEmail)}</a>`:''}</strong></div>` : ''}
          ${!isAdmin && (ev.coPerformers||[]).length ? `<div class="kv-row"><span style="color:var(--ink-2);">Performing with</span><strong style="text-align:right;">${ev.coPerformers.map(c=>`${esc(c.name)}${c.role?` <span style="font-weight:500;color:var(--ink-2);">(${esc(c.role)})</span>`:''}`).join('<br/>')}</strong></div>` : ''}
          ${!isAdmin && ev.collectMethod ? `<div class="kv-row"><span style="color:var(--ink-2);">${ICO.money} Collect at the event</span><strong style="text-align:right;color:var(--warn-ink);">${ev.collectAmount!=null?`${money(ev.collectAmount)} `:''}${esc(ev.collectMethod==='cash'?'cash (mezumin)':ev.collectMethod==='check'?'by check':'balance')}${ev.collectNote?`<br/><span style="font-weight:500;color:var(--ink-2);">${esc(ev.collectNote)}</span>`:''}</strong></div>` : ''}
          ${isAdmin && !ev.unpaid && !isStandardPayment(ev) ? `<div class="kv-row"><span style="color:var(--ink-2);">${ICO.money} Payment Method</span><strong style="text-align:right;color:var(--warn-ink);">${esc(paymentMethodLabel(ev))}${ev.paymentMethodNote?`<br/><span style="font-weight:500;color:var(--ink-2);">${esc(ev.paymentMethodNote)}</span>`:''}</strong></div>` : ''}
        </div>

        ${isAdmin ? renderLeadContractsCard(ev) : ''}
        ${renderConflictWarning(ev)}
        ${isInternational(ev) && !ev.intlOpportunityDismissed && !isPast(ev.date) ? `<div class="card card-pad" style="border-color:var(--accent);background:var(--accent-wash);">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
            <div style="display:flex;align-items:center;gap:8px;color:var(--accent-ink);font-weight:700;font-size:13px;">${ICO.plane} ${esc(a.name)} will be in ${esc(ev.city)}, ${esc(ev.state)}</div>
            ${isAdmin?`<button class="icon-btn" data-action="dismiss-intl" data-id="${ev.id}" title="Dismiss" style="width:22px;height:22px;color:var(--accent-ink);flex:none;" aria-label="Dismiss">${ICO.x}</button>`:''}
          </div>
          ${isAdmin? `<p style="font-size:12.5px;color:var(--accent-ink);margin:6px 0 0;">Worth reaching out to contacts nearby — a good window to line up more bookings while ${esc(a.name.split(' ')[0])} is already out there.</p>` : `<p style="font-size:12.5px;color:var(--accent-ink);margin:6px 0 0;">Let the office know if you have contacts nearby — good window to add more bookings on this trip.</p>`}
        </div>` : ''}
        ${renderFlightBlock(ev, isAdmin)}
        ${renderGroundTransportBlock(ev, isAdmin)}
        ${isAdmin && (ev.flightNeeded || ev.groundTransportNeeded) ? renderTravelRequestSummary(ev) : ''}
        ${hasItinerary(ev) ? `<div style="display:flex;gap:8px;">
          <button class="btn" style="flex:1;justify-content:flex-start;" data-action="view-itinerary" data-id="${ev.id}">${ICO.suitcase} View Itinerary</button>
        </div>` : ''}
        ${isAdmin && !ev.unpaid && ['contract_sent','booked','paid'].includes(ev.status) ? renderGigCrewCard(ev.id, (S.gigCrew||{})[ev.id] || []) : ''}
        ${renderPrepAndGigInfoCard(ev, isAdmin)}
        ${!isAdmin ? `<div>
            <div style="display:flex;gap:8px;">
              <button class="btn btn-primary btn-block" data-action="gcal" data-id="${ev.id}">${ICO.cal} Add to Google Calendar</button>
              <button class="btn btn-block" data-action="ics" data-id="${ev.id}">Download .ics</button>
            </div>
            <p style="font-size:11px;color:var(--ink-3);text-align:center;margin:8px 0 0;">Once ASP is online, gigs will sync to your Google Calendar automatically — no clicking needed. Add your Google account to the Apple Calendar app on iPhone and it'll show up there too.</p>
          </div>`:''}

        ${isAdmin ? renderAdminActions(ev) : ''}

        ${isAdmin && (ev.additionalArtists||[]).length ? renderAdditionalArtistsRoster(ev) : ''}
        ${!ev.unpaid ? (isAdmin ? renderLedger(ev, {compact:true}) : renderArtistMoneyCard(ev)) : ''}

        ${isAdmin ? `<div>
          <div class="section-head" style="margin-bottom:8px;"><h2 style="font-size:1rem;">Activity</h2></div>
          <div class="log">${ev.log.slice().reverse().map(l=>`<div class="log-item">
            <span class="log-ico ${l.type==='warning'?'warn':''}">${l.type==='email'?ICO.mail:l.type==='sms'?ICO.sms:l.type==='success'?ICO.check:l.type==='warning'?ICO.alert:ICO.bell}</span>
            <span><div>${esc(l.text)}</div><div class="log-time">${new Date(l.ts).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</div></span>
          </div>`).join('')}</div>
        </div>` : ''}
      </div>
    </div>
  </div>`;
}

function renderConflictWarning(ev){
  const conflicts = findConflicts(ev);
  if(!conflicts.length) return '';
  return `<div class="card card-pad" style="border-color:var(--crit);background:var(--crit-wash);">
    <div style="display:flex;align-items:center;gap:8px;color:var(--crit-ink);font-weight:700;font-size:13px;">${ICO.alert} Scheduling conflict</div>
    <div style="display:flex;flex-direction:column;gap:6px;margin-top:8px;">
      ${conflicts.map(c=>`<div style="display:flex;justify-content:space-between;align-items:center;font-size:12.5px;color:var(--crit-ink);cursor:pointer;" data-action="open-event" data-id="${c.id}">
        <span>${fmtDateShort(c.date)} · ${esc(fmtTimeRange(c.time, c.endTime))} — ${c.clientName ? `${esc(c.clientName)} (${esc(c.type)})` : esc(c.type)}</span>
        <span style="text-decoration:underline;">View</span>
      </div>`).join('')}
    </div>
  </div>`;
}
function renderTravelRequestSummary(ev){
  const reqs = travelRequestsForEvent(ev.id);
  if(!reqs.length) return `<button class="btn btn-sm" style="justify-content:flex-start;" data-action="create-travel-request" data-id="${ev.id}">${ICO.suitcase} Request Travel from Rivky</button>`;
  return `<div style="display:flex;flex-direction:column;gap:6px;">
    ${reqs.map(tr=>`<button class="btn btn-sm" style="justify-content:space-between;" data-action="open-travel-request" data-id="${tr.id}">
      <span>${ICO.suitcase} Travel Request</span>
      <span class="pill ${tr.status==='draft'?'':'pill-good'}">${esc(travelRequestStatusLabel(tr.status))}</span>
    </button>`).join('')}
  </div>`;
}
function renderFlightBlock(ev, isAdmin){
  if(!ev.flightNeeded) return isAdmin ? `<button class="btn btn-ghost" data-action="toggle-flight" data-id="${ev.id}" style="justify-content:flex-start;color:var(--ink-2);">${ICO.checkSquare} Mark flight needed</button>` : '';
  if(!ev.flightBooked){
    if(!isAdmin) return '';
    return `<div class="card card-pad" style="border-color:var(--warn);background:var(--warn-wash);">
      <div style="display:flex;align-items:center;gap:8px;color:var(--warn-ink);font-weight:700;font-size:13px;">${ICO.plane} Flight needed — not booked yet</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
        <button class="btn btn-sm" data-action="open-flight-form" data-id="${ev.id}">Add flight info</button>
        <button class="btn btn-sm btn-ghost" data-action="unmark-flight" data-id="${ev.id}">Not needed</button>
        <button class="btn btn-sm" data-action="open-travel-drop" data-id="${ev.id}">Drop in confirmations</button>
      </div>
    </div>`;
  }
  const f = ev.flight;
  const trackable = !!(f.flightNumber || (f.confirmation && f.confirmation!=='—'));
  const checking = S.checkingFlightId===ev.id;
  return `<div class="card card-pad">
    <div style="display:flex;align-items:center;gap:8px;font-weight:700;font-size:13px;color:var(--good-ink);">${ICO.plane} Flight booked
      ${isAdmin? `<span style="margin-left:auto;display:flex;gap:6px;"><button class="btn btn-sm btn-ghost" data-action="open-travel-drop" data-id="${ev.id}">+ Confirmations</button><button class="btn btn-sm btn-ghost" data-action="unmark-flight" data-id="${ev.id}">Remove flight</button></span>` : ''}</div>
    <div class="ledger" style="margin-top:8px;">
      <div class="ledger-row"><span>Airline</span><span class="amt">${esc(f.airline)}</span></div>
      ${f.flightNumber?`<div class="ledger-row"><span>Flight #</span><span class="amt">${esc(f.flightNumber)}</span></div>`:''}
      <div class="ledger-row"><span>Confirmation</span><span class="amt">${esc(f.confirmation)}</span></div>
      <div class="ledger-row"><span>Depart</span><span class="amt">${esc(fmtFlightDateTime(f.depart))}</span></div>
      <div class="ledger-row"><span>Arrive</span><span class="amt">${esc(fmtFlightDateTime(f.arrive))}</span></div>
      ${f.notes?`<div class="ledger-row"><span>Notes</span><span class="amt">${esc(f.notes)}</span></div>`:''}
    </div>
    ${trackable? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="u-label">Flight Tracking</span>
          ${f.trackingStatus? `<span class="pill pill-good">${esc(f.trackingStatus)}</span>` : `<span class="pill pill-neutral">Not checked yet</span>`}
        </div>
        ${isAdmin? `<button class="btn btn-sm" data-action="check-flight-status" data-id="${ev.id}" ${checking?'disabled':''} style="min-width:118px;justify-content:center;">${checking? markLoader(12) : 'Check for Update'}</button>` : ''}
      </div>
      ${f.trackingStatusAt? `<div style="font-size:11px;color:var(--ink-3);margin-top:6px;">Last checked ${new Date(f.trackingStatusAt).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})} — emailed to ${esc(artistById(ev.artistId).name)} in an ASP-branded update.</div>` : ''}
    </div>` : ''}
  </div>`;
}
function renderGroundTransportBlock(ev, isAdmin){
  if(!ev.groundTransportNeeded) return isAdmin ? `<button class="btn btn-ghost" data-action="toggle-ground-transport" data-id="${ev.id}" style="justify-content:flex-start;color:var(--ink-2);">${ICO.checkSquare} Mark ground transport needed</button>` : '';
  if(!ev.groundTransportBooked){
    if(!isAdmin) return '';
    return `<div class="card card-pad" style="border-color:var(--warn);background:var(--warn-wash);">
      <div style="display:flex;align-items:center;gap:8px;color:var(--warn-ink);font-weight:700;font-size:13px;">${ICO.car} Driver needed — not booked yet</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
        <button class="btn btn-sm" data-action="open-transport-form" data-id="${ev.id}">Add driver info</button>
        <button class="btn btn-sm btn-ghost" data-action="unmark-ground-transport" data-id="${ev.id}">Not needed</button>
      </div>
    </div>`;
  }
  const g = ev.groundTransport;
  return `<div class="card card-pad">
    <div style="display:flex;align-items:center;gap:8px;font-weight:700;font-size:13px;color:var(--good-ink);">${ICO.car} Driver booked
      ${isAdmin? `<button class="btn btn-sm btn-ghost" style="margin-left:auto;" data-action="unmark-ground-transport" data-id="${ev.id}">Remove driver</button>` : ''}</div>
    <div class="ledger" style="margin-top:8px;">
      <div class="ledger-row"><span>Driver</span><span class="amt">${esc(g.driverName)}</span></div>
      <div class="ledger-row"><span>Phone</span><span class="amt">${esc(g.driverPhone)}</span></div>
      <div class="ledger-row"><span>Pickup</span><span class="amt">${esc(fmtFlightDateTime(g.pickupTime))} · ${esc(g.pickupLocation)}</span></div>
      <div class="ledger-row"><span>Drop-off</span><span class="amt">${esc(fmtFlightDateTime(g.dropoffTime))} · ${esc(g.dropoffLocation)}</span></div>
      ${g.notes?`<div class="ledger-row"><span>Notes</span><span class="amt">${esc(g.notes)}</span></div>`:''}
    </div>
  </div>`;
}

// Admin-only: additional artists don't yet appear in their own eventsFor() gig list or get
// per-artist RLS-scoped visibility on this shared event -- that needs events synced to Supabase
// (event_artists + its RLS policy already exist from migration 0012) which hasn't happened yet
// (215 real imported events, its own careful follow-up per the ops automation spec). Showing this
// roster admin-only avoids a client-side-only "privacy" gate that isn't real access control.
function renderAdditionalArtistsRoster(ev){
  const rows = (ev.additionalArtists||[]).map(x=>{
    const a = artistById(x.artistId);
    return `<div class="ledger-row"><span>${esc(a?a.name:x.artistId)}</span><span class="amt">${money(x.feeAmount)} fee &middot; ${money(x.netAmount)} net</span></div>`;
  }).join('');
  return `<div class="card card-pad" style="display:flex;flex-direction:column;gap:6px;">
    <h3 style="font-size:12.5px;margin:0;color:var(--ink-2);">Additional Artists</h3>
    ${rows}
    <p style="font-size:11px;color:var(--ink-3);margin:2px 0 0;">Not yet visible on their own gig lists -- pending the events-to-Supabase migration.</p>
  </div>`;
}
// Office price breakdown. Artists see renderArtistMoneyCard instead.
// Set / change the artist's fee right on the price breakdown (owner 2026-10-14: "once a gig is
// created i need to be able to add a fee"). Same rule as the Edit form: ASP's fee follows the new
// price at the artist's own rate.
function doSaveGigFee(id){
  const ev = getEvent(id); if(!ev) return;
  const price = Math.max(0, Number(S.gigFeeForm.price)||0);
  const commission = standardCommission(price, ev.artistId);
  if(price!==ev.price) logEvent(ev, 'system', `Performance fee ${ev.price? `changed from ${money(ev.price)} to` : 'set to'} ${money(price)}.`);
  S.editFeeEventId=null; S.gigFeeForm={};
  if(reportEventSave(updateEvent(id, { price, commission }), 'saving the fee')) toast('Fee saved.', 'success');
  openEvent(id);
}
// Client contact card (owner 2026-10-15: "contact info should be clickable and open a contact page"):
// call, WhatsApp, email or copy in one tap; Edit opens the gig's edit form for the details.
function renderClientContactModal(){
  const ev = getEvent(S.clientContactEventId); if(!ev) return '';
  const phoneDigits = telHref(ev.clientPhone||'').replace(/^\+/,'');
  const wa = phoneDigits ? `https://wa.me/${phoneDigits.length===10 ? '1'+phoneDigits : phoneDigits}` : '';
  const row = (label, value, links)=>`<div style="padding:10px 0;border-bottom:1px solid var(--border);">
      <div class="u-label" style="margin-bottom:4px;">${label}</div>
      ${value? `<div style="font-size:14px;font-weight:600;overflow-wrap:anywhere;">${esc(value)}</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;">${links}</div>` : `<div style="font-size:13px;color:var(--ink-3);">Not added yet</div>`}
    </div>`;
  return `<div class="overlay center" data-action="client-contact-overlay-close">
    <div class="modal" data-stop style="width:420px;">
      <div class="sheet-head"><h2 style="font-size:1.2rem;">${esc(ev.clientName||'Client')}</h2><button class="icon-btn" data-action="close-client-contact" aria-label="Close">${ICO.x}</button></div>
      <div class="sheet-body">
        <div style="font-size:12px;color:var(--ink-3);">${esc(ev.type||'')} &middot; ${esc(fmtDate(ev.date))}${ev.venue?` &middot; ${esc(ev.venue)}`:''}</div>
        ${row('Phone', ev.clientPhone, `<a class="btn btn-sm btn-primary" href="tel:${esc(telHref(ev.clientPhone||''))}" data-action="external-link">Call</a>
          ${wa? `<a class="btn btn-sm" href="${esc(wa)}" target="_blank" rel="noopener" data-action="external-link">WhatsApp</a>` : ''}
          <a class="btn btn-sm" href="sms:${esc(telHref(ev.clientPhone||''))}" data-action="external-link">Text</a>
          <button class="btn btn-sm btn-ghost" data-action="copy-text" data-value="${esc(ev.clientPhone||'')}">Copy</button>`)}
        ${row('Email', ev.clientEmail, `<a class="btn btn-sm btn-primary" href="mailto:${esc(ev.clientEmail||'')}" data-action="external-link">Email</a>
          <button class="btn btn-sm btn-ghost" data-action="copy-text" data-value="${esc(ev.clientEmail||'')}">Copy</button>`)}
        <button class="btn btn-block" style="margin-top:12px;" data-action="edit-client-contact" data-id="${ev.id}">${ICO.edit} Edit contact details</button>
      </div>
    </div>
  </div>`;
}
function renderLedger(ev, opts={}){
  const extras = ev.charges||[];
  const extrasSum = chargesTotal(ev);
  const total = ev.price + extrasSum;
  const artistTotal = artistPayout(ev);
  const compact = !!opts.compact;
  return `<div class="card card-pad" style="${compact?'padding:12px 14px;':''}">
    <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:6px;">
      <div class="u-label">Price Breakdown</div>
      <button class="btn btn-sm btn-ghost" data-action="toggle-add-charge" data-id="${ev.id}" style="padding:2px 6px;">${S.showAddCharge?'Cancel':'+ Additional fee'}</button>
    </div>
    <div class="ledger" style="${compact?'font-size:11.5px;':''}">
      ${S.editFeeEventId===ev.id
        ? `<div class="ledger-row" data-form="gigfee" style="gap:8px;align-items:center;"><span>Performance Fee</span>
            <span style="display:flex;gap:6px;align-items:center;"><input type="number" data-field="price" value="${esc(String(S.gigFeeForm.price ?? (ev.price||'')))}" placeholder="4500" style="width:110px;"/>
            <button class="btn btn-sm btn-primary" data-action="save-gig-fee" data-id="${ev.id}">Save</button><button class="btn btn-sm btn-ghost" data-action="cancel-gig-fee">Cancel</button></span></div>`
        : `<div class="ledger-row"><span>Performance Fee</span><span class="amt">${ev.price? money(ev.price) : ''} <button class="btn btn-sm ${ev.price?'btn-ghost':'btn-primary'}" style="padding:2px 8px;margin-left:6px;" data-action="edit-gig-fee" data-id="${ev.id}">${ev.price?'Edit':'Add fee'}</button></span></div>`}
      ${extras.map(c=>`<div class="ledger-row"><span>${esc(c.label)}${c.addedAfterSigning?` <span class="pill pill-warn" style="padding:1px 6px;font-size:9px;vertical-align:1px;">notify client</span>`:''} <a href="#" data-action="remove-charge" data-id="${ev.id}" data-chargeid="${c.id}" style="color:var(--crit);text-decoration:none;margin-left:4px;">×</a></span><span class="amt">${money(c.amount)}</span></div>`).join('')}
      ${S.showAddCharge? renderAddChargeRow(ev) : ''}
      <div class="ledger-row"><span>Total charged to client</span><span class="amt">${money(total)}</span></div>
      <div class="ledger-row"><span>ASP booking fee ${ev.depositReceived?'· received':`· due via ${esc(paymentMethodLabel(ev))}`}</span><span class="amt">${money(ev.commission)}</span></div>
      <div class="ledger-row total"><span>Artist payout (85% + charges, via Zelle)</span><span class="amt">${money(artistTotal)}</span></div>
      <div class="ledger-row"><span>Balance status</span><span class="amt">${ev.balanceReceived? `Received ${fmtDateShort(ev.balanceReceivedDate)}` : (ev.depositReceived? (isStandardPayment(ev)?'Pending — reminders active':'Pending — follow up directly'):'—')}</span></div>
      ${renderBalanceOnlineRow(ev)}
    </div>
  </div>`;
}

// The balance paid online (or paying: a bank transfer clearing), or the office's "Balance pay link"
// button when one can be made. Nothing when online payments or the payee's payouts aren't set up.
function renderBalanceOnlineRow(ev){
  const r = balanceOnlinePayment(ev);
  if(r){
    const label = r.pay_status==='processing' ? `Bank transfer processing (started ${fmtDateShort(String(r.processing_at||r.created_at).slice(0,10))})`
      : `Paid online — ${esc(paidOnlineText(r))}${r.pay_status==='refunded'?' — since refunded':r.pay_status==='disputed'?' — disputed, check Stripe':''}`;
    return `<div class="ledger-row"><span class="pill pill-wrap ${r.pay_status==='paid'||r.pay_status==='processing'?'pill-good':'pill-warn'}" data-testid="balance-online-payment">${label}</span></div>`;
  }
  if(balancePayBlocker(ev)) return '';
  const link = (S.payLinks||{})[ev.id];
  return `<div class="ledger-row"><span>Balance online (to the artist)</span><span class="amt"><button class="btn btn-sm btn-ghost" data-action="make-balance-pay-link" data-id="${ev.id}" ${S.payLinkBusy===ev.id?'disabled':''}>${S.payLinkBusy===ev.id?'Making link…':'Balance pay link'}</button></span></div>
    ${link?`<input readonly value="${esc(link)}" data-testid="balance-pay-link" style="width:100%;font-size:12px;" onfocus="this.select()"/>`:''}`;
}
// The artist's own money on a gig: gig amount, ASP fee at this gig's percentage, what they receive.
function renderArtistMoneyCard(ev){
  const m = artistMoney(ev);
  return `<div class="card card-pad" style="padding:12px 14px;">
    <div class="u-label" style="margin-bottom:6px;">Your Money</div>
    ${m.pending ? `<p style="font-size:12.5px;color:var(--ink-2);margin:0;">Amount being confirmed — the office is finalizing your share for this gig.</p>` : `<div class="ledger" style="font-size:11.5px;">
      <div class="ledger-row"><span>Gig amount</span><span class="amt">${money(m.gross)}</span></div>
      <div class="ledger-row"><span>ASP fee${m.pct!=null ? ` ${esc(fmtPct(m.pct))}` : ''}</span><span class="amt">${money(m.cut)}</span></div>
      <div class="ledger-row total"><span>You receive</span><span class="amt">${money(m.net)}</span></div>
      <div class="ledger-row"><span>Status</span><span class="amt">${esc(artistGigStatus(ev).label)}</span></div>
    </div>`}
  </div>`;
}
// tel: links take digits and a leading + only (an "ext. 12" suffix is dropped).
function telHref(phone){ return String(phone||'').split(/ext|x|#/i)[0].replace(/[^\d+]/g,''); }

function renderAddChargeRow(ev){
  const f = S.addChargeForm;
  return `<div data-form="charge" style="display:flex; gap:6px; padding:8px 0; border-bottom:1px dashed var(--border); align-items:flex-end; flex-wrap:wrap;">
    <div class="field" style="flex:1;min-width:120px;"><label>Type</label>
      <select data-charge-preset>${CHARGE_PRESETS.map(p=>`<option ${f.preset===p?'selected':''}>${p}</option>`).join('')}</select>
    </div>
    ${(f.preset||CHARGE_PRESETS[0])==='Other'? `<div class="field" style="flex:1;min-width:100px;"><label>Label</label><input data-field="customLabel" value="${esc(f.customLabel||'')}" placeholder="Describe charge"/></div>`:''}
    <div class="field" style="width:100px;"><label>Amount</label><input type="number" data-field="amount" value="${f.amount||''}" placeholder="250"/></div>
    <button class="btn btn-sm btn-primary" data-action="confirm-add-charge" data-id="${ev.id}">Add</button>
  </div>`;
}


/* ============ GIG INFO SHEET ============ */
// Paste/write free-text gig info + a contact list (name/role/phone/email, click-to-copy),
// available from the event sheet the same place Prep Sheets is -- printable via the same
// print-host pattern as the Contract/Itinerary docs (renderItineraryDoc above).
function gigInfoSheetOf(ev){
  // Lineup + run of the night + songs added 2026-10-14 (additive: older sheets just lack them).
  return { text:'', contacts:[], choir:'', otherSingers:'', startTime:'', schedule:[], songs:[], updatedAt:null, ...(ev.gigInfoSheet||{}) };
}
const gigScheduleText = sheet=>(sheet.schedule||[]).map(r=>`${r.time? r.time+' ' : ''}${r.item}`).join('\n');
const gigSongsText = sheet=>(sheet.songs||[]).map(r=>r.moment? `${r.moment} — ${r.song}` : r.song).join('\n');
function parseGigScheduleText(t){
  return String(t||'').split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{
    const m = l.match(/^(\d{1,2}:\d{2})\s*[—–-]?\s*(.*)$/); return m ? { time:m[1].padStart(5,'0'), item:m[2] } : { time:'', item:l };
  });
}
function parseGigSongsText(t){
  return String(t||'').split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{
    const m = l.match(/^(.+?)\s+[—–-]\s+(.+)$/); return m ? { moment:m[1], song:m[2] } : { moment:'', song:l };
  });
}
function gigLineupRows(ev, sheet){
  return [['Band', ev.band? `${ev.band}${ev.bandSize?` (${ev.bandSize} piece${Number(ev.bandSize)===1?'':'s'})`:''}` : ''],
          ['Choir', sheet.choir], ['Other singers', sheet.otherSingers], ['Artist starts', sheet.startTime? fmtTime(sheet.startTime) : '']]
    .filter(([,v])=>v);
}
// Drop-in (owner 2026-10-14): the band's message or file -> parse-gig-info (Claude) -> the form.
// Nothing is saved until the office presses Save.
async function doBuildGigSheet(){
  const f = S.gigInfoForm;
  const text = (f.dropText||'').trim();
  if(!text && !S.gigInfoFile){ toast("Paste the band's info or attach their file first.", 'system'); return; }
  S.gigInfoBusy = true; render();
  try{
    const res = await callEdgeFunction('parse-gig-info', { text, file: S.gigInfoFile ? { mediaType:S.gigInfoFile.mediaType, data:S.gigInfoFile.data } : null });
    if(!res.ok){ toast(res.error || 'Could not read that.', 'system'); return; }
    fillGigFormFrom(f, res.sheet || {});
    toast('Gig sheet filled in — check it and press Save.', 'success');
  } finally {
    S.gigInfoBusy = false; render();
  }
}
// Shared by the drop-in and the Inbox's "Add to gig sheet".
function fillGigFormFrom(f, x){
    if(x.band) f.band = x.band;
    if(x.bandSize) f.bandSize = x.bandSize;
    if(x.choir) f.choir = x.choir;
    if((x.otherSingers||[]).length) f.otherSingers = x.otherSingers.join(', ');
    if(/^\d{2}:\d{2}$/.test(x.startTime||'')) f.startTime = x.startTime;
    if((x.schedule||[]).length) f.scheduleText = gigScheduleText({ schedule:x.schedule });
    if((x.songs||[]).length) f.songsText = gigSongsText({ songs:x.songs });
    if(x.notes) f.text = [f.text, x.notes].filter(Boolean).join('\n');
    f.newContacts = (x.contacts||[]).filter(c=>c.name||c.phone||c.email);
}

function renderContactCopyRow(c, ev){
  return `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:1px dashed var(--border);font-size:12.5px;">
    <span style="flex:1;min-width:0;"><strong>${esc(c.name)}</strong>${c.role?` <span style="color:var(--ink-3);">· ${esc(c.role)}</span>`:''}</span>
    <span style="display:flex;gap:6px;flex:none;">
      ${c.phone? `<button class="btn btn-sm btn-ghost" data-action="copy-text" data-value="${esc(c.phone)}" title="Copy phone">${esc(c.phone)}</button>`:''}
      ${c.email? `<button class="btn btn-sm btn-ghost" data-action="copy-text" data-value="${esc(c.email)}" title="Copy email">${esc(c.email)}</button>`:''}
    </span>
  </div>`;
}
// One "Gig Info" section (owner 2026-10-13: "gig info and prep sheet is the same thing"): the notes,
// the contact list and the uploaded files are all the gig's info. Stored as before -- notes/contacts
// in ev.gigInfoSheet, files in ev.prepSheets[] -- only the presentation is merged.
function renderPrepAndGigInfoCard(ev, isAdmin){
  const sheet = gigInfoSheetOf(ev);
  const files = ev.prepSheets||[];
  const lineup = gigLineupRows(ev, sheet);
  const hasNotes = !!(sheet.text || (sheet.contacts||[]).length || lineup.length || (sheet.schedule||[]).length || (sheet.songs||[]).length);
  const canNote = isAdmin && !ev.unpaid;
  return `<div class="card card-pad">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
      <div class="u-label">Gig Info</div>
      ${isAdmin? (canNote
        ? `<button class="btn btn-sm btn-ghost" data-action="open-giginfo-form" data-id="${ev.id}" style="padding:2px 6px;">${hasNotes||files.length?'Edit / upload docs':'+ Upload docs'}</button>`
        : `<label class="btn btn-sm btn-ghost" style="cursor:pointer;display:inline-flex;padding:2px 6px;">+ Upload docs<input type="file" data-action="upload-prep" data-id="${ev.id}" multiple style="display:none;"/></label>`) : ''}
    </div>
    ${!hasNotes && !files.length? `<p style="font-size:12.5px;color:var(--ink-3);margin:0;">No gig info yet.</p>` : ''}
    ${lineup.length? `<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px;">${lineup.map(([k,v])=>`<div class="kv-row"><span style="color:var(--ink-2);">${esc(k)}</span><strong style="text-align:right;">${esc(v)}</strong></div>`).join('')}</div>` : ''}
    ${(sheet.schedule||[]).length? `<div class="u-label" style="margin:6px 0 4px;">Run of the night</div><div style="font-size:12.5px;margin-bottom:10px;">${sheet.schedule.map(r=>`<div><span class="u-mono" style="color:var(--ink-3);display:inline-block;min-width:62px;">${r.time? esc(fmtTime(r.time)) : ''}</span>${esc(r.item)}</div>`).join('')}</div>` : ''}
    ${(sheet.songs||[]).length? `<div class="u-label" style="margin:6px 0 4px;">Songs</div><div style="font-size:12.5px;margin-bottom:10px;">${sheet.songs.map(r=>`<div>${r.moment? `<span style="color:var(--ink-3);">${esc(r.moment)}:</span> ` : ''}${esc(r.song)}</div>`).join('')}</div>` : ''}
    ${sheet.text? `<p style="font-size:12.5px;color:var(--ink);white-space:pre-wrap;margin:0 0 10px;">${esc(sheet.text)}</p>` : ''}
    ${(sheet.contacts||[]).length? `<div style="margin-bottom:10px;">${sheet.contacts.map(c=>renderContactCopyRow(c, ev)).join('')}</div>` : ''}
    ${files.length? `<div class="log" style="margin-bottom:10px;">${files.map(f=>`
      <div class="log-item" style="align-items:center;">
        <span class="log-ico">${ICO.leads}</span>
        <span style="flex:1;min-width:0;overflow-wrap:anywhere;">${esc(f.name)}<div class="log-time">Added ${fmtDateShort(f.uploadedAt)}</div></span>
        <a href="${safeDataUrl(f.dataUrl)}" target="_blank" rel="noopener" class="btn btn-sm">View</a>
        ${isAdmin?`<button class="icon-btn" data-action="remove-prep" data-id="${ev.id}" data-prepid="${f.id}" title="Remove" aria-label="Remove ${esc(f.name)}">${ICO.x}</button>`:''}
      </div>`).join('')}</div>` : ''}
    ${hasNotes? `<button class="btn btn-sm" data-action="view-giginfo" data-id="${ev.id}">${ICO.leads} View / Print</button>
      ${sheet.updatedAt? `<span style="font-size:10.5px;color:var(--ink-3);margin-left:8px;">Updated ${fmtDateShort(sheet.updatedAt)}</span>`:''}` : ''}
  </div>`;
}
function renderGigInfoFormOverlay(){
  const ev = getEvent(S.eventId); if(!ev) return '';
  const sheet = gigInfoSheetOf(ev);
  const f = S.gigInfoForm;
  const contacts = sheet.contacts||[];
  const cf = S.newGigContactForm;
  return `<div class="overlay center" data-action="giginfo-overlay-close">
    <div class="modal" data-stop data-form="giginfo" style="width:480px;">
      <div class="sheet-head"><h2 style="font-size:1.2rem;">Gig Info</h2><button class="icon-btn" data-action="close-giginfo-form" aria-label="Close">${ICO.x}</button></div>
      <div class="sheet-body">
        <div class="card card-pad" style="display:flex;flex-direction:column;gap:8px;background:var(--accent-wash);">
          <div class="u-label">Drop in the band's info</div>
          <textarea data-field="dropText" rows="4" placeholder="Paste what the band or planner sent: lineup, times, songs, contacts…" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--border-strong);font:inherit;">${esc(f.dropText||'')}</textarea>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            <label class="btn btn-sm" style="cursor:pointer;">${S.gigInfoFile? esc(S.gigInfoFile.name) : 'Attach PDF / screenshot'}<input type="file" data-action="giginfo-file" accept="application/pdf,image/*" style="display:none;"/></label>
            <button class="btn btn-sm btn-primary" data-action="build-gig-sheet" ${S.gigInfoBusy?'disabled':''}>${S.gigInfoBusy? 'Reading…' : 'Build sheet'}</button>
          </div>
          ${(f.newContacts||[]).length? `<p style="font-size:11.5px;color:var(--ink-3);margin:0;">${f.newContacts.length} contact${f.newContacts.length===1?'':'s'} found — added when you save.</p>` : ''}
        </div>
        <div class="field-row">
          <div class="field"><label>Band</label><input data-field="band" value="${esc(f.band||'')}" placeholder="Band name"/></div>
          <div class="field" style="max-width:110px;"><label>Band size</label><input type="number" data-field="bandSize" value="${esc(String(f.bandSize||''))}" placeholder="8"/></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Choir</label><input data-field="choir" value="${esc(f.choir||'')}" placeholder="Choir, if any"/></div>
          <div class="field"><label>Other singers</label><input data-field="otherSingers" value="${esc(f.otherSingers||'')}" placeholder="Names, comma separated"/></div>
        </div>
        <div class="field" style="max-width:180px;"><label>Artist starts</label><input type="time" data-field="startTime" value="${esc(f.startTime||'')}"/></div>
        <div class="field"><label>Run of the night</label><textarea data-field="scheduleText" rows="4" placeholder="18:30 Kabbalas Panim&#10;19:15 Chuppah" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--border-strong);font:inherit;">${esc(f.scheduleText||'')}</textarea></div>
        <div class="field"><label>Songs</label><textarea data-field="songsText" rows="4" placeholder="Chuppah walk — Mi Adir&#10;First dance — Od Yishama" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--border-strong);font:inherit;">${esc(f.songsText||'')}</textarea></div>
        <div class="field"><label>Notes</label>
          <textarea data-field="text" rows="4" placeholder="Anything else the artist needs — sound check, meal, dress, parking..." style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--border-strong);font:inherit;">${esc(f.text!==undefined?f.text:sheet.text)}</textarea>
        </div>
        <div class="field">
          <label>Contacts</label>
          ${contacts.length? `<div style="margin-bottom:8px;">${contacts.map(c=>`
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12.5px;padding:4px 0;">
              <span>${esc(c.name)}${c.role?` · ${esc(c.role)}`:''} ${c.phone?`— ${esc(c.phone)}`:''} ${c.email?`— ${esc(c.email)}`:''}</span>
              <button class="icon-btn" data-action="remove-gig-contact" data-id="${ev.id}" data-contactid="${c.id}" title="Remove" style="width:20px;height:20px;" aria-label="Remove">${ICO.x}</button>
            </div>`).join('')}</div>` : ''}
          <div data-form="gigcontact" style="display:flex; gap:6px; padding:8px 0; border-top:1px dashed var(--border); align-items:flex-end; flex-wrap:wrap;">
            <div class="field" style="flex:1;min-width:100px;"><label style="font-size:10px;">Name</label><input data-field="name" value="${esc(cf.name||'')}" placeholder="Venue coordinator"/></div>
            <div class="field" style="flex:1;min-width:100px;"><label style="font-size:10px;">Role</label><input data-field="role" value="${esc(cf.role||'')}" placeholder="Optional"/></div>
            <div class="field" style="flex:1;min-width:110px;"><label style="font-size:10px;">Phone</label><input data-field="phone" value="${esc(cf.phone||'')}" placeholder="(555) 555-5555"/></div>
            <div class="field" style="flex:1;min-width:130px;"><label style="font-size:10px;">Email</label><input data-field="email" value="${esc(cf.email||'')}" placeholder="name@example.com"/></div>
            <button class="btn btn-sm" data-action="add-gig-contact" data-id="${ev.id}">+ Add</button>
          </div>
        </div>
        <button class="btn btn-primary btn-block" data-action="save-giginfo" data-id="${ev.id}" style="margin-top:6px;">Save</button>
      </div>
    </div>
  </div>`;
}
// The ASP gig sheet (owner 2026-10-14): what the artist needs on the day, branded like the contract.
function gigSheetDocHtml(ev){
  const artist = artistById(ev.artistId) || {name:''};
  const sheet = gigInfoSheetOf(ev);
  const lineup = gigLineupRows(ev, sheet);
  const mute = '#6B6B72', accent = '#5B78A8';
  const label = t=>`<div style="font-size:10.5px;letter-spacing:.22em;text-transform:uppercase;color:${accent};font-weight:700;margin:22px 0 8px;padding-bottom:6px;border-bottom:2px solid #17171A;">${t}</div>`;
  const cell = 'padding:7px 12px 7px 0;border:none;border-bottom:1px solid #E3E3E8;background:none;font-size:12.5px;vertical-align:top;';
  const where = [ev.venue, ev.address, [ev.city, ev.state].filter(Boolean).join(', ')].filter(Boolean).join(', ');
  const facts = [['Date', ev.date? fmtDate(ev.date) : 'TBD'], ['Time', fmtTimeRange(ev.time, ev.endTime)], ['Venue', where || 'TBD'], ...lineup];
  const empty = !lineup.length && !(sheet.schedule||[]).length && !(sheet.songs||[]).length && !sheet.text && !(sheet.contacts||[]).length;
  return `<div style="background:#fff;color:#17171A;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.55;">
    ${aspDocHeaderHtml({ light:true, kicker:'GIG SHEET', title:esc(artist.name), subtitle:[esc(ev.type||''), ev.unpaid? '' : esc(ev.clientName||''), ev.date? esc(fmtDateShort(ev.date)) : ''].filter(Boolean).join(' &middot; ') })}
    <table role="presentation" style="border-collapse:collapse;width:100%;margin-top:6px;border:none;background:none;">
      ${facts.map(([k,v])=>`<tr><td style="${cell}color:${mute};white-space:nowrap;width:130px;">${esc(k)}</td><td style="${cell}font-weight:700;">${esc(v)}</td></tr>`).join('')}
    </table>
    ${(sheet.schedule||[]).length? `${label('Run of the night')}<table role="presentation" style="border-collapse:collapse;width:100%;border:none;background:none;">${sheet.schedule.map(r=>`<tr><td style="${cell}color:${mute};white-space:nowrap;width:90px;">${r.time? esc(fmtTime(r.time)) : ''}</td><td style="${cell}">${esc(r.item)}</td></tr>`).join('')}</table>` : ''}
    ${(sheet.songs||[]).length? `${label('Songs')}<table role="presentation" style="border-collapse:collapse;width:100%;border:none;background:none;">${sheet.songs.map(r=>`<tr><td style="${cell}color:${mute};width:180px;">${esc(r.moment||'')}</td><td style="${cell}font-weight:700;">${esc(r.song)}</td></tr>`).join('')}</table>` : ''}
    ${sheet.text? `${label('Notes')}<p style="font-size:12.5px;white-space:pre-wrap;margin:0;">${esc(sheet.text)}</p>` : ''}
    ${(sheet.contacts||[]).length? `${label('Contacts')}<table role="presentation" style="border-collapse:collapse;width:100%;border:none;background:none;">${sheet.contacts.map(c=>`<tr><td style="${cell}font-weight:700;">${esc(c.name)}${c.role?` <span style="color:${mute};font-weight:400;">(${esc(c.role)})</span>`:''}</td><td style="${cell}">${esc(c.phone||'')}${c.phone&&c.email?' &middot; ':''}${esc(c.email||'')}</td></tr>`).join('')}</table>` : ''}
    ${empty? `<p style="font-size:13px;color:${mute};margin-top:16px;">No gig info added yet.</p>` : ''}
    <div style="margin-top:22px;padding-top:10px;border-top:1px solid #E3E3E8;font-size:10.5px;color:${mute};">ASP Management${getBrandConfig('asp').phone? ` &middot; ${esc(getBrandConfig('asp').phone)}` : ''}</div>
  </div>`;
}
function renderGigInfoDoc(){
  const ev = getEvent(S.gigInfoDocEventId); if(!ev) return '';
  const artist = artistById(ev.artistId);
  const sheet = gigInfoSheetOf(ev);
  return `<div class="overlay center" data-action="giginfo-doc-overlay-close">
    <div class="doc" data-stop>
      <div class="sheet-head">
        <h2 style="font-size:1.1rem;">Gig Info</h2>
        <div style="display:flex;gap:6px;">
          <button class="icon-btn" data-action="print-giginfo" title="Print / Save as PDF" aria-label="Print / Save as PDF"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-2"/><rect x="6" y="14" width="12" height="7"/></svg></button>
          <button class="icon-btn" data-action="close-giginfo-doc" aria-label="Close">${ICO.x}</button>
        </div>
      </div>
      <div class="doc-body">${gigSheetDocHtml(ev)}</div>
    </div>
  </div>`;
}


function renderAdminActions(ev){
  const buttons=[];
  if(ev.status==='lead'||ev.status==='negotiating'){
    // (The contract lives in the Contracts card -- one place to create, view and send it; owner 2026-10-15.)
    // Confirming without the contract / deposit steps (owner 2026-10-29: "a button to confirm a gig that's
    // currently a new lead as an admin"): it becomes Booked; the deposit is still owed and tracked.
    buttons.push(`<button class="btn btn-primary btn-block" data-action="confirm-lead" data-id="${ev.id}" data-testid="confirm-lead">${ICO.check} Confirm Booking</button>`);
  }
  if(ev.status==='contract_sent'){
    buttons.push(`<button class="btn btn-primary btn-block" data-action="mark-deposit" data-id="${ev.id}">${ICO.check} Mark Booking Fee Received — Lock In Booking</button>`);
    buttons.push(`<button class="btn btn-sm btn-ghost btn-block" data-action="open-verify-deposit" data-id="${ev.id}">${ICO.check} Verify Deposit &amp; Confirm (audited)</button>`);
  }
  if(ev.status==='booked' && !ev.balanceReceived){
    const standard = isStandardPayment(ev);
    buttons.push(`<div class="card card-pad" style="display:flex;flex-direction:column;gap:10px;">
      <div class="u-label">Balance ${standard?'Reminders — Email + Text':`— ${esc(paymentMethodLabel(ev))}`}</div>
      ${standard? `<div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;">
        <span>Remind every</span>
        <select data-action="set-reminder-interval" data-id="${ev.id}" style="padding:6px 8px;border-radius:6px;border:1px solid var(--border-strong);background:var(--surface);">
          ${[3,5,7,10,14].map(n=>`<option value="${n}" ${ev.reminderIntervalDays===n?'selected':''}>${n} days</option>`).join('')}
        </select>
      </div>
      <div style="font-size:12px;color:var(--ink-2);">Last sent: ${ev.lastReminderSent? fmtDateShort(ev.lastReminderSent): 'never'}</div>` : `
      <div style="font-size:12px;color:var(--warn-ink);">Alternative payment method — no automated reminder. Follow up directly; this booking also shows under Payment Follow-Up on the Daily Digest.</div>`}
      <div style="display:flex;gap:8px;">
        ${standard? `<button class="btn btn-sm" data-action="send-reminder" data-id="${ev.id}" style="flex:1;min-width:0;white-space:normal;">Send reminder now</button>` : ''}
        <button class="btn btn-sm btn-primary" data-action="mark-balance" data-id="${ev.id}" style="flex:1;min-width:0;white-space:normal;">${ICO.check} Mark Balance Received</button>
      </div>
      ${standard? `<button class="btn btn-sm btn-ghost" data-action="preview-reminder" data-id="${ev.id}" style="color:var(--ink-2);">${ICO.sms} Preview reminder email (Zelle QR)</button>` : ''}
    </div>`);
  }
  return buttons.length? `<div style="display:flex;flex-direction:column;gap:10px;">${buttons.join('')}</div>` : '';
}

// Flight Info from a confirmation (owner 2026-10-15): drop in the PDF or a photo, parse-travel-docs reads
// it, and the first flight fills the form for the office to check before Save.
async function doFillFlightFormFromFile(file){
  if(file.size > 5*1024*1024){ toast('That file is too big (5 MB max).', 'system'); return; }
  const data = await new Promise(res=>{ const r = new FileReader(); r.onload = ()=>{ const u = String(r.result||''); res(u.slice(u.indexOf(',')+1)); }; r.readAsDataURL(file); });
  S.flightFileBusy = true; render();
  try{
    const res = await callEdgeFunction('parse-travel-docs', { text:'', files:[{ mediaType:file.type, data }] });
    const fl = res.ok && (res.travel.flights||[])[0];
    if(!fl){ toast(res.ok ? 'No flight found in that file.' : (res.error||'Could not read that file.'), 'system'); return; }
    const [dd, dt] = String(fl.departAt||'').split('T'), [ad, at] = String(fl.arriveAt||'').split('T');
    Object.assign(S.flightForm, { airline:fl.airline||'', flightNumber:(fl.flightNumber||'').replace(/\s+/g,''), confirmation:fl.confirmation||'',
      departDate:dd||'', departTime:(dt||'').slice(0,5), arriveDate:ad||'', arriveTime:(at||'').slice(0,5) });
    toast('Filled from the confirmation — check it and press Save.', 'success');
  } finally {
    S.flightFileBusy = false; render();
  }
}
function renderFlightFormOverlay(){
  const ev = getEvent(S.eventId); if(!ev) return '';
  const f = S.flightForm;
  return `<div class="overlay center" data-action="flight-overlay-close">
    <div class="modal" data-stop data-form="flight" style="width:420px;">
      <div class="sheet-head"><h2 style="font-size:1.2rem;">Flight Info</h2><button class="icon-btn" data-action="close-flight-form" aria-label="Close">${ICO.x}</button></div>
      <div class="sheet-body">
        <label class="drop-zone ${S.flightFileBusy?'busy':''}" data-drop="flight" data-testid="flight-drop">${ICO.upload}<strong>${S.flightFileBusy? 'Reading the confirmation…' : 'Drop the flight confirmation here'}</strong><span>PDF or screenshot · or tap to choose · fills the form for you to check</span><input type="file" data-action="flight-form-file" accept="application/pdf,image/*" style="display:none;" ${S.flightFileBusy?'disabled':''}/></label>
        <div class="field"><label>Airline</label><input data-field="airline" value="${esc(f.airline||'')}" placeholder="Delta"/></div>
        <div class="field-row">
          <div class="field"><label>Flight #</label><input data-field="flightNumber" value="${esc(f.flightNumber||'')}" placeholder="DL1234"/></div>
          <div class="field"><label>Confirmation #</label><input data-field="confirmation" value="${esc(f.confirmation||'')}" placeholder="CNF1234"/></div>
        </div>
        <p style="font-size:11px;color:var(--ink-3);margin:-2px 0 4px;">Flight # or confirmation # enables live flight tracking — the artist gets ASP-branded status updates through the app.</p>
        <div class="u-label" style="margin-top:4px;">Departure</div>
        <div class="field-row">
          <div class="field"><label>Date</label><input type="date" data-field="departDate" value="${f.departDate||''}"/></div>
          <div class="field"><label>Time</label><input type="time" data-field="departTime" value="${f.departTime||''}"/></div>
        </div>
        <div class="u-label" style="margin-top:4px;">Arrival</div>
        <div class="field-row">
          <div class="field"><label>Date</label><input type="date" data-field="arriveDate" value="${f.arriveDate||''}"/></div>
          <div class="field"><label>Time</label><input type="time" data-field="arriveTime" value="${f.arriveTime||''}"/></div>
        </div>
        <button class="btn btn-primary btn-block" data-action="save-flight" data-id="${ev.id}">Save</button>
      </div>
    </div>
  </div>`;
}

function renderTransportFormOverlay(){
  const ev = getEvent(S.eventId); if(!ev) return '';
  const f = S.transportForm;
  return `<div class="overlay center" data-action="transport-overlay-close">
    <div class="modal" data-stop data-form="transport" style="width:420px;">
      <div class="sheet-head"><h2 style="font-size:1.2rem;">Ground Transport Info</h2><button class="icon-btn" data-action="close-transport-form" aria-label="Close">${ICO.x}</button></div>
      <div class="sheet-body">
        <div class="field"><label>Driver Name</label><input data-field="driverName" value="${esc(f.driverName||'')}" placeholder="Yossi K."/></div>
        <div class="field"><label>Driver Phone</label><input data-field="driverPhone" value="${esc(f.driverPhone||'')}" placeholder="(347) 555-1234"/></div>
        <div class="u-label" style="margin-top:4px;">Pickup</div>
        <div class="field-row">
          <div class="field"><label>Date</label><input type="date" data-field="pickupDate" value="${f.pickupDate||''}"/></div>
          <div class="field"><label>Time</label><input type="time" data-field="pickupTime" value="${f.pickupTime||''}"/></div>
        </div>
        <div class="field"><label>Pickup Location</label><input data-field="pickupLocation" value="${esc(f.pickupLocation||'')}" placeholder="Airport / home"/></div>
        <div class="u-label" style="margin-top:4px;">Drop-off</div>
        <div class="field-row">
          <div class="field"><label>Date</label><input type="date" data-field="dropoffDate" value="${f.dropoffDate||''}"/></div>
          <div class="field"><label>Time</label><input type="time" data-field="dropoffTime" value="${f.dropoffTime||''}"/></div>
        </div>
        <div class="field"><label>Drop-off Location</label><input data-field="dropoffLocation" value="${esc(f.dropoffLocation||'')}" placeholder="Venue"/></div>
        <div class="field"><label>Notes</label><input data-field="notes" value="${esc(f.notes||'')}" placeholder="Sedan, one-way"/></div>
        <button class="btn btn-primary btn-block" data-action="save-transport" data-id="${ev.id}">Save</button>
      </div>
    </div>
  </div>`;
}

function renderDressCodeFormOverlay(){
  const ev = getEvent(S.eventId); if(!ev) return '';
  const f = S.dressCodeForm;
  return `<div class="overlay center" data-action="dresscode-overlay-close">
    <div class="modal" data-stop data-form="dresscode" style="width:380px;">
      <div class="sheet-head"><h2 style="font-size:1.2rem;">Dress Code</h2><button class="icon-btn" data-action="close-dresscode-form" aria-label="Close">${ICO.x}</button></div>
      <div class="sheet-body">
        <div class="field"><label>Dress Code</label><input data-field="dressCode" value="${esc(f.dressCode||'')}" placeholder="e.g. Black tie, all black"/></div>
        <div class="chip-row">${DRESS_CODES.map(d=>`<button class="filter-chip" data-action="pick-dresscode" data-value="${esc(d)}">${esc(d)}</button>`).join('')}</div>
        <button class="btn btn-primary btn-block" data-action="save-dresscode" data-id="${ev.id}" style="margin-top:6px;">Save</button>
      </div>
    </div>
  </div>`;
}

function renderEditEventFormOverlay(){
  const ev = getEvent(S.eventId); if(!ev) return '';
  const f = S.editEventForm;
  const typeList = ev.unpaid ? INTERNAL_EVENT_TYPES : EVENT_TYPES;
  const type = f.type!==undefined? f.type : ev.type;
  return `<div class="overlay center" data-action="editevent-overlay-close">
    <div class="modal" data-stop data-form="editevent">
      <div class="sheet-head"><h2 style="font-size:1.3rem;">Edit ${ev.unpaid?'Internal Day':'Details'}</h2><button class="icon-btn" data-action="close-edit-event" aria-label="Close">${ICO.x}</button></div>
      <div class="sheet-body">
        <div class="field-row">
          ${!ev.unpaid? `<div class="field"><label>Client Name</label><input data-field="clientName" value="${esc(f.clientName!==undefined?f.clientName:(ev.clientName||''))}"/></div>`:''}
          <div class="field"><label>Event Type</label><select class="edit-event-type-select">${typeList.map(t=>`<option ${type===t?'selected':''}>${esc(t)}</option>`).join('')}${!typeList.includes(type)?`<option selected>${esc(type)}</option>`:''}</select></div>
        </div>
        ${type==='Wedding'? renderBandFieldsSection(f, ev) : ''}
        ${!ev.unpaid? `<div class="field-row">
          <div class="field"><label>Client Email</label><input data-field="clientEmail" value="${esc(f.clientEmail!==undefined?f.clientEmail:(ev.clientEmail||''))}"/></div>
          <div class="field"><label>Client Phone</label><input data-field="clientPhone" value="${esc(f.clientPhone!==undefined?f.clientPhone:(ev.clientPhone||''))}"/></div>
        </div>` : ''}
        <div class="field"><label>Date</label><input type="date" data-field="date" value="${f.date!==undefined?f.date:ev.date}"/></div>
        <div class="field-row">
          <div class="field"><label>Start Time</label><input type="time" data-field="time" value="${f.time!==undefined?f.time:ev.time}"/></div>
          <div class="field"><label>End Time</label><input type="time" data-field="endTime" value="${f.endTime!==undefined?f.endTime:(ev.endTime||'')}"/></div>
        </div>
        <div class="field"><label>Venue Name</label><input data-field="venue" list="venueList" autocomplete="off" value="${esc(f.venue!==undefined?f.venue:(ev.venue||''))}"/>${venueDatalistHtml()}</div>
        <div class="field"><label>Address</label><input data-field="address" value="${esc(f.address!==undefined?f.address:(ev.address||''))}" placeholder="Street address"/></div>
        <div class="field-row">
          <div class="field"><label>City</label><input data-field="city" value="${esc(f.city!==undefined?f.city:(ev.city||''))}"/></div>
          <div class="field"><label>State</label><input data-field="state" value="${esc(f.state!==undefined?f.state:(ev.state||''))}"/></div>
        </div>
        ${!ev.unpaid? `<div class="field"><label>Price</label><input type="number" data-field="price" value="${f.price!==undefined?f.price:ev.price}"/>
          <p style="font-size:11px;color:var(--ink-3);margin:4px 0 0;">Payout recalculates automatically if you change this. The deposit below stays as set unless you change it too.</p>
        </div>` : ''}
        ${!ev.unpaid? (()=>{
          const paymentMethod = f.paymentMethod!==undefined ? f.paymentMethod : (ev.paymentMethod||'standard');
          return `<div class="field-row">
          <div class="field"><label>Deposit / Booking Fee</label><input type="number" data-field="commission" value="${f.commission!==undefined?f.commission:ev.commission}"/></div>
          <div class="field"><label>Payment Method</label><select class="edit-event-payment-select">${PAYMENT_METHODS.map(([k,l])=>`<option value="${k}" ${paymentMethod===k?'selected':''}>${esc(l)}</option>`).join('')}</select></div>
        </div>
        ${ev.depositReceived? `<div class="field"><label>Received So Far (optional)</label><input type="number" data-field="depositPaid" value="${f.depositPaid!==undefined?f.depositPaid:(ev.depositPaid||'')}" placeholder="Leave blank if only the deposit came in"/>
          <p style="font-size:11px;color:var(--ink-3);margin:4px 0 0;">Everything the client has paid so far. It counts as the deposit, so balance reminders ask only for what's left.</p>
        </div>` : ''}
        ${paymentMethod!=='standard'? `<div class="field"><label>Payment Note (optional)</label><input data-field="paymentMethodNote" value="${esc(f.paymentMethodNote!==undefined?f.paymentMethodNote:(ev.paymentMethodNote||''))}" placeholder="e.g. paying cash at the event"/>
          <p style="font-size:11px;color:var(--warn-ink);margin:4px 0 0;">Alternative payment method — no automated QuickBooks invoice or Zelle reminder for this booking. It'll show up under Payment Follow-Up until marked paid.</p>
        </div>` : ''}`;
        })() : ''}
        <button class="btn btn-primary btn-block" data-action="save-edit-event" data-id="${ev.id}" style="margin-top:6px;">Save Changes</button>
      </div>
    </div>
  </div>`;
}

function renderNewInvoiceModal(){
  const f = S.newInvoiceForm;
  const items = f.items || [];
  const total = items.reduce((s,it)=>s+(Number(it.amount)||0),0);
  return `<div class="overlay center" data-action="overlay-close">
    <div class="modal" data-stop data-form="newinvoice" style="width:440px;">
      <div class="sheet-head"><h2 style="font-size:1.3rem;">New Invoice</h2><button class="icon-btn" data-action="close-sheet" aria-label="Close">${ICO.x}</button></div>
      <div class="sheet-body">
        <p style="font-size:12px;color:var(--ink-3);margin:0;">For anything outside a gig booking — reimbursements, merch, extra fees. Branded as ASP, not tied to a specific event.</p>
        <div class="field-row">
          <div class="field"><label>Bill To</label><input data-field="clientName" value="${esc(f.clientName||'')}" placeholder="Client or company name"/></div>
          <div class="field"><label>Email</label><input data-field="clientEmail" value="${esc(f.clientEmail||'')}" placeholder="name@example.com"/></div>
        </div>
        <div class="field">
          <label>Line Items</label>
          ${items.length? `<div class="ledger" style="margin-bottom:8px;">${items.map((it,i)=>`<div class="ledger-row"><span>${esc(it.label)} <a href="#" data-action="remove-invoice-item" data-idx="${i}" style="color:var(--crit);text-decoration:none;margin-left:4px;">×</a></span><span class="amt">${money(it.amount)}</span></div>`).join('')}</div>` : ''}
          <div style="display:flex;gap:6px;align-items:flex-end;flex-wrap:wrap;">
            <div class="field" style="flex:1;min-width:140px;"><label style="font-size:10px;">Description</label><input data-field="itemLabel" value="${esc(f.itemLabel||'')}" placeholder="e.g. Equipment rental"/></div>
            <div class="field" style="width:100px;"><label style="font-size:10px;">Amount</label><input type="number" data-field="itemAmount" value="${f.itemAmount||''}" placeholder="250"/></div>
            <button class="btn btn-sm" data-action="add-invoice-item">+ Add</button>
          </div>
        </div>
        <div class="field"><label>Notes (optional)</label><input data-field="notes" value="${esc(f.notes||'')}" placeholder="Reference / memo"/></div>
        <div class="ledger" style="margin:4px 0 0;"><div class="ledger-row total"><span>Total</span><span class="amt">${moneyCents(total)}</span></div></div>
        ${stripeReady() ? `<p style="font-size:11.5px;color:var(--ink-3);margin:8px 0 0;">The email includes a <strong>Pay online</strong> button (card or bank transfer).</p>
          ${cardFeePercentSetting() ? `<label style="display:flex;align-items:center;gap:8px;font-size:12.5px;margin-top:6px;"><input type="checkbox" data-action="toggle-invoice-no-card-fee" ${f.noCardFee?'checked':''}/> No credit card fee on this invoice (required if the client is in CT or MA)</label>` : ''}` : ''}
        <button class="btn btn-primary btn-block" data-action="submit-invoice" style="margin-top:6px;" ${S.invoiceSendBusy?'disabled':''}>${S.invoiceSendBusy?'Sending…':'Send Invoice'}</button>
      </div>
    </div>
  </div>`;
}

function renderNewOutsideBookingModal(){
  const f = S.newOutsideBookingForm;
  const total = Number(f.totalAmount)||0;
  const cut = Number(f.aspCut)||0;
  return `<div class="overlay center" data-action="overlay-close">
    <div class="modal" data-stop data-form="newoutsidebooking" style="width:440px;">
      <div class="sheet-head"><h2 style="font-size:1.3rem;">New Other Booking</h2><button class="icon-btn" data-action="close-sheet" aria-label="Close">${ICO.x}</button></div>
      <div class="sheet-body">
        <p style="font-size:12px;color:var(--ink-3);margin:0;">For jobs that don't involve one of our own roster artists — an outside act we're coordinating or referring.</p>
        <div class="field"><label>Performer</label><input data-field="performerName" value="${esc(f.performerName||'')}" placeholder="Outside act's name"/></div>
        <div class="field-row">
          <div class="field"><label>Client</label><input data-field="clientName" value="${esc(f.clientName||'')}" placeholder="Client or venue"/></div>
          <div class="field"><label>Client Email (optional)</label><input data-field="clientEmail" value="${esc(f.clientEmail||'')}" placeholder="name@example.com"/></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Date</label><input type="date" data-field="date" value="${f.date||''}"/></div>
          <div class="field"><label>Venue (optional)</label><input data-field="venue" value="${esc(f.venue||'')}" placeholder="Venue name"/></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Total Booking Amount</label><input type="number" data-field="totalAmount" value="${f.totalAmount||''}" placeholder="4200"/></div>
          <div class="field"><label>ASP's Cut</label><input type="number" data-field="aspCut" value="${f.aspCut||''}" placeholder="500"/></div>
        </div>
        <p style="font-size:11.5px;color:var(--ink-3);margin:-4px 0 0;">If ASP collects the full amount and pays the performer out, set the cut to what ASP keeps. If ASP only bills a coordination fee (client pays the performer directly), set the cut equal to the total.</p>
        <div class="field"><label>Notes (optional)</label><input data-field="notes" value="${esc(f.notes||'')}" placeholder="How this booking works"/></div>
        <div class="ledger" style="margin:4px 0 0;">
          <div class="ledger-row"><span>Payout to Performer</span><span class="amt">${money(Math.max(0,total-cut))}</span></div>
          <div class="ledger-row total"><span>ASP Keeps</span><span class="amt">${money(cut)}</span></div>
        </div>
        <button class="btn btn-primary btn-block" data-action="submit-outside-booking" style="margin-top:6px;">Create Booking</button>
      </div>
    </div>
  </div>`;
}

function documentBodyHtml(bodyText){
  const blocks = (bodyText||'').split(/\n\s*\n/).map(b=>b.trim()).filter(Boolean);
  return blocks.map(block=>{
    const lines = block.split('\n').map(l=>l.trim()).filter(Boolean);
    const isList = lines.length && lines.every(l=>/^[-*]\s+/.test(l));
    if(isList) return `<ul class="doc-terms">${lines.map(l=>`<li>${esc(l.replace(/^[-*]\s+/,''))}</li>`).join('')}</ul>`;
    return `<p style="font-size:13px;line-height:1.6;">${esc(block).replace(/\n/g,'<br/>')}</p>`;
  }).join('');
}
function documentSubjectContext(subjectType, subjectId){
  if(subjectType==='artist'){
    const artist = artistById(subjectId);
    const next = artist ? eventsFor(artist.id).filter(e=>!isPast(e.date) && isConfirmed(e)).sort((a,b)=>a.date.localeCompare(b.date))[0] : null;
    return { name: artist?artist.name:'', clientName: next?(next.clientName||''):'', date: next?next.date:null, venue: next?next.venue:'' };
  }
  if(subjectType==='outside'){
    const b = getOutsideBooking(subjectId);
    return b ? { name:b.performerName, clientName:b.clientName, date:b.date, venue:b.venue, totalAmount:b.totalAmount } : {};
  }
  return {};
}
function documentSubjectLabel(doc){
  if(doc.subjectType==='artist'){ const a=artistById(doc.subjectId); return a? a.name : 'Artist'; }
  if(doc.subjectType==='outside'){ const b=getOutsideBooking(doc.subjectId); return b? b.performerName : 'Other booking'; }
  return 'General';
}
function documentAttribution(doc){
  if(doc.subjectType==='artist' && doc.brand==='asp'){
    const artist = artistById(doc.subjectId);
    if(artist) return `On behalf of ${artist.name}`;
  }
  return getBrandConfig(doc.brand).signer;
}
function defaultDocumentTitle(subjectType, subjectId){
  const ctx = documentSubjectContext(subjectType, subjectId);
  if(ctx.name) return `${subjectType==='artist'?'Proposal':'Document'} — ${ctx.name}`;
  return 'New Document';
}
function defaultDocumentBody(subjectType, subjectId){
  const ctx = documentSubjectContext(subjectType, subjectId);
  if(subjectType==='outside' && ctx.name){
    return `This confirms the booking of ${ctx.name} for ${ctx.clientName}${ctx.venue?` at ${ctx.venue}`:''}${ctx.date?` on ${fmtDate(ctx.date)}`:''}, for a total fee of ${money(ctx.totalAmount||0)}.\n\nEdit this text freely — add terms, payment details, or anything else this document needs to say.`;
  }
  if(subjectType==='artist' && ctx.name){
    return `This proposal covers ${ctx.name}'s upcoming performance${ctx.clientName?` for ${ctx.clientName}`:''}${ctx.venue?` at ${ctx.venue}`:''}${ctx.date?` on ${fmtDate(ctx.date)}`:''}.\n\nEquipment Needed:\n- \n\nRoom / Hospitality:\n- \n\nTravel:\n- \n\nEdit this text freely.`;
  }
  return 'Edit this text freely — add whatever this document needs to say.';
}
function renderDocumentBuilderModal(){
  const existing = S.documentId ? getDocument(S.documentId) : null;
  const isNew = !existing;
  const f = S.documentForm;
  const subjectType = f.subjectType!==undefined? f.subjectType : (existing?existing.subjectType:'artist');
  const subjectId = f.subjectId!==undefined? f.subjectId : (existing?existing.subjectId:null);
  const brand = f.brand || (existing && existing.brand) || 'asp';
  const ctx = documentSubjectContext(subjectType, subjectId);
  const title = f.title!==undefined? f.title : (existing? existing.title : defaultDocumentTitle(subjectType, subjectId));
  const clientName = f.clientName!==undefined? f.clientName : (existing? existing.clientName : (ctx.clientName||''));
  const clientSignerTitle = f.clientSignerTitle!==undefined? f.clientSignerTitle : (existing? existing.clientSignerTitle : '');
  const bodyText = f.bodyText!==undefined? f.bodyText : (existing? existing.bodyText : defaultDocumentBody(subjectType, subjectId));
  return `<div class="overlay center" data-action="document-overlay-close">
    <div class="modal" data-stop data-form="document" style="width:560px;">
      <div class="sheet-head"><h2 style="font-size:1.3rem;">${isNew?'New Document':'Edit Document'}</h2>
        <div style="display:flex;gap:6px;">
          ${!isNew? `<button class="icon-btn" data-action="print-document" title="Download as PDF" aria-label="Download as PDF"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-2"/><rect x="6" y="14" width="12" height="7"/></svg></button>`:''}
          <button class="icon-btn" data-action="close-sheet" aria-label="Close">${ICO.x}</button>
        </div>
      </div>
      <div class="sheet-body">
        ${isNew? `
        <div class="field"><label>Who's This For?</label>
          <div class="chip-row">
            <button class="filter-chip ${subjectType==='artist'?'sel':''}" data-action="pick-document-subject-type" data-subject="artist">One of Our Artists</button>
            <button class="filter-chip ${subjectType==='outside'?'sel':''}" data-action="pick-document-subject-type" data-subject="outside">Other Booking</button>
            <button class="filter-chip ${subjectType==='general'?'sel':''}" data-action="pick-document-subject-type" data-subject="general">General</button>
          </div>
        </div>
        ${subjectType==='artist'? `<div class="field"><label>Artist</label>
          <select class="document-subject-select">
            <option value="">Pick an artist…</option>
            ${ARTISTS.map(a=>`<option value="${a.id}" ${subjectId===a.id?'selected':''}>${esc(a.name)}</option>`).join('')}
          </select>
        </div>` : ''}
        ${subjectType==='outside'? `<div class="field"><label>Other Booking</label>
          <select class="document-subject-select">
            <option value="">Pick a booking…</option>
            ${OUTSIDE_BOOKINGS.map(b=>`<option value="${b.id}" ${subjectId===b.id?'selected':''}>${esc(b.performerName)} — ${esc(b.clientName)}</option>`).join('')}
          </select>
        </div>` : ''}
        ` : `<p style="font-size:12px;color:var(--ink-3);margin:0;">For: <strong style="color:var(--ink);">${esc(documentSubjectLabel(existing))}</strong></p>`}

        <div class="field"><label>Title</label><input data-field="title" value="${esc(title)}" placeholder="e.g. Succos Proposal — Shmili Landau"/></div>
        <div class="field-row">
          <div class="field"><label>Client Name</label><input data-field="clientName" value="${esc(clientName)}"/></div>
          <div class="field"><label>Client Signer Title (optional)</label><input data-field="clientSignerTitle" value="${esc(clientSignerTitle)}" placeholder="e.g. Event Coordinator"/></div>
        </div>
        <div class="field"><label>Document Text</label>
          <textarea data-field="bodyText" style="width:100%;min-height:180px;padding:10px;border-radius:8px;border:1px solid var(--border-strong);background:var(--surface);font-size:13px;font-family:var(--font-body);color:var(--ink);">${esc(bodyText)}</textarea>
          <p style="font-size:11px;color:var(--ink-3);margin:4px 0 0;">Blank line = new paragraph. Lines starting with "-" become a bulleted list.</p>
        </div>
        ${S.showAiEditNotice? `<p style="font-size:12px;color:var(--ink-2);background:var(--surface-2);border-radius:8px;padding:8px 10px;margin:0;">AI editing needs a backend connection — not set up yet.</p>` : ''}
        <div style="display:flex;gap:8px;">
          <button class="btn" style="flex:1;" data-action="ai-edit-document">${ICO.sparkle} AI Editor</button>
          <button class="btn btn-primary" style="flex:1;" data-action="save-document">Save Document</button>
        </div>
      </div>
    </div>
  </div>`;
}
function renderDocumentDoc(doc){
  if(!doc) return '';
  const brandInfo = getBrandConfig(doc.brand);
  return `<div class="overlay center" data-action="document-overlay-close">
    <div class="doc" data-stop>
      <div class="sheet-head"><h2 style="font-size:1.1rem;">Document Preview</h2><button class="icon-btn" data-action="close-sheet" aria-label="Close">${ICO.x}</button></div>
      <div class="doc-body">
        <div class="doc-letterhead">
          <div class="doc-logo">${brandLogoHtml({ width:170 })}</div>
          <span class="pill ${doc.signedAt?'pill-good':'pill-neutral'}">${doc.signedAt?'Signed':'Unsigned'}</span>
        </div>
        <div class="doc-title">${esc((doc.title||'Document').toUpperCase())}</div>
        <div class="doc-sub">Prepared ${fmtDate(doc.createdAt)} &middot; ${esc(brandInfo.label)}</div>

        <div class="doc-parties">
          <div class="doc-party"><h4>For</h4><p><strong>${esc(documentSubjectLabel(doc))}</strong></p></div>
          <div class="doc-party"><h4>Client</h4><p><strong>${esc(doc.clientName||'—')}</strong>${doc.clientSignerTitle?`<br/>${esc(doc.clientSignerTitle)}`:''}</p></div>
        </div>

        ${documentBodyHtml(doc.bodyText)}

        <div class="doc-sign">
          <div class="doc-sign-line">${doc.signedAt? `<span class="doc-signature">${esc(doc.clientName)}</span><br/>Signed electronically &middot; ${fmtDateShort(doc.signedAt)}` : `<strong>&nbsp;</strong>Client Signature &middot; Date`}</div>
          <div class="doc-sign-line"><strong>${esc(documentAttribution(doc))}</strong></div>
        </div>

      </div>
    </div>
  </div>`;
}

function renderInvoiceDoc(){
  const inv = getInvoice(S.invoiceDocId); if(!inv) return '';
  const total = invoiceTotal(inv);
  return `<div class="overlay center" data-action="invoice-overlay-close">
    <div class="doc" data-stop>
      <div class="sheet-head">
        <h2 style="font-size:1.1rem;">Invoice ${esc(inv.id)}</h2>
        <div style="display:flex;gap:6px;">
          <button class="icon-btn" data-action="print-invoice" title="Print / Save as PDF" aria-label="Print / Save as PDF"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-2"/><rect x="6" y="14" width="12" height="7"/></svg></button>
          <button class="icon-btn" data-action="close-invoice-doc" aria-label="Close">${ICO.x}</button>
        </div>
      </div>
      <div class="doc-body">
        <div class="doc-letterhead">
          <div class="doc-logo">${brandLogoHtml({ width:170 })}</div>
          <span class="pill ${inv.status==='paid'?'pill-good':'pill-warn'}">${inv.status==='paid'?'Paid':'Open'}</span>
        </div>
        <div class="doc-title">INVOICE</div>
        <div class="doc-sub">${esc(inv.id)} &middot; ${fmtDate(inv.createdAt)}</div>

        <div class="doc-parties">
          <div class="doc-party"><h4>From</h4><p><strong>${esc(getBrandConfig('asp').label)}</strong><br/>${esc(getBrandConfig('asp').email)}</p></div>
          <div class="doc-party"><h4>Bill To</h4><p><strong>${esc(inv.clientName)}</strong><br/>${esc(inv.clientEmail)}</p></div>
        </div>

        <div class="doc-section"><h3>Items</h3>
          <div class="ledger" style="margin-bottom:20px;">
            ${inv.items.map(it=>`<div class="ledger-row"><span>${esc(it.label)}</span><span class="amt">${money(it.amount)}</span></div>`).join('')}
            <div class="ledger-row total"><span>Total Due</span><span class="amt">${money(total)}</span></div>
          </div>
        </div>
        ${inv.notes? `<div class="doc-section"><p style="font-size:12.5px;color:var(--ink-2);margin:0;">${esc(inv.notes)}</p></div>` : ''}

        <div class="doc-section"><h3>Payment</h3>
          <div style="background:#fff;color:#17171A;border-radius:var(--r-md);padding:2px 12px 12px;">${paymentOptionsEmailBlock({ kind:'invoice', amount:total, memo:inv.id, zelle:depositZelle() })}</div>
          ${invoiceOnlinePayment(inv) ? `<p style="margin:8px 0 0;"><span class="pill pill-wrap pill-good" data-testid="invoice-online-payment">${invoiceOnlinePayment(inv).pay_status==='processing' ? 'Bank transfer processing' : `Paid online — ${esc(paidOnlineText(invoiceOnlinePayment(inv)))}`}</span></p>`
            : inv.status!=='paid' && stripeReady() ? `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:8px;">
              <button class="btn btn-sm btn-ghost" data-action="make-invoice-pay-link" data-id="${inv.id}" ${S.payLinkBusy===inv.id?'disabled':''}>${S.payLinkBusy===inv.id?'Making link…':'Pay link'}</button>
              ${S.payLinks && S.payLinks[inv.id] ? `<input readonly data-testid="pay-link-url" aria-label="Payment link" value="${esc(S.payLinks[inv.id])}" style="flex:1 1 220px;min-width:0;"/>` : ''}</div>` : ''}
        </div>

      </div>
    </div>
  </div>`;
}

/* ============ CONTRACT BUILDER UI ============ */
function renderLeadContractsCard(ev){
  if(ev.unpaid) return ''; // internal days never get contracts
  const contracts = contractsForLead(ev.id);
  // One live contract per gig (owner 2026-10-15): once there is one, the button views it; a new one can
  // only be created after the old one is voided.
  const live = contracts.find(c=>c.status!=='void');
  return `<div class="card card-pad" style="display:flex;flex-direction:column;gap:10px;">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <h3 style="font-size:14px;margin:0;">Contracts</h3>
      ${live ? `<button class="btn btn-sm btn-primary" data-action="open-contract-doc" data-id="${live.id}">${ICO.leads} View Contract</button>`
        : `<button class="btn btn-sm btn-primary" data-action="create-contract" data-id="${ev.id}">${ICO.plus} Create Contract</button>`}
    </div>
    ${contracts.length? `<div class="log">${contracts.map(c=>`
      <div class="log-item" style="cursor:pointer;align-items:center;" data-action="open-contract-builder" data-id="${c.id}">
        <div class="log-ico">${ICO.leads}</div>
        <div style="flex:1;min-width:0;"><strong style="font-size:12.5px;">${esc(contractTemplateLabel(c.template))}</strong><br/><span class="log-time">${c.createdAt? `Created ${fmtDateShort(String(c.createdAt).slice(0,10))}` : ''}</span></div>
        <span class="pill ${contractStatusPillClass(c.status)}">${esc(contractStatusLabel(c.status))}</span>
      </div>
    `).join('')}</div>` : `<p style="font-size:12px;color:var(--ink-3);margin:0;">No contracts yet.</p>`}
  </div>`;
}

/* ---- Template picker (shown once at creation; locked afterward) ---- */
function renderTemplatePickerModal(){
  const lead = S.templatePickerLeadId ? getEvent(S.templatePickerLeadId) : null;
  const hasMultipleArtists = lead && (lead.additionalArtists||[]).length;
  return `<div class="overlay center" data-action="templatepicker-overlay-close">
    <div class="modal" data-stop style="width:420px;">
      <div class="sheet-head"><h2 style="font-size:1.2rem;">Choose a Contract Template</h2><button class="icon-btn" data-action="close-template-picker" aria-label="Close">${ICO.x}</button></div>
      <div class="sheet-body" style="display:flex;flex-direction:column;gap:10px;">
        <p style="font-size:12px;color:var(--ink-3);margin:0;">The template can't be changed once the contract is created.</p>
        ${hasMultipleArtists? `<p style="font-size:12px;color:var(--accent-ink);margin:0;background:var(--accent-wash);padding:8px 10px;border-radius:8px;">This lead has ${lead.additionalArtists.length+1} artists -- Multi-Performer / Package Agreement will pre-fill one line item per artist.</p>` : ''}
        ${CONTRACT_TEMPLATES.map(([key,label])=>`<button class="btn btn-block" data-action="pick-template-create" data-template="${key}" data-id="${S.templatePickerLeadId||''}" style="text-align:left;justify-content:flex-start;">${esc(label)}</button>`).join('')}
      </div>
    </div>
  </div>`;
}

function renderFlightSegmentsSection(tr){
  const segs = tr.flightSegments||[];
  return `<div class="card card-pad" style="display:flex;flex-direction:column;gap:10px;">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <h3 style="font-size:12.5px;margin:0;color:var(--ink-2);">Confirmed Flights</h3>
      <button class="btn btn-sm btn-ghost" data-action="add-flight-segment" data-id="${tr.id}">${ICO.plus} Add</button>
    </div>
    ${segs.length===0? `<p style="font-size:11.5px;color:var(--ink-3);margin:0;">Nothing entered yet -- add a flight once Rivky confirms one, from any channel.</p>` : ''}
    ${segs.map(seg=>`<div style="display:flex;flex-direction:column;gap:6px;padding:10px;background:var(--surface-2);border-radius:8px;">
      <div class="field-row">
        <div class="field"><label>Airline</label><input data-flight-seg-field="${seg.id}.airline" value="${esc(seg.airline||'')}" placeholder="e.g. AA" /></div>
        <div class="field"><label>Flight #</label><input data-flight-seg-field="${seg.id}.flightNumber" value="${esc(seg.flightNumber||'')}" placeholder="123" /></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Confirmation</label><input data-flight-seg-field="${seg.id}.confirmationCode" value="${esc(seg.confirmationCode||'')}" /></div>
        <div class="field"><label>Route</label><input data-flight-seg-field="${seg.id}.departureAirport" value="${esc(seg.departureAirport||'')}" placeholder="JFK" style="width:60px;flex:none;" />
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
        <button class="btn btn-sm" data-action="check-segment-flight-status" data-id="${tr.id}" data-seg="${seg.id}" ${S.flightStatusBusy===seg.id?'disabled':''}>${S.flightStatusBusy===seg.id?'Checking…':'Check Status'}</button>
        <button class="icon-btn" data-action="remove-flight-segment" data-id="${tr.id}" data-seg="${seg.id}" title="Remove" aria-label="Remove">${ICO.x}</button>
      </div>
      ${seg.lastStatus? `<p style="font-size:11px;color:var(--ink-2);margin:0;">Last checked: <strong>${esc(seg.lastStatus)}</strong>${seg.lastStatusAt? ` (${fmtDateShort(seg.lastStatusAt.slice(0,10))})` : ''}</p>` : ''}
    </div>`).join('')}
  </div>`;
}
function renderTravelRequestDetailSheet(){
  const tr = getTravelRequest(S.travelRequestDetailId); if(!tr) return '';
  const ev = getEvent(tr.eventId);
  const d = tr.details;
  const busy = !!S.travelRequestBusy;
  const canSend = tr.status==='draft' && ORG_SETTINGS.rivkyEmail;
  return `<div class="overlay" data-action="travelrequest-overlay-close">
    <div class="sheet" data-stop style="width:520px;">
      <div class="sheet-head">
        <div><h2 style="font-size:1.2rem;margin-bottom:4px;">Travel Request</h2><span class="pill ${tr.status==='draft'?'':'pill-good'}">${esc(travelRequestStatusLabel(tr.status))}</span></div>
        <div style="display:flex;gap:6px;">
          <button class="icon-btn" data-action="delete-travel-request" data-id="${tr.id}" title="Delete" aria-label="Delete">${ICO.trash}</button>
          <button class="icon-btn" data-action="close-travel-request-detail" aria-label="Close">${ICO.x}</button>
        </div>
      </div>
      <div class="sheet-body" style="display:flex;flex-direction:column;gap:10px;">
        ${!ORG_SETTINGS.rivkyEmail? `<p style="font-size:11.5px;color:var(--warn-ink);background:var(--warn-wash);padding:8px 10px;border-radius:8px;margin:0;">Rivky's email isn't set yet — add it in Settings before sending.</p>` : ''}
        <div class="field"><label>Passenger(s)</label><input data-travel-field="details.passengers" value="${esc(d.passengers||'')}" ${busy?'disabled':''}/></div>
        <div class="field-row">
          <div class="field"><label>Origin</label><input data-travel-field="details.origin" value="${esc(d.origin||'')}" placeholder="e.g. JFK" ${busy?'disabled':''}/></div>
          <div class="field"><label>Destination</label><input data-travel-field="details.destination" value="${esc(d.destination||'')}" placeholder="e.g. MIA" ${busy?'disabled':''}/></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Arrive By</label><input type="datetime-local" data-travel-field="details.arriveBy" value="${d.arriveBy||''}" ${busy?'disabled':''}/></div>
          <div class="field"><label>Depart After</label><input type="datetime-local" data-travel-field="details.departAfter" value="${d.departAfter||''}" ${busy?'disabled':''}/></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Flight Class</label><select data-travel-field="details.flightClass" ${busy?'disabled':''}>${['economy','premium_economy','business','first'].map(c=>`<option value="${c}" ${d.flightClass===c?'selected':''}>${c.replace('_',' ')}</option>`).join('')}</select></div>
          <div class="field"><label>Flight Qty</label><input type="number" data-travel-field="details.flightQty" value="${d.flightQty||1}" ${busy?'disabled':''}/></div>
        </div>
        <div class="field" style="flex-direction:row;align-items:center;gap:8px;">
          <input type="checkbox" id="trHotel" data-travel-field="details.hotelNeeded" ${d.hotelNeeded?'checked':''} ${busy?'disabled':''}/>
          <label for="trHotel" style="text-transform:none;font-size:13px;color:var(--ink);font-weight:500;">Hotel needed</label>
        </div>
        ${d.hotelNeeded? `<div class="field"><label>Hotel Preferences</label><input data-travel-field="details.hotelPrefs" value="${esc(d.hotelPrefs||'')}" placeholder="e.g. 1 room, 1 night, standard" ${busy?'disabled':''}/></div>` : ''}
        <div class="field" style="flex-direction:row;align-items:center;gap:8px;">
          <input type="checkbox" id="trGround" data-travel-field="details.groundTransportNeeded" ${d.groundTransportNeeded?'checked':''} ${busy?'disabled':''}/>
          <label for="trGround" style="text-transform:none;font-size:13px;color:var(--ink);font-weight:500;">Ground transport needed</label>
        </div>
        ${d.groundTransportNeeded? `<div class="field"><label>Ground Transport Notes</label><input data-travel-field="details.groundTransportNotes" value="${esc(d.groundTransportNotes||'')}" ${busy?'disabled':''}/></div>` : ''}
        <div class="field"><label>Notes</label><textarea data-travel-field="details.notes" rows="2" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--border-strong);background:var(--surface);font-size:12.5px;font-family:var(--font-body);color:var(--ink);" ${busy?'disabled':''}>${esc(d.notes||'')}</textarea></div>
        ${renderFlightSegmentsSection(tr)}
        ${tr.status==='draft'? `<button class="btn btn-primary btn-block" data-action="send-travel-request" data-id="${tr.id}" ${canSend&&!busy?'':'disabled'}>${busy?'Sending…':'Send to Rivky'}</button>`
        : `<div class="chip-row">
            ${['sent','awaiting_reply','answered','completed'].map(s=>`<button class="filter-chip ${tr.status===s?'sel':''}" data-action="set-travel-request-status" data-id="${tr.id}" data-status="${s}">${esc(travelRequestStatusLabel(s))}</button>`).join('')}
          </div>
          <button class="btn btn-sm" data-action="send-travel-request" data-id="${tr.id}" ${busy?'disabled':''}>${busy?'Sending…':'Resend Follow-up'}</button>
          ${tr.sentAt? `<p style="font-size:11px;color:var(--ink-3);margin:0;">Sent ${fmtDateShort(tr.sentAt.slice(0,10))}</p>` : ''}`}
      </div>
    </div>
  </div>`;
}

/* ---- Send Contract confirm (calls the send-contract-email Supabase Edge Function) ---- */
// "Pay online" in Send Contract: the deposit rides on the signing link (contractDepositPayment).
function renderSendContractPayOption(c, busy){
  if(c.status==='signed') return '';
  const cents = contractDepositCents(c);
  if(!stripeReady()) return `<p style="font-size:11.5px;color:var(--ink-3);margin:0;border-top:1px solid var(--border);padding-top:10px;">Online deposit payment: not set up yet (Settings → Online payments).</p>`;
  if(cents < 50) return `<p style="font-size:11.5px;color:var(--ink-3);margin:0;border-top:1px solid var(--border);padding-top:10px;">No deposit on this contract, so there's nothing to pay online.</p>`;
  const bps = contractCardFeeBps(c);
  const st = contractGigState(c);
  const feeText = bps ? `Credit cards add a ${bps/100}% card fee (${moneyCents(Math.round(cents*bps/10000)/100)}); bank transfer and debit cards don't.${st?'':' The gig has no state on file — check it isn\'t in CT or MA, where card fees aren\'t allowed.'}`
    : cardFeePercentSetting() && NO_CARD_FEE_STATES.includes(st) ? `No card fee: card surcharges aren't allowed in ${esc(st)}.`
    : 'No card fee (set one in Settings → Online payments).';
  return `<label style="display:flex;align-items:center;gap:8px;font-size:12.5px;border-top:1px solid var(--border);padding-top:10px;">
      <input type="checkbox" data-action="toggle-send-contract-pay" ${S.sendContractPayOnline?'checked':''} ${busy?'disabled':''}/> Let the client pay the ${moneyCents(cents/100)} deposit online after signing (card or bank)
    </label>
    ${S.sendContractPayOnline?`<p style="font-size:11.5px;color:var(--ink-3);margin:-4px 0 0 24px;">${feeText}${S.stripeStatus.mode==='test'?' Stripe is in <strong>test mode</strong>: no real money moves.':''}</p>`:''}`;
}
function renderSendContractConfirmModal(){
  const c = getContract(S.contractBuilderId); if(!c) return '';
  const f = S.sendContractForm||{};
  const busy = !!S.sendContractBusy;
  return `<div class="overlay center" data-action="sendcontract-overlay-close">
    <div class="modal" data-stop data-form="sendcontract" style="width:420px;">
      <div class="sheet-head"><h2 style="font-size:1.2rem;">Send Contract</h2><button class="icon-btn" data-action="close-send-contract-confirm" ${busy?'disabled':''} aria-label="Close">${ICO.x}</button></div>
      <div class="sheet-body" style="display:flex;flex-direction:column;gap:10px;">
        <div class="field"><label>To</label><input data-field="to" type="email" value="${esc(f.to||'')}" placeholder="client@email.com" ${busy?'disabled':''}/></div>
        <div class="field"><label>Subject</label><input data-field="subject" value="${esc(f.subject||'')}" ${busy?'disabled':''}/></div>
        <p style="font-size:11.5px;color:var(--ink-3);margin:0;">Sends the contract exactly as shown in the preview, as an email the client can read directly.</p>
        ${renderSendContractPayOption(c, busy)}
        ${S.qboStatus && S.qboStatus.connected ? `
        <label style="display:flex;align-items:center;gap:8px;font-size:12.5px;border-top:1px solid var(--border);padding-top:10px;">
          <input type="checkbox" data-action="toggle-send-contract-invoice" ${S.sendContractInvoice?'checked':''} ${busy?'disabled':''}/> Also send a QuickBooks invoice for the deposit (payable by credit card)
        </label>
        ${S.sendContractInvoice? `<div class="field-row">
          <div class="field"><label>Amount ($)</label><input data-field="qboAmount" type="number" value="${esc(String(f.qboAmount||''))}" ${busy?'disabled':''}/></div>
          <div class="field"><label>Description</label><input data-field="qboDescription" value="${esc(f.qboDescription||'')}" ${busy?'disabled':''}/></div>
        </div>` : ''}` : ''}
        <button class="btn btn-primary btn-block" data-action="confirm-send-contract" ${busy?'disabled':''}>${busy?'Sending…':'Send'}</button>
      </div>
    </div>
  </div>`;
}

// Durable booking record architecture (PR 6): "a signed agreement, payer's screenshot, pending
// wire, or promise is not a verified receipt" -- this modal is the audited alternative to the
// existing blind "Mark Booking Fee Received" click. No automated payment-matching is wired to a
// local booking record yet (no event has a real Supabase row to match a payments row against), so
// unlike a future version of this modal, there's only one honest path today: the admin records how
// they verified the deposit, not a silent checkbox.
function renderVerifyDepositModal(){
  const ev = getEvent(S.verifyDepositEventId); if(!ev) return '';
  const f = S.verifyDepositForm||{};
  return `<div class="overlay center" data-action="verifydeposit-overlay-close">
    <div class="modal" data-stop data-form="verifydeposit" style="width:420px;">
      <div class="sheet-head"><h2 style="font-size:1.2rem;">Verify Deposit &amp; Confirm Booking</h2><button class="icon-btn" data-action="close-verify-deposit" aria-label="Close">${ICO.x}</button></div>
      <div class="sheet-body" style="display:flex;flex-direction:column;gap:10px;">
        <p style="font-size:11.5px;color:var(--ink-3);margin:0;">Automated payment matching isn't connected to this booking yet — record what you actually verified, so there's a real, queryable audit trail instead of a one-click guess.</p>
        <div class="field"><label>How was the deposit verified?</label>
          <select data-field="method">
            <option value="zelle" ${f.method==='zelle'?'selected':''}>Zelle — confirmed in Gmail/bank</option>
            <option value="wire" ${f.method==='wire'?'selected':''}>Wire — confirmed by bank statement</option>
            <option value="check" ${f.method==='check'?'selected':''}>Check — deposited/cleared</option>
            <option value="quickbooks" ${f.method==='quickbooks'?'selected':''}>QuickBooks — payment recorded</option>
            <option value="other" ${f.method==='other'?'selected':''}>Other</option>
          </select>
        </div>
        <div class="field"><label>Evidence / note (required)</label><textarea data-field="note" rows="3" placeholder="e.g. Zelle received 10/6 for $2,500, confirmed against bank statement.">${esc(f.note||'')}</textarea></div>
        <button class="btn btn-primary btn-block" data-action="confirm-verify-deposit" data-id="${ev.id}">Verify &amp; Confirm Booking</button>
      </div>
    </div>
  </div>`;
}

function renderContractBuilderModal(){
  const c = getContract(S.contractBuilderId); if(!c) return '';
  const isCreative = c.template==='creative';
  return `<div class="overlay" data-action="contractbuilder-overlay-close">
    <div class="sheet" data-stop style="width:780px;">
      <div class="sheet-head">
        <div>
          <h2 style="font-size:1.2rem;margin-bottom:4px;">${esc(contractTemplateLabel(c.template))}</h2>
          <span class="pill ${contractStatusPillClass(c.status)}">${esc(contractStatusLabel(c.status))}</span>
        </div>
        <div style="display:flex;gap:6px;">
          <button class="icon-btn" data-action="view-contract-builder-doc" title="Preview &amp; Print" aria-label="Preview &amp; Print">${ICO.leads}</button>
          <button class="icon-btn" data-action="delete-contract" title="Delete" aria-label="Delete">${ICO.trash}</button>
          <button class="icon-btn" data-action="close-contract-builder" aria-label="Close">${ICO.x}</button>
        </div>
      </div>
      <div class="sheet-body">
        <div class="field"><label>Status</label>
          <!-- Read-only (owner 2026-10-15): the status follows what happened -- sending, the client signing.
               Two deliberate actions remain: a contract sent outside the app, and voiding one. -->
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span class="pill ${contractStatusPillClass(c.status)}" data-testid="contract-status">${esc(contractStatusLabel(c.status))}</span>
            ${c.status==='draft'? `<button class="btn btn-sm btn-ghost" data-action="set-contract-status" data-status="sent" title="Use only when you sent it yourself, outside the app">Mark sent (sent outside the app)</button>` : ''}
            ${c.status!=='void' && c.status!=='signed'? `<button class="btn btn-sm btn-ghost" style="color:var(--crit);" data-action="set-contract-status" data-status="void">Void contract</button>` : ''}
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;background:var(--surface-2);">
          ${isContractApproved(c)
            ? `<span class="pill pill-wrap pill-good">Approved for sending — ${esc(adminById(c.approvedBy)?adminById(c.approvedBy).name:'admin')}, ${fmtDateShort(c.approvedAt.slice(0,10))}</span>
               <button class="btn btn-sm btn-ghost" data-action="revoke-contract-approval" data-id="${c.id}">Revoke</button>`
            : c.approvedAt
            ? `<span class="pill pill-wrap pill-warn">Money/terms changed since approval — re-approve before sending</span>
               <button class="btn btn-sm" data-action="approve-contract-for-sending" data-id="${c.id}">Re-approve</button>`
            : `<span class="pill pill-wrap pill-neutral">Not yet approved — money/terms must be approved before this contract can be sent</span>
               <button class="btn btn-sm" data-action="approve-contract-for-sending" data-id="${c.id}">Approve for Sending</button>`}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px 10px;padding:8px 10px;border-radius:8px;background:var(--surface-2);">
          ${c.clientSignature ? `<span class="pill pill-wrap ${signedTermsChanged(c) ? 'pill-warn' : 'pill-good'}">Signed online by ${esc(c.clientSignature.name)} — ${fmtDateShort(String(c.clientSignature.at).slice(0,10))}${signedTermsChanged(c) ? ' (terms changed since)' : ''}</span>` : ''}
          ${contractPaymentPill(c)}
          ${c.clientSignature && !signedTermsChanged(c) ? '' : `${!c.clientSignature && earlierClientSignature(c) ? `<span class="pill pill-wrap pill-warn" style="flex:1 1 100%;">${esc(earlierClientSignature(c).name)} signed an earlier version online (${fmtDateShort(String(earlierClientSignature(c).at).slice(0,10))}) — the terms have changed since, so it isn't marked Signed. Send the current version to sign.</span>` : ''}<span style="font-size:12px;color:var(--ink-2);flex:1 1 220px;min-width:0;">Clients sign online: emailing the contract adds the link, or make one to send yourself.</span>
               <button class="btn btn-sm btn-ghost" style="flex:none;" data-action="make-sign-link" data-id="${c.id}" ${S.signLinkBusy===c.id?'disabled':''}>${S.signLinkBusy===c.id?'Making link…':'Signing link'}</button>
               ${S.signLinks && S.signLinks[c.id] ? `<input readonly data-testid="sign-link-url" aria-label="Signing link" value="${esc(S.signLinks[c.id])}" style="flex:1 1 100%;min-width:0;"/>` : ''}`}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
          <p style="font-size:11.5px;color:var(--ink-3);margin:0;">Autofilled from the lead — editing here does not change the lead.</p>
          <button class="btn btn-sm btn-ghost" style="flex:none;" data-action="contract-refresh-from-lead" data-id="${c.id}">Refresh from Lead</button>
        </div>
        <div class="field-row">
          <div class="field"><label>${isCreative?'Client / Organization':'Client Name'}</label><input data-contract-field="snapshot.clientName" value="${esc(c.snapshot.clientName||'')}"/></div>
          <div class="field"><label>Client Email</label><input data-contract-field="snapshot.clientEmail" value="${esc(c.snapshot.clientEmail||'')}"/></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Client Phone</label><input data-contract-field="snapshot.clientPhone" value="${esc(c.snapshot.clientPhone||'')}"/></div>
          <div class="field"><label>Event Date</label><input type="date" data-contract-field="snapshot.eventDate" value="${c.snapshot.eventDate||''}"/></div>
        </div>
        ${isCreative? `<div class="field"><label>Project Name</label><input data-contract-field="creative.projectName" value="${esc(c.creative.projectName||'')}" placeholder="e.g. SAR Academy Dinner Video"/></div>
        <div class="field"><label>Event Name</label><input data-contract-field="snapshot.eventName" value="${esc(c.snapshot.eventName||'')}" placeholder="e.g. SAR Academy Annual Dinner"/></div>` : ''}
        <div class="field-row">
          <div class="field"><label>Venue</label><input data-contract-field="snapshot.venue" value="${esc(c.snapshot.venue||'')}"/></div>
          <div class="field"><label>City</label><input data-contract-field="snapshot.city" value="${esc(c.snapshot.city||'')}"/></div>
        </div>
        <div class="field-row">
          <div class="field"><label>State</label><input data-contract-field="snapshot.state" value="${esc(c.snapshot.state||'')}"/></div>
          ${!isCreative? `<div class="field"><label>Occasion</label><input data-contract-field="snapshot.occasion" value="${esc(c.snapshot.occasion||'')}" placeholder="e.g. Wedding, Purim Party, Bar Mitzvah"/></div>` : ''}
        </div>
        ${!isCreative? `<div class="field"><label>Hours of Engagement</label><input data-contract-field="top.hoursOfEngagement" data-focus-key="top.hoursOfEngagement" data-live value="${esc(c.hoursOfEngagement||'')}" placeholder="e.g. 5 hours"/></div>` : ''}

        ${isCreative? renderCreativeFieldsSection(c) : renderContractPerformerSection(c)}
        ${c.template==='multiline' ? renderContractLineItemsSection(c) : ''}
        ${renderContractFeeSection(c)}
        ${!isCreative? renderTravelClauseSection(c) : ''}
        ${c.template==='comedian' ? renderComedianFieldsSection(c) : ''}
        ${!isCreative? renderContractCancellationSection(c) : ''}
        ${!isCreative? renderContractBoilerplateSection(c) : renderCreativeBoilerplateSection(c)}
        ${!isCreative? renderContractProvidesSection(c) : ''}
        ${c.template==='multiline' ? renderBarterSection(c) : ''}
        ${renderContractCustomClausesSection(c)}
        <div class="field"><label>Internal Notes (not printed)</label><textarea data-contract-field="notes" rows="2" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--border-strong);background:var(--surface);font-size:12.5px;font-family:var(--font-body);color:var(--ink);">${esc(c.notes||'')}</textarea></div>

        <button class="btn btn-primary btn-block" data-action="close-contract-builder">Done</button>
      </div>
    </div>
  </div>`;
}
function renderContractPerformerSection(c){
  const profile = getPayeeProfile(c.payeeProfileId);
  return `<div class="card card-pad" style="display:flex;flex-direction:column;gap:10px;">
    <h3 style="font-size:13.5px;margin:0;">Performer</h3>
    <div class="field"><label>Performer (Artist Roster)</label>
      <select class="contract-performer-select" data-id="${c.id}">
        <option value="" ${!c.performerArtistId?'selected':''}>— Type manually below —</option>
        ${ARTISTS.map(a=>`<option value="${a.id}" ${c.performerArtistId===a.id?'selected':''}>${esc(a.name)}</option>`).join('')}
      </select>
    </div>
    ${!c.performerArtistId ? `<div class="field"><label>Performer Label</label><input data-contract-field="performerLabel" value="${esc(c.performerLabel||'')}" placeholder="e.g. Eli Marcus with OMb and sound"/></div>` : ''}
    <p style="font-size:11.5px;color:var(--ink-3);margin:0;">Payee: <strong>${esc(profile? profile.entityName : '—')}</strong> &middot; picking a performer autofills their contracting entity, boilerplate, overtime interval, and travel defaults below (still fully editable).</p>
  </div>`;
}
function renderCreativeFieldsSection(c){
  return `<div class="card card-pad" style="display:flex;flex-direction:column;gap:10px;">
    <h3 style="font-size:13.5px;margin:0;">Project Details</h3>
    <div class="field-row">
      <div class="field" style="width:160px;"><label>On-Site Filming Days</label><input type="number" min="0" data-contract-field="creative.filmingDays" value="${c.creative.filmingDays!==undefined?c.creative.filmingDays:3}"/></div>
      <div class="field"><label>Revision Rounds</label><input data-contract-field="creative.revisionRounds" value="${esc(c.creative.revisionRounds||'')}"/></div>
    </div>
    <p style="font-size:11px;color:var(--ink-3);margin:0;">Standing clauses always included: "Once the Client considers the project complete, no further revisions, additions, or changes will be made."</p>
  </div>`;
}
function renderCreativeBoilerplateSection(c){
  return `<div class="card card-pad" style="display:flex;flex-direction:column;gap:8px;">
    <h3 style="font-size:13.5px;margin:0;">Terms</h3>
    <label style="display:flex;align-items:center;gap:8px;font-size:12.5px;"><input type="checkbox" data-contract-field="boilerplate.notBindingUntilDeposit" ${c.boilerplate.notBindingUntilDeposit?'checked':''}/> This agreement is not binding until the deposit is received</label>
  </div>`;
}
function renderComedianFieldsSection(c){
  return `<div class="card card-pad" style="display:flex;flex-direction:column;gap:10px;">
    <h3 style="font-size:13.5px;margin:0;">Comedian Details</h3>
    <div class="field-row">
      <div class="field"><label>Performance Duration</label><input data-contract-field="top.performanceDuration" value="${esc(c.performanceDuration||'')}" placeholder="e.g. 45 min - 1 hour"/></div>
      <div class="field"><label>Additional Expenses</label><input data-contract-field="top.additionalExpenses" value="${esc(c.additionalExpenses||'')}" placeholder="N/A"/></div>
    </div>
    <div class="field"><label>Performance Type</label><input data-contract-field="top.performanceType" value="${esc(c.performanceType||'')}" placeholder="e.g. Live comedy show by Dovi Neuburger"/></div>
  </div>`;
}
function renderTravelClauseSection(c){
  const tc = c.travelClause;
  const sentence = contractTravelSentence(tc);
  return `<div class="card card-pad" style="display:flex;flex-direction:column;gap:10px;">
    <h3 style="font-size:13.5px;margin:0;">Travel (Optional)</h3>
    <div class="field-row">
      <div class="field" style="width:100px;"><label>Flights</label><input type="number" min="0" data-contract-field="travel.flightsCount" data-focus-key="travel.flightsCount" data-live value="${tc.flightsCount||0}"/></div>
      <div class="field"><label>Class</label>
        <div class="chip-row">${['economy','business','first'].map(cl=>`<button class="filter-chip ${tc.flightsClass===cl?'sel':''}" data-action="pick-travel-flight-class" data-value="${cl}">${cl.charAt(0).toUpperCase()+cl.slice(1)}</button>`).join('')}</div>
      </div>
    </div>
    <div class="field-row">
      <div class="field" style="width:120px;"><label>Hotel Rooms</label><input type="number" min="0" data-contract-field="travel.hotelRooms" data-focus-key="travel.hotelRooms" data-live value="${tc.hotelRooms||0}"/></div>
      <div class="field" style="width:100px;"><label>Nights</label><input type="number" min="0" data-contract-field="travel.hotelNights" data-focus-key="travel.hotelNights" data-live value="${tc.hotelNights||0}"/></div>
    </div>
    <div style="display:flex;gap:14px;flex-wrap:wrap;">
      <label style="display:flex;align-items:center;gap:6px;font-size:12.5px;"><input type="checkbox" data-contract-field="travel.food" data-live ${tc.food?'checked':''}/> Food</label>
      <label style="display:flex;align-items:center;gap:6px;font-size:12.5px;"><input type="checkbox" data-contract-field="travel.shabbos" data-live ${tc.shabbos?'checked':''}/> Shabbos accommodation</label>
      <label style="display:flex;align-items:center;gap:6px;font-size:12.5px;"><input type="checkbox" data-contract-field="travel.groundTransport" data-live ${tc.groundTransport?'checked':''}/> Ground transportation</label>
    </div>
    ${sentence? `<p style="font-size:11px;color:var(--ink-3);margin:0;">Adds to fee: "${esc(sentence)}"</p>` : ''}
  </div>`;
}
function renderContractFeeSection(c){
  const figures = contractPaymentFigures(c);
  const isCreative = c.template==='creative';
  return `<div class="card card-pad" style="display:flex;flex-direction:column;gap:10px;">
    <h3 style="font-size:13.5px;margin:0;">Fee, Deposit${isCreative?'':' &amp; Overtime'}</h3>
    <div class="field-row">
      <div class="field"><label>${isCreative?'Creative Fee ($)':'Total Fee ($)'}</label><input type="number" data-contract-field="fee.amount" data-focus-key="fee.amount" data-live value="${c.fee.amount||0}" ${c.template==='multiline'?'readonly title="Auto-summed from line items + add-ons below"':''}/></div>
      <div class="field"><label>Fee Note (optional)</label><input data-contract-field="fee.note" value="${esc(c.fee.note||'')}" placeholder="e.g. including Travel Expenses, cash only"/></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Deposit ($)</label><input type="number" data-contract-field="deposit.amount" data-focus-key="deposit.amount" data-live value="${c.deposit.amount||0}"/></div>
      <div class="field"><label>Deposit (% of total, optional)</label><input type="number" data-contract-field="deposit.percent" data-focus-key="deposit.percent" data-live value="${esc(String(c.deposit.percent||0))}" placeholder="0 = use $ amount"/></div>
    </div>
    <label style="display:flex;align-items:center;gap:8px;font-size:12.5px;"><input type="checkbox" data-contract-field="deposit.nonRefundable" ${c.deposit.nonRefundable?'checked':''}/> Deposit is non-refundable</label>
    <div class="field"><label>Balance Due</label>
      <div class="chip-row">
        <button class="filter-chip ${c.balanceDueTiming==='prior'?'sel':''}" data-action="pick-balance-due-timing" data-value="prior">Prior to the engagement</button>
        <button class="filter-chip ${c.balanceDueTiming==='at_event'?'sel':''}" data-action="pick-balance-due-timing" data-value="at_event">At the event</button>
        <button class="filter-chip ${c.balanceDueTiming==='on_completion'?'sel':''}" data-action="pick-balance-due-timing" data-value="on_completion">When the project is complete</button>
      </div>
    </div>
    <div class="field-row">
      <div class="field"><label>Regular Price (optional)</label><input type="number" data-contract-field="discount.originalPrice" value="${c.discount.originalPrice||''}" placeholder="0 = no discount shown"/></div>
      <div class="field"><label>Discount Label</label><input data-contract-field="discount.label" value="${esc(c.discount.label||'')}" placeholder="e.g. repeat customer price"/></div>
    </div>
    ${!isCreative? `<div class="field-row">
      <div class="field"><label>Overtime Rate ($)${c.overtime.manual||c.overtime.interval==='not_applicable'?'':' · auto'}</label><input type="number" data-contract-field="overtime.rate" data-render-on-change value="${c.overtime.manual||Number(c.overtime.rate)? esc(String(c.overtime.rate)) : ''}" placeholder="fee ÷ hours, per half hour" ${c.overtime.interval==='not_applicable'?'disabled':''}/></div>
      <div class="field"><label>Per</label>
        <div class="chip-row">
          ${['half_hour','15_min','hour','not_applicable'].map(iv=>`<button class="filter-chip ${c.overtime.interval===iv?'sel':''}" data-action="pick-contract-overtime-interval" data-value="${iv}">${iv==='not_applicable'?'Not applicable':overtimeIntervalLabel(iv)}</button>`).join('')}
        </div>
      </div>
    </div>` : ''}
    <div class="ledger" style="margin-top:4px;">
      <div class="ledger-row"><span>Total</span><span class="amt">${money(figures.total)}</span></div>
      <div class="ledger-row"><span>Deposit${Number(c.deposit.percent)>0?` (${esc(String(c.deposit.percent))}%)`:''}</span><span class="amt">${money(figures.deposit)}</span></div>
      <div class="ledger-row total"><span>Balance</span><span class="amt">${money(figures.balance)}</span></div>
    </div>
  </div>`;
}
function renderContractCancellationSection(c){
  const p = c.cancellationPolicy;
  return `<div class="card card-pad" style="display:flex;flex-direction:column;gap:10px;">
    <h3 style="font-size:13.5px;margin:0;">Cancellation Policy</h3>
    <div class="chip-row">
      <button class="filter-chip ${p.type==='flat_percent'?'sel':''}" data-action="pick-cancellation-type" data-value="flat_percent">Flat %</button>
      <button class="filter-chip ${p.type==='tiered'?'sel':''}" data-action="pick-cancellation-type" data-value="tiered">Tiered</button>
      <button class="filter-chip ${p.type==='credit_future'?'sel':''}" data-action="pick-cancellation-type" data-value="credit_future">Credit Toward Future Event</button>
      <button class="filter-chip ${p.type==='credit_reschedule'?'sel':''}" data-action="pick-cancellation-type" data-value="credit_reschedule">Credit Toward Reschedule</button>
      <button class="filter-chip ${p.type==='full_within_days'?'sel':''}" data-action="pick-cancellation-type" data-value="full_within_days">Full Payment Within N Days</button>
    </div>
    ${p.type==='flat_percent'? `<div class="field" style="max-width:160px;"><label>Percent Owed</label><input type="number" data-contract-field="cancellation.flatPercent" value="${p.flatPercent||80}"/></div>` : ''}
    ${p.type==='credit_future'? `<div class="field" style="max-width:200px;"><label>Credit Window (months)</label><input type="number" data-contract-field="cancellation.creditWindowMonths" value="${p.creditWindowMonths||6}"/></div>` : ''}
    ${p.type==='full_within_days'? `<div class="field" style="max-width:160px;"><label>Within (days)</label><input type="number" data-contract-field="cancellation.withinDays" value="${p.withinDays||40}"/></div>` : ''}
    ${p.type==='tiered'? `<div style="display:flex;flex-direction:column;gap:6px;">
      ${p.tiers.map(t=>`<div style="display:flex;gap:8px;align-items:center;">
        <span style="font-size:12px;color:var(--ink-3);">Within</span>
        <input type="number" data-contract-field="tier.${t.id}.withinDays" value="${t.withinDays}" style="width:70px;"/>
        <span style="font-size:12px;color:var(--ink-3);">days:</span>
        <input type="number" data-contract-field="tier.${t.id}.percent" value="${esc(String(t.percent??''))}" style="width:70px;"/>
        <span style="font-size:12px;color:var(--ink-3);">%</span>
        <button class="icon-btn" data-action="remove-cancellation-tier" data-id="${t.id}" title="Remove" style="flex:none;" aria-label="Remove">${ICO.trash}</button>
      </div>`).join('')}
      <button class="btn btn-sm" data-action="add-cancellation-tier" data-id="${c.id}">${ICO.plus} Add Tier</button>
    </div>` : ''}
    <p style="font-size:11px;color:var(--ink-3);margin:0;">Preview: ${esc(contractCancellationText(c))}</p>
  </div>`;
}
function renderContractBoilerplateSection(c){
  if(c.template==='standard'){
    const extras = BOILERPLATE_TOGGLES.filter(([k])=>!STANDARD_TERM_FLAGS.includes(k) && c.boilerplate[k]);
    const available = BOILERPLATE_TOGGLES.filter(([k])=>!STANDARD_TERM_FLAGS.includes(k) && !c.boilerplate[k]);
    return `<div class="card card-pad" style="display:flex;flex-direction:column;gap:8px;">
      <h3 style="font-size:13.5px;margin:0;">Terms (standard)</h3>
      <p style="font-size:11.5px;color:var(--ink-3);margin:0;">Every Standard Artist Agreement carries these. Extra terms below come from the artist's profile; add or remove one for this contract only.</p>
      <ul style="margin:0;padding-left:18px;font-size:12.5px;line-height:1.6;color:var(--ink-2);">${standardAgreementTerms(c).map(t=>`<li>${esc(t)}</li>`).join('')}</ul>
      <div class="chip-row" style="align-items:center;">
        ${extras.map(([k,l])=>`<span class="filter-chip sel" style="display:flex;align-items:center;gap:6px;">${esc(l)} <button data-action="remove-contract-term" data-key="${k}" aria-label="Remove ${esc(l)}" style="background:none;border:none;cursor:pointer;color:inherit;padding:0;display:flex;">${ICO.x}</button></span>`).join('')}
        ${available.length? `<select class="contract-add-term-select" style="width:auto;max-width:100%;min-width:0;"><option value="">+ Add a term…</option>${available.map(([k,l])=>`<option value="${k}">${esc(l)}</option>`).join('')}</select>` : ''}
      </div>
    </div>`;
  }
  return `<div class="card card-pad" style="display:flex;flex-direction:column;gap:8px;">
    <h3 style="font-size:13.5px;margin:0;">Artist's Terms</h3>
    <p style="font-size:11.5px;color:var(--ink-3);margin:0;">Filled in from the artist's profile (Settings → Payee Profiles). Change them here only if this one contract differs.</p>
    ${BOILERPLATE_TOGGLES.map(([key,label])=>`<label style="display:flex;align-items:center;gap:8px;font-size:12.5px;">
      <input type="checkbox" data-contract-field="boilerplate.${key}" ${c.boilerplate[key]?'checked':''}/> ${esc(label)}
    </label>`).join('')}
  </div>`;
}
const CLIENT_PROVIDES_SUGGESTIONS = ['Stage','Sound & Lighting per Artist specs','AV/Backline per Artist specs','Wired Microphone & Spotlight','Green Room','Appropriate Venue & Sound System'];
function renderContractProvidesSection(c){
  // Simplified (owner 2026-10-15: "make standard ... a dropdown not a huge box"): the standard
  // agreement's "Artist shall provide" follows the hours; "Client shall provide" is Payment plus
  // whatever is picked from one dropdown.
  const standard = c.template==='standard';
  const left = CLIENT_PROVIDES_SUGGESTIONS.filter(x=>!c.clientProvides.includes(x));
  return `<div class="card card-pad" style="display:flex;flex-direction:column;gap:10px;">
    <h3 style="font-size:13.5px;margin:0;">Artist Shall Provide</h3>
    ${standard? `<p style="font-size:12.5px;margin:0;">Vocal performance for up to ${esc(c.hoursOfEngagement||'the agreed hours')} <span style="color:var(--ink-3);">(standard)</span></p>`
      : `<input data-contract-field="top.artistProvides" value="${esc(c.artistProvides||'')}" placeholder="e.g. Vocal performance for up to 5 hours"/>`}
    <h3 style="font-size:13.5px;margin:10px 0 0;">Client Shall Provide</h3>
    <div class="chip-row" style="align-items:center;">
      <span class="filter-chip sel">Payment</span>
      ${c.clientProvides.map((label,idx)=>`<span class="filter-chip sel" style="display:flex;align-items:center;gap:6px;">${esc(label)} <button data-action="remove-client-provides" data-id="${c.id}" data-idx="${idx}" aria-label="Remove ${esc(label)}" style="background:none;border:none;cursor:pointer;color:inherit;padding:0;display:flex;">${ICO.x}</button></span>`).join('')}
      ${left.length? `<select class="contract-add-provides-select" data-id="${c.id}" style="width:auto;max-width:100%;min-width:0;"><option value="">+ Add…</option>${left.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')}</select>` : ''}
    </div>
  </div>`;
}
function renderBarterSection(c){
  const b = c.barter;
  return `<div class="card card-pad" style="display:flex;flex-direction:column;gap:10px;">
    <h3 style="font-size:13.5px;margin:0;">Non-Cash / Barter Compensation (Optional)</h3>
    <p style="font-size:11px;color:var(--ink-3);margin:0;">Excluded from the payment total above — e.g. a performer compensated via hotel rooms in lieu of a fee.</p>
    <div class="field"><label>Label</label><input data-contract-field="barter.label" value="${esc(b.label||'')}" placeholder="e.g. 2 hotel rooms for 5 people"/></div>
    <div class="field"><label>Description</label><textarea data-contract-field="barter.description" rows="2" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--border-strong);background:var(--surface);font-size:12.5px;font-family:var(--font-body);color:var(--ink);">${esc(b.description||'')}</textarea></div>
  </div>`;
}
function renderContractLineItemsSection(c){
  return `<div class="card card-pad" style="display:flex;flex-direction:column;gap:10px;">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <h3 style="font-size:13.5px;margin:0;">Line Items (Performers)</h3>
      <button class="btn btn-sm" data-action="add-line-item" data-id="${c.id}">${ICO.plus} Add Line Item</button>
    </div>
    ${c.lineItems.map(li=>{ const tc = li.travelClause||blankTravelClause(); const sentence = contractTravelSentence(tc); return `<div style="display:flex;flex-direction:column;gap:6px;padding:8px;background:var(--surface-2);border-radius:8px;">
      <div class="field-row" style="align-items:flex-end;flex-wrap:wrap;">
        <div class="field"><label>Label</label><input data-contract-field="lineitem.${li.id}.label" data-focus-key="lineitem.${li.id}.label" value="${esc(li.label||'')}" placeholder="e.g. Eli Marcus - 5hr from performance start"/></div>
        <div class="field" style="width:130px;"><label>Fee ($)</label><input type="number" data-contract-field="lineitem.${li.id}.fee" data-focus-key="lineitem.${li.id}.fee" data-live value="${li.fee||0}"/></div>
        <div class="field" style="width:170px;"><label>Overtime Rate</label><input data-contract-field="lineitem.${li.id}.overtimeRate" value="${esc(li.overtimeRate||'')}" placeholder="e.g. $150/musician/half hr"/></div>
        <div class="field" style="width:150px;"><label>Date (optional)</label><input type="date" data-contract-field="lineitem.${li.id}.date" value="${li.date||''}"/></div>
        <button class="icon-btn" data-action="remove-line-item" data-id="${li.id}" title="Remove" style="flex:none;" aria-label="Remove">${ICO.trash}</button>
      </div>
      <textarea data-contract-field="lineitem.${li.id}.notes" rows="2" placeholder="Notes for this night/set (e.g. who opens, set length, timing)" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--border-strong);background:var(--surface);font-size:12.5px;font-family:var(--font-body);color:var(--ink);">${esc(li.notes||'')}</textarea>
      <details>
        <summary style="cursor:pointer;font-size:11.5px;color:var(--ink-3);">Travel for this line item</summary>
        <div class="field-row" style="margin-top:6px;">
          <div class="field" style="width:90px;"><label>Flights</label><input type="number" min="0" data-contract-field="lineitemtravel.${li.id}.flightsCount" data-focus-key="lineitemtravel.${li.id}.flightsCount" data-live value="${tc.flightsCount||0}"/></div>
          <div class="field"><label>Class</label>
            <div class="chip-row">${['economy','business','first'].map(cl=>`<button class="filter-chip ${tc.flightsClass===cl?'sel':''}" data-action="pick-lineitem-travel-flight-class" data-id="${li.id}" data-value="${cl}">${cl.charAt(0).toUpperCase()+cl.slice(1)}</button>`).join('')}</div>
          </div>
        </div>
        <div class="field-row">
          <div class="field" style="width:110px;"><label>Hotel Rooms</label><input type="number" min="0" data-contract-field="lineitemtravel.${li.id}.hotelRooms" data-focus-key="lineitemtravel.${li.id}.hotelRooms" data-live value="${tc.hotelRooms||0}"/></div>
          <div class="field" style="width:90px;"><label>Nights</label><input type="number" min="0" data-contract-field="lineitemtravel.${li.id}.hotelNights" data-focus-key="lineitemtravel.${li.id}.hotelNights" data-live value="${tc.hotelNights||0}"/></div>
        </div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:4px;">
          <label style="display:flex;align-items:center;gap:6px;font-size:12px;"><input type="checkbox" data-contract-field="lineitemtravel.${li.id}.food" data-live ${tc.food?'checked':''}/> Food</label>
          <label style="display:flex;align-items:center;gap:6px;font-size:12px;"><input type="checkbox" data-contract-field="lineitemtravel.${li.id}.shabbos" data-live ${tc.shabbos?'checked':''}/> Shabbos</label>
          <label style="display:flex;align-items:center;gap:6px;font-size:12px;"><input type="checkbox" data-contract-field="lineitemtravel.${li.id}.groundTransport" data-live ${tc.groundTransport?'checked':''}/> Ground transport</label>
        </div>
        ${sentence? `<p style="font-size:11px;color:var(--ink-3);margin:6px 0 0;">Adds to this line: "${esc(sentence)}"</p>` : ''}
      </details>
    </div>`; }).join('')}
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;">
      <h3 style="font-size:13.5px;margin:0;">Add-Ons</h3>
      <button class="btn btn-sm" data-action="add-add-on" data-id="${c.id}">${ICO.plus} Add Add-On</button>
    </div>
    ${c.addOns.map(a=>`<div class="field-row" style="align-items:flex-end;">
      <div class="field"><label>Label</label><input data-contract-field="addon.${a.id}.label" data-focus-key="addon.${a.id}.label" value="${esc(a.label||'')}" placeholder="e.g. Custom Bandstands"/></div>
      <div class="field" style="width:130px;"><label>Amount ($)</label><input type="number" data-contract-field="addon.${a.id}.amount" data-focus-key="addon.${a.id}.amount" data-live value="${a.amount||0}"/></div>
      <button class="icon-btn" data-action="remove-add-on" data-id="${a.id}" title="Remove" style="flex:none;" aria-label="Remove">${ICO.trash}</button>
    </div>`).join('')}
  </div>`;
}
function renderContractCustomClausesSection(c){
  return `<div class="card card-pad" style="display:flex;flex-direction:column;gap:10px;">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <h3 style="font-size:13.5px;margin:0;">Custom Clauses</h3>
      <button class="btn btn-sm" data-action="add-custom-clause" data-id="${c.id}">${ICO.plus} Add Clause</button>
    </div>
    ${c.customClauses.map(cc=>`<div style="display:flex;flex-direction:column;gap:6px;padding:8px;background:var(--surface-2);border-radius:8px;">
      <div style="display:flex;gap:6px;align-items:center;">
        <input data-contract-field="customclause.${cc.id}.title" value="${esc(cc.title||'')}" placeholder="Clause title" style="flex:1;font-weight:700;font-size:12.5px;padding:6px 8px;border-radius:6px;border:1px solid var(--border-strong);background:var(--surface);"/>
        <button class="icon-btn" data-action="remove-custom-clause" data-id="${cc.id}" title="Remove" style="flex:none;" aria-label="Remove">${ICO.trash}</button>
      </div>
      <textarea data-contract-field="customclause.${cc.id}.body" rows="2" placeholder="Body text" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--border-strong);background:var(--surface);font-size:12.5px;font-family:var(--font-body);color:var(--ink);">${esc(cc.body||'')}</textarea>
    </div>`).join('')}
  </div>`;
}

/* ---- Print/preview doc: one renderer per template, sharing a chrome + payee block ---- */
function docChrome(innerHtml, c){
  return `<div class="overlay center" data-action="contractbuilderdoc-overlay-close">
    <div class="doc" data-stop>
      <div class="sheet-head">
        <h2 style="font-size:1.1rem;">Contract Preview</h2>
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end;">
          ${c ? `<button class="btn btn-sm btn-primary" data-action="open-send-contract" data-id="${c.id}">${ICO.mail} Send to client</button>
          <button class="btn btn-sm" data-action="edit-contract-from-doc" data-id="${c.id}">${ICO.edit} Edit</button>` : ''}
          <button class="icon-btn" data-action="print-contract-builder" title="Print / Save as PDF" aria-label="Print / Save as PDF"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-2"/><rect x="6" y="14" width="12" height="7"/></svg></button>
          <button class="icon-btn" data-action="close-contract-builder-doc" aria-label="Close">${ICO.x}</button>
        </div>
      </div>
      <div class="doc-body">${innerHtml}</div>
    </div>
  </div>`;
}
function renderPayeeBlock(profile){
  if(!profile) return '';
  const lines = [];
  if(profile.zelle) lines.push(`Zelle: ${esc(profile.zelle)}`);
  if(profile.checkPayee) lines.push(`Check: ${esc(profile.checkPayee)}${profile.checkAddress? ', '+esc(profile.checkAddress):''}`);
  if(profile.wireBankName || profile.wireAccountNumber) lines.push(`Wire: ${esc(profile.wireAccountName||profile.entityName)} — ${esc(profile.wireBankName||'')}${profile.wireBankAddress?`, ${esc(profile.wireBankAddress)}`:''}${profile.wireAccountNumber?`, Account #${esc(profile.wireAccountNumber)}`:''}${profile.wireRoutingNumber?`, Routing #${esc(profile.wireRoutingNumber)}`:''}`);
  // profile.notes is the office's own memo (rates, reminders) -- never printed on a client's contract.
  if(profile.zelle) lines.push('IMPORTANT: Payments sent via Zelle must include event date/details in description. Otherwise, we cannot guarantee your deposit will be applied to your event.');
  return lines.length? `<div class="doc-section"><h3>Payment</h3><p style="font-size:12.5px;line-height:1.8;margin:0;">${lines.join('<br/>')}</p></div>` : '';
}
// Every contract goes out pre-signed by ASP for the artist (owner 2026-10-14); the client's side
// stays blank until they sign or pay the deposit.
// Electronic signature: matches the app's existing convention (see renderDocumentDoc)
// of rendering a typed name in a cursive script once accepted, rather than a blank line -- also the
// real-world behavior every "Acceptance" boilerplate clause already describes (deposit payment has
// "the same effect as a signature"). Triggered by marking the contract Signed.
function renderContractSignBlock(c, signingPartyLabel){
  const signed = c.status==='signed';
  const signedDate = signed ? fmtDateShort((c.signedAt||c.updatedAt).slice(0,10)) : '';
  let block = `<div class="doc-sign">
    <div class="doc-sign-line">${signed? `<span class="doc-signature">${esc((c.clientSignature&&c.clientSignature.name)||c.snapshot.clientName||'Client')}</span><br/>Signed electronically &middot; ${signedDate}` : `<strong>&nbsp;</strong>Client Signature &middot; Date`}</div>
    <div class="doc-sign-line"><span class="doc-signature">${esc(signingPartyLabel)}</span><br/>For Artist, ${esc(signingPartyLabel)}</div>
  </div>`;
  if(c.boilerplate.acceptanceClause){
    block += `<p style="font-size:11px;color:var(--ink-3);margin:8px 0 0;">A signature is welcome but not required where the deposit has been paid.</p>`;
  }
  return block;
}
function docBsdHeader(c){
  return `<div style="text-align:center;font-size:12px;font-weight:700;margin-bottom:8px;">BS"D</div>`; // always (owner 2026-10-15)
}
function renderContractBuilderDoc(c){
  if(!c) return '';
  return docChrome(contractDocContent(c), c);
}
// The Standard Artist Agreement in the office's own layout (owner 2026-10-13: "i dont like the
// boilerplate clauses, there should be a standard template" + 7 sample contracts): dark ASP header
// band, the not-binding strip, a date/hours/fee/deposit summary, the numbered ENGAGEMENT table, then
// TERMS in the contracts' own wording. Inline styles + fixed colors so the app, print, the emailed
// copy and the client signing page all look the same (the email never loads styles.css). The
// artist-specific lines (Mechitza, approvals, ...) still come from the contract's boilerplate flags,
// which default from that artist's payee profile.
// ASP document header band (contracts, gig sheets): dark band, ASP mark, kicker, big title, subtitle.
// Inline styles so it prints and emails the same.
// The dark band at the top of contracts and gig sheets: the logo (version 1, white and blue on dark)
// on its own line, then the document's title -- stacked, so it fits a phone and an email alike.
function aspDocHeaderHtml({ kicker, title, subtitle, bsd, light }){
  // light: white header with the dark logo -- gig sheets and itineraries (owner 2026-10-16: "remove the darker").
  if(light) return `<div style="background:#fff;color:#17171A;padding:4px 0 14px;border-bottom:2px solid #17171A;position:relative;">
      ${bsd? `<div style="position:absolute;top:0;right:0;font-size:11px;color:#5B78A8;">BS"D</div>` : ''}
      <img src="${BRAND_ASSET_BASE}asp-horizontal-dark.png" alt="ASP Management" width="170" style="display:block;width:170px;max-width:100%;height:auto;border:0;margin:0 0 12px;"/>
      <div style="font-size:10.5px;letter-spacing:.22em;color:#5B78A8;font-weight:700;">${kicker}</div>
      <div style="font-size:24px;font-weight:700;line-height:1.2;overflow-wrap:anywhere;">${title}</div>
      <div style="font-size:12.5px;color:#6B6B72;">${subtitle}</div>
    </div>`;
  return `<div style="background:#14161C;color:#fff;border-radius:10px 10px 0 0;padding:20px 24px;position:relative;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
      ${bsd? `<div style="position:absolute;top:10px;right:16px;font-size:11px;color:#9FB3D6;">BS"D</div>` : ''}
      <img src="${BRAND_ASSET_BASE}asp-horizontal-light.png" alt="ASP Management" width="190" style="display:block;width:190px;max-width:100%;height:auto;border:0;margin:0 0 14px;"/>
      <div style="font-size:10.5px;letter-spacing:.22em;color:#9FB3D6;">${kicker}</div>
      <div style="font-size:24px;font-weight:700;line-height:1.2;overflow-wrap:anywhere;">${title}</div>
      <div style="font-size:12.5px;color:#C9CFDA;">${subtitle}</div>
    </div>`;
}
// The Standard Artist Agreement's TERMS, in order (owner 2026-10-15: the terms "have to become standard").
// Always: not binding until the deposit, deposit/balance, overtime, travel (only with a flight), Mechitza,
// secular songs, weather/travel returns the deposit, postponement credit, cancellation, changes initialed.
// On top: the artist's own extra terms from their payee profile (approvals, Chassidish DJ, recording...).
// One function, used by the document and by the builder's read-only list, so both always agree.
const STANDARD_TERM_FLAGS = ['notBindingUntilDeposit','acceptanceClause','mechitza','mechitzaWithDancingOnly','noSecularSongs','weatherReturnsDeposit','postponementCreditsReschedule'];
function standardAgreementTerms(c){
  const figures = contractPaymentFigures(c), who = contractPerformerName(c);
  const travel = contractTravelSentence(c.travelClause);
  const plusTravel = travel ? ' plus travel expenses' : '';
  const pct = Number(c.deposit.percent)>0 ? `${Number(c.deposit.percent)}%` : (figures.total && figures.deposit ? `${Math.round(figures.deposit/figures.total*100)}%` : '');
  const timing = c.balanceDueTiming==='at_event' ? 'at the event' : c.balanceDueTiming==='on_completion' ? 'when the project is complete' : 'prior to the engagement';
  const terms = ['Contract is not binding until the deposit is received.'];
  terms.push(`A ${c.deposit.nonRefundable?'non-refundable ':''}deposit of ${money(figures.deposit)}${pct?` (${pct})`:''} is required to confirm the date. The outstanding balance of ${money(figures.balance)}${plusTravel} is to be paid ${timing}.`);
  if(c.overtime.interval==='not_applicable') terms.push('Overtime: N/A.');
  else if(Number(c.overtime.rate)) terms.push(`If the Artist is asked to stay beyond the agreed upon time, then a ${money(Number(c.overtime.rate))} per ${overtimeIntervalLabel(c.overtime.interval)} charge shall be paid in overtime fees.`);
  if(travel) terms.push(`Travel (${travel.replace(/^plus /,'')}) is booked by ASP Management and invoiced together with the final balance.`);
  terms.push(`${who} only performs at events where there is a Mechitza.`);
  terms.push('The Artist may refuse to sing any non-Jewish or secular songs at his discretion.');
  terms.push('If the event is cancelled due to weather or travel issues, the Artist agrees to return the deposit.');
  terms.push(`In the event of postponement or venue change, ${who} will use the deposit towards the rescheduled date (pending availability).`);
  const standardText = new Set(['This contract is not binding until the deposit is received.', 'The Artist may refuse to sing any non-Jewish or secular songs at his discretion.',
    'If the event is cancelled due to weather or travel issues, the Artist agrees to return the deposit.', 'If the event is postponed, the deposit will be credited toward a mutually agreed rescheduled date.']);
  contractBoilerplateLines(c).filter(l=>!standardText.has(l) && !/Mechitza/.test(l)).forEach(l=>terms.push(l));
  terms.push(contractCancellationText(c));
  terms.push('Any and all changes to this agreement must be approved and initialed by both Client and Artist.');
  return terms;
}
function contractMadeOnSentence(c){
  const d = new Date((c.createdAt||new Date().toISOString()).slice(0,10)+'T00:00:00');
  return `${ordinal(d.getDate())} day of the month of ${d.toLocaleString('en-US',{month:'long'})} ${d.getFullYear()}`;
}
function standardDocContent(c){
  const profile = contractPayeeProfile(c, housePayeeProfile);
  const brand = getBrandConfig(c.brand);
  const figures = contractPaymentFigures(c);
  const who = contractPerformerName(c);
  const b = c.boilerplate || {};
  const ev = getEvent(c.leadId);
  const start = ev && ev.time && ev.time!=='00:00' ? fmtTime(ev.time) : '';
  const travel = contractTravelSentence(c.travelClause);
  const plusTravel = travel ? ' plus travel expenses' : '';
  const pct = Number(c.deposit.percent)>0 ? `${Number(c.deposit.percent)}%` : (figures.total && figures.deposit ? `${Math.round(figures.deposit/figures.total*100)}%` : '');
  const depositLabel = `${money(figures.deposit)}${pct?` (${pct})`:''}`;
  const dateObj = c.snapshot.eventDate ? new Date(c.snapshot.eventDate+'T00:00:00') : null;
  const dateLong = dateObj ? dateObj.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'}) : 'TBD';
  const dateShort = dateObj ? dateObj.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}) : 'Date TBD';
  const where = [c.snapshot.city, c.snapshot.state].filter(Boolean).join(', ');
  const place = `${c.snapshot.venue || 'TBD'}${c.snapshot.address? ` — ${c.snapshot.address}` : ''}${where? `, ${where}` : ''}`;
  const hours = c.hoursOfEngagement || 'TBD';
  const hoursLine = `${hours}${start? `, starting ${start}` : ' (start time TBD)'}`;
  const timing = c.balanceDueTiming==='at_event' ? 'at the event' : c.balanceDueTiming==='on_completion' ? 'when the project is complete' : 'prior to the engagement';
  const terms = standardAgreementTerms(c);
  const ink = '#17171A', mute = '#6B6B72', rule = '#17171A', accent = '#5B78A8';
  const label = t=>`<div style="font-size:10.5px;letter-spacing:.22em;text-transform:uppercase;color:${accent};font-weight:700;margin:22px 0 8px;padding-bottom:6px;border-bottom:2px solid ${rule};">${t}</div>`;
  const row = (n,k,v)=>`<tr><td style="padding:8px 12px 8px 0;border-bottom:1px solid #E3E3E8;color:${mute};font-size:12.5px;vertical-align:top;white-space:nowrap;">${n}. ${k}</td><td style="padding:8px 0;border-bottom:1px solid #E3E3E8;font-weight:700;font-size:12.5px;">${v}</td></tr>`;
  const stat = (k,v)=>`<td style="padding:10px 18px 10px 0;vertical-align:top;border:none;background:none;"><div style="font-size:10.5px;color:${mute};">${k}</div><div style="font-size:13px;font-weight:700;">${v}</div></td>`;
  const phone = brand.phone || '';
  return `<div style="background:#fff;color:${ink};font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.55;">
    ${aspDocHeaderHtml({ kicker:`ARTIST AGREEMENT${c.status==='draft'?' &nbsp;|&nbsp; DRAFT':''}`, title:esc(who), subtitle:[esc(c.snapshot.occasion||''), esc(where), esc(dateShort)].filter(Boolean).join(' &middot; '), bsd:true })}
    ${b.notBindingUntilDeposit? `<div style="background:#FBEFD9;color:#8A5A0F;font-size:10.5px;font-weight:700;letter-spacing:.14em;padding:9px 24px;">NOT BINDING UNTIL THE DEPOSIT IS RECEIVED &middot; DATE IS NOT HELD UNTIL THE DEPOSIT IS RECEIVED</div>` : ''}
    <table role="presentation" style="border-collapse:collapse;margin:4px 0 0;width:100%;border:none;border-bottom:1px solid #E3E3E8;background:none;"><tr>
      ${stat('Event date', esc(dateShort))}${stat('Hours', esc(hours))}${stat('Fee', `${contractFeeDisplayHtml(c, figures)}${plusTravel? ' + travel':''}`)}${stat('Deposit', esc(depositLabel))}
    </tr></table>
    <div style="padding:6px 0 0;font-size:12.5px;">
      <p style="margin:14px 0 8px;">This contractual agreement is made on the <strong>${contractMadeOnSentence(c)}</strong>, between <strong>${esc(who)}</strong>, hereafter referred to as "the Artist", and <strong>${esc(c.snapshot.clientName||'the Client')}</strong>, hereafter referred to as "the Client". It is mutually agreed between the parties, as follows:</p>
      <p style="margin:0 0 4px;">The Client hereby engages the Artist, and the Artist hereby agrees to perform the engagement, the terms and conditions of which are set forth herein:</p>
      ${label('Engagement')}
      <table role="presentation" style="border-collapse:collapse;width:100%;">
        ${row(1,'Place of engagement', esc(place))}
        ${row(2,'Date of engagement', esc(dateLong))}
        ${row(3,'Occasion', esc(c.snapshot.occasion||'—'))}
        ${row(4,'Hours of engagement', esc(hoursLine))}
        ${row(5,'Payment for engagement', `${contractFeeDisplayHtml(c, figures)}${plusTravel}${c.fee.note?` ${esc(c.fee.note)}`:''}`)}
        ${row(6,'Terms of engagement', `${esc(who)} as performer for the engagement`)}
      </table>
      <p style="margin:12px 0 4px;"><strong>Artist shall provide:</strong> ${esc(`Vocal performance for up to ${hours}`)}.</p>
      <p style="margin:0;"><strong>Client shall provide:</strong> ${esc((c.clientProvides||[]).length ? c.clientProvides.join(', ') : 'Payment')}.</p>
      ${label('Terms')}
      <ul style="margin:0;padding-left:18px;">${terms.map(t=>`<li style="margin:0 0 5px;">${esc(t)}</li>`).join('')}</ul>
      ${c.template==='standard' || b.acceptanceClause? `<p style="margin:12px 0 0;"><strong>Acceptance.</strong> ${esc(contractAcceptanceText(c).replace(/^Acceptance\.\s*/,''))}</p>` : ''}
      <p style="margin:10px 0 0;">The signatures below confirm that the parties have read and approved all terms above.</p>
      ${(c.customClauses||[]).map(cc=>`${label(esc(cc.title||'Additional Terms'))}<p style="margin:0;white-space:pre-line;">${esc(cc.body)}</p>`).join('')}
      ${renderContractSignBlock(c, who)}
      ${contractClientContactLine(c)? `<p style="margin:12px 0 0;"><strong>Client contact:</strong> ${esc(contractClientContactLine(c).replace(/^Client contact:\s*/,'').replace(/ - /g,' — '))}</p>` : ''}
      ${label('Paying the Deposit')}
      ${paymentOptionsEmailBlock({ kind:'deposit', amount:figures.deposit, memo:c.id, zelle:depositZelle() })}
      <div style="margin-top:22px;padding-top:10px;border-top:1px solid #E3E3E8;font-size:10.5px;color:${mute};display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;">
        <span>${esc(brand.senderName||'ASP Management')}${brand.email?` &middot; ${esc(brand.email)}`:''}${phone?` &middot; ${esc(phone)}`:''}</span><span>Agreement ${esc(c.id)}</span>
      </div>
    </div>
  </div>`;
}
function comedianDocContent(c){
  const profile = contractPayeeProfile(c, housePayeeProfile);
  const brand = getBrandConfig(c.brand);
  const figures = contractPaymentFigures(c);
  const who = contractPerformerName(c);
  const boilerplate = contractBoilerplateLines(c);
  const travelSentence = contractTravelSentence(c.travelClause);
  const contactLine = contractClientContactLine(c);
  return `
    ${docBsdHeader(c)}
    <div class="doc-letterhead">
      <div class="doc-logo">${brandLogoHtml({ width:170 })}</div>
      <span class="pill ${contractStatusPillClass(c.status)}">${esc(contractStatusLabel(c.status))}</span>
    </div>
    <div class="doc-title">COMEDIAN AGREEMENT</div>
    <div class="doc-sub">Agreement ${esc(c.id)} &middot; ${contractDateSentence(c)}, between ${esc(who)}, hereafter referred to as "the Artist", and ${esc(c.snapshot.clientName||'the Client')}, hereafter referred to as "the Client".</div>
    <div class="doc-parties">
      <div class="doc-party"><h4>Artist</h4><p><strong>${esc(who)}</strong><br/>Represented by ${esc(profile.entityName)}</p></div>
      <div class="doc-party"><h4>Client</h4><p><strong>${esc(c.snapshot.clientName||'—')}</strong>${c.snapshot.clientEmail?`<br/>${esc(c.snapshot.clientEmail)}`:''}</p></div>
    </div>
    <div class="doc-section"><h3>Event Details</h3>
      <div class="doc-facts">
        <div><span class="k">Place</span><span>${esc(c.snapshot.venue)||'TBD'}</span></div>
        <div><span class="k">Date</span><span>${c.snapshot.eventDate? fmtDate(c.snapshot.eventDate) : 'TBD'}</span></div>
        <div><span class="k">Occasion</span><span>${esc(c.snapshot.occasion)||'Comedy Show'}</span></div>
        <div><span class="k">Performance Duration</span><span>${esc(c.performanceDuration)||'—'}</span></div>
        <div><span class="k">Performance Type</span><span>${esc(c.performanceType)||'—'}</span></div>
      </div>
    </div>
    <div class="doc-section"><h3>1. Compensation</h3>
      <div class="ledger" style="margin-bottom:8px;">
        <div class="ledger-row"><span>Total Fee${c.fee.note?` (${esc(c.fee.note)})`:''}</span><span class="amt">${contractFeeDisplayHtml(c, figures)}${travelSentence?` ${esc(travelSentence)}`:''}</span></div>
        <div class="ledger-row"><span>Deposit${c.deposit.nonRefundable?' (non-refundable)':''}${Number(c.deposit.percent)>0?` (${esc(String(c.deposit.percent))}%)`:''}</span><span class="amt">${money(figures.deposit)}</span></div>
        <div class="ledger-row total"><span>Balance Due</span><span class="amt">${money(figures.balance)}</span></div>
      </div>
      <p style="font-size:12.5px;margin:0;">${esc(contractBalanceDueText(c, figures))}</p>
      <p style="font-size:12.5px;margin:4px 0 0;">Additional Expenses: ${esc(c.additionalExpenses||'N/A')}</p>
      ${contractOvertimeHtml(c)}
    </div>
    ${c.clientProvides.length? `<div class="doc-section"><h3>2. Client Responsibilities</h3><ul class="doc-terms">${c.clientProvides.map(l=>`<li>${esc(l)}</li>`).join('')}</ul></div>` : ''}
    ${c.boilerplate.ipVideoClause? `<div class="doc-section"><h3>3. Intellectual Property</h3><ul class="doc-terms"><li>${esc(contractIpClauseText())}</li></ul></div>` : ''}
    <div class="doc-section"><h3>4. Terms &amp; Conditions</h3>
      <ul class="doc-terms">
        ${boilerplate.map(l=>`<li>${esc(l)}</li>`).join('')}
        ${c.boilerplate.noRecording? `<li>${esc(contractNoRecordingText())}</li>` : ''}
      </ul>
      <p style="font-size:12.5px;line-height:1.7;margin:8px 0 0;">${esc(contractCancellationText(c))}</p>
    </div>
    ${c.boilerplate.acceptanceClause? `<div class="doc-section"><p style="font-size:12.5px;line-height:1.7;margin:0;">${esc(contractAcceptanceText(c))}</p></div>` : ''}
    ${c.customClauses.map(cc=>`<div class="doc-section"><h3>${esc(cc.title||'Additional Terms')}</h3><p style="font-size:12.5px;line-height:1.7;margin:0;white-space:pre-line;">${esc(cc.body)}</p></div>`).join('')}
    ${renderContractSignBlock(c, brand.signer)}
    <div class="doc-section"><h3>Paying the Deposit</h3><div style="background:#fff;color:#17171A;border-radius:10px;padding:2px 12px 12px;">${paymentOptionsEmailBlock({ kind:'deposit', amount:contractPaymentFigures(c).deposit, memo:c.id, zelle:depositZelle() })}</div></div>
    ${contactLine? `<p style="font-size:11px;color:var(--ink-3);margin:10px 0 0;">${esc(contactLine)}</p>` : ''}
  `;
}
function multilineDocContent(c){
  const profile = contractPayeeProfile(c, housePayeeProfile);
  const brand = getBrandConfig(c.brand);
  const figures = contractPaymentFigures(c);
  const boilerplate = contractBoilerplateLines(c);
  const contactLine = contractClientContactLine(c);
  return `
    ${docBsdHeader(c)}
    <div class="doc-letterhead">
      <div class="doc-logo">${brandLogoHtml({ width:170 })}</div>
      <span class="pill ${contractStatusPillClass(c.status)}">${esc(contractStatusLabel(c.status))}</span>
    </div>
    <div class="doc-title">ARTIST AGREEMENT</div>
    <div class="doc-sub">Agreement ${esc(c.id)} &middot; ${contractDateSentence(c)}, between ${esc(profile.entityName)}, acting on behalf of the performers listed herein, collectively referred to as "the Artist", and ${esc(c.snapshot.clientName||'the Client')}, hereafter referred to as "the Client".</div>
    <div class="doc-parties">
      <div class="doc-party"><h4>Artists</h4><p>Represented by ${esc(profile.entityName)}</p></div>
      <div class="doc-party"><h4>Client</h4><p><strong>${esc(c.snapshot.clientName||'—')}</strong>${c.snapshot.clientEmail?`<br/>${esc(c.snapshot.clientEmail)}`:''}</p></div>
    </div>
    <div class="doc-section"><h3>Event Details</h3>
      <div class="doc-facts">
        <div><span class="k">Place of Engagement</span><span>${esc(c.snapshot.venue)||'TBD'}</span></div>
        <div><span class="k">Date of Engagement</span><span>${c.snapshot.eventDate? fmtDate(c.snapshot.eventDate) : 'TBD'}</span></div>
        <div><span class="k">Occasion</span><span>${esc(c.snapshot.occasion)||'—'}</span></div>
        <div><span class="k">Payment for Engagement</span><span>${contractFeeDisplayHtml(c, figures)}</span></div>
      </div>
    </div>
    <div class="doc-section"><h3>Terms of Engagement</h3>
      <ul class="doc-terms">${c.lineItems.map(li=>{ const travel = contractTravelSentence(li.travelClause); return `<li><strong>${esc(li.label||'—')}:</strong> ${money(li.fee||0)}${li.date? ` (${fmtDateShort(li.date)})`:''}${li.overtimeRate? ` — overtime ${esc(li.overtimeRate)}`:''}${travel? ` — ${esc(travel)}`:''}${li.notes? `<br/><span style="font-size:11.5px;color:var(--ink-3);">${esc(li.notes)}</span>`:''}</li>`; }).join('')}</ul>
    </div>
    ${c.addOns.length? `<div class="doc-section"><h3>Add-Ons</h3><ul class="doc-terms">${c.addOns.map(a=>`<li><strong>${esc(a.label||'—')}:</strong> ${money(a.amount||0)}</li>`).join('')}</ul></div>` : ''}
    ${c.barter && (c.barter.label||c.barter.description)? `<div class="doc-section"><h3>Non-Cash Compensation</h3><p style="font-size:12.5px;line-height:1.7;margin:0;"><strong>${esc(c.barter.label||'')}</strong>${c.barter.description?`<br/>${esc(c.barter.description)}`:''}</p></div>` : ''}
    ${c.artistProvides? `<div class="doc-section"><h3>Artist Shall Provide</h3><ul class="doc-terms"><li>${esc(c.artistProvides)}</li></ul></div>` : ''}
    ${c.clientProvides.length? `<div class="doc-section"><h3>Client Shall Provide</h3><ul class="doc-terms">${c.clientProvides.map(l=>`<li>${esc(l)}</li>`).join('')}</ul></div>` : ''}
    <div class="doc-section"><h3>Payment Terms</h3>
      <div class="ledger" style="margin-bottom:8px;">
        <div class="ledger-row"><span>Total Payment</span><span class="amt">${contractFeeDisplayHtml(c, figures)}</span></div>
        <div class="ledger-row"><span>Deposit${c.deposit.nonRefundable?' (non-refundable)':''}${Number(c.deposit.percent)>0?` (${esc(String(c.deposit.percent))}%)`:''}</span><span class="amt">${money(figures.deposit)}</span></div>
        <div class="ledger-row total"><span>Balance Due</span><span class="amt">${money(figures.balance)}</span></div>
      </div>
      <p style="font-size:12.5px;margin:0;">${esc(contractBalanceDueText(c, figures))}</p>
      ${contractOvertimeHtml(c)}
    </div>
    ${boilerplate.length? `<div class="doc-section"><h3>Terms &amp; Conditions</h3><ul class="doc-terms">${boilerplate.map(l=>`<li>${esc(l)}</li>`).join('')}</ul></div>` : ''}
    ${c.boilerplate.acceptanceClause? `<div class="doc-section"><p style="font-size:12.5px;line-height:1.7;margin:0;">${esc(contractAcceptanceText(c))}</p></div>` : ''}
    <div class="doc-section"><p style="font-size:12.5px;line-height:1.7;margin:0;">${esc(contractCancellationText(c))}</p></div>
    ${c.customClauses.map(cc=>`<div class="doc-section"><h3>${esc(cc.title||'Additional Terms')}</h3><p style="font-size:12.5px;line-height:1.7;margin:0;white-space:pre-line;">${esc(cc.body)}</p></div>`).join('')}
    ${renderContractSignBlock(c, brand.signer)}
    <div class="doc-section"><h3>Paying the Deposit</h3><div style="background:#fff;color:#17171A;border-radius:10px;padding:2px 12px 12px;">${paymentOptionsEmailBlock({ kind:'deposit', amount:contractPaymentFigures(c).deposit, memo:c.id, zelle:depositZelle() })}</div></div>
    ${contactLine? `<p style="font-size:11px;color:var(--ink-3);margin:10px 0 0;">${esc(contactLine)}</p>` : ''}
  `;
}
function creativeDocContent(c){
  const profile = contractPayeeProfile(c, airschnitzPayeeProfile);
  const brand = getBrandConfig(c.brand);
  const figures = contractPaymentFigures(c);
  const contactLine = contractClientContactLine(c);
  return `
    ${docBsdHeader(c)}
    <div class="doc-letterhead">
      <div class="doc-logo">${brandLogoHtml({ width:170 })}</div>
      <span class="pill ${contractStatusPillClass(c.status)}">${esc(contractStatusLabel(c.status))}</span>
    </div>
    <div class="doc-title">CREATIVE / VIDEO PRODUCTION AGREEMENT</div>
    <div class="doc-sub">Agreement ${esc(c.id)} &middot; ${contractDateSentence(c)}, between ${esc(profile.entityName)}, hereafter referred to as "the Artist", and ${esc(c.snapshot.clientName||'the Client')}, hereafter referred to as "the Client".</div>
    <div class="doc-parties">
      <div class="doc-party"><h4>Artist</h4><p><strong>${esc(profile.entityName)}</strong></p></div>
      <div class="doc-party"><h4>Client / Organization</h4><p><strong>${esc(c.snapshot.clientName||'—')}</strong>${c.snapshot.clientEmail?`<br/>${esc(c.snapshot.clientEmail)}`:''}</p></div>
    </div>
    <div class="doc-section"><h3>Project Details</h3>
      <div class="doc-facts">
        <div><span class="k">Project Name</span><span>${esc(c.creative.projectName)||'—'}</span></div>
        <div><span class="k">Event Name</span><span>${esc(c.snapshot.eventName)||'—'}</span></div>
        <div><span class="k">Event Date</span><span>${c.snapshot.eventDate? fmtDate(c.snapshot.eventDate) : 'TBD'}</span></div>
        <div><span class="k">On-Site Filming Days</span><span>up to ${esc(String(c.creative.filmingDays||3))}</span></div>
        <div><span class="k">Revision Rounds</span><span>${esc(c.creative.revisionRounds||'')}</span></div>
        <div><span class="k">Creative Fee</span><span>${contractFeeDisplayHtml(c, figures)}${c.fee.note?` ${esc(c.fee.note)}`:''}</span></div>
      </div>
    </div>
    <div class="doc-section"><h3>Payment Terms</h3>
      <div class="ledger" style="margin-bottom:8px;">
        <div class="ledger-row"><span>Total Fee</span><span class="amt">${contractFeeDisplayHtml(c, figures)}</span></div>
        <div class="ledger-row"><span>Deposit${c.deposit.nonRefundable?' (non-refundable)':''}${Number(c.deposit.percent)>0?` (${esc(String(c.deposit.percent))}%)`:''}</span><span class="amt">${money(figures.deposit)}</span></div>
        <div class="ledger-row total"><span>Balance Due</span><span class="amt">${money(figures.balance)}</span></div>
      </div>
      <p style="font-size:12.5px;margin:0;">${esc(contractBalanceDueText(c, figures))}</p>
    </div>
    <div class="doc-section"><h3>Terms &amp; Conditions</h3>
      <ul class="doc-terms">
        ${c.boilerplate.notBindingUntilDeposit? `<li>This agreement is not binding until the deposit is received.</li>` : ''}
        <li>Once the Client considers the project complete, no further revisions, additions, or changes will be made.</li>
      </ul>
      <p style="font-size:12.5px;line-height:1.7;margin:8px 0 0;">${esc(contractCancellationText(c))}</p>
    </div>
    ${c.customClauses.map(cc=>`<div class="doc-section"><h3>${esc(cc.title||'Additional Terms')}</h3><p style="font-size:12.5px;line-height:1.7;margin:0;white-space:pre-line;">${esc(cc.body)}</p></div>`).join('')}
    ${renderContractSignBlock(c, brand.signer)}
    <div class="doc-section"><h3>Paying the Deposit</h3><div style="background:#fff;color:#17171A;border-radius:10px;padding:2px 12px 12px;">${paymentOptionsEmailBlock({ kind:'deposit', amount:contractPaymentFigures(c).deposit, memo:c.id, zelle:depositZelle() })}</div></div>
    ${contactLine? `<p style="font-size:11px;color:var(--ink-3);margin:10px 0 0;">${esc(contactLine)}</p>` : ''}
  `;
}
// Template key → its document body. The single dispatcher for both the on-screen doc and the
// emailed HTML (there were two identical if-chains; 2026-10-09 audit 5.4, first step). A new
// template adds one row here (plus its builder sections / defaults, still in the builder for now).
const CONTRACT_DOC_CONTENT = { standard: standardDocContent, comedian: comedianDocContent, multiline: multilineDocContent, creative: creativeDocContent };
function contractDocContent(c){
  return (CONTRACT_DOC_CONTENT[c.template] || standardDocContent)(c);
}
// Standalone HTML for the emailed copy -- inlined, hardcoded colors (not var(...), which many
// email clients strip) since the recipient's inbox never loads styles.css. Mirrors the on-screen
// .doc-* look closely enough to read the same, not a pixel-exact match.
function contractEmailHtml(c){
  return `<!doctype html><html><head><meta charset="utf-8"/><style>
    body{ margin:0; padding:24px; background:#F5F4EF; font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif; color:#17171A; }
    .doc{ max-width:640px; margin:0 auto; background:#fff; padding:32px; border-radius:10px; }
    .doc-letterhead{ display:flex; align-items:center; justify-content:space-between; padding-bottom:18px; border-bottom:2px solid #17171A; margin-bottom:22px; }
    .wordmark{ font-size:1.15rem; font-weight:700; }
    .pill{ display:inline-block; padding:3px 9px; border-radius:999px; font-size:11.5px; font-weight:700; background:#E4EAF3; color:#33517A; }
    .doc-title{ font-size:1.5rem; font-weight:700; text-align:center; margin:6px 0 2px; }
    .doc-sub{ text-align:center; font-size:11.5px; color:#9A9AA1; margin-bottom:26px; }
    .doc-parties{ display:table; width:100%; margin-bottom:22px; }
    .doc-party{ display:table-cell; width:50%; vertical-align:top; }
    .doc-party h4{ font-size:11px; text-transform:uppercase; letter-spacing:.07em; color:#9A9AA1; font-weight:700; margin:0 0 6px; }
    .doc-party p{ margin:0; font-size:13.5px; line-height:1.5; }
    .doc-section{ margin-bottom:18px; }
    .doc-section h3{ font-size:1.05rem; margin:0 0 10px; }
    .doc-facts{ display:table; width:100%; font-size:13px; margin-bottom:10px; }
    .doc-facts > div{ display:table-row; }
    .doc-facts .k{ display:table-cell; font-size:10.5px; text-transform:uppercase; letter-spacing:.06em; color:#9A9AA1; font-weight:700; padding:3px 12px 3px 0; white-space:nowrap; }
    .doc-facts > div > span:last-child{ display:table-cell; padding:3px 0; }
    .doc-terms{ font-size:12.5px; line-height:1.7; color:#67676D; padding-left:18px; margin:0; }
    .ledger-row{ display:flex; justify-content:space-between; padding:7px 0; border-bottom:1px dashed #E1E1E6; font-size:13px; }
    .ledger-row.total{ border-bottom:none; border-top:1px solid #D1D1D8; margin-top:2px; padding-top:10px; font-weight:700; font-size:14.5px; }
    .doc-sign{ display:table; width:100%; margin-top:26px; }
    .doc-sign-line{ display:table-cell; width:50%; border-top:1px solid #17171A; padding:8px 16px 0 0; font-size:12px; color:#67676D; }
    .doc-sign-line strong{ display:block; font-size:13.5px; color:#17171A; }
    .doc-signature{ display:inline-block; font-family:"Snell Roundhand","Segoe Script","Brush Script MT",cursive; font-size:1.7rem; color:#17171A; }
    .doc-foot{ margin-top:26px; padding-top:14px; border-top:1px solid #E1E1E6; font-size:10.5px; color:#9A9AA1; text-align:center; }
  </style></head><body><div class="doc">${contractDocContent(c)}</div></body></html>`;
}

/* ---- Global "Contract Builder" list page (browse every contract across every lead) ---- */
function renderContractsBuilderListPage(){
  const q = (S.contractsSearchQuery||'').trim().toLowerCase();
  const statusFilter = S.contractsStatusFilter||'all';
  let list = CONTRACTS.slice().sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
  if(statusFilter!=='all') list = list.filter(c=>c.status===statusFilter);
  if(q) list = list.filter(c=>(c.snapshot.clientName||'').toLowerCase().includes(q) || contractPerformerName(c).toLowerCase().includes(q) || contractTemplateLabel(c.template).toLowerCase().includes(q));
  return `<div class="section-head"><h2>Contract Builder (${CONTRACTS.length})</h2></div>
    <p style="font-size:11.5px;color:var(--ink-3);margin:-8px 0 12px;">Every contract across every lead, to edit, approve and send. The <a href="#" data-action="nav" data-view="contracts" style="color:var(--accent);">Contracts</a> page lists the same contracts read-first.</p>
    <input id="contractsSearchInput" value="${esc(S.contractsSearchQuery||'')}" placeholder="Search client, performer, or template..." style="width:100%;max-width:360px;padding:9px 12px;border-radius:8px;border:1px solid var(--border-strong);background:var(--surface);font-size:14px;margin-bottom:10px;"/>
    <div class="chip-row" style="margin-bottom:14px;">
      <button class="filter-chip ${statusFilter==='all'?'sel':''}" data-action="filter-contracts-status" data-status="all">All</button>
      ${CONTRACT_STATUSES.map(([s])=>`<button class="filter-chip ${statusFilter===s?'sel':''}" data-action="filter-contracts-status" data-status="${s}">${esc(contractStatusLabel(s))}</button>`).join('')}
    </div>
    ${list.length? `<div class="card table-cards"><table>
      <thead><tr><th>Client</th><th>Performer</th><th>Template</th><th>Event Date</th><th>Status</th></tr></thead>
      <tbody>${list.map(c=>`<tr class="row-link" data-action="open-contract-builder" data-id="${c.id}">
        <td data-label="Client">${esc(c.snapshot.clientName)||'—'}</td>
        <td data-label="Performer">${esc(contractPerformerName(c))}</td>
        <td data-label="Template">${esc(contractTemplateLabel(c.template))}</td>
        <td data-label="Event Date">${c.snapshot.eventDate? fmtDateShort(c.snapshot.eventDate) : '—'}</td>
        <td data-label="Status"><span class="pill ${contractStatusPillClass(c.status)}">${esc(contractStatusLabel(c.status))}</span></td>
      </tr>`).join('')}</tbody>
    </table></div>` : `<div class="empty">No contracts yet — create one from a lead's detail view.</div>`}
    `;
}

/* ---- Payee profile management (Settings) ---- */
function renderPayeeProfilesCard(){
  return `<div class="card card-pad" style="margin-bottom:20px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <h3 style="margin:0;">Performer Payee Profiles</h3>
      <button class="btn btn-sm btn-primary" data-action="open-payee-profile-form">${ICO.plus} Add Profile</button>
    </div>
    ${PAYEE_PROFILES.map(p=>{ const artist = p.artistId ? artistById(p.artistId) : null; return `<div class="settings-row">
      <div style="display:flex;align-items:center;gap:10px;">
        <span class="avatar" data-slot="1" style="width:28px;height:28px;font-size:11px;">${esc((p.entityName||'?').slice(0,1))}</span>
        <div><h4>${esc(p.entityName)}</h4><p>${artist? `Default for ${esc(artist.name)}` : 'House profile (no specific artist)'}${stripePayeeActive(stripePayeeOf(p.id))?' · Online payouts active':''}</p></div>
      </div>
      <div style="display:flex;gap:4px;">
        <button class="icon-btn" data-action="open-payee-profile-form" data-id="${p.id}" title="Edit" aria-label="Edit">${ICO.edit}</button>
        <button class="icon-btn" data-action="delete-payee-profile" data-id="${p.id}" title="Delete" aria-label="Delete">${ICO.trash}</button>
      </div>
    </div>`; }).join('')}
  </div>`;
}
function renderOnlinePaymentsCard(){
  const st = S.stripeStatus;
  const status = !st ? `<span class="pill pill-neutral">Checking…</span>`
    : st.connected ? `<span class="pill ${st.mode==='live'?'pill-good':'pill-warn'}">Connected${st.mode==='test'?' — test mode':''}</span>${st.accountName?` <span style="font-size:12.5px;">${esc(st.accountName)}</span>`:''}`
    : `<span class="pill pill-neutral">Not set up</span>`;
  const warnings = st && st.connected ? [
    st.mode==='test' ? 'Test mode: clients see a test-card note and no real money moves. Swap in the live keys when ready.' : '',
    !st.webhook ? 'The Stripe webhook isn\'t set up yet: bank transfers won\'t be marked paid when they clear.' : '',
    st.mode==='live' && !st.chargesEnabled ? 'Stripe hasn\'t enabled charges on this account yet — finish the account setup in Stripe.' : '',
  ].filter(Boolean) : [];
  return `<div class="card card-pad" style="margin-bottom:20px;" data-testid="online-payments-card">
    <h3 style="margin-bottom:12px;">Online payments (Stripe)</h3>
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;">${status}</div>
    ${st && st.connected ? '' : `<p style="font-size:12.5px;color:var(--ink-3);margin:0 0 10px;">${st && st.error ? `Stripe didn't accept the key: ${esc(st.error)}. ` : ''}Clients pay deposits and invoices by card or bank transfer from the email link. Setup: <code>ops/STRIPE_SETUP.md</code>.</p>`}
    ${warnings.map(w=>`<p style="font-size:11.5px;color:var(--warn-ink);margin:0 0 6px;">${w}</p>`).join('')}
    <label class="lib-check" style="margin:14px 0 2px;white-space:normal;"><input type="checkbox" data-field="zelleOff" data-form="orgsettings" ${ORG_SETTINGS.zelleOff?'checked':''} data-testid="zelle-off"/> Don't offer Zelle to clients (contracts, invoices and emails show only Pay online, and check / cash by calling)</label>
    <h4 style="margin:16px 0 6px;font-size:.95rem;">Zelle for deposits and invoices (ASP)</h4>
    <p style="font-size:11.5px;color:var(--ink-3);margin:0 0 8px;">Shown under the Pay online button as “Scan here to pay the deposit”. Balances use each artist's own Zelle QR (Payee Profiles). Get the QR from your bank app: Zelle → your QR code → save the picture.</p>
    <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap;">
      ${ORG_SETTINGS.depositZelleQrUrl ? `<img src="${esc(ORG_SETTINGS.depositZelleQrUrl)}" alt="ASP Zelle QR" width="88" height="88" data-testid="deposit-zelle-qr" style="border-radius:6px;background:#fff;border:1px solid var(--border);"/>` : ''}
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <label class="btn btn-sm" style="cursor:pointer;display:inline-flex;">${S.depositQrBusy?'Uploading…':(ORG_SETTINGS.depositZelleQrUrl?'Replace QR image':'Upload QR image')}<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" data-action="upload-deposit-zelle-qr" style="display:none;" ${S.depositQrBusy?'disabled':''}/></label>
        ${ORG_SETTINGS.depositZelleQrUrl ? `<button class="btn btn-sm btn-ghost" data-action="remove-deposit-zelle-qr">Remove</button>` : ''}
      </div>
    </div>
    <div class="field" style="margin-top:8px;max-width:320px;"><label>Zelle email or phone (shown if there's no QR)</label><input data-field="depositZelleHandle" data-form="orgsettings" value="${esc(ORG_SETTINGS.depositZelleHandle||'')}" placeholder="billing@aspmgmt.com"/></div>
    <div class="field" style="margin-top:8px;max-width:260px;"><label>Credit card fee (%)</label><input data-field="cardFeePercent" data-form="orgsettings" type="number" min="0" max="3" step="0.1" value="${esc(String(ORG_SETTINGS.cardFeePercent||0))}"/></div>
    <p style="font-size:11.5px;color:var(--ink-3);margin:4px 0 0;">Added to <strong>credit</strong> card payments only (never debit cards or bank transfer), shown to the client before they pay, max 3%. Notify Visa and Mastercard at least 30 days before turning it on. Never charged for gigs in CT or MA. Bank transfers cost ASP 0.8% (max $5).</p>
  </div>`;
}
/* ---- Mercury (0067, owner 2026-10-27: "create sub accounts that the money can automatically get split up so
   my payouts are easier") ----
   ASP's main Mercury account plus one account per singer. The mercury function reads the bank's incoming
   money into the Inbox (bank-verified, so exact matches record themselves) and, once a gig's balance paid
   into ASP's main account or ASP's own Stripe is recorded, proposes each artist's share as a transfer to
   their own account. Nothing moves until someone with a money role approves it. */
async function refreshMercuryStatus(){
  const data = await callEdgeFunction('mercury', { action:'status' });
  S.mercuryStatus = data && data.ok ? data : { configured:false, accounts:[], transfers:[], error:(data && data.error) || 'Could not check Mercury.' };
  render();
}
async function doMercuryCall(body, okMsg){
  if(S.mercuryBusy) return;
  S.mercuryBusy = true; render();
  try{
    const res = await callEdgeFunction('mercury', body);
    if(!res.ok) toast(res.error || 'Mercury did not accept that.', 'system');
    else toast(res.test ? 'Test mode: recorded, no money moved.' : okMsg, 'success');
    if(res.ok && body.action==='sync') loadInbox();
  } finally { S.mercuryBusy = false; await refreshMercuryStatus(); }
}
const MERCURY_WAITING = ['proposed','failed'];
function mercuryTransfersWaiting(){ return ((S.mercuryStatus && S.mercuryStatus.transfers) || []).filter(t=>MERCURY_WAITING.includes(t.status)); }
function renderMercuryTransfers(){
  const list = mercuryTransfersWaiting(); if(!list.length) return '';
  const st = S.mercuryStatus;
  return `<div class="card card-pad" style="margin-bottom:14px;" data-testid="mercury-transfers">
    <h3 style="margin:0 0 4px;">Singers' shares to move (${list.length})</h3>
    <p style="font-size:11.5px;color:var(--ink-3);margin:0 0 10px;">Balances paid into ASP's main Mercury account: each artist's share (fee less commission, plus charges) goes to their own Mercury account.${st.canMoveMoney ? '' : ' <strong>Test mode</strong>: approving records it but moves no money.'}</p>
    ${list.map(t=>{ const ev = getEvent(t.event_legacy_id); return `<div class="settings-row" style="flex-wrap:wrap;gap:8px;">
      <div style="min-width:0;flex:1 1 220px;"><h4 style="overflow-wrap:anywhere;">${moneyCents(t.amount_cents/100)} → ${esc(t.payee_name||'artist')}</h4>
        <p style="overflow-wrap:anywhere;">${ev ? `<a href="#" data-action="open-event" data-id="${esc(ev.id)}" style="color:var(--accent);">${esc((artistById(ev.artistId)||{}).name||'')} · ${esc(fmtDateShort(ev.date))} · ${esc(ev.clientName||'')}</a>` : esc(t.event_legacy_id)}${t.source==='stripe'?' · paid online':''}</p>
        ${t.error ? `<p style="color:var(--warn-ink);overflow-wrap:anywhere;">${esc(t.error)}</p>` : ''}</div>
      <div style="display:flex;gap:6px;"><button class="btn btn-sm btn-primary" data-action="mercury-approve" data-id="${esc(t.id)}" ${S.mercuryBusy?'disabled':''}>${t.status==='failed'?'Try again':'Approve'}</button>
        <button class="btn btn-sm btn-ghost" data-action="mercury-cancel" data-id="${esc(t.id)}" ${S.mercuryBusy?'disabled':''}>Not this one</button></div>
    </div>`; }).join('')}
  </div>`;
}
function renderMercuryCard(){
  const st = S.mercuryStatus;
  const status = !st ? `<span class="pill pill-neutral">Checking…</span>`
    : st.configured ? `<span class="pill ${st.canMoveMoney && !st.sandbox ? 'pill-good' : 'pill-warn'}">Connected${st.sandbox ? ' — sandbox' : st.canMoveMoney ? '' : ' — test mode (watching only)'}</span>`
    : `<span class="pill pill-neutral">Not set up</span>`;
  const payees = PAYEE_PROFILES.filter(p=>p.artistId);
  const accounts = (st && st.accounts) || [];
  const recent = ((st && st.transfers) || []).filter(t=>!MERCURY_WAITING.includes(t.status)).slice(0, 5);
  return `<div class="card card-pad" style="margin-bottom:20px;" data-testid="mercury-card">
    <h3 style="margin-bottom:12px;">Bank (Mercury) — singers' accounts</h3>
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;">${status}
      ${st && st.configured ? `<button class="btn btn-sm" data-action="mercury-sync" ${S.mercuryBusy?'disabled':''}>${S.mercuryBusy?'Working…':'Check the bank now'}</button>` : ''}
      ${st && st.lastRunAt ? `<span style="font-size:11.5px;color:var(--ink-3);">Last checked ${esc(new Date(st.lastRunAt).toLocaleString('en-US',{ month:'short', day:'numeric', hour:'numeric', minute:'2-digit' }))}</span>` : ''}</div>
    ${st && st.lastError ? `<p style="font-size:11.5px;color:var(--warn-ink);margin:0 0 6px;overflow-wrap:anywhere;">${esc(st.lastError)}</p>` : ''}
    <p style="font-size:12.5px;color:var(--ink-3);margin:0 0 10px;">Money coming into Mercury shows in the Inbox and is matched to its gig. When a gig's balance lands in ASP's main account, each singer's share is moved into their own Mercury account after you approve it.${st && st.configured ? '' : ' Setup: <code>ops/MERCURY_SETUP.md</code>.'}</p>
    <div class="field" style="max-width:420px;"><label>Balances paid online (Stripe) go to</label>
      <select data-field="payoutVia" data-form="orgsettings">
        <option value="" ${ORG_SETTINGS.payoutVia!=='mercury'?'selected':''}>Each artist's own Stripe account</option>
        <option value="mercury" ${ORG_SETTINGS.payoutVia==='mercury'?'selected':''}>ASP, then split into singers' Mercury accounts</option>
      </select></div>
    ${accounts.length ? `<h4 style="margin:14px 0 6px;font-size:.95rem;">Accounts</h4>
      ${accounts.map(a=>`<div class="settings-row" style="flex-wrap:wrap;gap:8px;"><div style="min-width:0;flex:1 1 180px;"><h4 style="overflow-wrap:anywhere;">${esc(a.name||'Account')}</h4><p>${esc([a.kind, a.status].filter(Boolean).join(' · '))}</p></div>
        <select data-action="mercury-assign" data-id="${esc(a.account_id)}" style="max-width:100%;" ${S.mercuryBusy?'disabled':''}>
          <option value="" ${!a.role?'selected':''}>Not used yet</option>
          <option value="main" ${a.role==='main'?'selected':''}>ASP main account</option>
          ${payees.map(p=>`<option value="payee:${esc(p.id)}" ${a.role==='payee'&&a.payee_profile_id===p.id?'selected':''}>${esc(p.entityName)}${p.artistId && artistById(p.artistId) ? ` (${esc(artistById(p.artistId).name)})` : ''}</option>`).join('')}
          <option value="ignore" ${a.role==='ignore'?'selected':''}>Ignore (not gig money)</option>
        </select></div>`).join('')}` : ''}
    ${recent.length ? `<h4 style="margin:14px 0 6px;font-size:.95rem;">Recent transfers</h4>${recent.map(t=>`<p style="font-size:12px;margin:0 0 4px;overflow-wrap:anywhere;">${esc(t.status==='sent'?'Sent to Mercury':t.status==='test'?'Test':'Cancelled')}: ${moneyCents(t.amount_cents/100)} to ${esc(t.payee_name||'')} for ${esc(t.event_legacy_id)}${t.note && t.status!=='cancelled' ? ` — ${esc(t.note)}` : ''}</p>`).join('')}` : ''}
  </div>`;
}
// Shown only once QuickBooks is set up (QBO_CLIENT_ID); owner 2026-10-29 asked for the "not set up" card gone.
function renderQuickBooksCard(){
  const st = S.qboStatus;
  const configured = !!QBO_CLIENT_ID;
  return `<div class="card card-pad" style="margin-bottom:20px;">
    <h3 style="margin-bottom:12px;">QuickBooks</h3>
    ${!configured? `<p style="font-size:12.5px;color:var(--ink-3);margin:0 0 10px;">Not set up yet -- needs an Intuit Developer app registered first. See <code>ops/QUICKBOOKS_SETUP.md</code>.</p>
      <button class="btn btn-sm" disabled style="opacity:.55;cursor:not-allowed;">Connect QuickBooks</button>`
    : st && st.connected ? `<div class="settings-row">
        <div style="display:flex;align-items:center;gap:10px;">
          <span class="pill pill-good">Connected</span>
          <div><p style="margin:0;">Company ID ${esc(st.realmId||'')}${st.connectedAt?` &middot; connected ${fmtDateShort(st.connectedAt.slice(0,10))}`:''}</p></div>
        </div>
        <button class="btn btn-sm btn-ghost" data-action="oauth-connect" data-provider="qbo">Reconnect</button>
      </div>
      <p style="font-size:11.5px;color:var(--ink-3);margin:8px 0 0;">Sending a contract can also create and email a QuickBooks invoice for the deposit, payable by credit card.</p>`
    : `<p style="font-size:12.5px;color:var(--ink-3);margin:0 0 10px;">Not connected yet. Connecting lets Send Contract also create and email a real QuickBooks invoice for the deposit.</p>
      <button class="btn btn-sm btn-primary" data-action="oauth-connect" data-provider="qbo">Connect QuickBooks</button>`}
  </div>`;
}
function renderTravelSettingsCard(){
  return `<div class="card card-pad" style="margin-bottom:20px;">
    <h3 style="margin-bottom:6px;">Travel (Rivky)</h3>
    <p style="font-size:11.5px;color:var(--ink-3);margin:0 0 12px;">Travel requests are never sent until this is set — per the spec, Rivky's address is never hardcoded into the app.</p>
    <div class="field"><label>Rivky's Email</label><input data-field="rivkyEmail" data-form="orgsettings" type="email" value="${esc(ORG_SETTINGS.rivkyEmail||'')}" placeholder="rivky@example.com"/></div>
  </div>`;
}
function renderGoogleCalendarSyncCard(){
  const st = S.gcalStatus;
  const configured = !!GOOGLE_CALENDAR_CLIENT_ID;
  return `<div class="card card-pad" style="margin-bottom:20px;">
    <h3 style="margin-bottom:12px;">Google Calendar Sync (HOLD/CONFIRMED)</h3>
    ${!configured? `<p style="font-size:12.5px;color:var(--ink-3);margin:0 0 10px;">Not set up yet -- needs a Google Cloud OAuth client registered first. See <code>ops/GOOGLE_CALENDAR_SETUP.md</code>.</p>
      <button class="btn btn-sm" disabled style="opacity:.55;cursor:not-allowed;">Connect Google Calendar</button>`
    : st && st.connected ? `<div class="settings-row">
        <div style="display:flex;align-items:center;gap:10px;">
          <span class="pill pill-good">Connected</span>
          <div><p style="margin:0;">${esc(st.email||'')}${st.connectedAt?` &middot; connected ${fmtDateShort(st.connectedAt.slice(0,10))}`:''}</p></div>
        </div>
        <button class="btn btn-sm btn-ghost" data-action="oauth-connect" data-provider="gcal">Reconnect</button>
      </div>
      <p style="font-size:11.5px;color:var(--ink-3);margin:8px 0 0;">Sending a contract can also create/update a HOLD on ASP's main calendar and each selected artist's calendar, moving to CONFIRMED once the deposit is received.</p>`
    : `<p style="font-size:12.5px;color:var(--ink-3);margin:0 0 10px;">Not connected yet. This is separate from the per-user "Connected Accounts" toggle above -- that's a one-way, no-auth "Add to Google Calendar" link; this is the real server-side sync that creates/updates events by exact calendar + event ID.</p>
      <button class="btn btn-sm btn-primary" data-action="oauth-connect" data-provider="gcal">Connect Google Calendar</button>`}
    ${renderCalendarMappingSection()}
  </div>`;
}
// Which real Google Calendar ID each target (ASP main + each artist) writes to -- can be filled
// in before the account is even connected (the Connect step above only authorizes read/write
// access; it doesn't know which specific calendars to use). doCreateCalendarHoldsForContract()
// only attempts a target once both this mapping AND the connection exist.
function renderCalendarMappingSection(){
  const mappings = S.calendarMappings;
  const busy = !!S.calendarMappingsBusy;
  const mapFor = (artistId)=> (mappings||[]).find(m=> artistId? m.artist_id===artistDbId(artistId) : !m.artist_id);
  return `<div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border);">
    <h4 style="font-size:12px;margin:0 0 8px;color:var(--ink-2);">Calendar ID Mapping</h4>
    ${!mappings? `<button class="btn btn-sm btn-ghost" data-action="check-calendar-mappings" ${busy?'disabled':''}>${busy?'Loading…':'Load Mapping'}</button>`
    : `<div style="display:flex;flex-direction:column;gap:6px;">
        <div class="field-row" style="align-items:center;">
          <div class="field" style="flex:none;width:120px;"><label style="font-size:10px;">ASP Main</label></div>
          <div class="field"><input data-calendar-mapping="asp_main" value="${esc((mapFor(null)||{}).config?.calendar_id||'')}" placeholder="calendar id or email"/></div>
        </div>
        ${ARTISTS.map(a=>`<div class="field-row" style="align-items:center;">
          <div class="field" style="flex:none;width:120px;"><label style="font-size:10px;">${esc(a.name.split(' ')[0])}</label></div>
          <div class="field"><input data-calendar-mapping="${a.id}" value="${esc((mapFor(a.id)||{}).config?.calendar_id||'')}" placeholder="calendar id or email"/></div>
        </div>`).join('')}
        <button class="btn btn-sm btn-ghost" style="align-self:flex-start;" data-action="check-calendar-mappings">Refresh</button>
      </div>`}
  </div>`;
}
function renderGmailMailboxesCard(){
  const configured = !!GMAIL_CLIENT_ID;
  const boxes = S.gmailMailboxes;
  // Load the list on its own the first time Settings shows it (owner 2026-10-15: the Connect button was
  // hidden behind 'Check Mailboxes').
  if(boxes==null && !S.gmailMailboxesBusy && !S.gmailMailboxesAutoTried && S.realSession){ S.gmailMailboxesAutoTried = true; setTimeout(loadGmailStatus, 0); }
  const busy = !!S.gmailMailboxesBusy;
  const f = S.newGmailMailboxForm||{};
  return `<div class="card card-pad" style="margin-bottom:20px;">
    <h3 style="margin-bottom:6px;">Gmail Mailboxes (Inbox &amp; Money In)</h3>
    <p style="font-size:11.5px;color:var(--ink-3);margin:0 0 12px;">Every connected mailbox is read (read-only) every 10 minutes for the Inbox. Add the inbox your bank's Zelle "you received money" alerts go to as a <strong>Payments inbox</strong> — only payment emails are read there — so money coming in is matched to its invoice or gig. ${!configured? 'Not set up yet -- see <code>ops/GMAIL_SETUP.md</code>.' : ''}</p>
    <div class="field-row" style="align-items:flex-end;">
      <div class="field"><label>Artist</label>
        <select data-field="artistId" data-form="gmailmailbox">
          <option value="">— ASP sending mailbox —</option>
          <option value="__payments" ${f.artistId==='__payments'?'selected':''}>Payments inbox (Zelle / bank alerts)</option>
          ${ARTISTS.map(a=>`<option value="${a.id}" ${f.artistId===a.id?'selected':''}>${esc(a.name)}</option>`).join('')}
        </select>
      </div>
      <div class="field"><label>Mailbox Email</label><input data-field="email" data-form="gmailmailbox" type="email" value="${esc(f.email||'')}" placeholder="name@gmail.com"/></div>
    </div>
    <button class="btn btn-sm" style="margin-bottom:12px;" data-action="add-gmail-mailbox">${ICO.plus} Add Mailbox</button>
    ${!boxes? `<button class="btn btn-sm btn-ghost" data-action="check-gmail-mailboxes" ${busy?'disabled':''}>${busy?'Checking…':'Check Mailboxes'}</button>`
    : boxes.length===0? `<p style="font-size:12px;color:var(--ink-3);margin:0;">No mailboxes added yet.</p>`
    : `<div style="display:flex;flex-direction:column;gap:8px;">
        ${boxes.map(m=>{ const a = m.artist_id ? artistByDbId(m.artist_id) : null; return `<div class="settings-row">
          <div><h4>${esc(a?a.name:m.mailbox_type==='payments'?'Payments inbox':'ASP Sending')}</h4><p>${esc(m.email)}</p></div>
          ${m.connected? `<span class="pill pill-good">Connected</span>` : configured? `<button class="btn btn-sm btn-primary" data-action="oauth-connect" data-provider="gmail" data-id="${esc(m.id)}">Connect</button>` : `<span class="pill">Not connected</span>`}
        </div>`; }).join('')}
        <button class="btn btn-sm btn-ghost" style="align-self:flex-start;" data-action="check-gmail-mailboxes">Refresh</button>
      </div>`}
  </div>`;
}
function renderReconciliationCard(){
  const queue = S.reconciliationQueue;
  const busy = !!S.reconciliationBusy;
  return `<div class="card card-pad" style="margin-bottom:20px;">
    <h3 style="margin-bottom:6px;">Payment Reconciliation Queue</h3>
    <p style="font-size:11.5px;color:var(--ink-3);margin:0 0 12px;">QuickBooks payments the webhook couldn't match to a known invoice land here rather than being silently dropped. Read-only for now — resolve one directly in Supabase or QuickBooks.</p>
    ${!queue? `<button class="btn btn-sm" data-action="check-reconciliation-queue" ${busy?'disabled':''}>${busy?'Checking…':'Check Queue'}</button>`
    : queue.length===0? `<div class="settings-row" style="border-bottom:none;"><span class="pill pill-good">Nothing unmatched</span><button class="btn btn-sm btn-ghost" data-action="check-reconciliation-queue">Refresh</button></div>`
    : `<div style="display:flex;flex-direction:column;gap:8px;">
        ${queue.map(p=>`<div class="settings-row"><div><h4>${money(p.amount)}</h4><p>${esc(p.notes||'')} &middot; ${fmtDateShort((p.received_at||'').slice(0,10))}</p></div><span class="pill">Unmatched</span></div>`).join('')}
        <button class="btn btn-sm btn-ghost" style="align-self:flex-start;" data-action="check-reconciliation-queue">Refresh</button>
      </div>`}
  </div>`;
}
// Zelle review queue (ops automation spec item 6): mirrors the QuickBooks Reconciliation Queue
// exactly -- read-only for now, real Supabase read, session-guarded. No parser exists yet to
// actually populate zelle_notifications (that's the biggest piece of item 6 still unbuilt, see
// ops/GMAIL_SETUP.md), so this shows nothing until that lands -- but the admin surface is ready
// the moment it does, rather than needing a UI built later under time pressure.
async function loadZelleReviewQueue(){
  if(!supabaseClient) return;
  const { data: { session } } = await supabaseClient.auth.getSession();
  if(!session) return;
  S.zelleReviewQueueBusy = true; render();
  try{
    const { data, error } = await supabaseClient.from('zelle_notifications').select('*').eq('status','unmatched').order('received_at', {ascending:false});
    if(error){ toast('Could not load the Zelle review queue: ' + error.message, 'system'); return; }
    S.zelleReviewQueue = data||[];
  } finally {
    S.zelleReviewQueueBusy = false; render();
  }
}
function renderZelleReviewQueueCard(){
  const queue = S.zelleReviewQueue;
  const busy = !!S.zelleReviewQueueBusy;
  return `<div class="card card-pad" style="margin-bottom:20px;">
    <h3 style="margin-bottom:6px;">Zelle Review Queue</h3>
    <p style="font-size:11.5px;color:var(--ink-3);margin:0 0 12px;">Zelle notices below the auto-match confidence threshold land here for manual review. Read-only for now — resolve one directly in Supabase.</p>
    ${!queue? `<button class="btn btn-sm" data-action="check-zelle-review-queue" ${busy?'disabled':''}>${busy?'Checking…':'Check Queue'}</button>`
    : queue.length===0? `<div class="settings-row" style="border-bottom:none;"><span class="pill pill-good">Nothing to review</span><button class="btn btn-sm btn-ghost" data-action="check-zelle-review-queue">Refresh</button></div>`
    : `<div style="display:flex;flex-direction:column;gap:8px;">
        ${queue.map(n=>`<div class="settings-row"><div><h4>${money(n.amount||0)}${n.sender_name?` — ${esc(n.sender_name)}`:''}</h4><p>${esc(n.memo||'')} &middot; ${fmtDateShort((n.received_at||'').slice(0,10))}</p></div><span class="pill">Unmatched</span></div>`).join('')}
        <button class="btn btn-sm btn-ghost" style="align-self:flex-start;" data-action="check-zelle-review-queue">Refresh</button>
      </div>`}
  </div>`;
}
/* ---- Back up / Restore (2026-10-09 audit 3.1, first step) ----
   Each office browser's localStorage is the ONLY copy of its business data. Back up downloads every
   asp_* key as one JSON file (generated here, uploaded nowhere). Restore MERGES a file in: records
   are added by id where this browser doesn't have them, nothing here is overwritten or deleted.
   The same restore also imports a prepared gig file (same format) without putting client data in
   the public code. */
const LAST_BACKUP_LS_KEY = 'asp_last_backup_at';
const BACKUP_FORMAT = 'asp-local-backup';
function aspLocalKeys(){ const keys = []; for(let i=0;i<localStorage.length;i++){ const k = localStorage.key(i); if(k && k.startsWith('asp_') && k!==LAST_BACKUP_LS_KEY) keys.push(k); } return keys.sort(); }
function doDownloadBackup(){
  const data = {};
  aspLocalKeys().forEach(k=>{ try{ data[k] = JSON.parse(localStorage.getItem(k)); }catch(e){ data[k] = localStorage.getItem(k); } });
  const file = { format: BACKUP_FORMAT, formatVersion: 1, app: 'asp-bookings', appVersion: APP_VERSION, createdAt: new Date().toISOString(), data };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(file, null, 1)], { type:'application/json' }));
  a.download = `asp-bookings-backup-${todayISO()}.json`; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href), 10000);
  try{ localStorage.setItem(LAST_BACKUP_LS_KEY, new Date().toISOString()); }catch(e){}
  toast('Backup downloaded — keep it somewhere safe (it contains client details).', 'success');
  render();
}
// Pure merge plan: what restoring `file` would add to this browser. Arrays of {id} records merge by
// id (only missing ids are added); any other value is restored only if this browser has none.
function planRestore(file){
  if(!file || file.format!==BACKUP_FORMAT || !file.data || typeof file.data!=='object') return { error:'That file isn\'t an ASP Bookings backup.' };
  const steps = [];
  Object.keys(file.data).filter(k=>k.startsWith('asp_') && k!==LAST_BACKUP_LS_KEY).forEach(k=>{
    const incoming = file.data[k];
    let local = null; try{ local = JSON.parse(localStorage.getItem(k)); }catch(e){ local = localStorage.getItem(k); }
    if(Array.isArray(incoming) && incoming.every(x=>x && typeof x==='object' && x.id!==undefined)){
      const have = new Set((Array.isArray(local)? local : []).map(x=>x.id));
      const add = incoming.filter(x=>!have.has(x.id));
      if(add.length) steps.push({ key:k, merged:(Array.isArray(local)? local : []).concat(add), added:add.length });
    } else if(local===null || local===undefined){
      steps.push({ key:k, merged:incoming, added:1, whole:true });
    }
  });
  return { steps };
}
function doRestoreFromFile(fileObj){
  if(!fileObj) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    let parsed; try{ parsed = JSON.parse(reader.result); }catch(e){ toast('That file isn\'t valid JSON.', 'system'); return; }
    const plan = planRestore(parsed);
    if(plan.error){ toast(plan.error, 'system'); return; }
    if(!plan.steps.length){ toast('Nothing to restore — this browser already has everything in that file.', 'system'); return; }
    const summary = plan.steps.map(st=> st.whole ? `• ${st.key}: restore (none here yet)` : `• ${st.key}: add ${st.added} record${st.added===1?'':'s'}`).join('\n');
    if(!confirm(`Restore from "${fileObj.name}"?\n\nThis only ADDS what this browser doesn't have — nothing here is changed or deleted.\n\n${summary}`)) return;
    for(const st of plan.steps){ const r = persist(st.key, st.merged, 'the restored data'); if(!r.ok) return; }
    location.reload();
  };
  reader.readAsText(fileObj);
}
function renderBackupCard(){
  let last = null; try{ last = localStorage.getItem(LAST_BACKUP_LS_KEY); }catch(e){}
  const ageDays = last ? Math.floor((Date.now() - Date.parse(last)) / 86400000) : null;
  const stale = ageDays===null || ageDays > 7;
  return `<div class="card card-pad" style="margin-bottom:20px;">
    <h3 style="margin-bottom:6px;">Back up &amp; restore this browser's data</h3>
    <p style="font-size:12.5px;color:var(--ink-2);margin:0 0 10px;">Gigs, contracts, payee profiles and the rest are stored <strong>only in this browser</strong> on this computer for now. Clearing browser data or switching computers loses them unless you have a backup.</p>
    <p style="font-size:12px;margin:0 0 12px;color:${stale?'var(--warn-ink)':'var(--ink-3)'};">${last ? `Last backup: ${esc(fmtDateShort(localISO(new Date(last))))}${stale?' — time for a new one':''}` : 'No backup yet from this browser.'}</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <button class="btn btn-sm btn-primary" data-action="download-backup">${ICO.check} Back up my data</button>
      <label class="btn btn-sm" style="cursor:pointer;">Restore / import from file<input id="restoreFileInput" type="file" accept="application/json,.json" style="display:none;"/></label>
    </div>
  </div>`;
}
function renderDataMigrationCard(){
  const preview = S.migrationPreview;
  return `<div class="card card-pad" style="margin-bottom:20px;">
    <h3 style="margin-bottom:6px;">Data Migration (Supabase)</h3>
    <p style="font-size:11.5px;color:var(--ink-3);margin:0 0 12px;">Payee profiles and contracts currently live only in this browser's storage. This moves them into the real Supabase tables (see <code>supabase/migrations/0010-0016</code>) without deleting or changing anything here -- safe to preview repeatedly, and re-running only picks up records that aren't migrated yet.</p>
    ${!preview? `<button class="btn btn-sm" data-action="preview-data-migration">Preview</button>`
    : `<div style="display:flex;flex-direction:column;gap:10px;">
        <div class="settings-row">
          <div><h4>Payee Profiles</h4><p>${preview.payeeProfiles.migrated} of ${preview.payeeProfiles.total} migrated</p></div>
          ${preview.payeeProfiles.migrated<preview.payeeProfiles.total? `<button class="btn btn-sm btn-primary" data-action="migrate-payee-profiles">Migrate ${preview.payeeProfiles.total-preview.payeeProfiles.migrated}</button>` : `<span class="pill pill-good">Done</span>`}
        </div>
        <div class="settings-row">
          <div><h4>Contracts</h4><p>${preview.contracts.migrated} of ${preview.contracts.total} migrated</p></div>
          ${preview.contracts.migrated<preview.contracts.total? `<button class="btn btn-sm btn-primary" data-action="migrate-contracts">Migrate ${preview.contracts.total-preview.contracts.migrated}</button>` : `<span class="pill pill-good">Done</span>`}
        </div>
        <p style="font-size:11px;color:var(--ink-3);margin:0;">Migrate payee profiles first -- contracts link to them by their new Supabase id when available. Events (and contracts' link back to their lead) aren't part of this pass yet; that's its own follow-up given the volume of real imported gigs.</p>
        <button class="btn btn-sm btn-ghost" style="align-self:flex-start;" data-action="preview-data-migration">Refresh</button>
      </div>`}
  </div>`;
}
function renderPayeeProfileFormModal(){
  const f = S.payeeProfileForm||{};
  const editing = !!S.editingPayeeProfileId;
  return `<div class="overlay center" data-action="payeeprofileform-overlay-close">
    <div class="modal" data-stop data-form="payeeprofile" style="width:460px;">
      <div class="sheet-head"><h2 style="font-size:1.3rem;">${editing?'Edit Payee Profile':'Add Payee Profile'}</h2><button class="icon-btn" data-action="close-payee-profile-form" aria-label="Close">${ICO.x}</button></div>
      <div class="sheet-body">
        <div class="field"><label>Entity Name</label><input data-field="entityName" value="${esc(f.entityName||'')}" placeholder="e.g. Baruch Levine Music Inc."/></div>
        <div class="field"><label>Default Artist (optional — blank = house profile)</label>
          <select data-field="artistId">
            <option value="" ${!f.artistId?'selected':''}>— None (house profile) —</option>
            ${ARTISTS.map(a=>`<option value="${a.id}" ${f.artistId===a.id?'selected':''}>${esc(a.name)}</option>`).join('')}
          </select>
        </div>
        <div class="field-row">
          <div class="field"><label>Zelle Identifier</label><input data-field="zelle" value="${esc(f.zelle||'')}" placeholder="email or phone"/></div>
          <div class="field"><label>Zelle Display Name</label><input data-field="zelleRecipientLabel" value="${esc(f.zelleRecipientLabel||'')}" placeholder="shown on the QR block"/></div>
        </div>
        <div class="field"><label>Zelle Instructions (optional)</label><input data-field="zelleInstructions" value="${esc(f.zelleInstructions||'')}" placeholder="e.g. include the event date in the memo"/></div>
        <div class="field" style="flex-direction:row;align-items:center;gap:8px;">
          <input type="checkbox" id="zelleActiveCk" data-field="zelleActive" ${f.zelleActive!==false?'checked':''}/>
          <label for="zelleActiveCk" style="text-transform:none;font-size:13px;color:var(--ink);font-weight:500;">Active — offered as this artist's balance-due Zelle payee</label>
        </div>
        <div class="field"><label>Zelle QR Image (optional — overrides the generated placeholder)</label>
          ${f.zelleQrDataUrl? `<div style="display:flex;align-items:center;gap:10px;"><img src="${safeDataUrl(f.zelleQrDataUrl)}" width="72" height="72" style="border-radius:6px;background:#fff;padding:4px;border:1px solid var(--border);"/><button type="button" class="btn btn-sm btn-ghost" data-action="remove-payee-zelle-qr">Remove</button></div>`
          : `<label class="btn btn-sm" style="cursor:pointer;display:inline-flex;">Upload QR Image<input type="file" accept="image/*" data-action="upload-payee-zelle-qr" style="display:none;"/></label>`}
        </div>
        ${editing ? renderPayeeStripeSection(S.editingPayeeProfileId) : ''}
        <div class="field-row">
          <div class="field"><label>Check Payee</label><input data-field="checkPayee" value="${esc(f.checkPayee||'')}"/></div>
          <div class="field"><label>Check Address</label><input data-field="checkAddress" value="${esc(f.checkAddress||'')}"/></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Wire Bank</label><input data-field="wireBankName" value="${esc(f.wireBankName||'')}"/></div>
          <div class="field"><label>Wire Account Name</label><input data-field="wireAccountName" value="${esc(f.wireAccountName||'')}"/></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Account #</label><input data-field="wireAccountNumber" value="${esc(f.wireAccountNumber||'')}"/></div>
          <div class="field"><label>Routing #</label><input data-field="wireRoutingNumber" value="${esc(f.wireRoutingNumber||'')}"/></div>
        </div>
        <div class="field"><label>Default Overtime Interval</label>
          <div class="chip-row">${['half_hour','15_min','hour'].map(iv=>`<button class="filter-chip ${(f.defaultOvertimeInterval||'half_hour')===iv?'sel':''}" data-action="pick-payee-overtime-interval" data-value="${iv}">${overtimeIntervalLabel(iv)}</button>`).join('')}</div>
        </div>
        <div class="field-row">
          <div class="field"><label>Standard Fee ($, optional)</label><input type="number" data-field="defaultFee" value="${f.defaultFee||''}" placeholder="prefills new contracts, never overwrites a known price"/></div>
          <div class="field"><label>Standard Hours (optional)</label><input data-field="defaultHours" value="${esc(f.defaultHours||'')}" placeholder="e.g. 5 hours"/></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Standard Deposit ($, optional)</label><input type="number" data-field="defaultDepositAmount" value="${f.defaultDepositAmount||''}" placeholder="flat amount, e.g. 2000"/></div>
          <div class="field"><label>— or Deposit (% of total)</label><input type="number" data-field="defaultDepositPercent" value="${f.defaultDepositPercent||''}" placeholder="% wins if both are set"/></div>
        </div>
        <div class="field"><label>Notes</label><textarea data-field="notes" rows="2" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--border-strong);background:var(--surface);font-size:12.5px;font-family:var(--font-body);color:var(--ink);">${esc(f.notes||'')}</textarea></div>
        <button class="btn btn-primary btn-block" data-action="save-payee-profile">Save Profile</button>
      </div>
    </div>
  </div>`;
}

/* ============ TRAVEL CONFIRMATIONS -> ITINERARY (owner 2026-10-14) ============ */
// Rivky drops in what the concierge sent (PDFs, screenshots, pasted text); parse-travel-docs (Claude)
// lists every flight, hotel and car; the office checks the list and saves it on the gig as ev.travel
// (additive). The first flight / car also fill ev.flight / ev.groundTransport, so flight tracking,
// conflicts and the existing cards keep working. The itinerary below shows everything.
function travelOf(ev){ return { flights:[], hotels:[], ground:[], notes:'', updatedAt:null, ...(ev.travel||{}) }; }
const travelDT = v=>String(v||'').replace('T',' ').slice(0,16);
// Attach dropped / chosen confirmations and read them straight away (one step).
function attachTravelFiles(list){
  list = list.slice(0, 6);
  if(!list.length) return;
  if(list.some(f=>f.size > 5*1024*1024)){ toast('Each file must be under 5 MB.', 'system'); return; }
  Promise.all(list.map(file=>new Promise(res=>{ const r = new FileReader(); r.onload = ()=>{ const u = String(r.result||''); res({ name:file.name, mediaType:file.type, data:u.slice(u.indexOf(',')+1) }); }; r.readAsDataURL(file); })))
    .then(files=>{ S.travelDropFiles = files; doReadTravelDocs(); });
}
async function doReadTravelDocs(){
  const f = S.travelDropForm || {};
  const files = S.travelDropFiles || [];
  if(!(f.text||'').trim() && !files.length){ toast('Attach the confirmations or paste their text first.', 'system'); return; }
  S.travelDropBusy = true; render();
  try{
    const res = await callEdgeFunction('parse-travel-docs', { text:(f.text||'').trim(), files: files.map(x=>({ mediaType:x.mediaType, data:x.data })) });
    if(!res.ok){ toast(res.error || 'Could not read those confirmations.', 'system'); return; }
    S.travelDropResult = res.travel || { flights:[], hotels:[], ground:[], notes:'' };
    const n = (S.travelDropResult.flights||[]).length + (S.travelDropResult.hotels||[]).length + (S.travelDropResult.ground||[]).length;
    toast(n ? 'Read — check the list and save it to the itinerary.' : 'No flights, hotels or cars found in that.', n ? 'success' : 'system');
  } finally {
    S.travelDropBusy = false; render();
  }
}
function doSaveTravelDocs(id){
  const ev = getEvent(id); const x = S.travelDropResult; if(!ev || !x) return;
  const prev = travelOf(ev);
  const travel = { flights:[...prev.flights, ...(x.flights||[])], hotels:[...prev.hotels, ...(x.hotels||[])], ground:[...prev.ground, ...(x.ground||[])],
    notes: [prev.notes, x.notes].filter(Boolean).join('\n'), updatedAt: new Date().toISOString() };
  const patch = { travel };
  const f0 = travel.flights[0];
  if(f0){
    patch.flightNeeded = true; patch.flightBooked = true;
    patch.flight = { ...(ev.flight||{}), airline:f0.airline||'—', flightNumber:(f0.flightNumber||'').replace(/\s+/g,''), confirmation:f0.confirmation||'—',
      depart: travelDT(f0.departAt)||'—', arrive: travelDT(f0.arriveAt)||'—', notes:(ev.flight&&ev.flight.notes)||'' };
  }
  const g0 = travel.ground[0];
  if(g0){
    patch.groundTransportNeeded = true; patch.groundTransportBooked = true;
    patch.groundTransport = { driverName:g0.driver||g0.company||'—', driverPhone:g0.phone||'—', pickupTime:travelDT(g0.pickupAt)||'—', pickupLocation:g0.pickupLocation||'—',
      dropoffTime:'—', dropoffLocation:g0.dropoffLocation||'—', notes:g0.company && g0.driver ? g0.company : '' };
  }
  const n = (x.flights||[]).length, h = (x.hotels||[]).length, c = (x.ground||[]).length;
  logEvent(ev, 'system', `Travel confirmations added to the itinerary: ${n} flight${n===1?'':'s'}, ${h} hotel${h===1?'':'s'}, ${c} car${c===1?'':'s'}.`);
  S.showTravelDrop=false; S.travelDropForm={}; S.travelDropFiles=[]; S.travelDropResult=null;
  if(reportEventSave(updateEvent(id, patch), 'saving the travel confirmations')) toast('Saved to the itinerary.', 'success');
  openEvent(id);
}
function renderTravelDropModal(){
  const ev = getEvent(S.eventId); if(!ev) return '';
  const f = S.travelDropForm || {}, files = S.travelDropFiles || [], x = S.travelDropResult, busy = !!S.travelDropBusy;
  const box = 'width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--border-strong);font:inherit;';
  const line = (t,sub)=>`<div style="padding:8px 0;border-bottom:1px dashed var(--border);font-size:12.5px;"><strong>${t}</strong>${sub?`<div style="color:var(--ink-3);">${sub}</div>`:''}</div>`;
  return `<div class="overlay center" data-action="travel-drop-overlay-close">
    <div class="modal" data-stop data-form="traveldrop" style="width:520px;">
      <div class="sheet-head"><h2 style="font-size:1.2rem;">Travel Confirmations</h2><button class="icon-btn" data-action="close-travel-drop" aria-label="Close">${ICO.x}</button></div>
      <div class="sheet-body">
        <p style="font-size:12px;color:var(--ink-3);margin:0;">Attach the flight, hotel and car confirmations (PDFs or screenshots) or paste their text. Nothing is saved until you press Save.</p>
        <label class="drop-zone ${busy?'busy':''}" data-drop="travel" data-testid="travel-drop">${ICO.upload}<strong>${busy ? 'Reading…' : files.length ? `${files.length} file${files.length===1?'':'s'}: ${esc(files.map(x=>x.name).join(', '))}` : 'Drop flight, hotel and car confirmations here'}</strong><span>PDFs or screenshots, up to 6 · or tap to choose · read as soon as you drop them</span><input type="file" data-action="travel-drop-files" accept="application/pdf,image/*" multiple style="display:none;" ${busy?'disabled':''}/></label>
        <textarea data-field="text" rows="4" placeholder="…or paste the confirmation emails here" style="${box}">${esc(f.text||'')}</textarea>
        <button class="btn btn-primary btn-sm" style="align-self:flex-start;" data-action="read-travel-docs" ${busy?'disabled':''}>${busy?'Reading…':'Read confirmations'}</button>
        ${x? `<div class="card card-pad">
          ${(x.flights||[]).map(fl=>line(`${ICO.plane} ${esc(fl.airline)} ${esc(fl.flightNumber)} &middot; ${esc(fl.departAirport)} → ${esc(fl.arriveAirport)}`, `${esc(fmtFlightDateTime(travelDT(fl.departAt)))}${fl.arriveAt?` → ${esc(fmtFlightDateTime(travelDT(fl.arriveAt)))}`:''}${fl.confirmation?` &middot; Conf. ${esc(fl.confirmation)}`:''}${fl.passenger?` &middot; ${esc(fl.passenger)}`:''}`)).join('')}
          ${(x.hotels||[]).map(h=>line(`Hotel: ${esc(h.name)}`, `${esc(h.checkIn)}${h.checkOut?` → ${esc(h.checkOut)}`:''}${h.confirmation?` &middot; Conf. ${esc(h.confirmation)}`:''}${h.address?`<br/>${esc(h.address)}`:''}`)).join('')}
          ${(x.ground||[]).map(g=>line(`${ICO.car} ${esc(g.company||g.driver||'Car')}`, `${g.pickupAt?esc(fmtFlightDateTime(travelDT(g.pickupAt))):''}${g.pickupLocation?` &middot; ${esc(g.pickupLocation)}`:''}${g.dropoffLocation?` → ${esc(g.dropoffLocation)}`:''}${g.phone?` &middot; ${esc(g.phone)}`:''}`)).join('')}
          ${x.notes? `<p style="font-size:12px;color:var(--ink-2);margin:8px 0 0;">${esc(x.notes)}</p>` : ''}
          <button class="btn btn-primary btn-block" style="margin-top:10px;" data-action="save-travel-docs" data-id="${ev.id}">Save to itinerary</button>
        </div>` : ''}
      </div>
    </div>
  </div>`;
}
// The artist's itinerary (owner 2026-10-14: "a travel document itinerary for the artist"), ASP-branded
// like the contract and gig sheet: the gig, every flight, hotel and car, notes and the day's contacts.
// The itinerary's flights, newest data first (ev.travel), else the gig's single booked flight.
function itineraryFlights(ev){
  const t = travelOf(ev);
  return t.flights.length ? t.flights : (ev.flight && ev.flightBooked ? [{ airline:ev.flight.airline, flightNumber:ev.flight.flightNumber||'', confirmation:ev.flight.confirmation, departAt:ev.flight.depart, arriveAt:ev.flight.arrive, departAirport:'', arriveAirport:'' }] : []);
}
// "Add to calendar" for one flight (owner 2026-10-15: artists track it in Flighty automatically). Flighty
// has no public add-flight link, but its Calendar Sync picks up flight events from the phone's calendar.
// Times are the airports' local times, written as floating times.
function downloadFlightIcs(ev, idx){
  const fl = itineraryFlights(ev)[idx]; if(!fl) return;
  const stamp = v=>{ const m = String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/); return m ? `${m[1]}${m[2]}${m[3]}T${m[4]}${m[5]}00` : ''; };
  const start = stamp(fl.departAt); if(!start){ toast('This flight has no departure time yet.', 'system'); return; }
  const end = stamp(fl.arriveAt) || start;
  const num = String(fl.flightNumber||'').replace(/\s+/g,'');
  const title = `Flight ${num}${fl.departAirport&&fl.arriveAirport?` ${fl.departAirport} → ${fl.arriveAirport}`:''}`;
  const ics = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//ASP Management//Itinerary//EN','BEGIN:VEVENT',`UID:${ev.id}-flight-${idx}-${num}@asp-bookings`,
    `DTSTART:${start}`,`DTEND:${end}`,`SUMMARY:${title}`,`DESCRIPTION:${[fl.airline, num, fl.confirmation&&fl.confirmation!=='—'?`Confirmation ${fl.confirmation}`:''].filter(Boolean).join(' · ')}`,
    `LOCATION:${fl.departAirport||''}`,'END:VEVENT','END:VCALENDAR'].join('\r\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], {type:'text/calendar'})); a.download = `${num||'flight'}_${start.slice(0,8)}.ics`; a.click();
}
function itineraryDocHtml(ev){
  const artist = artistById(ev.artistId) || {name:''};
  const t = travelOf(ev);
  const flights = itineraryFlights(ev);
  const ground = t.ground.length ? t.ground : (ev.groundTransport && ev.groundTransportBooked ? [{ company:'', driver:ev.groundTransport.driverName, phone:ev.groundTransport.driverPhone, pickupAt:ev.groundTransport.pickupTime, pickupLocation:ev.groundTransport.pickupLocation, dropoffLocation:ev.groundTransport.dropoffLocation }] : []);
  const mute = '#6B6B72', accent = '#5B78A8';
  const label = s=>`<div style="font-size:10.5px;letter-spacing:.22em;text-transform:uppercase;color:${accent};font-weight:700;margin:22px 0 8px;padding-bottom:6px;border-bottom:2px solid #17171A;">${s}</div>`;
  const cell = 'padding:7px 12px 7px 0;border:none;border-bottom:1px solid #E3E3E8;background:none;font-size:12.5px;vertical-align:top;';
  const dt = v=>{ const s2 = travelDT(v); return s2 && s2!=='—' ? fmtFlightDateTime(s2) : ''; };
  const where = [ev.venue, ev.address, [ev.city, ev.state].filter(Boolean).join(', ')].filter(Boolean).join(', ');
  const sheet = gigInfoSheetOf(ev);
  return `<div style="background:#fff;color:#17171A;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.55;">
    ${aspDocHeaderHtml({ light:true, kicker:'TRAVEL ITINERARY', title:esc(artist.name), subtitle:[esc(ev.type||''), esc(where), ev.date? esc(fmtDateShort(ev.date)) : ''].filter(Boolean).join(' &middot; ') })}
    <table role="presentation" style="border-collapse:collapse;width:100%;margin-top:6px;border:none;background:none;">
      ${[['Event', `${fmtDate(ev.date)} · ${fmtTimeRange(ev.time, ev.endTime)}`], ['Venue', where||'TBD'], ...(sheet.startTime? [['Artist starts', fmtTime(sheet.startTime)]] : [])]
        .map(([k,v])=>`<tr><td style="${cell}color:${mute};width:130px;">${esc(k)}</td><td style="${cell}font-weight:700;">${esc(v)}</td></tr>`).join('')}
    </table>
    ${flights.length? `${label('Flights')}${flights.map(fl=>`<table role="presentation" style="border-collapse:collapse;width:100%;margin-bottom:10px;border:none;background:none;">
      <tr><td style="${cell}font-weight:700;" colspan="2">${esc(fl.airline||'')} ${esc(fl.flightNumber||'')}${fl.departAirport||fl.arriveAirport? ` &middot; ${esc(fl.departAirport)} → ${esc(fl.arriveAirport)}` : ''}</td></tr>
      <tr><td style="${cell}color:${mute};width:130px;">Departs</td><td style="${cell}">${esc(dt(fl.departAt))}</td></tr>
      ${fl.arriveAt? `<tr><td style="${cell}color:${mute};">Arrives</td><td style="${cell}">${esc(dt(fl.arriveAt))}</td></tr>` : ''}
      ${fl.confirmation && fl.confirmation!=='—'? `<tr><td style="${cell}color:${mute};">Confirmation</td><td style="${cell}">${esc(fl.confirmation)}</td></tr>` : ''}
      ${fl.cabin||fl.seat? `<tr><td style="${cell}color:${mute};">Seat</td><td style="${cell}">${esc([fl.cabin, fl.seat].filter(Boolean).join(' · '))}</td></tr>` : ''}
    </table>`).join('')}` : ''}
    ${t.hotels.length? `${label('Hotel')}${t.hotels.map(h=>`<table role="presentation" style="border-collapse:collapse;width:100%;margin-bottom:10px;border:none;background:none;">
      <tr><td style="${cell}font-weight:700;" colspan="2">${esc(h.name)}</td></tr>
      ${h.address? `<tr><td style="${cell}color:${mute};width:130px;">Address</td><td style="${cell}">${esc(h.address)}</td></tr>` : ''}
      <tr><td style="${cell}color:${mute};width:130px;">Check-in / out</td><td style="${cell}">${esc(h.checkIn||'')}${h.checkOut?` → ${esc(h.checkOut)}`:''}</td></tr>
      ${h.confirmation? `<tr><td style="${cell}color:${mute};">Confirmation</td><td style="${cell}">${esc(h.confirmation)}</td></tr>` : ''}
      ${h.phone? `<tr><td style="${cell}color:${mute};">Phone</td><td style="${cell}">${esc(h.phone)}</td></tr>` : ''}
    </table>`).join('')}` : ''}
    ${ground.length? `${label('Ground transport')}${ground.map(g=>`<table role="presentation" style="border-collapse:collapse;width:100%;margin-bottom:10px;border:none;background:none;">
      <tr><td style="${cell}font-weight:700;" colspan="2">${esc([g.company, g.driver].filter(x=>x&&x!=='—').join(' · ')||'Car')}</td></tr>
      ${dt(g.pickupAt)? `<tr><td style="${cell}color:${mute};width:130px;">Pickup</td><td style="${cell}">${esc(dt(g.pickupAt))}${g.pickupLocation&&g.pickupLocation!=='—'?` · ${esc(g.pickupLocation)}`:''}</td></tr>` : ''}
      ${g.dropoffLocation&&g.dropoffLocation!=='—'? `<tr><td style="${cell}color:${mute};width:130px;">Drop-off</td><td style="${cell}">${esc(g.dropoffLocation)}</td></tr>` : ''}
      ${g.phone&&g.phone!=='—'? `<tr><td style="${cell}color:${mute};">Phone</td><td style="${cell}">${esc(g.phone)}</td></tr>` : ''}
    </table>`).join('')}` : ''}
    ${t.notes? `${label('Notes')}<p style="font-size:12.5px;white-space:pre-wrap;margin:0;">${esc(t.notes)}</p>` : ''}
    ${(sheet.contacts||[]).length? `${label('Contacts')}<table role="presentation" style="border-collapse:collapse;width:100%;border:none;background:none;">${sheet.contacts.map(c=>`<tr><td style="${cell}font-weight:700;">${esc(c.name)}${c.role?` <span style="color:${mute};font-weight:400;">(${esc(c.role)})</span>`:''}</td><td style="${cell}">${esc(c.phone||'')}</td></tr>`).join('')}</table>` : ''}
    ${!flights.length && !t.hotels.length && !ground.length? `<p style="font-size:13px;color:${mute};margin-top:16px;">No travel arranged yet.</p>` : ''}
    <div style="margin-top:22px;padding-top:10px;border-top:1px solid #E3E3E8;font-size:10.5px;color:${mute};">ASP Management${getBrandConfig('asp').phone? ` &middot; ${esc(getBrandConfig('asp').phone)}` : ''}</div>
  </div>`;
}
function renderItineraryDoc(){
  const ev = getEvent(S.itineraryEventId); if(!ev) return '';
  const artist = artistById(ev.artistId);
  const f = ev.flight, g = ev.groundTransport;
  return `<div class="overlay center" data-action="itinerary-overlay-close">
    <div class="doc" data-stop>
      <div class="sheet-head">
        <h2 style="font-size:1.1rem;">Travel Itinerary</h2>
        <div style="display:flex;gap:6px;">
          <button class="icon-btn" data-action="print-itinerary" title="Print / Save as PDF" aria-label="Print / Save as PDF"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-2"/><rect x="6" y="14" width="12" height="7"/></svg></button>
          <button class="icon-btn" data-action="close-itinerary" aria-label="Close">${ICO.x}</button>
        </div>
      </div>
      ${itineraryFlights(ev).length? `<div style="padding:12px 20px;border-bottom:1px solid var(--border);display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
        <span style="font-size:12px;color:var(--ink-2);margin-right:4px;">Track in Flighty: add each flight to your calendar</span>
        ${itineraryFlights(ev).map((fl,i)=>`<button class="btn btn-sm" data-action="flight-ics" data-id="${ev.id}" data-idx="${i}">${ICO.plane} ${esc(String(fl.flightNumber||'Flight').replace(/\s+/g,''))}</button>`).join('')}
      </div>` : ''}
      <div class="doc-body">${itineraryDocHtml(ev)}</div>
    </div>
  </div>`;
}

/* ============ ACTIONS ============ */
// Event-sheet primary contract button. It used to send NOTHING while setting contract_sent,
// logging "emailed" and toasting "sent" (2026-10-09 audit 2.5). Now it routes to the one real
// send path: the lead's latest Contract Builder contract (or the template picker to create one).
// The real send (doSendContractEmail) is what advances the lead to contract_sent.
function doSendContract(id){
  const latest = contractsForLead(id).find(c=>c.status!=='void');
  // Review first (owner 2026-10-13): the existing contract opens as the document preview, with
  // Send and Edit at the top; a new one opens in the builder to be filled in.
  if(latest){ S.contractBuilderId = latest.id; S.showContractBuilderDoc = true; }
  else { startContractForLead(id); return; }
  render();
}
function doConfirmLead(id){
  const ev = getEvent(id); if(!ev || !['lead','negotiating'].includes(ev.status)) return;
  if(!confirm('Confirm this gig as booked? It goes on the calendar as Booked. The deposit still shows as owed until you mark it received.')) return;
  logEvent(ev, 'success', 'Confirmed as booked by the office (before a contract or deposit).');
  const result = updateEvent(id, { status:'booked' });
  if(!result.ok){ toast(result.error==='conflict' ? 'This gig changed elsewhere since you loaded it — reload and try again.' : 'Could not save.', 'system'); return; }
  toast('Gig confirmed — it is now Booked.', 'success');
  render();
}
function doMarkDeposit(id, extra={}){
  const ev = getEvent(id); if(!ev) return false;
  logEvent(ev,'success',`Bookkeeping marked booking fee received (${paymentMethodLabel(ev)}) — job officially booked & locked on calendar.`);
  // No internal-notification channel exists, so nothing claims the team was told (2026-10-12:
  // the log only records what actually happened; the client confirmation below is a real email).
  const result = updateEvent(id, { status:'booked', depositReceived:true, depositReceivedDate:todayISO(), ...extra });
  if(!result.ok){
    toast(result.error==='conflict' ? 'This booking changed elsewhere since you loaded it — reload before marking the deposit received.' : 'Could not save.', 'system');
    return false;
  }
  // Paid another way: the emailed online-payment link must not take the deposit a second time.
  contractsForLead(id).forEach(c=>revokeOpenPaymentLinks({ contract:c }));
  S.showBookingConfirmation = true;
  render();
  if(ev.clientEmail) doSendBookingConfirmationEmail(id);
  else toast('Booking locked in — no client email on file, confirmation not sent.', 'system');
  return true;
}
/* ---- Durable booking record architecture (PR 6): audited deposit verification + confirm ----
   Alongside (not replacing) doMarkDeposit above. The state machine's own rule is "hold_awaiting_
   deposit -> deposit_verified" on a matched payment OR a logged exception, then "-> confirmed"
   automatically once that gate passes -- no live payment-matching exists yet (no local event has a
   real Supabase row for a payments row to match against), so today every verification is honestly
   the logged-exception path, never a silently-assumed match. */
function doMarkDepositVerified(id){
  const ev = getEvent(id); if(!ev) return;
  const note = (S.verifyDepositForm.note||'').trim();
  if(!note){ toast('Add a short note on how you verified this before confirming.', 'system'); return; }
  const method = S.verifyDepositForm.method||'other';
  S.showVerifyDeposit = false; S.verifyDepositForm = {};
  doConfirmBooking(id, { method, note });
}
function doConfirmBooking(id, {method, note} = {}){
  const ev = getEvent(id); if(!ev) return;
  const fromStatus = ev.status;
  // One guarded write: the verification record, the lock-in effects of doMarkDeposit (status ->
  // booked, deposit received, activity log, client confirmation email) and the log line together.
  // "Confirmed" is status booked/paid -- the separate ev.bookingStatus field (migration 0020) is no
  // longer written (2026-10-09 audit 3.9: two status fields with no mapping).
  logEvent(ev, 'system', `Deposit verified (${method||'manual'}): ${note||'—'}.`);
  const depositVerification = { method: method||null, note: note||null, loggedBy: S.user, loggedAt: new Date().toISOString() };
  if(!doMarkDeposit(id, { depositVerification })) return;
  // Best-effort structured audit trail (booking_exceptions/booking_status_history, migration 0021)
  // -- only possible once this event has a real Supabase row, which no local event does yet (no
  // event migration path exists). Never blocks the real, local confirmation above if this fails.
  if(supabaseClient && ev._supabaseId){
    (async()=>{
      try{
        const adminRow = adminById(S.user);
        const loggedBy = adminRow ? adminRow.dbId : null;
        let exceptionId = null;
        if(note && loggedBy){
          const { data } = await supabaseClient.from('booking_exceptions').insert({
            event_id: ev._supabaseId, exception_type: 'payment_verification_waived',
            reason: `${method||'manual'}: ${note}`, logged_by: loggedBy,
          }).select('id').single();
          exceptionId = data ? data.id : null;
        }
        await supabaseClient.from('booking_status_history').insert({
          event_id: ev._supabaseId, from_status: fromStatus||null, to_status: 'confirmed',
          trigger_type: 'manual', exception_id: exceptionId, note: note||null,
        });
      } catch(err){ console.error('booking confirmation audit sync failed', ev.id, err); }
    })();
  }
}
function doToggleFlight(id){
  const ev = getEvent(id); if(!ev) return;
  logEvent(ev,'system','Marked: flight needed.');
  if(reportEventSave(updateEvent(id, { flightNeeded:true }), 'marking flight needed')) autoRequestFlight(id);
  openEvent(id);
}
// Undo "flight needed" (owner 2026-10-13). A booked flight is cleared too, after a confirm, since
// its details would otherwise be lost silently.
function doUnmarkFlight(id){
  const ev = getEvent(id); if(!ev) return;
  if(ev.flightBooked && !confirm('Remove the booked flight from this gig? Its details will be cleared.')) return;
  logEvent(ev,'system', ev.flightBooked ? 'Flight removed; no flight needed.' : 'Marked: no flight needed.');
  if(reportEventSave(updateEvent(id, { flightNeeded:false, flightBooked:false, flight:null }), 'marking no flight needed')) toast('No flight needed.', 'system');
  openEvent(id);
}
function doSaveFlight(id){
  const ev = getEvent(id); if(!ev) return; const f=S.flightForm;
  const depart = f.departDate? `${f.departDate} ${f.departTime||'00:00'}` : '—';
  const arrive = f.arriveDate? `${f.arriveDate} ${f.arriveTime||'00:00'}` : '—';
  const flight = {airline:f.airline||'—', flightNumber:(f.flightNumber||'').trim(), confirmation:f.confirmation||'—', depart, arrive, trackingStatus:null, trackingStatusAt:null};
  logEvent(ev,'system','Flight booked & added to the itinerary.');
  S.showFlightForm=false;
  if(reportEventSave(updateEvent(id, { flight, flightBooked:true }), 'saving the flight')) toast('Flight saved to the itinerary.', 'success');
  openEvent(id);
}
// Event-sheet flight card. Used to be a mock that stepped through made-up statuses and logged an
// "emailed" update that was never sent; it also shadowed the real segment check (same function
// name). Now a real FlightAware lookup; nothing is emailed.
async function doCheckFlightStatus(id){
  const ev = getEvent(id); if(!ev || !ev.flight) return;
  const ident = (ev.flight.flightNumber||'').replace(/\s+/g,'').toUpperCase();
  if(!/^[A-Z0-9]{2,3}\d{1,4}[A-Z]?$/.test(ident)){ toast('Enter the flight number with its airline code (e.g. DL1234) to check its status.', 'system'); return; }
  const date = /^\d{4}-\d{2}-\d{2}/.test(ev.flight.depart||'') ? ev.flight.depart.slice(0,10) : ev.date;
  S.checkingFlightId = id; render();
  try{
    const data = await fetchFlightStatus(ident, date);
    if(!data.ok){ toast(data.error, 'system'); return; }
    const trackingStatus = data.status || (data.cancelled ? 'Cancelled' : 'Unknown');
    logEvent(ev,'system',`Flight ${ident} status checked (FlightAware): ${trackingStatus}.`);
    if(reportEventSave(updateEvent(id, { flight: {...ev.flight, trackingStatus, trackingStatusAt:new Date().toISOString()} }), 'checking flight status')) toast(`Flight status: ${trackingStatus}.`, 'success');
  } catch(err){
    toast('Could not check flight status: ' + String(err), 'system');
  } finally {
    S.checkingFlightId = null; render();
  }
}
function doToggleGroundTransport(id){
  const ev = getEvent(id); if(!ev) return;
  logEvent(ev,'system','Marked: ground transport needed.');
  if(reportEventSave(updateEvent(id, { groundTransportNeeded:true }), 'marking ground transport needed')) toast('Marked: ground transport needed.', 'system');
  openEvent(id);
}
function doUnmarkGroundTransport(id){
  const ev = getEvent(id); if(!ev) return;
  if(ev.groundTransportBooked && !confirm('Remove the booked driver from this gig? Their details will be cleared.')) return;
  logEvent(ev,'system', ev.groundTransportBooked ? 'Driver removed; no ground transport needed.' : 'Marked: no ground transport needed.');
  if(reportEventSave(updateEvent(id, { groundTransportNeeded:false, groundTransportBooked:false, groundTransport:null }), 'marking no ground transport needed')) toast('No ground transport needed.', 'system');
  openEvent(id);
}
function doSaveGroundTransport(id){
  const ev = getEvent(id); if(!ev) return; const f=S.transportForm;
  const pickupTime = f.pickupDate? `${f.pickupDate} ${f.pickupTime||'00:00'}` : '—';
  const dropoffTime = f.dropoffDate? `${f.dropoffDate} ${f.dropoffTime||'00:00'}` : '—';
  const groundTransport = {driverName:f.driverName||'—', driverPhone:f.driverPhone||'—', pickupTime, pickupLocation:f.pickupLocation||'—', dropoffTime, dropoffLocation:f.dropoffLocation||'—', notes:f.notes||''};
  logEvent(ev,'system','Driver booked & added to the itinerary.');
  S.showTransportForm=false;
  if(reportEventSave(updateEvent(id, { groundTransport, groundTransportBooked:true }), 'saving ground transport')) toast('Driver saved to the itinerary.', 'success');
  openEvent(id);
}
function doSaveDressCode(id){
  const ev = getEvent(id); if(!ev) return; const f = S.dressCodeForm;
  const dressCode = (f.dressCode||'').trim();
  logEvent(ev, 'system', dressCode? `Dress code set: ${dressCode}.` : 'Dress code cleared.');
  if(reportEventSave(updateEvent(id, { dressCode }), 'saving the dress code')) toast(dressCode? 'Dress code saved.' : 'Dress code cleared.', 'success');
  S.showDressCodeForm=false; openEvent(id);
}
function doAddGigContact(id){
  const ev = getEvent(id); if(!ev) return;
  const f = S.newGigContactForm;
  const name = (f.name||'').trim();
  if(!name){ toast('Enter a name for the contact.', 'system'); return; }
  const sheet = ev.gigInfoSheet || {text:'', contacts:[], updatedAt:null};
  sheet.contacts = sheet.contacts || [];
  sheet.contacts.push({ id:'GC-'+Math.random().toString(36).slice(2,9), name, role:(f.role||'').trim(), phone:(f.phone||'').trim(), email:(f.email||'').trim() });
  S.newGigContactForm = {};
  reportEventSave(updateEvent(id, { gigInfoSheet: sheet }), 'adding the gig contact');
  render();
}
function doRemoveGigContact(id, contactId){
  const ev = getEvent(id); if(!ev || !ev.gigInfoSheet) return;
  const gigInfoSheet = { ...ev.gigInfoSheet, contacts: (ev.gigInfoSheet.contacts||[]).filter(c=>c.id!==contactId) };
  reportEventSave(updateEvent(id, { gigInfoSheet }), 'removing the gig contact');
  render();
}
function doSaveGigInfo(id){
  const ev = getEvent(id); if(!ev) return;
  const f = S.gigInfoForm;
  const prevSheet = gigInfoSheetOf(ev);
  const added = (f.newContacts||[]).map(c=>({ id:'GC-'+Math.random().toString(36).slice(2,8), name:c.name||'', role:c.role||'', phone:c.phone||'', email:c.email||'' }));
  const gigInfoSheet = { ...prevSheet,
    text: (f.text!==undefined? f.text : prevSheet.text).trim(),
    choir: (f.choir||'').trim(), otherSingers: (f.otherSingers||'').trim(), startTime: f.startTime||'',
    schedule: parseGigScheduleText(f.scheduleText), songs: parseGigSongsText(f.songsText),
    contacts: [...(prevSheet.contacts||[]), ...added],
    updatedAt: todayISO() };
  const patch = { gigInfoSheet };
  // The doc dropped in to build the sheet is kept with the gig's files (one "Upload docs" button, owner 2026-10-15).
  if(S.gigInfoFile) patch.prepSheets = [...(ev.prepSheets||[]), { id:'PS-'+Date.now()+Math.random().toString(36).slice(2,6), name:S.gigInfoFile.name, dataUrl:`data:${S.gigInfoFile.mediaType};base64,${S.gigInfoFile.data}`, uploadedAt:todayISO() }];
  if(f.band!==undefined) patch.band = (f.band||'').trim() || null;
  if(f.bandSize!==undefined) patch.bandSize = f.bandSize ? Number(f.bandSize) : null;
  logEvent(ev, 'system', 'Gig info updated.');
  S.showGigInfoForm=false; S.gigInfoForm={}; S.gigInfoFile=null; S.newGigContactForm={};
  if(reportEventSave(updateEvent(id, patch), 'saving the gig info')) toast('Gig info saved.', 'success');
  openEvent(id);
}
function doCopyText(value){
  if(!value) return;
  const done = ()=> toast('Copied to clipboard.', 'success');
  if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(value).then(done).catch(done);
  else done();
}
function doSaveEditEvent(id){
  const ev = getEvent(id); if(!ev) return;
  const f = S.editEventForm;
  // One patch through updateEvent (2026-10-09 audit 3.15): editing ev first would leave a refused
  // save (conflict) half-applied in memory.
  const p = {};
  if(!ev.unpaid){
    if(f.clientName!==undefined) p.clientName = f.clientName.trim();
    if(f.clientEmail!==undefined) p.clientEmail = f.clientEmail.trim();
    if(f.clientPhone!==undefined) p.clientPhone = f.clientPhone.trim();
  }
  if(f.type!==undefined) p.type = f.type;
  if((p.type ?? ev.type)==='Wedding'){
    if(f.band!==undefined) p.band = f.band.trim()||null;
    if(f.bandSize!==undefined) p.bandSize = f.bandSize? Number(f.bandSize) : null;
  }
  if(f.date!==undefined) p.date = f.date;
  if(f.time!==undefined) p.time = f.time;
  if(f.endTime!==undefined) p.endTime = f.endTime || null;
  if(f.venue!==undefined) p.venue = f.venue.trim();
  if(f.address!==undefined) p.address = f.address.trim();
  rememberVenue({ venue:f.venue!==undefined?f.venue:ev.venue, address:f.address!==undefined?f.address:ev.address, city:f.city!==undefined?f.city:ev.city, state:f.state!==undefined?f.state:ev.state });
  if(f.city!==undefined) p.city = f.city.trim();
  if(f.state!==undefined) p.state = f.state.trim();
  const notes = [];
  if(!ev.unpaid && f.price!==undefined){
    p.price = Number(f.price)||0;
    // Only auto-recompute the deposit at 15% if this same save doesn't also set an explicit
    // deposit amount -- an explicit value (below) always wins, same "manual override beats the
    // formula" convention as reminderIntervalDays (see WORKFLOWS.md §4).
    if(f.commission===undefined) p.commission = standardCommission(p.price, ev.artistId);
  }
  if(!ev.unpaid && f.commission!==undefined){
    p.commission = Math.max(0, Number(f.commission)||0);
    if(p.commission!==ev.commission) notes.push(`deposit changed from ${money(ev.commission)} to ${money(p.commission)}`);
  }
  // ev.balance is no longer a stored field (PR 12) -- eventBalance(ev)/artistPayout(ev) derive it
  // live from price/commission/charges on every read, so there's nothing to recompute here.
  if(!ev.unpaid && f.paymentMethod!==undefined){
    p.paymentMethod = f.paymentMethod;
    if(p.paymentMethod!==(ev.paymentMethod || 'standard')) notes.push(`payment method changed to ${paymentMethodLabel({ ...ev, ...p })}`);
  }
  if(!ev.unpaid && f.paymentMethodNote!==undefined) p.paymentMethodNote = f.paymentMethodNote.trim();
  if(!ev.unpaid && f.depositPaid!==undefined){
    p.depositPaid = Math.max(0, Number(f.depositPaid)||0) || null;
    if(p.depositPaid!==(ev.depositPaid||null)) notes.push(p.depositPaid ? `received so far set to ${money(p.depositPaid)}` : 'received so far cleared');
  }
  logEvent(ev, 'system', notes.length? `Details updated by office — ${notes.join('; ')}.` : 'Details updated by office.');
  S.showEditEvent=false; S.editEventForm={};
  if(reportEventSave(updateEvent(id, p), 'saving these changes')) toast('Changes saved.', 'success');
  openEvent(id);
}
async function doSubmitInvoice(){
  const f = S.newInvoiceForm;
  const clientName = (f.clientName||'').trim();
  const clientEmail = (f.clientEmail||'').trim();
  const items = f.items || [];
  if(!clientName){ toast('Enter who this invoice is billed to.', 'error'); return; }
  if(!items.length){ toast('Add at least one line item.', 'error'); return; }
  if(clientEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clientEmail)){ toast('That email address doesn\'t look right.', 'error'); return; }
  if(S.invoiceSendBusy) return;
  const inv = makeInvoice(clientName, clientEmail, items, (f.notes||'').trim(), 'open', 0);
  if(f.noCardFee) inv.noCardFee = true;
  CUSTOM_INVOICES.unshift(inv);
  saveCustomInvoices();
  S.showNewInvoice=false; S.newInvoiceForm={};
  // Really emailed (2026-10-13: it used to only say "sent"), with a Pay online button when Stripe is set up.
  if(!clientEmail || !supabaseClient || !S.realSession){ toast(`Invoice ${inv.id} created${clientEmail?' — sign in with your ASP account to email it':' (no email address, so not sent)'}.`, 'system'); render(); return; }
  S.invoiceSendBusy = true; render();
  try{
    let link = { ok:false };
    if(stripeReady() && invoiceTotal(inv) >= 0.5){
      link = await createInvoicePayLink(inv, x=>invoiceEmailHtml(x, null));
      if(!link.ok) toast(link.error + ' The invoice will go out without the Pay online button.', 'system');
    }
    const sent = await sendEmail({ to: clientEmail, subject: `Invoice ${inv.id} from ${getBrandConfig('asp').label||'ASP'}`, html: invoiceEmailHtml(inv, link.ok ? link.url : null), brand:'asp' });
    if(!sent.ok){ inv.log.push({ ts:new Date().toISOString(), type:'system', text:`Invoice email failed: ${sent.error}` }); saveCustomInvoices(); toast('Invoice saved, but the email failed: ' + sent.error, 'system'); return; }
    if(link.ok) S.payLinks = { ...(S.payLinks||{}), [inv.id]: link.url };
    inv.log.push({ ts:new Date().toISOString(), type:'email', text:`Invoice emailed to ${clientEmail}${link.ok?' with a Pay online link':''}.` });
    saveCustomInvoices();
    toast(`Invoice sent to ${clientEmail}.`, 'success');
  } finally { S.invoiceSendBusy = false; render(); }
}
function doMarkInvoicePaid(id){
  const inv = getInvoice(id); if(!inv) return;
  inv.status = 'paid'; inv.paidAt = todayISO();
  inv.log.push({ts:new Date().toISOString(), type:'success', text:'Marked paid.'});
  if(inv.createdTs) revokeOpenPaymentLinks({ invoice:inv });
  saveCustomInvoices();
  toast('Invoice marked paid.', 'success');
  render();
}
function doSubmitOutsideBooking(){
  const f = S.newOutsideBookingForm;
  const performerName = (f.performerName||'').trim();
  const clientName = (f.clientName||'').trim();
  const totalAmount = Number(f.totalAmount)||0;
  const aspCut = Number(f.aspCut)||0;
  if(!performerName){ toast('Enter the performer\'s name.', 'system'); return; }
  if(!clientName){ toast('Enter who the client is.', 'system'); return; }
  if(!f.date){ toast('Pick a date.', 'system'); return; }
  if(!totalAmount){ toast('Enter the total booking amount.', 'system'); return; }
  const booking = makeOutsideBooking(performerName, clientName, (f.clientEmail||'').trim(), f.date, (f.venue||'').trim(), '', '', totalAmount, aspCut, (f.notes||'').trim(), 'open', 0);
  OUTSIDE_BOOKINGS.unshift(booking);
  saveOutsideBookings();
  toast(`Other booking created for ${performerName}.`, 'success');
  S.showNewOutsideBooking=false; S.newOutsideBookingForm={}; render();
}
// Generic field-path writer for the External Event detail sheet, same direct-mutate + autosave
// convention as setContractFieldByPath() -- handles the plain top-level fields and the nested
// flight/groundTransport/hotel objects.
function setOutsideBookingFieldByPath(b, path, value){
  const parts = path.split('.');
  const kind = parts[0];
  if(kind==='top') b[parts[1]] = value;
  else if(kind==='flight'){ if(!b.flight) b.flight = {}; b.flight[parts[1]] = value; }
  else if(kind==='groundTransport'){ if(!b.groundTransport) b.groundTransport = {}; b.groundTransport[parts[1]] = value; }
  else if(kind==='hotel'){ if(!b.hotel) b.hotel = {}; b.hotel[parts[1]] = value; }
}
function doAddOutsideBookingReminder(bookingId){
  const b = getOutsideBooking(bookingId); if(!b) return;
  b.reminders.push({ id:'REM-'+Math.random().toString(36).slice(2,7), dueAt: fmtISO(addDays(new Date(),7)), owner:'', recurrenceDays:null, completedAt:null, snoozedUntil:null, notes:'' });
  saveOutsideBookings(); render();
}
function doRemoveOutsideBookingReminder(bookingId, reminderId){
  const b = getOutsideBooking(bookingId); if(!b) return;
  b.reminders = b.reminders.filter(r=>r.id!==reminderId);
  saveOutsideBookings(); render();
}
function doCompleteOutsideBookingReminder(bookingId, reminderId){
  const b = getOutsideBooking(bookingId); if(!b) return;
  const r = b.reminders.find(x=>x.id===reminderId); if(!r) return;
  r.completedAt = new Date().toISOString(); r.snoozedUntil = null;
  b.log.push({ ts:new Date().toISOString(), type:'success', text:'Reminder completed.' });
  saveOutsideBookings(); render();
}
function doSnoozeOutsideBookingReminder(bookingId, reminderId, days){
  const b = getOutsideBooking(bookingId); if(!b) return;
  const r = b.reminders.find(x=>x.id===reminderId); if(!r) return;
  r.snoozedUntil = fmtISO(addDays(new Date(), days));
  saveOutsideBookings(); render();
}
function setOutsideBookingReminderFieldByPath(b, reminderId, field, value){
  const r = b.reminders.find(x=>x.id===reminderId); if(r) r[field] = value;
}
function doMarkOutsideBookingPaid(id){
  const b = getOutsideBooking(id); if(!b) return;
  b.status = 'paid';
  b.log.push({ts:new Date().toISOString(), type:'success', text:'Marked paid.'});
  saveOutsideBookings();
  toast('Other booking marked paid.', 'success');
  render();
}
function doSaveDocument(){
  const f = S.documentForm;
  const existing = S.documentId ? getDocument(S.documentId) : null;
  const subjectType = f.subjectType!==undefined? f.subjectType : (existing?existing.subjectType:'general');
  const subjectId = f.subjectId!==undefined? f.subjectId : (existing? existing.subjectId : null);
  if(subjectType!=='general' && !subjectId){ toast("Pick who this document is for.", 'system'); return; }
  const brand = f.brand || (existing && existing.brand) || 'asp';
  const doc = existing || { id:'DOC-'+(DOCID++), createdAt: todayISO(), signedAt: null };
  doc.subjectType = subjectType;
  doc.subjectId = subjectId;
  doc.brand = brand;
  doc.title = (f.title!==undefined? f.title : (existing?existing.title:'')).trim() || defaultDocumentTitle(subjectType, subjectId);
  const ctx = documentSubjectContext(subjectType, subjectId);
  doc.clientName = (f.clientName!==undefined? f.clientName : (existing?existing.clientName:(ctx.clientName||''))).trim();
  doc.clientSignerTitle = (f.clientSignerTitle!==undefined? f.clientSignerTitle : (existing?existing.clientSignerTitle:'')).trim();
  doc.bodyText = f.bodyText!==undefined? f.bodyText : (existing? existing.bodyText : defaultDocumentBody(subjectType, subjectId));
  if(!existing){ DOCUMENTS.unshift(doc); }
  saveDocuments();
  S.documentId = doc.id;
  S.documentForm = {};
  toast('Document saved.', 'success');
  render();
}
function doOpenOutsideBookingDoc(bookingId){
  closeAllOverlays();
  const existing = DOCUMENTS.find(d=>d.subjectType==='outside' && d.subjectId===bookingId);
  if(existing){ S.documentId = existing.id; S.documentForm = {}; }
  else { S.documentId = null; S.documentForm = {subjectType:'outside', subjectId:bookingId}; }
  S.showDocumentBuilder = true;
  render();
}
function doSendReminder(id){
  const ev = getEvent(id); if(!ev) return;
  // Email only: no SMS provider is connected, so nothing claims a text went out (2026-10-12).
  if(ev.clientEmail) doSendReminderEmail(id);
  else toast('No client email on file — reminder not sent.', 'system');
}
function doMarkBalance(id){
  const ev = getEvent(id); if(!ev) return;
  logEvent(ev,'success',`Bookkeeping marked balance received (${paymentMethodLabel(ev)}) — reminders stopped.`);
  if(reportEventSave(updateEvent(id, { balanceReceived:true, balanceReceivedDate:todayISO(), status:'paid' }), 'marking the balance received')) toast('Balance marked received. Reminders stopped.', 'success');
  openEvent(id);
}
function doToggleArtistPaidOut(id){
  const ev = getEvent(id); if(!ev) return;
  const artistPaidOut = !ev.artistPaidOut;
  logEvent(ev, artistPaidOut?'success':'system', artistPaidOut? `Marked paid out to ${artistById(ev.artistId).name} (${money(artistPayout(ev))}).` : 'Payout unmarked.');
  if(reportEventSave(updateEvent(id, { artistPaidOut, artistPaidOutDate: artistPaidOut? todayISO() : null }), 'updating payout status')) toast(artistPaidOut? 'Marked paid out.' : 'Payout unmarked.', 'success');
  render();
}
function doAddCharge(id){
  const f = S.addChargeForm;
  const preset = f.preset || CHARGE_PRESETS[0];
  const label = preset==='Other' ? (f.customLabel||'').trim() : preset;
  const amount = Number(f.amount);
  if(!label || !amount || amount<=0){ toast('Enter a charge type and an amount.', 'system'); return; }
  const ev = getEvent(id); if(!ev) return;
  const postSigning = ev.depositReceived;
  const charges = ev.charges || [];
  charges.push({id:'CH-'+Date.now(), label, amount, addedAfterSigning: postSigning});
  logEvent(ev,'system',`Charge added: ${label} (${money(amount)}).`);
  if(postSigning){
    const newTotal = ev.price + chargesTotal({...ev, charges});
    logEvent(ev,'warning',`Added after signing — client's total changed. New total: ${money(newTotal)}.`);
    logEvent(ev,'warning',`Let the client know: their total is now ${money(newTotal)} (was ${money(newTotal-amount)}).`);
  }
  S.showAddCharge=false; S.addChargeForm={};
  if(reportEventSave(updateEvent(id, { charges }), 'adding the charge')) toast(postSigning? 'Charge added — the client\'s total changed; let them know.' : 'Charge added to contract.', 'system');
  openEvent(id);
}
function doRemoveCharge(id, chargeId){
  const ev = getEvent(id); if(!ev) return;
  const removed = (ev.charges||[]).find(c=>c.id===chargeId);
  const charges = (ev.charges||[]).filter(c=>c.id!==chargeId);
  if(removed) logEvent(ev,'system',`Charge removed: ${removed.label} (${money(removed.amount)}).`);
  reportEventSave(updateEvent(id, { charges }), 'removing the charge');
  openEvent(id);
}
function doUploadPrep(id, files){
  const ev = getEvent(id); if(!ev) return;
  const prepSheets = ev.prepSheets || [];
  let remaining = files.length, succeeded = 0;
  Array.from(files).forEach(file=>{
    const reader = new FileReader();
    const finish = ()=>{
      remaining--;
      if(remaining===0){
        if(succeeded) logEvent(ev,'system', `Gig info file${succeeded===1?'':'s'} uploaded.`);
        if(reportEventSave(updateEvent(id, { prepSheets }), 'uploading the gig info file') && succeeded) toast('File added to gig info.', 'success');
        openEvent(id);
      }
    };
    reader.onload = ()=>{
      prepSheets.push({id:'PS-'+Date.now()+Math.random().toString(36).slice(2,6), name:file.name, dataUrl:reader.result, uploadedAt:todayISO()});
      succeeded++;
      finish();
    };
    reader.onerror = ()=>{ toast(`Could not read ${file.name}.`, 'system'); finish(); };
    reader.readAsDataURL(file);
  });
}
function doRemovePrep(id, prepId){
  const ev = getEvent(id); if(!ev) return;
  const prepSheets = (ev.prepSheets||[]).filter(f=>f.id!==prepId);
  reportEventSave(updateEvent(id, { prepSheets }), 'removing the gig info file');
  openEvent(id);
}
function doShareEvent(id){
  S.showEventMenu = false;
  const ev = getEvent(id); const a = artistById(ev.artistId);
  const text = `${a.name} — ${ev.type}\n${fmtDate(ev.date)} · ${fmtTimeRange(ev.time, ev.endTime)}\n${fullLocation(ev)}`;
  if(navigator.share){
    navigator.share({title:`${a.name} — ${ev.type}`, text}).catch(()=>{});
  } else if(navigator.clipboard){
    navigator.clipboard.writeText(text).then(()=>toast('Gig details copied to clipboard.', 'system')).catch(()=>toast('Could not copy — try again.', 'system'));
  } else {
    toast('Sharing not supported in this browser.', 'system');
  }
  render();
}
function doCopyDailyDigest(){
  const openLeads = S.events.filter(e=>isOpenLead(e));
  const text = buildDailyDigestWhatsAppText(openLeads);
  if(navigator.clipboard){
    navigator.clipboard.writeText(text).then(()=>toast('Copied — paste it to Ilan on WhatsApp.', 'success')).catch(()=>toast('Could not copy — try again.', 'system'));
  } else {
    toast('Clipboard not supported in this browser.', 'system');
  }
}
function doDeleteEvent(id){
  if(artistReadOnly()) return;
  const ev = getEvent(id);
  const what = ev.unpaid ? `this ${ev.type} for ${artistById(ev.artistId).name}` : `this ${ev.status==='lead'?'lead':'gig'} for ${ev.clientName} (${artistById(ev.artistId).name})`;
  if(!confirm(`Delete ${what}? This can't be undone.`)) return;
  S.events = S.events.filter(e=>e.id!==id);
  saveEvents();
  toast('Deleted.', 'system');
  closeSheet();
}
function doAddArtist(){
  const name = (S.addArtistForm.name||'').trim();
  if(!name){ toast('Enter a name.', 'system'); return; }
  const parts = name.split(/\s+/);
  const first = parts[0].toLowerCase().replace(/[^a-z]/g,'');
  const last = (parts[1]||'').toLowerCase().replace(/[^a-z]/g,'');
  let id = first || 'artist';
  if(ARTISTS.some(a=>a.id===id)) id = first + (last? last[0] : '');
  let uniq = id, n = 2;
  while(ARTISTS.some(a=>a.id===uniq)){ uniq = id + n; n++; }
  id = uniq;
  // No invented email and no "welcome email" (none was ever sent -- 2026-10-09 audit 2.5): this only
  // adds a roster entry here. A real login is created via Users → Add Person + Supabase.
  const email = '';
  const initials = (parts[0][0] + (parts[1]? parts[1][0] : '')).toUpperCase();
  const slot = (ARTISTS.length % 6) + 1;
  const role = ARTIST_ROLES.includes(S.addArtistForm.role) ? S.addArtistForm.role : 'Singer';
  const artist = {id, name, slot, initials, email, role};
  ARTISTS.push(artist); saveArtists();
  S.showAddArtist = false; S.addArtistForm = {};
  toast(`${name} added to the roster. To give them a login, add them under Settings → Users → Add Person.`, 'success');
  render();
  // The shared roster (Supabase artists) is the owner -- write it there too.
  if(sharedSyncAllowed()) supabaseClient.from('artists').insert(artistRowFor(artist)).select('id').single().then(({ data, error })=>{
    if(error) toast(`${name} was added here, but not to the shared roster yet: ${error.message}`, 'system');
    else { artist.dbId = data.id; saveArtists(); }
  });
}
function logProjectEvent(p, type, text){ p.log.push({ts:new Date().toISOString(), type, text}); }
function doAddProject(){
  const f = S.newProjectForm;
  const isBatch = f.mode==='recordingday';
  const type = 'General';
  // Only the Recording Day batch flow genuinely needs an artist (it's booking that artist's
  // studio day) -- a plain project is legitimately artist-less non-gig/general work, matching the
  // DB-level relaxation of projects.artist_id already done in migration 0020. See renderNewProjectModal.
  if(isBatch && !f.artistId){ toast('Pick an artist.', 'system'); return; }
  const artist = f.artistId ? artistById(f.artistId) : null;

  if(isBatch){
    if(!f.recordingDate){ toast('Pick a recording date.', 'system'); return; }
    const count = f.episodeCount || 2;
    const ev = {
      id:'EV-'+(EVID++), artistId: artist.id, type:'Recording Day', unpaid:true,
      clientName:null, clientEmail:'', clientPhone:'',
      date: f.recordingDate, time:'10:00', endTime:null,
      venue:'', city:'', state:'',
      price:0, commission:0, status:'scheduled', depositReceived:false, depositReceivedDate:null,
      balanceReceived:false, balanceReceivedDate:null, reminderIntervalDays: defaultReminderCadence(f.recordingDate), lastReminderSent:null,
      flightNeeded:false, flightBooked:false, flight:null,
      groundTransportNeeded:false, groundTransportBooked:false, groundTransport:null,
      charges:[], dressCode:'', prepSheets:[], createdAt: todayISO(),
      log:[{ts:new Date().toISOString(), type:'system', text:`Recording Day scheduled for ${artist.name} — ${count} episode project${count===1?'':'s'}.`}],
    };
    if(findConflicts(ev).length) toast(`⚠ Scheduling conflict — ${artist.name} already has something at that time.`, 'system');
    S.events.unshift(ev); saveEvents();
    const cadence = Number(f.releaseCadenceDays)||7;
    const firstRelease = f.releaseDate || fmtISO(addDays(new Date(f.recordingDate+'T00:00:00'), 7));
    const created = [];
    for(let i=0;i<count;i++){
      const guest = (f['guest'+(i+1)]||'').trim();
      const due = fmtISO(addDays(new Date(firstRelease+'T00:00:00'), i*cadence));
      const proj = makeProject(artist, type, guest? `Episode — ${guest}` : `Episode ${i+1} — ${fmtDateShort(f.recordingDate)}`, 1, 1, due, {
        subtitle: guest? `Guest: ${guest}` : '',
        people: guest? [{id:'PPL-'+Math.random().toString(36).slice(2,7), role:'Guest', name:guest}] : [],
        recordingEventId: ev.id,
      });
      PROJECTS.unshift(proj); created.push(proj);
    }
    saveProjects();
    toast(`Recording Day booked — ${count} episode project${count===1?'':'s'} created.`, 'success');
    S.newProjectForm={};
    S.projectArtistFilter = artist.id;
    navigate('project_detail', {projectId: created[0].id});
    return;
  }

  if(!(f.title||'').trim()){ toast('Enter a title.', 'system'); return; }
  const proj = makeProject(artist, type, f.title.trim(), 0, 0, f.dueDate||null, {subtitle:(f.whoFor||'').trim()});
  PROJECTS.unshift(proj); saveProjects();
  S.newProjectForm={};
  toast(artist? `Project created for ${artist.name}.` : 'Project created.', 'success');
  S.projectArtistFilter = artist ? artist.id : 'all';
  navigate('project_detail', {projectId: proj.id});
}
function doAddPerson(id){
  const f = S.newPersonForm;
  const kind = f.kind || 'internal';
  const role = (f.role||'').trim();
  if(!role){ toast('Enter a role.', 'system'); return; }
  const p = getProject(id);
  p.people = p.people || [];
  let name, refId=null, email='';
  if(kind==='internal'){
    const person = adminById(f.refId) || artistById(f.refId);
    if(!person){ toast('Pick a person.', 'system'); return; }
    name = person.name; refId = f.refId; email = person.email || '';
  } else {
    name = (f.name||'').trim();
    if(!name){ toast('Enter a name.', 'system'); return; }
    email = (f.email||'').trim();
  }
  p.people.push({id:'PPL-'+Math.random().toString(36).slice(2,7), role, name, kind, refId, email, phone:''});
  logProjectEvent(p,'system', `${role} added: ${name}`);
  S.newPersonForm = {kind}; saveProjects(); render();
}
function doRemovePerson(id, personId){
  const p = getProject(id);
  p.people = (p.people||[]).filter(x=>x.id!==personId);
  (p.tasks||[]).forEach(t=>{ if(t.assignedTo===personId) t.assignedTo = null; });
  saveProjects(); render();
}
function doAddFinItem(id, kind){
  const p = getProject(id);
  const label = (kind==='income'? S.newFinIncomeLabel : S.newFinExpenseLabel || '').trim();
  const amount = Number(kind==='income'? S.newFinIncomeAmount : S.newFinExpenseAmount) || 0;
  if(!label || !amount){ toast('Enter a label and an amount.', 'system'); return; }
  p.financials = p.financials || {income:[], expenses:[]};
  p.financials[kind].push({id:'FIN-'+Math.random().toString(36).slice(2,9), label, amount});
  logProjectEvent(p,'system', `${kind==='income'?'Income':'Expense'} added: ${label} (${money(amount)}).`);
  if(kind==='income'){ S.newFinIncomeLabel=''; S.newFinIncomeAmount=''; } else { S.newFinExpenseLabel=''; S.newFinExpenseAmount=''; }
  saveProjects(); render();
}
function doRemoveFinItem(id, kind, itemId){
  const p = getProject(id);
  p.financials[kind] = (p.financials[kind]||[]).filter(i=>i.id!==itemId);
  saveProjects(); render();
}
function doToggleTask(id, taskId){
  const p = getProject(id); const t = p.tasks.find(t=>t.id===taskId);
  if(t){ t.done = !t.done; saveProjects(); render(); }
}
function doRemoveTask(id, taskId){
  const p = getProject(id);
  p.tasks = p.tasks.filter(t=>t.id!==taskId);
  saveProjects(); render();
}
function doAddTask(id){
  const text = (S.newTaskText||'').trim(); if(!text) return;
  const p = getProject(id);
  const assignedTo = S.newTaskAssignee || null;
  p.tasks.push({id:'T-'+Math.random().toString(36).slice(2,9), stage:p.stage, text, done:false, assignedTo});
  const person = assignedTo ? (p.people||[]).find(x=>x.id===assignedTo) : null;
  logProjectEvent(p,'system', person? `Task added: ${text} (assigned to ${person.name})` : `Task added: ${text}`);
  S.newTaskText=''; S.newTaskAssignee=''; saveProjects(); render();
}
function doAssignTask(id, taskId, personId){
  const p = getProject(id);
  const t = (p.tasks||[]).find(x=>x.id===taskId);
  if(!t) return;
  const newId = personId || null;
  if(t.assignedTo===newId) return;
  t.assignedTo = newId;
  if(newId){
    const person = (p.people||[]).find(x=>x.id===newId);
    if(person){
      logProjectEvent(p, 'system', `Task "${t.text}" assigned to ${person.name}.`);
    }
  } else {
    logProjectEvent(p,'system', `Task "${t.text}" unassigned.`);
  }
  saveProjects(); render();
}
function doUploadProjectImage(id, files){
  const p = getProject(id);
  p.images = p.images || [];
  let remaining = files.length, succeeded = 0;
  Array.from(files).forEach(file=>{
    const reader = new FileReader();
    const finish = ()=>{
      remaining--;
      if(remaining===0){
        saveProjects();
        if(succeeded){ logProjectEvent(p,'system', `${succeeded} image${succeeded===1?'':'s'} uploaded.`); toast('Image uploaded.', 'success'); }
        render();
      }
    };
    reader.onload = ()=>{ p.images.push({id:'IMG-'+Date.now()+Math.random().toString(36).slice(2,6), name:file.name, dataUrl:reader.result}); succeeded++; finish(); };
    reader.onerror = ()=>{ toast(`Could not read ${file.name}.`, 'system'); finish(); };
    reader.readAsDataURL(file);
  });
}
function doRemoveProjectImage(id, imgId){
  const p = getProject(id);
  p.images = (p.images||[]).filter(i=>i.id!==imgId);
  saveProjects(); render();
}
function doUploadProjectCover(id, file){
  const p = getProject(id);
  const reader = new FileReader();
  reader.onload = ()=>{ p.coverImage = reader.result; saveProjects(); render(); };
  reader.onerror = ()=>{ toast(`Could not read ${file.name}.`, 'system'); };
  reader.readAsDataURL(file);
}
function doAddBoardCard(id, preset){
  const p = getProject(id);
  p.boardCards = p.boardCards || [];
  p.boardCards.push({id:'BC-'+Math.random().toString(36).slice(2,9), header: preset||'', items:[]});
  saveProjects(); render();
}
function doRemoveBoardCard(id, cardId){
  const p = getProject(id);
  p.boardCards = (p.boardCards||[]).filter(c=>c.id!==cardId);
  saveProjects(); render();
}
function doAddBoardItem(pid, cardId){
  const text = ((S.newBoardItemText||{})[cardId]||'').trim();
  if(!text) return;
  const p = getProject(pid);
  const c = (p.boardCards||[]).find(x=>x.id===cardId);
  if(!c) return;
  c.items = c.items || [];
  c.items.push({id:'BI-'+Math.random().toString(36).slice(2,9), text});
  S.newBoardItemText[cardId] = '';
  saveProjects(); render();
}
function doRemoveBoardItem(pid, cardId, itemId){
  const p = getProject(pid);
  const c = (p.boardCards||[]).find(x=>x.id===cardId);
  if(c) c.items = (c.items||[]).filter(i=>i.id!==itemId);
  saveProjects(); render();
}
// Project links are web pages: http(s) only, so a "javascript:" address can never become a link.
function safeWebUrl(u){ return /^https?:\/\/[^\s"'<>]+$/i.test(String(u||'').trim()) ? String(u).trim() : ''; }
function doAddProjectLink(id){
  const typed = (S.newLinkForm.url||'').trim(); if(!typed) return;
  const url = safeWebUrl(/^[a-z][a-z0-9+.-]*:/i.test(typed) ? typed : 'https://' + typed);
  if(!url){ toast('Enter a web address (https://…).', 'system'); return; }
  const p = getProject(id);
  p.links = p.links || [];
  p.links.push({id:'LNK-'+Math.random().toString(36).slice(2,9), label:(S.newLinkForm.label||'').trim(), url});
  logProjectEvent(p,'system', `Link added: ${S.newLinkForm.label||url}`);
  S.newLinkForm={}; saveProjects(); render();
}
function doRemoveProjectLink(id, linkId){
  const p = getProject(id);
  p.links = (p.links||[]).filter(l=>l.id!==linkId);
  saveProjects(); render();
}
function doAddComment(id){
  const text = (S.newCommentText||'').trim(); if(!text) return;
  const p = getProject(id);
  p.comments = p.comments || [];
  p.comments.push({id:'C-'+Math.random().toString(36).slice(2,9), authorId:S.user, text, ts:new Date().toISOString()});
  S.newCommentText=''; saveProjects(); render();
}
function doSubmitLead(){
  const f = S.newLeadForm;
  const isInternal = f.kind==='internal';
  if(!f.artistId || !f.date || (!isInternal && !(f.clientName||'').trim())){
    toast(isInternal? 'Pick an artist and a date.' : 'Pick an artist and enter a client name and date.', 'system'); return;
  }
  const price = isInternal ? 0 : (Number(f.price)||0);
  const commission = isInternal ? 0 : standardCommission(price, f.artistId);
  const typeList = isInternal ? INTERNAL_EVENT_TYPES : EVENT_TYPES;
  const resolvedType = (f.type==='Other'? (f.customType||'').trim()||'Other' : f.type)||typeList[0];
  const ev = {
    id:'EV-'+(EVID++), artistId:f.artistId, type: resolvedType,
    unpaid: isInternal,
    clientName: isInternal? null : f.clientName,
    clientEmail: isInternal? '' : (f.clientEmail||''), clientPhone: isInternal? '' : (f.clientPhone||''),
    date: f.date, time: f.timeTbd ? '' : (f.time||LEAD_DEFAULT_START), endTime: f.timeTbd ? null : (leadEndTime(f)||null),
    venue: f.venue||'', address: f.address||'', city: f.city||'', state: f.state||'',
    price, commission, status: isInternal? 'scheduled':'lead', depositReceived:false, depositReceivedDate:null,
    balanceReceived:false, balanceReceivedDate:null, reminderIntervalDays: defaultReminderCadence(f.date), lastReminderSent:null,
    flightNeeded: !!f.flightNeeded, flightBooked:false, flight:null,
    groundTransportNeeded: !!f.groundTransportNeeded, groundTransportBooked:false, groundTransport:null,
    charges: isInternal? [] : (f.charges||[]), dressCode: isInternal? '' : (f.dressCode||''), prepSheets:[], createdAt: todayISO(),
    additionalArtists: isInternal? [] : (f.additionalArtists||[]).filter(x=>x.artistId).map(x=>{
      const fee = Number(x.feeAmount)||0; const cut = standardCommission(fee, x.artistId);
      return { artistId:x.artistId, feeAmount:fee, aspCut:cut, netAmount:fee-cut };
    }),
    ...(f.mezumin && !isInternal ? { paymentMethod:'cash' } : {}), // Mezumin = paid in cash (owner 2026-10-14)
    band: f.type==='Wedding' ? (f.band||'').trim()||null : null,
    bandSize: f.type==='Wedding' && f.bandSize ? Number(f.bandSize) : null,
    log:[{ts:new Date().toISOString(), type:'system', text: isInternal? `${resolvedType} scheduled for ${artistById(f.artistId).name}.` : `Lead created for ${artistById(f.artistId).name} — client info entered by management.`}],
  };
  if(!isInternal && f.pasteNotes) ev.log.push({ts:new Date().toISOString(), type:'system', text:`From the pasted message: ${f.pasteNotes}`});
  rememberVenue(f);
  S.events.unshift(ev); saveEvents();
  toast(isInternal? `Internal day added — penciled in on ${artistById(f.artistId).name}'s calendar.` : `Lead added — penciled in on ${artistById(f.artistId).name}'s calendar.`, 'success');
  if(findConflicts(ev).length) toast(`⚠ Scheduling conflict — ${artistById(f.artistId).name} already has something at that time.`, 'system');
  S.showNewLead=false; S.newLeadForm={}; openEvent(ev.id);
  if(ev.flightNeeded && !isInternal) autoRequestFlight(ev.id);
}
function doSubmitBlockTime(){
  if(artistReadOnly()) return; // blocks would only live in memory; artists can't write gigs (0038)
  const f = S.blockTimeForm;
  if(!f.date){ toast('Pick a date.', 'system'); return; }
  const allDay = f.allDay!==false;
  if(!allDay && (!f.startTime || !f.endTime)){ toast('Enter a start and end time, or check All day.', 'system'); return; }
  if(!allDay && f.startTime>=f.endTime){ toast('End time must be after the start time.', 'system'); return; }
  const artist = artistById(S.user);
  const start = new Date(f.date+'T00:00:00');
  const end = f.endDate ? new Date(f.endDate+'T00:00:00') : start;
  if(end < start){ toast('End date is before the start date.', 'system'); return; }
  const dates = [];
  for(let d=new Date(start); d<=end; d.setDate(d.getDate()+1)) dates.push(fmtISO(new Date(d)));
  let hadConflict = false;
  dates.forEach(date=>{
    const ev = {
      id:'EV-'+(EVID++), artistId:S.user, type:'Unavailable', unpaid:true,
      clientName:null, clientEmail:'', clientPhone:'',
      date, time: allDay?'00:00':f.startTime, endTime: allDay?null:f.endTime,
      venue:'', city:'', state:'',
      price:0, commission:0, status:'scheduled', depositReceived:false, depositReceivedDate:null,
      balanceReceived:false, balanceReceivedDate:null, reminderIntervalDays:5, lastReminderSent:null,
      flightNeeded:false, flightBooked:false, flight:null,
      groundTransportNeeded:false, groundTransportBooked:false, groundTransport:null,
      charges:[], dressCode:'', prepSheets:[], createdAt: todayISO(),
      log:[{ts:new Date().toISOString(), type:'system', text:`${artist.name} blocked ${allDay?'this date':`${fmtTime(f.startTime)}–${fmtTime(f.endTime)}`}${f.note?': '+f.note:''}.`}],
    };
    if(findConflicts(ev).length) hadConflict = true;
    S.events.unshift(ev);
  });
  saveEvents();
  toast(dates.length>1? `${dates.length} days blocked on your calendar.` : 'Date blocked on your calendar.', 'success');
  if(hadConflict) toast(`⚠ You already have something booked at that time.`, 'system');
  S.showBlockTime=false; S.blockTimeForm={}; render();
}

function answerAskAI(q, isAdmin){
  const ql = q.toLowerCase();
  const upcoming = (evs)=>evs.filter(e=>!isPast(e.date) && isConfirmed(e));
  if(!isAdmin){
    const evs = eventsFor(S.user);
    const nextGig = upcoming(evs).sort((a,b)=>a.date.localeCompare(b.date))[0];
    const ytd = artistPaidYtd(evs);
    if(ql.includes('next gig') || ql.includes('next booking')) return nextGig ? `Your next gig is ${nextGig.type} for ${nextGig.clientName||'you'} on ${fmtDateShort(nextGig.date)}.` : `You don't have any upcoming gigs booked yet.`;
    if(ql.includes('this month')){ const n=new Date(); const thisMonth = upcoming(evs).filter(e=>{const d=new Date(e.date+'T00:00:00'); return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear();}); return `You have ${thisMonth.length} gig${thisMonth.length===1?'':'s'} this month.`; }
    if(ql.includes('ytd') || ql.includes('payout') || ql.includes('earn')) return `You've been paid ${money(ytd)} so far this year.`;
    return `I can help with your gigs, next booking, this month's schedule, or your YTD payout — try asking one of those.`;
  }
  const open = S.events.filter(e=>isOpenLead(e));
  const awaitingBalance = S.events.filter(e=>e.status==='booked' && !e.balanceReceived);
  const conflictPairs = allConflictPairs().filter(([a,b])=>!isPast(a.date)||!isPast(b.date));
  const needsTravel = S.events.filter(e=>!isPast(e.date) && ((e.flightNeeded&&!e.flightBooked)||(e.groundTransportNeeded&&!e.groundTransportBooked)));
  const matchedArtist = ARTISTS.find(a=>ql.includes(a.name.toLowerCase()) || ql.includes(a.name.split(' ')[0].toLowerCase()));
  if(matchedArtist){
    const evs = eventsFor(matchedArtist.id);
    const up = upcoming(evs).sort((a,b)=>a.date.localeCompare(b.date));
    const ytd = ytdPayoutOf(evs);
    return `${matchedArtist.name}: ${up.length} upcoming gig${up.length===1?'':'s'}${up[0]?`, next on ${fmtDateShort(up[0].date)}`:''}. YTD payout: ${money(ytd)}.`;
  }
  if(ql.includes('conflict')) return conflictPairs.length ? `There ${conflictPairs.length===1?'is':'are'} ${conflictPairs.length} scheduling conflict${conflictPairs.length===1?'':'s'} right now — check the Dashboard for details.` : `No scheduling conflicts right now.`;
  if(ql.includes('lead')) return `There ${open.length===1?'is':'are'} ${open.length} open lead${open.length===1?'':'s'} awaiting contract or deposit.`;
  if(ql.includes('balance')) return `${awaitingBalance.length} booked gig${awaitingBalance.length===1?'':'s'} still awaiting balance payment.`;
  if(ql.includes('flight') || ql.includes('travel') || ql.includes('driver')) return needsTravel.length ? `${needsTravel.length} upcoming gig${needsTravel.length===1?'':'s'} still need a flight or driver arranged — see the Travel page.` : `All upcoming travel is arranged.`;
  if(ql.includes('this month') || ql.includes('booked')){ const n=new Date(); const thisMonth = S.events.filter(e=>{const d=new Date(e.date+'T00:00:00'); return isConfirmed(e) && d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear();}); return `${thisMonth.length} gig${thisMonth.length===1?'':'s'} booked this month.`; }
  return `I can help with leads, balances, conflicts, travel, or ask about a specific artist (e.g. "How is Benny doing?").`;
}
function doAskAI(){
  const q = (S.askAIForm.query||'').trim();
  if(!q) return;
  const entry = {q, a:null};
  S.askAIHistory.push(entry);
  S.askAIForm = {};
  render();
  setTimeout(()=>{
    entry.a = answerAskAI(q, isAdminUser(S.user));
    render();
  }, 550);
}

/* ============ ACTIONS REGISTRY (2026-10-09 audit 5.2, first step) ============
   New data-action handlers register here instead of growing the big switch in bindGlobal: the
   dispatcher checks ACTIONS first, then falls back to the switch. Migrate switch cases here one
   feature at a time (test_code_hygiene guards against duplicate names either way).
   Handler signature: ({ id, t, e }) -- id = data-id, t = the clicked [data-action] element. */
const ACTIONS = {};
function registerAction(name, fn){
  if(ACTIONS[name]) console.error('registerAction: duplicate action', name);
  ACTIONS[name] = fn;
}
registerAction('download-backup', ()=>doDownloadBackup());
registerAction('make-sign-link', ({ id })=>doMakeSignLink(id));
registerAction('edit-contract-from-doc', ({ id })=>{ S.showContractBuilderDoc = false; S.showContractBuilder = true; S.contractBuilderId = id; render(); });
registerAction('inbox-check-now', ()=>doInboxCheckNow());
registerAction('inbox-act', ({ id })=>doInboxAct(id));
registerAction('inbox-done', ({ id })=>doInboxMark(id, 'done'));
registerAction('inbox-dismiss', ({ id })=>doInboxMark(id, 'dismissed'));
registerAction('flight-ics', ({ id, t })=>downloadFlightIcs(getEvent(id), Number(t.getAttribute('data-idx'))));
registerAction('remove-contract-term', ({ t })=>{ const c=getContract(S.contractBuilderId); if(c){ c.boilerplate[t.getAttribute('data-key')] = false; c.updatedAt=new Date().toISOString(); saveContracts(); } render(); });
registerAction('open-client-contact', ({ id })=>{ S.clientContactEventId=id; S.showClientContact=true; render(); });
registerAction('close-client-contact', ()=>{ S.showClientContact=false; render(); });
registerAction('client-contact-overlay-close', ({ t, e })=>{ if(e.target===t){ S.showClientContact=false; render(); } });
registerAction('edit-client-contact', ()=>{ S.showClientContact=false; S.editEventForm={}; S.showEditEvent=true; render(); });
registerAction('edit-gig-fee', ({ id })=>{ const ev=getEvent(id); S.editFeeEventId=id; S.gigFeeForm={ price: ev&&ev.price ? ev.price : '' }; render(); });
registerAction('cancel-gig-fee', ()=>{ S.editFeeEventId=null; S.gigFeeForm={}; render(); });
registerAction('save-gig-fee', ({ id })=>doSaveGigFee(id));
registerAction('toggle-lead-mezumin', ()=>{ S.newLeadForm.mezumin = !S.newLeadForm.mezumin; render(); });
registerAction('open-travel-drop', ()=>{ S.showTravelDrop=true; S.travelDropForm={}; S.travelDropFiles=[]; S.travelDropResult=null; render(); });
registerAction('close-travel-drop', ()=>{ S.showTravelDrop=false; render(); });
registerAction('travel-drop-overlay-close', ({ t, e })=>{ if(e.target===t){ S.showTravelDrop=false; render(); } });
registerAction('read-travel-docs', ()=>doReadTravelDocs());
registerAction('save-travel-docs', ({ id })=>doSaveTravelDocs(id));
registerAction('build-gig-sheet', ()=>doBuildGigSheet());
registerAction('parse-lead-paste', ()=>doParseLeadPaste());
registerAction('unmark-flight', ({ id })=>doUnmarkFlight(id));
registerAction('unmark-ground-transport', ({ id })=>doUnmarkGroundTransport(id));
registerAction('external-link', ()=>{}); // the browser follows the link; nothing else happens
registerAction('retry-artist-portal', ()=>loadArtistPortalData());
registerAction('open-contract-doc', ({ id })=>{ S.contractBuilderId = id; S.showContractBuilderDoc = true; render(); });
registerAction('oauth-connect', ({ id, t })=>doOAuthConnect(t.getAttribute('data-provider'), id));
registerAction('remove-real-user', ()=>doRemoveRealUser());
registerAction('retry-roster-link', ()=>{ supabaseClient.auth.getSession().then(({data:{session}})=>{ if(session) linkRealSessionToRoster(session); else { S.realSignInError = null; render(); } }); });

/* ============ EVENT BINDING ============ */
function bindGlobal(){
  const staleFlight = document.getElementById('flightOverlayHost');
  if(staleFlight) staleFlight.remove();
  if(S.showFlightForm){
    const holder = document.createElement('div');
    holder.id = 'flightOverlayHost';
    holder.innerHTML = renderFlightFormOverlay();
    document.body.appendChild(holder);
  }
  const staleTransport = document.getElementById('transportOverlayHost');
  if(staleTransport) staleTransport.remove();
  if(S.showTransportForm){
    const holder = document.createElement('div');
    holder.id = 'transportOverlayHost';
    holder.innerHTML = renderTransportFormOverlay();
    document.body.appendChild(holder);
  }
  const staleDressCode = document.getElementById('dressCodeOverlayHost');
  if(staleDressCode) staleDressCode.remove();
  if(S.showDressCodeForm){
    const holder = document.createElement('div');
    holder.id = 'dressCodeOverlayHost';
    holder.innerHTML = renderDressCodeFormOverlay();
    document.body.appendChild(holder);
  }
  const staleEditEvent = document.getElementById('editEventOverlayHost');
  if(staleEditEvent) staleEditEvent.remove();
  if(S.showEditEvent){
    const holder = document.createElement('div');
    holder.id = 'editEventOverlayHost';
    holder.innerHTML = renderEditEventFormOverlay();
    document.body.appendChild(holder);
  }
  const staleTemplatePicker = document.getElementById('templatePickerOverlayHost');
  if(staleTemplatePicker) staleTemplatePicker.remove();
  if(S.showTemplatePicker){
    const holder = document.createElement('div');
    holder.id = 'templatePickerOverlayHost';
    holder.innerHTML = renderTemplatePickerModal();
    document.body.appendChild(holder);
  }
  const staleContractBuilder = document.getElementById('contractBuilderOverlayHost');
  if(staleContractBuilder) staleContractBuilder.remove();
  if(S.showContractBuilder){
    const holder = document.createElement('div');
    holder.id = 'contractBuilderOverlayHost';
    holder.innerHTML = renderContractBuilderModal();
    document.body.appendChild(holder);
  }
  const staleContractBuilderDoc = document.getElementById('contractBuilderPrintHost');
  if(staleContractBuilderDoc) staleContractBuilderDoc.remove();
  if(S.showContractBuilderDoc){
    const holder = document.createElement('div');
    holder.id = 'contractBuilderPrintHost';
    holder.innerHTML = renderContractBuilderDoc(getContract(S.contractBuilderId));
    document.body.appendChild(holder);
  }
  const staleSendContract = document.getElementById('sendContractOverlayHost');
  if(staleSendContract) staleSendContract.remove();
  if(S.showSendContractConfirm){
    const holder = document.createElement('div');
    holder.id = 'sendContractOverlayHost';
    holder.innerHTML = renderSendContractConfirmModal();
    document.body.appendChild(holder);
  }
  const staleVerifyDeposit = document.getElementById('verifyDepositOverlayHost');
  if(staleVerifyDeposit) staleVerifyDeposit.remove();
  if(S.showVerifyDeposit){
    const holder = document.createElement('div');
    holder.id = 'verifyDepositOverlayHost';
    holder.innerHTML = renderVerifyDepositModal();
    document.body.appendChild(holder);
  }
  const staleClientContact = document.getElementById('clientContactOverlayHost');
  if(staleClientContact) staleClientContact.remove();
  if(S.showClientContact){
    const holder = document.createElement('div');
    holder.id = 'clientContactOverlayHost';
    holder.innerHTML = renderClientContactModal();
    document.body.appendChild(holder);
  }
  const staleTravelDrop = document.getElementById('travelDropOverlayHost');
  if(staleTravelDrop) staleTravelDrop.remove();
  if(S.showTravelDrop){
    const holder = document.createElement('div');
    holder.id = 'travelDropOverlayHost';
    holder.innerHTML = renderTravelDropModal();
    document.body.appendChild(holder);
  }
  const staleGigInfoForm = document.getElementById('gigInfoOverlayHost');
  if(staleGigInfoForm) staleGigInfoForm.remove();
  if(S.showGigInfoForm){
    const holder = document.createElement('div');
    holder.id = 'gigInfoOverlayHost';
    holder.innerHTML = renderGigInfoFormOverlay();
    document.body.appendChild(holder);
  }
  const staleGigInfoDoc = document.getElementById('gigInfoPrintHost');
  if(staleGigInfoDoc) staleGigInfoDoc.remove();
  if(S.showGigInfoDoc){
    const holder = document.createElement('div');
    holder.id = 'gigInfoPrintHost';
    holder.innerHTML = renderGigInfoDoc();
    document.body.appendChild(holder);
  }
  const staleItinerary = document.getElementById('itineraryPrintHost');
  if(staleItinerary) staleItinerary.remove();
  if(S.showItinerary){
    const holder = document.createElement('div');
    holder.id = 'itineraryPrintHost';
    holder.innerHTML = renderItineraryDoc();
    document.body.appendChild(holder);
  }
  const staleInvoiceDoc = document.getElementById('invoicePrintHost');
  if(staleInvoiceDoc) staleInvoiceDoc.remove();
  if(S.showInvoiceDoc){
    const holder = document.createElement('div');
    holder.id = 'invoicePrintHost';
    holder.innerHTML = renderInvoiceDoc();
    document.body.appendChild(holder);
  }
  const staleDocumentDoc = document.getElementById('documentPrintHost');
  if(staleDocumentDoc) staleDocumentDoc.remove();
  if(S.showDocumentBuilder && S.documentId){
    const doc = getDocument(S.documentId);
    if(doc){
      const holder = document.createElement('div');
      holder.id = 'documentPrintHost';
      // Unlike contract/itinerary/invoice, this doc has a separate interactive builder modal
      // on screen at the same time -- the print host must stay invisible until an actual print
      // (the @media print block above forces it back to display:block, print-only).
      holder.style.display = 'none';
      holder.innerHTML = renderDocumentDoc(doc);
      document.body.appendChild(holder);
    }
  }
  document.querySelectorAll('[data-field]').forEach(el=>{
    el.addEventListener('input', e=>{
      const key = el.getAttribute('data-field');
      const form = el.closest('[data-form]')?.getAttribute('data-form');
      if(form==='task'){ S.newTaskText = el.value; return; }
      if(form==='comment'){ S.newCommentText = el.value; return; }
      if(form==='payeestripe'){ S.payeeStripeEmail = el.value; return; }
      const formTargets = { flight:S.flightForm, transport:S.transportForm, charge:S.addChargeForm, addartist:S.addArtistForm, addrealuser:S.addRealUserForm, edituser:S.editRealUserForm, newproject:S.newProjectForm, projectlink:S.newLinkForm, blocktime:S.blockTimeForm, askai:S.askAIForm, dresscode:S.dressCodeForm, editevent:S.editEventForm, newinvoice:S.newInvoiceForm, newoutsidebooking:S.newOutsideBookingForm, document:S.documentForm, person:S.newPersonForm, finincome:S, finexpense:S, realsignin:S, giginfo:S.gigInfoForm, gigcontact:S.newGigContactForm, payeeprofile:S.payeeProfileForm, sendcontract:S.sendContractForm, verifydeposit:S.verifyDepositForm, orgsettings:ORG_SETTINGS, gmailmailbox:S.newGmailMailboxForm };
      formTargets.lead = S.newLeadForm;
      formTargets.traveldrop = S.travelDropForm = S.travelDropForm || {};
      formTargets.gigfee = S.gigFeeForm = S.gigFeeForm || {};
      // A misspelled data-form used to write silently into the New Lead form (2026-10-09 audit 5.2).
      // Fields with no data-form at all keep the old New-Lead default.
      if(form && !formTargets[form]){ console.warn('data-field inside unknown data-form:', form, key); return; }
      const target = form ? formTargets[form] : S.newLeadForm;
      target[key] = el.type==='checkbox'? el.checked : el.value;
      // Picking a known venue fills its address, city and state (owner 2026-10-15 venue list).
      if((target===S.newLeadForm || target===S.editEventForm) && key==='venue'){
        const v = findVenue(el.value);
        if(v){ const box = el.closest('[data-form]') || document;
          [['address',v.address],['city',v.city],['state',v.state]].forEach(([k,val])=>{ target[k] = val; const inp = box.querySelector(`[data-field="${k}"]`); if(inp) inp.value = val; }); }
      }
      if(target===S.newLeadForm && key==='endTime') S.newLeadForm.endTimeManual = true;
      if(target===S.newLeadForm && key==='time' && !S.newLeadForm.endTimeManual){
        const endEl = el.closest('[data-form]')?.querySelector('[data-field="endTime"]');
        if(endEl) endEl.value = leadDefaultEndTime(S.newLeadForm);
      }
      if(form==='orgsettings') saveOrgSettings();
      if(el.type==='checkbox') render();
    });
  });
  // Contract Builder: direct-mutate the live CONTRACTS record via setContractFieldByPath()
  // rather than the generic [data-field]/formTargets binder above, which can't address nested
  // arrays (artists/clauses/entries). Plain text/textarea fields store silently (no render, so
  // typing in a paragraph never loses the cursor); fields marked data-live recompute + re-render
  // while preserving focus, since payment figures and generated clause sentences must update as
  // the user types (see renderPreservingFocus()).
  document.querySelectorAll('[data-contract-field]').forEach(el=>{
    const evt = (el.tagName==='SELECT' || el.type==='checkbox') ? 'change' : 'input';
    el.addEventListener(evt, ()=>{
      const c = getContract(S.contractBuilderId); if(!c) return;
      const path = el.getAttribute('data-contract-field');
      const val = el.type==='checkbox' ? el.checked : el.value;
      setContractFieldByPath(c, path, val);
      c.updatedAt = new Date().toISOString();
      saveContracts();
      if(el.dataset.live!==undefined) renderPreservingFocus();
    });
    // Re-render once the user leaves the field (e.g. a cleared overtime rate shows the automatic one).
    if(el.dataset.renderOnChange!==undefined) el.addEventListener('change', ()=>render());
  });
  document.querySelectorAll('[data-outside-field]').forEach(el=>{
    const evt = (el.tagName==='SELECT' || el.type==='checkbox') ? 'change' : 'input';
    el.addEventListener(evt, ()=>{
      const b = getOutsideBooking(S.outsideBookingDetailId); if(!b) return;
      const path = el.getAttribute('data-outside-field');
      const val = el.type==='checkbox' ? el.checked : (el.type==='number' ? Number(el.value)||0 : el.value);
      setOutsideBookingFieldByPath(b, path, val);
      saveOutsideBookings();
      if(el.type==='checkbox') render(); // reveals/hides dependent fields (flight/hotel/etc. sub-forms)
    });
  });
  document.querySelectorAll('[data-travel-field]').forEach(el=>{
    const evt = (el.tagName==='SELECT' || el.type==='checkbox') ? 'change' : 'input';
    el.addEventListener(evt, ()=>{
      const tr = getTravelRequest(S.travelRequestDetailId); if(!tr) return;
      const path = el.getAttribute('data-travel-field');
      const val = el.type==='checkbox' ? el.checked : (el.type==='number' ? Number(el.value)||0 : el.value);
      setTravelRequestFieldByPath(tr, path, val);
      saveTravelRequests();
      if(el.type==='checkbox') render();
    });
  });
  document.querySelectorAll('[data-calendar-mapping]').forEach(el=>{
    el.addEventListener('blur', ()=>{
      doSaveCalendarMapping(el.getAttribute('data-calendar-mapping'), el.value.trim());
    });
  });
  document.querySelectorAll('[data-flight-seg-field]').forEach(el=>{
    el.addEventListener('input', ()=>{
      const tr = getTravelRequest(S.travelRequestDetailId); if(!tr) return;
      const [segId, field] = el.getAttribute('data-flight-seg-field').split('.');
      setFlightSegmentFieldByPath(tr, segId, field, el.value);
      saveTravelRequests();
    });
  });
  document.querySelectorAll('[data-outside-reminder-field]').forEach(el=>{
    el.addEventListener('input', ()=>{
      const b = getOutsideBooking(S.outsideBookingDetailId); if(!b) return;
      const [reminderId, field] = el.getAttribute('data-outside-reminder-field').split('.');
      const val = field==='dueAt' ? (el.value? el.value+'T00:00:00.000Z' : '') : (field==='recurrenceDays' ? (el.value?Number(el.value):null) : el.value);
      setOutsideBookingReminderFieldByPath(b, reminderId, field, val);
      saveOutsideBookings();
    });
  });
  document.querySelectorAll('[data-lead-artist-fee]').forEach(el=>{
    el.addEventListener('input', ()=>{
      const artistId = el.getAttribute('data-lead-artist-fee');
      const entry = (S.newLeadForm.additionalArtists||[]).find(x=>x.artistId===artistId);
      if(entry) entry.feeAmount = Number(el.value)||0;
    });
  });
  document.querySelectorAll('.contract-performer-select').forEach(sel=>{
    sel.addEventListener('change', ()=>{
      doSetContractPerformer(sel.getAttribute('data-id'), sel.value||null);
    });
  });
  const contractsSearchInput = document.getElementById('contractsSearchInput');
  if(contractsSearchInput){
    contractsSearchInput.addEventListener('input', ()=>{ S.contractsSearchQuery = contractsSearchInput.value; render(); });
    if(shouldRefocus('contractsSearchInput')){ contractsSearchInput.focus(); const v = contractsSearchInput.value; contractsSearchInput.value=''; contractsSearchInput.value=v; }
  }
  const askAIInput = document.getElementById('askAIInput');
  if(askAIInput){
    askAIInput.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); doAskAI(); } });
    if(shouldRefocus('askAIInput')){ askAIInput.focus(); const v = askAIInput.value; askAIInput.value=''; askAIInput.value=v; }
  }
  const contractSearchInput = document.getElementById('contractSearchInput');
  if(contractSearchInput){
    contractSearchInput.addEventListener('input', ()=>{ S.contractSearchQuery = contractSearchInput.value; render(); });
    if(shouldRefocus('contractSearchInput')){ contractSearchInput.focus(); const v = contractSearchInput.value; contractSearchInput.value=''; contractSearchInput.value=v; }
  }
  const realSignInEmailInput = document.getElementById('realSignInEmailInput');
  if(realSignInEmailInput) realSignInEmailInput.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); doSendSignInCode(); } });
  const restoreFileInput = document.getElementById('restoreFileInput');
  if(restoreFileInput) restoreFileInput.addEventListener('change', e=>{ doRestoreFromFile(e.target.files && e.target.files[0]); e.target.value = ''; });
  const realSignInCodeInput = document.getElementById('realSignInCodeInput');
  if(realSignInCodeInput){
    realSignInCodeInput.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); doVerifySignInCode(); } });
    if(document.activeElement!==realSignInCodeInput) realSignInCodeInput.focus();
  }
  document.body.onclick = (e)=>{
    const t = e.target.closest('[data-action]');
    if(S.showEventMenu && !e.target.closest('.kebab-menu-wrap')){
      S.showEventMenu = false;
      render();
    }
    if(!t) return;
    if(t.tagName==='A' && t.getAttribute('href')==='#') e.preventDefault();
    const action = t.getAttribute('data-action');
    const id = t.getAttribute('data-id');
    if(action==='overlay-close' && e.target===t){ closeSheet(); return; }
    if(action==='overlay-close') return;
    if(ACTIONS[action]){ ACTIONS[action]({ id, t, e }); return; }
    switch(action){
      case 'logout': doRealSignOut(); break;
      case 'open-real-signin': S.showRealSignIn=true; S.realSignInSent=false; render(); break;
      case 'close-real-signin': S.showRealSignIn=false; S.realSignInSent=false; S.realSignInEmail=''; S.realSignInCode=''; render(); break;
      case 'send-signin-code': doSendSignInCode(); break;
      case 'verify-signin-code': doVerifySignInCode(); break;
      case 'real-signin-passkey': doRealSignInPasskey(); break;
      case 'real-signout': doRealSignOut(); break;
      case 'open-mobile-menu': S.showMobileMenu=true; render(); break;
      case 'close-mobile-menu': S.showMobileMenu=false; render(); break;
      case 'mobilemenu-close': if(e.target===t){ S.showMobileMenu=false; render(); } break;
      case 'nav': navigate(t.getAttribute('data-view')); break;
      case 'nav-today-gigs': navigate(isAdminUser(S.user)?'calendar':'a_calendar', {calViewMode:'day', calDate:(()=>{const d=new Date(); d.setHours(0,0,0,0); return d;})()}); break;
      case 'open-event': openEvent(id); break;
      case 'open-day': closeAllOverlays(); S.dayListDate = t.getAttribute('data-date'); render(); break;
      case 'close-daylist': S.dayListDate = null; render(); break;
      case 'dayoverlay-close': if(e.target===t){ S.dayListDate=null; render(); } break;
      case 'open-event-from-day': S.dayListDate = null; openEvent(id); break;
      case 'open-artist': navigate('artist_detail', {artistDetailId:id}); break;
      case 'open-new-lead': closeAllOverlays(); S.newLeadForm={date:'',time:'19:00'}; S.showNewLead=true; render(); break;
      case 'quick-add-event': closeAllOverlays(); S.newLeadForm={date:t.getAttribute('data-date'),time:'19:00'}; S.showNewLead=true; render(); break;
      case 'open-block-time': closeAllOverlays(); S.blockTimeForm={}; S.showBlockTime=true; render(); break;
      case 'submit-block-time': doSubmitBlockTime(); break;
      case 'open-ask-ai': closeAllOverlays(); S.showAskAI=true; render(); break;
      case 'submit-ask-ai': doAskAI(); break;
      case 'ask-ai-suggestion': S.askAIForm={query:t.getAttribute('data-q')}; doAskAI(); break;
      case 'close-sheet': closeSheet(); break;
      case 'pick-artist': S.newLeadForm.artistId = id; applyStandardPricing(); render(); break;
      case 'toggle-additional-artist': {
        S.newLeadForm.additionalArtists = S.newLeadForm.additionalArtists||[];
        const idx = S.newLeadForm.additionalArtists.findIndex(x=>x.artistId===id);
        if(idx>=0) S.newLeadForm.additionalArtists.splice(idx,1);
        else S.newLeadForm.additionalArtists.push({artistId:id, feeAmount:0});
        render(); break;
      }
      case 'pick-booking-kind': { const kind = t.getAttribute('data-kind'); S.newLeadForm.kind = kind; S.newLeadForm.type = null; render(); break; }
      case 'switch-to-outside-booking': { const carryDate = S.newLeadForm.date; closeAllOverlays(); S.newOutsideBookingForm={date:carryDate||''}; S.showNewOutsideBooking=true; render(); break; }
      case 'submit-lead': doSubmitLead(); break;
      case 'add-lead-charge': {
        const f = S.newLeadForm;
        const preset = f.chargePreset || CHARGE_PRESETS[0];
        const label = preset==='Other' ? (f.chargeCustomLabel||'').trim() : preset;
        const amount = Number(f.chargeAmount);
        if(!label || !amount || amount<=0){ toast('Enter a fee type and amount.', 'system'); break; }
        f.charges = f.charges || [];
        f.charges.push({label, amount});
        f.chargeCustomLabel=''; f.chargeAmount=''; f.chargePreset=CHARGE_PRESETS[0];
        render(); break;
      }
      case 'remove-lead-charge': {
        S.newLeadForm.charges.splice(Number(t.getAttribute('data-idx')), 1);
        render(); break;
      }
      case 'cal-prev':
        if(S.calViewMode==='week') S.calDate.setDate(S.calDate.getDate()-7);
        else if(S.calViewMode==='day') S.calDate.setDate(S.calDate.getDate()-1);
        else S.calMonth.setMonth(S.calMonth.getMonth()-1);
        render(); break;
      case 'cal-next':
        if(S.calViewMode==='week') S.calDate.setDate(S.calDate.getDate()+7);
        else if(S.calViewMode==='day') S.calDate.setDate(S.calDate.getDate()+1);
        else S.calMonth.setMonth(S.calMonth.getMonth()+1);
        render(); break;
      case 'cal-today':
        S.calMonth = (()=>{const d=new Date(); d.setDate(1); return d;})();
        S.calDate = (()=>{const d=new Date(); d.setHours(0,0,0,0); return d;})();
        render(); break;
      case 'cal-view-mode': {
        const mode = t.getAttribute('data-mode');
        if(mode==='month' && S.calViewMode!=='month'){ S.calMonth = new Date(S.calDate.getFullYear(), S.calDate.getMonth(), 1); }
        else if(mode!=='month' && S.calViewMode==='month'){ S.calDate = new Date(S.calMonth.getFullYear(), S.calMonth.getMonth(), 1); }
        S.calViewMode = mode; render(); break;
      }
      case 'open-day-view': S.calViewMode='day'; S.calDate=new Date(t.getAttribute('data-date')+'T00:00:00'); render(); break;
      case 'cal-filter': {
        const i = S.calArtistFilter.indexOf(id);
        if(i>-1) S.calArtistFilter.splice(i,1); else S.calArtistFilter.push(id);
        render(); break;
      }
      case 'fin-filter': S.finArtistFilter = id; render(); break;
      case 'filter-leads-artist': S.leadsArtistFilter = id; render(); break;
      case 'filter-needsreview-artist': S.needsReviewArtistFilter = id; render(); break;
      case 'mark-event-reviewed': {
        const ev=getEvent(id);
        if(ev){
          const result = updateEvent(id, { needsReview:false });
          if(!result.ok) toast(result.error==='conflict' ? 'This gig changed elsewhere since you loaded it — reload before marking reviewed.' : 'Could not save.', 'system');
          else toast('Marked reviewed.', 'success');
        }
        render(); break;
      }
      case 'pricing-artist': S.pricingArtist = id; render(); break;
      case 'send-contract': doSendContract(id); break;
      case 'mark-deposit': doMarkDeposit(id); break;
      case 'confirm-lead': doConfirmLead(id); break;
      case 'toggle-flight': doToggleFlight(id); break;
      case 'open-flight-form': S.flightForm={}; S.showFlightForm=true; render(); break;
      case 'close-flight-form': S.showFlightForm=false; render(); break;
      case 'flight-overlay-close': if(e.target===t) { S.showFlightForm=false; render(); } break;
      case 'save-flight': doSaveFlight(id); break;
      case 'check-flight-status': doCheckFlightStatus(id); break;
      case 'toggle-ground-transport': doToggleGroundTransport(id); break;
      case 'open-transport-form': S.transportForm={}; S.showTransportForm=true; render(); break;
      case 'close-transport-form': S.showTransportForm=false; render(); break;
      case 'transport-overlay-close': if(e.target===t) { S.showTransportForm=false; render(); } break;
      case 'save-transport': doSaveGroundTransport(id); break;
      case 'open-dresscode-form': { const ev=getEvent(S.eventId); S.dressCodeForm={dressCode:ev?.dressCode||''}; S.showDressCodeForm=true; render(); break; }
      case 'close-dresscode-form': S.showDressCodeForm=false; render(); break;
      case 'dresscode-overlay-close': if(e.target===t) { S.showDressCodeForm=false; render(); } break;
      case 'pick-dresscode': S.dressCodeForm.dressCode = t.getAttribute('data-value'); render(); break;
      case 'save-dresscode': doSaveDressCode(id); break;
      case 'open-giginfo-form': { const ev=getEvent(S.eventId)||{}; const sheet=gigInfoSheetOf(ev); S.gigInfoForm={ text:sheet.text, band:ev.band||'', bandSize:ev.bandSize||'', choir:sheet.choir, otherSingers:sheet.otherSingers, startTime:sheet.startTime, scheduleText:gigScheduleText(sheet), songsText:gigSongsText(sheet) }; S.gigInfoFile=null; S.newGigContactForm={}; S.showGigInfoForm=true; render(); break; }
      case 'close-giginfo-form': S.showGigInfoForm=false; S.newGigContactForm={}; render(); break;
      case 'giginfo-overlay-close': if(e.target===t) { S.showGigInfoForm=false; S.newGigContactForm={}; render(); } break;
      case 'add-gig-contact': doAddGigContact(id); break;
      case 'remove-gig-contact': doRemoveGigContact(id, t.getAttribute('data-contactid')); break;
      case 'save-giginfo': doSaveGigInfo(id); break;
      case 'view-giginfo': S.gigInfoDocEventId=id; S.showGigInfoDoc=true; render(); break;
      case 'close-giginfo-doc': S.showGigInfoDoc=false; S.gigInfoDocEventId=null; render(); break;
      case 'giginfo-doc-overlay-close': if(e.target===t) { S.showGigInfoDoc=false; S.gigInfoDocEventId=null; render(); } break;
      case 'print-giginfo': window.print(); break;
      case 'copy-text': doCopyText(t.getAttribute('data-value')); break;
      case 'open-edit-event': S.editEventForm={}; S.showEditEvent=true; render(); break;
      case 'close-edit-event': S.showEditEvent=false; render(); break;
      case 'editevent-overlay-close': if(e.target===t) { S.showEditEvent=false; render(); } break;
      case 'save-edit-event': doSaveEditEvent(id); break;
      case 'toggle-add-charge': S.showAddCharge=!S.showAddCharge; S.addChargeForm={}; render(); break;
      case 'confirm-add-charge': doAddCharge(id); break;
      case 'remove-charge': doRemoveCharge(id, t.getAttribute('data-chargeid')); break;
      case 'remove-prep': doRemovePrep(id, t.getAttribute('data-prepid')); break;
      case 'create-contract': startContractForLead(id); break;
      case 'close-template-picker': S.showTemplatePicker=false; S.templatePickerLeadId=null; render(); break;
      case 'templatepicker-overlay-close': if(e.target===t){ S.showTemplatePicker=false; S.templatePickerLeadId=null; render(); } break;
      case 'pick-template-create': { const leadId=id; const template=t.getAttribute('data-template'); S.showTemplatePicker=false; S.templatePickerLeadId=null; doCreateContractFromLead(leadId, template); break; }
      case 'open-contract-builder': S.showContractBuilder=true; S.contractBuilderId=id; render(); break;
      case 'close-contract-builder': S.showContractBuilder=false; S.contractBuilderId=null; render(); break;
      case 'contractbuilder-overlay-close': if(e.target===t){ S.showContractBuilder=false; S.contractBuilderId=null; render(); } break;
      case 'contract-refresh-from-lead': doRefreshContractFromLead(S.contractBuilderId); break;
      case 'delete-contract': doDeleteContract(S.contractBuilderId); break;
      case 'set-contract-status': { const c=getContract(S.contractBuilderId); if(c){ c.status=t.getAttribute('data-status'); if(c.status==='void') revokeOpenSignLinks(c); if(c.status==='sent' || c.status==='signed') freezeContractPayee(c); if(c.status==='signed' && !c.signedAt) c.signedAt=new Date().toISOString(); c.updatedAt=new Date().toISOString(); saveContracts(); if(c.status==='sent' || c.status==='signed') advanceLeadForContract(c, `Contract ${c.id} marked ${c.status} by hand (sent outside the app).`); } render(); break; }
      case 'approve-contract-for-sending': doApproveContractForSending(id); break;
      case 'revoke-contract-approval': doRevokeContractApproval(id); break;
      case 'pick-contract-overtime-interval': { const c=getContract(S.contractBuilderId); if(c){ c.overtime.interval=t.getAttribute('data-value'); refreshAutoOvertime(c); c.updatedAt=new Date().toISOString(); saveContracts(); } render(); break; }
      case 'pick-cancellation-type': { const c=getContract(S.contractBuilderId); if(c){ c.cancellationPolicy.type=t.getAttribute('data-value'); c.updatedAt=new Date().toISOString(); saveContracts(); } render(); break; }
      case 'pick-balance-due-timing': { const c=getContract(S.contractBuilderId); if(c){ c.balanceDueTiming=t.getAttribute('data-value'); c.updatedAt=new Date().toISOString(); saveContracts(); } render(); break; }
      case 'pick-travel-flight-class': { const c=getContract(S.contractBuilderId); if(c){ c.travelClause.flightsClass=t.getAttribute('data-value'); c.updatedAt=new Date().toISOString(); saveContracts(); } render(); break; }
      case 'pick-lineitem-travel-flight-class': { const c=getContract(S.contractBuilderId); if(c){ const li=c.lineItems.find(x=>x.id===id); if(li) li.travelClause.flightsClass=t.getAttribute('data-value'); c.updatedAt=new Date().toISOString(); saveContracts(); } render(); break; }
      case 'add-cancellation-tier': doAddCancellationTier(S.contractBuilderId); break;
      case 'remove-cancellation-tier': doRemoveCancellationTier(S.contractBuilderId, id); break;
      case 'add-client-provides': doAddClientProvides(S.contractBuilderId, t.getAttribute('data-label')); break;
      case 'remove-client-provides': doRemoveClientProvides(S.contractBuilderId, parseInt(t.getAttribute('data-idx'),10)); break;
      case 'add-line-item': doAddLineItem(S.contractBuilderId); break;
      case 'remove-line-item': doRemoveLineItem(S.contractBuilderId, id); break;
      case 'add-add-on': doAddAddOn(S.contractBuilderId); break;
      case 'remove-add-on': doRemoveAddOn(S.contractBuilderId, id); break;
      case 'add-custom-clause': doAddCustomClause(S.contractBuilderId); break;
      case 'remove-custom-clause': doRemoveCustomClause(S.contractBuilderId, id); break;
      case 'view-contract-builder-doc': S.showContractBuilderDoc=true; render(); break;
      case 'close-contract-builder-doc': S.showContractBuilderDoc=false; render(); break;
      case 'contractbuilderdoc-overlay-close': if(e.target===t){ S.showContractBuilderDoc=false; render(); } break;
      case 'print-contract-builder': window.print(); break;
      case 'filter-contracts-status': S.contractsStatusFilter = t.getAttribute('data-status'); render(); break;
      case 'open-payee-profile-form': S.showPayeeProfileForm=true; S.editingPayeeProfileId=id||null; S.payeeStripeEmail=null; S.payeeStripeLink=null; if(id && stripeReady()) refreshStripePayees(); S.payeeProfileForm = id? (()=>{ const p=getPayeeProfile(id); return p? {entityName:p.entityName, artistId:p.artistId, zelle:p.zelle, checkPayee:p.checkPayee, checkAddress:p.checkAddress, wireBankName:p.wireBankName, wireAccountName:p.wireAccountName, wireAccountNumber:p.wireAccountNumber, wireRoutingNumber:p.wireRoutingNumber, wireSwift:p.wireSwift, notes:p.notes, defaultOvertimeInterval:p.defaultOvertimeInterval, zelleRecipientLabel:p.zelleRecipientLabel, zelleInstructions:p.zelleInstructions, zelleActive:p.zelleActive, zelleQrDataUrl:p.zelleQrDataUrl, zelleQrUrl:p.zelleQrUrl||null} : {}; })() : {defaultOvertimeInterval:'half_hour', zelleActive:true};
      render(); break;
      case 'close-payee-profile-form': S.showPayeeProfileForm=false; S.payeeProfileForm={}; S.editingPayeeProfileId=null; render(); break;
      case 'payeeprofileform-overlay-close': if(e.target===t){ S.showPayeeProfileForm=false; S.payeeProfileForm={}; S.editingPayeeProfileId=null; render(); } break;
      case 'pick-payee-overtime-interval': S.payeeProfileForm.defaultOvertimeInterval = t.getAttribute('data-value'); render(); break;
      case 'save-payee-profile': doSavePayeeProfile(); break;
      case 'remove-payee-zelle-qr': S.payeeProfileForm.zelleQrDataUrl = null; S.payeeProfileForm.zelleQrUrl = null; render(); break;
      case 'delete-payee-profile': doDeletePayeeProfile(id); break;
      case 'preview-data-migration': S.migrationPreview = computeMigrationCounts(); render(); break;
      case 'check-reconciliation-queue': loadReconciliationQueue(); break;
      case 'check-gmail-mailboxes': loadGmailStatus(); break;
      case 'check-calendar-mappings': loadCalendarMappings(); break;
      case 'check-zelle-review-queue': loadZelleReviewQueue(); break;
      case 'add-gmail-mailbox': doAddGmailMailbox(); break;
      case 'migrate-payee-profiles': doMigratePayeeProfilesToSupabase().then(()=>{ S.migrationPreview = computeMigrationCounts(); render(); }); break;
      case 'migrate-contracts': doMigrateContractsToSupabase().then(()=>{ S.migrationPreview = computeMigrationCounts(); render(); }); break;
      case 'open-send-contract': { const c=getContract(id); if(c){ const figures=contractPaymentFigures(c); S.contractBuilderId=id; S.showSendContractConfirm=true; S.sendContractPayOnline=!!contractDepositPayment(c); S.sendContractInvoice=!S.sendContractPayOnline; S.sendContractForm={ to:c.snapshot.clientEmail||'', subject:`${contractTemplateLabel(c.template)} — ${c.snapshot.venue||'Your Event'}${c.snapshot.eventDate?` — ${fmtDateShort(c.snapshot.eventDate)}`:''}`, qboAmount: figures.deposit||'', qboDescription: `Deposit — ${c.snapshot.venue||'Your Event'}${c.snapshot.eventDate?` (${fmtDateShort(c.snapshot.eventDate)})`:''}` }; } render(); break; }
      case 'close-send-contract-confirm': if(!S.sendContractBusy){ S.showSendContractConfirm=false; S.sendContractForm={}; render(); } break;
      case 'sendcontract-overlay-close': if(e.target===t && !S.sendContractBusy){ S.showSendContractConfirm=false; S.sendContractForm={}; render(); } break;
      case 'confirm-send-contract': doSendContractEmail(); break;
      case 'toggle-send-contract-invoice': S.sendContractInvoice = !S.sendContractInvoice; if(S.sendContractInvoice) S.sendContractPayOnline = false; render(); break;
      case 'toggle-send-contract-pay': S.sendContractPayOnline = !S.sendContractPayOnline; if(S.sendContractPayOnline) S.sendContractInvoice = false; render(); break;
      case 'make-invoice-pay-link': doMakeInvoicePayLink(id); break;
      case 'make-balance-pay-link': doMakeBalancePayLink(id); break;
      case 'payee-stripe-link': doPayeeStripeSetup(id); break;
      case 'payee-stripe-send': doPayeeStripeSetup(id, { send:true }); break;
      case 'payee-stripe-share': doPayeeStripeSetup(id, { shareFrom: t.getAttribute('data-from') }); break;
      case 'remove-deposit-zelle-qr': ORG_SETTINGS.depositZelleQrUrl = null; saveOrgSettings(); render(); break;
      case 'toggle-invoice-no-card-fee': S.newInvoiceForm.noCardFee = !S.newInvoiceForm.noCardFee; render(); break;
      case 'open-verify-deposit': S.verifyDepositEventId=id; S.showVerifyDeposit=true; S.verifyDepositForm={method:'zelle', note:''}; render(); break;
      case 'close-verify-deposit': S.showVerifyDeposit=false; S.verifyDepositForm={}; render(); break;
      case 'verifydeposit-overlay-close': if(e.target===t){ S.showVerifyDeposit=false; S.verifyDepositForm={}; render(); } break;
      case 'confirm-verify-deposit': doMarkDepositVerified(id); break;
      case 'view-itinerary': S.itineraryEventId=id; S.showItinerary=true; render(); break;
      case 'close-itinerary': S.showItinerary=false; S.itineraryEventId=null; render(); break;
      case 'itinerary-overlay-close': if(e.target===t) { S.showItinerary=false; S.itineraryEventId=null; render(); } break;
      case 'print-itinerary': window.print(); break;
      case 'open-new-invoice': closeAllOverlays(); S.newInvoiceForm={items:[]}; S.showNewInvoice=true; render(); break;
      case 'add-invoice-item': {
        const f = S.newInvoiceForm; const label=(f.itemLabel||'').trim(); const amt=Number(f.itemAmount);
        if(!label || !amt || amt<=0){ toast('Enter a description and amount.', 'error'); break; }
        f.items = f.items || []; f.items.push({id:'LI-'+randInt(1,999999), label, amount:amt});
        f.itemLabel=''; f.itemAmount=''; render(); break;
      }
      case 'remove-invoice-item': { const f=S.newInvoiceForm; f.items.splice(Number(t.getAttribute('data-idx')),1); render(); break; }
      case 'submit-invoice': doSubmitInvoice(); break;
      case 'view-invoice': closeAllOverlays(); S.invoiceDocId=id; S.showInvoiceDoc=true; render(); break;
      case 'close-invoice-doc': S.showInvoiceDoc=false; S.invoiceDocId=null; render(); break;
      case 'invoice-overlay-close': if(e.target===t) { S.showInvoiceDoc=false; S.invoiceDocId=null; render(); } break;
      case 'print-invoice': window.print(); break;
      case 'mark-invoice-paid': doMarkInvoicePaid(id); break;
      case 'open-new-outside-booking': closeAllOverlays(); S.newOutsideBookingForm={}; S.showNewOutsideBooking=true; render(); break;
      case 'submit-outside-booking': doSubmitOutsideBooking(); break;
      case 'open-outside-booking-detail': S.showOutsideBookingDetail=true; S.outsideBookingDetailId=id; render(); break;
      case 'close-outside-booking-detail': S.showOutsideBookingDetail=false; S.outsideBookingDetailId=null; render(); break;
      case 'outsidebookingdetail-overlay-close': if(e.target===t){ S.showOutsideBookingDetail=false; S.outsideBookingDetailId=null; render(); } break;
      case 'create-travel-request': doCreateTravelRequest(id); break;
      case 'open-travel-request': S.showTravelRequestDetail=true; S.travelRequestDetailId=id; render(); break;
      case 'close-travel-request-detail': S.showTravelRequestDetail=false; S.travelRequestDetailId=null; render(); break;
      case 'travelrequest-overlay-close': if(e.target===t){ S.showTravelRequestDetail=false; S.travelRequestDetailId=null; render(); } break;
      case 'send-travel-request': doSendTravelRequest(id); break;
      case 'add-flight-segment': doAddFlightSegment(id); break;
      case 'remove-flight-segment': doRemoveFlightSegment(id, t.getAttribute('data-seg')); break;
      case 'check-segment-flight-status': doCheckSegmentFlightStatus(id, t.getAttribute('data-seg')); break;
      case 'set-travel-request-status': doSetTravelRequestStatus(id, t.getAttribute('data-status')); break;
      case 'delete-travel-request': doDeleteTravelRequest(id); break;
      case 'add-outside-booking-reminder': doAddOutsideBookingReminder(S.outsideBookingDetailId); break;
      case 'remove-outside-booking-reminder': doRemoveOutsideBookingReminder(t.getAttribute('data-clause'), id); break;
      case 'complete-outside-booking-reminder': doCompleteOutsideBookingReminder(t.getAttribute('data-clause'), id); break;
      case 'snooze-outside-booking-reminder': doSnoozeOutsideBookingReminder(t.getAttribute('data-clause'), id, 3); break;
      case 'mark-outside-booking-paid': doMarkOutsideBookingPaid(id); break;
      case 'open-outside-doc-builder': doOpenOutsideBookingDoc(id); break;
      case 'open-new-document': closeAllOverlays(); S.documentId=null; S.documentForm={subjectType:'artist'}; S.showDocumentBuilder=true; render(); break;
      case 'open-document': closeAllOverlays(); S.documentId=id; S.documentForm={}; S.showDocumentBuilder=true; render(); break;
      case 'document-overlay-close': if(e.target===t){ closeAllOverlays(); render(); } break;
      case 'pick-document-subject-type': S.documentForm.subjectType = t.getAttribute('data-subject'); S.documentForm.subjectId = null; render(); break;
      case 'save-document': doSaveDocument(); break;
      case 'print-document': doSaveDocument(); window.print(); break;
      case 'ai-edit-document': S.showAiEditNotice = true; render(); break;
      case 'send-reminder': doSendReminder(id); break;
      case 'preview-reminder': S.showReminderPreview=true; render(); break;
      case 'resend-reminder': doSendReminderEmail(id); break;
      case 'resend-booking-confirmation': doSendBookingConfirmationEmail(id); break;
      case 'close-reminder-preview': S.showReminderPreview=false; render(); break;
      case 'overlay-close-reminderpreview': if(e.target===t){ S.showReminderPreview=false; render(); } break;
      case 'close-booking-confirmation': S.showBookingConfirmation=false; render(); break;
      case 'overlay-close-bookingconfirmation': if(e.target===t){ S.showBookingConfirmation=false; render(); } break;
      case 'mark-balance': doMarkBalance(id); break;
      case 'inbox-money': { const it = (S.inboxItems||[]).find(x=>x.id===id); if(it) applyInboxMoney(it, false); break; }
      case 'lib-tab': S.libTab = id; render(); break;
      case 'lib-at': S.libAt = id; S.libF = {}; S.libQ = ''; S.libKind = ''; libStopPreviews(); render(); window.scrollTo(0,0); break;
      case 'lib-chip': { const c = t.dataset.cat, F = S.libF || (S.libF = {}), a = F[c] || (F[c] = []);
        a.includes(id) ? a.splice(a.indexOf(id), 1) : a.push(id); t.setAttribute('aria-pressed', a.includes(id)); libRefreshResults(); break; }
      case 'lib-clear': S.libF = {}; S.libQ = ''; S.libKind = ''; render(); break;
      case 'lib-play': libOpenPlayer(id); break;
      case 'lib-kind': S.libKind = id; render(); break;
      case 'drive-connect': doOAuthConnect('gdrive'); break;
      case 'drive-backup-now': doDriveBackupNow(false); break;
      case 'wa-open': S.waContact = id; S.waDraft = ''; S.waEditName = null; render(); break;
      case 'wa-new': S.waContact = 'new'; S.waDraft = ''; render(); break;
      case 'wa-back': S.waContact = null; render(); break;
      case 'wa-send': doWhatsAppSend(); break;
      case 'wa-setup-webhook': doWhatsAppSetupWebhook(); break;
      case 'wa-media': doWhatsAppMedia(id); break;
      case 'wa-edit-name': S.waEditName = id; render(); setTimeout(()=>{ const el = document.querySelector('[data-wa-name]'); if(el) el.focus(); }, 0); break;
      case 'wa-save-name': doWhatsAppSaveName(id); break;
      // Owner 2026-10-29: "a singer login profile so i can see what their login will look like". The
      // office session shows the singer's own pages (their gigs from the office's copy). Read-only: with
      // S.user a singer, artistReadOnly() refuses every save and shared sync pauses until Exit.
      case 'preview-as-artist': if(isAdminUser(S.user) && artistById(id)){ closeAllOverlays(); S.previewFrom = { user:S.user }; S.user = id; S.view = 'a_dashboard'; pendingViewTransition = true; syncURL(); render(); } break;
      case 'exit-preview': if(S.previewFrom){ const back = S.previewFrom.user, a = S.user; closeAllOverlays(); S.previewFrom = null; S.user = back; S.artistDetailId = a; S.view = 'artist_detail'; syncURL(); render(); } break;
      case 'crew-assign': doCrewCall({ action:'assign', eventId:id, crewId:t.getAttribute('data-crew') }, 'Asked.'); break;
      case 'crew-unassign': doCrewCall({ action:'unassign', eventId:id, crewId:t.getAttribute('data-crew') }, 'Taken back.'); break;
      case 'crew-respond': { const yes = t.getAttribute('data-accept')==='1'; doCrewCall({ action:'respond', eventId:id, accept:yes }, yes ? 'Confirmed. Thank you!' : "Got it, we'll find someone else."); break; }
      case 'lib-delete-video': libDeleteVideos([id]); break;
      case 'lib-bulk-delete': libDeleteVideos([...(S.libSelected||[])]); break;
      case 'lib-select-none': S.libSelected = new Set(); render(); break;
      case 'lib-add-singer': libAddSinger(); break;
      case 'lib-delete-singer': libDeleteSinger(id); break;
      case 'lib-singer-up': libMoveSinger(id, -1); break;
      case 'lib-singer-down': libMoveSinger(id, 1); break;
      case 'lib-add-tag': libAddTag(id); break;
      case 'lib-delete-tag': libDeleteTag(id); break;
      case 'mercury-sync': doMercuryCall({ action:'sync' }, 'Checked the bank.'); break;
      case 'mercury-approve': doMercuryCall({ action:'approve', id }, 'Moved.'); break;
      case 'mercury-cancel': doMercuryCall({ action:'cancel', id }, 'Dropped -- nothing moved.'); break;
      case 'toggle-artist-paidout': doToggleArtistPaidOut(id); break;
      case 'gcal': window.open(gcalUrl(getEvent(id)), '_blank'); break;
      case 'ics': downloadIcs(getEvent(id)); break;
      case 'dismiss-intl': {
        const result = updateEvent(id, { intlOpportunityDismissed:true });
        toast(result.ok ? 'Dismissed.' : (result.error==='conflict' ? 'This gig changed elsewhere since you loaded it — reload before dismissing.' : 'Could not save.'), result.ok?'system':'system');
        render(); break;
      }
      case 'set-theme': setThemePref(t.getAttribute('data-theme-pref')); break;
      case 'toggle-notif': { const st=getUserSettings(S.user); const key=t.getAttribute('data-key'); const channel=t.getAttribute('data-channel')||'inApp'; st.notify[key][channel]=!st.notify[key][channel]; saveAllSettings(); render(); break; }
      case 'add-passkey': { const st=getUserSettings(S.user); const n=st.passkeys.length+1; st.passkeys.push({id:'pk-'+randInt(1,999999), label:`Passkey ${n}`, addedAt: todayISO()}); saveAllSettings(); toast('Passkey added.', 'success'); render(); break; }
      case 'remove-passkey': { const st=getUserSettings(S.user); if(st.passkeys.length>1){ st.passkeys = st.passkeys.filter(pk=>pk.id!==id); saveAllSettings(); toast('Passkey removed.', 'system'); render(); } break; }
      case 'add-real-passkey': doAddRealPasskey(); break;
      case 'remove-real-passkey': doRemoveRealPasskey(id); break;
      case 'export-csv': exportCSV(); break;
      case 'filter-project-artist': S.projectArtistFilter = t.getAttribute('data-id'); render(); break;
      case 'open-project': navigate('project_detail', {projectId:id}); break;
      case 'toggle-task': doToggleTask(id, t.getAttribute('data-taskid')); break;
      case 'remove-task': doRemoveTask(id, t.getAttribute('data-taskid')); break;
      case 'add-task': doAddTask(id); break;
      case 'set-project-tab': S.projectTab = t.getAttribute('data-tab'); render(); break;
      case 'add-comment': doAddComment(id); break;
      case 'remove-project-image': doRemoveProjectImage(id, t.getAttribute('data-imgid')); break;
      case 'add-project-link': doAddProjectLink(id); break;
      case 'remove-project-link': doRemoveProjectLink(id, t.getAttribute('data-linkid')); break;
      case 'add-person': doAddPerson(id); break;
      case 'remove-person': doRemovePerson(id, t.getAttribute('data-pid')); break;
      case 'set-person-kind': S.newPersonForm = {kind: t.getAttribute('data-kind')}; render(); break;
      case 'filter-tasks-by-assignee': { const pid = t.getAttribute('data-pid'); S.taskAssigneeFilter = (pid && pid!==S.taskAssigneeFilter) ? pid : null; render(); break; }
      case 'add-fin-item': doAddFinItem(id, t.getAttribute('data-kind')); break;
      case 'remove-fin-item': doRemoveFinItem(id, t.getAttribute('data-kind'), t.getAttribute('data-itemid')); break;
      case 'add-board-card': doAddBoardCard(id, t.getAttribute('data-preset')); break;
      case 'remove-board-card': doRemoveBoardCard(id, t.getAttribute('data-cardid')); break;
      case 'remove-board-item': doRemoveBoardItem(id, t.getAttribute('data-cardid'), t.getAttribute('data-itemid')); break;
      case 'add-board-item': doAddBoardItem(id, t.getAttribute('data-cardid')); break;
      case 'remove-project-cover': { const p=getProject(id); p.coverImage=null; saveProjects(); toast('Cover removed.', 'system'); render(); break; }
      case 'open-new-project': { const presetArtist = S.projectArtistFilter!=='all'? S.projectArtistFilter : null; closeAllOverlays(); S.newProjectForm={artistId: presetArtist}; S.showNewProject=true; render(); break; }
      case 'close-new-project': S.showNewProject=false; render(); break;
      case 'overlay-close-newproject': if(e.target===t){ S.showNewProject=false; render(); } break;
      case 'pick-project-artist': S.newProjectForm.artistId = id||null; render(); break;
      case 'new-project-mode': S.newProjectForm.mode = t.getAttribute('data-mode'); render(); break;
      case 'pick-episode-count': S.newProjectForm.episodeCount = Number(t.getAttribute('data-count')); render(); break;
      case 'confirm-add-project': doAddProject(); break;
      case 'open-add-artist': closeAllOverlays(); S.addArtistForm={}; S.showAddArtist=true; render(); break;
      case 'close-add-artist': S.showAddArtist=false; render(); break;
      case 'overlay-close-addartist': if(e.target===t){ S.showAddArtist=false; render(); } break;
      case 'confirm-add-artist': doAddArtist(); break;
      case 'pick-artist-role': S.addArtistForm.role = t.getAttribute('data-role'); render(); break;
      case 'close-welcome': S.newArtistWelcome=null; render(); break;
      case 'overlay-close-welcome': if(e.target===t){ S.newArtistWelcome=null; render(); } break;
      case 'open-add-real-user': closeAllOverlays(); S.addRealUserForm={}; S.showAddRealUser=true; render(); break;
      case 'close-add-real-user': S.showAddRealUser=false; render(); break;
      case 'overlay-close-addrealuser': if(e.target===t){ S.showAddRealUser=false; render(); } break;
      case 'pick-real-user-kind': S.addRealUserForm.kind = t.getAttribute('data-kind'); render(); break;
      case 'pick-real-artist-role': S.addRealUserForm.artistRole = t.getAttribute('data-role'); render(); break;
      case 'pick-real-admin-role': S.addRealUserForm.adminRole = t.getAttribute('data-role'); render(); break;
      case 'confirm-add-real-user': doAddRealUser(); break;
      case 'open-edit-real-user': {
        closeAllOverlays();
        const kind = t.getAttribute('data-kind');
        const row = (kind==='admin'? S.realRoster.admins : S.realRoster.artists).find(r=>r.id===id);
        if(!row) break;
        S.editRealUserForm = { kind, id: row.id, name: row.name, email: row.email, originalEmail: row.email, adminRole: row.role, artistRole: row.role,
          commissionPct: row.commission_pct ?? Math.round(COMMISSION_RATE*100) };
        S.showEditRealUser = true; render(); break;
      }
      case 'close-edit-real-user': S.showEditRealUser=false; render(); break;
      case 'overlay-close-editrealuser': if(e.target===t){ S.showEditRealUser=false; render(); } break;
      case 'pick-edit-artist-role': S.editRealUserForm.artistRole = t.getAttribute('data-role'); render(); break;
      case 'pick-edit-admin-role': S.editRealUserForm.adminRole = t.getAttribute('data-role'); render(); break;
      case 'confirm-edit-real-user': doEditRealUser(); break;
      case 'toggle-event-menu': S.showEventMenu = !S.showEventMenu; render(); break;
      case 'share-event': doShareEvent(id); break;
      case 'copy-daily-digest': doCopyDailyDigest(); break;
      case 'delete-event': doDeleteEvent(id); break;
      case 'install-app': if(deferredInstallPrompt){ deferredInstallPrompt.prompt(); deferredInstallPrompt.userChoice.finally(()=>{ deferredInstallPrompt=null; }); } break;
      case 'dismiss-install': localStorage.setItem('aspInstallDismissedAt', String(Date.now())); S.showInstallBanner=false; render(); break;
    }
  };
  bindVideoLibrary();
  bindVenueLookup();
  bindWhatsApp();
  document.querySelectorAll('select[data-action="mercury-assign"]').forEach(sel=>{
    sel.addEventListener('change', ()=>{ const v = sel.value;
      doMercuryCall({ action:'assign', accountId: sel.getAttribute('data-id'), role: v.startsWith('payee:') ? 'payee' : (v || null), payeeProfileId: v.startsWith('payee:') ? v.slice(6) : null }, 'Saved.'); });
  });
  document.querySelectorAll('[data-action="set-reminder-interval"]').forEach(sel=>{
    sel.addEventListener('change', ()=>{ const id=sel.getAttribute('data-id'); if(reportEventSave(updateEvent(id, { reminderIntervalDays:Number(sel.value) }), 'updating the reminder interval')) toast('Reminder interval updated.', 'system'); });
  });
  document.querySelectorAll('[data-charge-preset]').forEach(sel=>{
    sel.addEventListener('change', ()=>{ S.addChargeForm.preset = sel.value; render(); });
  });
  document.querySelectorAll('[data-lead-charge-preset]').forEach(sel=>{
    sel.addEventListener('change', ()=>{ S.newLeadForm.chargePreset = sel.value; render(); });
  });
  document.querySelectorAll('[data-action="pick-event-type"]').forEach(sel=>{
    sel.addEventListener('change', ()=>{ S.newLeadForm.type = sel.value; applyStandardPricing(); render(); });
  });
  document.querySelectorAll('[data-action="flight-form-file"]').forEach(inp=>{
    inp.addEventListener('change', ()=>{ const f = inp.files && inp.files[0]; if(f) doFillFlightFormFromFile(f); });
  });
  document.querySelectorAll('.contract-add-provides-select').forEach(sel=>{
    sel.addEventListener('change', ()=>{ if(sel.value) doAddClientProvides(sel.getAttribute('data-id'), sel.value); });
  });
  document.querySelectorAll('.contract-add-term-select').forEach(sel=>{
    sel.addEventListener('change', ()=>{ const c=getContract(S.contractBuilderId); if(c && sel.value){ c.boilerplate[sel.value] = true; c.updatedAt=new Date().toISOString(); saveContracts(); render(); } });
  });
  document.querySelectorAll('[data-action="travel-drop-files"]').forEach(inp=>{
    inp.addEventListener('change', ()=>attachTravelFiles(Array.from(inp.files||[])));
  });
  // Drag and drop (owner 2026-10-29: "for flight info and hotel itinerary i want a drag and drop option for pdf").
  document.querySelectorAll('.drop-zone[data-drop]').forEach(zone=>{
    zone.addEventListener('dragover', e=>{ e.preventDefault(); zone.classList.add('over'); });
    zone.addEventListener('dragleave', ()=>zone.classList.remove('over'));
    zone.addEventListener('drop', e=>{
      e.preventDefault(); zone.classList.remove('over');
      const files = Array.from((e.dataTransfer && e.dataTransfer.files) || []).filter(f=>/^(application\/pdf|image\/)/.test(f.type));
      if(!files.length){ toast('Drop a PDF or an image.', 'system'); return; }
      if(zone.dataset.drop==='flight') doFillFlightFormFromFile(files[0]); else attachTravelFiles(files);
    });
  });
  document.querySelectorAll('[data-action="giginfo-file"]').forEach(inp=>{
    inp.addEventListener('change', ()=>{
      const file = inp.files && inp.files[0]; if(!file) return;
      if(file.size > 5*1024*1024){ toast('That file is too big (5 MB max).', 'system'); return; }
      const reader = new FileReader();
      reader.onload = ()=>{ const url = String(reader.result||''); S.gigInfoFile = { name:file.name, mediaType:file.type, data:url.slice(url.indexOf(',')+1) }; render(); };
      reader.readAsDataURL(file);
    });
  });
  document.querySelectorAll('[data-action="upload-prep"]').forEach(inp=>{
    inp.addEventListener('change', ()=>{ if(inp.files.length) doUploadPrep(inp.getAttribute('data-id'), inp.files); });
  });
  document.querySelectorAll('[data-action="upload-project-image"]').forEach(inp=>{
    inp.addEventListener('change', ()=>{ if(inp.files.length) doUploadProjectImage(inp.getAttribute('data-id'), inp.files); });
  });
  document.querySelectorAll('[data-action="set-project-due"]').forEach(inp=>{
    inp.addEventListener('change', ()=>{ const p=getProject(inp.getAttribute('data-id')); p.dueDate = inp.value||null; saveProjects(); toast('Target date updated.', 'system'); });
  });
  document.querySelectorAll('[data-action="set-hourly-rate"]').forEach(inp=>{
    inp.addEventListener('change', ()=>{ setPricing(inp.getAttribute('data-artist'), inp.getAttribute('data-type'), {hourlyRate:Number(inp.value)||0}); toast('Rate updated.', 'system'); render(); });
  });
  document.querySelectorAll('[data-action="set-included-hours"]').forEach(inp=>{
    inp.addEventListener('change', ()=>{ setPricing(inp.getAttribute('data-artist'), inp.getAttribute('data-type'), {includedHours:Number(inp.value)||0}); toast('Rate updated.', 'system'); render(); });
  });
  document.querySelectorAll('[data-action="upload-deposit-zelle-qr"]').forEach(inp=>{
    if(inp.tagName!=='INPUT') return;
    inp.addEventListener('change', async ()=>{
      if(!inp.files.length) return;
      S.depositQrBusy = true; render();
      const up = await uploadBrandImage(inp.files[0], 'zelle/asp-deposit');
      S.depositQrBusy = false;
      if(!up.ok){ toast(up.error, 'system'); render(); return; }
      ORG_SETTINGS.depositZelleQrUrl = up.url; saveOrgSettings();
      toast('Zelle QR saved — it now shows on contracts and invoices.', 'success'); render();
    });
  });
  document.querySelectorAll('[data-action="upload-payee-zelle-qr"]').forEach(inp=>{
    if(inp.tagName!=='INPUT') return;
    inp.addEventListener('change', ()=>{
      if(!inp.files.length) return;
      const file = inp.files[0];
      // Also stored publicly (zelleQrUrl) so emails can show it; the in-app copy stays as before.
      const form = S.payeeProfileForm;
      form.zelleQrUrl = null;
      uploadBrandImage(file, 'zelle/payee').then(up=>{
        if(up.ok) form.zelleQrUrl = up.url; else toast(up.error + ' The QR will show in the app but not in emails.', 'system');
      });
      const reader = new FileReader();
      reader.onload = ()=>{ S.payeeProfileForm.zelleQrDataUrl = reader.result; render(); };
      reader.onerror = ()=>{ toast(`Could not read ${file.name}.`, 'system'); };
      reader.readAsDataURL(file);
    });
  });
  document.querySelectorAll('[data-action="upload-project-cover"]').forEach(inp=>{
    if(inp.tagName!=='INPUT') return;
    inp.addEventListener('change', ()=>{ if(inp.files.length) doUploadProjectCover(inp.getAttribute('data-id'), inp.files[0]); });
  });
  document.querySelectorAll('[data-action="set-project-title"]').forEach(inp=>{
    inp.addEventListener('change', ()=>{ const v=inp.value.trim(); const p=getProject(inp.getAttribute('data-id')); if(v){ p.title=v; saveProjects(); } render(); });
  });
  document.querySelectorAll('[data-action="set-project-subtitle"]').forEach(inp=>{
    inp.addEventListener('change', ()=>{ const p=getProject(inp.getAttribute('data-id')); p.subtitle = inp.value.trim(); saveProjects(); });
  });
  document.querySelectorAll('[data-action="set-board-card-header"]').forEach(inp=>{
    inp.addEventListener('change', ()=>{ const p=getProject(inp.getAttribute('data-id')); const c=(p.boardCards||[]).find(x=>x.id===inp.getAttribute('data-cardid')); if(c){ c.header = inp.value; saveProjects(); render(); } });
  });
  document.querySelectorAll('.board-item-input').forEach(inp=>{
    inp.addEventListener('input', ()=>{ S.newBoardItemText[inp.getAttribute('data-cardid')] = inp.value; });
    inp.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); doAddBoardItem(inp.getAttribute('data-projectid'), inp.getAttribute('data-cardid')); } });
  });
  document.querySelectorAll('.artist-filter-select').forEach(sel=>{
    sel.addEventListener('change', ()=>{
      const action = sel.getAttribute('data-action'), id = sel.value;
      if(action==='filter-project-artist') S.projectArtistFilter = id;
      else if(action==='fin-filter') S.finArtistFilter = id;
      else if(action==='filter-leads-artist') S.leadsArtistFilter = id;
      else if(action==='pricing-artist') S.pricingArtist = id;
      render();
    });
  });
  document.querySelectorAll('.tab-select:not(.lib-tab-select)').forEach(sel=>{
    sel.addEventListener('change', ()=>{ S.projectTab = sel.value; render(); });
  });
  document.querySelectorAll('.person-refid-select').forEach(sel=>{
    sel.addEventListener('change', ()=>{ S.newPersonForm.refId = sel.value; });
  });
  document.querySelectorAll('.document-subject-select').forEach(sel=>{
    sel.addEventListener('change', ()=>{ S.documentForm.subjectId = sel.value || null; render(); });
  });
  document.querySelectorAll('.edit-event-payment-select').forEach(sel=>{
    sel.addEventListener('change', ()=>{ S.editEventForm.paymentMethod = sel.value; render(); });
  });
  document.querySelectorAll('.edit-event-type-select').forEach(sel=>{
    sel.addEventListener('change', ()=>{ S.editEventForm.type = sel.value; render(); });
  });
  document.querySelectorAll('.new-task-assignee-select').forEach(sel=>{
    sel.addEventListener('change', ()=>{ S.newTaskAssignee = sel.value; });
  });
  document.querySelectorAll('.task-assignee-select').forEach(sel=>{
    sel.addEventListener('change', ()=>{ doAssignTask(sel.getAttribute('data-id'), sel.getAttribute('data-taskid'), sel.value); });
  });
}

applyHashToState();
render();
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{ navigator.serviceWorker.register('sw.js').catch(()=>{}); });
}

(function(){
  const opener = document.getElementById('opener');
  if(!opener) return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){ opener.remove(); return; }
  // Plays once per browser session (audit 4.11): a reload or deep link opens straight to the app.
  let seen = false;
  try{ seen = sessionStorage.getItem('asp_opener_seen')==='1'; sessionStorage.setItem('asp_opener_seen','1'); }catch(e){}
  if(seen){ opener.remove(); return; }
  const mark = opener.querySelector('.opener-mark');
  let done = false;
  function finish(){
    if(done) return; done = true;
    opener.classList.add('leaving');
    setTimeout(()=>opener.remove(), 900);
  }
  setTimeout(()=>{ mark.classList.add('activate'); }, 750);
  const autoTimer = setTimeout(finish, 2700);
  opener.addEventListener('click', ()=>{ clearTimeout(autoTimer); finish(); });
  window.addEventListener('keydown', function skipKey(e){
    if(e.key==='Enter'||e.key===' '||e.key==='Escape'){ clearTimeout(autoTimer); finish(); window.removeEventListener('keydown', skipKey); }
  });
})();

// ---- workspace contract (Phase 1a: shape only, still eager-executing above) ----
window.Workspaces = window.Workspaces || {};
window.Workspaces.asp = { id: 'asp', mount(){}, unmount(){} };
// Debug-console parity with the old inline-script global scope (harness itself avoids
// relying on this -- see test-harness/README.md -- but interactive debugging used it).
window.S = S;
// Exposed so a host shell (e.g. Moshe's Desk) can reuse this exact client instance instead of
// creating a second one against the same Supabase project -- Supabase's SDK warns that two
// GoTrueClient instances sharing one storage key can produce undefined auth behavior. This
// workspace still creates its own client unconditionally above (stays self-sufficient for the
// plain asp-bookings site, which has no shell present at all); this is purely additive.
window.supabaseClient = supabaseClient;
})();
