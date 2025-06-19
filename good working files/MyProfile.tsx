// src/views/student/MyProfile.tsx

import { useEffect, useState } from "react";
import { db } from "src/firebase";
import { useAuth } from "src/context/AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import DatePicker from "react-datepicker";
import Select from "react-select";
import "react-datepicker/dist/react-datepicker.css";
import countryList from "react-select-country-list";

const bachelorOptions = [
  { label: "B.Tech", value: "btech" },
  { label: "B.Sc", value: "bsc" },
  { label: "B.Com", value: "bcom" },
  { label: "BBA", value: "bba" },
  { label: "MBBS", value: "mbbs" },
  { label: "Other", value: "other" },
];

const intakeOptions = [
  { label: "Summer 2025", value: "summer2025" },
  { label: "Winter 2025", value: "winter2025" },
  { label: "Summer 2026", value: "summer2026" },
  { label: "Winter 2026", value: "winter2026" },
];

const MyProfile = () => {
  const { user } = useAuth();
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);

  const fields = [
    "fullName", "address", "dob", "placeOfBirth", "email", "phone", "gender",
    "educationLevel", "grades10", "grades12", "schoolStart", "schoolEnd",
    "schoolName", "universityName", "degreeStart", "degreeEnd", "degreeField",
    "degreeGrades", "totalSemesters", "hasReceivedDegree", "ielts", "internshipDuration",
    "internshipRole", "preferredCountries", "desiredCourse", "extraNotes"
  ];

  useEffect(() => {
    if (user) {
      const ref = doc(db, "users", user.uid, "profile", "studentDetails");
      getDoc(ref).then((snap) => {
        if (snap.exists()) setForm(snap.data());
      });
    }
  }, [user]);

  useEffect(() => {
    const filled = fields.filter((key) => form[key]);
    setProgress(Math.round((filled.length / fields.length) * 100));
  }, [form]);

  const handleChange = (key: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const ref = doc(db, "users", user.uid, "profile", "studentDetails");
    await setDoc(ref, form, { merge: true });
    setSaving(false);
    alert("✅ Profile saved successfully!");
  };

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <h2 className="text-2xl font-semibold mb-2">🎓 My Profile</h2>
      <div className="w-full bg-gray-200 rounded h-2 mb-4">
        <div
          className="bg-yellow-500 h-2 rounded"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-sm text-gray-600 mb-6">
        {progress} of {fields.length} fields completed ({progress}%)
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input placeholder="Full Name" value={form.fullName || ""} onChange={(e) => handleChange("fullName", e.target.value)} className="input" />
        <input placeholder="Address" value={form.address || ""} onChange={(e) => handleChange("address", e.target.value)} className="input" />

        <DatePicker
          selected={form.dob ? new Date(form.dob) : null}
          onChange={(date) => handleChange("dob", date?.toISOString())}
          placeholderText="Date of Birth"
          className="input"
        />
        <input placeholder="Place of Birth" value={form.placeOfBirth || ""} onChange={(e) => handleChange("placeOfBirth", e.target.value)} className="input" />

        <input placeholder="Email" value={form.email || ""} onChange={(e) => handleChange("email", e.target.value)} className="input" />
        <input type="tel" placeholder="Phone (10-digit)" value={form.phone || ""} onChange={(e) => handleChange("phone", e.target.value)} className="input" />

        <input placeholder="Gender" value={form.gender || ""} onChange={(e) => handleChange("gender", e.target.value)} className="input" />
        <input placeholder="Level of Education" value={form.educationLevel || ""} onChange={(e) => handleChange("educationLevel", e.target.value)} className="input" />

        <input placeholder="10th Grades" value={form.grades10 || ""} onChange={(e) => handleChange("grades10", e.target.value)} className="input" />
        <input placeholder="12th/Diploma Grades" value={form.grades12 || ""} onChange={(e) => handleChange("grades12", e.target.value)} className="input" />

        <DatePicker
          selected={form.schoolStart ? new Date(form.schoolStart) : null}
          onChange={(date) => handleChange("schoolStart", date?.toISOString())}
          placeholderText="School Start Date"
          className="input"
        />
        <DatePicker
          selected={form.schoolEnd ? new Date(form.schoolEnd) : null}
          onChange={(date) => handleChange("schoolEnd", date?.toISOString())}
          placeholderText="School End Date"
          className="input"
        />

        <input placeholder="School Name" value={form.schoolName || ""} onChange={(e) => handleChange("schoolName", e.target.value)} className="input" />
        <input placeholder="University Name" value={form.universityName || ""} onChange={(e) => handleChange("universityName", e.target.value)} className="input" />

        <DatePicker
          selected={form.degreeStart ? new Date(form.degreeStart) : null}
          onChange={(date) => handleChange("degreeStart", date?.toISOString())}
          placeholderText="Degree Start Date"
          className="input"
        />
        <DatePicker
          selected={form.degreeEnd ? new Date(form.degreeEnd) : null}
          onChange={(date) => handleChange("degreeEnd", date?.toISOString())}
          placeholderText="Degree End Date"
          className="input"
        />

        <input placeholder="Degree Field" value={form.degreeField || ""} onChange={(e) => handleChange("degreeField", e.target.value)} className="input" />
        <input placeholder="No. of Semesters" value={form.totalSemesters || ""} onChange={(e) => handleChange("totalSemesters", e.target.value)} className="input" />
        <input placeholder="Degree Grades" value={form.degreeGrades || ""} onChange={(e) => handleChange("degreeGrades", e.target.value)} className="input" />
        <input placeholder="IELTS Score" value={form.ielts || ""} onChange={(e) => handleChange("ielts", e.target.value)} className="input" />

        <input placeholder="Internship Duration" value={form.internshipDuration || ""} onChange={(e) => handleChange("internshipDuration", e.target.value)} className="input" />
        <input placeholder="Internship Role" value={form.internshipRole || ""} onChange={(e) => handleChange("internshipRole", e.target.value)} className="input" />

        <Select
          options={countryList().getData()}
          isMulti
          placeholder="Preferred Countries"
          value={form.preferredCountries || []}
          onChange={(val) => handleChange("preferredCountries", val)}
        />
        <Select
          options={bachelorOptions}
          placeholder="Desired Course Abroad"
          value={form.desiredCourse}
          onChange={(val) => handleChange("desiredCourse", val)}
        />

        <textarea
          placeholder="Extra Notes / Bullet Points"
          value={form.extraNotes || ""}
          onChange={(e) => handleChange("extraNotes", e.target.value)}
          className="input col-span-1 md:col-span-2"
        />
      </div>

      <button
        onClick={handleSave}
        className="mt-6 bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded shadow"
        disabled={saving}
      >
        {saving ? "Saving..." : "Save Profile"}
      </button>
    </div>
  );
};

export default MyProfile;
