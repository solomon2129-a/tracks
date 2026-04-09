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
  getDoc,
  setDoc,
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
  | "Savings"
  | "Other";

export type IncomeCategory =
  | "Work"
  | "Project"
  | "Friends"
  | "Business"
  | "Gift"
  | "Other";

export type Category = ExpenseCategory | IncomeCategory;

export type AccountType = "bank" | "cash" | "credit" | "savings" | "other";

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
  { label: "Savings" },
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

export const ACCOUNT_TYPES: { label: AccountType; icon: string }[] = [
  { label: "bank", icon: "🏦" },
  { label: "cash", icon: "💵" },
  { label: "credit", icon: "💳" },
  { label: "savings", icon: "🏦" },
  { label: "other", icon: "💰" },
];

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: Category;
  accountId: string;
  createdAt: Timestamp;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Timestamp;
  priority: "low" | "medium" | "high";
  createdAt: Timestamp;
}

export interface UserProfile {
  accounts: Account[];
  goals: Goal[];
}

// ── Account Operations ──
export async function getOrCreateUserProfile(userId: string): Promise<UserProfile> {
  const docRef = doc(getFirebaseDb(), "users", userId, "profile", "data");
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }

  const defaultProfile: UserProfile = {
    accounts: [],
    goals: [],
  };

  await setDoc(docRef, defaultProfile);
  return defaultProfile;
}

export async function updateAccounts(userId: string, accounts: Account[]): Promise<void> {
  const docRef = doc(getFirebaseDb(), "users", userId, "profile", "data");
  const docSnap = await getDoc(docRef);
  const profile = docSnap.exists() ? (docSnap.data() as UserProfile) : { accounts: [], goals: [] };
  await setDoc(docRef, { ...profile, accounts });
}

export async function updateGoals(userId: string, goals: Goal[]): Promise<void> {
  const docRef = doc(getFirebaseDb(), "users", userId, "profile", "data");
  const docSnap = await getDoc(docRef);
  const profile = docSnap.exists() ? (docSnap.data() as UserProfile) : { accounts: [], goals: [] };
  await setDoc(docRef, { ...profile, goals });
}

export function subscribeToProfile(
  userId: string,
  callback: (profile: UserProfile) => void
) {
  const docRef = doc(getFirebaseDb(), "users", userId, "profile", "data");

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as UserProfile);
      }
    },
    (error) => {
      console.warn("Profile subscription error:", error.code);
    }
  );
}

// ── Transaction Operations ──
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
