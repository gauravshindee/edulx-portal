// src/hooks/useLoginActivity.ts
import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, limit, DocumentData, Timestamp } from "firebase/firestore";
import { db, auth } from "src/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
// import dayjs from "dayjs"; // Removed as it's not used in this hook

export interface LoginEvent {
  id: string;
  timestamp: Timestamp;
  activityType: string;
}

export const useLoginActivity = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loginActivities, setLoginActivities] = useState<LoginEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoginActivities([]);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const loginHistoryCollectionRef = collection(db, `users/${user.uid}/loginHistory`);

    const q = query(loginHistoryCollectionRef, orderBy("timestamp", "desc"), limit(50));

    const unsubscribeFirestore = onSnapshot(
      q,
      (snapshot) => {
        const activities: LoginEvent[] = snapshot.docs.map((doc) => {
          const data = doc.data() as DocumentData;
          return {
            id: doc.id,
            timestamp: data.timestamp,
            activityType: data.activityType,
          };
        });
        setLoginActivities(activities);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching login activities:", err);
        setError("Failed to load login activities.");
        setLoading(false);
      }
    );

    return () => unsubscribeFirestore();
  }, [user]);

  return { loginActivities, loading, error };
};