// Minimal service worker: present so the app is installable as a home-screen web app. It
// deliberately has NO fetch handler -- the old one relayed every request (including Supabase and
// CDN calls) without caching anything, adding a hop to every request (2026-10-09 audit 4.9).
// If offline support is ever wanted, add a versioned same-origin GET cache here.
self.addEventListener('install', ()=>{ self.skipWaiting(); });
self.addEventListener('activate', (e)=>{ e.waitUntil(self.clients.claim()); });
