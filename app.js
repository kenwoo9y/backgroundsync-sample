// get element
const form = document.getElementById('form');
const title = document.getElementById('title');
const date = document.getElementById('date');
const file = document.getElementById('image');

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

function initializeDB() {
    let dbOpenRequest = window.indexedDB.open("ItemDB", 1);

    dbOpenRequest.onupgradeneeded = function(event) {
        let db = event.target.result;

        let objectStore = db.createObjectStore("ItemDB", { keyPath: "item_id", autoIncrement: true });
        objectStore.createIndex("title", "title", { unique: false });
        objectStore.createIndex("date", "date", { unique: false });
        objectStore.createIndex("image", "image", { unique: false });
    };
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
            let objectStore = this.result.transaction(["ItemDB"], "readwrite").transaction.objectStore("ItemDB");
            objectStore.add(tmpItem);
            resolve();
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
            objectStore.getAll().onsuccess = function(event) {
                resolve(event.target.result);
            };
        };

        dbOpenRequest.onerror = function(error) {
            reject(error);
        };
    });
}