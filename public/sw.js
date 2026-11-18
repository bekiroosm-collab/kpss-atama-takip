self.addEventListener('push',event=>{
  let data={};
  try {data=event.data.json()} catch {}
  event.waitUntil(self.registration.showNotification(data.title||'Atama Takip',{
    body:data.body||'Yeni bir P94 ilanı var.',tag:data.tag,icon:'/p94/icon.png'
  }));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const path='/p94/index.html#ilanlar';
  event.waitUntil((async()=>{
    const windows=await clients.matchAll({type:'window',includeUncontrolled:true});
    const app=windows.find(w=>new URL(w.url).pathname==='/p94/index.html');
    if(app){await app.navigate(path);return app.focus();}
    return clients.openWindow(path);
  })());
});
