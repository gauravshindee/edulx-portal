// src/hooks/useProfileCompletion.ts
import { useState, useEffect, useCallback } from "react";
import { doc, getDoc } from "firebase/firestore";
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

    const filledFields = Object.entries(formData).filter(([key, value]) => {
      if (value === null || value === undefined) {
        return false;
      }
      if (typeof value === 'string') {
        return value.trim() !== '';
      }
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      if (value instanceof Date) {
        return !isNaN(value.getTime());
      }
      return !!value;
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

        const convertedData = {
          ...data,
          dob: data.dob ? data.dob.toDate() : null,
          schoolStart: data.schoolStart ? data.schoolStart.toDate() : null,
          schoolEnd: data.schoolEnd ? data.schoolEnd.toDate() : null,
          uniStart: data.uniStart ? data.uniStart.toDate() : null,
          uniEnd: data.uniEnd ? data.uniEnd.toDate() : null,
          internshipStart: data.internshipStart ? data.internshipStart.toDate() : null,
          internshipEnd: data.internshipEnd ? data.internshipEnd.toDate() : null,
        };

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
  }, [user, calculateCompletion]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]); // Depend on loadProfile to re-run when user changes

  return { ...profileCompletion, loading, error, refreshProfileCompletion: loadProfile };
};