// ─── Firebase Messaging (background FCM push) ───────────────────────────────
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

// ─── Lifecycle ───────────────────────────────────────────────────────────────
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

// ─── Notification messages ───────────────────────────────────────────────────
const MESSAGES = [
  { title: "Log your expenses, asshole 😤", body: "You spent money today. We both know it. Open the app." },
  { title: "Hey dumbass 👋", body: "Did you log what you spent? No? Then do it right now." },
  { title: "Stop being broke 🤦", body: "Broke people don't track. You're better than that. Log it." },
  { title: "Put the phone down? WRONG 📱", body: "Open Tracksy. Log your expenses. Then put it down." },
  { title: "You little shit 😂", body: "Did you forget to log again? Yeah you did. Go fix it." },
  { title: "Oi. Log your money. 🫵", body: "Every rupee you don't log is a rupee that disappears forever." },
  { title: "WAKE UP 🚨", body: "Your wallet is bleeding and you're just standing there. Log something." },
  { title: "Seriously?? Still not logged? 🙄", body: "Takes 10 seconds. Stop being lazy. Open Tracksy." },
  { title: "You're slipping 💀", body: "Untracked expenses are how people go broke. Don't be that guy." },
  { title: "Bro. BRO. 😭", body: "Log. Your. Damn. Expenses. That's it. That's the whole message." },
  { title: "Your goals called 📞", body: "They said you're slacking. Save something today, jackass." },
  { title: "Save ₹ or stay broke 🤷", body: "Pick one. Your goals aren't going to fund themselves." },
  { title: "Future you is pissed 😤", body: "Because present you isn't saving shit. Fix that. Now." },
  { title: "That thing you want? 🎯", body: "Still not saved up for it. Log your expenses and fix that." },
  { title: "Your goals are just dreams rn 💭", body: "Until you actually log and save. Start today, not tomorrow." },
  { title: "Ding ding ding 🔔", body: "That's the sound of money you forgot to log. Go track it." },
  { title: "Money doesn't grow on trees 🌳", body: "But it does disappear in your hands. Log it before it's gone." },
  { title: "You: 'I'll log it later' 🤡", body: "Also you, later: 'where did all my money go?' — LOG IT NOW." },
  { title: "Beep boop 🤖", body: "This is your robot reminder to stop being stupid with money." },
  { title: "Your bank account is crying 😢", body: "And you're not even watching. Log your expenses. Comfort it." },
  { title: "Adulting is hard 😩", body: "Logging your expenses is the bare minimum. Just do it, champ." },
  { title: "Sir this is a Tracksy 🍔", body: "Please log your expenses before you spend money on more food." },
  { title: "Error 404: savings not found 💻", body: "Fix this bug by opening Tracksy and logging your shit." },
  { title: "Notification unlocked 🔓", body: "Achievement: being broke. Fix it by logging your expenses today." },
  { title: "Did you eat out again? 🍛", body: "Log it. Don't hide it. The app won't judge. (I will though.)" },
  { title: "Stop scrolling. Log it. 🛑", body: "You have 10 seconds. That's it. Open Tracksy and be done." },
  { title: "Rich people track money 💰", body: "Broke people don't. Which one are you trying to be?" },
  { title: "This is your sign 🪧", body: "Log your expenses right now. Not later. Not after this. NOW." },
  { title: "One day you'll thank me 🙏", body: "That day is not today. Today just log your damn expenses." },
  { title: "Discipline > motivation 💪", body: "You don't feel like logging. Do it anyway. That's the point." },
  { title: "Quick maths ➕➖", body: "Money in minus money out = where you actually stand. Log it." },
  { title: "Nobody's coming to save you 🦸", body: "Just you and your budget. Log what you spent today." },
  { title: "The grind doesn't stop 😤", body: "Neither does your spending. Keep up by logging it all." },
];

function randomMsg() {
  return MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
}

// ─── Message handler ─────────────────────────────────────────────────────────
self.addEventListener("message", event => {
  // Immediate notification triggered from main thread
  if (event.data?.type === "SHOW_NOTIFICATION") {
    const { title, body, tag } = event.data;
    event.waitUntil(
      self.registration.showNotification(title, {
        body, icon: "/logotr.png", badge: "/logotr.png", tag, renotify: true,
      })
    );
  }

  // Deferred notification: keep SW alive via waitUntil, fire after delay
  if (event.data?.type === "SCHEDULE_DEFERRED_NOTIF") {
    const delay = event.data.delay ?? 30_000;
    event.waitUntil(
      new Promise(resolve => {
        setTimeout(() => {
          self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clients => {
            const anyVisible = clients.some(c => c.visibilityState === "visible");
            if (anyVisible) { resolve(); return; }
            const msg = randomMsg();
            self.registration.showNotification(msg.title, {
              body: msg.body,
              icon: "/logotr.png",
              badge: "/logotr.png",
              tag: "tracksy-deferred",
              renotify: true,
            }).then(resolve).catch(resolve);
          }).catch(resolve);
        }, delay);
      })
    );
  }
});

// ─── Notification tap ────────────────────────────────────────────────────────
self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clients => {
      const match = clients.find(c => c.url.includes(self.location.origin));
      if (match) return match.focus();
      return self.clients.openWindow("/");
    })
  );
});
