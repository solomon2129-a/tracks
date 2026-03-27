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
import { db } from "./firebase";

export type TransactionType = "expense" | "income";

export type Category = "Food" | "Travel" | "Bills" | "Lifestyle" | "Other";

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
    collection(db, "users", userId, "transactions"),
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
  await addDoc(collection(db, "users", userId, "transactions"), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function deleteTransaction(userId: string, transactionId: string) {
  await deleteDoc(doc(db, "users", userId, "transactions", transactionId));
}
