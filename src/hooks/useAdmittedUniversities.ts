// src/hooks/useAdmittedUniversities.ts
import { useState, useEffect } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore"; // Removed DocumentData
import { db, auth } from "src/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

export interface ApplicationData {
  id?: string;
  userId: string;
  university: string; // Ensure this matches exactly with Firebase field
  course: string;
  city: string;
  applicationStatus: string;
}

export const useAdmittedUniversities = () => {
  const [user, setUser] = useState<User | null>(null);
  const [admittedUniversities, setAdmittedUniversities] = useState<ApplicationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setAdmittedUniversities([]);
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

    const applicationsCollectionRef = collection(db, `users/${user.uid}/applications`);
    const q = query(applicationsCollectionRef, where("applicationStatus", "==", "Admitted"));

    const unsubscribeFirestore = onSnapshot(
      q,
      (snapshot) => {
        const admittedData: ApplicationData[] = snapshot.docs.map((doc) => {
          const rawData = doc.data(); // Get raw data before casting
          // console.log("Raw Firestore document data:", rawData); // <--- Kept commented for cleanliness

          const data = rawData as ApplicationData; // Cast to your interface

          if (!data.university) {
            console.warn(`Application ${doc.id} is missing or has an empty 'university' field.`);
          }

          return {
            id: doc.id,
            university: data.university || 'N/A',
            course: data.course || 'N/A',
            city: data.city || 'N/A',
            applicationStatus: data.applicationStatus || 'N/A',
            userId: data.userId || user.uid, // Ensure userId is present
          };
        });
        setAdmittedUniversities(admittedData);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching admitted universities:", err);
        setError("Failed to load admitted universities.");
        setLoading(false);
      }
    );

    return () => unsubscribeFirestore();
  }, [user]);

  return { admittedUniversities, loading, error };
};