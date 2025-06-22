// src/hooks/useTotalExpenses.ts
import { useState, useEffect } from "react"; // Removed useCallback
import { collection, onSnapshot, query, orderBy, Timestamp } from "firebase/firestore";
import { db, auth } from "src/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import dayjs from "dayjs";

// Re-defining Expense interface for clarity in the hook, ensure it matches TotalExpense.tsx
interface Expense {
  id?: string;
  userId: string;
  expenseType: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD format
  packageType?: 'Pro' | 'Premium';
  installmentNumber?: number;
}

interface ChartDataPoint {
  x: string; // Date
  y: number; // Cumulative amount
}

export const useTotalExpenses = () => {
  const [user, setUser] = useState<User | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [expenseGrowthSeries, setExpenseGrowthSeries] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen to auth state
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setTotalAmount(0);
        setExpenseGrowthSeries([]);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Fetch expenses and process for dashboard card
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const expensesCollectionRef = collection(db, `users/${user.uid}/expenses`);
    // Order by date to get chronological data for the graph
    const q = query(expensesCollectionRef, orderBy('date', 'asc'));

    const unsubscribeFirestore = onSnapshot(
      q,
      (snapshot) => {
        const expensesData: Expense[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            amount: Number(data.amount) || 0,
            // Ensure date is correctly converted from Firestore Timestamp or kept as string
            date: data.date instanceof Timestamp ? dayjs(data.date.toDate()).format('YYYY-MM-DD') : data.date,
          } as Expense;
        });

        // Calculate total expenditure
        const sum = expensesData.reduce((acc, expense) => acc + expense.amount, 0);
        setTotalAmount(sum);

        // Process data for the growth chart
        const dailyExpensesMap = new Map<string, number>();
        expensesData.forEach(exp => {
          const date = exp.date; // Date is already YYYY-MM-DD
          dailyExpensesMap.set(date, (dailyExpensesMap.get(date) || 0) + exp.amount);
        });

        const sortedDates = Array.from(dailyExpensesMap.keys()).sort();

        const chartPoints: ChartDataPoint[] = [];
        let cumulativeAmount = 0;
        sortedDates.forEach(date => {
          cumulativeAmount += dailyExpensesMap.get(date)!;
          chartPoints.push({ x: date, y: cumulativeAmount });
        });

        // No change needed here, as the chart component handles filling with 0 if data is less than 6 points
        // based on the logic: `lastSixPoints.length > 0 ? lastSixPoints : [0, 0, 0, 0, 0, 0]`

        setExpenseGrowthSeries(chartPoints);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching expenses for dashboard:", err);
        setError("Failed to load expense data.");
        setLoading(false);
      }
    );

    return () => unsubscribeFirestore(); // Cleanup listener on unmount
  }, [user]);

  return { totalAmount, expenseGrowthSeries, loading, error };
};