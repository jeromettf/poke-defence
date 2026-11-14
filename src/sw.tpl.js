// 빌드할 때 tools/build.py가 만든다. 직접 고치지 말고 src/sw.tpl.js를 고친다.
// 게임 파일은 주소에 내용 해시가 붙어 있어 먼저 저장해 둔 것을 쓰고, 첫 화면(index.html)만 늘 새로 받아 본다.
const V='pkrtd-sw-__V__',PRE=__PRE__;
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(PRE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('pkrtd-sw-')&&k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);if(u.origin!==location.origin)return;
  if(r.mode==='navigate'){
    e.respondWith(fetch(r).then(res=>{if(res.ok){const c=res.clone();caches.open(V).then(ca=>ca.put('index.html',c));}return res;}).catch(()=>caches.match('index.html',{ignoreSearch:true})));return;}
  e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{if(res.ok){const c=res.clone();caches.open(V).then(ca=>ca.put(r,c));}return res;})));
});
