import { useEffect, useState } from "react";
import {
  doc, getDoc, setDoc, updateDoc, Timestamp // Import Timestamp
} from "firebase/firestore";
import {
  ref as storageRef, uploadBytesResumable, getDownloadURL
} from "firebase/storage";
import { db, storage } from "src/firebase";
import { useAuth } from "src/context/AuthContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select, { SingleValue, MultiValue } from "react-select"; // Import types for react-select
import makeAnimated from "react-select/animated";
import {
  COUNTRIES, COURSES, // Keep only used imports
  // Removed: EDUCATION_LEVELS, GENDERS, UNIVERSITIES, SEMESTER_OPTIONS
} from "src/constants/DROPDOWN_OPTIONS";
import { Progress } from 'antd'; // Ant Design Progress

const animatedComponents = makeAnimated();

// Define a type for your form state for better type safety
interface MyProfileForm {
  fullName: string;
  dob: Date | null;
  placeOfBirth: string;
  address: string;
  phone: string;
  schoolName: string;
  schoolStart: Date | null;
  schoolEnd: Date | null;
  universityName: string;
  uniStart: Date | null;
  uniEnd: Date | null;
  fieldOfStudy: string; // This is for Bachelor's field of study
  internshipRole: string;
  internshipArea: string;
  internshipStart: Date | null;
  internshipEnd: Date | null;
  intake: string; // Assuming this is for preferred intake (e.g., Summer/Winter)
  preferredCountries: string[];
  languages: string;
  tenthGrades: string;
  twelfthGrades: string;
  bachelorGrades: string;
  ieltsScore: string;
  otherLanguageGrades: string;
  desiredCourse: string; // This is the desired course abroad
}

