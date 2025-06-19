import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "src/firebase";
import { useAuth } from "src/context/AuthContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import makeAnimated from "react-select/animated";
import { COUNTRIES, COURSES } from "src/constants/DROPDOWN_OPTIONS";

const animatedComponents = makeAnimated();

const initialForm = {
  fullName: "",
  dob: null,
  placeOfBirth: "",
  address: "",
  phone: "",
  schoolName: "",
  schoolStart: null,
  schoolEnd: null,
  universityName: "",
  uniStart: null,
  uniEnd: null,
  fieldOfStudy: "",
  internshipStart: null,
  internshipEnd: null,
  internshipRole: "",
  internshipArea: "",
  intake: "",
  preferredCountries: [],
  languages: "",
  bachelorGrades: "",
  tenthGrades: "",
  twelfthGrades: "",
  ieltsScore: "",
  otherLanguageGrades: "",
  desiredCourse: "",
};

const MyProfile = () => {
  const { user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [isExisting, setIsExisting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const ref = doc(db, "users", user.uid, "profile", "info");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setForm(snap.data());
        setIsExisting(true);
      }
    } catch (err) {
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setStatus("Saving...");
    try {
      const ref = doc(db, "users", user.uid, "profile", "info");
      isExisting ? await updateDoc(ref, form) : await setDoc(ref, form);
      setStatus("✅ Saved successfully!");
      setIsExisting(true);
    } catch (err) {
      console.error("Save error:", err);
      setStatus("❌ Save failed.");
    }
  };

  const totalFields = Object.keys(initialForm).length;
  const filledFields = Object.values(form).filter(
    (val) => val && (Array.isArray(val) ? val.length > 0 : true)
  ).length;
  const progress = Math.round((filledFields / totalFields) * 100);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">🎓 My Profile</h2>
        <div className="h-3 w-full bg-gray-200 rounded">
          <div
            className="h-3 bg-yellow-500 rounded"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {filledFields} of {totalFields} fields completed ({progress}%)
        </p>
      </div>

      {status && (
        <div className="mb-4 p-2 bg-blue-50 text-blue-700 text-sm rounded text-center">
          {status}
        </div>
      )}

      {loading ? (
        <p>Loading profile...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input placeholder="Full Name" className="input" value={form.fullName} onChange={(e) => handleChange("fullName", e.target.value)} />
          <div className="flex gap-2">
            <DatePicker
              selected={form.dob ? new Date(form.dob) : null}
              onChange={(date) => handleChange("dob", date)}
              placeholderText="Date of Birth"
              className="input"
            />
            <input
              placeholder="Place of Birth"
              className="input flex-1"
              value={form.placeOfBirth}
              onChange={(e) => handleChange("placeOfBirth", e.target.value)}
            />
          </div>

          <input placeholder="Address in India" className="input" value={form.address} onChange={(e) => handleChange("address", e.target.value)} />
          <input placeholder="Phone Number" className="input" maxLength={10} value={form.phone} onChange={(e) => handleChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} />

          <input placeholder="School Name" className="input" value={form.schoolName} onChange={(e) => handleChange("schoolName", e.target.value)} />
          <div className="flex gap-2">
            <DatePicker selected={form.schoolStart ? new Date(form.schoolStart) : null} onChange={(d) => handleChange("schoolStart", d)} placeholderText="Start" className="input" />
            <DatePicker selected={form.schoolEnd ? new Date(form.schoolEnd) : null} onChange={(d) => handleChange("schoolEnd", d)} placeholderText="End" className="input" />
          </div>

          <input placeholder="University Name" className="input" value={form.universityName} onChange={(e) => handleChange("universityName", e.target.value)} />
          <div className="flex gap-2">
            <DatePicker selected={form.uniStart ? new Date(form.uniStart) : null} onChange={(d) => handleChange("uniStart", d)} placeholderText="Start" className="input" />
            <DatePicker selected={form.uniEnd ? new Date(form.uniEnd) : null} onChange={(d) => handleChange("uniEnd", d)} placeholderText="End" className="input" />
          </div>

          <Select options={COURSES} placeholder="Field of Study (Bachelor)" className="text-sm" onChange={(e) => handleChange("fieldOfStudy", e.value)} defaultValue={COURSES.find(opt => opt.value === form.fieldOfStudy)} />

          <input placeholder="Internship Role" className="input" value={form.internshipRole} onChange={(e) => handleChange("internshipRole", e.target.value)} />
          <input placeholder="Internship Area" className="input" value={form.internshipArea} onChange={(e) => handleChange("internshipArea", e.target.value)} />
          <div className="flex gap-2">
            <DatePicker selected={form.internshipStart ? new Date(form.internshipStart) : null} onChange={(d) => handleChange("internshipStart", d)} placeholderText="Start" className="input" />
            <DatePicker selected={form.internshipEnd ? new Date(form.internshipEnd) : null} onChange={(d) => handleChange("internshipEnd", d)} placeholderText="End" className="input" />
          </div>

          <Select options={[{ value: "Summer", label: "Summer" }, { value: "Winter", label: "Winter" }]} placeholder="Intake" onChange={(e) => handleChange("intake", e.value)} defaultValue={{ value: form.intake, label: form.intake }} />
          <Select components={animatedComponents} options={COUNTRIES} isMulti placeholder="Preferred Countries" onChange={(opts) => handleChange("preferredCountries", opts.map((o) => o.value))} value={COUNTRIES.filter(c => form.preferredCountries.includes(c.value))} />

          <input placeholder="Languages Spoken" className="input" value={form.languages} onChange={(e) => handleChange("languages", e.target.value)} />
          <input placeholder="10th Grades" className="input" value={form.tenthGrades} onChange={(e) => handleChange("tenthGrades", e.target.value)} />
          <input placeholder="12th Grades" className="input" value={form.twelfthGrades} onChange={(e) => handleChange("twelfthGrades", e.target.value)} />
          <input placeholder="Bachelor Grades" className="input" value={form.bachelorGrades} onChange={(e) => handleChange("bachelorGrades", e.target.value)} />
          <input placeholder="IELTS Score" className="input" value={form.ieltsScore} onChange={(e) => handleChange("ieltsScore", e.target.value)} />
          <input placeholder="Other Languages & Grades" className="input" value={form.otherLanguageGrades} onChange={(e) => handleChange("otherLanguageGrades", e.target.value)} />
          <Select options={COURSES} placeholder="Desired Course Abroad" onChange={(e) => handleChange("desiredCourse", e.value)} defaultValue={COURSES.find(opt => opt.value === form.desiredCourse)} />
        </div>
      )}

      <div className="mt-6 text-right">
        <button
          onClick={handleSave}
          className="bg-primary hover:bg-yellow-500 text-white px-6 py-2 rounded shadow"
        >
          {isExisting ? "Update" : "Save"} Profile
        </button>
      </div>
    </div>
  );
};

export default MyProfile;
