// src/views/auth/register/Register.tsx
import { useState, FormEvent, ChangeEvent } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth"; // Removed FirebaseError from here
import { auth } from "src/firebase";
import { doc, setDoc } from "firebase/firestore";
import { db } from "src/firebase";
import FullLogo from "src/layouts/full/shared/logo/FullLogo";
import { Link } from "react-router-dom";
import { getFriendlyFirebaseError } from "src/utils/firebaseErrorMessages";

// Import FirebaseError from 'firebase/app' if you want to use instanceof.
// If not, you'll rely on checking properties like 'code' and 'message'.
// For modern Firebase SDK, checking 'code' and 'message' is often sufficient.
// If you uncomment the line below, make sure 'firebase/app' is installed.
// import { FirebaseError } from "firebase/app";

// Define a type for Firebase-like errors for better type safety
interface FirebaseErrorWithCode extends Error {
  code: string;
  message: string;
  // Add other properties if needed, like customData, etc.
}

// Type guard to check if an error is a Firebase-like error
function isFirebaseError(error: unknown): error is FirebaseErrorWithCode {
  return typeof error === 'object' && error !== null && 'code' in error && typeof (error as any).code === 'string';
}


const gradientStyle = {
  background: "linear-gradient(45deg, rgb(238, 119, 82,0.2), rgb(231, 60, 126,0.2), rgb(35, 166, 213,0.2), rgb(35, 213, 171,0.2))",
  backgroundSize: "400% 400%",
  animation: "gradient 15s ease infinite",
  height: "100vh",
  overflow: "hidden",
};

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      await setDoc(doc(db, "users", userCredential.user.uid), {
        name: form.name,
        mobile: form.mobile,
        email: form.email,
      });

      setMessage("✅ Account created! You can now log in.");
    } catch (error: unknown) { // Explicitly type error as unknown
      // Use the type guard to safely access error properties
      if (isFirebaseError(error)) {
        console.error("Registration error:", error.message);
        setMessage("❌ " + getFriendlyFirebaseError(error.code));
      } else {
        // Handle other types of errors (e.g., network issues, non-Firebase errors)
        console.error("An unexpected registration error occurred:", error);
        // Provide a generic message for non-Firebase errors
        setMessage("❌ An unexpected error occurred during registration. Please try again.");
      }
    }
  };

  return (
    <div style={gradientStyle} className="relative overflow-hidden h-screen">
      <div className="flex h-full justify-center items-center px-4">
        <div className="rounded-xl shadow-md bg-white dark:bg-darkgray p-6 w-full md:w-96 border-none">
          <div className="flex flex-col gap-2 p-0 w-full">
            <div className="mx-auto">
              <FullLogo />
            </div>
            <p className="text-sm text-center text-dark dark:text-white my-3">
              Sign Up on Edulx
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Full Name"
                required
                className="border p-2 rounded dark:bg-darkgraylight dark:text-white dark:border-gray-700"
              />
              <input
                name="mobile"
                value={form.mobile}
                onChange={handleChange}
                placeholder="Mobile Number"
                required
                className="border p-2 rounded dark:bg-darkgraylight dark:text-white dark:border-gray-700"
              />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email"
                required
                className="border p-2 rounded dark:bg-darkgraylight dark:text-white dark:border-gray-700"
              />
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Password"
                required
                className="border p-2 rounded dark:bg-darkgraylight dark:text-white dark:border-gray-700"
              />
              <button
                type="submit"
                className="bg-primary text-black py-2 rounded hover:bg-primary-dark transition-colors duration-200"
              >
                Register
              </button>
              {message && (
                <p className="text-center text-sm mt-2 text-dark dark:text-white">{message}</p>
              )}
            </form>
            <div className="flex gap-2 text-sm justify-center mt-4 text-dark dark:text-white">
              <p>Already have an Account?</p>
              <Link to="/auth/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;