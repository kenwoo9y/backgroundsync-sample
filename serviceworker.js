var CACHE_VERSION = 'v1';
var CACHE_NAME = CACHE_VERSION + ':sw-cache-';

var contentToCache = [
    '/backgroundsync-sample/',
    '/backgroundsync-sample/index.html',
    '/backgroundsync-sample/offline.html'
];

self.addEventListener('install', onInstall);
function onInstall(event) {
    event.waitUtil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(contentToCache);
        })
    );
}

self.addEventListener('activate', onActivate);
function onActivate(event) {
    event.waitUtil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.filter(function(cacheName) {
                    return cacheName.indexOf(CACHE_VERSION) !== 0;
                }).map(function(cacheName) {
                    return caches.delete(cacheName);
                })
            );
        })
    );
}

self.addEventListener('fetch', onFetch);
function onFetch(event) {
    event.respondWith(
        // try to return untouched request from network first
        fetch(event.request).then(function(response) {
            let responseClone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
                cache.put(event.request, responseClone);
            });
            return response;
        }).catch(function() {
            // if it fails, try to return request from the cache
            return caches.match(event.request).then(function(response) {
                if (response) {
                    return response;
                }
                // if not found in cache, return default offline content for navigate requests
                if (event.request.mode === 'navigate' || (event.request.method === 'GET' && event.request.headers.get('accept').includes('text/html'))) {
                    return caches.match('/backgroundsync-sample/offline.html');
                }
            })
        })
    );
}

self.addEventListener('sync', onSync);
function onSync(event) {
    if(event.tag == 'example-sync') {
        event.waitUtil(function() {
            return getAllIndexedDB()
            .then(sendToServer)
            .catch(function(error) {
                return error;
            })
        });
    }
}

function getAllIndexedDB() {
    return new Promise(function(resolve, reject) {
        let dbOpenRequest = indexedDB.open("ItemDB");
        dbOpenRequest.onsuccess = function(event) {
            this.result.transaction(["ItemDB"]).objectStore("ItemDB").getAll().onsuccess = function(event) {
                resolve(event.target.result);
            };
        };
        dbOpenRequest.onerror = function(error) {
            reject(error);
        };
    });
}

function sendToServer(response) {
    let sendItem = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(response)
    };

    // unfinished
    return fetch('', sendItem)
    .then(function(response) {
        return response.text();
    }).catch(function(error) {
        return error;
    });
}