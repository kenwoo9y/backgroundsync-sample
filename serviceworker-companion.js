// get element
const form = document.getElementById('form');

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
    const dbOpenRequest = window.indexedDB.open("ItemDB", 1);

    dbOpenRequest.onupgradeneeded = function(event) {
        let db = event.target.result;

        let objectStore = db.createObjectStore("ItemDB", { keyPath: "item_id", autoIncrement: true });
        objectStore.createIndex("title", "title", { unique: false });
        objectStore.createIndex("date", "date", { unique: false });
        objectStore.createIndex("image", "image", { unique: false });
    };
}