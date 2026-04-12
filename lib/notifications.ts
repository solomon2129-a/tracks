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

const STORAGE_KEY = "tracksy_notifications";
const SCHEDULE_KEY = "tracksy_notif_scheduled_date";

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

/** Register the service worker (for background notification support) */
export async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    return reg;
  } catch {
    return null;
  }
}

/** Schedule 5–8 random notifications spread across 9am–10pm today.
 *  Only schedules once per calendar day (stored in localStorage). */
export function scheduleForToday(): void {
  if (typeof window === "undefined") return;
  if (Notification.permission !== "granted") return;
  if (!notificationsEnabled()) return;

  const today = new Date().toDateString();
  if (localStorage.getItem(SCHEDULE_KEY) === today) return; // already scheduled today
  localStorage.setItem(SCHEDULE_KEY, today);

  const count = 5 + Math.floor(Math.random() * 4); // 5-8 per day
  const now = Date.now();

  const dayStart = new Date(); dayStart.setHours(9, 0, 0, 0);
  const dayEnd   = new Date(); dayEnd.setHours(22, 0, 0, 0);

  const range = dayEnd.getTime() - dayStart.getTime();

  // Generate many candidates then pick evenly distributed ones
  const candidates: number[] = [];
  for (let i = 0; i < count * 5; i++) {
    const t = dayStart.getTime() + Math.random() * range;
    if (t > now + 2 * 60_000) candidates.push(t); // at least 2 min from now
  }
  candidates.sort((a, b) => a - b);

  // Pick `count` spread across the day by chunking
  const chunkSize = Math.floor(candidates.length / count);
  const chosen: number[] = [];
  for (let i = 0; i < count && i * chunkSize < candidates.length; i++) {
    const slice = candidates.slice(i * chunkSize, (i + 1) * chunkSize);
    chosen.push(slice[Math.floor(Math.random() * slice.length)]);
  }

  chosen.forEach((t, idx) => {
    const delay = t - now;
    setTimeout(() => fireNotification(idx), delay);
  });
}

function fireNotification(idx: number): void {
  if (!notificationsEnabled()) return;
  if (Notification.permission !== "granted") return;

  const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

  // Try via service worker first (persists when tab is in background)
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "SHOW_NOTIFICATION",
      title: msg.title,
      body: msg.body,
      tag: `tracksy-${idx}`,
    });
  } else {
    // Fallback: direct Notification API
    new Notification(msg.title, {
      body: msg.body,
      icon: "/logotr.png",
      badge: "/logotr.png",
      tag: `tracksy-${idx}`,
    });
  }
}
