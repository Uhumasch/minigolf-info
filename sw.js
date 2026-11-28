// Makes the page installable and lets it start without a connection. The data (data.json) is always fetched fresh by the page itself;
// pictures never change under the same name (the name is a hash), so they are kept after the first look.
const SHELL = 'shell-v4'
const PICTURES = 'pictures-v1'
const HOME = self.registration.scope

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((cache) => cache.add(HOME)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== SHELL && k !== PICTURES).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(HOME, { cache: 'no-cache' }).then((response) => {
        const copy = response.clone()
        void caches.open(SHELL).then((cache) => cache.put(HOME, copy))
        return response
      }, () => caches.match(HOME)),
    )
    return
  }
  if (new URL(request.url).pathname.includes('/bilder/')) {
    event.respondWith(
      caches.open(PICTURES).then((cache) =>
        cache.match(request).then(
          (known) =>
            known ??
            fetch(request).then((response) => {
              if (response.ok) void cache.put(request, response.clone())
              return response
            }),
        ),
      ),
    )
  }
})
