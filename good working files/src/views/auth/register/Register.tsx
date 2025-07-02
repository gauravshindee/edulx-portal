import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "src/firebase";
import { doc, setDoc } from "firebase/firestore";
import { db } from "src/firebase";
import FullLogo from "src/layouts/full/shared/logo/FullLogo";
import { Link } from "react-router-dom";
import { getFriendlyFirebaseError } from "src/utils/firebaseErrorMessages";

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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
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
    } catch (error) {
      console.error("Registration error:", error.message);
      setMessage("❌ " + getFriendlyFirebaseError(error.code));
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
            <p className="text-sm text-center text-dark my-3">
              Sign Up on Edulx
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Full Name"
                required
                className="border p-2 rounded"
              />
              <input
                name="mobile"
                value={form.mobile}
                onChange={handleChange}
                placeholder="Mobile Number"
                required
                className="border p-2 rounded"
              />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email"
                required
                className="border p-2 rounded"
              />
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Password"
                required
                className="border p-2 rounded"
              />
              <button
                type="submit"
                className="bg-primary text-black py-2 rounded"
              >
                Register
              </button>
              {message && (
                <p className="text-center text-sm mt-2">{message}</p>
              )}
            </form>
            <div className="flex gap-2 text-sm justify-center mt-4">
              <p>Already have an Account?</p>
              <Link to="/auth/login" className="text-primary font-medium">
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
