/* Service Worker: App wird zwischengespeichert, damit sie auch ohne Internet startet. */
const V="englisch-vmvfr5ynl";
const CORE=["./","index.html","apple-touch-icon.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",e=>{
  const r=e.request;if(r.method!=="GET")return;
  const u=new URL(r.url);if(u.origin!==location.origin)return;
  e.respondWith(
    Promise.race([fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp)).catch(()=>{});return res;}throw new Error("bad");}),new Promise((_,rej)=>setTimeout(()=>rej(new Error("timeout")),3000))])
      .catch(()=>caches.match(r).then(m=>m||caches.match("index.html")))
  );
});
