import { getToken } from "firebase/messaging";
import { getFirebaseMessaging } from "./firebase";
import { saveFcmToken } from "./firestore";

const MESSAGES = [
  { title: "Did you buy something?", body: "Log it before you forget. 10 seconds." },
  { title: "Quick check-in 👀", body: "What did you spend money on recently?" },
  { title: "₹ log time", body: "Don't let expenses pile up. Log now." },
  { title: "Your wallet is watching 👁️", body: "Spent anything in the last few hours?" },
  { title: "Stop. Log your expenses.", body: "Future you will thank present you." },
  { title: "Money check 💸", body: "Spent anything recently? Log it in Tracksy." },
  { title: "Your goals won't fund themselves 🎯", body: "Stay on track. Log what you spent." },
  { title: "Did you pay for something?", body: "Log it. Now. Don't be lazy about it." },
  { title: "You have goals, remember?", body: "Every rupee logged is a step closer." },
  { title: "What did you spend today?", body: "Tap to log it before you forget." },
  { title: "₹₹₹", body: "Money tracked is money managed. Open Tracksy." },
  { title: "Hey. Log your expenses.", body: "Seriously. It takes less than 10 seconds." },
  { title: "Spending check 🧾", body: "Open Tracksy and log what you spent today." },
  { title: "Don't let it slip 📊", body: "Small logs daily keep financial chaos away." },
  { title: "Be honest with yourself 💡", body: "What have you spent money on today?" },
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

  const today = new Date().toDateString();
  if (localStorage.getItem(SCHEDULE_KEY) === today) return;
  localStorage.setItem(SCHEDULE_KEY, today);

  const count = 5 + Math.floor(Math.random() * 4); // 5–8
  const now   = Date.now();
  const start = new Date(); start.setHours(9, 0, 0, 0);
  const end   = new Date(); end.setHours(22, 0, 0, 0);
  const range = end.getTime() - start.getTime();

  const candidates: number[] = [];
  for (let i = 0; i < count * 5; i++) {
    const t = start.getTime() + Math.random() * range;
    if (t > now + 2 * 60_000) candidates.push(t);
  }
  candidates.sort((a, b) => a - b);

  const chunkSize = Math.floor(candidates.length / count);
  const chosen: number[] = [];
  for (let i = 0; i < count && i * chunkSize < candidates.length; i++) {
    const slice = candidates.slice(i * chunkSize, (i + 1) * chunkSize);
    chosen.push(slice[Math.floor(Math.random() * slice.length)]);
  }

  chosen.forEach((t, idx) => {
    setTimeout(() => fireLocalNotification(idx), t - now);
  });
}

function fireLocalNotification(idx: number): void {
  if (!notificationsEnabled() || Notification.permission !== "granted") return;
  const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "SHOW_NOTIFICATION",
      title: msg.title,
      body: msg.body,
      tag: `tracksy-local-${idx}`,
    });
  } else {
    new Notification(msg.title, {
      body: msg.body,
      icon: "/logotr.png",
      badge: "/logotr.png",
      tag: `tracksy-local-${idx}`,
    });
  }
}
