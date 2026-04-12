importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCNWMFgZpYciqPpQb-TaniNW5DZ4Ys99js",
  authDomain: "tracksy-26805.firebaseapp.com",
  projectId: "tracksy-26805",
  storageBucket: "tracksy-26805.firebasestorage.app",
  messagingSenderId: "424610149504",
  appId: "1:424610149504:web:7f0bad661548b3ddc9e265",
});

const messaging = firebase.messaging();

// Handle background messages (when app is closed / not in focus)
messaging.onBackgroundMessage(payload => {
  const { title, body } = payload.notification ?? {};
  self.registration.showNotification(title || "Tracksy", {
    body: body || "Time to log your expenses.",
    icon: "/logotr.png",
    badge: "/logotr.png",
    tag: "tracksy-fcm",
    renotify: true,
    data: { url: "/" },
  });
});

// Open / focus app when notification is tapped
self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clients => {
      const match = clients.find(c => c.url.includes(self.location.origin));
      if (match) return match.focus();
      return self.clients.openWindow(url);
    })
  );
});
