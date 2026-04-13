import { getToken } from "firebase/messaging";
import { getFirebaseMessaging } from "./firebase";
import { saveFcmToken } from "./firestore";

const MESSAGES = [
  // Savage
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

  // Goal-focused
  { title: "Your goals called 📞", body: "They said you're slacking. Save something today, jackass." },
  { title: "Save ₹ or stay broke 🤷", body: "Pick one. Your goals aren't going to fund themselves." },
  { title: "Future you is pissed 😤", body: "Because present you isn't saving shit. Fix that. Now." },
  { title: "That thing you want? 🎯", body: "Still not saved up for it. Log your expenses and fix that." },
  { title: "Your goals are just dreams rn 💭", body: "Until you actually log and save. Start today, not tomorrow." },

  // Funny
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

  // Motivational but spicy
  { title: "Stop scrolling. Log it. 🛑", body: "You have 10 seconds. That's it. Open Tracksy and be done." },
  { title: "Rich people track money 💰", body: "Broke people don't. Which one are you trying to be?" },
  { title: "This is your sign 🪧", body: "Log your expenses right now. Not later. Not after this. NOW." },
  { title: "One day you'll thank me 🙏", body: "That day is not today. Today just log your damn expenses." },
  { title: "Discipline > motivation 💪", body: "You don't feel like logging. Do it anyway. That's the point." },
  { title: "Quick maths ➕➖", body: "Money in minus money out = where you actually stand. Log it." },
  { title: "Nobody's coming to save you 🦸", body: "Just you and your budget. Log what you spent today." },
  { title: "The grind doesn't stop 😤", body: "Neither does your spending. Keep up by logging it all." },
];

const STORAGE_KEY      = "tracksy_notifications";
const SCHEDULE_KEY     = "tracksy_notif_scheduled_date";
const VAPID_KEY        = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

/* ─── Permission + enable ─── */

export function notificationsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "on";
}

export function setNotificationsEnabled(on: boolean): void {
  localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
}

export function getPermissionStatus(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export async function requestPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "denied") return false;
  if (Notification.permission === "granted") return true;
  const result = await Notification.requestPermission();
  return result === "granted";
}

/* ─── FCM token registration ─── */

export async function registerFcmToken(userId: string): Promise<void> {
  if (!VAPID_KEY) return;
  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return;

    const swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg });
    if (token) await saveFcmToken(userId, token);
  } catch {
    // Silently fail — user may have blocked notifications or SW not ready
  }
}

/* ─── Register old sw.js for local notifications ─── */

export async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch {
    return null;
  }
}

/* ─── Local fallback scheduling (fires while browser is open) ─── */

export function scheduleForToday(): void {
  if (typeof window === "undefined") return;
  if (Notification.permission !== "granted") return;
  if (!notificationsEnabled()) return;

  const now  = Date.now();
  const end  = new Date(); end.setHours(22, 0, 0, 0);

  // Build a fixed daily seed: 6 notification times spread across 9am–10pm
  // Re-run every app-open so we always schedule the remaining slots for today.
  const dayStart = new Date(); dayStart.setHours(9, 0, 0, 0);
  const range    = end.getTime() - dayStart.getTime();

  // Deterministic-ish set of 6 slots for today (different each day)
  const seed = new Date().toDateString();
  const slots: number[] = [];
  for (let i = 0; i < 6; i++) {
    // Simple hash of (seed + i) → float in [0,1)
    let h = 0;
    for (const c of seed + i) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
    const frac = (h >>> 0) / 0xffffffff;
    slots.push(dayStart.getTime() + frac * range);
  }
  slots.sort((a, b) => a - b);

  // Schedule only slots still in the future (at least 1 min from now)
  slots.forEach((t, idx) => {
    const delay = t - now;
    if (delay > 60_000) {
      setTimeout(() => fireLocalNotification(idx), delay);
    }
  });
}

function fireLocalNotification(idx: number): void {
  if (!notificationsEnabled() || Notification.permission !== "granted") return;
  const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
  showNotification(msg.title, msg.body, `tracksy-local-${idx}`);
}

function showNotification(title: string, body: string, tag: string): void {
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "SHOW_NOTIFICATION", title, body, tag,
    });
  } else {
    new Notification(title, { body, icon: "/logotr.png", badge: "/logotr.png", tag });
  }
}

/**
 * Tell the service worker to show a notification after `delayMs` even if
 * the page is closed. Works via event.waitUntil() keepalive in sw.js.
 * On Android Chrome this survives several minutes; on iOS it may not.
 */
export function scheduleDeferredNotification(delayMs = 5 * 60 * 1000): void {
  if (typeof window === "undefined") return;
  if (!notificationsEnabled() || Notification.permission !== "granted") return;
  if (!("serviceWorker" in navigator) || !navigator.serviceWorker.controller) return;
  navigator.serviceWorker.controller.postMessage({
    type: "SCHEDULE_DEFERRED_NOTIF",
    delay: delayMs,
  });
}

/** Fire an immediate test notification (called from Settings). */
export async function sendTestNotification(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const granted = await requestPermission();
  if (!granted) return false;
  const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
  showNotification(msg.title, msg.body, "tracksy-test");
  return true;
}
