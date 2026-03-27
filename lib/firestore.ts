import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { getFirebaseDb } from "./firebase";

export type TransactionType = "expense" | "income";

export type ExpenseCategory =
  | "Food"
  | "Groceries"
  | "Transport"
  | "Travel"
  | "Bills"
  | "Shopping"
  | "Health"
  | "Entertainment"
  | "Cigarettes"
  | "Lifestyle"
  | "Other";

export type IncomeCategory =
  | "Work"
  | "Project"
  | "Friends"
  | "Business"
  | "Gift"
  | "Other";

export type Category = ExpenseCategory | IncomeCategory;

export const EXPENSE_CATEGORIES: { label: ExpenseCategory }[] = [
  { label: "Food" },
  { label: "Groceries" },
  { label: "Transport" },
  { label: "Travel" },
  { label: "Bills" },
  { label: "Shopping" },
  { label: "Health" },
  { label: "Entertainment" },
  { label: "Cigarettes" },
  { label: "Lifestyle" },
  { label: "Other" },
];

export const INCOME_CATEGORIES: { label: IncomeCategory }[] = [
  { label: "Work" },
  { label: "Project" },
  { label: "Friends" },
  { label: "Business" },
  { label: "Gift" },
  { label: "Other" },
];

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

  return onSnapshot(
    q,
    (snapshot) => {
      const transactions: Transaction[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Transaction[];
      callback(transactions);
    },
    (error) => {
      console.warn("Firestore subscription error:", error.code);
      // Silently fail — page stays usable, data just won't load until rules are set
    }
  );
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

export async function deleteAllTransactions(userId: string) {
  const snapshot = await getDocs(
    collection(getFirebaseDb(), "users", userId, "transactions")
  );
  await Promise.all(snapshot.docs.map(d => deleteDoc(d.ref)));
}
