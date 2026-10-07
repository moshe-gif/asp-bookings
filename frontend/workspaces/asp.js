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
  up:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="m5 15 7-7 7 7"/></svg>',
  down:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="m5 9 7 7 7-7"/></svg>',
};
// Photo mic used specifically in the artist "My Gigs" area (nav icon + Today's Gig card) in place
// of the generic ICO.mic line-art icon -- same .ico sizing rules apply since width/height are CSS.
const MIC_PHOTO_ICON = '<img class="ico" src="assets/mic-artist.jpg" alt="Microphone" style="object-fit:cover;border-radius:3px;vertical-align:middle;"/>';
// The animated 5-bar mark, reused as the app's loading indicator wherever something needs a moment.
function markLoader(heightPx){
  return `<span class="mark" style="height:${heightPx||16}px;"><i></i><i></i><i></i><i></i><i></i></span>`;
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
const ARTISTS_LS_KEY = 'asp_mock_artists_v1';
function loadArtists(){ try{ const raw = localStorage.getItem(ARTISTS_LS_KEY); if(raw) return JSON.parse(raw); }catch(e){} return null; }
function saveArtists(){ try{ localStorage.setItem(ARTISTS_LS_KEY, JSON.stringify(ARTISTS)); }catch(e){} }
{ const saved = loadArtists();
  if(saved && saved.length){
    const canonical = {baruch:1, benny:2, moshe:3, yaakov:4, eli:7, dovie:6};
    const canonicalRole = {dovie:'Comedian'};
    saved.forEach(a=>{ if(canonical[a.id]) a.slot = canonical[a.id]; if(!a.role) a.role = canonicalRole[a.id]||'Singer'; });
    ARTISTS = saved; saveArtists();
  } else saveArtists();
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
function saveProjects(){ try{ localStorage.setItem(PROJECTS_LS_KEY, JSON.stringify(PROJECTS)); }catch(e){} }
let PROJECTS = loadProjects();
if(!PROJECTS){ PROJECTS = seedProjects(); saveProjects(); }
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
  const log = [{ts:created.toISOString(), type:'email', text:`Invoice sent to ${clientName}.`}];
  const paid = status==='paid';
  if(paid) log.push({ts:addDays(created, Math.max(1,Math.round(daysAgo/2))).toISOString(), type:'success', text:'Marked paid.'});
  return {
    id:'INV-'+(INVID++), clientName, clientEmail, items, notes: notes||'',
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
function saveCustomInvoices(){ try{ localStorage.setItem(INVOICES_LS_KEY, JSON.stringify(CUSTOM_INVOICES)); }catch(e){} }
let CUSTOM_INVOICES = loadCustomInvoices();
if(!CUSTOM_INVOICES){ CUSTOM_INVOICES = seedCustomInvoices(); saveCustomInvoices(); }
else { INVID = CUSTOM_INVOICES.reduce((max,i)=>{ const n=parseInt(String(i.id).split('-')[1],10); return isNaN(n)?max:Math.max(max,n+1); }, INVID); }
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
  const log = [{ts:created.toISOString(), type:'system', text:`Outside booking created — ${performerName} for ${clientName}.`}];
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
function saveOutsideBookings(){ try{ localStorage.setItem(OUTSIDE_BOOKINGS_LS_KEY, JSON.stringify(OUTSIDE_BOOKINGS)); }catch(e){} }
let OUTSIDE_BOOKINGS = loadOutsideBookings();
if(!OUTSIDE_BOOKINGS){ OUTSIDE_BOOKINGS = seedOutsideBookings(); saveOutsideBookings(); }
else {
  let anyObMigrated = false;
  OUTSIDE_BOOKINGS.forEach(b=>{ if(migrateOutsideBooking(b)) anyObMigrated = true; });
  if(anyObMigrated) saveOutsideBookings();
  OBID = OUTSIDE_BOOKINGS.reduce((max,b)=>{ const n=parseInt(String(b.id).split('-')[1],10); return isNaN(n)?max:Math.max(max,n+1); }, OBID);
}
function getOutsideBooking(id){ return OUTSIDE_BOOKINGS.find(b=>b.id===id); }

/* ============ DOCUMENTS (general doc builder — contracts, proposals, riders; any subject) ============ */
const DOC_BRANDS = {
  asp: { label:'ASP Artist Management', signer:'ASP Artist Management' },
  sing: { label:'SING Entertainment', signer:'SING Entertainment (for Ilan)' },
};
// Centralized brand config (see supabase/migrations/0015_zelle_gmail_and_brand.sql): the real,
// admin-editable source of truth once populated. Falls back to DOC_BRANDS' hardcoded text --
// identical strings today -- when the table isn't reachable yet (Demo Mode, offline, or before
// that migration has been applied), so nothing changes visually until an admin actually edits a
// brand in Supabase. New consumers should call getBrandConfig(key) rather than reading DOC_BRANDS
// directly; existing DOC_BRANDS call sites (e.g. the Documents builder) are untouched for now.
let BRAND_CONFIG_CACHE = null;
async function loadBrandConfig(){
  if(!supabaseClient) return;
  // Same guard as refreshQboStatus(): Demo Mode has no real Supabase session, so skip the network
  // call entirely rather than let it 404/RLS-reject against a live project with nothing to gain --
  // matters beyond tidiness, since a real fetch failure logs "Failed to load resource" to the
  // console regardless of whether the JS promise rejection itself is caught.
  try{
    const { data: { session } } = await supabaseClient.auth.getSession();
    if(!session) return;
    const { data, error } = await supabaseClient.from('brand_config').select('*');
    if(error || !data) return;
    const map = {};
    data.forEach(row=>{ map[row.brand_key] = { label: row.display_name, signer: row.legal_name, raw: row }; });
    if(Object.keys(map).length){ BRAND_CONFIG_CACHE = map; render(); }
  }catch(err){ /* stays on the DOC_BRANDS fallback */ }
}
function getBrandConfig(key){
  return (BRAND_CONFIG_CACHE && BRAND_CONFIG_CACHE[key]) || DOC_BRANDS[key] || DOC_BRANDS.asp;
}
let DOCID = 1;
const DOCUMENTS_LS_KEY = 'asp_mock_documents_v1';
function loadDocuments(){ try{ const raw = localStorage.getItem(DOCUMENTS_LS_KEY); if(raw) return JSON.parse(raw); }catch(e){} return null; }
function saveDocuments(){ try{ localStorage.setItem(DOCUMENTS_LS_KEY, JSON.stringify(DOCUMENTS)); }catch(e){} }
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
// plus per-artist payee profiles. See ~/.claude/plans/eventual-snacking-globe.md for the design.

/* ---- Payee profiles (contracting entity + payment details + defaults, per artist) ---- */
const PAYEE_PROFILES_LS_KEY = 'asp_mock_payee_profiles_v1';
let PPID = 1;
function loadPayeeProfiles(){ try{ const raw = localStorage.getItem(PAYEE_PROFILES_LS_KEY); if(raw) return JSON.parse(raw); }catch(e){} return null; }
function savePayeeProfiles(){ try{ localStorage.setItem(PAYEE_PROFILES_LS_KEY, JSON.stringify(PAYEE_PROFILES)); }catch(e){} }
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
if(!PAYEE_PROFILES){ PAYEE_PROFILES = seedPayeeProfiles(); savePayeeProfiles(); }
else { PPID = PAYEE_PROFILES.reduce((max,p)=>{ const n=parseInt(String(p.id).split('-')[1],10); return isNaN(n)?max:Math.max(max,n+1); }, PPID); }
// One-time-per-field backfill for already-stored profiles -- fills in real payment details that
// were seeded blank before the office-drive audit, and adds the artist profiles that were missing
// entirely (Moshe Tischler/Yaakov Rosenblum/Benny Friedman). Never overwrites a field someone
// already filled in or edited themselves -- only touches fields still at their blank/seed default.
function migratePayeeProfiles(){
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
function housePayeeProfile(){ return PAYEE_PROFILES.find(p=>!p.artistId) || PAYEE_PROFILES[0]; }
function defaultPayeeProfileForArtist(artistId){ return PAYEE_PROFILES.find(p=>p.artistId===artistId) || housePayeeProfile(); }

/* ---- Templates ---- */
const CONTRACT_TEMPLATES = [
  ['standard','Standard Artist Agreement'],
  ['comedian','Comedian Agreement'],
  ['multiline','Multi-Performer / Package Agreement'],
  ['creative','Creative/Video Production Agreement'],
];
function contractTemplateLabel(t){ const m = CONTRACT_TEMPLATES.find(([k])=>k===t); return m ? m[1] : t; }

/* ---- Contracts (persisted, per-lead, versioned) ---- */
const CONTRACTS_LS_KEY = 'asp_mock_contracts_v1';
const CONTRACTS_SCHEMA_VERSION = 3;
let CTID = 1;
function loadContracts(){ try{ const raw = localStorage.getItem(CONTRACTS_LS_KEY); if(raw) return JSON.parse(raw); }catch(e){} return null; }
function saveContracts(){ try{ localStorage.setItem(CONTRACTS_LS_KEY, JSON.stringify(CONTRACTS)); }catch(e){} }
// Additive-defaults migration, same convention as loadProjects() -- a versioned pass so future
// field additions never drop an already-saved contract. A v1 record (the clause-library shape
// shipped briefly this morning) has its old clauses/freeText folded into one customClauses entry
// so nothing already saved is silently dropped, then is brought up to the current v2 shape.
function migrateContract(c){
  let migrated = false;
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
function blankTravelClause(){
  return { flightsCount:0, flightsClass:'economy', hotelRooms:0, hotelNights:0, hotelTier:'standard', food:false, shabbos:false, groundTransport:false };
}
function contractStatusLabel(s){ return {draft:'Draft', sent:'Sent', signed:'Signed', void:'Void'}[s] || s; }
function contractStatusPillClass(s){ return s==='signed' ? 'pill-good' : s==='sent' ? 'pill-accent' : s==='void' ? 'pill-crit' : 'pill-neutral'; }

/* ---- Naming, math, prose ---- */
function contractPerformerName(c){
  if(c.performerArtistId){ const a = artistById(c.performerArtistId); if(a) return a.name; }
  return c.performerLabel || 'the Artist';
}
const OVERTIME_INTERVAL_LABELS = { half_hour:'half hour', '15_min':'15 minutes', hour:'hour', not_applicable:'N/A' };
function overtimeIntervalLabel(interval){ return OVERTIME_INTERVAL_LABELS[interval] || 'half hour'; }
// Standing rule confirmed with Moshe: $6,500 fee -> $650 per half hour, i.e. fee/10.
function suggestedOvertimeRate(fee){ return Math.round((Number(fee)||0) / 10); }
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
  if(c.deposit.percent){ deposit = Math.round(total * (Number(c.deposit.percent)||0) / 100); }
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
    return `Cancellation Clause: If the Client cancels, the Client agrees to pay 80% of the contracted amount, which will be credited toward a future event within ${p.creditWindowMonths||6}-${(p.creditWindowMonths||6)+2} months.`;
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
  return 'No Recording Clause. Audience members and staff are strictly prohibited from recording, photographing, or livestreaming the performance in any form without the Artist\'s express written consent. Violation of this clause may result in legal remedies.';
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
    snapshot: { clientName: ev.clientName||'', clientEmail: ev.clientEmail||'', clientPhone: ev.clientPhone||'', eventName:'', eventDate: ev.date||'', venue: ev.venue||'', city: ev.city||'', state: ev.state||'', occasion: ev.type||'' },
    performerArtistId, performerLabel:'',
    payeeProfileId: payeeProfile ? payeeProfile.id : null,
    fee: { amount: ev.price || (payeeProfile && payeeProfile.defaultFee) || 0, note:'' },
    deposit: depositPercent ? { amount:0, percent:depositPercent, nonRefundable:false }
      : depositAmount ? { amount:depositAmount, percent:0, nonRefundable:false }
      : { amount:0, percent:15, nonRefundable:false },
    overtime: { rate:0, interval: payeeProfile ? payeeProfile.defaultOvertimeInterval : 'half_hour' },
    cancellationPolicy: { type:'flat_percent', flatPercent:80, tiers:[], creditWindowMonths:6, withinDays:40, ...(payeeProfile&&payeeProfile.defaultCancellation||{}) },
    boilerplate: payeeProfile ? { ...payeeProfile.defaultBoilerplate, notBindingUntilDeposit:true } : { ...blankBoilerplateDefaults(), notBindingUntilDeposit:true },
    clientProvides: [],
    lineItems: [], addOns: [],
    customClauses: [],
    notes: '',
    hoursOfEngagement: hours,
    balanceDueTiming: 'prior',
    artistProvides: defaultArtistProvides(template, performerArtist?performerArtist.name:'the Artist', performerArtist?performerArtist.role:'Singer', hours),
    travelClause: payeeProfile && payeeProfile.defaultTravelClause ? { ...payeeProfile.defaultTravelClause } : blankTravelClause(),
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
        { id:'LI-'+Math.random().toString(36).slice(2,7), label: performerArtist?performerArtist.name:'', performerArtistId, fee: ev.price||0, date:'', overtimeRate:'', notes:'', travelClause: blankTravelClause() },
        ...ev.additionalArtists.map(x=>{
          const a = artistById(x.artistId);
          return { id:'LI-'+Math.random().toString(36).slice(2,7), label: a?a.name:x.artistId, performerArtistId: x.artistId, fee: x.feeAmount||0, date:'', overtimeRate:'', notes:'', travelClause: blankTravelClause() };
        }),
      ];
    }
  }
  CONTRACTS.unshift(contract); saveContracts();
  S.showContractBuilder = true; S.contractBuilderId = contract.id;
  render();
}
function doRefreshContractFromLead(id){
  const c = getContract(id); if(!c) return;
  const ev = getEvent(c.leadId); if(!ev){ toast('The original lead no longer exists.', 'system'); return; }
  c.snapshot = { clientName: ev.clientName||'', clientEmail: ev.clientEmail||'', clientPhone: ev.clientPhone||'', eventName: c.snapshot.eventName||'', eventDate: ev.date||'', venue: ev.venue||'', city: ev.city||'', state: ev.state||'', occasion: c.snapshot.occasion || ev.type||'' };
  if(c.template!=='multiline') c.fee.amount = ev.price||0;
  c.updatedAt = new Date().toISOString();
  saveContracts();
  toast('Refreshed from lead.', 'success');
  render();
}
function doDeleteContract(id){
  if(!confirm('Delete this contract? This can’t be undone.')) return;
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
    if(profile.defaultTravelClause) c.travelClause = { ...profile.defaultTravelClause };
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
    if(parts[1]==='amount' && !Number(c.overtime.rate) && c.overtime.interval!=='not_applicable') c.overtime.rate = suggestedOvertimeRate(value);
  }
  else if(kind==='deposit') c.deposit[parts[1]] = value;
  else if(kind==='overtime') c.overtime[parts[1]] = value;
  else if(kind==='cancellation') c.cancellationPolicy[parts[1]] = value;
  else if(kind==='tier'){ const t=c.cancellationPolicy.tiers.find(x=>x.id===parts[1]); if(t) t[parts[2]] = value; }
  else if(kind==='boilerplate') c.boilerplate[parts[1]] = value;
  else if(kind==='lineitem'){ const li=c.lineItems.find(x=>x.id===parts[1]); if(li){ li[parts[2]] = value; c.fee.amount = contractLineItemsTotal(c); if(!Number(c.overtime.rate) && c.overtime.interval!=='not_applicable') c.overtime.rate = suggestedOvertimeRate(c.fee.amount); } }
  else if(kind==='addon'){ const a=c.addOns.find(x=>x.id===parts[1]); if(a){ a[parts[2]] = value; c.fee.amount = contractLineItemsTotal(c); if(!Number(c.overtime.rate) && c.overtime.interval!=='not_applicable') c.overtime.rate = suggestedOvertimeRate(c.fee.amount); } }
  else if(kind==='customclause'){ const cc=c.customClauses.find(x=>x.id===parts[1]); if(cc) cc[parts[2]] = value; }
  else if(kind==='performerLabel') c.performerLabel = value;
  else if(kind==='notes') c.notes = value;
  else if(kind==='travel') c.travelClause[parts[1]] = value;
  else if(kind==='lineitemtravel'){ const li=c.lineItems.find(x=>x.id===parts[1]); if(li) li.travelClause[parts[2]] = value; }
  else if(kind==='barter') c.barter[parts[1]] = value;
  else if(kind==='discount') c.discount[parts[1]] = value;
  else if(kind==='creative') c.creative[parts[1]] = value;
  else if(kind==='top') c[parts[1]] = value;
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
      zelleActive: f.zelleActive!==false, zelleQrDataUrl: f.zelleQrDataUrl||null,
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
      zelleActive: f.zelleActive!==false, zelleQrDataUrl: f.zelleQrDataUrl||null,
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
  if(!supabaseClient){ toast('Sign in with your real ASP account first (not available in Demo Mode).', 'system'); return; }
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
  if(!supabaseClient){ toast('Sign in with your real ASP account first (not available in Demo Mode).', 'system'); return; }
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
async function doApproveContractForSending(id){
  const c = getContract(id); if(!c) return;
  c.approvedBy = S.user; c.approvedAt = new Date().toISOString(); c.updatedAt = c.approvedAt;
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
  c.approvedBy = null; c.approvedAt = null; c.updatedAt = new Date().toISOString();
  saveContracts(); render();
  if(supabaseClient && c._supabaseId){
    supabaseClient.from('contracts').update({ approved_by:null, approved_at:null }).eq('id', c._supabaseId)
      .then(({error})=>{ if(error) console.error('contract approval revoke sync failed', c.id, error); });
  }
}

/* ---- Send Contract (real email, via the send-contract-email Supabase Edge Function) ---- */
async function doSendContractEmail(){
  const c = getContract(S.contractBuilderId); if(!c) return;
  if(!c.approvedAt){ toast('Approve this contract for sending first — money/terms must be approved before it can go out.', 'system'); return; }
  // Capture every form value up front and use only these locals from here on -- S.sendContractForm
  // gets cleared as soon as the email step succeeds (so the confirm modal doesn't reopen stale),
  // and the QuickBooks step runs after that point. Reading S.sendContractForm.qboAmount there was
  // a real bug: it always resolved to 0 against the just-cleared form, so a requested QuickBooks
  // invoice silently never got created even when the email send reported success.
  const to = (S.sendContractForm.to||'').trim();
  const subject = (S.sendContractForm.subject||'').trim();
  const wantsInvoice = !!S.sendContractInvoice;
  const qboAmount = Number(S.sendContractForm.qboAmount)||0;
  const qboDescription = S.sendContractForm.qboDescription||'Deposit';
  if(!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)){ toast('Enter a valid recipient email.', 'system'); return; }
  if(!subject){ toast('Enter a subject.', 'system'); return; }
  if(!supabaseClient){ toast('Sign in with your real ASP account to send email (not available in Demo Mode).', 'system'); return; }
  S.sendContractBusy = true; render();
  try{
    const html = contractEmailHtml(c);
    const { data: { session } } = await supabaseClient.auth.getSession();
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session ? session.access_token : SUPABASE_PUBLISHABLE_KEY}`,
      'apikey': SUPABASE_PUBLISHABLE_KEY,
    };
    // Retry-safe: re-sending after a prior failure re-runs the email step (send-contract-email has
    // no dedupe of its own yet), but never re-runs the QuickBooks step once it already succeeded --
    // c.qboInvoiceId is the idempotency marker.
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/send-contract-email`, {
      method: 'POST', headers: authHeaders, body: JSON.stringify({ to, subject, html }),
    });
    const data = await resp.json().catch(()=>({ ok:false, error:'Unexpected response from the server.' }));
    if(!resp.ok || data.ok===false){
      toast(data.error || 'Could not send the email.', 'system');
      return;
    }
    if(c.status==='draft'){ c.status='sent'; c.updatedAt=new Date().toISOString(); saveContracts(); }
    // Immutable snapshot of exactly what was sent (contract_versions, migration 0010) -- a contract
    // can be edited after sending; this is what proves what the client actually received on a given
    // date. Local mirror (c.versions) is always written so there's an audit trail even for contracts
    // never migrated to a real Supabase row; the real Supabase insert is best-effort and only
    // possible once c._supabaseId exists -- never blocks the send itself if it fails.
    c.versions = c.versions || [];
    const versionNumber = c.versions.length + 1;
    c.versions.push({ versionNumber, snapshot: JSON.parse(JSON.stringify(c)), renderedHtml: html, sentTo: to, sentAt: new Date().toISOString() });
    saveContracts();
    if(supabaseClient && c._supabaseId && session){
      try{
        await supabaseClient.from('contract_versions').insert({
          contract_id: c._supabaseId, version_number: versionNumber, snapshot: c, rendered_html: html, sent_to: to, created_by: session.user.id,
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
          body: JSON.stringify({ clientName: c.snapshot.clientName||to, clientEmail: to, amount: qboAmount, description: qboDescription, contractId: c._supabaseId||null }),
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
  if(!supabaseClient) return { status:'skipped', detail:'Calendar holds need a real signed-in session (not available in Demo Mode).' };
  try{
    const { data: { session } } = await supabaseClient.auth.getSession();
    if(!session) return { status:'skipped', detail:'Calendar holds need a real signed-in session (not available in Demo Mode).' };
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
// session uses (linkRealSessionToRoster sets S.user = adminRow.role). Since the push-if-missing
// check there keys on that same id, a real admin's session was silently shadowed by the demo
// entry's name/email instead of showing the real signed-in person (confirmed live: a real test
// account with role admin_bookings displayed as "ASP Office — Bookings" / bookings@aspmanagement.com,
// not its own real name). Starts empty now -- every real admin's entry is populated the first
// time they actually sign in, which is the only path left now that Demo Mode is gone.
const ADMIN_USERS = [];
const isAdminUser = (id)=>ADMIN_USERS.some(u=>u.id===id);
const adminById = (id)=>ADMIN_USERS.find(u=>u.id===id);

/* ============ ORG SETTINGS (ops automation spec: "never hardcoded" integration addresses) ============ */
// ASP-wide (not per-user) config that isn't tied to any one integration's own table -- currently
// just Rivky's real travel-booking email. Kept in its own tiny collection rather than folding into
// per-user getUserSettings() since this is an office-wide fact, not a personal preference.
const ORG_SETTINGS_LS_KEY = 'asp_mock_org_settings_v1';
function loadOrgSettings(){ try{ const raw = localStorage.getItem(ORG_SETTINGS_LS_KEY); if(raw) return JSON.parse(raw); }catch(e){} return null; }
function saveOrgSettings(){ try{ localStorage.setItem(ORG_SETTINGS_LS_KEY, JSON.stringify(ORG_SETTINGS)); }catch(e){} }
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
function saveTravelRequests(){ try{ localStorage.setItem(TRAVEL_REQUESTS_LS_KEY, JSON.stringify(TRAVEL_REQUESTS)); }catch(e){} }
let TRAVEL_REQUESTS = loadTravelRequests();
if(!TRAVEL_REQUESTS) TRAVEL_REQUESTS = [];
TRVID = TRAVEL_REQUESTS.reduce((m,t)=>Math.max(m, Number((t.id||'TRV-0').split('-')[1])||0), 0) + 1;
function getTravelRequest(id){ return TRAVEL_REQUESTS.find(t=>t.id===id); }
function travelRequestsForEvent(eventId){ return TRAVEL_REQUESTS.filter(t=>t.eventId===eventId); }
function travelRequestStatusLabel(s){ return {draft:'Draft', sent:'Sent to Rivky', awaiting_reply:'Awaiting Reply', answered:'Answered', completed:'Completed'}[s] || s; }
function doCreateTravelRequest(eventId){
  const ev = getEvent(eventId); if(!ev) return;
  const artist = artistById(ev.artistId);
  const tr = {
    id:'TRV-'+(TRVID++), eventId, status:'draft', createdAt:new Date().toISOString(),
    details: {
      passengers: artist? artist.name : '', eventDate: ev.date||'', eventTime: ev.time||'', eventTimezone: 'America/New_York',
      venue: ev.venue||'', city: ev.city||'', state: ev.state||'',
      origin:'', destination:'', arriveBy:'', departAfter:'',
      flightClass:'economy', flightQty:1,
      hotelNeeded: !!ev.flightNeeded, hotelPrefs:'',
      groundTransportNeeded: !!ev.groundTransportNeeded, groundTransportNotes:'',
      notes:'',
    },
    sentAt:null, gmailThreadId:null, gmailMessageId:null, followUpAt:null, owner: S.user,
    flightSegments: [],
  };
  TRAVEL_REQUESTS.unshift(tr); saveTravelRequests();
  S.showTravelRequestDetail=true; S.travelRequestDetailId=tr.id;
  render();
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
async function doCheckFlightStatus(trId, segId){
  const tr = getTravelRequest(trId); if(!tr) return;
  const seg = (tr.flightSegments||[]).find(s=>s.id===segId); if(!seg) return;
  if(!seg.airline || !seg.flightNumber){ toast('Enter the airline and flight number first.', 'system'); return; }
  if(!supabaseClient){ toast('Sign in with your real ASP account to check flight status (not available in Demo Mode).', 'system'); return; }
  S.flightStatusBusy = segId; render();
  try{
    const { data: { session } } = await supabaseClient.auth.getSession();
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/flightaware-status`, {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'Authorization': `Bearer ${session ? session.access_token : SUPABASE_PUBLISHABLE_KEY}`, 'apikey': SUPABASE_PUBLISHABLE_KEY },
      body: JSON.stringify({ ident: `${seg.airline}${seg.flightNumber}` }),
    });
    const data = await resp.json().catch(()=>({ok:false, error:'Unexpected response from the server.'}));
    if(!resp.ok || data.ok===false){ toast(data.error || 'Could not check flight status.', 'system'); return; }
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
    <div class="wordmark">${esc(brand.label||'ASP')} — Travel Request</div>
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
  const profile = zelleProfileForEvent(ev, artist);
  const usingRealQr = !!(profile && profile.zelleQrDataUrl);
  const label = (profile && (profile.zelleRecipientLabel || profile.zelle)) || artist.email;
  return `<div style="text-align:center;padding:16px;background:#F5F4EF;border-radius:10px;margin:16px 0;">
    <img src="${usingRealQr? profile.zelleQrDataUrl : zelleQrUrl(ev,artist,profile)}" alt="Zelle QR code" width="180" height="180" style="border-radius:8px;background:#fff;padding:8px;"/>
    <div style="font-size:11.5px;color:#67676D;margin-top:8px;">${esc(label)}</div>
    ${profile && profile.zelleInstructions? `<div style="font-size:11px;color:#9A9AA1;margin-top:4px;">${esc(profile.zelleInstructions)}</div>` : ''}
  </div>`;
}
// Client-facing notice emails (booking confirmation + balance reminder, ops automation spec item
// 5): same branded wrapper as travelRequestEmailHtml, parameterized by the one paragraph that
// actually differs between the two.
function clientNoticeEmailHtml(ev, artist, introHtml){
  const brand = getBrandConfig('asp');
  const balance = zelleBalance(ev);
  return `<!doctype html><html><head><meta charset="utf-8"/><style>
    body{ margin:0; padding:24px; background:#F5F4EF; font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif; color:#17171A; }
    .doc{ max-width:560px; margin:0 auto; background:#fff; padding:28px; border-radius:10px; }
    .wordmark{ font-size:1.1rem; font-weight:700; border-bottom:2px solid #17171A; padding-bottom:14px; margin-bottom:18px; }
    .doc-foot{ margin-top:22px; padding-top:12px; border-top:1px solid #E1E1E6; font-size:10.5px; color:#9A9AA1; }
  </style></head><body><div class="doc">
    <div class="wordmark">${esc(brand.label||'ASP')}</div>
    ${introHtml}
    ${hasLocation(ev)? `<p style="margin:0 0 8px;font-size:13px;">Venue: ${esc(fullLocation(ev))} — <a href="${gmapsUrl(ev)}" target="_blank" rel="noopener" style="color:#4C6FA5;">Open in Maps</a></p>` : ''}
    ${isStandardPayment(ev)? zelleQrEmailBlock(ev, artist) : ''}
    <div class="doc-foot">Sent from ${esc(brand.label||'ASP')}. Remaining balance: ${money(balance)}.</div>
  </div></body></html>`;
}
async function sendClientNoticeEmail(ev, subject, html){
  if(!supabaseClient) return { ok:false, error:'Sign in with your real ASP account to send email (not available in Demo Mode).' };
  // Guard on a real SESSION, not just supabaseClient (which always exists, Demo Mode included) --
  // without this, Demo Mode fires a real network request that fails at the connection level and
  // logs a browser-level console error regardless of this function's own try/catch, exactly the
  // loadBrandConfig() bug fixed earlier this project (see the memory note on that lesson).
  const { data: { session } } = await supabaseClient.auth.getSession();
  if(!session) return { ok:false, error:'Sign in with your real ASP account to send email (not available in Demo Mode).' };
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/send-contract-email`, {
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'Authorization': `Bearer ${session.access_token}`, 'apikey': SUPABASE_PUBLISHABLE_KEY },
    body: JSON.stringify({ to: ev.clientEmail, subject, html }),
  });
  const data = await resp.json().catch(()=>({ok:false, error:'Unexpected response from the server.'}));
  if(!resp.ok || data.ok===false) return { ok:false, error: data.error || 'Could not send the email.' };
  return { ok:true };
}
// Fires automatically right after a deposit is marked received (doMarkDeposit) -- "after verified
// payment... send an ASP-branded confirmation with balance + QR for the correct payee" (item 5).
// Also reachable manually via a Resend button on the preview, per "manual resend + audit log."
async function doSendBookingConfirmationEmail(id){
  const ev = getEvent(id); if(!ev) return;
  const artist = artistById(ev.artistId);
  const balance = zelleBalance(ev);
  const subject = `You're booked! — ${artist.name}, ${fmtDateShort(ev.date)}`;
  const intro = `<p style="margin:0 0 8px;">Hi ${esc((ev.clientName||'').split(' ')[0])},</p>
    <p style="margin:0 0 8px;">You're all set — ${esc(artist.name)} is booked for your ${esc(ev.type)} on ${esc(fmtDate(ev.date))} at ${esc(fmtTime(ev.time))}.</p>
    <p style="margin:0 0 8px;">Remaining balance of ${money(balance)} is due before the event${isStandardPayment(ev)? ' via Zelle — scan the code below or send directly to '+esc(artist.email) : ` (${esc(paymentMethodLabel(ev))})`}.</p>`;
  const html = clientNoticeEmailHtml(ev, artist, intro);
  S.bookingConfirmationBusy = true; render();
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
  const balance = zelleBalance(ev);
  const subject = `Balance reminder — ${artist.name}, ${fmtDateShort(ev.date)}`;
  const intro = `<p style="margin:0 0 8px;">Hi ${esc((ev.clientName||'').split(' ')[0])},</p>
    <p style="margin:0 0 8px;">Just a reminder — the remaining balance of ${money(balance)} for ${esc(artist.name)}'s ${esc(ev.type)} on ${esc(fmtDate(ev.date))} is due${isStandardPayment(ev)? ' via Zelle. Scan the code below or send to '+esc(artist.email) : ` (${esc(paymentMethodLabel(ev))})`}.</p>`;
  const html = clientNoticeEmailHtml(ev, artist, intro);
  S.reminderBusy = true; render();
  const result = await sendClientNoticeEmail(ev, subject, html);
  S.reminderBusy = false;
  if(result.ok){
    logEvent(ev,'email',`Balance reminder emailed to ${ev.clientEmail}.`);
    if(reportEventSave(updateEvent(id, { lastReminderSent: fmtISO(new Date()) }), 'sending the reminder')) toast('Reminder sent.', 'success');
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
  if(!supabaseClient){ toast('Sign in with your real ASP account to send email (not available in Demo Mode).', 'system'); return; }
  S.travelRequestBusy = true; render();
  try{
    const ev = getEvent(tr.eventId);
    const html = travelRequestEmailHtml(tr);
    const subject = `Travel Request — ${ev? (artistById(ev.artistId)||{}).name||'' : ''}${tr.details.eventDate? ` (${fmtDateShort(tr.details.eventDate)})`:''}`;
    const { data: { session } } = await supabaseClient.auth.getSession();
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/send-contract-email`, {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'Authorization': `Bearer ${session ? session.access_token : SUPABASE_PUBLISHABLE_KEY}`, 'apikey': SUPABASE_PUBLISHABLE_KEY },
      body: JSON.stringify({ to: ORG_SETTINGS.rivkyEmail, subject, html }),
    });
    const data = await resp.json().catch(()=>({ok:false, error:'Unexpected response from the server.'}));
    if(!resp.ok || data.ok===false){ toast(data.error || 'Could not send the travel request.', 'system'); return; }
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
const OVERTIME_MULTIPLIER = 1.5; // time-and-a-half, prorated to the minute past included hours
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
function savePricing(){ try{ localStorage.setItem(PRICING_LS_KEY, JSON.stringify(PRICING)); }catch(e){} }
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
  if(f.time && p.includedHours) f.endTime = addMinutesToTime(f.time, Math.round(p.includedHours*60));
}
function setPricing(artistId, type, patch){
  PRICING[artistId] = PRICING[artistId] || {};
  PRICING[artistId][type] = Object.assign({hourlyRate:0,includedHours:2}, PRICING[artistId][type], patch);
  savePricing();
}
const CHARGE_PRESETS = ['Travel','Flights','Hotel & Lodging','Sound & Production Rider','Musicians & Band','Other'];

function addDays(base, days){ const d=new Date(base); d.setDate(d.getDate()+days); return d; }
function fmtISO(d){ return d.toISOString().slice(0,10); }
function money(n){ return '$'+Math.round(n).toLocaleString('en-US'); }
function chargesTotal(ev){ return (ev.charges||[]).reduce((s,c)=>s+c.amount,0); }
// Navigation/data-layer refactor (PR 12): ev.balance used to be a stored field, set once at
// creation and only recomputed inside the edit-event save handler -- every other balance/payout
// read across financials/dashboard/CSV-export consumed that possibly-stale stored value directly,
// which is exactly how the Financials page's "All Jobs" table came to silently disagree with its
// own "Artist Payouts" table (and "payouts" vs. "owedTotal" a few lines apart on the very same
// page) whenever an event had post-signing charges. eventBalance() replaces the stored field with
// a pure derivation (the same formula the edit-handler already used) -- there is nothing left to
// go stale. zelleBalance(), the one place that already got this right, now composes on top of it.
function eventBalance(ev){ return (ev.price||0) - (ev.commission||0); }

let EVID = 1000;

// Gig list (2026-10-07): the 215 calendar-imported gigs were removed at Moshe's request, to be
// replaced by a fresh upcoming-gigs import. This is the seed for a fresh browser (seedAll()).
const REAL_IMPORTED_EVENTS = [];

function seedAll(){
  return JSON.parse(JSON.stringify(REAL_IMPORTED_EVENTS));
}

/* ============ SUPABASE (real backend, not yet used for data -- auth only so far) ============ */
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
function qboAuthorizeUrl(){
  const state = Math.random().toString(36).slice(2);
  return `https://appcenter.intuit.com/connect/oauth2?client_id=${encodeURIComponent(QBO_CLIENT_ID)}&scope=com.intuit.quickbooks.accounting&redirect_uri=${encodeURIComponent(QBO_REDIRECT_URI)}&response_type=code&state=${state}`;
}

// Google Calendar HOLD/CONFIRMED sync (ops automation spec item 4). Same "client ID is not secret,
// Connect button stays disabled until it's set" reasoning as QBO_CLIENT_ID above. See
// ops/GOOGLE_CALENDAR_SETUP.md for the full setup once it exists.
const GOOGLE_CALENDAR_CLIENT_ID = '';
const GOOGLE_CALENDAR_REDIRECT_URI = SUPABASE_URL + '/functions/v1/gcal-oauth-callback';
function gcalAuthorizeUrl(){
  const state = Math.random().toString(36).slice(2);
  const scope = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email';
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(GOOGLE_CALENDAR_CLIENT_ID)}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(GOOGLE_CALENDAR_REDIRECT_URI)}&response_type=code&access_type=offline&prompt=consent&state=${state}`;
}

// Gmail mailbox connections (ops automation spec item 6: Zelle matching from artist mailboxes).
// Unlike QBO/Google Calendar (one ASP-wide account), each mailbox here is authorized by its own
// owner -- state carries WHICH gmail_mailboxes row this consent is for (see gmail-oauth-callback).
// Narrowest read-only scope, per "narrowest scope" in the spec.
const GMAIL_CLIENT_ID = '';
const GMAIL_REDIRECT_URI = SUPABASE_URL + '/functions/v1/gmail-oauth-callback';
function gmailAuthorizeUrl(mailboxId){
  const scope = 'https://www.googleapis.com/auth/gmail.readonly';
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(GMAIL_CLIENT_ID)}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(GMAIL_REDIRECT_URI)}&response_type=code&access_type=offline&prompt=consent&state=${encodeURIComponent(mailboxId)}`;
}

/* ============ STATE ============ */
const LS_KEY='asp_mock_state_v3'; // v3: gig list cleared 2026-10-07 -- bumping makes every browser drop its cached copy and reseed
let S = {
  user: null, // 'admin' or artist id
  view: 'dashboard',
  eventId: null,
  realSession: null, // {supabaseUserId, email} once someone signs in for real (not Demo Mode)
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
  contractDocEventId:null,
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
  showContract:false,
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
  try{ localStorage.setItem(LS_KEY, JSON.stringify(S.events)); return { ok:true }; }
  catch(e){
    // Was a silent catch(e){} before -- a full browser storage quota or private-mode block would
    // lose the user's last change with zero feedback. Surface it instead of failing quietly.
    console.error('saveEvents failed', e);
    toast('Could not save — your browser storage may be full or unavailable. Your latest change was NOT saved.', 'system');
    return { ok:false, error:e };
  }
}
S.events = loadEvents();
EVID = S.events.reduce((max,e)=>{ const n=parseInt(String(e.id).split('-')[1],10); return isNaN(n)? max : Math.max(max,n+1); }, EVID);

/* ============ REAL AUTH (Supabase) ============ */
// Separate from Demo Mode entirely: a real session never touches ARTISTS/ADMIN_USERS
// mock data except to add exactly the one matching row for whoever just signed in, so the
// rest of the app's isAdminUser()/artistById()/adminById() logic works completely unchanged.
async function linkRealSessionToRoster(session){
  S.realSession = { supabaseUserId: session.user.id, email: session.user.email };
  const [{data: adminRow}, {data: artistRow}] = await Promise.all([
    supabaseClient.from('admin_users').select('*').eq('user_id', session.user.id).maybeSingle(),
    supabaseClient.from('artists').select('*').eq('user_id', session.user.id).maybeSingle(),
  ]);
  const row = adminRow || artistRow;
  if(!row){
    S.realSignInNotFound = true;
    S.showRealSignIn = false; S.realSignInSent = false;
    render();
    return;
  }
  if(adminRow){
    // The app's admin logic checks S.user against literal role slugs ('admin_ceo' etc.)
    // throughout (isCEO, CEO_HIDDEN_NAV_VIEWS) -- use the DB row's role as the in-memory id so
    // those checks work unchanged for a real login, same as they already do in Demo Mode. The
    // row's own uuid (its real Postgres identity) is kept as dbId for anything that needs it.
    //
    // Navigation/data-layer refactor (PR 18): ADMIN_USERS now starts empty (no more hardcoded
    // Demo Mode entries shadowing real ones by role-id collision -- see its own declaration
    // comment). That means an office-wide picker like the project assignee dropdown would show
    // NOBODY until every admin has personally signed in at least once, which is a real, awkward
    // gap -- so pull the full office roster here (same shape loadRealRoster() already uses for
    // the Users Dashboard), not just this one signed-in person's row.
    const { data: allAdmins } = await supabaseClient.from('admin_users').select('*').order('created_at');
    (allAdmins||[adminRow]).forEach(row=>{
      const existing = ADMIN_USERS.find(u=>u.id===row.role);
      if(existing) Object.assign(existing, {name:row.name, email:row.email, initials:row.initials, dbId:row.id});
      else ADMIN_USERS.push({id:row.role, name:row.name, email:row.email, initials:row.initials, dbId:row.id});
    });
    S.user = adminRow.role;
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
  S.view = adminRow ? 'dashboard' : 'a_dashboard';
  S.showRealSignIn = false; S.realSignInSent = false; S.realSignInNotFound = false;
  S.realPasskeys = null;
  pendingViewTransition = true;
  pendingViewDirection = 'right';
  syncURL();
  render();
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
async function doRealSignInPasskey(){
  try{
    const { error } = await supabaseClient.auth.signInWithPasskey();
    if(error){ toast('Passkey sign-in failed: ' + error.message, 'system'); }
    // On success, onAuthStateChange's SIGNED_IN handler takes over from here.
  }catch(e){
    toast('Passkey sign-in was cancelled or is not available on this device.', 'system');
  }
}
async function doRealSignOut(){
  if(supabaseClient) await supabaseClient.auth.signOut();
  S.realSession = null; S.realSignInNotFound = false; S.user = null; S.realPasskeys = null;
  render();
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
  const { error } = await supabaseClient.auth.passkey.delete({ id });
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
function doEditRealUser(){
  const f = S.editRealUserForm;
  const name = (f.name||'').trim();
  const email = (f.email||'').trim().toLowerCase();
  if(!name || !email){ toast('Enter a name and email.', 'system'); return; }
  const parts = name.split(/\s+/);
  const initials = (parts[0][0] + (parts[1]? parts[1][0] : '')).toUpperCase();
  const table = f.kind==='admin' ? 'admin_users' : 'artists';
  const patch = f.kind==='admin'
    ? { name, email, initials, role: f.adminRole }
    : { name, email, initials, role: f.artistRole };
  supabaseClient.from(table).update(patch).eq('id', f.id).then(({error})=>{
    if(error){ toast('Could not save that account: ' + error.message, 'system'); return; }
    toast(`${name} updated.`, 'success');
    S.showEditRealUser = false; S.editRealUserForm = {};
    loadRealRoster();
  });
}
if(supabaseClient){
  supabaseClient.auth.onAuthStateChange((event, session)=>{
    if((event==='SIGNED_IN' || event==='INITIAL_SESSION') && session && !S.user) linkRealSessionToRoster(session);
    if(event==='SIGNED_OUT'){ S.realSession = null; S.realPasskeys = null; }
  });
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
  const artistId = target==='asp_main' ? null : target;
  const label = artistId ? (artistById(artistId)||{}).name || target : 'ASP Main Calendar';
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
  if(!supabaseClient){ toast('Sign in with your real ASP account (not available in Demo Mode).', 'system'); return; }
  const f = S.newGmailMailboxForm||{};
  const email = (f.email||'').trim();
  if(!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ toast('Enter a valid mailbox email.', 'system'); return; }
  const { error } = await supabaseClient.from('gmail_mailboxes').insert({
    mailbox_type: f.mailboxType||'artist_payment', artist_id: f.artistId||null, email,
  });
  if(error){ toast('Could not add mailbox: ' + error.message, 'system'); return; }
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
refreshQboStatus();
refreshGcalStatus();
loadBrandConfig();

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
function saveAllSettings(){ try{ localStorage.setItem(SETTINGS_LS_KEY, JSON.stringify(ALL_SETTINGS)); }catch(e){} }
function defaultUserSettings(){
  return {
    passkeys: [{id:'pk-'+randInt(1,999999), label:'This device', addedAt: fmtISO(new Date())}],
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
  if(!ALL_SETTINGS[userId]) ALL_SETTINGS[userId] = defaultUserSettings();
  const st = ALL_SETTINGS[userId];
  Object.keys(st.notify).forEach(k=>{ if(typeof st.notify[k]==='boolean') st.notify[k] = {inApp: st.notify[k], email:false}; });
  NOTIFY_ITEMS.forEach(([key])=>{ if(!st.notify[key]) st.notify[key] = {inApp:false, email:false}; });
  return st;
}

/* ============ HELPERS ============ */
function esc(s){ return String(s??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
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
  const ev = getEvent(id);
  if(!ev) return { ok:false, error:'not_found' };
  if(!opts.force){
    let persisted = null;
    try{ const raw = localStorage.getItem(LS_KEY); if(raw) persisted = JSON.parse(raw).find(e=>e.id===id); }catch(e){}
    if(persisted && persisted.updatedAt && persisted.updatedAt !== (ev.updatedAt||null)){
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
  toast(result.error==='conflict' ? `This gig changed elsewhere since you loaded it — reload before ${actionLabel}.` : 'Could not save.', 'system');
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
function hasLocation(ev){ return !!(ev.venue || ev.city || ev.state); }
function gmapsUrl(ev){ return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullLocation(ev))}`; }
function wazeUrl(ev){ return `https://waze.com/ul?q=${encodeURIComponent(fullLocation(ev))}&navigate=yes`; }
const US_STATES = new Set(['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC']);
function isInternational(ev){ const s=(ev.state||'').trim().toUpperCase(); return s.length>0 && !US_STATES.has(s); }
function eventTravelDates(ev){
  const dates = new Set([ev.date]);
  if(ev.flight){
    if(ev.flight.depart) dates.add(ev.flight.depart.slice(0,10));
    if(ev.flight.arrive) dates.add(ev.flight.arrive.slice(0,10));
  }
  return dates;
}
function findConflicts(ev){
  const myDates = eventTravelDates(ev);
  return S.events.filter(e=>{
    if(e.id===ev.id || e.artistId!==ev.artistId) return false;
    const otherDates = eventTravelDates(e);
    for(const d of myDates) if(otherDates.has(d)) return true;
    return false;
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
function logEvent(ev, type, text){ ev.log.push({ts:new Date().toISOString(), type, text}); }

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
  S.dayListDate=null; S.showNewProject=false; S.showFlightForm=false; S.showContract=false; S.contractDocEventId=null;
  S.showTransportForm=false; S.showItinerary=false; S.itineraryEventId=null; S.showBlockTime=false; S.showAskAI=false; S.showDressCodeForm=false;
  S.showEditEvent=false;
  S.showGigInfoForm=false; S.gigInfoForm={}; S.newGigContactForm={}; S.showGigInfoDoc=false; S.gigInfoDocEventId=null;
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
function gcalUrl(ev){
  const artist = artistById(ev.artistId);
  const start = ev.date.replace(/-/g,'')+'T'+ev.time.replace(':','')+'00';
  const endDate = ev.endTime ? new Date(ev.date+'T'+ev.endTime+':00') : new Date(ev.date+'T'+ev.time+':00');
  if(!ev.endTime) endDate.setHours(endDate.getHours()+3);
  const end = endDate.toISOString().slice(0,19).replace(/[-:]/g,'').replace('T','T');
  const details = `${ev.type} for ${artist.name}.${ev.clientName ? ` Client: ${ev.clientName}.` : ''} Booked via ASP.`;
  const params = new URLSearchParams({action:'TEMPLATE', text:`${artist.name} — ${ev.type}`, dates:`${start}/${end}`, details, location:fullLocation(ev)});
  return 'https://calendar.google.com/calendar/render?'+params.toString();
}
function downloadIcs(ev){
  const artist = artistById(ev.artistId);
  const start = ev.date.replace(/-/g,'')+'T'+ev.time.replace(':','')+'00';
  const endDate = ev.endTime ? new Date(ev.date+'T'+ev.endTime+':00') : new Date(ev.date+'T'+ev.time+':00');
  if(!ev.endTime) endDate.setHours(endDate.getHours()+3);
  const end = endDate.toISOString().slice(0,19).replace(/[-:]/g,'');
  const ics = ['BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT',`UID:${ev.id}@asp-bookings`,`DTSTART:${start}`,`DTEND:${end}`,`SUMMARY:${artist.name} — ${ev.type}`,`LOCATION:${fullLocation(ev)}`,`DESCRIPTION:${ev.clientName ? `Client ${ev.clientName}. ` : ''}Booked via ASP.`,'END:VEVENT','END:VCALENDAR'].join('\r\n');
  const blob = new Blob([ics], {type:'text/calendar'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${artist.name.replace(/\s/g,'_')}_${ev.date}.ics`; a.click();
}

function exportCSV(){
  const filt = S.finArtistFilter==='all' ? S.events : S.events.filter(e=>e.artistId===S.finArtistFilter);
  const rows = filt.filter(e=>['booked','paid'].includes(e.status));
  const cols = ['Artist','Client','Date','Type','Venue','City','State','Price','Charges','Commission','Payout','Status'];
  const csvEsc = (v)=>{ const s=String(v??''); return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; };
  const lines = [cols.join(',')];
  rows.sort((a,b)=>a.date.localeCompare(b.date)).forEach(e=>{
    const a = artistById(e.artistId); const sm = statusMeta(e);
    lines.push([a.name, e.clientName, e.date, e.type, e.venue, e.city, e.state, e.price, chargesTotal(e), e.commission, zelleBalance(e), sm.label].map(csvEsc).join(','));
  });
  const blob = new Blob([lines.join('\r\n')], {type:'text/csv'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `asp-bookings-${S.finArtistFilter}-${fmtISO(new Date())}.csv`; a.click();
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
function render(){
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
        ${isAdmin ? '' : renderArtistTopTabs()}
        <div class="topbar">
          <div style="display:flex;align-items:center;gap:6px;min-width:0;overflow:hidden;">
            <button class="icon-btn hamburger-btn" data-action="open-mobile-menu" title="Menu">${ICO.menu}</button>
            <h1 style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${pageTitle()}</h1>
          </div>
          <div style="display:flex;align-items:center;gap:10px;flex:none;">
            <button class="btn askai-btn" data-action="open-ask-ai" title="Ask AI" style="background:var(--accent-wash);color:var(--accent-ink);border-color:transparent;">${ICO.sparkle}<span class="btn-label">Ask AI</span></button>
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
    ${S.eventId ? renderEventSheet(getEvent(S.eventId)) : ''}
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
  const a = artistById(e.artistId); const sm = statusMeta(e);
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
    <span class="avatar" data-slot="${a.slot}" style="width:32px;height:32px;font-size:11px;">${a.initials}</span>
    <span style="flex:1;min-width:0;"><strong>${primary}</strong><span class="chooser-email">${secondary}</span></span>
    <span class="pill ${sm.cls}">${sm.label}</span>
  </button>`;
}
function renderDayList(){
  const iso = S.dayListDate;
  const isAdmin = isAdminUser(S.user);
  const evs = S.events.filter(e=>e.date===iso && (isAdmin || e.artistId===S.user)).sort((a,b)=>a.time.localeCompare(b.time));
  return `<div class="overlay center" data-action="dayoverlay-close">
    <div class="modal" data-stop style="width:400px;">
      <div class="sheet-head"><h2 style="font-size:1.1rem;">${fmtDate(iso)}</h2><button class="icon-btn" data-action="close-daylist">${ICO.x}</button></div>
      <div class="sheet-body" style="padding-top:8px;gap:2px;">
        ${evs.length? evs.map(e=>renderDayEventRow(e, isAdmin, 'open-event-from-day')).join('') : `<p style="color:var(--ink-3);font-size:13px;margin:0;">Nothing on this date.</p>`}
      </div>
    </div>
  </div>`;
}

function pageTitle(){
  if(S.showNewLead) return (S.newLeadForm.kind==='internal') ? 'New Internal Day' : 'New Lead';
  if(S.eventId){ const ev=getEvent(S.eventId); return ev ? artistById(ev.artistId).name : ''; }
  if(S.view==='project_detail'){ const p=getProject(S.projectId); return p ? p.title : 'Project'; }
  const t = {
    dashboard:'Dashboard', calendar:'Calendar', leads:'Open Leads', artists:'Artists', financials:'Financials', projects:'Projects', pricing:'Pricing',
    travel:'Travel', international:'International Opportunities', daily_digest:'Daily Digest', messages:'Messages', outside_bookings:'External Events', documents:'Documents', contracts:'Contracts',
    artist_detail: artistById(S.artistDetailId)?.name || '',
    a_dashboard:'My Dashboard', a_calendar:'Calendar', a_gigs:'My Gigs', a_travel:'Travel', a_financials:'Financials', a_projects:'My Projects', settings:'Settings',
  };
  return t[S.view] || 'ASP Bookings';
}

function renderUserChip(){
  if(isAdminUser(S.user)){
    const u = adminById(S.user);
    return `<div class="user-chip"><span class="avatar" data-slot="0" style="background:var(--ink);color:var(--page);width:22px;height:22px;font-size:10px;">${u.initials}</span> <span class="chip-name">${esc(u.name)}</span>
      <button class="icon-btn" data-action="logout" title="Switch user">${ICO.logout}</button></div>`;
  }
  const a = artistById(S.user);
  return `<div class="user-chip"><span class="avatar" data-slot="${a.slot}" style="width:22px;height:22px;font-size:10px;">${a.initials}</span> <span class="chip-name">${esc(a.name)}</span>
    <button class="icon-btn" data-action="logout" title="Switch user">${ICO.logout}</button></div>`;
}

const MGMT_NAV_ITEMS = [
  ['dashboard','Dashboard',ICO.dash], ['calendar','Calendar',ICO.cal], ['leads','Leads',ICO.leads],
  ['artists','Artists',ICO.artists], ['travel','Travel',ICO.suitcase], ['projects','Projects',ICO.kanban], ['pricing','Pricing',ICO.tag], ['financials','Financials',ICO.money],
  ['outside_bookings','External Events',ICO.leads],
  ['documents','Documents',ICO.leads],
  ['contracts','Contracts',ICO.leads],
  ['contract_builder','Contract Builder',ICO.edit],
  ['messages','Messages',ICO.sms],
];
// Outside Bookings, Documents, and Contract Builder are office/bookkeeping work, not something
// Ilan (CEO) needs on his simplified view — hide those nav items for that login only.
const CEO_HIDDEN_NAV_VIEWS = ['outside_bookings','documents','contract_builder'];
function mgmtNavItemsFor(userId){
  return MGMT_NAV_ITEMS.filter(([v])=> !(CEO_HIDDEN_NAV_VIEWS.includes(v) && userId==='admin_ceo'));
}
/* ============ "NEW SINCE YOU LAST LOOKED" BADGES ============ */
// Per-section last-visited date (YYYY-MM-DD), persisted so the badge survives a reload.
// A key with no stored date is seeded to today on first load, rather than treating all
// existing history as "new" the moment this feature ships.
const LAST_SEEN_LS_KEY = 'asp_mock_lastseen_v1';
function loadLastSeen(){ try{ const raw = localStorage.getItem(LAST_SEEN_LS_KEY); if(raw) return JSON.parse(raw); }catch(e){} return null; }
function saveLastSeen(){ try{ localStorage.setItem(LAST_SEEN_LS_KEY, JSON.stringify(LAST_SEEN)); }catch(e){} }
let LAST_SEEN = loadLastSeen() || {};
['leads','financials','messages'].forEach(k=>{ if(!LAST_SEEN[k]) LAST_SEEN[k] = fmtISO(new Date()); });
saveLastSeen();
function markSeen(key){ if(LAST_SEEN[key]===undefined) return; LAST_SEEN[key] = fmtISO(new Date()); saveLastSeen(); }
function newLeadsCount(){
  const since = LAST_SEEN.leads;
  return S.events.filter(e=>['lead','negotiating','contract_sent'].includes(e.status) && e.createdAt && e.createdAt>since).length;
}
function newPaymentsCount(){
  const since = LAST_SEEN.financials;
  return S.events.filter(e=>(e.depositReceivedDate && e.depositReceivedDate>since) || (e.balanceReceivedDate && e.balanceReceivedDate>since)).length;
}
function newMessagesCount(){ return 0; } // WhatsApp isn't connected yet -- nothing to count.
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
const ARTIST_NAV_ITEMS = [
  ['a_dashboard','Dashboard',ICO.dash], ['a_calendar','Calendar',ICO.cal], ['a_gigs','My Gigs',MIC_PHOTO_ICON], ['a_travel','Travel',ICO.suitcase], ['a_financials','Financials',ICO.money], ['a_projects','Projects',ICO.kanban],
];
const APP_VERSION = 'v1.1.0'; // v1.1.0: ASP workspace extracted into its own module (parent-app Phase 1a)
const OVERTIME_PER_HALF_HOUR = 250;
function navOrderIndex(v){
  const list = (MGMT_NAV_ITEMS.some(([x])=>x===v) ? MGMT_NAV_ITEMS : ARTIST_NAV_ITEMS);
  return list.findIndex(([x])=>x===v);
}
function isNavActive(v){ return S.view===v || (v==='artists' && S.view==='artist_detail') || ((v==='projects'||v==='a_projects') && S.view==='project_detail'); }

function renderRail(){
  return `<div class="rail">
    <div class="wordmark"><span class="mark"><i></i><i></i><i></i><i></i><i></i></span>ASP</div>
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
    <div class="wordmark"><span class="mark"><i></i><i></i><i></i><i></i><i></i></span>ASP</div>
    <button class="icon-btn artist-settings-btn" data-action="nav" data-view="settings" title="Settings">${ICO.settings}</button>
  </div>
  <div style="padding:0 28px;">
    <div class="tabbar">
      ${ARTIST_NAV_ITEMS.map(([v,l])=>`<a href="#" class="tab ${isNavActive(v)?'active':''}" data-action="nav" data-view="${v}">${l}</a>`).join('')}
    </div>
  </div>
  </div>`;
}
function renderBottomNav(isAdmin){
  const items = isAdmin ? MGMT_NAV_ITEMS : ARTIST_NAV_ITEMS;
  return `<div class="bottom-nav">
    ${items.map(([v,l,ic])=>`<a href="#" class="bn-item ${isNavActive(v)?'active':''}" data-action="nav" data-view="${v}"><span class="nav-icon-wrap">${ic}${navBadge(v)}</span><span>${l}</span></a>`).join('')}
  </div>`;
}
function renderMobileMenu(isAdmin){
  const who = isAdmin ? adminById(S.user) : artistById(S.user);
  return `<div class="overlay left" data-action="mobilemenu-close">
    <div class="mobile-menu-panel" data-stop>
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div class="wordmark"><span class="mark"><i></i><i></i><i></i><i></i><i></i></span>ASP</div>
        <button class="icon-btn" data-action="close-mobile-menu">${ICO.x}</button>
      </div>
      <div class="rail-nav">
        ${(isAdmin ? mgmtNavItemsFor(S.user) : ARTIST_NAV_ITEMS).map(([v,l,ic])=>`<a href="#" class="rail-link ${isNavActive(v)?'active':''}" data-action="nav" data-view="${v}"><span class="nav-icon-wrap">${ic}${navBadge(v)}</span>${l}</a>`).join('')}
        <a href="#" class="rail-link ${isNavActive('settings')?'active':''}" data-action="nav" data-view="settings">${ICO.settings}Settings</a>
      </div>
      <div class="rail-foot">
        <div style="display:flex;align-items:center;gap:10px;padding:4px 10px 12px;">
          <span class="avatar" data-slot="${isAdmin?'0':who.slot}" style="width:32px;height:32px;font-size:11px;${isAdmin?'background:var(--ink);color:var(--page);':''}">${who.initials}</span>
          <span style="font-size:13px;font-weight:600;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(who.name)}</span>
        </div>
        <a href="#" class="rail-link" data-action="logout" style="color:var(--crit);">${ICO.logout} Log Out</a>
        <div style="padding:10px 10px 0;font-size:11px;color:var(--ink-3);">${APP_VERSION}</div>
      </div>
    </div>
  </div>`;
}

function renderView(){
  if(S.view==='settings') return renderSettingsPage();
  if(S.view==='project_detail') return renderProjectDetail();
  if(isAdminUser(S.user)){
    if(S.view==='dashboard') return renderMgmtDashboard();
    if(S.view==='calendar') return renderCalendarPage(S.events, {showFilter:true});
    if(S.view==='leads') return renderLeadsPage();
    if(S.view==='needs_review') return renderNeedsReviewPage();
    if(S.view==='artists') return renderArtistsPage();
    if(S.view==='artist_detail') return renderArtistDetailPage(S.artistDetailId);
    if(S.view==='financials') return renderFinancialsPage();
    if(S.view==='outside_bookings') return renderOutsideBookingsPage();
    if(S.view==='documents') return renderDocumentsPage();
    if(S.view==='contracts') return renderContractsPage();
    if(S.view==='contract_builder') return renderContractsBuilderListPage();
    if(S.view==='messages') return renderMessagesPage();
    if(S.view==='projects') return renderProjectsBoard();
    if(S.view==='pricing') return renderPricingPage();
    if(S.view==='international') return renderInternationalPage();
    if(S.view==='daily_digest') return renderDailyDigestPage();
    if(S.view==='travel') return renderTravelPage(S.events);
  } else {
    if(S.view==='a_dashboard') return renderArtistDashboard(S.user);
    if(S.view==='a_calendar') return renderCalendarPage(eventsFor(S.user), {noLegend:true, singleArtist:true, showBlockButton:true});
    if(S.view==='a_gigs') return renderArtistGigs(S.user);
    if(S.view==='a_financials') return renderArtistFinancials(S.user);
    if(S.view==='a_travel') return renderTravelPage(eventsFor(S.user), {singleArtist:true});
    if(S.view==='a_projects') return renderArtistProjects(S.user);
  }
  return '';
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
      <button class="icon-btn" data-action="remove-real-passkey" data-id="${esc(pk.id)}" title="Remove">${ICO.x}</button>
    </div>`).join('')}
    <button class="btn btn-sm" style="margin-top:12px;" data-action="add-real-passkey">${ICO.plus} Add a passkey</button>
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
        <button class="icon-btn" data-action="open-edit-real-user" data-kind="admin" data-id="${u.id}" title="Edit">${ICO.pencil}</button>
      </span>
    </div>`).join('') : `<p style="font-size:12px;color:var(--ink-3);margin:0 0 12px;">No office accounts yet.</p>`}
    <div class="u-label" style="margin:14px 0 6px;">Artists</div>
    ${roster.artists.length? roster.artists.map(a=>`<div class="settings-row">
      <div><h4>${esc(a.name)} <span style="font-weight:400;color:var(--ink-3);">— ${esc(a.role)}</span></h4><p>${esc(a.email)}</p></div>
      <span style="display:flex;align-items:center;gap:8px;flex:none;">
        <span class="pill ${a.user_id?'pill-good':''}">${a.user_id?'Active':'Invited'}</span>
        <button class="icon-btn" data-action="open-edit-real-user" data-kind="artist" data-id="${a.id}" title="Edit">${ICO.pencil}</button>
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
      <div class="sheet-head"><h2 style="font-size:1.3rem;">Add Person</h2><button class="icon-btn" data-action="close-add-real-user">${ICO.x}</button></div>
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
      <div class="sheet-head"><h2 style="font-size:1.3rem;">Edit ${kind==='admin'?'Office':'Artist'} Account</h2><button class="icon-btn" data-action="close-edit-real-user">${ICO.x}</button></div>
      <div class="sheet-body">
        <div class="field"><label>Full Name</label><input data-field="name" value="${esc(f.name||'')}" placeholder="Full name" autofocus/></div>
        <div class="field"><label>Real Email</label><input type="email" data-field="email" value="${esc(f.email||'')}" placeholder="them@realdomain.com"/></div>
        ${kind==='artist' ? `<div class="field"><label>Role</label>
          <div class="chip-row">${ARTIST_ROLES.map(r=>`<button class="filter-chip ${artistRole===r?'sel':''}" data-action="pick-edit-artist-role" data-role="${r}">${r}</button>`).join('')}</div>
        </div>` : `<div class="field"><label>Desk</label>
          <div class="chip-row">${Object.entries(ADMIN_ROLE_LABELS).map(([k,l])=>`<button class="filter-chip ${adminRole===k?'sel':''}" data-action="pick-edit-admin-role" data-role="${k}">${l}</button>`).join('')}</div>
        </div>`}
        ${f.email!==f.originalEmail? `<p style="font-size:11px;color:var(--ink-3);margin:0;">Changing the email does not move their existing sign-in -- they'll still sign in with the old address until this one is updated to match a real account.</p>` : ''}
        <button class="btn btn-primary btn-block" data-action="confirm-edit-real-user">Save Changes</button>
      </div>
    </div>
  </div>`;
}
function renderSettingsPage(){
  const isAdmin = isAdminUser(S.user);
  const who = isAdmin ? adminById(S.user) : artistById(S.user);
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
      ${st.passkeys.length>1 ? `<button class="icon-btn" data-action="remove-passkey" data-id="${pk.id}" title="Remove">${ICO.x}</button>` : ''}
    </div>`).join('')}
    <button class="btn btn-sm" style="margin-top:12px;" data-action="add-passkey">${ICO.plus} Add a passkey</button>
    `}
  </div>

  ${isReal && isAdmin ? renderUsersDashboardCard() : ''}

  ${isAdmin ? renderPayeeProfilesCard() : ''}

  ${isAdmin ? renderQuickBooksCard() : ''}

  ${isAdmin ? renderGoogleCalendarSyncCard() : ''}

  ${isAdmin ? renderReconciliationCard() : ''}

  ${isAdmin ? renderGmailMailboxesCard() : ''}

  ${isAdmin ? renderZelleReviewQueueCard() : ''}

  ${isAdmin ? renderDataMigrationCard() : ''}

  ${isAdmin ? renderTravelSettingsCard() : ''}

  <div class="card card-pad" style="margin-bottom:20px;">
    <h3 style="margin-bottom:12px;">Connected Accounts</h3>
    <div class="settings-row" style="border-bottom:none;padding-bottom:0;">
      <div><h4>Google Calendar</h4><p>${st.calendarConnected? `Connected as ${esc(st.calendarEmail)}` : 'Not connected'}</p></div>
      ${st.calendarConnected
        ? `<button class="btn btn-sm btn-ghost" data-action="disconnect-calendar">Disconnect</button>`
        : `<button class="btn btn-sm btn-primary" data-action="connect-calendar">Connect</button>`}
    </div>
  </div>

  <div class="card card-pad" style="margin-bottom:20px;">
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
  </div>

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
  const name = brand.name || 'ASP';
  const tagline = brand.tagline || 'Bookings';
  return `<div class="wordmark" style="font-size:1.6rem;justify-content:center;"><span class="mark"><i></i><i></i><i></i><i></i><i></i></span>${esc(name)}<small>${esc(tagline)}</small></div>`;
}
function renderLogin(){
  if(S.showRealSignIn) return renderRealSignIn();
  if(S.realSignInNotFound) return renderRealSignInNotFound();
  return `<div class="login-wrap"><div class="login-card" style="text-align:center;">
    ${loginWordmark()}
    <p style="color:var(--ink-2);font-size:13.5px;margin:16px 0 26px;">Sign in to view your schedule and bookings.</p>
    ${supabaseClient ? `
    <button class="btn btn-primary btn-block" data-action="real-signin-passkey">${ICO.key} Sign in with Passkey</button>
    <button class="btn btn-block btn-ghost" style="margin-top:8px;" data-action="open-real-signin">Sign in with email</button>
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
    <button class="icon-btn chooser-back" data-action="close-real-signin">${ICO.chev('l')}</button>
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
    <span class="mark" style="height:22px;"><i></i><i></i><i></i><i></i><i></i></span>
    <h2 style="font-family:var(--font-display);font-size:1.4rem;margin:0;">Welcome, ${esc(name)}</h2>
  </div>`;
}
function renderMgmtDashboard(){
  const isCEO = S.user==='admin_ceo';
  if(isCEO){
    return `
    ${renderWelcomeHeader((adminById(S.user).name||'').split(' ')[0])}
    ${renderUpcomingGigsCard(S.events, {days:7, showArtist:true})}
    ${renderOpenLeadsCard(S.events)}
    `;
  }
  const open = S.events.filter(e=>['lead','negotiating','contract_sent'].includes(e.status));
  const awaitingDeposit = S.events.filter(e=>e.status==='contract_sent');
  const awaitingBalance = S.events.filter(e=>e.status==='booked' && !e.balanceReceived);
  const upcoming30 = S.events.filter(e=>!isPast(e.date) && daysUntil(e.date)<=30 && ['booked','paid'].includes(e.status));
  const conflictPairs = allConflictPairs().filter(([a,b])=>!isPast(a.date)||!isPast(b.date));
  const intlTrips = S.events.filter(e=>isInternational(e) && !e.intlOpportunityDismissed && !isPast(e.date) && ['booked','paid'].includes(e.status)).sort((a,b)=>a.date.localeCompare(b.date));
  const needsTravel = S.events.filter(e=>!isPast(e.date) && ((e.flightNeeded && !e.flightBooked) || (e.groundTransportNeeded && !e.groundTransportBooked)));
  const todayGigs = S.events.filter(e=>e.date===fmtISO(new Date()) && ['booked','paid'].includes(e.status));

  return `
  ${renderWelcomeHeader((adminById(S.user).name||'').split(' ')[0])}
  <div class="grid stat-row" style="margin-bottom:20px;">
    <div class="card stat-tile" style="cursor:pointer;" data-action="nav-today-gigs"><span class="u-label">Gigs Today</span><span class="val">${todayGigs.length}</span><span class="sub">${fmtDateShort(fmtISO(new Date()))}</span></div>
    <div class="card stat-tile" style="cursor:pointer;" data-action="nav" data-view="calendar"><span class="u-label">Upcoming Gigs · 30 days</span><span class="val">${upcoming30.length}</span><span class="sub">Booked or paid, next 30 days</span></div>
    <div class="card stat-tile" style="cursor:pointer;" data-action="nav" data-view="leads"><span class="u-label">Open Leads</span><span class="val">${open.length}</span><span class="sub">Awaiting contract / deposit</span></div>
    <div class="card stat-tile" style="cursor:pointer;" data-action="nav" data-view="leads"><span class="u-label">Awaiting Balance</span><span class="val">${awaitingBalance.length}</span><span class="sub">Booked, balance not yet in</span></div>
  </div>
  <div class="grid stat-row" style="margin-bottom:20px;">
    ${statTile('International Opportunities', intlTrips.length, 'Artist traveling — worth adding nearby bookings', 'international')}
    ${statTile('Travel To Arrange', needsTravel.length, 'Flights or drivers still needed', 'travel')}
    ${statTile('Daily Digest', new Set([...open, ...awaitingBalance, ...altPaymentFollowUps()].map(e=>e.id)).size, 'Leads to follow up + payments due', 'daily_digest')}
    ${statTile('Open Messages', '—', 'Not connected yet', 'messages')}
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
  const upcoming = events.filter(e=>!isPast(e.date) && daysUntil(e.date)<days && ['booked','paid'].includes(e.status))
    .sort((a,b)=> a.date===b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date));
  return `
  <div class="section-head"><h2>Upcoming — Next ${days} Days</h2></div>
  ${upcoming.length? `<div class="card">${upcoming.map(e=>renderDayEventRow(e, !!opts.showArtist, 'open-event', {showDate:true})).join('')}</div>`
    : `<div class="card empty">Nothing coming up in the next ${days} days.</div>`}
  `;
}
function renderOpenLeadsCard(events){
  const open = events.filter(e=>['lead','negotiating','contract_sent'].includes(e.status)).sort((a,b)=>a.date.localeCompare(b.date));
  return `
  <div class="section-head" style="margin-top:20px;"><h2>Open Leads (${open.length})</h2></div>
  ${open.length? `<div class="card">${open.map(e=>renderDayEventRow(e, true, 'open-event', {showDate:true})).join('')}</div>`
    : `<div class="card empty">No open leads right now.</div>`}
  `;
}
function subpageBack(){
  return `<button class="icon-btn" data-action="nav" data-view="dashboard" title="Back to Dashboard" style="margin-bottom:14px;">${ICO.chev('l')}</button>`;
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
  const openLeads = S.events.filter(e=>['lead','negotiating','contract_sent'].includes(e.status)).sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
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
  ${awaitingBalance.length? `<div class="card card-pad" style="margin-bottom:20px;">${awaitingBalance.map(e=>row(e, money(zelleBalance(e)))).join('')}</div>` : `<div class="card empty" style="margin-bottom:20px;">Nothing outstanding.</div>`}

  <div class="section-head"><h2>Payment Follow-Up — Alternative Method (${altPayment.length})</h2></div>
  <p style="font-size:11.5px;color:var(--ink-3);margin:-14px 0 8px;">Not on QuickBooks/Zelle — no automated reminder, follow up directly.</p>
  ${altPayment.length? `<div class="card card-pad" style="margin-bottom:20px;">${altPayment.map(e=>row(e, `${paymentMethodLabel(e)} · ${money(e.depositReceived? zelleBalance(e) : e.commission)}`)).join('')}</div>` : `<div class="card empty" style="margin-bottom:20px;">Nothing outstanding.</div>`}

  <button class="btn btn-primary" data-action="copy-daily-digest">${ICO.share} Copy WhatsApp Message for Ilan (Open Leads)</button>
  `;
}
function renderInternationalPage(){
  const intlTrips = S.events.filter(e=>isInternational(e) && !e.intlOpportunityDismissed && !isPast(e.date) && ['booked','paid'].includes(e.status)).sort((a,b)=>a.date.localeCompare(b.date));
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
        <button class="icon-btn" data-action="dismiss-intl" data-id="${e.id}" title="Dismiss" style="width:22px;height:22px;">${ICO.x}</button>
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
  <div class="card u-scroll-x table-cards"><table>
    <thead><tr>${showArtist?'<th>Artist</th>':''}<th>Type</th><th>Date</th><th>Flight</th><th>Ground</th><th></th></tr></thead>
    <tbody>
      ${readyItineraries.map(e=>{
        const a = artistById(e.artistId);
        return `<tr>
          ${showArtist?`<td data-label="Artist"><span style="display:flex;align-items:center;gap:7px;"><span class="avatar" data-slot="${a.slot}" style="width:22px;height:22px;font-size:9px;">${a.initials}</span>${esc(a.name)}</span></td>`:''}
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
  const todayIso = fmtISO(new Date());

  const modeToggle = opts.miniEmbed ? '' : `<div class="chip-row" style="margin-left:auto;flex-wrap:nowrap;">
    ${['month','week','day'].map(mv=>`<button class="filter-chip ${mode===mv?'sel':''}" data-action="cal-view-mode" data-mode="${mv}">${mv[0].toUpperCase()+mv.slice(1)}</button>`).join('')}
  </div>`;

  const head = (label)=>`
    <div class="cal-head">
      <div class="cal-nav">
        <button class="icon-btn" data-action="cal-prev">${ICO.chev('l')}</button>
        <strong style="font-family:var(--font-display);font-size:1.05rem;min-width:150px;text-align:center;">${label}</strong>
        <button class="icon-btn" data-action="cal-next">${ICO.chev('r')}</button>
        <button class="btn btn-sm btn-ghost" data-action="cal-today">Today</button>
        ${opts.showBlockButton ? `<button class="btn btn-sm" data-action="open-block-time">${ICO.clock} Block Time</button>` : ''}
        ${modeToggle}
      </div>
      ${opts.showFilter ? `<div class="chip-row">${ARTISTS.map(a=>`<button class="filter-chip ${S.calArtistFilter.includes(a.id)?'sel':''}" data-action="cal-filter" data-id="${a.id}"><span class="dot" data-slot="${a.slot}"></span>${a.name.split(' ')[0]}</button>`).join('')}</div>`:''}
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
            ${isAdmin? `<button class="icon-btn" data-action="quick-add-event" data-date="${iso}" title="Add event" style="margin-left:auto;width:26px;height:26px;">${ICO.plus}</button>`:''}
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
          ${evs.slice(0,max).map(e=>{const a=artistById(e.artistId); const label = opts.singleArtist? (e.clientName||e.type).split(' ')[0] : a.name.split(' ')[0]; const timePrefix = (!e.time || e.time==='00:00') ? '' : fmtTime(e.time).replace(':00','')+' '; return `<div class="cal-evt" data-action="open-event" data-id="${e.id}"><span class="dot" data-slot="${a.slot}"></span><span>${timePrefix}${esc(label)}</span></div>`;}).join('')}
          ${evs.length>max? `<span class="cal-more" data-action="open-day" data-date="${c.iso}">+${evs.length-max} more</span>`:''}
        </div>`;
      }).join('')}
    </div>
    ${(!opts.noLegend) ? `<div class="legend">${ARTISTS.map(a=>`<span class="legend-item"><span class="dot" data-slot="${a.slot}"></span>${a.name}</span>`).join('')}</div>`:''}
  `;
}

/* ============ LEADS TABLE ============ */
// opts.asArtist (navigation/data-layer refactor PR 15): the artist-facing "My Gigs" table reused
// this unchanged, including the office "Price" column -- e.unpaid? '-' : money(e.price) -- which
// is the full CLIENT package price, not the artist's own fee. An artist should see their own net
// (what zelleBalance() already computes correctly for Financials), never another number labeled
// ambiguously as just "Price". Office call sites (showArtist:true dashboard/leads tables, the
// admin's per-artist detail page) are unaffected -- only pass asArtist:true for an artist's own
// session.
function renderEventTable(events, opts={}){
  if(!events.length) return `<div class="card empty">Nothing here yet.</div>`;
  return `<div class="card u-scroll-x table-cards"><table>
    <thead><tr>
      ${opts.showArtist?'<th>Artist</th>':''}
      <th>Client</th><th>Type</th><th>Date</th><th>Location</th><th>${opts.asArtist?'Your Fee':'Price'}</th><th>Status</th>
    </tr></thead>
    <tbody>
      ${events.map(e=>{
        const a = artistById(e.artistId); const sm = statusMeta(e);
        const amountCell = e.unpaid? '—' : money(opts.asArtist? zelleBalance(e) : e.price);
        return `<tr class="row-link" data-action="open-event" data-id="${e.id}">
          ${opts.showArtist?`<td data-label="Artist"><span style="display:flex;align-items:center;gap:7px;"><span class="avatar" data-slot="${a.slot}" style="width:22px;height:22px;font-size:9px;">${a.initials}</span>${esc(a.name)}</span></td>`:''}
          <td data-label="Client">${e.clientName? esc(e.clientName) : '—'}${e.needsReview? ` <span class="pill pill-warn" title="Imported from calendar -- not yet confirmed">Needs Review</span>` : ''}</td><td data-label="Type">${esc(e.type)}</td><td data-label="Date" class="u-mono">${fmtDateShort(e.date)}</td>
          <td data-label="Location">${esc(e.venue)||'—'}</td><td data-label="${opts.asArtist?'Your Fee':'Price'}" class="u-mono">${amountCell}</td>
          <td data-label="Status"><span class="pill ${sm.cls}">${sm.label}</span></td>
        </tr>`;
      }).join('')}
    </tbody></table></div>`;
}
function renderArtistFilterRow(current, action, opts={}){
  const dotOrAvatar = a => opts.avatar
    ? `<span class="avatar" data-slot="${a.slot}" style="width:18px;height:18px;font-size:8px;">${a.initials}</span>`
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
  const open = base.filter(e=>['lead','negotiating','contract_sent'].includes(e.status)).sort((a,b)=>a.date.localeCompare(b.date));
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
              <span class="avatar" data-slot="${a.slot}" style="width:20px;height:20px;font-size:8px;">${a.initials}</span>
              <strong style="font-size:13.5px;">${e.clientName? esc(e.clientName) : '—'}</strong>
              <span class="pill ${sm.cls}">${sm.label}</span>
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
      const upcoming = evs.filter(e=>!isPast(e.date) && ['booked','paid'].includes(e.status)).length;
      const ytdPayout = evs.filter(e=>e.balanceReceived && new Date(e.balanceReceivedDate).getFullYear()===new Date().getFullYear()).reduce((s,e)=>s+zelleBalance(e),0);
      return `<div class="card card-pad" style="cursor:pointer;display:flex;flex-direction:column;gap:10px;" data-action="open-artist" data-id="${a.id}">
        <div style="display:flex;align-items:center;gap:10px;">
          <span class="avatar" data-slot="${a.slot}" style="width:44px;height:44px;font-size:15px;">${a.initials}</span>
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
      <span class="avatar" data-slot="${a.slot}" style="width:52px;height:52px;font-size:17px;">${a.initials}</span>
      <div><h2 style="font-size:1.5rem;">${esc(a.name)}</h2><span class="u-label">${esc(a.role||'Artist')} · Viewing as Management</span></div>
    </div>
    <div class="card card-pad" style="margin-bottom:20px;">${renderCalendarPage(evs, {noLegend:true, singleArtist:true, miniEmbed:true})}</div>
    <div class="section-head"><h2>Upcoming (${upcoming.length})</h2></div>
    ${renderEventTable(upcoming, {})}
  `;
}

/* ============ FINANCIALS ============ */
function renderMessagesPage(){
  return `
  <div class="section-head"><h2>Messages</h2></div>
  <div class="card empty" style="padding:48px 24px;">
    <div style="font-size:15px;font-weight:700;color:var(--ink);margin-bottom:6px;">WhatsApp isn't connected yet</div>
    <p style="max-width:420px;margin:0 auto 18px;color:var(--ink-3);font-size:13px;line-height:1.6;">Once it's connected, client and lead conversations will show up here — reply without leaving the app, and open threads will count toward the badge on this tab.</p>
    <button class="btn btn-primary" disabled style="opacity:.55;cursor:not-allowed;">${ICO.sms} Connect WhatsApp</button>
  </div>
  `;
}
function renderPricingPage(){
  const artistId = S.pricingArtist || ARTISTS[0].id;
  const artist = artistById(artistId);
  return `
  <p style="font-size:12.5px;color:var(--ink-3);margin:0 0 16px;max-width:640px;">Standard hourly rates by artist and event type — the reference bookkeeping quotes from before negotiating a final flat price. Overtime is always time-and-a-half (1.5×), prorated to the minute past the included hours, not a separately set rate.</p>
  ${renderArtistFilterRow(artistId, 'pricing-artist', {noAll:true})}
  <div class="card u-scroll-x table-cards">
    <table>
      <thead><tr><th>Event Type</th><th>Hourly Rate</th><th>Included Hours</th><th>Overtime (1.5×/hr, prorated)</th></tr></thead>
      <tbody>
        ${EVENT_TYPES.map(type=>{
          const p = getPricing(artistId, type);
          return `<tr>
            <td data-label="Event Type">${esc(type)}</td>
            <td data-label="Hourly Rate"><span class="u-mono" style="margin-right:2px;">$</span><input type="number" min="0" step="25" value="${p.hourlyRate}" data-action="set-hourly-rate" data-artist="${artistId}" data-type="${esc(type)}" style="width:90px;padding:6px 8px;border-radius:6px;border:1px solid var(--border-strong);background:var(--surface);font-family:var(--font-mono);"/></td>
            <td data-label="Included Hours"><input type="number" min="0" step="0.5" value="${p.includedHours}" data-action="set-included-hours" data-artist="${artistId}" data-type="${esc(type)}" style="width:70px;padding:6px 8px;border-radius:6px;border:1px solid var(--border-strong);background:var(--surface);font-family:var(--font-mono);"/></td>
            <td data-label="Overtime" class="u-mono">${money(p.hourlyRate*OVERTIME_MULTIPLIER)}/hr</td>
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
  const booked = filt.filter(e=>['booked','paid'].includes(e.status));
  const gross = booked.reduce((s,e)=>s+e.price,0);
  const commission = booked.reduce((s,e)=>s+e.commission,0);
  const payouts = booked.reduce((s,e)=>s+zelleBalance(e),0);
  const avg = booked.length ? Math.round(gross/booked.length) : 0;
  const openInvoices = CUSTOM_INVOICES.filter(i=>i.status==='open');
  const openInvoiceTotal = openInvoices.reduce((s,i)=>s+invoiceTotal(i),0);
  const payoutEligible = filt.filter(e=>e.balanceReceived);
  const owedToArtists = payoutEligible.filter(e=>!e.artistPaidOut);
  const owedTotal = owedToArtists.reduce((s,e)=>s+zelleBalance(e),0);
  const paidOutTotal = payoutEligible.filter(e=>e.artistPaidOut).reduce((s,e)=>s+zelleBalance(e),0);

  const months=[]; for(let i=5;i>=0;i--){ const d=new Date(); d.setDate(1); d.setMonth(d.getMonth()-i); months.push(d); }
  const monthlyGross = months.map(md=>{
    const sum = booked.filter(e=>{const ed=new Date(e.date+'T00:00:00'); return ed.getMonth()===md.getMonth()&&ed.getFullYear()===md.getFullYear();}).reduce((s,e)=>s+e.price,0);
    return {label: md.toLocaleDateString('en-US',{month:'short'}), val:sum};
  });
  const maxMonthly = Math.max(...monthlyGross.map(m=>m.val),1);

  return `
  ${renderArtistFilterRow(S.finArtistFilter, 'fin-filter')}
  <div class="grid stat-row" style="margin-bottom:20px;">
    <div class="card stat-tile"><span class="u-label">Gross Booked</span><span class="val">${money(gross)}</span><span class="sub">${booked.length} jobs</span></div>
    <div class="card stat-tile"><span class="u-label">ASP Commission</span><span class="val">${money(commission)}</span><span class="sub">15% of gross</span></div>
    <div class="card stat-tile"><span class="u-label">Artist Payouts</span><span class="val">${money(payouts)}</span><span class="sub">85% via Zelle</span></div>
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
  ${payoutEligible.length? `<div class="card u-scroll-x table-cards" style="margin-bottom:22px;"><table>
    <thead><tr><th>Artist</th><th>Client</th><th>Date</th><th>Fee</th><th>ASP Cut</th><th>Charges</th><th>Payout</th><th>Status</th><th></th></tr></thead>
    <tbody>${payoutEligible.sort((a,b)=>b.date.localeCompare(a.date)).map(e=>{const a=artistById(e.artistId); const amt=zelleBalance(e);
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
      const ae = S.events.filter(e=>e.artistId===a.id && ['booked','paid'].includes(e.status));
      const total = ae.reduce((s,e)=>s+e.price,0);
      const spark = months.map(md=>ae.filter(e=>{const ed=new Date(e.date+'T00:00:00'); return ed.getMonth()===md.getMonth()&&ed.getFullYear()===md.getFullYear();}).reduce((s,e)=>s+e.price,0));
      const mx = Math.max(...spark,1);
      return `<div class="card card-pad">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <span class="avatar" data-slot="${a.slot}" style="width:26px;height:26px;font-size:10px;">${a.initials}</span>
          <strong style="font-size:13px;">${esc(a.name)}</strong>
        </div>
        <div class="sparkbar">${spark.map(v=>`<b style="height:${Math.max(6,(v/mx)*100)}%;"></b>`).join('')}</div>
        <div class="u-mono" style="font-size:15px;font-weight:700;margin-top:6px;">${money(total)}</div>
        <span class="u-label">gross, last 6 mo</span>
      </div>`;
    }).join('')}
  </div>

  <div class="section-head"><h2>Custom Invoices (${CUSTOM_INVOICES.length})</h2><button class="btn btn-sm btn-primary" data-action="open-new-invoice">+ New Invoice</button></div>
  <div class="card u-scroll-x table-cards" style="margin-bottom:22px;"><table>
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
  <div class="card u-scroll-x table-cards"><table>
    <thead><tr><th>Artist</th><th>Client</th><th>Date</th><th>Price</th><th>Commission</th><th>Payout</th><th>Status</th></tr></thead>
    <tbody>${booked.sort((a,b)=>b.date.localeCompare(a.date)).map(e=>{const a=artistById(e.artistId); const sm=statusMeta(e);
      return `<tr class="row-link" data-action="open-event" data-id="${e.id}">
        <td data-label="Artist">${esc(a.name)}</td><td data-label="Client">${esc(e.clientName)}</td><td data-label="Date" class="u-mono">${fmtDateShort(e.date)}</td>
        <td data-label="Price" class="u-mono">${money(e.price)}</td><td data-label="Commission" class="u-mono">${money(e.commission)}</td><td data-label="Payout" class="u-mono">${money(zelleBalance(e))}</td>
        <td data-label="Status"><span class="pill ${sm.cls}">${sm.label}</span></td></tr>`;}).join('')}
    </tbody></table></div>
  `;
}

/* ============ OUTSIDE BOOKINGS PAGE (own nav tab — office/bookkeeping only, not CEO) ============ */
function outsideBookingOpenReminders(b){ return (b.reminders||[]).filter(r=>!r.completedAt && (!r.snoozedUntil || r.snoozedUntil<=fmtISO(new Date()))); }
function renderOutsideBookingsPage(){
  return `
  <div class="grid" style="grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;">
    <div class="card stat-tile"><span class="u-label">External Events Open</span><span class="val">${OUTSIDE_BOOKINGS.filter(b=>b.status==='open').length}</span><span class="sub">Not yet paid</span></div>
    <div class="card stat-tile"><span class="u-label">ASP Earned (External)</span><span class="val">${money(OUTSIDE_BOOKINGS.reduce((s,b)=>s+b.aspCut,0))}</span><span class="sub">Across ${OUTSIDE_BOOKINGS.length} event${OUTSIDE_BOOKINGS.length===1?'':'s'}</span></div>
  </div>

  <div class="section-head"><h2>External Events (${OUTSIDE_BOOKINGS.length})</h2><button class="btn btn-sm btn-primary" data-action="open-new-outside-booking">+ New External Event</button></div>
  <p style="font-size:11.5px;color:var(--ink-3);margin:-8px 0 12px;">Jobs that don't involve one of our own roster artists — outside acts we coordinate or refer. Kept separate from ASP's own leads/calendar unless explicitly shown there.</p>
  <div class="card u-scroll-x table-cards"><table>
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
        <button class="icon-btn" data-action="remove-outside-booking-reminder" data-clause="${b.id}" data-id="${r.id}" title="Remove" style="flex:none;">${ICO.trash}</button>
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
          <span class="pill pill-accent">External Event</span>
          <span class="pill ${b.status==='paid'?'pill-good':'pill-warn'}">${b.status==='paid'?'Paid':'Open'}</span>
        </div>
        <button class="icon-btn" data-action="close-outside-booking-detail">${ICO.x}</button>
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
  ${DOCUMENTS.length? `<div class="card u-scroll-x table-cards"><table>
    <thead><tr><th>Title</th><th>For</th><th>Letterhead</th><th>Date</th><th>Status</th></tr></thead>
    <tbody>${DOCUMENTS.slice().sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).map(d=>{
      return `<tr class="row-link" data-action="open-document" data-id="${d.id}">
        <td data-label="Title">${esc(d.title)}</td>
        <td data-label="For">${esc(documentSubjectLabel(d))}</td>
        <td data-label="Letterhead">${esc((DOC_BRANDS[d.brand]||DOC_BRANDS.asp).label)}</td>
        <td data-label="Date" class="u-mono">${fmtDateShort(d.createdAt)}</td>
        <td data-label="Status"><span class="pill ${d.signedAt?'pill-good':'pill-neutral'}">${d.signedAt?'Signed':'Draft'}</span></td>
      </tr>`;
    }).join('')}
    </tbody></table></div>` : `<div class="card empty">No documents yet.</div>`}
  `;
}

/* ============ CONTRACTS (searchable) ============ */
// Every booking's contract is generated live from its own event data (renderContractDoc, reused
// unchanged here) -- this page is a find-it-fast index, not a second copy of contract content,
// so there's nothing here that can drift out of sync with the real event. Scoped to events that
// actually have a real (non-draft) contract out -- contract_sent/booked/paid -- since a lead
// still being negotiated doesn't have one yet.
function contractedEvents(){
  return S.events.filter(e=>!e.unpaid && ['contract_sent','booked','paid'].includes(e.status));
}
function renderContractsPage(){
  const q = (S.contractSearchQuery||'').trim().toLowerCase();
  const rows = contractedEvents()
    .filter(e=>{
      if(!q) return true;
      const a = artistById(e.artistId);
      return (e.clientName||'').toLowerCase().includes(q) || a.name.toLowerCase().includes(q);
    })
    .sort((a,b)=>b.date.localeCompare(a.date));
  return `
  <div class="section-head"><h2>Contracts (${rows.length})</h2></div>
  <p style="font-size:11.5px;color:var(--ink-3);margin:-8px 0 12px;">Every booking with a contract out, searchable by client or artist — find one without digging through the gig itself.</p>
  <div class="field" style="max-width:340px;margin-bottom:14px;">
    <input id="contractSearchInput" value="${esc(S.contractSearchQuery||'')}" placeholder="Search client or artist..."/>
  </div>
  ${rows.length? `<div class="card u-scroll-x table-cards"><table>
    <thead><tr><th>Client</th><th>Artist</th><th>Date</th><th>Status</th></tr></thead>
    <tbody>${rows.map(e=>{
      const a = artistById(e.artistId); const sm = statusMeta(e);
      return `<tr class="row-link" data-action="open-contract-from-list" data-id="${e.id}">
        <td data-label="Client">${esc(e.clientName||e.type)}</td>
        <td data-label="Artist">${esc(a.name)}</td>
        <td data-label="Date" class="u-mono">${fmtDateShort(e.date)}</td>
        <td data-label="Status"><span class="pill ${sm.cls||'pill-neutral'}">${esc(sm.label)}</span></td>
      </tr>`;
    }).join('')}
    </tbody></table></div>` : `<div class="card empty">${q? 'No contracts match that search.' : 'No contracts sent yet.'}</div>`}
  `;
}

/* ============ PROJECTS ============ */
function renderProjectFolderCard(p, opts={}){
  // artistById(p.artistId) is legitimately undefined for a general/non-gig project (PR 14 --
  // projects no longer require a fake artist pick), so every a.* read below has to tolerate that.
  const a = artistById(p.artistId);
  const isAdmin = isAdminUser(S.user);
  const overdue = p.dueDate && isPast(p.dueDate);
  const coverStyle = p.coverImage? `background-image:url('${p.coverImage}');` : `background:var(--cat-${a?.slot||1});`;
  return `<div class="project-folder" data-action="open-project" data-id="${p.id}">
    <div class="project-folder-cover" style="${coverStyle}">
      ${!p.coverImage? `<span class="project-folder-cover-fallback">${esc((p.title||'?').trim().slice(0,1).toUpperCase())}</span>`:''}
      ${isAdmin? `<label class="project-folder-cover-upload" data-action="upload-project-cover" data-id="${p.id}" title="Set cover image">
        ${ICO.image}
        <input type="file" accept="image/*" data-action="upload-project-cover" data-id="${p.id}" style="display:none;"/>
      </label>` : ''}
      ${p.coverImage && isAdmin? `<button class="icon-btn project-folder-cover-remove" data-action="remove-project-cover" data-id="${p.id}" title="Remove cover" style="width:24px;height:24px;">${ICO.x}</button>`:''}
    </div>
    <div class="project-folder-body">
      ${opts.showArtist? `<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;"><span class="avatar" data-slot="${a?a.slot:0}" style="width:18px;height:18px;font-size:8px;">${a?a.initials:'—'}</span><span style="font-size:11px;color:var(--ink-2);">${a?esc(a.name):'General'}</span></div>`:''}
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
  const isMe = person.kind==='internal' && person.refId===S.user;
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
    const isMe = person.kind==='internal' && person.refId===S.user;
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
      ${isAdmin? `<button class="icon-btn" data-action="remove-board-card" data-id="${pid}" data-cardid="${c.id}" title="Remove card" style="width:24px;height:24px;flex:none;">${ICO.x}</button>`:''}
    </div>
    <div class="sticky-card-items">
      ${items.length? items.map(it=>`<div class="sticky-card-item">
        <span>${esc(it.text)}</span>
        ${isAdmin? `<button data-action="remove-board-item" data-id="${pid}" data-cardid="${c.id}" data-itemid="${it.id}" title="Remove">${ICO.x}</button>`:''}
      </div>`).join('') : `<p class="sticky-card-empty">Nothing yet.</p>`}
    </div>
    ${isAdmin? `<div style="display:flex;gap:6px;margin-top:8px;">
      <input class="board-item-input" data-cardid="${c.id}" data-projectid="${pid}" placeholder="Type here…" style="flex:1;min-width:0;padding:6px 8px;border-radius:6px;border:1px solid var(--border-strong);background:var(--surface);font-size:12px;" value="${esc((S.newBoardItemText||{})[c.id]||'')}"/>
      <button class="icon-btn" data-action="add-board-item" data-id="${pid}" data-cardid="${c.id}" style="width:28px;height:28px;flex:none;">${ICO.plus}</button>
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
    <button class="icon-btn" data-action="nav" data-view="${backView}" title="Back to Projects" style="margin-bottom:14px;">${ICO.chev('l')}</button>
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
      <span class="avatar" data-slot="${a?a.slot:0}" style="width:44px;height:44px;flex:none;">${a?a.initials:'—'}</span>
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
              ${a? `<span style="display:flex;align-items:center;gap:6px;font-weight:600;${isAdmin?'cursor:pointer;':''}" ${isAdmin?`data-action="open-artist" data-id="${a.id}"`:''}><span class="avatar" data-slot="${a.slot}" style="width:20px;height:20px;font-size:8px;">${a.initials}</span>${esc(a.name)}</span>`
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
              ${(p.people||[]).length? p.people.map(person=>`<span class="pill pill-neutral" style="display:inline-flex;align-items:center;gap:6px;">${renderPersonAvatar(person,15)}${esc(person.role)}: ${esc(person.name)}${isAdmin?`<button data-action="remove-person" data-id="${p.id}" data-pid="${person.id}" style="border:none;background:none;cursor:pointer;color:var(--ink-3);padding:0;display:flex;">${ICO.x}</button>`:''}</span>`).join('') : `<span style="font-size:12px;color:var(--ink-3);">Nobody added yet.</span>`}
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
              const isMine = assignedPerson && assignedPerson.kind==='internal' && assignedPerson.refId===S.user;
              return `<div class="log-item" style="align-items:center;flex-wrap:wrap;gap:8px;${isMine&&!t.done?'background:var(--accent-wash);border-radius:8px;':''}">
              <input type="checkbox" ${t.done?'checked':''} data-action="toggle-task" data-id="${p.id}" data-taskid="${t.id}" style="width:16px;height:16px;flex:none;"/>
              <span style="flex:1;min-width:120px;${t.done?'text-decoration:line-through;color:var(--ink-3);':''}">${esc(t.text)}</span>
              ${isAdmin? renderTaskAssigneeSelect(p,t) : renderAssigneeChip(p, t.assignedTo)}
              ${isAdmin?`<button class="icon-btn" data-action="remove-task" data-id="${p.id}" data-taskid="${t.id}" style="width:24px;height:24px;">${ICO.x}</button>`:''}
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
              <a href="${img.dataUrl}" target="_blank" rel="noopener" style="display:block;aspect-ratio:1;border-radius:8px;overflow:hidden;border:1px solid var(--border);"><img src="${img.dataUrl}" alt="${esc(img.name)}" style="width:100%;height:100%;object-fit:cover;"/></a>
              <button class="icon-btn" data-action="remove-project-image" data-id="${p.id}" data-imgid="${img.id}" style="position:absolute;top:2px;right:2px;background:rgba(0,0,0,.55);color:#fff;width:22px;height:22px;">${ICO.x}</button>
            </div>`).join('')}
          </div>` : `<p style="font-size:12.5px;color:var(--ink-3);margin:0 0 20px;">No images yet.</p>`}

          <div class="u-label" style="margin-bottom:8px;">Video Links</div>
          <div class="log" style="margin-bottom:10px;">
            ${p.links.length? p.links.map(l=>`<div class="log-item" style="align-items:center;">
              <span class="log-ico">${ICO.share}</span>
              <a href="${esc(l.url)}" target="_blank" rel="noopener" style="flex:1;color:var(--accent);text-decoration:none;font-size:12.5px;word-break:break-all;">${esc(l.label||l.url)}</a>
              <button class="icon-btn" data-action="remove-project-link" data-id="${p.id}" data-linkid="${l.id}" style="width:24px;height:24px;">${ICO.x}</button>
            </div>`).join('') : `<p style="font-size:12.5px;color:var(--ink-3);margin:0;">No links yet.</p>`}
          </div>
          <div data-form="projectlink" style="display:flex;gap:6px;flex-wrap:wrap;">
            <input data-field="linkLabel" placeholder="Label (optional)" style="flex:1;min-width:100px;padding:8px 10px;border-radius:6px;border:1px solid var(--border-strong);background:var(--surface);" value="${esc(S.newLinkForm.label||'')}"/>
            <input data-field="linkUrl" placeholder="https://…" style="flex:2;min-width:140px;padding:8px 10px;border-radius:6px;border:1px solid var(--border-strong);background:var(--surface);" value="${esc(S.newLinkForm.url||'')}"/>
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
              ${isAdmin?`<button class="icon-btn" data-action="remove-fin-item" data-id="${p.id}" data-kind="income" data-itemid="${i.id}" style="width:22px;height:22px;">${ICO.x}</button>`:''}
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
              ${isAdmin?`<button class="icon-btn" data-action="remove-fin-item" data-id="${p.id}" data-kind="expenses" data-itemid="${i.id}" style="width:22px;height:22px;">${ICO.x}</button>`:''}
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
      <div class="sheet-head"><h2 style="font-size:1.3rem;">${isBatch? 'New Recording Day' : 'New Project'}</h2><button class="icon-btn" data-action="close-new-project">${ICO.x}</button></div>
      <div class="sheet-body">
        <div class="field"><label>Artist${isBatch?'':' (optional — leave unset for a general, non-gig project)'}</label>
          <div class="artist-pick">${ARTISTS.map(a=>`<div class="artist-opt ${f.artistId===a.id?'sel':''}" data-action="pick-project-artist" data-id="${a.id}">
            <span class="avatar" data-slot="${a.slot}" style="width:34px;height:34px;font-size:12px;">${a.initials}</span><span>${a.name}</span></div>`).join('')}
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
  const todayGig = evs.find(e=>e.date===fmtISO(new Date()) && ['booked','paid'].includes(e.status));
  return `
  ${renderWelcomeHeader(a.name.split(' ')[0])}
  ${todayGig? `<div class="card card-pad" style="margin-bottom:20px;border-color:var(--accent);background:var(--accent-wash);">
    <div style="display:flex;align-items:center;gap:8px;color:var(--accent-ink);font-weight:700;font-size:13px;margin-bottom:10px;">${MIC_PHOTO_ICON} Today's Gig</div>
    <div style="font-family:var(--font-display);font-size:1.15rem;font-weight:600;margin-bottom:4px;cursor:pointer;" data-action="open-event" data-id="${todayGig.id}">${esc(todayGig.type)}${todayGig.clientName?` — ${esc(todayGig.clientName)}`:''}</div>
    <div style="font-size:13px;color:var(--ink-2);margin-bottom:2px;">${fmtTimeRange(todayGig.time, todayGig.endTime)}</div>
    <div style="font-size:13px;color:${hasLocation(todayGig)?'var(--ink-2)':'var(--ink-3)'};margin-bottom:14px;">${hasLocation(todayGig)? esc(fullLocation(todayGig)) : 'Location TBD'}</div>
    ${hasLocation(todayGig)? `<div style="display:flex;gap:8px;">
      <a href="${gmapsUrl(todayGig)}" target="_blank" rel="noopener" class="btn btn-primary" style="flex:1;">${ICO.pin} Maps</a>
      <a href="${wazeUrl(todayGig)}" target="_blank" rel="noopener" class="btn" style="flex:1;background:var(--surface);">${ICO.pin} Waze</a>
    </div>` : ''}
  </div>` : ''}
  ${renderUpcomingGigsCard(evs, {days:7, showArtist:false})}
  `;
}
function renderArtistFinancials(artistId){
  const evs = eventsFor(artistId);
  const booked = evs.filter(e=>['booked','paid'].includes(e.status));
  const totalPayout = booked.reduce((s,e)=>s+zelleBalance(e),0);
  const avgPayout = booked.length ? Math.round(totalPayout/booked.length) : 0;
  const ytdPayout = evs.filter(e=>e.balanceReceived && new Date(e.balanceReceivedDate).getFullYear()===new Date().getFullYear()).reduce((s,e)=>s+zelleBalance(e),0);

  const months=[]; for(let i=5;i>=0;i--){ const d=new Date(); d.setDate(1); d.setMonth(d.getMonth()-i); months.push(d); }
  const monthlyPayout = months.map(md=>{
    const sum = booked.filter(e=>{const ed=new Date(e.date+'T00:00:00'); return ed.getMonth()===md.getMonth()&&ed.getFullYear()===md.getFullYear();}).reduce((s,e)=>s+zelleBalance(e),0);
    return {label: md.toLocaleDateString('en-US',{month:'short'}), val:sum};
  });
  const maxMonthly = Math.max(...monthlyPayout.map(m=>m.val),1);

  return `
  <div class="grid stat-row" style="margin-bottom:20px;">
    <div class="card stat-tile"><span class="u-label">YTD Payout</span><span class="val">${money(ytdPayout)}</span><span class="sub">Received via Zelle</span></div>
    <div class="card stat-tile"><span class="u-label">Total Booked</span><span class="val">${money(totalPayout)}</span><span class="sub">${booked.length} jobs</span></div>
    <div class="card stat-tile"><span class="u-label">Avg Payout</span><span class="val">${money(avgPayout)}</span><span class="sub">per booking</span></div>
    <div class="card stat-tile"><span class="u-label">Commission Rate</span><span class="val">15%</span><span class="sub">Kept by ASP</span></div>
  </div>

  <div class="card card-pad" style="margin-bottom:20px;">
    <div class="section-head"><h2>Monthly Payout</h2></div>
    <div class="fin-chart" style="display:flex;gap:14px;align-items:flex-end;height:120px;">
      ${monthlyPayout.map(m=>`<div style="flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;justify-content:flex-end;">
        <span class="u-mono" style="font-size:11px;color:var(--ink-2);">${m.val?money(m.val):''}</span>
        <div style="width:100%;max-width:46px;height:${Math.max(4,(m.val/maxMonthly)*80)}px;background:var(--accent);border-radius:4px 4px 0 0;opacity:.85;"></div>
        <span class="u-label">${m.label}</span>
      </div>`).join('')}
    </div>
  </div>

  <div class="section-head"><h2>My Jobs (${booked.length})</h2></div>
  <div class="card u-scroll-x table-cards"><table>
    <thead><tr><th>Client</th><th>Date</th><th>Your Fee</th><th>Status</th></tr></thead>
    <tbody>${booked.sort((a,b)=>b.date.localeCompare(a.date)).map(e=>{const sm=statusMeta(e);
      return `<tr class="row-link" data-action="open-event" data-id="${e.id}">
        <td data-label="Client">${esc(e.clientName)}</td><td data-label="Date" class="u-mono">${fmtDateShort(e.date)}</td>
        <td data-label="Your Fee" class="u-mono">${money(zelleBalance(e))}</td>
        <td data-label="Status"><span class="pill ${sm.cls}">${sm.label}</span></td></tr>`;}).join('')}
    </tbody></table></div>
  `;
}
function renderArtistGigs(artistId){
  const evs = eventsFor(artistId).sort((a,b)=>a.date.localeCompare(b.date));
  const upcoming = evs.filter(e=>!isPast(e.date));
  const past = evs.filter(e=>isPast(e.date));
  return `
    <div class="section-head"><h2>Upcoming</h2></div>
    ${renderEventTable(upcoming, {asArtist:true})}
    <div class="section-head" style="margin-top:26px;"><h2>Past</h2></div>
    ${renderEventTable(past, {asArtist:true})}
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
  return `<div class="field">
    <label>Additional ASP Artists (optional)</label>
    <div class="chip-row">${others.map(a=>{
      const on = selected.some(x=>x.artistId===a.id);
      return `<button type="button" class="filter-chip ${on?'sel':''}" data-action="toggle-additional-artist" data-id="${a.id}"><span class="avatar" data-slot="${a.slot}" style="width:18px;height:18px;font-size:8px;">${a.initials}</span>${esc(a.name.split(' ')[0])}</button>`;
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
      <div class="sheet-head"><h2 style="font-size:1.3rem;">${isInternal?'New Internal Day':'New Lead'}</h2><button class="icon-btn" data-action="close-sheet">${ICO.x}</button></div>
      <div class="sheet-body">
        <div class="chip-row">
          <button class="filter-chip ${!isInternal?'sel':''}" data-action="pick-booking-kind" data-kind="client">Client Booking</button>
          <button class="filter-chip ${isInternal?'sel':''}" data-action="pick-booking-kind" data-kind="internal">Internal Day</button>
          <button class="filter-chip" data-action="switch-to-outside-booking">Outside Act</button>
        </div>
        <p style="font-size:12px;color:var(--ink-3);margin:0;">${isInternal? 'For recording days, filming days, rehearsals — no client, no payment, just pencils the artist’s time in.' : "Only the artist, client name, and date are required — everything else can be filled in once it's known."}</p>
        <div class="field"><label>Artist</label>
          <div class="chip-row">${ARTISTS.map(a=>`<button type="button" class="filter-chip ${f.artistId===a.id?'sel':''}" data-action="pick-artist" data-id="${a.id}"><span class="avatar" data-slot="${a.slot}" style="width:18px;height:18px;font-size:8px;">${a.initials}</span>${esc(a.name.split(' ')[0])}</button>`).join('')}</div>
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
        <div class="field-row">
          <div class="field"><label>Start Time</label><input type="time" data-field="time" value="${f.time||'19:00'}"/></div>
          <div class="field"><label>End Time</label><input type="time" data-field="endTime" value="${f.endTime||''}"/></div>
        </div>
        <div class="field"><label>Venue Name</label><input data-field="venue" value="${esc(f.venue||'')}" placeholder="${isInternal?'Studio name':'Ateres Chaya Hall'}"/></div>
        <div class="field-row">
          <div class="field"><label>City</label><input data-field="city" value="${esc(f.city||'')}" placeholder="Lakewood"/></div>
          <div class="field"><label>State</label><input data-field="state" value="${esc(f.state||'')}" placeholder="NJ"/></div>
        </div>
        <div class="field-row">
          ${!isInternal? `<div class="field"><label>Price</label><input type="number" data-field="price" value="${f.price||''}" placeholder="4500"/></div>` : ''}
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
      <div class="sheet-head"><h2 style="font-size:1.3rem;">Block Time</h2><button class="icon-btn" data-action="close-sheet">${ICO.x}</button></div>
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
      <div class="sheet-head"><h2 style="font-size:1.2rem;display:flex;align-items:center;gap:8px;">${ICO.sparkle} Ask AI</h2><button class="icon-btn" data-action="close-sheet">${ICO.x}</button></div>
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
        <button class="icon-btn" style="background:var(--accent);color:#fff;border-radius:50%;" data-action="submit-ask-ai" title="Send">${ICO.chev('r')}</button>
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
      <div class="sheet-head"><h2 style="font-size:1.3rem;">Add Artist</h2><button class="icon-btn" data-action="close-add-artist">${ICO.x}</button></div>
      <div class="sheet-body">
        <div class="field"><label>Full Name</label><input data-field="name" value="${esc(f.name||'')}" placeholder="Full name" autofocus/></div>
        <div class="field"><label>Role</label>
          <div class="chip-row">${ARTIST_ROLES.map(r=>`<button class="filter-chip ${role===r?'sel':''}" data-action="pick-artist-role" data-role="${r}">${r}</button>`).join('')}</div>
        </div>
        <p style="font-size:12px;color:var(--ink-3);margin:0;">A login email and a "Welcome to ASP Management" message get generated automatically once you add them.</p>
        <button class="btn btn-primary btn-block" data-action="confirm-add-artist">Add Artist</button>
      </div>
    </div>
  </div>`;
}

function zelleBalance(ev){ return eventBalance(ev) + chargesTotal(ev); }
/* ============ PAYMENT METHOD (deposit exceptions) ============ */
// Default is 'standard' (QuickBooks invoice for the deposit + Zelle for the balance, per
// WORKFLOWS.md). No paymentMethod field at all means standard too -- undefined behaves as
// 'standard' everywhere it's read, same convention as the rest of this file's optional fields,
// so existing saved events never need a migration.
const PAYMENT_METHODS = [
  ['standard', 'Standard (QuickBooks + Zelle)'],
  ['cash', 'Cash'],
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
function zelleQrUrl(ev, artist, profile){
  const identifier = (profile && profile.zelle) || artist.email;
  const zelleText = `Zelle payment to ${identifier} — ${money(zelleBalance(ev))} for ${artist.name} (${ev.type}, ${fmtDateShort(ev.date)})`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(zelleText)}`;
}
function renderZelleQrBlock(ev, artist){
  const profile = zelleProfileForEvent(ev, artist);
  const usingRealQr = !!(profile && profile.zelleQrDataUrl);
  const label = (profile && (profile.zelleRecipientLabel || profile.zelle)) || artist.email;
  return `<div style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px;background:var(--surface-2);border-radius:var(--r-md);">
    <img src="${usingRealQr? profile.zelleQrDataUrl : zelleQrUrl(ev,artist,profile)}" alt="Zelle QR code" width="180" height="180" style="border-radius:8px;background:#fff;padding:8px;"/>
    <span class="u-mono" style="font-size:11.5px;color:var(--ink-2);">${esc(label)}</span>
    ${profile && profile.zelleInstructions? `<span style="font-size:11px;color:var(--ink-3);text-align:center;">${esc(profile.zelleInstructions)}</span>` : ''}
  </div>
  ${usingRealQr? '' : `<p style="font-size:10.5px;color:var(--ink-3);margin:14px 0 0;text-align:center;">QR points to a mock Zelle reference — upload this artist's real Zelle QR on their Payee Profile once available.</p>`}`;
}
function renderReminderPreview(){
  const ev = getEvent(S.eventId); if(!ev) return '';
  const artist = artistById(ev.artistId);
  const balance = zelleBalance(ev);
  return `<div class="overlay center" data-action="overlay-close-reminderpreview">
    <div class="doc" data-stop style="width:440px;">
      <div class="sheet-head"><h2 style="font-size:1.1rem;">Reminder Email Preview</h2><button class="icon-btn" data-action="close-reminder-preview">${ICO.x}</button></div>
      <div class="doc-body" style="padding:24px 26px 30px;">
        <div style="font-size:12.5px;line-height:1.6;margin-bottom:16px;">
          <div><strong>To:</strong> ${esc(ev.clientEmail)}</div>
          <div><strong>Subject:</strong> Balance reminder — ${esc(artist.name)}, ${esc(fmtDateShort(ev.date))}</div>
          <hr style="border:none;border-top:1px solid var(--border);margin:10px 0;"/>
          <p style="margin:0 0 8px;">Hi ${esc(ev.clientName.split(' ')[0])},</p>
          <p style="margin:0 0 8px;">Just a reminder — the remaining balance of ${money(balance)} for ${esc(artist.name)}'s ${esc(ev.type)} on ${esc(fmtDate(ev.date))} is due${isStandardPayment(ev)? ' via Zelle. Scan the code below or send to '+esc(artist.email) : ` (${esc(paymentMethodLabel(ev))})`}.</p>
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
  const balance = zelleBalance(ev);
  const busy = !!S.bookingConfirmationBusy;
  return `<div class="overlay center" data-action="overlay-close-bookingconfirmation">
    <div class="doc" data-stop style="width:440px;">
      <div class="sheet-head"><h2 style="font-size:1.1rem;">Booking Confirmation</h2><button class="icon-btn" data-action="close-booking-confirmation">${ICO.x}</button></div>
      <div class="doc-body" style="padding:24px 26px 30px;">
        <div style="font-size:12.5px;line-height:1.6;margin-bottom:16px;">
          <div><strong>To:</strong> ${esc(ev.clientEmail)}</div>
          <div><strong>Subject:</strong> You're booked! — ${esc(artist.name)}, ${esc(fmtDateShort(ev.date))}</div>
          <hr style="border:none;border-top:1px solid var(--border);margin:10px 0;"/>
          <p style="margin:0 0 8px;">Hi ${esc(ev.clientName.split(' ')[0])},</p>
          <p style="margin:0 0 8px;">You're all set — ${esc(artist.name)} is booked for your ${esc(ev.type)} on ${esc(fmtDate(ev.date))} at ${esc(fmtTime(ev.time))}.</p>
          ${hasLocation(ev)? `<p style="margin:0 0 8px;">Venue: ${esc(fullLocation(ev))} — <a href="${gmapsUrl(ev)}" target="_blank" rel="noopener" style="color:var(--accent);">Open in Maps</a></p>` : ''}
          <p style="margin:0 0 8px;">Remaining balance of ${money(balance)} is due before the event${isStandardPayment(ev)? ' via Zelle — scan the code below or send directly to '+esc(artist.email) : ` (${esc(paymentMethodLabel(ev))})`}.</p>
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
      <div class="sheet-head"><h2 style="font-size:1.1rem;">${ICO.check} Artist Added</h2><button class="icon-btn" data-action="close-welcome">${ICO.x}</button></div>
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
  const sm = statusMeta(ev);
  const steps = [
    {key:'lead', label:'Lead'}, {key:'negotiating', label:'Negotiating'}, {key:'contract_sent', label:'Contract Sent'},
    {key:'booked', label:'Booked'}, {key:'paid', label:'Paid in Full'},
  ];
  const order = ['lead','negotiating','contract_sent','booked','paid'];
  const curIdx = ev.status==='paid' ? 4 : order.indexOf(ev.status);

  return `<div class="overlay" data-action="overlay-close">
    <div class="sheet" data-stop>
      ${S.showEventMenu? `<div class="kebab-scrim"></div>`:''}
      <div class="sheet-head">
        <div style="display:flex;align-items:center;gap:10px;">
          <span class="avatar" data-slot="${a.slot}" style="width:38px;height:38px;">${a.initials}</span>
          <div><strong style="font-family:var(--font-display);font-size:1.2rem;display:block;">${esc(a.name)}</strong>
          <span class="pill ${sm.cls}">${sm.label}</span></div>
        </div>
        <div class="kebab-menu-wrap" style="display:flex;gap:4px;align-items:center;position:relative;">
          ${isAdmin? `<button class="icon-btn" data-action="open-edit-event" title="Edit details">${ICO.edit}</button>`:''}
          <button class="icon-btn" data-action="toggle-event-menu">${ICO.kebab}</button>
          ${S.showEventMenu? `<div class="kebab-dropdown">
            <button class="kebab-item" data-action="share-event" data-id="${ev.id}">${ICO.share} Share</button>
            <button class="kebab-item danger" data-action="delete-event" data-id="${ev.id}">${ICO.trash} Delete ${ev.unpaid?'Internal Day':ev.status==='lead'?'Lead':'Gig'}</button>
          </div>`:''}
          <button class="icon-btn" data-action="close-sheet">${ICO.x}</button>
        </div>
      </div>
      <div class="sheet-body">

        ${!ev.unpaid ? `<div class="timeline">
          ${steps.map((s,i)=>`<div class="tl-step ${i<curIdx?'done':''} ${i===curIdx?'current':''}"><span class="tl-line"></span>
            <span class="tl-dot">${i<curIdx?ICO.check:i+1}</span><span class="tl-label">${s.label}</span></div>`).join('')}
        </div>` : ''}

        <div class="card card-pad" style="display:flex;flex-direction:column;gap:9px;">
          ${!ev.unpaid ? `<div style="display:flex;justify-content:space-between;font-size:13.5px;"><span style="color:var(--ink-2);">${ICO.pin} Client</span><strong>${esc(ev.clientName)}</strong></div>` : ''}
          <div style="display:flex;justify-content:space-between;font-size:13.5px;"><span style="color:var(--ink-2);">Type</span><strong>${esc(ev.type)}</strong></div>
          ${ev.type==='Wedding' ? `<div style="display:flex;justify-content:space-between;font-size:13.5px;"><span style="color:var(--ink-2);">Band</span><strong style="text-align:right;">${ev.band? esc(ev.band) : `<span style="color:var(--ink-3);font-weight:500;">${isAdmin?'Not set':'TBD'}</span>`}${ev.bandSize?`<br/><span style="font-weight:500;color:var(--ink-2);">${esc(String(ev.bandSize))} piece${Number(ev.bandSize)===1?'':'s'}</span>`:''}</strong></div>` : ''}
          <div style="display:flex;justify-content:space-between;font-size:13.5px;"><span style="color:var(--ink-2);">${ICO.clock} Date &amp; Time</span><strong class="u-mono">${fmtDate(ev.date)} · ${fmtTimeRange(ev.time, ev.endTime)}</strong></div>
          <div style="display:flex;justify-content:space-between;font-size:13.5px;">
            <span style="color:var(--ink-2);">${ICO.pin} Venue</span>
            <span style="text-align:right;">
              <strong>${ev.venue? esc(ev.venue) : `<span style="color:var(--ink-3);font-weight:500;">TBD</span>`}${(ev.city||ev.state)?`<br/><span style="font-weight:500;color:var(--ink-2);">${esc(ev.city)}${ev.city&&ev.state?', ':''}${esc(ev.state)}</span>`:''}</strong>
              ${hasLocation(ev)? `<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:4px;">
                <a href="${gmapsUrl(ev)}" target="_blank" rel="noopener" style="font-size:11px;font-weight:700;color:var(--accent);text-decoration:none;">Maps</a>
                <a href="${wazeUrl(ev)}" target="_blank" rel="noopener" style="font-size:11px;font-weight:700;color:var(--accent);text-decoration:none;">Waze</a>
              </div>`:''}
            </span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:13.5px;">
            <span style="color:var(--ink-2);">Dress Code</span>
            <span style="display:flex;align-items:center;gap:6px;">
              <strong style="text-align:right;">${ev.dressCode? esc(ev.dressCode) : `<span style="color:var(--ink-3);font-weight:500;">${isAdmin?'Not set':'TBD'}</span>`}</strong>
              ${isAdmin? `<button class="icon-btn" data-action="open-dresscode-form" style="width:20px;height:20px;" title="Edit dress code">${ICO.edit}</button>`:''}
            </span>
          </div>
          ${isAdmin && !ev.unpaid?`<div style="display:flex;justify-content:space-between;font-size:13.5px;"><span style="color:var(--ink-2);">${ICO.mail} Contact</span><strong style="text-align:right;">${esc(ev.clientEmail)}<br/><span style="font-weight:500;color:var(--ink-2);">${esc(ev.clientPhone)}</span></strong></div>`:''}
          ${isAdmin && !ev.unpaid && !isStandardPayment(ev) ? `<div style="display:flex;justify-content:space-between;font-size:13.5px;"><span style="color:var(--ink-2);">${ICO.money} Payment Method</span><strong style="text-align:right;color:var(--warn-ink);">${esc(paymentMethodLabel(ev))}${ev.paymentMethodNote?`<br/><span style="font-weight:500;color:var(--ink-2);">${esc(ev.paymentMethodNote)}</span>`:''}</strong></div>` : ''}
        </div>

        ${isAdmin ? renderLeadContractsCard(ev) : ''}
        ${renderConflictWarning(ev)}
        ${isInternational(ev) && !ev.intlOpportunityDismissed && !isPast(ev.date) ? `<div class="card card-pad" style="border-color:var(--accent);background:var(--accent-wash);">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
            <div style="display:flex;align-items:center;gap:8px;color:var(--accent-ink);font-weight:700;font-size:13px;">${ICO.plane} ${esc(a.name)} will be in ${esc(ev.city)}, ${esc(ev.state)}</div>
            ${isAdmin?`<button class="icon-btn" data-action="dismiss-intl" data-id="${ev.id}" title="Dismiss" style="width:22px;height:22px;color:var(--accent-ink);flex:none;">${ICO.x}</button>`:''}
          </div>
          ${isAdmin? `<p style="font-size:12.5px;color:var(--accent-ink);margin:6px 0 0;">Worth reaching out to contacts nearby — a good window to line up more bookings while ${esc(a.name.split(' ')[0])} is already out there.</p>` : `<p style="font-size:12.5px;color:var(--accent-ink);margin:6px 0 0;">Let the office know if you have contacts nearby — good window to add more bookings on this trip.</p>`}
        </div>` : ''}
        ${renderFlightBlock(ev, isAdmin)}
        ${renderGroundTransportBlock(ev, isAdmin)}
        ${isAdmin && (ev.flightNeeded || ev.groundTransportNeeded) ? renderTravelRequestSummary(ev) : ''}
        ${(ev.flightBooked || ev.groundTransportBooked) ? `<div style="display:flex;gap:8px;">
          <button class="btn" style="flex:1;justify-content:flex-start;" data-action="view-itinerary" data-id="${ev.id}">${ICO.suitcase} View Itinerary</button>
          ${isAdmin? `<button class="btn btn-sm" data-action="email-itinerary" data-id="${ev.id}">${ICO.mail} Email to Artist</button>` : ''}
        </div>` : ''}
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
        ${!ev.unpaid ? `<button class="btn btn-sm btn-ghost" data-action="view-contract" data-id="${ev.id}" style="justify-content:flex-start;color:var(--ink-2);">${ICO.leads} ${ev.status==='lead'?'Preview Draft Contract':'View Contract'}</button>` : ''}
        ${!ev.unpaid ? renderLedger(ev, isAdmin, {compact:true}) : ''}

        <div>
          <div class="section-head" style="margin-bottom:8px;"><h2 style="font-size:1rem;">Activity</h2></div>
          <div class="log">${ev.log.slice().reverse().map(l=>`<div class="log-item">
            <span class="log-ico ${l.type==='warning'?'warn':''}">${l.type==='email'?ICO.mail:l.type==='sms'?ICO.sms:l.type==='success'?ICO.check:l.type==='warning'?ICO.alert:ICO.bell}</span>
            <span><div>${esc(l.text)}</div><div class="log-time">${new Date(l.ts).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</div></span>
          </div>`).join('')}</div>
        </div>
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
        <span>${fmtDateShort(c.date)} — ${c.clientName ? `${esc(c.clientName)} (${esc(c.type)})` : esc(c.type)}${c.date!==ev.date?' · overlaps via flight travel':''}</span>
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
      <div style="display:flex;align-items:center;gap:8px;color:var(--warn-ink);font-weight:700;font-size:13px;">${ICO.plane} Flight needed — booking secretary notified</div>
      <button class="btn btn-sm" style="margin-top:10px;" data-action="open-flight-form" data-id="${ev.id}">Add flight info</button>
    </div>`;
  }
  const f = ev.flight;
  const trackable = !!(f.flightNumber || (f.confirmation && f.confirmation!=='—'));
  const checking = S.checkingFlightId===ev.id;
  return `<div class="card card-pad">
    <div style="display:flex;align-items:center;gap:8px;font-weight:700;font-size:13px;color:var(--good-ink);">${ICO.plane} Flight booked</div>
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
        <button class="btn btn-sm" data-action="check-flight-status" data-id="${ev.id}" ${checking?'disabled':''} style="min-width:118px;justify-content:center;">${checking? markLoader(12) : 'Check for Update'}</button>
      </div>
      ${f.trackingStatusAt? `<div style="font-size:11px;color:var(--ink-3);margin-top:6px;">Last checked ${new Date(f.trackingStatusAt).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})} — emailed to ${artistById(ev.artistId).name} in an ASP-branded update.</div>` : ''}
    </div>` : ''}
  </div>`;
}
function renderGroundTransportBlock(ev, isAdmin){
  if(!ev.groundTransportNeeded) return isAdmin ? `<button class="btn btn-ghost" data-action="toggle-ground-transport" data-id="${ev.id}" style="justify-content:flex-start;color:var(--ink-2);">${ICO.checkSquare} Mark ground transport needed</button>` : '';
  if(!ev.groundTransportBooked){
    if(!isAdmin) return '';
    return `<div class="card card-pad" style="border-color:var(--warn);background:var(--warn-wash);">
      <div style="display:flex;align-items:center;gap:8px;color:var(--warn-ink);font-weight:700;font-size:13px;">${ICO.car} Driver needed — booking secretary notified</div>
      <button class="btn btn-sm" style="margin-top:10px;" data-action="open-transport-form" data-id="${ev.id}">Add driver info</button>
    </div>`;
  }
  const g = ev.groundTransport;
  return `<div class="card card-pad">
    <div style="display:flex;align-items:center;gap:8px;font-weight:700;font-size:13px;color:var(--good-ink);">${ICO.car} Driver booked</div>
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
function renderLedger(ev, isAdmin, opts={}){
  const extras = ev.charges||[];
  const extrasSum = chargesTotal(ev);
  const total = ev.price + extrasSum;
  const artistTotal = zelleBalance(ev);
  const compact = !!opts.compact;
  return `<div class="card card-pad" style="${compact?'padding:12px 14px;':''}">
    <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:6px;">
      <div class="u-label">Price Breakdown</div>
      ${isAdmin? `<button class="btn btn-sm btn-ghost" data-action="toggle-add-charge" data-id="${ev.id}" style="padding:2px 6px;">${S.showAddCharge?'Cancel':'+ Add Charge'}</button>`:''}
    </div>
    <div class="ledger" style="${compact?'font-size:11.5px;':''}">
      ${isAdmin? `<div class="ledger-row"><span>Performance Fee</span><span class="amt">${money(ev.price)}</span></div>` : ''}
      ${extras.map(c=>`<div class="ledger-row"><span>${esc(c.label)}${c.addedAfterSigning?` <span class="pill pill-warn" style="padding:1px 6px;font-size:9px;vertical-align:1px;">notify client</span>`:''}${isAdmin?` <a href="#" data-action="remove-charge" data-id="${ev.id}" data-chargeid="${c.id}" style="color:var(--crit);text-decoration:none;margin-left:4px;">×</a>`:''}</span><span class="amt">${money(c.amount)}</span></div>`).join('')}
      ${S.showAddCharge? renderAddChargeRow(ev) : ''}
      ${isAdmin? `<div class="ledger-row"><span>Total charged to client</span><span class="amt">${money(total)}</span></div>` : ''}
      <div class="ledger-row"><span>ASP booking fee ${ev.depositReceived?'· received':`· due via ${esc(paymentMethodLabel(ev))}`}</span><span class="amt">${money(ev.commission)}</span></div>
      <div class="ledger-row total"><span>${isAdmin?'Artist payout (85% + charges, via Zelle)':'You walk away with'}</span><span class="amt">${money(artistTotal)}</span></div>
      <div class="ledger-row"><span>Balance status</span><span class="amt">${ev.balanceReceived? `Received ${fmtDateShort(ev.balanceReceivedDate)}` : (ev.depositReceived? (isStandardPayment(ev)?'Pending — reminders active':'Pending — follow up directly'):'—')}</span></div>
    </div>
  </div>`;
}

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

function renderPrepSheets(ev, isAdmin){
  const files = ev.prepSheets||[];
  return `<div class="u-label" style="margin-bottom:8px;">Prep Sheets</div>
    ${files.length? `<div class="log" style="margin-bottom:${isAdmin?'10px':'0'};">${files.map(f=>`
      <div class="log-item" style="align-items:center;">
        <span class="log-ico">${ICO.leads}</span>
        <span style="flex:1;">${esc(f.name)}<div class="log-time">Added ${fmtDateShort(f.uploadedAt)}</div></span>
        <a href="${f.dataUrl}" target="_blank" rel="noopener" class="btn btn-sm">View</a>
        ${isAdmin?`<button class="icon-btn" data-action="remove-prep" data-id="${ev.id}" data-prepid="${f.id}" title="Remove">${ICO.x}</button>`:''}
      </div>`).join('')}</div>` : `<p style="font-size:12.5px;color:var(--ink-3);margin:0 0 ${isAdmin?'10px':'0'};">No prep sheets uploaded yet.</p>`}
    ${isAdmin? `<label class="btn btn-sm" style="cursor:pointer;display:inline-flex;">Upload File<input type="file" data-action="upload-prep" data-id="${ev.id}" multiple style="display:none;"/></label>` : ''}`;
}

/* ============ GIG INFO SHEET ============ */
// Paste/write free-text gig info + a contact list (name/role/phone/email, click-to-copy),
// available from the event sheet the same place Prep Sheets is -- printable via the same
// print-host pattern as the Contract/Itinerary docs (renderItineraryDoc above).
function gigInfoSheetOf(ev){ return ev.gigInfoSheet || {text:'', contacts:[], updatedAt:null}; }
function renderContactCopyRow(c, ev){
  return `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:1px dashed var(--border);font-size:12.5px;">
    <span style="flex:1;min-width:0;"><strong>${esc(c.name)}</strong>${c.role?` <span style="color:var(--ink-3);">· ${esc(c.role)}</span>`:''}</span>
    <span style="display:flex;gap:6px;flex:none;">
      ${c.phone? `<button class="btn btn-sm btn-ghost" data-action="copy-text" data-value="${esc(c.phone)}" title="Copy phone">${esc(c.phone)}</button>`:''}
      ${c.email? `<button class="btn btn-sm btn-ghost" data-action="copy-text" data-value="${esc(c.email)}" title="Copy email">${esc(c.email)}</button>`:''}
    </span>
  </div>`;
}
function renderGigInfoCard(ev, isAdmin){
  if(ev.unpaid) return '';
  const sheet = gigInfoSheetOf(ev);
  const hasContent = sheet.text || (sheet.contacts||[]).length;
  return `<div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:8px;">
      <div class="u-label">Gig Info Sheet</div>
      ${isAdmin? `<button class="btn btn-sm btn-ghost" data-action="open-giginfo-form" data-id="${ev.id}" style="padding:2px 6px;">${hasContent?'Edit':'+ Add'}</button>`:''}
    </div>
    ${!hasContent? `<p style="font-size:12.5px;color:var(--ink-3);margin:0;">No gig info sheet yet.</p>` : `
      ${sheet.text? `<p style="font-size:12.5px;color:var(--ink);white-space:pre-wrap;margin:0 0 10px;">${esc(sheet.text)}</p>` : ''}
      ${(sheet.contacts||[]).length? `<div style="margin-bottom:10px;">${sheet.contacts.map(c=>renderContactCopyRow(c, ev)).join('')}</div>` : ''}
      <button class="btn btn-sm" data-action="view-giginfo" data-id="${ev.id}">${ICO.leads} View / Print</button>
      ${sheet.updatedAt? `<span style="font-size:10.5px;color:var(--ink-3);margin-left:8px;">Updated ${fmtDateShort(sheet.updatedAt)}</span>`:''}
    `}`;
}
// His ask (2026-10-06): Prep Sheets (file uploads) and Gig Info Sheet (text notes + contacts)
// used to be two separate cards stacked on top of each other -- same "everything the artist needs
// for this gig" purpose, just two different content types, so merged into one card with a divider
// between the two sub-sections. Data model unchanged (ev.prepSheets[] / ev.gigInfoSheet stay
// separate fields -- different shapes, no reason to force them into one).
function renderPrepAndGigInfoCard(ev, isAdmin){
  const giginfo = renderGigInfoCard(ev, isAdmin);
  return `<div class="card card-pad">
    ${renderPrepSheets(ev, isAdmin)}
    ${giginfo? `<div style="height:1px;background:var(--border);margin:14px 0;"></div>${giginfo}` : ''}
    ${isAdmin? `<p style="font-size:10.5px;color:var(--ink-3);margin:10px 0 0;">Files are stored directly on the event record, not in a dedicated file-storage service.</p>` : ''}
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
      <div class="sheet-head"><h2 style="font-size:1.2rem;">Gig Info Sheet</h2><button class="icon-btn" data-action="close-giginfo-form">${ICO.x}</button></div>
      <div class="sheet-body">
        <div class="field"><label>Gig Info</label>
          <textarea data-field="text" rows="8" placeholder="Paste or write everything the artist needs to know — schedule, sound check, meal info, special requests...">${esc(f.text!==undefined?f.text:sheet.text)}</textarea>
        </div>
        <div class="field">
          <label>Contacts</label>
          ${contacts.length? `<div style="margin-bottom:8px;">${contacts.map(c=>`
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12.5px;padding:4px 0;">
              <span>${esc(c.name)}${c.role?` · ${esc(c.role)}`:''} ${c.phone?`— ${esc(c.phone)}`:''} ${c.email?`— ${esc(c.email)}`:''}</span>
              <button class="icon-btn" data-action="remove-gig-contact" data-id="${ev.id}" data-contactid="${c.id}" title="Remove" style="width:20px;height:20px;">${ICO.x}</button>
            </div>`).join('')}</div>` : ''}
          <div data-form="gigcontact" style="display:flex; gap:6px; padding:8px 0; border-top:1px dashed var(--border); align-items:flex-end; flex-wrap:wrap;">
            <div class="field" style="flex:1;min-width:100px;"><label style="font-size:10px;">Name</label><input data-field="name" value="${esc(cf.name||'')}" placeholder="Venue coordinator"/></div>
            <div class="field" style="flex:1;min-width:100px;"><label style="font-size:10px;">Role</label><input data-field="role" value="${esc(cf.role||'')}" placeholder="Optional"/></div>
            <div class="field" style="flex:1;min-width:110px;"><label style="font-size:10px;">Phone</label><input data-field="phone" value="${esc(cf.phone||'')}" placeholder="(555) 555-5555"/></div>
            <div class="field" style="flex:1;min-width:130px;"><label style="font-size:10px;">Email</label><input data-field="email" value="${esc(cf.email||'')}" placeholder="name@example.com"/></div>
            <button class="btn btn-sm" data-action="add-gig-contact" data-id="${ev.id}">+ Add</button>
          </div>
        </div>
        <button class="btn btn-primary btn-block" data-action="save-giginfo" data-id="${ev.id}" style="margin-top:6px;">Save &amp; Notify Artist</button>
      </div>
    </div>
  </div>`;
}
function renderGigInfoDoc(){
  const ev = getEvent(S.gigInfoDocEventId); if(!ev) return '';
  const artist = artistById(ev.artistId);
  const sheet = gigInfoSheetOf(ev);
  return `<div class="overlay center" data-action="giginfo-doc-overlay-close">
    <div class="doc" data-stop>
      <div class="sheet-head">
        <h2 style="font-size:1.1rem;">Gig Info Sheet</h2>
        <div style="display:flex;gap:6px;">
          <button class="icon-btn" data-action="print-giginfo" title="Print / Save as PDF"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-2"/><rect x="6" y="14" width="12" height="7"/></svg></button>
          <button class="icon-btn" data-action="close-giginfo-doc">${ICO.x}</button>
        </div>
      </div>
      <div class="doc-body">
        <div class="doc-letterhead">
          <div class="wordmark" style="font-size:1.1rem;"><span class="mark"><i></i><i></i><i></i><i></i><i></i></span>ASP</div>
          <span class="pill pill-good">Gig Info</span>
        </div>
        <div class="doc-title">${esc(artist.name.toUpperCase())}<br/><span style="font-size:.62em;letter-spacing:.06em;">${esc((ev.type||'').toUpperCase())}${ev.unpaid?'':` — ${esc((ev.clientName||'').toUpperCase())}`}</span></div>
        <div class="doc-sub">${fmtDate(ev.date)}${ev.venue? ` &middot; ${esc(ev.venue)}` : ''}${(ev.city||ev.state)? `, ${esc(ev.city)}${ev.city&&ev.state?', ':''}${esc(ev.state)}` : ''}</div>

        ${sheet.text? `<div class="doc-section"><h3>Details</h3><p style="font-size:12.5px;color:var(--ink-2);white-space:pre-wrap;margin:0;">${esc(sheet.text)}</p></div>` : ''}

        ${(sheet.contacts||[]).length? `<div class="doc-section"><h3>Contacts</h3>
          <div class="doc-facts">
            ${sheet.contacts.map(c=>`<div><span class="k">${esc(c.name)}${c.role?` (${esc(c.role)})`:''}</span><span>${esc(c.phone||'')}${c.phone&&c.email?' · ':''}${esc(c.email||'')}</span></div>`).join('')}
          </div>
        </div>` : ''}

        ${!sheet.text && !(sheet.contacts||[]).length? `<p style="font-size:13px;color:var(--ink-3);">No gig info added yet.</p>` : ''}

        <div class="doc-foot">This is a mockup document for demonstration purposes.</div>
      </div>
    </div>
  </div>`;
}


function renderAdminActions(ev){
  const buttons=[];
  if(ev.status==='lead'||ev.status==='negotiating'){
    buttons.push(`<button class="btn btn-primary btn-block" data-action="send-contract" data-id="${ev.id}">${ICO.mail} Send Contract + Invoice (${money(ev.commission)} booking fee)</button>`);
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

function renderFlightFormOverlay(){
  const ev = getEvent(S.eventId); if(!ev) return '';
  const f = S.flightForm;
  return `<div class="overlay center" data-action="flight-overlay-close">
    <div class="modal" data-stop data-form="flight" style="width:420px;">
      <div class="sheet-head"><h2 style="font-size:1.2rem;">Flight Info</h2><button class="icon-btn" data-action="close-flight-form">${ICO.x}</button></div>
      <div class="sheet-body">
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
        <button class="btn btn-primary btn-block" data-action="save-flight" data-id="${ev.id}">Save &amp; Notify Artist</button>
      </div>
    </div>
  </div>`;
}

function renderTransportFormOverlay(){
  const ev = getEvent(S.eventId); if(!ev) return '';
  const f = S.transportForm;
  return `<div class="overlay center" data-action="transport-overlay-close">
    <div class="modal" data-stop data-form="transport" style="width:420px;">
      <div class="sheet-head"><h2 style="font-size:1.2rem;">Ground Transport Info</h2><button class="icon-btn" data-action="close-transport-form">${ICO.x}</button></div>
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
        <button class="btn btn-primary btn-block" data-action="save-transport" data-id="${ev.id}">Save &amp; Notify Artist</button>
      </div>
    </div>
  </div>`;
}

function renderDressCodeFormOverlay(){
  const ev = getEvent(S.eventId); if(!ev) return '';
  const f = S.dressCodeForm;
  return `<div class="overlay center" data-action="dresscode-overlay-close">
    <div class="modal" data-stop data-form="dresscode" style="width:380px;">
      <div class="sheet-head"><h2 style="font-size:1.2rem;">Dress Code</h2><button class="icon-btn" data-action="close-dresscode-form">${ICO.x}</button></div>
      <div class="sheet-body">
        <div class="field"><label>Dress Code</label><input data-field="dressCode" value="${esc(f.dressCode||'')}" placeholder="e.g. Black tie, all black"/></div>
        <div class="chip-row">${DRESS_CODES.map(d=>`<button class="filter-chip" data-action="pick-dresscode" data-value="${esc(d)}">${esc(d)}</button>`).join('')}</div>
        <button class="btn btn-primary btn-block" data-action="save-dresscode" data-id="${ev.id}" style="margin-top:6px;">Save &amp; Notify Artist</button>
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
      <div class="sheet-head"><h2 style="font-size:1.3rem;">Edit ${ev.unpaid?'Internal Day':'Details'}</h2><button class="icon-btn" data-action="close-edit-event">${ICO.x}</button></div>
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
        <div class="field"><label>Venue Name</label><input data-field="venue" value="${esc(f.venue!==undefined?f.venue:(ev.venue||''))}"/></div>
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
      <div class="sheet-head"><h2 style="font-size:1.3rem;">New Invoice</h2><button class="icon-btn" data-action="close-sheet">${ICO.x}</button></div>
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
        <div class="ledger" style="margin:4px 0 0;"><div class="ledger-row total"><span>Total</span><span class="amt">${money(total)}</span></div></div>
        <button class="btn btn-primary btn-block" data-action="submit-invoice" style="margin-top:6px;">Send Invoice</button>
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
      <div class="sheet-head"><h2 style="font-size:1.3rem;">New Outside Booking</h2><button class="icon-btn" data-action="close-sheet">${ICO.x}</button></div>
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
    const next = artist ? eventsFor(artist.id).filter(e=>!isPast(e.date) && ['booked','paid'].includes(e.status)).sort((a,b)=>a.date.localeCompare(b.date))[0] : null;
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
  if(doc.subjectType==='outside'){ const b=getOutsideBooking(doc.subjectId); return b? b.performerName : 'Outside Act'; }
  return 'General';
}
function documentAttribution(doc){
  if(doc.subjectType==='artist' && doc.brand==='asp'){
    const artist = artistById(doc.subjectId);
    if(artist) return `On behalf of ${artist.name}`;
  }
  return (DOC_BRANDS[doc.brand] || DOC_BRANDS.asp).signer;
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
          ${!isNew? `<button class="icon-btn" data-action="print-document" title="Download as PDF"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-2"/><rect x="6" y="14" width="12" height="7"/></svg></button>`:''}
          <button class="icon-btn" data-action="close-sheet">${ICO.x}</button>
        </div>
      </div>
      <div class="sheet-body">
        ${isNew? `
        <div class="field"><label>Who's This For?</label>
          <div class="chip-row">
            <button class="filter-chip ${subjectType==='artist'?'sel':''}" data-action="pick-document-subject-type" data-subject="artist">One of Our Artists</button>
            <button class="filter-chip ${subjectType==='outside'?'sel':''}" data-action="pick-document-subject-type" data-subject="outside">Outside Act</button>
            <button class="filter-chip ${subjectType==='general'?'sel':''}" data-action="pick-document-subject-type" data-subject="general">General</button>
          </div>
        </div>
        ${subjectType==='artist'? `<div class="field"><label>Artist</label>
          <select class="document-subject-select">
            <option value="">Pick an artist…</option>
            ${ARTISTS.map(a=>`<option value="${a.id}" ${subjectId===a.id?'selected':''}>${esc(a.name)}</option>`).join('')}
          </select>
        </div>` : ''}
        ${subjectType==='outside'? `<div class="field"><label>Outside Booking</label>
          <select class="document-subject-select">
            <option value="">Pick a booking…</option>
            ${OUTSIDE_BOOKINGS.map(b=>`<option value="${b.id}" ${subjectId===b.id?'selected':''}>${esc(b.performerName)} — ${esc(b.clientName)}</option>`).join('')}
          </select>
        </div>` : ''}
        ` : `<p style="font-size:12px;color:var(--ink-3);margin:0;">For: <strong style="color:var(--ink);">${esc(documentSubjectLabel(existing))}</strong></p>`}

        <div class="field"><label>Title</label><input data-field="title" value="${esc(title)}" placeholder="e.g. Succos Proposal — Shmili Landau"/></div>
        <div class="field"><label>Letterhead / Signing Party</label>
          <div class="chip-row">
            <button class="filter-chip ${brand==='asp'?'sel':''}" data-action="pick-document-brand" data-brand="asp">ASP Artist Management</button>
            <button class="filter-chip ${brand==='sing'?'sel':''}" data-action="pick-document-brand" data-brand="sing">SING Entertainment</button>
          </div>
        </div>
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
  const brandInfo = DOC_BRANDS[doc.brand] || DOC_BRANDS.asp;
  return `<div class="overlay center" data-action="document-overlay-close">
    <div class="doc" data-stop>
      <div class="sheet-head"><h2 style="font-size:1.1rem;">Document Preview</h2><button class="icon-btn" data-action="close-sheet">${ICO.x}</button></div>
      <div class="doc-body">
        <div class="doc-letterhead">
          ${doc.brand==='sing'
            ? `<img src="assets/sing-entertainment-logo-dark.svg" alt="SING Entertainment" style="height:36px;"/>`
            : `<div class="wordmark" style="font-size:1.1rem;"><span class="mark"><i></i><i></i><i></i><i></i><i></i></span>ASP</div>`}
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

        <div class="doc-foot">This is a mockup document for demonstration purposes.</div>
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
          <button class="icon-btn" data-action="print-invoice" title="Print / Save as PDF"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-2"/><rect x="6" y="14" width="12" height="7"/></svg></button>
          <button class="icon-btn" data-action="close-invoice-doc">${ICO.x}</button>
        </div>
      </div>
      <div class="doc-body">
        <div class="doc-letterhead">
          <div class="wordmark" style="font-size:1.1rem;"><span class="mark"><i></i><i></i><i></i><i></i><i></i></span>ASP</div>
          <span class="pill ${inv.status==='paid'?'pill-good':'pill-warn'}">${inv.status==='paid'?'Paid':'Open'}</span>
        </div>
        <div class="doc-title">INVOICE</div>
        <div class="doc-sub">${esc(inv.id)} &middot; ${fmtDate(inv.createdAt)}</div>

        <div class="doc-parties">
          <div class="doc-party"><h4>From</h4><p><strong>ASP Artist Management</strong><br/>office@aspmanagement.com</p></div>
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
          <p style="font-size:12.5px;line-height:1.7;margin:0;">Payment via QuickBooks invoice, Zelle, or check made out to ASP Artist Management. Contact <span class="u-mono">office@aspmanagement.com</span> with questions.</p>
        </div>

        <div class="doc-foot">This is a mockup document for demonstration purposes.</div>
      </div>
    </div>
  </div>`;
}

function renderContractDoc(){
  // contractDocEventId lets the Contracts list open a contract without touching S.eventId --
  // S.eventId truthy is what makes the full event sheet render (see render()), so reusing it
  // here would silently pop that open behind the doc too (the exact bug the Travel-page
  // itinerary shortcut hit before -- see S.itineraryEventId for the same fix).
  const ev = getEvent(S.contractDocEventId || S.eventId); if(!ev) return '';
  const artist = artistById(ev.artistId);
  const isComedian = artist.role==='Comedian';
  const signed = ev.depositReceived;
  const draft = ev.status==='lead';
  return `<div class="overlay center" data-action="contract-overlay-close">
    <div class="doc" data-stop>
      <div class="sheet-head">
        <h2 style="font-size:1.1rem;">${draft?'Draft Contract Preview':'Performance Agreement'}</h2>
        <div style="display:flex;gap:6px;">
          <button class="icon-btn" data-action="print-contract" title="Print / Save as PDF"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-2"/><rect x="6" y="14" width="12" height="7"/></svg></button>
          <button class="icon-btn" data-action="close-contract">${ICO.x}</button>
        </div>
      </div>
      <div class="doc-body" id="contractDocBody">
        <div class="doc-letterhead">
          <div class="wordmark" style="font-size:1.1rem;"><span class="mark"><i></i><i></i><i></i><i></i><i></i></span>ASP</div>
          <span class="pill ${signed?'pill-good':'pill-neutral'}">${draft? 'Draft — not yet sent' : signed? 'Signed & Booking Fee Received' : 'Awaiting Signature'}</span>
        </div>
        <div class="doc-title">${esc(artist.name.toUpperCase())}<br/><span style="font-size:.62em;letter-spacing:.06em;">ARTIST AGREEMENT</span></div>
        <div class="doc-sub">Agreement ${esc(ev.id)} &middot; Prepared ${fmtDate(ev.createdAt)}</div>

        <p style="font-size:13px;line-height:1.6;">This contractual agreement is made on ${fmtDate(ev.createdAt)}, between
          <strong>${esc(artist.name)}</strong>, hereafter referred to as &ldquo;the Artist&rdquo;, and <strong>${esc(ev.clientName)}</strong>,
          hereafter referred to as &ldquo;the Client&rdquo;. It is mutually agreed between the parties, as follows: the Client hereby
          engages the Artist, and the Artist hereby agrees to perform the engagement, the terms and conditions of which are set forth herein.</p>

        <div class="doc-parties">
          <div class="doc-party"><h4>Performer</h4><p><strong>${esc(artist.name)}</strong><br/>Represented by ASP Artist Management</p></div>
          <div class="doc-party"><h4>Client / Buyer</h4><p><strong>${esc(ev.clientName)}</strong><br/>${esc(ev.clientEmail)}<br/>${esc(ev.clientPhone)}</p></div>
        </div>

        <div class="doc-section"><h3>Event Details</h3>
          <div class="doc-facts">
            <div><span class="k">1. Place of engagement</span><span>${esc(ev.venue)||'TBD'}${(ev.city||ev.state)? `, ${esc(ev.city)}${ev.city&&ev.state?', ':''}${esc(ev.state)}` : ''}</span></div>
            <div><span class="k">2. Date of engagement</span><span>${fmtDate(ev.date)}</span></div>
            <div><span class="k">3. Hours of engagement</span><span>${hoursBetween(ev.time, ev.endTime) ? hoursBetween(ev.time, ev.endTime)+' hours ('+fmtTimeRange(ev.time, ev.endTime)+')' : fmtTimeRange(ev.time, ev.endTime)}</span></div>
            <div><span class="k">4. Payment for engagement</span><span>${money(ev.price)}</span></div>
            <div><span class="k">5. Terms of engagement</span><span>${esc(artist.name)} as performer for the engagement</span></div>
          </div>
        </div>

        <div class="doc-section">
          <p style="font-size:13px;margin:0 0 4px;"><strong>Artist shall provide:</strong><br/>${artist.role==='Comedian'?'Live Comedy Performance':artist.role==='DJ'?'DJ Performance':'Live Vocal Performance'}${hoursBetween(ev.time,ev.endTime)? ` for up to ${hoursBetween(ev.time,ev.endTime)} hours`:''}</p>
          <p style="font-size:13px;margin:0;"><strong>Client shall provide:</strong><br/>Payment</p>
        </div>

        <div class="doc-section"><h3>Compensation</h3>
          <div class="ledger" style="margin-bottom:20px;">
            <div class="ledger-row total"><span>Total Fee</span><span class="amt">${money(ev.price + chargesTotal(ev))}</span></div>
          </div>
        </div>

        <div class="doc-section"><h3>Terms</h3>
          <ul class="doc-terms">
            <li>Contract is not binding until the deposit is received.</li>
            <li>Should the Artist be canceled within 40 days prior to the event, full payment is required.</li>
            <li>In the event that the Artist is unable to perform, the Client will be paid back in full.</li>
            <li>A non-refundable deposit of ${money(ev.commission)} must be paid upon signing the contract${isStandardPayment(ev)?' via QuickBooks invoice':` (${esc(paymentMethodLabel(ev))})`}. The rest of the balance must be paid prior to the event.</li>
            ${isComedian? `
            <li>No waitstaff, bar staff, or venue personnel should walk through the performance area or serve food/drinks during the performance, in order to maintain audience focus and preserve the show.</li>
            <li>Video or audio recording of the performance may not be taken or disseminated in any way without the express written consent of the Artist.</li>
            <li>The Client grants the Artist approval rights over any and all advertisements, promotional materials, and graphics referencing the performance.</li>
            ` : `
            <li>A Mechitzah is required at all events with dancing.</li>
            <li>The Artist may refuse to sing any non-Jewish or secular songs at his discretion.</li>
            `}
            <li>If the Artist is asked to stay beyond the agreed upon time, a ${money(OVERTIME_PER_HALF_HOUR)} per half hour charge shall be paid in overtime fees.</li>
            <li>If the event is cancelled due to weather or travel issues, the Artist agrees to return the deposit.</li>
            <li>Any and all changes to this agreement must be approved and initiated by both Client and Artist.</li>
            <li>${ev.flightNeeded? 'Air travel for the Performer is arranged and confirmed separately by ASP; details are provided once booked.' : 'This engagement does not include Performer travel arrangements.'}</li>
          </ul>
        </div>

        <div class="doc-sign">
          <div class="doc-sign-line">${signed? `<span class="doc-signature">${esc(ev.clientName)}</span><br/>Signed electronically &middot; ${fmtDateShort(ev.depositReceivedDate)}` : `<strong>&nbsp;</strong>Client Signature &middot; Date`}</div>
          <div class="doc-sign-line">${signed? `<span class="doc-signature">${esc(artist.name)}</span><br/>` : `<strong>ASP Artist Management</strong>`}For ${esc(artist.name)}</div>
        </div>

        <div class="doc-section"><h3>Payment</h3>
          <p style="font-size:12.5px;line-height:1.7;margin:0;">
            <strong>Booking Fee</strong> (${money(ev.commission)}) — emailed as a QuickBooks invoice upon signing; pay by card or ACH directly from the invoice.<br/>
            <strong>Balance</strong> (${money(zelleBalance(ev))}) — Zelle to <span class="u-mono">${esc(artist.email)}</span>, due no later than the day of the event.<br/>
            Prefer to pay by check? Contact <span class="u-mono">office@aspmanagement.com</span> to arrange.
          </p>
        </div>

        <div class="doc-foot">This is a mockup document for demonstration purposes. Payment link and Zelle details are sent with the live email.</div>
      </div>
    </div>
  </div>`;
}

/* ============ CONTRACT BUILDER UI ============ */
function renderLeadContractsCard(ev){
  if(ev.unpaid) return ''; // internal days never get contracts
  const contracts = contractsForLead(ev.id);
  return `<div class="card card-pad" style="display:flex;flex-direction:column;gap:10px;">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <h3 style="font-size:14px;margin:0;">Contracts</h3>
      <button class="btn btn-sm btn-primary" data-action="create-contract" data-id="${ev.id}">${ICO.plus} Create Contract</button>
    </div>
    ${contracts.length? `<div class="log">${contracts.map(c=>`
      <div class="log-item" style="cursor:pointer;align-items:center;" data-action="open-contract-builder" data-id="${c.id}">
        <div class="log-ico">${ICO.leads}</div>
        <div style="flex:1;min-width:0;"><strong style="font-size:12.5px;">${esc(contractTemplateLabel(c.template))}</strong><br/><span class="log-time">${fmtDateShort(c.createdAt)}</span></div>
        <span class="pill ${contractStatusPillClass(c.status)}">${contractStatusLabel(c.status)}</span>
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
      <div class="sheet-head"><h2 style="font-size:1.2rem;">Choose a Contract Template</h2><button class="icon-btn" data-action="close-template-picker">${ICO.x}</button></div>
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
        <button class="btn btn-sm" data-action="check-flight-status" data-id="${tr.id}" data-seg="${seg.id}" ${S.flightStatusBusy===seg.id?'disabled':''}>${S.flightStatusBusy===seg.id?'Checking…':'Check Status'}</button>
        <button class="icon-btn" data-action="remove-flight-segment" data-id="${tr.id}" data-seg="${seg.id}" title="Remove">${ICO.x}</button>
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
          <button class="icon-btn" data-action="delete-travel-request" data-id="${tr.id}" title="Delete">${ICO.trash}</button>
          <button class="icon-btn" data-action="close-travel-request-detail">${ICO.x}</button>
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
function renderSendContractConfirmModal(){
  const c = getContract(S.contractBuilderId); if(!c) return '';
  const f = S.sendContractForm||{};
  const busy = !!S.sendContractBusy;
  return `<div class="overlay center" data-action="sendcontract-overlay-close">
    <div class="modal" data-stop data-form="sendcontract" style="width:420px;">
      <div class="sheet-head"><h2 style="font-size:1.2rem;">Send Contract</h2><button class="icon-btn" data-action="close-send-contract-confirm" ${busy?'disabled':''}>${ICO.x}</button></div>
      <div class="sheet-body" style="display:flex;flex-direction:column;gap:10px;">
        <div class="field"><label>To</label><input data-field="to" type="email" value="${esc(f.to||'')}" placeholder="client@email.com" ${busy?'disabled':''}/></div>
        <div class="field"><label>Subject</label><input data-field="subject" value="${esc(f.subject||'')}" ${busy?'disabled':''}/></div>
        <p style="font-size:11.5px;color:var(--ink-3);margin:0;">Sends the contract exactly as shown in the preview, as an email the client can read directly.</p>
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
      <div class="sheet-head"><h2 style="font-size:1.2rem;">Verify Deposit &amp; Confirm Booking</h2><button class="icon-btn" data-action="close-verify-deposit">${ICO.x}</button></div>
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
          <span class="pill ${contractStatusPillClass(c.status)}">${contractStatusLabel(c.status)}</span>
        </div>
        <div style="display:flex;gap:6px;">
          <button class="icon-btn" data-action="view-contract-builder-doc" title="Preview &amp; Print">${ICO.leads}</button>
          <button class="icon-btn" data-action="delete-contract" title="Delete">${ICO.trash}</button>
          <button class="icon-btn" data-action="close-contract-builder">${ICO.x}</button>
        </div>
      </div>
      <div class="sheet-body">
        <div class="field"><label>Status</label>
          <div class="chip-row">${['draft','sent','signed','void'].map(s=>`<button class="filter-chip ${c.status===s?'sel':''}" data-action="set-contract-status" data-status="${s}">${contractStatusLabel(s)}</button>`).join('')}</div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;background:var(--surface-2);">
          ${c.approvedAt
            ? `<span class="pill pill-good">Approved for sending — ${adminById(c.approvedBy)?adminById(c.approvedBy).name:'admin'}, ${fmtDateShort(c.approvedAt.slice(0,10))}</span>
               <button class="btn btn-sm btn-ghost" data-action="revoke-contract-approval" data-id="${c.id}">Revoke</button>`
            : `<span class="pill pill-neutral">Not yet approved — money/terms must be approved before this contract can be sent</span>
               <button class="btn btn-sm" data-action="approve-contract-for-sending" data-id="${c.id}">Approve for Sending</button>`}
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
        ${!isCreative? `<div class="field"><label>Hours of Engagement</label><input data-contract-field="top.hoursOfEngagement" value="${esc(c.hoursOfEngagement||'')}" placeholder="e.g. 5 hours"/></div>` : ''}

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
        ${renderContractDocSettingsSection(c)}
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
      <div class="field"><label>Deposit (% of total, optional)</label><input type="number" data-contract-field="deposit.percent" data-focus-key="deposit.percent" data-live value="${c.deposit.percent||0}" placeholder="0 = use $ amount"/></div>
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
      <div class="field"><label>Overtime Rate ($)</label><input type="number" data-contract-field="overtime.rate" value="${c.overtime.rate||0}" ${c.overtime.interval==='not_applicable'?'disabled':''}/></div>
      <div class="field"><label>Per</label>
        <div class="chip-row">
          ${['half_hour','15_min','hour','not_applicable'].map(iv=>`<button class="filter-chip ${c.overtime.interval===iv?'sel':''}" data-action="pick-contract-overtime-interval" data-value="${iv}">${iv==='not_applicable'?'Not applicable':overtimeIntervalLabel(iv)}</button>`).join('')}
        </div>
      </div>
    </div>` : ''}
    <div class="ledger" style="margin-top:4px;">
      <div class="ledger-row"><span>Total</span><span class="amt">${money(figures.total)}</span></div>
      <div class="ledger-row"><span>Deposit${c.deposit.percent?` (${c.deposit.percent}%)`:''}</span><span class="amt">${money(figures.deposit)}</span></div>
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
        <input type="number" data-contract-field="tier.${t.id}.percent" value="${t.percent}" style="width:70px;"/>
        <span style="font-size:12px;color:var(--ink-3);">%</span>
        <button class="icon-btn" data-action="remove-cancellation-tier" data-id="${t.id}" title="Remove" style="flex:none;">${ICO.trash}</button>
      </div>`).join('')}
      <button class="btn btn-sm" data-action="add-cancellation-tier" data-id="${c.id}">${ICO.plus} Add Tier</button>
    </div>` : ''}
    <p style="font-size:11px;color:var(--ink-3);margin:0;">Preview: ${esc(contractCancellationText(c))}</p>
  </div>`;
}
function renderContractBoilerplateSection(c){
  return `<div class="card card-pad" style="display:flex;flex-direction:column;gap:8px;">
    <h3 style="font-size:13.5px;margin:0;">Boilerplate Clauses</h3>
    ${BOILERPLATE_TOGGLES.map(([key,label])=>`<label style="display:flex;align-items:center;gap:8px;font-size:12.5px;">
      <input type="checkbox" data-contract-field="boilerplate.${key}" ${c.boilerplate[key]?'checked':''}/> ${esc(label)}
    </label>`).join('')}
  </div>`;
}
const CLIENT_PROVIDES_SUGGESTIONS = ['Stage','Sound & Lighting per Artist specs','AV/Backline per Artist specs','Wired Microphone & Spotlight','Green Room','Appropriate Venue & Sound System'];
function renderContractProvidesSection(c){
  return `<div class="card card-pad" style="display:flex;flex-direction:column;gap:10px;">
    <h3 style="font-size:13.5px;margin:0;">Artist Shall Provide</h3>
    <input data-contract-field="top.artistProvides" value="${esc(c.artistProvides||'')}" placeholder="e.g. Vocal performance for up to 5 hours"/>
    <h3 style="font-size:13.5px;margin:10px 0 0;">Client Shall Provide</h3>
    <div class="chip-row">${CLIENT_PROVIDES_SUGGESTIONS.map(s=>`<button class="filter-chip" data-action="add-client-provides" data-id="${c.id}" data-label="${esc(s)}">${ICO.plus} ${esc(s)}</button>`).join('')}</div>
    ${c.clientProvides.length? `<div class="chip-row">${c.clientProvides.map((label,idx)=>`<span class="filter-chip sel" style="display:flex;align-items:center;gap:6px;">${esc(label)} <button data-action="remove-client-provides" data-id="${c.id}" data-idx="${idx}" style="background:none;border:none;cursor:pointer;color:inherit;">${ICO.x}</button></span>`).join('')}</div>` : `<p style="font-size:12px;color:var(--ink-3);margin:0;">None yet.</p>`}
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
function renderContractDocSettingsSection(c){
  return `<div class="card card-pad" style="display:flex;flex-direction:column;gap:10px;">
    <h3 style="font-size:13.5px;margin:0;">Letterhead</h3>
    <div class="chip-row">${Object.keys(DOC_BRANDS).map(k=>`<button class="filter-chip ${c.brand===k?'sel':''}" data-action="pick-contract-brand" data-value="${k}">${esc(DOC_BRANDS[k].label)}</button>`).join('')}</div>
    <label style="display:flex;align-items:center;gap:8px;font-size:12.5px;"><input type="checkbox" data-contract-field="top.bsdHeader" ${c.bsdHeader?'checked':''}/> Show "BS"D" header</label>
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
        <button class="icon-btn" data-action="remove-line-item" data-id="${li.id}" title="Remove" style="flex:none;">${ICO.trash}</button>
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
      <button class="icon-btn" data-action="remove-add-on" data-id="${a.id}" title="Remove" style="flex:none;">${ICO.trash}</button>
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
        <button class="icon-btn" data-action="remove-custom-clause" data-id="${cc.id}" title="Remove" style="flex:none;">${ICO.trash}</button>
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
        <div style="display:flex;gap:6px;">
          ${c ? `<button class="icon-btn" data-action="open-send-contract" data-id="${c.id}" title="Send Contract"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/></svg></button>` : ''}
          <button class="icon-btn" data-action="print-contract-builder" title="Print / Save as PDF"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-2"/><rect x="6" y="14" width="12" height="7"/></svg></button>
          <button class="icon-btn" data-action="close-contract-builder-doc">${ICO.x}</button>
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
  if(profile.notes) lines.push(esc(profile.notes));
  if(profile.zelle) lines.push('IMPORTANT: Payments sent via Zelle must include event date/details in description. Otherwise, we cannot guarantee your deposit will be applied to your event.');
  return lines.length? `<div class="doc-section"><h3>Payment</h3><p style="font-size:12.5px;line-height:1.8;margin:0;">${lines.join('<br/>')}</p></div>` : '';
}
// Electronic signature: matches the app's existing convention (see renderContractDoc/renderDocumentDoc)
// of rendering a typed name in a cursive script once accepted, rather than a blank line -- also the
// real-world behavior every "Acceptance" boilerplate clause already describes (deposit payment has
// "the same effect as a signature"). Triggered by marking the contract Signed.
function renderContractSignBlock(c, signingPartyLabel){
  const signed = c.status==='signed';
  const signedDate = signed ? fmtDateShort((c.signedAt||c.updatedAt).slice(0,10)) : '';
  let block = `<div class="doc-sign">
    <div class="doc-sign-line">${signed? `<span class="doc-signature">${esc(c.snapshot.clientName||'Client')}</span><br/>Signed electronically &middot; ${signedDate}` : `<strong>&nbsp;</strong>Client Signature &middot; Date`}</div>
    <div class="doc-sign-line">${signed? `<span class="doc-signature">${esc(signingPartyLabel)}</span><br/>` : `<strong>&nbsp;</strong>`}For Artist, ${esc(signingPartyLabel)}</div>
  </div>`;
  if(c.boilerplate.acceptanceClause){
    block += `<p style="font-size:11px;color:var(--ink-3);margin:8px 0 0;">A signature is welcome but not required where the deposit has been paid.</p>`;
  }
  return block;
}
function docBsdHeader(c){
  return c.bsdHeader ? `<div style="text-align:center;font-size:12px;font-weight:700;margin-bottom:8px;">BS"D</div>` : '';
}
function renderContractBuilderDoc(c){
  if(!c) return '';
  if(c.template==='comedian') return renderComedianDoc(c);
  if(c.template==='multiline') return renderMultilineDoc(c);
  if(c.template==='creative') return renderCreativeDoc(c);
  return renderStandardDoc(c);
}
function renderStandardDoc(c){ return docChrome(standardDocContent(c), c); }
function standardDocContent(c){
  const profile = getPayeeProfile(c.payeeProfileId) || housePayeeProfile();
  const brand = getBrandConfig(c.brand);
  const figures = contractPaymentFigures(c);
  const who = contractPerformerName(c);
  const boilerplate = contractBoilerplateLines(c);
  const travelSentence = contractTravelSentence(c.travelClause);
  const contactLine = contractClientContactLine(c);
  return `
    ${docBsdHeader(c)}
    <div class="doc-letterhead">
      <div class="wordmark" style="font-size:1.1rem;"><span class="mark"><i></i><i></i><i></i><i></i><i></i></span>${esc(brand.label)}</div>
      <span class="pill ${contractStatusPillClass(c.status)}">${contractStatusLabel(c.status)}</span>
    </div>
    <div class="doc-title">ARTIST AGREEMENT</div>
    <div class="doc-sub">Agreement ${esc(c.id)} &middot; ${contractDateSentence(c)}, between ${esc(profile.entityName)}, hereafter referred to as "the Artist", and ${esc(c.snapshot.clientName||'the Client')}, hereafter referred to as "the Client".</div>
    <div class="doc-parties">
      <div class="doc-party"><h4>Artist</h4><p><strong>${esc(who)}</strong><br/>Represented by ${esc(profile.entityName)}</p></div>
      <div class="doc-party"><h4>Client</h4><p><strong>${esc(c.snapshot.clientName||'—')}</strong>${c.snapshot.clientEmail?`<br/>${esc(c.snapshot.clientEmail)}`:''}</p></div>
    </div>
    <div class="doc-section"><h3>Terms of Engagement</h3>
      <div class="doc-facts">
        <div><span class="k">Place of Engagement</span><span>${esc(c.snapshot.venue)||'TBD'}${(c.snapshot.city||c.snapshot.state)? `, ${esc(c.snapshot.city)}${c.snapshot.city&&c.snapshot.state?', ':''}${esc(c.snapshot.state)}` : ''}</span></div>
        <div><span class="k">Date of Engagement</span><span>${c.snapshot.eventDate? fmtDate(c.snapshot.eventDate) : 'TBD'}</span></div>
        <div><span class="k">Hours of Engagement</span><span>${esc(c.hoursOfEngagement||'—')}</span></div>
        <div><span class="k">Occasion</span><span>${esc(c.snapshot.occasion)||'—'}</span></div>
        <div><span class="k">Payment for Engagement</span><span>${contractFeeDisplayHtml(c, figures)}${c.fee.note?` ${esc(c.fee.note)}`:''}${travelSentence?` ${esc(travelSentence)}`:''}</span></div>
      </div>
    </div>
    ${c.artistProvides? `<div class="doc-section"><h3>Artist Shall Provide</h3><ul class="doc-terms"><li>${esc(c.artistProvides)}</li></ul></div>` : ''}
    ${c.clientProvides.length? `<div class="doc-section"><h3>Client Shall Provide</h3><ul class="doc-terms">${c.clientProvides.map(l=>`<li>${esc(l)}</li>`).join('')}</ul></div>` : ''}
    <div class="doc-section"><h3>Payment Terms</h3>
      <div class="ledger" style="margin-bottom:8px;">
        <div class="ledger-row"><span>Total Payment</span><span class="amt">${contractFeeDisplayHtml(c, figures)}</span></div>
        <div class="ledger-row"><span>Deposit${c.deposit.nonRefundable?' (non-refundable)':''}${c.deposit.percent?` (${c.deposit.percent}%)`:''}</span><span class="amt">${money(figures.deposit)}</span></div>
        <div class="ledger-row total"><span>Balance Due</span><span class="amt">${money(figures.balance)}</span></div>
      </div>
      <p style="font-size:12.5px;margin:0;">${esc(contractBalanceDueText(c, figures))}</p>
      ${c.overtime.interval==='not_applicable'? `<p style="font-size:12.5px;margin:4px 0 0;">Overtime: Not applicable.</p>` : c.overtime.rate? `<p style="font-size:12.5px;margin:4px 0 0;">If the Artist is asked to stay beyond the agreed upon time, a $${esc(String(c.overtime.rate))} per ${esc(overtimeIntervalLabel(c.overtime.interval))} charge shall be paid in overtime fees.</p>` : ''}
    </div>
    ${boilerplate.length? `<div class="doc-section"><h3>Terms &amp; Conditions</h3><ul class="doc-terms">${boilerplate.map(l=>`<li>${esc(l)}</li>`).join('')}</ul></div>` : ''}
    ${c.boilerplate.acceptanceClause? `<div class="doc-section"><p style="font-size:12.5px;line-height:1.7;margin:0;">${esc(contractAcceptanceText(c))}</p></div>` : ''}
    <div class="doc-section"><p style="font-size:12.5px;line-height:1.7;margin:0;">${esc(contractCancellationText(c))}</p></div>
    ${c.customClauses.map(cc=>`<div class="doc-section"><h3>${esc(cc.title||'Additional Terms')}</h3><p style="font-size:12.5px;line-height:1.7;margin:0;white-space:pre-line;">${esc(cc.body)}</p></div>`).join('')}
    ${renderContractSignBlock(c, brand.signer)}
    ${renderPayeeBlock(profile)}
    ${contactLine? `<p style="font-size:11px;color:var(--ink-3);margin:10px 0 0;">${esc(contactLine)}</p>` : ''}
  `;
}
function renderComedianDoc(c){ return docChrome(comedianDocContent(c), c); }
function comedianDocContent(c){
  const profile = getPayeeProfile(c.payeeProfileId) || housePayeeProfile();
  const brand = getBrandConfig(c.brand);
  const figures = contractPaymentFigures(c);
  const who = contractPerformerName(c);
  const boilerplate = contractBoilerplateLines(c);
  const travelSentence = contractTravelSentence(c.travelClause);
  const contactLine = contractClientContactLine(c);
  return `
    ${docBsdHeader(c)}
    <div class="doc-letterhead">
      <div class="wordmark" style="font-size:1.1rem;"><span class="mark"><i></i><i></i><i></i><i></i><i></i></span>${esc(brand.label)}</div>
      <span class="pill ${contractStatusPillClass(c.status)}">${contractStatusLabel(c.status)}</span>
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
        <div class="ledger-row"><span>Deposit${c.deposit.nonRefundable?' (non-refundable)':''}${c.deposit.percent?` (${c.deposit.percent}%)`:''}</span><span class="amt">${money(figures.deposit)}</span></div>
        <div class="ledger-row total"><span>Balance Due</span><span class="amt">${money(figures.balance)}</span></div>
      </div>
      <p style="font-size:12.5px;margin:0;">${esc(contractBalanceDueText(c, figures))}</p>
      <p style="font-size:12.5px;margin:4px 0 0;">Additional Expenses: ${esc(c.additionalExpenses||'N/A')}</p>
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
    ${renderPayeeBlock(profile)}
    ${contactLine? `<p style="font-size:11px;color:var(--ink-3);margin:10px 0 0;">${esc(contactLine)}</p>` : ''}
  `;
}
function renderMultilineDoc(c){ return docChrome(multilineDocContent(c), c); }
function multilineDocContent(c){
  const profile = getPayeeProfile(c.payeeProfileId) || housePayeeProfile();
  const brand = getBrandConfig(c.brand);
  const figures = contractPaymentFigures(c);
  const boilerplate = contractBoilerplateLines(c);
  const contactLine = contractClientContactLine(c);
  return `
    ${docBsdHeader(c)}
    <div class="doc-letterhead">
      <div class="wordmark" style="font-size:1.1rem;"><span class="mark"><i></i><i></i><i></i><i></i><i></i></span>${esc(brand.label)}</div>
      <span class="pill ${contractStatusPillClass(c.status)}">${contractStatusLabel(c.status)}</span>
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
        <div class="ledger-row"><span>Deposit${c.deposit.nonRefundable?' (non-refundable)':''}${c.deposit.percent?` (${c.deposit.percent}%)`:''}</span><span class="amt">${money(figures.deposit)}</span></div>
        <div class="ledger-row total"><span>Balance Due</span><span class="amt">${money(figures.balance)}</span></div>
      </div>
      <p style="font-size:12.5px;margin:0;">${esc(contractBalanceDueText(c, figures))}</p>
      ${c.overtime.interval==='not_applicable'? `<p style="font-size:12.5px;margin:4px 0 0;">Overtime: Not applicable.</p>` : ''}
    </div>
    ${boilerplate.length? `<div class="doc-section"><h3>Terms &amp; Conditions</h3><ul class="doc-terms">${boilerplate.map(l=>`<li>${esc(l)}</li>`).join('')}</ul></div>` : ''}
    ${c.boilerplate.acceptanceClause? `<div class="doc-section"><p style="font-size:12.5px;line-height:1.7;margin:0;">${esc(contractAcceptanceText(c))}</p></div>` : ''}
    <div class="doc-section"><p style="font-size:12.5px;line-height:1.7;margin:0;">${esc(contractCancellationText(c))}</p></div>
    ${c.customClauses.map(cc=>`<div class="doc-section"><h3>${esc(cc.title||'Additional Terms')}</h3><p style="font-size:12.5px;line-height:1.7;margin:0;white-space:pre-line;">${esc(cc.body)}</p></div>`).join('')}
    ${renderContractSignBlock(c, brand.signer)}
    ${renderPayeeBlock(profile)}
    ${contactLine? `<p style="font-size:11px;color:var(--ink-3);margin:10px 0 0;">${esc(contactLine)}</p>` : ''}
  `;
}
function renderCreativeDoc(c){ return docChrome(creativeDocContent(c), c); }
function creativeDocContent(c){
  const profile = getPayeeProfile(c.payeeProfileId) || airschnitzPayeeProfile();
  const brand = getBrandConfig(c.brand);
  const figures = contractPaymentFigures(c);
  const contactLine = contractClientContactLine(c);
  return `
    ${docBsdHeader(c)}
    <div class="doc-letterhead">
      <div class="wordmark" style="font-size:1.1rem;"><span class="mark"><i></i><i></i><i></i><i></i><i></i></span>${esc(brand.label)}</div>
      <span class="pill ${contractStatusPillClass(c.status)}">${contractStatusLabel(c.status)}</span>
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
        <div class="ledger-row"><span>Deposit${c.deposit.nonRefundable?' (non-refundable)':''}${c.deposit.percent?` (${c.deposit.percent}%)`:''}</span><span class="amt">${money(figures.deposit)}</span></div>
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
    ${renderPayeeBlock(profile)}
    ${contactLine? `<p style="font-size:11px;color:var(--ink-3);margin:10px 0 0;">${esc(contactLine)}</p>` : ''}
  `;
}
function contractDocContent(c){
  if(c.template==='comedian') return comedianDocContent(c);
  if(c.template==='multiline') return multilineDocContent(c);
  if(c.template==='creative') return creativeDocContent(c);
  return standardDocContent(c);
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
    <p style="font-size:11.5px;color:var(--ink-3);margin:-8px 0 12px;">Every persisted contract across every lead. The <a href="#" data-action="nav" data-view="contracts" style="color:var(--accent);">Contracts</a> page's quick per-booking document is separate and unaffected.</p>
    <input id="contractsSearchInput" value="${esc(S.contractsSearchQuery||'')}" placeholder="Search client, performer, or template..." style="width:100%;max-width:360px;padding:9px 12px;border-radius:8px;border:1px solid var(--border-strong);background:var(--surface);font-size:14px;margin-bottom:10px;"/>
    <div class="chip-row" style="margin-bottom:14px;">
      <button class="filter-chip ${statusFilter==='all'?'sel':''}" data-action="filter-contracts-status" data-status="all">All</button>
      ${['draft','sent','signed','void'].map(s=>`<button class="filter-chip ${statusFilter===s?'sel':''}" data-action="filter-contracts-status" data-status="${s}">${contractStatusLabel(s)}</button>`).join('')}
    </div>
    ${list.length? `<div class="card u-scroll-x table-cards"><table>
      <thead><tr><th>Client</th><th>Performer</th><th>Template</th><th>Event Date</th><th>Status</th></tr></thead>
      <tbody>${list.map(c=>`<tr class="row-link" data-action="open-contract-builder" data-id="${c.id}">
        <td data-label="Client">${esc(c.snapshot.clientName)||'—'}</td>
        <td data-label="Performer">${esc(contractPerformerName(c))}</td>
        <td data-label="Template">${esc(contractTemplateLabel(c.template))}</td>
        <td data-label="Event Date">${c.snapshot.eventDate? fmtDateShort(c.snapshot.eventDate) : '—'}</td>
        <td data-label="Status"><span class="pill ${contractStatusPillClass(c.status)}">${contractStatusLabel(c.status)}</span></td>
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
        <div><h4>${esc(p.entityName)}</h4><p>${artist? `Default for ${esc(artist.name)}` : 'House profile (no specific artist)'}</p></div>
      </div>
      <div style="display:flex;gap:4px;">
        <button class="icon-btn" data-action="open-payee-profile-form" data-id="${p.id}" title="Edit">${ICO.edit}</button>
        <button class="icon-btn" data-action="delete-payee-profile" data-id="${p.id}" title="Delete">${ICO.trash}</button>
      </div>
    </div>`; }).join('')}
  </div>`;
}
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
        <a href="${qboAuthorizeUrl()}" class="btn btn-sm btn-ghost">Reconnect</a>
      </div>
      <p style="font-size:11.5px;color:var(--ink-3);margin:8px 0 0;">Sending a contract can also create and email a QuickBooks invoice for the deposit, payable by credit card.</p>`
    : `<p style="font-size:12.5px;color:var(--ink-3);margin:0 0 10px;">Not connected yet. Connecting lets Send Contract also create and email a real QuickBooks invoice for the deposit.</p>
      <a href="${qboAuthorizeUrl()}" class="btn btn-sm btn-primary">Connect QuickBooks</a>`}
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
        <a href="${gcalAuthorizeUrl()}" class="btn btn-sm btn-ghost">Reconnect</a>
      </div>
      <p style="font-size:11.5px;color:var(--ink-3);margin:8px 0 0;">Sending a contract can also create/update a HOLD on ASP's main calendar and each selected artist's calendar, moving to CONFIRMED once the deposit is received.</p>`
    : `<p style="font-size:12.5px;color:var(--ink-3);margin:0 0 10px;">Not connected yet. This is separate from the per-user "Connected Accounts" toggle above -- that's a one-way, no-auth "Add to Google Calendar" link; this is the real server-side sync that creates/updates events by exact calendar + event ID.</p>
      <a href="${gcalAuthorizeUrl()}" class="btn btn-sm btn-primary">Connect Google Calendar</a>`}
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
  const mapFor = (artistId)=> (mappings||[]).find(m=> artistId? m.artist_id===artistId : !m.artist_id);
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
  const busy = !!S.gmailMailboxesBusy;
  const f = S.newGmailMailboxForm||{};
  return `<div class="card card-pad" style="margin-bottom:20px;">
    <h3 style="margin-bottom:6px;">Gmail Mailboxes (Zelle Matching)</h3>
    <p style="font-size:11.5px;color:var(--ink-3);margin:0 0 12px;">Each artist's own mailbox is connected separately (narrowest read-only scope) so incoming Zelle notifications can be matched to a balance automatically. ${!configured? 'Not set up yet -- see <code>ops/GMAIL_SETUP.md</code>.' : ''}</p>
    <div class="field-row" style="align-items:flex-end;">
      <div class="field"><label>Artist</label>
        <select data-field="artistId" data-form="gmailmailbox">
          <option value="">— ASP sending mailbox —</option>
          ${ARTISTS.map(a=>`<option value="${a.id}" ${f.artistId===a.id?'selected':''}>${esc(a.name)}</option>`).join('')}
        </select>
      </div>
      <div class="field"><label>Mailbox Email</label><input data-field="email" data-form="gmailmailbox" type="email" value="${esc(f.email||'')}" placeholder="name@gmail.com"/></div>
    </div>
    <button class="btn btn-sm" style="margin-bottom:12px;" data-action="add-gmail-mailbox">${ICO.plus} Add Mailbox</button>
    ${!boxes? `<button class="btn btn-sm btn-ghost" data-action="check-gmail-mailboxes" ${busy?'disabled':''}>${busy?'Checking…':'Check Mailboxes'}</button>`
    : boxes.length===0? `<p style="font-size:12px;color:var(--ink-3);margin:0;">No mailboxes added yet.</p>`
    : `<div style="display:flex;flex-direction:column;gap:8px;">
        ${boxes.map(m=>{ const a = m.artist_id ? artistById(m.artist_id) : null; return `<div class="settings-row">
          <div><h4>${esc(a?a.name:'ASP Sending')}</h4><p>${esc(m.email)}</p></div>
          ${m.connected? `<span class="pill pill-good">Connected</span>` : configured? `<a href="${gmailAuthorizeUrl(m.id)}" class="btn btn-sm btn-primary">Connect</a>` : `<span class="pill">Not connected</span>`}
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
      <div class="sheet-head"><h2 style="font-size:1.3rem;">${editing?'Edit Payee Profile':'Add Payee Profile'}</h2><button class="icon-btn" data-action="close-payee-profile-form">${ICO.x}</button></div>
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
          ${f.zelleQrDataUrl? `<div style="display:flex;align-items:center;gap:10px;"><img src="${f.zelleQrDataUrl}" width="72" height="72" style="border-radius:6px;background:#fff;padding:4px;border:1px solid var(--border);"/><button type="button" class="btn btn-sm btn-ghost" data-action="remove-payee-zelle-qr">Remove</button></div>`
          : `<label class="btn btn-sm" style="cursor:pointer;display:inline-flex;">Upload QR Image<input type="file" accept="image/*" data-action="upload-payee-zelle-qr" style="display:none;"/></label>`}
        </div>
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

function renderItineraryDoc(){
  const ev = getEvent(S.itineraryEventId); if(!ev) return '';
  const artist = artistById(ev.artistId);
  const f = ev.flight, g = ev.groundTransport;
  return `<div class="overlay center" data-action="itinerary-overlay-close">
    <div class="doc" data-stop>
      <div class="sheet-head">
        <h2 style="font-size:1.1rem;">Travel Itinerary</h2>
        <div style="display:flex;gap:6px;">
          <button class="icon-btn" data-action="print-itinerary" title="Print / Save as PDF"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-2"/><rect x="6" y="14" width="12" height="7"/></svg></button>
          <button class="icon-btn" data-action="close-itinerary">${ICO.x}</button>
        </div>
      </div>
      <div class="doc-body">
        <div class="doc-letterhead">
          <div class="wordmark" style="font-size:1.1rem;"><span class="mark"><i></i><i></i><i></i><i></i><i></i></span>ASP</div>
          <span class="pill pill-good">Itinerary</span>
        </div>
        <div class="doc-title">${esc(artist.name.toUpperCase())}<br/><span style="font-size:.62em;letter-spacing:.06em;">${esc((ev.type||'').toUpperCase())}${ev.unpaid?'':` — ${esc((ev.clientName||'').toUpperCase())}`}</span></div>
        <div class="doc-sub">${fmtDate(ev.date)}${ev.venue? ` &middot; ${esc(ev.venue)}` : ''}${(ev.city||ev.state)? `, ${esc(ev.city)}${ev.city&&ev.state?', ':''}${esc(ev.state)}` : ''}</div>

        ${f ? `<div class="doc-section"><h3>${ICO.plane} Flight</h3>
          <div class="doc-facts">
            <div><span class="k">Airline</span><span>${esc(f.airline)}</span></div>
            <div><span class="k">Confirmation</span><span>${esc(f.confirmation)}</span></div>
            <div><span class="k">Depart</span><span>${esc(fmtFlightDateTime(f.depart))}</span></div>
            <div><span class="k">Arrive</span><span>${esc(fmtFlightDateTime(f.arrive))}</span></div>
          </div>
          ${f.notes? `<p style="font-size:12.5px;color:var(--ink-2);margin:0;">${esc(f.notes)}</p>` : ''}
        </div>` : ''}

        ${g ? `<div class="doc-section"><h3>${ICO.car} Ground Transport</h3>
          <div class="doc-facts">
            <div><span class="k">Driver</span><span>${esc(g.driverName)}</span></div>
            <div><span class="k">Driver Phone</span><span>${esc(g.driverPhone)}</span></div>
            <div><span class="k">Pickup</span><span>${esc(fmtFlightDateTime(g.pickupTime))} &middot; ${esc(g.pickupLocation)}</span></div>
            <div><span class="k">Drop-off</span><span>${esc(fmtFlightDateTime(g.dropoffTime))} &middot; ${esc(g.dropoffLocation)}</span></div>
          </div>
          ${g.notes? `<p style="font-size:12.5px;color:var(--ink-2);margin:0;">${esc(g.notes)}</p>` : ''}
        </div>` : ''}

        ${!f && !g ? `<p style="font-size:13px;color:var(--ink-3);">No travel arranged yet.</p>` : ''}

        <div class="doc-foot">This is a mockup document for demonstration purposes.</div>
      </div>
    </div>
  </div>`;
}

/* ============ ACTIONS ============ */
function doSendContract(id){
  const ev = getEvent(id); ev.status='contract_sent';
  const depositVia = isStandardPayment(ev) ? 'QuickBooks invoice' : paymentMethodLabel(ev);
  logEvent(ev,'email',`Contract + ${money(ev.commission)} booking fee (via ${depositVia}) emailed to ${ev.clientEmail}.`);
  toast(`Contract & invoice sent to ${ev.clientName}.`, 'email'); saveEvents(); openEvent(id);
}
function doMarkDeposit(id){
  const ev = getEvent(id); if(!ev) return;
  logEvent(ev,'success',`Bookkeeping marked booking fee received (${paymentMethodLabel(ev)}) — job officially booked & locked on calendar.`);
  // Internal team notification stays mocked -- no internal-notification channel exists yet, and
  // it's not what the spec's item 5 requires be real (that's specifically the client-facing
  // confirmation, sent for real below).
  logEvent(ev,'email',`Booking-confirmed notification emailed to ${artistById(ev.artistId).name}, Ilan, and Moshe.`);
  const result = updateEvent(id, { status:'booked', depositReceived:true, depositReceivedDate:fmtISO(new Date()) });
  if(!result.ok){
    toast(result.error==='conflict' ? 'This booking changed elsewhere since you loaded it — reload before marking the deposit received.' : 'Could not save.', 'system');
    return;
  }
  S.showBookingConfirmation = true;
  render();
  if(ev.clientEmail) doSendBookingConfirmationEmail(id);
  else toast('Booking locked in — no client email on file, confirmation not sent.', 'system');
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
  const fromStatus = ev.bookingStatus || ev.status;
  ev.depositVerification = { method: method||null, note: note||null, loggedBy: S.user, loggedAt: new Date().toISOString() };
  // Runs the real, existing lock-in effects (status->booked, depositReceived, activity log, client
  // confirmation email) -- the verification gate above adds rigor in front of this, it doesn't
  // reinvent what "booked" already correctly does.
  doMarkDeposit(id);
  // First real call site for the new EventStore primitive (Wave A) -- a conflict here (another
  // tab/session changed this event since this one loaded it) surfaces as a toast instead of
  // silently overwriting whatever that other write did.
  const result = updateEvent(id, { bookingStatus: 'confirmed' }); // new, additive column (migration 0020) -- ev.status above is untouched
  if(!result.ok){
    toast(result.error==='conflict' ? 'This booking changed elsewhere since you loaded it — reload before confirming.' : 'Could not save the confirmed status.', 'system');
    return;
  }
  logEvent(ev, 'system', `Deposit verified (${method||'manual'}): ${note||'—'}. Booking status: confirmed.`);
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
  logEvent(ev,'email','Flight needed — emailed to the booking secretary with gig details.');
  if(reportEventSave(updateEvent(id, { flightNeeded:true }), 'marking flight needed')) toast('Booking secretary notified: flight needed.', 'email');
  openEvent(id);
}
function doSaveFlight(id){
  const ev = getEvent(id); if(!ev) return; const f=S.flightForm;
  const depart = f.departDate? `${f.departDate} ${f.departTime||'00:00'}` : '—';
  const arrive = f.arriveDate? `${f.arriveDate} ${f.arriveTime||'00:00'}` : '—';
  const flight = {airline:f.airline||'—', flightNumber:(f.flightNumber||'').trim(), confirmation:f.confirmation||'—', depart, arrive, trackingIdx:-1, trackingStatus:null, trackingStatusAt:null};
  logEvent(ev,'email',`Flight booked & added to itinerary — Moshe and ${artistById(ev.artistId).name} notified.`);
  S.showFlightForm=false;
  if(reportEventSave(updateEvent(id, { flight, flightBooked:true }), 'saving the flight')) toast('Flight saved — Moshe & artist notified.', 'success');
  openEvent(id);
}
const FLIGHT_STATUS_SEQUENCE = ['On time', 'Gate assigned', 'Boarding', 'Departed on time', 'In flight', 'Landed on time'];
function doCheckFlightStatus(id){
  S.checkingFlightId = id;
  render();
  setTimeout(()=>{
    const ev = getEvent(id);
    if(ev && ev.flight){
      const trackingIdx = Math.min((ev.flight.trackingIdx??-1)+1, FLIGHT_STATUS_SEQUENCE.length-1);
      const trackingStatus = FLIGHT_STATUS_SEQUENCE[trackingIdx];
      logEvent(ev,'email',`Flight status update for ${artistById(ev.artistId).name} — ${trackingStatus} — emailed via ASP-branded update.`);
      if(reportEventSave(updateEvent(id, { flight: {...ev.flight, trackingIdx, trackingStatus, trackingStatusAt:new Date().toISOString()} }), 'checking flight status')) toast(`Flight status: ${trackingStatus} — artist notified.`, 'email');
    }
    S.checkingFlightId = null;
    render();
  }, 650);
}
function doToggleGroundTransport(id){
  const ev = getEvent(id); if(!ev) return;
  logEvent(ev,'email','Ground transport needed — emailed to the booking secretary with gig details.');
  if(reportEventSave(updateEvent(id, { groundTransportNeeded:true }), 'marking ground transport needed')) toast('Booking secretary notified: ground transport needed.', 'email');
  openEvent(id);
}
function doSaveGroundTransport(id){
  const ev = getEvent(id); if(!ev) return; const f=S.transportForm;
  const pickupTime = f.pickupDate? `${f.pickupDate} ${f.pickupTime||'00:00'}` : '—';
  const dropoffTime = f.dropoffDate? `${f.dropoffDate} ${f.dropoffTime||'00:00'}` : '—';
  const groundTransport = {driverName:f.driverName||'—', driverPhone:f.driverPhone||'—', pickupTime, pickupLocation:f.pickupLocation||'—', dropoffTime, dropoffLocation:f.dropoffLocation||'—', notes:f.notes||''};
  logEvent(ev,'email',`Driver booked & added to itinerary — Moshe and ${artistById(ev.artistId).name} notified.`);
  S.showTransportForm=false;
  if(reportEventSave(updateEvent(id, { groundTransport, groundTransportBooked:true }), 'saving ground transport')) toast('Driver saved — Moshe & artist notified.', 'success');
  openEvent(id);
}
function doSaveDressCode(id){
  const ev = getEvent(id); if(!ev) return; const f = S.dressCodeForm;
  const dressCode = (f.dressCode||'').trim();
  logEvent(ev, 'system', dressCode? `Dress code set: ${dressCode} — ${artistById(ev.artistId).name} notified.` : 'Dress code cleared.');
  if(reportEventSave(updateEvent(id, { dressCode }), 'saving the dress code')) toast(dressCode? 'Dress code saved — artist notified.' : 'Dress code cleared.', 'success');
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
  const prevSheet = ev.gigInfoSheet || {text:'', contacts:[], updatedAt:null};
  const gigInfoSheet = { ...prevSheet, text: (f.text!==undefined? f.text : prevSheet.text).trim(), updatedAt: fmtISO(new Date()) };
  logEvent(ev, 'email', `Gig info sheet updated — ${artistById(ev.artistId).name} notified.`);
  S.showGigInfoForm=false; S.gigInfoForm={}; S.newGigContactForm={};
  if(reportEventSave(updateEvent(id, { gigInfoSheet }), 'saving the gig info sheet')) toast('Gig info sheet saved — artist notified.', 'success');
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
  if(!ev.unpaid){
    if(f.clientName!==undefined) ev.clientName = f.clientName.trim();
    if(f.clientEmail!==undefined) ev.clientEmail = f.clientEmail.trim();
    if(f.clientPhone!==undefined) ev.clientPhone = f.clientPhone.trim();
  }
  if(f.type!==undefined) ev.type = f.type;
  if(ev.type==='Wedding'){
    if(f.band!==undefined) ev.band = f.band.trim()||null;
    if(f.bandSize!==undefined) ev.bandSize = f.bandSize? Number(f.bandSize) : null;
  }
  if(f.date!==undefined) ev.date = f.date;
  if(f.time!==undefined) ev.time = f.time;
  if(f.endTime!==undefined) ev.endTime = f.endTime || null;
  if(f.venue!==undefined) ev.venue = f.venue.trim();
  if(f.city!==undefined) ev.city = f.city.trim();
  if(f.state!==undefined) ev.state = f.state.trim();
  const notes = [];
  if(!ev.unpaid && f.price!==undefined){
    ev.price = Number(f.price)||0;
    // Only auto-recompute the deposit at 15% if this same save doesn't also set an explicit
    // deposit amount -- an explicit value (below) always wins, same "manual override beats the
    // formula" convention as reminderIntervalDays (see WORKFLOWS.md §4).
    if(f.commission===undefined) ev.commission = Math.round(ev.price*0.15);
  }
  if(!ev.unpaid && f.commission!==undefined){
    const oldCommission = ev.commission;
    ev.commission = Math.max(0, Number(f.commission)||0);
    if(ev.commission!==oldCommission) notes.push(`deposit changed from ${money(oldCommission)} to ${money(ev.commission)}`);
  }
  // ev.balance is no longer a stored field (PR 12) -- eventBalance(ev)/zelleBalance(ev) derive it
  // live from price/commission/charges on every read, so there's nothing to recompute here.
  if(!ev.unpaid && f.paymentMethod!==undefined){
    const oldMethod = ev.paymentMethod || 'standard';
    ev.paymentMethod = f.paymentMethod;
    if(ev.paymentMethod!==oldMethod) notes.push(`payment method changed to ${paymentMethodLabel(ev)}`);
  }
  if(!ev.unpaid && f.paymentMethodNote!==undefined) ev.paymentMethodNote = f.paymentMethodNote.trim();
  logEvent(ev, 'system', notes.length? `Details updated by office — ${notes.join('; ')}.` : 'Details updated by office.');
  S.showEditEvent=false; S.editEventForm={};
  if(reportEventSave(updateEvent(id, {}), 'saving these changes')) toast('Changes saved.', 'success');
  openEvent(id);
}
function doSubmitInvoice(){
  const f = S.newInvoiceForm;
  const clientName = (f.clientName||'').trim();
  const clientEmail = (f.clientEmail||'').trim();
  const items = f.items || [];
  if(!clientName){ toast('Enter who this invoice is billed to.', 'error'); return; }
  if(!items.length){ toast('Add at least one line item.', 'error'); return; }
  const inv = makeInvoice(clientName, clientEmail, items, (f.notes||'').trim(), 'open', 0);
  CUSTOM_INVOICES.unshift(inv);
  saveCustomInvoices();
  toast(`Invoice sent to ${clientName}.`, 'success');
  S.showNewInvoice=false; S.newInvoiceForm={}; render();
}
function doMarkInvoicePaid(id){
  const inv = getInvoice(id); if(!inv) return;
  inv.status = 'paid'; inv.paidAt = fmtISO(new Date());
  inv.log.push({ts:new Date().toISOString(), type:'success', text:'Marked paid.'});
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
  toast(`Outside booking created for ${performerName}.`, 'success');
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
  toast('Outside booking marked paid.', 'success');
  render();
}
function doSaveDocument(){
  const f = S.documentForm;
  const existing = S.documentId ? getDocument(S.documentId) : null;
  const subjectType = f.subjectType!==undefined? f.subjectType : (existing?existing.subjectType:'general');
  const subjectId = f.subjectId!==undefined? f.subjectId : (existing? existing.subjectId : null);
  if(subjectType!=='general' && !subjectId){ toast("Pick who this document is for.", 'system'); return; }
  const brand = f.brand || (existing && existing.brand) || 'asp';
  const doc = existing || { id:'DOC-'+(DOCID++), createdAt: fmtISO(new Date()), signedAt: null };
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
function doEmailItinerary(id){
  const ev = getEvent(id); if(!ev) return;
  logEvent(ev,'email',`Travel itinerary emailed to ${artistById(ev.artistId).name}.`);
  if(reportEventSave(updateEvent(id, {}), 'emailing the itinerary')) toast('Itinerary emailed to artist.', 'email');
  openEvent(id);
}
function doSendReminder(id){
  const ev = getEvent(id); if(!ev) return;
  // SMS stays mocked -- no SMS provider is wired into this app. The email half is real now.
  const via = isStandardPayment(ev) ? ' (Zelle link included)' : ` (payment method: ${paymentMethodLabel(ev)})`;
  logEvent(ev,'sms',`Balance reminder texted to ${ev.clientPhone}${via}.`);
  reportEventSave(updateEvent(id, {}), 'sending the reminder');
  if(ev.clientEmail) doSendReminderEmail(id);
  else toast('No client email on file — reminder not sent.', 'system');
}
function doMarkBalance(id){
  const ev = getEvent(id); if(!ev) return;
  logEvent(ev,'success',`Bookkeeping marked balance received (${paymentMethodLabel(ev)}) — reminders stopped.`);
  if(reportEventSave(updateEvent(id, { balanceReceived:true, balanceReceivedDate:fmtISO(new Date()), status:'paid' }), 'marking the balance received')) toast('Balance marked received. Reminders stopped.', 'success');
  openEvent(id);
}
function doToggleArtistPaidOut(id){
  const ev = getEvent(id); if(!ev) return;
  const artistPaidOut = !ev.artistPaidOut;
  logEvent(ev, artistPaidOut?'success':'system', artistPaidOut? `Marked paid out to ${artistById(ev.artistId).name} (${money(zelleBalance(ev))}).` : 'Payout unmarked.');
  if(reportEventSave(updateEvent(id, { artistPaidOut, artistPaidOutDate: artistPaidOut? fmtISO(new Date()) : null }), 'updating payout status')) toast(artistPaidOut? 'Marked paid out.' : 'Payout unmarked.', 'success');
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
    logEvent(ev,'email',`Updated total emailed to client: ${money(newTotal)} (was ${money(newTotal-amount)}).`);
  }
  S.showAddCharge=false; S.addChargeForm={};
  if(reportEventSave(updateEvent(id, { charges }), 'adding the charge')) toast(postSigning? 'Charge added — client notified of the updated total.' : 'Charge added to contract.', 'system');
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
        if(succeeded) logEvent(ev,'system', `Prep sheet${succeeded===1?'':'s'} uploaded.`);
        if(reportEventSave(updateEvent(id, { prepSheets }), 'uploading the prep sheet') && succeeded) toast('Prep sheet uploaded — artist notified.', 'success');
        openEvent(id);
      }
    };
    reader.onload = ()=>{
      prepSheets.push({id:'PS-'+Date.now()+Math.random().toString(36).slice(2,6), name:file.name, dataUrl:reader.result, uploadedAt:fmtISO(new Date())});
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
  reportEventSave(updateEvent(id, { prepSheets }), 'removing the prep sheet');
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
  const openLeads = S.events.filter(e=>['lead','negotiating','contract_sent'].includes(e.status));
  const text = buildDailyDigestWhatsAppText(openLeads);
  if(navigator.clipboard){
    navigator.clipboard.writeText(text).then(()=>toast('Copied — paste it to Ilan on WhatsApp.', 'success')).catch(()=>toast('Could not copy — try again.', 'system'));
  } else {
    toast('Clipboard not supported in this browser.', 'system');
  }
}
function doDeleteEvent(id){
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
  const email = `${first}${last? '.'+last : ''}@aspmanagement.com`;
  const initials = (parts[0][0] + (parts[1]? parts[1][0] : '')).toUpperCase();
  const slot = (ARTISTS.length % 6) + 1;
  const role = ARTIST_ROLES.includes(S.addArtistForm.role) ? S.addArtistForm.role : 'Singer';
  const artist = {id, name, slot, initials, email, role};
  ARTISTS.push(artist); saveArtists();
  S.showAddArtist = false; S.addArtistForm = {};
  S.newArtistWelcome = {name, email};
  toast(`${name} added — welcome email sent to ${email}.`, 'email');
  render();
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
      charges:[], dressCode:'', prepSheets:[], createdAt: fmtISO(new Date()),
      log:[{ts:new Date().toISOString(), type:'system', text:`Recording Day scheduled for ${artist.name} — ${count} episode project${count===1?'':'s'}.`}],
    };
    if(findConflicts(ev).length) toast(`⚠ Scheduling conflict — ${artist.name} already has something this date.`, 'system');
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
  if(person && person.email) logProjectEvent(p,'email', `Notified ${person.name} by email — new task assigned: "${text}".`);
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
      logProjectEvent(p, person.email?'email':'system', `Task "${t.text}" assigned to ${person.name}.${person.email? ' Notified by email.' : ''}`);
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
function doAddProjectLink(id){
  const url = (S.newLinkForm.url||'').trim(); if(!url) return;
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
  const commission = isInternal ? 0 : Math.round(price*0.15);
  const typeList = isInternal ? INTERNAL_EVENT_TYPES : EVENT_TYPES;
  const resolvedType = (f.type==='Other'? (f.customType||'').trim()||'Other' : f.type)||typeList[0];
  const ev = {
    id:'EV-'+(EVID++), artistId:f.artistId, type: resolvedType,
    unpaid: isInternal,
    clientName: isInternal? null : f.clientName,
    clientEmail: isInternal? '' : (f.clientEmail||''), clientPhone: isInternal? '' : (f.clientPhone||''),
    date: f.date, time: f.time||'19:00', endTime: f.endTime||null,
    venue: f.venue||'', city: f.city||'', state: f.state||'',
    price, commission, status: isInternal? 'scheduled':'lead', depositReceived:false, depositReceivedDate:null,
    balanceReceived:false, balanceReceivedDate:null, reminderIntervalDays: defaultReminderCadence(f.date), lastReminderSent:null,
    flightNeeded: !!f.flightNeeded, flightBooked:false, flight:null,
    groundTransportNeeded: !!f.groundTransportNeeded, groundTransportBooked:false, groundTransport:null,
    charges: isInternal? [] : (f.charges||[]), dressCode: isInternal? '' : (f.dressCode||''), prepSheets:[], createdAt: fmtISO(new Date()),
    additionalArtists: isInternal? [] : (f.additionalArtists||[]).filter(x=>x.artistId).map(x=>{
      const fee = Number(x.feeAmount)||0; const cut = Math.round(fee*0.15);
      return { artistId:x.artistId, feeAmount:fee, aspCut:cut, netAmount:fee-cut };
    }),
    band: f.type==='Wedding' ? (f.band||'').trim()||null : null,
    bandSize: f.type==='Wedding' && f.bandSize ? Number(f.bandSize) : null,
    log:[{ts:new Date().toISOString(), type:'system', text: isInternal? `${resolvedType} scheduled for ${artistById(f.artistId).name}.` : `Lead created for ${artistById(f.artistId).name} — client info entered by management.`}],
  };
  S.events.unshift(ev); saveEvents();
  toast(isInternal? `Internal day added — penciled in on ${artistById(f.artistId).name}'s calendar.` : `Lead added — penciled in on ${artistById(f.artistId).name}'s calendar.`, 'success');
  if(findConflicts(ev).length) toast(`⚠ Scheduling conflict — ${artistById(f.artistId).name} already has something this date.`, 'system');
  S.showNewLead=false; S.newLeadForm={}; openEvent(ev.id);
}
function doSubmitBlockTime(){
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
      charges:[], dressCode:'', prepSheets:[], createdAt: fmtISO(new Date()),
      log:[{ts:new Date().toISOString(), type:'system', text:`${artist.name} blocked ${allDay?'this date':`${fmtTime(f.startTime)}–${fmtTime(f.endTime)}`}${f.note?': '+f.note:''}.`}],
    };
    if(findConflicts(ev).length) hadConflict = true;
    S.events.unshift(ev);
  });
  saveEvents();
  toast(dates.length>1? `${dates.length} days blocked on your calendar.` : 'Date blocked on your calendar.', 'success');
  if(hadConflict) toast(`⚠ You already have something booked in that range.`, 'system');
  S.showBlockTime=false; S.blockTimeForm={}; render();
}

function answerAskAI(q, isAdmin){
  const ql = q.toLowerCase();
  const upcoming = (evs)=>evs.filter(e=>!isPast(e.date) && ['booked','paid'].includes(e.status));
  if(!isAdmin){
    const evs = eventsFor(S.user);
    const nextGig = upcoming(evs).sort((a,b)=>a.date.localeCompare(b.date))[0];
    const ytd = evs.filter(e=>e.balanceReceived && new Date(e.balanceReceivedDate).getFullYear()===new Date().getFullYear()).reduce((s,e)=>s+zelleBalance(e),0);
    if(ql.includes('next gig') || ql.includes('next booking')) return nextGig ? `Your next gig is ${nextGig.type} for ${nextGig.clientName||'you'} on ${fmtDateShort(nextGig.date)}.` : `You don't have any upcoming gigs booked yet.`;
    if(ql.includes('this month')){ const n=new Date(); const thisMonth = upcoming(evs).filter(e=>{const d=new Date(e.date+'T00:00:00'); return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear();}); return `You have ${thisMonth.length} gig${thisMonth.length===1?'':'s'} this month.`; }
    if(ql.includes('ytd') || ql.includes('payout') || ql.includes('earn')) return `You've been paid ${money(ytd)} so far this year.`;
    return `I can help with your gigs, next booking, this month's schedule, or your YTD payout — try asking one of those.`;
  }
  const open = S.events.filter(e=>['lead','negotiating','contract_sent'].includes(e.status));
  const awaitingBalance = S.events.filter(e=>e.status==='booked' && !e.balanceReceived);
  const conflictPairs = allConflictPairs().filter(([a,b])=>!isPast(a.date)||!isPast(b.date));
  const needsTravel = S.events.filter(e=>!isPast(e.date) && ((e.flightNeeded&&!e.flightBooked)||(e.groundTransportNeeded&&!e.groundTransportBooked)));
  const matchedArtist = ARTISTS.find(a=>ql.includes(a.name.toLowerCase()) || ql.includes(a.name.split(' ')[0].toLowerCase()));
  if(matchedArtist){
    const evs = eventsFor(matchedArtist.id);
    const up = upcoming(evs).sort((a,b)=>a.date.localeCompare(b.date));
    const ytd = evs.filter(e=>e.balanceReceived && new Date(e.balanceReceivedDate).getFullYear()===new Date().getFullYear()).reduce((s,e)=>s+zelleBalance(e),0);
    return `${matchedArtist.name}: ${up.length} upcoming gig${up.length===1?'':'s'}${up[0]?`, next on ${fmtDateShort(up[0].date)}`:''}. YTD payout: ${money(ytd)}.`;
  }
  if(ql.includes('conflict')) return conflictPairs.length ? `There ${conflictPairs.length===1?'is':'are'} ${conflictPairs.length} scheduling conflict${conflictPairs.length===1?'':'s'} right now — check the Dashboard for details.` : `No scheduling conflicts right now.`;
  if(ql.includes('lead')) return `There ${open.length===1?'is':'are'} ${open.length} open lead${open.length===1?'':'s'} awaiting contract or deposit.`;
  if(ql.includes('balance')) return `${awaitingBalance.length} booked gig${awaitingBalance.length===1?'':'s'} still awaiting balance payment.`;
  if(ql.includes('flight') || ql.includes('travel') || ql.includes('driver')) return needsTravel.length ? `${needsTravel.length} upcoming gig${needsTravel.length===1?'':'s'} still need a flight or driver arranged — see the Travel page.` : `All upcoming travel is arranged.`;
  if(ql.includes('this month') || ql.includes('booked')){ const n=new Date(); const thisMonth = S.events.filter(e=>{const d=new Date(e.date+'T00:00:00'); return ['booked','paid'].includes(e.status) && d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear();}); return `${thisMonth.length} gig${thisMonth.length===1?'':'s'} booked this month.`; }
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
  const staleContract = document.getElementById('contractPrintHost');
  if(staleContract) staleContract.remove();
  if(S.showContract){
    const holder = document.createElement('div');
    holder.id = 'contractPrintHost';
    holder.innerHTML = renderContractDoc();
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
      const formTargets = { flight:S.flightForm, transport:S.transportForm, charge:S.addChargeForm, addartist:S.addArtistForm, addrealuser:S.addRealUserForm, edituser:S.editRealUserForm, newproject:S.newProjectForm, projectlink:S.newLinkForm, blocktime:S.blockTimeForm, askai:S.askAIForm, dresscode:S.dressCodeForm, editevent:S.editEventForm, newinvoice:S.newInvoiceForm, newoutsidebooking:S.newOutsideBookingForm, document:S.documentForm, person:S.newPersonForm, finincome:S, finexpense:S, realsignin:S, giginfo:S.gigInfoForm, gigcontact:S.newGigContactForm, payeeprofile:S.payeeProfileForm, sendcontract:S.sendContractForm, verifydeposit:S.verifyDepositForm, orgsettings:ORG_SETTINGS, gmailmailbox:S.newGmailMailboxForm };
      const target = formTargets[form] || S.newLeadForm;
      target[key] = el.type==='checkbox'? el.checked : el.value;
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
    contractsSearchInput.focus();
    const v = contractsSearchInput.value; contractsSearchInput.value=''; contractsSearchInput.value=v;
  }
  const askAIInput = document.getElementById('askAIInput');
  if(askAIInput){
    askAIInput.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); doAskAI(); } });
    askAIInput.focus();
    const v = askAIInput.value; askAIInput.value=''; askAIInput.value=v;
  }
  const contractSearchInput = document.getElementById('contractSearchInput');
  if(contractSearchInput){
    contractSearchInput.addEventListener('input', ()=>{ S.contractSearchQuery = contractSearchInput.value; render(); });
    contractSearchInput.focus();
    const v = contractSearchInput.value; contractSearchInput.value=''; contractSearchInput.value=v;
  }
  const realSignInEmailInput = document.getElementById('realSignInEmailInput');
  if(realSignInEmailInput) realSignInEmailInput.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); doSendSignInCode(); } });
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
    switch(action){
      case 'logout': if(S.realSession && supabaseClient) supabaseClient.auth.signOut(); S.user=null; S.realSession=null; S.realPasskeys=null; S.eventId=null; S.showNewLead=false; S.showMobileMenu=false; history.pushState(null,'',location.pathname+location.search); render(); break;
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
      case 'open-giginfo-form': { const ev=getEvent(S.eventId); const sheet=gigInfoSheetOf(ev||{}); S.gigInfoForm={text:sheet.text}; S.newGigContactForm={}; S.showGigInfoForm=true; render(); break; }
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
      case 'view-contract': S.showContract=true; render(); break;
      case 'open-contract-from-list': S.contractDocEventId=id; S.showContract=true; render(); break;
      case 'close-contract': S.showContract=false; S.contractDocEventId=null; render(); break;
      case 'contract-overlay-close': if(e.target===t) { S.showContract=false; S.contractDocEventId=null; render(); } break;
      case 'print-contract': window.print(); break;
      case 'create-contract': S.showTemplatePicker=true; S.templatePickerLeadId=id; render(); break;
      case 'close-template-picker': S.showTemplatePicker=false; S.templatePickerLeadId=null; render(); break;
      case 'templatepicker-overlay-close': if(e.target===t){ S.showTemplatePicker=false; S.templatePickerLeadId=null; render(); } break;
      case 'pick-template-create': { const leadId=id; const template=t.getAttribute('data-template'); S.showTemplatePicker=false; S.templatePickerLeadId=null; doCreateContractFromLead(leadId, template); break; }
      case 'open-contract-builder': S.showContractBuilder=true; S.contractBuilderId=id; render(); break;
      case 'close-contract-builder': S.showContractBuilder=false; S.contractBuilderId=null; render(); break;
      case 'contractbuilder-overlay-close': if(e.target===t){ S.showContractBuilder=false; S.contractBuilderId=null; render(); } break;
      case 'contract-refresh-from-lead': doRefreshContractFromLead(S.contractBuilderId); break;
      case 'delete-contract': doDeleteContract(S.contractBuilderId); break;
      case 'set-contract-status': { const c=getContract(S.contractBuilderId); if(c){ c.status=t.getAttribute('data-status'); if(c.status==='signed' && !c.signedAt) c.signedAt=new Date().toISOString(); c.updatedAt=new Date().toISOString(); saveContracts(); } render(); break; }
      case 'approve-contract-for-sending': doApproveContractForSending(id); break;
      case 'revoke-contract-approval': doRevokeContractApproval(id); break;
      case 'pick-contract-overtime-interval': { const c=getContract(S.contractBuilderId); if(c){ c.overtime.interval=t.getAttribute('data-value'); c.updatedAt=new Date().toISOString(); saveContracts(); } render(); break; }
      case 'pick-cancellation-type': { const c=getContract(S.contractBuilderId); if(c){ c.cancellationPolicy.type=t.getAttribute('data-value'); c.updatedAt=new Date().toISOString(); saveContracts(); } render(); break; }
      case 'pick-balance-due-timing': { const c=getContract(S.contractBuilderId); if(c){ c.balanceDueTiming=t.getAttribute('data-value'); c.updatedAt=new Date().toISOString(); saveContracts(); } render(); break; }
      case 'pick-contract-brand': { const c=getContract(S.contractBuilderId); if(c){ c.brand=t.getAttribute('data-value'); c.updatedAt=new Date().toISOString(); saveContracts(); } render(); break; }
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
      case 'open-payee-profile-form': S.showPayeeProfileForm=true; S.editingPayeeProfileId=id||null; S.payeeProfileForm = id? (()=>{ const p=getPayeeProfile(id); return p? {entityName:p.entityName, artistId:p.artistId, zelle:p.zelle, checkPayee:p.checkPayee, checkAddress:p.checkAddress, wireBankName:p.wireBankName, wireAccountName:p.wireAccountName, wireAccountNumber:p.wireAccountNumber, wireRoutingNumber:p.wireRoutingNumber, wireSwift:p.wireSwift, notes:p.notes, defaultOvertimeInterval:p.defaultOvertimeInterval, zelleRecipientLabel:p.zelleRecipientLabel, zelleInstructions:p.zelleInstructions, zelleActive:p.zelleActive, zelleQrDataUrl:p.zelleQrDataUrl} : {}; })() : {defaultOvertimeInterval:'half_hour', zelleActive:true};
      render(); break;
      case 'close-payee-profile-form': S.showPayeeProfileForm=false; S.payeeProfileForm={}; S.editingPayeeProfileId=null; render(); break;
      case 'payeeprofileform-overlay-close': if(e.target===t){ S.showPayeeProfileForm=false; S.payeeProfileForm={}; S.editingPayeeProfileId=null; render(); } break;
      case 'pick-payee-overtime-interval': S.payeeProfileForm.defaultOvertimeInterval = t.getAttribute('data-value'); render(); break;
      case 'save-payee-profile': doSavePayeeProfile(); break;
      case 'remove-payee-zelle-qr': S.payeeProfileForm.zelleQrDataUrl = null; render(); break;
      case 'delete-payee-profile': doDeletePayeeProfile(id); break;
      case 'preview-data-migration': S.migrationPreview = computeMigrationCounts(); render(); break;
      case 'check-reconciliation-queue': loadReconciliationQueue(); break;
      case 'check-gmail-mailboxes': loadGmailStatus(); break;
      case 'check-calendar-mappings': loadCalendarMappings(); break;
      case 'check-zelle-review-queue': loadZelleReviewQueue(); break;
      case 'add-gmail-mailbox': doAddGmailMailbox(); break;
      case 'migrate-payee-profiles': doMigratePayeeProfilesToSupabase().then(()=>{ S.migrationPreview = computeMigrationCounts(); render(); }); break;
      case 'migrate-contracts': doMigrateContractsToSupabase().then(()=>{ S.migrationPreview = computeMigrationCounts(); render(); }); break;
      case 'open-send-contract': { const c=getContract(id); if(c){ const figures=contractPaymentFigures(c); S.contractBuilderId=id; S.showSendContractConfirm=true; S.sendContractInvoice=true; S.sendContractForm={ to:c.snapshot.clientEmail||'', subject:`${contractTemplateLabel(c.template)} — ${c.snapshot.venue||'Your Event'}${c.snapshot.eventDate?` — ${fmtDateShort(c.snapshot.eventDate)}`:''}`, qboAmount: figures.deposit||'', qboDescription: `Deposit — ${c.snapshot.venue||'Your Event'}${c.snapshot.eventDate?` (${fmtDateShort(c.snapshot.eventDate)})`:''}` }; } render(); break; }
      case 'close-send-contract-confirm': if(!S.sendContractBusy){ S.showSendContractConfirm=false; S.sendContractForm={}; render(); } break;
      case 'sendcontract-overlay-close': if(e.target===t && !S.sendContractBusy){ S.showSendContractConfirm=false; S.sendContractForm={}; render(); } break;
      case 'confirm-send-contract': doSendContractEmail(); break;
      case 'toggle-send-contract-invoice': S.sendContractInvoice = !S.sendContractInvoice; render(); break;
      case 'open-verify-deposit': S.verifyDepositEventId=id; S.showVerifyDeposit=true; S.verifyDepositForm={method:'zelle', note:''}; render(); break;
      case 'close-verify-deposit': S.showVerifyDeposit=false; S.verifyDepositForm={}; render(); break;
      case 'verifydeposit-overlay-close': if(e.target===t){ S.showVerifyDeposit=false; S.verifyDepositForm={}; render(); } break;
      case 'confirm-verify-deposit': doMarkDepositVerified(id); break;
      case 'view-itinerary': S.itineraryEventId=id; S.showItinerary=true; render(); break;
      case 'close-itinerary': S.showItinerary=false; S.itineraryEventId=null; render(); break;
      case 'itinerary-overlay-close': if(e.target===t) { S.showItinerary=false; S.itineraryEventId=null; render(); } break;
      case 'print-itinerary': window.print(); break;
      case 'email-itinerary': doEmailItinerary(id); break;
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
      case 'check-flight-status': doCheckFlightStatus(id, t.getAttribute('data-seg')); break;
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
      case 'pick-document-brand': S.documentForm.brand = t.getAttribute('data-brand'); render(); break;
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
      case 'add-passkey': { const st=getUserSettings(S.user); const n=st.passkeys.length+1; st.passkeys.push({id:'pk-'+randInt(1,999999), label:`Passkey ${n}`, addedAt: fmtISO(new Date())}); saveAllSettings(); toast('Passkey added.', 'success'); render(); break; }
      case 'remove-passkey': { const st=getUserSettings(S.user); if(st.passkeys.length>1){ st.passkeys = st.passkeys.filter(pk=>pk.id!==id); saveAllSettings(); toast('Passkey removed.', 'system'); render(); } break; }
      case 'add-real-passkey': doAddRealPasskey(); break;
      case 'remove-real-passkey': doRemoveRealPasskey(id); break;
      case 'connect-calendar': { const st=getUserSettings(S.user); const who=isAdminUser(S.user)?adminById(S.user):artistById(S.user); st.calendarConnected=true; st.calendarEmail=who.email; saveAllSettings(); toast('Google Calendar connected.', 'success'); render(); break; }
      case 'disconnect-calendar': { const st=getUserSettings(S.user); st.calendarConnected=false; saveAllSettings(); toast('Google Calendar disconnected.', 'system'); render(); break; }
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
        S.editRealUserForm = { kind, id: row.id, name: row.name, email: row.email, originalEmail: row.email, adminRole: row.role, artistRole: row.role };
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
  document.querySelectorAll('[data-action="upload-payee-zelle-qr"]').forEach(inp=>{
    if(inp.tagName!=='INPUT') return;
    inp.addEventListener('change', ()=>{
      if(!inp.files.length) return;
      const file = inp.files[0];
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
  document.querySelectorAll('.tab-select').forEach(sel=>{
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
