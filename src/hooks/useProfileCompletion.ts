// src/hooks/useProfileCompletion.ts
import { useState, useEffect, useCallback } from "react";
import { doc, getDoc, Timestamp } from "firebase/firestore"; // Import Timestamp for explicit type checking
import { db } from "src/firebase"; // Make sure src/firebase is correctly set up
import { useAuth } from "src/context/AuthContext"; // Assuming your AuthContext path is correct

// Import initial form structure from MyProfile to use for calculation
import { initialForm } from "src/views/student/MyProfile"; // Adjust path if MyProfile is not directly in views/student

export const useProfileCompletion = () => {
  const { user } = useAuth();
  const [profileCompletion, setProfileCompletion] = useState({
    percent: 0,
    filledFields: 0,
    totalFields: 0,
    missingFields: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateCompletion = useCallback((formData: typeof initialForm) => {
    const totalFields = Object.keys(initialForm).length;

    const filledFields = Object.entries(formData).filter(([_key, value]) => { // Fix: Add underscore to '_key'
      if (value === null || value === undefined) {
        return false;
      }
      if (typeof value === 'string') {
        return value.trim() !== '';
      }
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      // Fix: Add a type guard before instanceof Date
      if (typeof value === 'object' && value instanceof Date) {
        return !isNaN(value.getTime());
      }
      // If it's a Firebase Timestamp, check if it has a toDate() method and it's a valid date
      if (typeof value === 'object' && (value as Timestamp)?.toDate instanceof Function) {
        const date = (value as Timestamp).toDate();
        return !isNaN(date.getTime());
      }
      return !!value; // For boolean, number (non-zero), etc.
    }).length;

    const percent = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
    const missingFields = totalFields - filledFields;

    setProfileCompletion({ percent, filledFields, totalFields, missingFields });
  }, []);

  const loadProfile = useCallback(async () => {
    if (!user || !user.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const ref = doc(db, "users", user.uid, "profile", "info");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();

        // Convert Firestore Timestamps to Date objects for direct use
        // Also ensure these fields exist before attempting .toDate()
        const convertedData = {
          ...data,
          dob: data.dob instanceof Timestamp ? data.dob.toDate() : data.dob || null,
          schoolStart: data.schoolStart instanceof Timestamp ? data.schoolStart.toDate() : data.schoolStart || null,
          schoolEnd: data.schoolEnd instanceof Timestamp ? data.schoolEnd.toDate() : data.schoolEnd || null,
          uniStart: data.uniStart instanceof Timestamp ? data.uniStart.toDate() : data.uniStart || null,
          uniEnd: data.uniEnd instanceof Timestamp ? data.uniEnd.toDate() : data.uniEnd || null,
          internshipStart: data.internshipStart instanceof Timestamp ? data.internshipStart.toDate() : data.internshipStart || null,
          internshipEnd: data.internshipEnd instanceof Timestamp ? data.internshipEnd.toDate() : data.internshipEnd || null,
        };

        // Pass the converted data to calculateCompletion
        calculateCompletion({ ...initialForm, ...convertedData });
      } else {
        // No profile exists, treat as all fields empty (or initial state)
        calculateCompletion(initialForm);
      }
    } catch (err) {
      console.error("Load profile for completion error:", err);
      setError("Failed to load profile completion data.");
      calculateCompletion(initialForm); // Fallback to initial form if error
    } finally {
      setLoading(false);
    }
  }, [user, calculateCompletion]); // Depend on loadProfile to re-run when user changes

  useEffect(() => {
    loadProfile();
  }, [loadProfile]); // Depend on loadProfile to re-run when loadProfile changes (due to useCallback deps)

  return { ...profileCompletion, loading, error, refreshProfileCompletion: loadProfile };
};