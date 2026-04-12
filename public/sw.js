self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

// Show notifications triggered by the main thread
self.addEventListener("message", event => {
  if (event.data?.type === "SHOW_NOTIFICATION") {
    const { title, body, tag } = event.data;
    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon: "/logotr.png",
        badge: "/logotr.png",
        tag,
        renotify: true,
      })
    );
  }
});

// Open/focus app when notification is tapped
self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clients => {
      if (clients.length > 0) return clients[0].focus();
      return self.clients.openWindow("/");
    })
  );
});
