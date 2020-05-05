// register service worker

if (navigator.serviceWorker) {
    navigator.serviceWorker.register('/backgroundsync-sample/serviceworker.js', { scope: '/backgroundsync-sample/' })
    .then(function(registration){
        if (registration.installing) {
            console.log('Service Worker installing');
        } else if (registration.waiting) {
            console.log('Service Worker installed');
        } else if (registration.active) {
            console.log('Service Worker active');
        }
    }).catch(function(error){
        console.log('Registration failed with ' + error);
    })
}