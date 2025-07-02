import { useEffect, useState } from "react";
import {
  doc, getDoc, setDoc, updateDoc
} from "firebase/firestore";
import {
  ref as storageRef, uploadBytesResumable, getDownloadURL
} from "firebase/storage";
import { db, storage } from "src/firebase";
import { useAuth } from "src/context/AuthContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import makeAnimated from "react-select/animated";
import {
  COUNTRIES, COURSES, EDUCATION_LEVELS, GENDERS, UNIVERSITIES, SEMESTER_OPTIONS
} from "src/constants/DROPDOWN_OPTIONS";
import { Progress } from 'antd';

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
  internshipRole: "",
  internshipArea: "",
  internshipStart: null,
  internshipEnd: null,
  intake: "",
  preferredCountries: [],
  languages: "",
  tenthGrades: "",
  twelfthGrades: "",
  bachelorGrades: "",
  ieltsScore: "",
  otherLanguageGrades: "",
  desiredCourse: ""
};

const MyProfile = () => {
    const { user } = useAuth();
    const [form, setForm] = useState(initialForm);
    const [profileImage, setProfileImage] = useState("");
    const [uploadingImage, setUploadingImage] = useState(false);
    const [status, setStatus] = useState("");
    const [isExisting, setIsExisting] = useState(false);
    const [imageUploadProgress, setImageUploadProgress] = useState(0);

    useEffect(() => {
      if (user) {
        loadProfile();
        loadProfileImage();
      }
    }, [user]);

    const loadProfile = async () => {
      if (!user || !user.uid) return;

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

          setForm({ ...initialForm, ...convertedData });
          setIsExisting(true);
        } else {
            setForm(initialForm);
            setIsExisting(false);
        }
      } catch (err) {
        console.error("Load error:", err);
      }
    };

    const loadProfileImage = async () => {
      if (!user || !user.uid) return;

      try {
        const imgRef = storageRef(storage, `students/${user.uid}/profile.jpg`);
        const url = await getDownloadURL(imgRef);
        setProfileImage(url);
      } catch (err) {
        console.log(`No profile image found for user ${user.uid} or other load error:`, err.code);
        setProfileImage("");
      }
    };

    const handleImageUpload = async (e) => {
      const file = e.target.files?.[0];
      if (!user || !file) return;

      setUploadingImage(true);
      setStatus("Uploading image...");
      setImageUploadProgress(0);

      try {
        const imgRef = storageRef(storage, `students/${user.uid}/profile.jpg`);
        const uploadTask = uploadBytesResumable(imgRef, file);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setImageUploadProgress(progress);
            setStatus(`Uploading: ${progress.toFixed(0)}%`);
          },
          (error) => {
            console.error("Upload error", error);
            setStatus("❌ Failed to upload image.");
            setUploadingImage(false);
            setImageUploadProgress(0);
          },
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            setProfileImage(url);
            setStatus("✅ Profile picture uploaded!");
            setUploadingImage(false);
            setImageUploadProgress(100);
          }
        );

      } catch (err) {
        console.error("Upload setup error:", err);
        setStatus("❌ Failed to initiate upload.");
        setUploadingImage(false);
        setImageUploadProgress(0);
      }
    };

    const handleChange = (field, value) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
      if (!user) {
        setStatus("❌ User not authenticated.");
        return;
      }
      if (form.phone && !form.phone.match(/^\d{10}$/)) {
        return setStatus("❌ Invalid phone number. Must be 10 digits.");
      }

      setStatus("Saving profile...");
      try {
        const ref = doc(db, "users", user.uid, "profile", "info");
        isExisting ? await updateDoc(ref, form) : await setDoc(ref, form);
        setStatus("✅ Profile saved!");
      } catch (err) {
        console.error("Save error:", err);
        setStatus("❌ Save failed.");
      }
    };

    const totalFields = Object.keys(initialForm).length;

    const filledFields = Object.entries(form).filter(([key, value]) => {
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

    const profileCompletionProgress = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
    const missingFields = totalFields - filledFields;

    return (
      <div className="p-6 max-w-7xl mx-auto relative">
        {/* Adjusted flex behavior: keep full width on smaller screens, allow wrapping on larger */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4">
            {/* The main profile heading and progress bar */}
            <div className="mb-4 md:mb-0 md:flex-1"> {/* Added md:flex-1 to ensure it takes space */}
                <h2 className="text-2xl font-bold mb-2">🎓 My Profile</h2>
                <Progress
                  percent={profileCompletionProgress}
                  status={profileCompletionProgress === 100 ? 'success' : 'active'}
                  format={(percent) => `${filledFields}/${totalFields} fields completed (${percent.toFixed(0)}%)`}
                  strokeColor={{
                    from: '#374151',
                    to: '#FBCC32',
                  }}
                />
                <p className="text-sm text-gray-500 mt-1">
                  ({missingFields} Fields Still Missing)
                </p>
            </div>

            {/* Profile Picture Section - This section will now wrap below on small screens
                and float to the right on medium/large screens. */}
            <div className="flex flex-col items-center md:items-end md:ml-4"> {/* Added md:ml-4 for spacing */}
                {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-24 h-24 object-cover rounded-full border-2 border-gray-300 shadow-md mb-2" />
                ) : (
                    <div className="w-24 h-24 flex items-center justify-center bg-gray-200 text-gray-500 rounded-full border-2 border-gray-300 shadow-md mb-2 text-center text-xs p-2">
                        No image uploaded
                    </div>
                )}
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-yellow-500 cursor-pointer"
                />
                {uploadingImage && (
                    <Progress
                        percent={imageUploadProgress}
                        status={imageUploadProgress === 100 ? 'success' : 'active'}
                        format={(percent) => `${percent.toFixed(0)}%`}
                        showInfo={true}
                        strokeColor={{
                          from: '#108ee9',
                          to: '#87d068',
                        }}
                        className="w-full mt-1"
                    />
                )}
            </div>
        </div>

        {status && <p className="mt-4 text-sm text-blue-600">{status}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Form fields */}
          <input className="input" placeholder="Full Name" value={form.fullName} onChange={(e) => handleChange("fullName", e.target.value)} />
          <div className="flex gap-2">
            <DatePicker selected={form.dob} onChange={(d) => handleChange("dob", d)} placeholderText="Date of Birth" className="input" />
            <input className="input flex-1" placeholder="Place of Birth" value={form.placeOfBirth} onChange={(e) => handleChange("placeOfBirth", e.target.value)} />
          </div>
          <input className="input" placeholder="Address in India" value={form.address} onChange={(e) => handleChange("address", e.target.value)} />
          <input className="input" placeholder="Phone Number" value={form.phone} onChange={(e) => handleChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} />
          <input className="input" placeholder="School Name" value={form.schoolName} onChange={(e) => handleChange("schoolName", e.target.value)} />
          <div className="flex gap-2">
            <DatePicker selected={form.schoolStart} onChange={(d) => handleChange("schoolStart", d)} placeholderText="Start" className="input" />
            <DatePicker selected={form.schoolEnd} onChange={(d) => handleChange("schoolEnd", d)} placeholderText="End" className="input" />
          </div>
          <input className="input" placeholder="University Name" value={form.universityName} onChange={(e) => handleChange("universityName", e.target.value)} />
          <div className="flex gap-2">
            <DatePicker selected={form.uniStart} onChange={(d) => handleChange("uniStart", d)} placeholderText="Start" className="input" />
            <DatePicker selected={form.uniEnd} onChange={(d) => handleChange("uniEnd", d)} placeholderText="End" className="input" />
          </div>
          <Select options={COURSES} placeholder="Field of Study (Bachelor)" onChange={(e) => handleChange("fieldOfStudy", e.value)} value={COURSES.find(opt => opt.value === form.fieldOfStudy)} className="text-sm" />
          <input className="input" placeholder="Internship Role" value={form.internshipRole} onChange={(e) => handleChange("internshipRole", e.target.value)} />
          <input className="input" placeholder="Internship Area" value={form.internshipArea} onChange={(e) => handleChange("internshipArea", e.target.value)} />
          <div className="flex gap-2">
            <DatePicker selected={form.internshipStart} onChange={(d) => handleChange("internshipStart", d)} placeholderText="Start" className="input" />
            <DatePicker selected={form.internshipEnd} onChange={(d) => handleChange("internshipEnd", d)} placeholderText="End" className="input" />
          </div>
          <Select options={[{ value: "Summer", label: "Summer" }, { value: "Winter", label: "Winter" }]} placeholder="Intake" onChange={(e) => handleChange("intake", e.value)} value={{ value: form.intake, label: form.intake }} />
          <Select components={animatedComponents} isMulti options={COUNTRIES} placeholder="Preferred Countries" onChange={(opts) => handleChange("preferredCountries", opts.map(o => o.value))} value={COUNTRIES.filter(c => form.preferredCountries.includes(c.value))} />
          <input className="input" placeholder="Languages Spoken" value={form.languages} onChange={(e) => handleChange("languages", e.target.value)} />
          <input className="input" placeholder="10th Grades" value={form.tenthGrades} onChange={(e) => handleChange("tenthGrades", e.target.value)} />
          <input className="input" placeholder="12th Grades" value={form.twelfthGrades} onChange={(e) => handleChange("twelfthGrades", e.target.value)} />
          <input className="input" placeholder="Bachelor Grades" value={form.bachelorGrades} onChange={(e) => handleChange("bachelorGrades", e.target.value)} />
          <input className="input" placeholder="IELTS Score" value={form.ieltsScore} onChange={(e) => handleChange("ieltsScore", e.target.value)} />
          <input className="input" placeholder="Other Languages & Grades" value={form.otherLanguageGrades} onChange={(e) => handleChange("otherLanguageGrades", e.target.value)} />
          <Select options={COURSES} placeholder="Desired Course Abroad" onChange={(e) => handleChange("desiredCourse", e.value)} value={COURSES.find(opt => opt.value === form.desiredCourse)} />
        </div>

        <div className="mt-4 text-right">
          <button onClick={handleSave} className="bg-primary hover:bg-yellow-500 text-white px-6 py-2 rounded shadow">
            {isExisting ? "Update" : "Save"} Profile
          </button>
        </div>
      </div>
    );
};

export default MyProfile;