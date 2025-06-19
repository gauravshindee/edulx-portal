// src/hooks/useLoginActivity.ts
import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, limit, DocumentData, Timestamp } from "firebase/firestore";
import { db, auth } from "src/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import dayjs from "dayjs";

export interface LoginEvent {
  id: string;
  timestamp: Timestamp;
  activityType: string;
}

export const useLoginActivity = () => {
  const [user, setUser] = useState<User | null>(null);
  // Corrected: Removed the 'admittedUniversities' state variable as it was redundant.
  const [loginActivities, setLoginActivities] = useState<LoginEvent[]>([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // This effect listens for Firebase Auth state changes
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // If no user is logged in, clear activities and stop loading
      if (!currentUser) {
        setLoginActivities([]); 
        setLoading(false);
      }
    });
    // Cleanup function for the auth state listener
    return () => unsubscribeAuth();
  }, []); // Empty dependency array means this runs once on mount

  useEffect(() => {
    // This effect runs when the 'user' state changes
    if (!user) {
      // If there's no user, we're not loading activities
      setLoading(false);
      return;
    }

    setLoading(true); // Start loading when a user is detected
    setError(null);    // Clear any previous errors

    // Construct the reference to the user's specific loginHistory subcollection
    const loginHistoryCollectionRef = collection(db, `users/${user.uid}/loginHistory`);
    
    // Create a query: order by timestamp (descending) and limit to the last 50 logins
    const q = query(loginHistoryCollectionRef, orderBy("timestamp", "desc"), limit(50)); 

    // Set up a real-time listener for the Firestore query
    const unsubscribeFirestore = onSnapshot(
      q,
      (snapshot) => {
        // Map the Firestore document snapshot to your LoginEvent interface
        const activities: LoginEvent[] = snapshot.docs.map((doc) => {
          const data = doc.data() as DocumentData;
          return {
            id: doc.id,
            // Ensure timestamp is of type Timestamp from 'firebase/firestore'
            timestamp: data.timestamp, 
            activityType: data.activityType,
          };
        });
        // Update the state with the fetched activities
        setLoginActivities(activities);
        setLoading(false); // Stop loading once data is fetched
      },
      (err) => {
        // Handle any errors during the Firestore fetch
        console.error("Error fetching login activities:", err);
        setError("Failed to load login activities.");
        setLoading(false);
      }
    );

    // Cleanup function for the Firestore listener
    return () => unsubscribeFirestore();
  }, [user]); // This effect runs whenever the 'user' object changes

  // Return the state variables for consumption by components
  return { loginActivities, loading, error };
};