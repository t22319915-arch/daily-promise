/* Service Worker：離線快取 */
var CACHE = "daily-promise-v1";
var ASSETS = ["./", "index.html", "styles.css", "app.js", "favicon.svg", "data/daily-promises.json", "images/church.jpg", "images/logo.png", "images/cover-coffee.jpg", "images/cover-stars.jpg"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (k) { if (k !== CACHE) { return caches.delete(k); } return null; }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") { return; }
  var url = new URL(e.request.url);
  if (url.origin !== self.location.origin) { return; }
  e.respondWith(caches.match(e.request).then(function (hit) {
    if (hit) { return hit; }
    return fetch(e.request).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      }
      return res;
    }, function () {
      if (e.request.mode === "navigate") { return caches.match("index.html"); }
      throw new Error("offline");
    });
  }));
});