// Export initialForm so it can be used by other components/hooks (e.g., useProfileCompletion)
export const initialForm: MyProfileForm = {
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
    const [form, setForm] = useState<MyProfileForm>(initialForm);
    const [profileImage, setProfileImage] = useState("");
    const [uploadingImage, setUploadingImage] = useState(false);
    const [status, setStatus] = useState("");
    const [isExisting, setIsExisting] = useState(false);
    const [imageUploadProgress, setImageUploadProgress] = useState(0);

    const loadProfile = async () => {
      if (!user || !user.uid) return;

      try {
        const ref = doc(db, "users", user.uid, "profile", "info");
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();

          // Convert Firebase Timestamps back to Date objects for DatePicker
          const convertedData: MyProfileForm = {
            ...initialForm, // Ensure all fields from initialForm are present
            ...data,
            dob: data.dob instanceof Timestamp ? data.dob.toDate() : null,
            schoolStart: data.schoolStart instanceof Timestamp ? data.schoolStart.toDate() : null,
            schoolEnd: data.schoolEnd instanceof Timestamp ? data.schoolEnd.toDate() : null,
            uniStart: data.uniStart instanceof Timestamp ? data.uniStart.toDate() : null,
            uniEnd: data.uniEnd instanceof Timestamp ? data.uniEnd.toDate() : null,
            internshipStart: data.internshipStart instanceof Timestamp ? data.internshipStart.toDate() : null,
            internshipEnd: data.internshipEnd instanceof Timestamp ? data.internshipEnd.toDate() : null,
            // Ensure preferredCountries is an array of strings
            preferredCountries: Array.isArray(data.preferredCountries) ? data.preferredCountries : [],
          };

          setForm(convertedData);
          setIsExisting(true);
        } else {
            setForm(initialForm); // If no profile, reset to initial empty form
            setIsExisting(false);
        }
      } catch (err) {
        console.error("Load error:", err);
        setStatus("❌ Failed to load profile.");
      }
    };

    const loadProfileImage = async () => {
      if (!user || !user.uid) return;

      try {
        const imgRef = storageRef(storage, `students/${user.uid}/profile.jpg`);
        const url = await getDownloadURL(imgRef);
        setProfileImage(url);
      } catch (err: any) {
        // console.log(`No profile image found for user ${user.uid} or other load error:`, err.code);
        setProfileImage(""); // Clear image if not found or error
      }
    };

    useEffect(() => {
      if (user) {
        loadProfile();
        loadProfileImage();
      }
    }, [user]); // Depend on user to re-run when user changes

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    // Generic handleChange for input fields
    const handleChange = (field: keyof MyProfileForm, value: string | Date | string[] | null) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    };

    // Typed handleChange for React-Select single value
    const handleSelectChange = (field: keyof MyProfileForm, option: SingleValue<{ value: string; label: string }>) => {
      handleChange(field, option ? option.value : "");
    };

    // Typed handleChange for React-Select multi value
    const handleMultiSelectChange = (field: keyof MyProfileForm, options: MultiValue<{ value: string; label: string }>) => {
      handleChange(field, options ? options.map(o => o.value) : []);
    };


    const handleSave = async () => {
      if (!user) {
        setStatus("❌ User not authenticated.");
        return;
      }
      if (form.phone && !form.phone.match(/^\d{10}$/)) {
        setStatus("❌ Invalid phone number. Must be 10 digits.");
        return;
      }

      setStatus("Saving profile...");
      try {
        const ref = doc(db, "users", user.uid, "profile", "info");
        // Firebase Timestamp conversion for Date objects before saving
        const formToSave: Record<string, any> = { ...form }; // Use Record<string, any> for dynamic keys

        for (const key in formToSave) {
            if (formToSave[key] instanceof Date) {
                // Check if the Date object is valid before converting to timestamp
                if (!isNaN(formToSave[key].getTime())) {
                    formToSave[key] = Timestamp.fromDate(formToSave[key]); // Convert to Firebase Timestamp
                } else {
                    formToSave[key] = null; // Set to null if invalid date
                }
            }
        }

        isExisting ? await updateDoc(ref, formToSave) : await setDoc(ref, formToSave);
        setStatus("✅ Profile saved!");
      } catch (err) {
        console.error("Save error:", err);
        setStatus("❌ Save failed.");
      }
    };

    // Calculate profile completion progress dynamically
    const totalFields = Object.keys(initialForm).length;

    const filledFields = Object.entries(form).filter(([_key, value]) => {
      // Exclude the profileImage related fields and other auxiliary states from completion calculation
      // Note: `keyof typeof initialForm` ensures that `key` is a valid form field name.
      // Auxiliary states like 'profileImage', 'uploadingImage', etc., are not part of initialForm,
      // so they naturally won't be considered here.
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
      // For any other type (number, boolean, etc.), check if it has a truthy value
      // Although MyProfileForm only contains string, Date, string[] for now
      return !!value;
    }).length;

    const profileCompletionProgress = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
    const missingFields = totalFields - filledFields;


    return (
      <div className="p-6 max-w-7xl mx-auto relative bg-white dark:bg-darkgray rounded-xl shadow-md">
        {/* Adjusted flex behavior: keep full width on smaller screens, allow wrapping on larger */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4">
            {/* The main profile heading and progress bar */}
            <div className="mb-4 md:mb-0 md:flex-1"> {/* Added md:flex-1 to ensure it takes space */}
                <h2 className="text-2xl font-bold mb-2 text-dark dark:text-white">🎓 My Profile</h2>
                <Progress
                  percent={profileCompletionProgress}
                  status={profileCompletionProgress === 100 ? 'success' : 'active'}
                  format={(percent) => `${filledFields}/${totalFields} fields completed (${percent?.toFixed(0)}%)`}
                  strokeColor={{
                    from: 'var(--color-darkgray)', // Using CSS variable
                    to: 'var(--color-warning)',    // Using CSS variable
                  }}
                />
                <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
                  ({missingFields} Fields Still Missing)
                </p>
            </div>

            {/* Profile Picture Section - This section will now wrap below on small screens
                and float to the right on medium/large screens. */}
            <div className="flex flex-col items-center md:items-end md:ml-4"> {/* Added md:ml-4 for spacing */}
                {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-24 h-24 object-cover rounded-full border-2 border-gray-300 shadow-md mb-2 dark:border-gray-600" />
                ) : (
                    <div className="w-24 h-24 flex items-center justify-center bg-gray-200 text-gray-500 rounded-full border-2 border-gray-300 shadow-md mb-2 text-center text-xs p-2 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600">
                        No image uploaded
                    </div>
                )}
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-yellow-500 cursor-pointer dark:file:bg-primary-dark dark:hover:file:bg-yellow-600 dark:text-gray-300"
                />
                {uploadingImage && (
                    <Progress
                        percent={imageUploadProgress}
                        status={imageUploadProgress === 100 ? 'success' : 'active'}
                        format={(percent) => `${percent?.toFixed(0)}%`}
                        showInfo={true}
                        strokeColor={{
                          from: 'var(--color-info)', // Using CSS variable
                          to: 'var(--color-success)', // Using CSS variable
                        }}
                        className="w-full mt-1"
                    />
                )}
            </div>
        </div>

        {status && <p className="mt-4 text-sm text-blue-600 dark:text-blue-400">{status}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Form fields */}
          <input
            className="input-field dark:bg-darkgraylight dark:text-white dark:border-gray-700"
            placeholder="Full Name"
            value={form.fullName}
            onChange={(e) => handleChange("fullName", e.target.value)}
          />
          <div className="flex gap-2">
            <DatePicker
              selected={form.dob}
              onChange={(d: Date | null) => handleChange("dob", d)} // Explicitly type d
              placeholderText="Date of Birth"
              className="input-field dark:bg-darkgraylight dark:text-white dark:border-gray-700 custom-datepicker"
              popperClassName="dark-datepicker-popper" // Custom class for popper
              calendarClassName="dark-datepicker-calendar" // Custom class for calendar
            />
            <input
              className="input-field flex-1 dark:bg-darkgraylight dark:text-white dark:border-gray-700"
              placeholder="Place of Birth"
              value={form.placeOfBirth}
              onChange={(e) => handleChange("placeOfBirth", e.target.value)}
            />
          </div>
          <input
            className="input-field dark:bg-darkgraylight dark:text-white dark:border-gray-700"
            placeholder="Address in India"
            value={form.address}
            onChange={(e) => handleChange("address", e.target.value)}
          />
          <input
            className="input-field dark:bg-darkgraylight dark:text-white dark:border-gray-700"
            placeholder="Phone Number"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
          />
          <input
            className="input-field dark:bg-darkgraylight dark:text-white dark:border-gray-700"
            placeholder="School Name"
            value={form.schoolName}
            onChange={(e) => handleChange("schoolName", e.target.value)}
          />
          <div className="flex gap-2">
            <DatePicker
              selected={form.schoolStart}
              onChange={(d: Date | null) => handleChange("schoolStart", d)}
              placeholderText="Start"
              className="input-field dark:bg-darkgraylight dark:text-white dark:border-gray-700 custom-datepicker"
              popperClassName="dark-datepicker-popper"
              calendarClassName="dark-datepicker-calendar"
            />
            <DatePicker
              selected={form.schoolEnd}
              onChange={(d: Date | null) => handleChange("schoolEnd", d)}
              placeholderText="End"
              className="input-field dark:bg-darkgraylight dark:text-white dark:border-gray-700 custom-datepicker"
              popperClassName="dark-datepicker-popper"
              calendarClassName="dark-datepicker-calendar"
            />
          </div>
          <input
            className="input-field dark:bg-darkgraylight dark:text-white dark:border-gray-700"
            placeholder="University Name"
            value={form.universityName}
            onChange={(e) => handleChange("universityName", e.target.value)}
          />
          <div className="flex gap-2">
            <DatePicker
              selected={form.uniStart}
              onChange={(d: Date | null) => handleChange("uniStart", d)}
              placeholderText="Start"
              className="input-field dark:bg-darkgraylight dark:text-white dark:border-gray-700 custom-datepicker"
              popperClassName="dark-datepicker-popper"
              calendarClassName="dark-datepicker-calendar"
            />
            <DatePicker
              selected={form.uniEnd}
              onChange={(d: Date | null) => handleChange("uniEnd", d)}
              placeholderText="End"
              className="input-field dark:bg-darkgraylight dark:text-white dark:border-gray-700 custom-datepicker"
              popperClassName="dark-datepicker-popper"
              calendarClassName="dark-datepicker-calendar"
            />
          </div>
          <Select
            options={COURSES}
            placeholder="Field of Study (Bachelor)"
            onChange={(option) => handleSelectChange("fieldOfStudy", option)}
            value={COURSES.find(opt => opt.value === form.fieldOfStudy)}
            className="text-sm react-select-container"
            classNamePrefix="react-select"
            styles={{ // Inline styles for react-select components for dark mode
              control: (provided) => ({
                ...provided,
                backgroundColor: 'var(--color-darkgraylight)',
                borderColor: 'var(--color-gray-700)',
                color: 'var(--color-white)',
              }),
              singleValue: (provided) => ({
                ...provided,
                color: 'var(--color-white)',
              }),
              input: (provided) => ({
                ...provided,
                color: 'var(--color-white)',
              }),
              placeholder: (provided) => ({
                ...provided,
                color: 'var(--color-gray-400)',
              }),
              menu: (provided) => ({
                ...provided,
                backgroundColor: 'var(--color-darkgraylight)',
              }),
              option: (provided, state) => ({
                ...provided,
                backgroundColor: state.isFocused ? 'var(--color-gray-700)' : 'var(--color-darkgraylight)',
                color: 'var(--color-white)',
                '&:active': {
                  backgroundColor: 'var(--color-gray-600)',
                },
              }),
            }}
          />
          <input
            className="input-field dark:bg-darkgraylight dark:text-white dark:border-gray-700"
            placeholder="Internship Role"
            value={form.internshipRole}
            onChange={(e) => handleChange("internshipRole", e.target.value)}
          />
          <input
            className="input-field dark:bg-darkgraylight dark:text-white dark:border-gray-700"
            placeholder="Internship Area"
            value={form.internshipArea}
            onChange={(e) => handleChange("internshipArea", e.target.value)}
          />
          <div className="flex gap-2">
            <DatePicker
              selected={form.internshipStart}
              onChange={(d: Date | null) => handleChange("internshipStart", d)}
              placeholderText="Start"
              className="input-field dark:bg-darkgraylight dark:text-white dark:border-gray-700 custom-datepicker"
              popperClassName="dark-datepicker-popper"
              calendarClassName="dark-datepicker-calendar"
            />
            <DatePicker
              selected={form.internshipEnd}
              onChange={(d: Date | null) => handleChange("internshipEnd", d)}
              placeholderText="End"
              className="input-field dark:bg-darkgraylight dark:text-white dark:border-gray-700 custom-datepicker"
              popperClassName="dark-datepicker-popper"
              calendarClassName="dark-datepicker-calendar"
            />
          </div>
          <Select
            options={[{ value: "Summer", label: "Summer" }, { value: "Winter", label: "Winter" }]}
            placeholder="Intake"
            onChange={(option) => handleSelectChange("intake", option)}
            value={form.intake ? { value: form.intake, label: form.intake } : null} // Handle empty string intake
            className="text-sm react-select-container"
            classNamePrefix="react-select"
            styles={{ // Inline styles for react-select components for dark mode
              control: (provided) => ({
                ...provided,
                backgroundColor: 'var(--color-darkgraylight)',
                borderColor: 'var(--color-gray-700)',
                color: 'var(--color-white)',
              }),
              singleValue: (provided) => ({
                ...provided,
                color: 'var(--color-white)',
              }),
              input: (provided) => ({
                ...provided,
                color: 'var(--color-white)',
              }),
              placeholder: (provided) => ({
                ...provided,
                color: 'var(--color-gray-400)',
              }),
              menu: (provided) => ({
                ...provided,
                backgroundColor: 'var(--color-darkgraylight)',
              }),
              option: (provided, state) => ({
                ...provided,
                backgroundColor: state.isFocused ? 'var(--color-gray-700)' : 'var(--color-darkgraylight)',
                color: 'var(--color-white)',
                '&:active': {
                  backgroundColor: 'var(--color-gray-600)',
                },
              }),
            }}
          />
          <Select
            components={animatedComponents}
            isMulti
            options={COUNTRIES}
            placeholder="Preferred Countries"
            onChange={(options) => handleMultiSelectChange("preferredCountries", options)}
            value={COUNTRIES.filter(c => form.preferredCountries.includes(c.value))}
            className="text-sm react-select-container"
            classNamePrefix="react-select"
            styles={{ // Inline styles for react-select components for dark mode
              control: (provided) => ({
                ...provided,
                backgroundColor: 'var(--color-darkgraylight)',
                borderColor: 'var(--color-gray-700)',
                color: 'var(--color-white)',
              }),
              multiValue: (provided) => ({
                ...provided,
                backgroundColor: 'var(--color-gray-700)',
              }),
              multiValueLabel: (provided) => ({
                ...provided,
                color: 'var(--color-white)',
              }),
              multiValueRemove: (provided) => ({
                ...provided,
                color: 'var(--color-gray-400)',
                '&:hover': {
                  backgroundColor: 'var(--color-red-500)',
                  color: 'var(--color-white)',
                },
              }),
              input: (provided) => ({
                ...provided,
                color: 'var(--color-white)',
              }),
              placeholder: (provided) => ({
                ...provided,
                color: 'var(--color-gray-400)',
              }),
              menu: (provided) => ({
                ...provided,
                backgroundColor: 'var(--color-darkgraylight)',
              }),
              option: (provided, state) => ({
                ...provided,
                backgroundColor: state.isFocused ? 'var(--color-gray-700)' : 'var(--color-darkgraylight)',
                color: 'var(--color-white)',
                '&:active': {
                  backgroundColor: 'var(--color-gray-600)',
                },
              }),
            }}
          />
          <input
            className="input-field dark:bg-darkgraylight dark:text-white dark:border-gray-700"
            placeholder="Languages Spoken (e.g., English, Hindi)"
            value={form.languages}
            onChange={(e) => handleChange("languages", e.target.value)}
          />
          <input
            className="input-field dark:bg-darkgraylight dark:text-white dark:border-gray-700"
            placeholder="10th Grades (e.g., 90%)"
            value={form.tenthGrades}
            onChange={(e) => handleChange("tenthGrades", e.target.value)}
          />
          <input
            className="input-field dark:bg-darkgraylight dark:text-white dark:border-gray-700"
            placeholder="12th Grades (e.g., 85%)"
            value={form.twelfthGrades}
            onChange={(e) => handleChange("twelfthGrades", e.target.value)}
          />
          <input
            className="input-field dark:bg-darkgraylight dark:text-white dark:border-gray-700"
            placeholder="Bachelor Grades (e.g., 7.5 CGPA)"
            value={form.bachelorGrades}
            onChange={(e) => handleChange("bachelorGrades", e.target.value)}
          />
          <input
            className="input-field dark:bg-darkgraylight dark:text-white dark:border-gray-700"
            placeholder="IELTS Score (e.g., 7.0 Overall)"
            value={form.ieltsScore}
            onChange={(e) => handleChange("ieltsScore", e.target.value)}
          />
          <input
            className="input-field"
            placeholder="Other Languages & Grades (e.g., French: B1)"
            value={form.otherLanguageGrades}
            onChange={(e) => handleChange("otherLanguageGrades", e.target.value)}
          />
          <Select
            options={COURSES}
            placeholder="Desired Course Abroad"
            onChange={(option) => handleSelectChange("desiredCourse", option)}
            value={COURSES.find(opt => opt.value === form.desiredCourse)}
            className="text-sm react-select-container"
            classNamePrefix="react-select"
            styles={{ // Inline styles for react-select components for dark mode
              control: (provided) => ({
                ...provided,
                backgroundColor: 'var(--color-darkgraylight)',
                borderColor: 'var(--color-gray-700)',
                color: 'var(--color-white)',
              }),
              singleValue: (provided) => ({
                ...provided,
                color: 'var(--color-white)',
              }),
              input: (provided) => ({
                ...provided,
                color: 'var(--color-white)',
              }),
              placeholder: (provided) => ({
                ...provided,
                color: 'var(--color-gray-400)',
              }),
              menu: (provided) => ({
                ...provided,
                backgroundColor: 'var(--color-darkgraylight)',
              }),
              option: (provided, state) => ({
                ...provided,
                backgroundColor: state.isFocused ? 'var(--color-gray-700)' : 'var(--color-darkgraylight)',
                color: 'var(--color-white)',
                '&:active': {
                  backgroundColor: 'var(--color-gray-600)',
                },
              }),
            }}
          />
        </div>

        <div className="mt-4 text-right">
          <button onClick={handleSave} className="bg-primary hover:bg-yellow-500 text-white px-6 py-2 rounded shadow dark:bg-primary-dark dark:hover:bg-yellow-600">
            {isExisting ? "Update" : "Save"} Profile
          </button>
        </div>
      </div>
    );
};

export default MyProfile;