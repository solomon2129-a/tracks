import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { getFirebaseDb } from "./firebase";

export type TransactionType = "expense" | "income";

export type ExpenseCategory = "Food" | "Travel" | "Bills" | "Shopping" | "Lifestyle" | "Other";
export type IncomeCategory = "Work" | "Project" | "Friends" | "Business" | "Gift" | "Other";
export type Category = ExpenseCategory | IncomeCategory;

export const EXPENSE_CATEGORIES: { label: ExpenseCategory; emoji: string }[] = [
  { label: "Food", emoji: "🍔" },
  { label: "Travel", emoji: "✈️" },
  { label: "Bills", emoji: "💡" },
  { label: "Shopping", emoji: "🛍️" },
  { label: "Lifestyle", emoji: "✨" },
  { label: "Other", emoji: "📦" },
];

export const INCOME_CATEGORIES: { label: IncomeCategory; emoji: string }[] = [
  { label: "Work", emoji: "💼" },
  { label: "Project", emoji: "🚀" },
  { label: "Friends", emoji: "👫" },
  { label: "Business", emoji: "📈" },
  { label: "Gift", emoji: "🎁" },
  { label: "Other", emoji: "💰" },
];

export const ALL_CATEGORY_EMOJI: Record<string, string> = {
  Food: "🍔",
  Travel: "✈️",
  Bills: "💡",
  Shopping: "🛍️",
  Lifestyle: "✨",
  Work: "💼",
  Project: "🚀",
  Friends: "👫",
  Business: "📈",
  Gift: "🎁",
  Other: "📦",
};

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: Category;
  createdAt: Timestamp;
}

export function subscribeToTransactions(
  userId: string,
  callback: (transactions: Transaction[]) => void
) {
  const q = query(
    collection(getFirebaseDb(), "users", userId, "transactions"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const transactions: Transaction[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Transaction[];
    callback(transactions);
  });
}

export async function addTransaction(
  userId: string,
  data: Omit<Transaction, "id" | "createdAt">
) {
  await addDoc(collection(getFirebaseDb(), "users", userId, "transactions"), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function deleteTransaction(userId: string, transactionId: string) {
  await deleteDoc(doc(getFirebaseDb(), "users", userId, "transactions", transactionId));
}
