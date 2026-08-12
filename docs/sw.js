self.addEventListener("install", event => {
  console.log("Service Worker installed");
  event.waitUntil(
    caches.open("v1").then(cache => {
      return cache.addAll([]); // add files you want cached here
    })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Serve from cache if available, otherwise try network
      return response || fetch(event.request).catch(err => {
        console.error("Service worker fetch failed:", err);
        // Return a fallback response instead of crashing
        return new Response("Network error", {
          status: 408,
          statusText: "Network error"
        });
      });
    })
  );
});
