import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";

admin.initializeApp();

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
  { title: "Hey. Log your expenses.", body: "Less than 10 seconds. Just do it." },
  { title: "Spending check 🧾", body: "Open Tracksy and log what you spent today." },
  { title: "Don't let it slip 📊", body: "Small logs daily keep financial chaos away." },
  { title: "Be honest with yourself 💡", body: "What have you spent money on today?" },
];

function randomMessage() {
  return MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
}

/**
 * Runs every 2 hours from 9am to 9pm IST (3:30 UTC to 15:30 UTC)
 * Cron: 30 3,5,7,9,11,13,15 * * *  → 9:00, 11:00, 13:00, 15:00, 17:00, 19:00, 21:00 IST
 * That's 7 runs/day. Each run has a 70% chance of actually firing → ~5 notifications/day avg.
 */
export const sendDailyReminders = onSchedule(
  {
    schedule: "30 3,5,7,9,11,13,15 * * *",
    timeZone: "Asia/Kolkata",
    region: "asia-south1",
  },
  async () => {
    // 70% chance to actually send (makes timing less predictable)
    if (Math.random() > 0.7) {
      console.log("Skipped this run (randomized)");
      return;
    }

    const snapshot = await admin.firestore().collection("fcmTokens").get();
    if (snapshot.empty) return;

    const msg = randomMessage();
    const tokens: string[] = snapshot.docs
      .map(d => d.data().token as string)
      .filter(Boolean);

    if (tokens.length === 0) return;

    // Send in batches of 500 (FCM limit)
    const chunks: string[][] = [];
    for (let i = 0; i < tokens.length; i += 500) {
      chunks.push(tokens.slice(i, i + 500));
    }

    for (const chunk of chunks) {
      const response = await admin.messaging().sendEachForMulticast({
        tokens: chunk,
        notification: { title: msg.title, body: msg.body },
        webpush: {
          notification: {
            icon: "/logotr.png",
            badge: "/logotr.png",
            tag: "tracksy-reminder",
            renotify: true,
          },
          fcmOptions: { link: "/" },
        },
      });

      // Clean up invalid/expired tokens
      const toDelete: Promise<admin.firestore.WriteResult>[] = [];
      response.responses.forEach((r, i) => {
        if (!r.success) {
          const code = r.error?.code;
          if (code === "messaging/invalid-registration-token" || code === "messaging/registration-token-not-registered") {
            // Find and delete the stale token doc
            const staleToken = chunk[i];
            const staleDocs = snapshot.docs.filter(d => d.data().token === staleToken);
            staleDocs.forEach(d => toDelete.push(d.ref.delete()));
          }
        }
      });
      await Promise.all(toDelete);
    }

    console.log(`Sent reminder to ${tokens.length} device(s): "${msg.title}"`);
  }
);
