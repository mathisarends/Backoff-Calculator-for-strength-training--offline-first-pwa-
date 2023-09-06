const version = 2;

const cacheName = `cache${version}`;
const imageCacheName = `imageCache${version}`;
const chacheList = [
  // hier einfügen was inital gecached werden soll.
  "./index.html",
  "/css/index.css",
  "/css/login.css",
  "/js/app.js",
  "/js/calcBackoff.js",
  "/manifest/manifest.webmanifest",
  "/manifest/icon-192x192.png",
  "/manifest/icon-256x256.png",
  "/manifest/icon-384x384.png",
  "/manifest/icon-512x512.png",

  "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;700&family=Bellefair&family=Barlow:wght@400;700&display=swap",
  
];

const imageCache = [
  //for background images:
  "/img/background-destination-mobile.jpg",
  "/img/background-destination-tablet.jpg",
  "/img/background-destination-desktop.jpg",
];

/* const imageCache = [

] */

self.addEventListener("install", (ev) => {
  ev.waitUntil(
    Promise.all([
      caches.open(cacheName).then((cache) => {
        return cache.addAll(chacheList);
      }),
      caches.open(imageCacheName).then((cache) => {
        return cache.addAll(imageCache);
      }),
    ])
  );

  console.log("installed");
});

self.addEventListener("activate", (ev) => {
  // Lösche alte Versionen des Caches
  ev.waitUntil(
    Promise.all([
      caches.keys().then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== cacheName && key !== imageCacheName)
            .map((name) => caches.delete(name))
        );
      }),
    ])
  );
  console.log("activated");
});

self.addEventListener("fetch", (ev) => {
    const requestType = getRequestType(ev.request);

    if (!requestType.isOnline) {
        //usw..
        ev.respondWith(cacheFirst(ev));
    } else if (requestType.isOnline && (requestType.isHTML || requestType.isEJS)) {
      console.log("Der request type ist html: ");
      ev.respondWith(networkFirst(ev));
    } else {
      ev.respondWith(cacheFirst(ev));
    }



  console.log("fetch request for", ev.request.url);
});



//only return whats in the cache:
function cacheOnly(ev) {
  caches.match(ev.request);
}

function cacheFirst(ev) {

    return caches.match(ev.request)
        .then(cacheResponse => {
            if (cacheResponse !== undefined) {
                return cacheResponse; // Ressource im Cache gefunden
            } else {
                return fetch(ev.request)
                    .then(networkResponse => {
                        if (!networkResponse || !networkResponse.ok) {
                            throw new Error('Network request failed');
                        }
                        return networkResponse;
                    })
                    .catch(error => {
                        // Hier können Sie auf Netzwerkfehler reagieren
                        console.error('Network request error:', error);
                        // Hier eine Standard-Response zurückgeben
                        return new Response('Network request failed', {
                            status: 500,
                            statusText: 'Internal Server Error'
                        });
                    });
            }
        })
        .catch(error => {
            // Fehlerbehandlung für das Cachen
            console.error('Cache error:', error);
            // Hier eine Standard-Response zurückgeben
            return new Response('Cache error', {
                status: 500,
                statusText: 'Internal Server Error'
            });
        });
}

function networkFirst(ev) {
  return fetch(ev.request).then((fetchResponse) => {
    if (fetchResponse.ok) {
      return fetchResponse;
    } else {
      return caches.match(ev.request);
    }
  });
}

//check cache and fallback on fetch for response
//always attempt to fetch a new copy and update the cache
function staleWhileRevalidate(ev) {
    return caches.match(ev.request).then((cacheResponse) => {
        
        //antwort aus dem cache holen aber trotzdem immer versuchen zu fetchen um daten aktuell zu halten:
        let fetchResponse = fetch(ev.request).then((fetchResponse) => {
            caches.open(cacheName).then(cache => {
                cache.put(ev.request, fetchResponse.clone());
                return fetchResponse;
            })
        })

        return cacheResponse || fetchResponse;
    })
}

  //try fetch first and fallback on cache
  //update cache if fetch was successful
function networkRevalidateAndCache(ev) {
    return fetch(ev.request).then((fetchResponse) => {
        if (fetchResponse.ok) {
            return caches.open(cacheName).then(cache => {
                cache.put(ev.request, fetchResponse.clone());
                return fetchResponse;
            })
        } else {
            return caches.match(ev.request);
        }
    })
}

function getRequestType(request) {
    const url = new URL(request.url);
    const isOnline = self.navigator.onLine;
    const isImage = url.pathname.includes(".png") || url.pathname.includes(".jpg");
    const isCSS = url.pathname.endsWith(".css") || url.hostname.includes("googleapis.com");
    const isFont = url.hostname.includes("gstatic") || url.pathname.endsWith(".woff2");
    const isHTML = url.pathname.endsWith(".html"); // Überprüfen, ob es sich um eine HTML-Datei handelt
    const isEJS = url.pathname.endsWith(".ejs");
    const selfUrl = new URL(self.location);
    const isExternal = request.mode === "cors" || selfUrl.hostname !== url.hostname;
  
    return {
      isOnline,
      isImage,
      isCSS,
      isFont,
      isHTML,
      isEJS,
      isExternal,
    };
  }
