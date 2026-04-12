import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";

admin.initializeApp();

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
