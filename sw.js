/* Service Worker: App und Lerninhalte werden zwischengespeichert, damit sie auch ohne Internet starten. */
const V="englisch-v4-stimme";
const CORE=[
  "./",
  "index.html",
  "apple-touch-icon.png",
  "data/vocab.json",
  "data/chunks.json",
  "data/sentences.json",
  "data/dialogues.json",
  "data/grammar.json",
  "data/songs.json",
  "data/placement.json",
  "data/listening.json"
];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
async function fromCache(r){
  const hit=await caches.match(r,{ignoreSearch:true});
  if(hit)return hit;
  const path=new URL(r.url).pathname;
  const keys=await caches.open(V).then(c=>c.keys());
  const alt=keys.find(k=>{const p=new URL(k.url).pathname;return p===path||(path.length>1&&p.endsWith(path));});
  return alt?caches.match(alt):null;
}
function offlineShell(){
  return caches.match("./").then(m=>m||caches.match("index.html")).then(m=>m||new Response("offline",{status:503,headers:{"Content-Type":"text/plain;charset=utf-8"}}));
}
self.addEventListener("fetch",e=>{
  const r=e.request;if(r.method!=="GET")return;
  const u=new URL(r.url);if(u.origin!==location.origin)return;
  e.respondWith((async()=>{
    const offline=self.navigator&&self.navigator.onLine===false;
    if(offline){
      const cached=await fromCache(r);
      if(cached)return cached;
      if(u.pathname.endsWith(".json"))return new Response("offline",{status:503,headers:{"Content-Type":"text/plain;charset=utf-8"}});
      return offlineShell();
    }
    try{
      const res=await Promise.race([
        fetch(r,{cache:"reload"}),
        new Promise((_,rej)=>setTimeout(()=>rej(new Error("timeout")),4000))
      ]);
      if(res&&res.ok){
        const cp=res.clone();
        caches.open(V).then(c=>c.put(r,cp)).catch(()=>{});
        return res;
      }
      throw new Error("bad");
    }catch(err){
      const cached=await fromCache(r);
      if(cached)return cached;
      if(u.pathname.endsWith(".json"))return new Response("offline",{status:503,headers:{"Content-Type":"text/plain;charset=utf-8"}});
      return offlineShell();
    }
  })());
});
