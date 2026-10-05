/* Owner alerts only. No customer pages, requests or private data are cached. */
self.addEventListener("push",event=>{
 let payload={};try{payload=event.data.json();}catch{}
 event.waitUntil(self.registration.showNotification(payload.title||"Keepsy",{body:payload.body||"Your store has an update.",tag:payload.tag||"keepsy-order",icon:"/icons/keepsy-192.png",data:{url:typeof payload.url==="string"&&payload.url.startsWith("/admin")?payload.url:"/admin/orders"}}));
});
self.addEventListener("notificationclick",event=>{
 event.notification.close();const url=new URL(event.notification.data.url,self.location.origin).href;
 event.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(async windows=>{for(const w of windows){if(w.url===url)return w.focus();}return clients.openWindow(url);}));
});
