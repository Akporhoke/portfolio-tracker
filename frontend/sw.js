/*
 * Gaze service worker: receives push messages in the background and shows
 * them as notifications, even when the Gaze tab is closed.
 *
 * Put this file in the ROOT of the frontend folder:  frontend/sw.js
 * It must be served at  /sw.js  (not inside a sub-folder), because a
 * service worker can only control pages at or below its own location.
 *
 * It has no "fetch" handler on purpose: it does not cache anything and
 * never touches how pages load. Its only job is notifications.
 */

// Take over straight away instead of waiting for old tabs to close
self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
});


// A push arrived from the server
self.addEventListener('push', event => {
    let data = {};

    try {
        data = event.data ? event.data.json() : {};
    } catch (error) {
        data = {
            title: 'Gaze',
            body: event.data ? event.data.text() : ''
        };
    }

    const title = data.title || 'Gaze';

    const options = {
        body: data.body || '',

        // Same tag = replaces the older notification. The server gives
        // each alert its own tag so none are lost.
        tag: data.tag || undefined,

        // Where to go when it is tapped
        data: { url: data.url || '/' }
    };

    // waitUntil keeps the worker alive until the notification is shown.
    // Browsers require every push to show a notification.
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});


// The notification was tapped
self.addEventListener('notificationclick', event => {
    event.notification.close();

    const wanted =
        (event.notification.data && event.notification.data.url) || '/';

    // Only ever open a page on our own site
    const target =
        new URL(wanted, self.location.origin).href;

    event.waitUntil(
        self.clients
            .matchAll({ type: 'window', includeUncontrolled: true })
            .then(windows => {
                // Gaze is already open: bring it forward and tell it
                // to show the notifications
                for (const client of windows) {
                    if ('focus' in client) {
                        client.postMessage({ type: 'open-alerts' });

                        return client.focus();
                    }
                }

                // Not open: open it (the app reads ?alerts=1)
                return self.clients.openWindow(target);
            })
    );
});