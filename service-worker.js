const CACHE_NAME='aiqbase-website-v1';
const APP_SHELL=['./','./index.html','./styles.css','./privacy-policy.html','./terms.html','./support.html','./app_preview.html','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE_NAME).then(c=>Promise.all(APP_SHELL.map(u=>c.add(u).catch(()=>null)))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const r=e.request;e.respondWith(fetch(r).then(res=>{if(res&&res.ok){const copy=res.clone();caches.open(CACHE_NAME).then(c=>c.put(r,copy)).catch(()=>{});}return res;}).catch(()=>caches.match(r,{ignoreSearch:true}).then(x=>x||caches.match('./index.html'))));});
