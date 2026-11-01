importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-messaging-compat.js');

try {
  firebase.initializeApp({
    apiKey: "FILL_FROM_CONFIG_JS",
    projectId: "radars-727ea",
    messagingSenderId: "FILL_FROM_CONFIG_JS",
    appId: "FILL_FROM_CONFIG_JS"
  });
  var fcmMessaging = firebase.messaging();
  fcmMessaging.onBackgroundMessage(function(payload) {
    var title = (payload.notification && payload.notification.title) || '🚨';
    var body = (payload.notification && payload.notification.body) || '';
    var url = (payload.data && payload.data.url) || 'https://radaralerts.github.io/Radar/';
    self.registration.showNotification(title, {
      body: body,
      icon: 'assets/icons/icon-192.png',
      tag: 'radar-alert',
      dir: 'rtl',
      data: { url: url }
    });
  });
} catch (e) {}

self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'SHOW_NOTIFICATION') {
    self.registration.showNotification(e.data.title, {
      body: e.data.body,
      icon: e.data.icon,
      tag: e.data.tag || 'radar-alert',
      dir: e.data.dir || 'rtl'
    });
  }
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  var targetUrl = (e.notification.data && e.notification.data.url) || self.registration.scope;
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.indexOf(self.registration.scope) === 0 && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return null;
    })
  );
});
