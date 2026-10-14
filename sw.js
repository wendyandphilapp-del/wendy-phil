/* Wendy & Phil: the service worker. It does one job: when a buzz arrives, ask the script
   what to show and show it. The push itself is empty; the words come from the script,
   which never puts money in a message. Nothing else is cached, so the app is never stale. */
var CFG = "wp-push";
self.addEventListener("install", function(e){ self.skipWaiting(); });
self.addEventListener("activate", function(e){ e.waitUntil(self.clients.claim()); });
function cfg(){ return caches.open(CFG).then(function(c){ return c.match("cfg"); }).then(function(r){ return r ? r.json() : null; }); }
function saveCfg(o){ return caches.open(CFG).then(function(c){ return c.put("cfg", new Response(JSON.stringify(o), {headers:{"Content-Type":"application/json"}})); }); }
self.addEventListener("push", function(e){
  e.waitUntil(cfg().then(function(c){
    if (!c || !c.exec) return null;
    var url = c.exec + (c.exec.indexOf("?") < 0 ? "?" : "&") + "push=latest&who=" + encodeURIComponent(c.who || "") + "&tok=" + encodeURIComponent(c.tok || "") + "&seen=" + encodeURIComponent((c.seen || []).join(","));
    return fetch(url, {credentials: "omit"}).then(function(r){ return r.json(); }).then(function(j){
      if (j && j.id) { c.seen = (c.seen || []).concat([j.id]).slice(-30); return saveCfg(c).then(function(){ return j; }); }
      return j;
    });
  }).catch(function(){ return null; }).then(function(j){
    var title = (j && j.title) || "Wendy & Phil", body = (j && j.body) || "Open the app to see what’s new.";
    return self.registration.showNotification(title, {body: body, tag: (j && j.tag) || "wp", renotify: true, icon: "icon-180.png", badge: "icon-180.png"});
  }));
});
self.addEventListener("notificationclick", function(e){
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type: "window", includeUncontrolled: true}).then(function(cs){
    for (var i = 0; i < cs.length; i++) { if ("focus" in cs[i]) return cs[i].focus(); }
    return self.clients.openWindow("./");
  }));
});
