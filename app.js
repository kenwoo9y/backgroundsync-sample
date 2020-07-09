initializeServiceWorker();
initializeIndexedDB();
checkIndexedDB();

// get elements
const form = document.getElementById('form');
const title = document.getElementById('title');
const date = document.getElementById('date');
const file = document.getElementById('image');

function initializeServiceWorker() {
    // register service worker
    if (navigator.serviceWorker) {
        navigator.serviceWorker.register('/backgroundsync-sample/serviceworker.js', { scope: '/backgroundsync-sample/' })
        .then(function() {
            return navigator.serviceWorker.ready;
        })
        .then(function(registration) {
            form.addEventListener('submit', function(event) {
                event.preventDefault();
                saveData().then(function() {
                    if(registration.sync) {
                        registration.sync.register('example-sync')
                        .catch(function(error) {
                            return error;
                        })
                    } else {
                        checkInternet();
                    }
                });
            });
        })
        .catch(function(error) {
            console.log('Registration failed with ' + error);
        })
    } else {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            saveData().then(function() {
                checkInternet();
            });
        })
    }
}

function initializeIndexedDB() {
    let dbOpenRequest = window.indexedDB.open("ItemDB", 1);

    dbOpenRequest.onupgradeneeded = function(event) {
        let db = event.target.result;

        let objectStore = db.createObjectStore("ItemDB", { keyPath: "item_id", autoIncrement: true });
        objectStore.createIndex("title", "title", { unique: false });
        objectStore.createIndex("date", "date", { unique: false });
        objectStore.createIndex("image", "image", { unique: false });
    };
}

function checkIndexedDB() {
    if(navigator.onLine) {
        let dbOpenRequest = window.indexedDB.open("ItemDB");

        dbOpenRequest.onsuccess = function(event) {
            this.result.transaction(["ItemDB"]).objectStore("ItemDB").getAll().onsuccess = function(event) {
                // unfinished
                window.fetch('', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(event.target.result)
                }).then(function(response) {
                    return response.text();
                }).then(function() {
                    dbOpenRequest.result.transaction(["ItemDB"], "readwrite").objectStore("ItemDB").clear();
                }).catch(function(error) {
                    console.log(error);
                })
            };
        };
    }
}

function checkInternet() {
    event.preventDefault();
    if(navigator.onLine) {
        sendData();
    } else {
        alert("You are offline!");
    }
}

function saveData() {
    return new Promise(function(resolve, reject) {
        let base64 = ImageToBase64(image, "image/jpeg");
        let tmpItem = { 
            title: title.value, 
            date: date.value, 
            image: base64 
        };

        let dbOpenRequest = window.indexedDB.open("ItemDB");

        dbOpenRequest.onsuccess = function(event) {
            let db = event.target.result;
            let transaction = db.transaction(["ItemDB"], "readwrite");
            let objectStore = transaction.objectStore("ItemDB");
            let addRequest = objectStore.add(tmpItem);

            addRequest.onsuccess = function(event) {
                resolve();
            };

            addRequest.onerror = function(error) {
                reject(error);
            };
        };

        dbOpenRequest.onerror = function(error) {
            reject(error);
        };
    });
}

function fetchData() {
    return new Promise(function(resolve, reject) {
        let dbOpenRequest = window.indexedDB.open("ItemDB");

        dbOpenRequest.onsuccess = function(event) {
            let db = event.target.result;
            let transaction = db.transaction(["ItemDB"]);
            let objectStore = transaction.objectStore("ItemDB");
            let getAllRequest = objectStore.getAll();

            getAllRequest.onsuccess = function(event) {
                let objects = event.target.result
                resolve(objects);
            };

            getAllRequest.onerror = function(error) {
                reject(error);
            };
        };

        dbOpenRequest.onerror = function(error) {
            reject(error);
        };
    });
}

function clearData() {
    return new Promise(function(resolve, reject) {
        let dbOpenRequest = window.indexedDB.open("ItemDB");

        dbOpenRequest.onsuccess = function(event) {
            let db = event.target.result;
            let transaction = db.transaction(["ItemDB"], "readwrite");
            let objectStore = transaction.objectStore("ItemDB");
            let clearRequest = objectStore.clear();

            clearRequest.onsuccess = function(event) {
                resolve();
            };

            clearRequest.onerror = function(error) {
                reject(error);
            };
        };

        dbOpenRequest.onerror = function(error) {
            reject(error);
        };
    });
}

function sendData() {
    fetchData().then(function(response) {
        // unfinished
        return window.fetch('', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(response)
        });
    })
    .then(clearData)
    .catch(function(error) {
        console.log(error);
    });
}

function ImageToBase64(image, type) {
    // new canvas
    let canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;

    // draw image
    let ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);

    // convert to base64
    return canvas.toDataURL(type);
}

window.addEventListener('online', function() {
    if(!navigator.serviceWorker && !window.SyncManager) {
        fetchData().then(function(response) {
            if(response.length > 0) {
                return sendData();
            }
        });
    }
});

window.addEventListener('offline', function() {
    alert('You have lost internet access!');
});