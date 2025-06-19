import { useState } from "react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "src/firebase";
import FullLogo from "src/layouts/full/shared/logo/FullLogo";
import { Link } from "react-router-dom";
import { getFriendlyFirebaseError } from "src/utils/firebaseErrorMessages";

const gradientStyle = {
  background:
    "linear-gradient(45deg, rgb(238, 119, 82,0.2), rgb(231, 60, 126,0.2), rgb(35, 166, 213,0.2), rgb(35, 213, 171,0.2))",
  backgroundSize: "400% 400%",
  animation: "gradient 15s ease infinite",
  height: "100vh",
  overflow: "hidden",
};

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [showReset, setShowReset] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      setMessage("✅ Login successful. Redirecting...");
      setTimeout(() => {
        window.location.href = "/portal";
      }, 1000);
    } catch (error: any) {
      setMessage("❌ " + getFriendlyFirebaseError(error.code));
    }
  };

  const handleReset = async () => {
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setMessage("✅ Password reset link sent to your email.");
      setShowReset(false);
    } catch (error: any) {
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
              Sign In to Edulx
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                Login
              </button>
              <div className="w-full text-center">
  <button
    type="button"
    onClick={() => setShowReset(true)}
    className="text-sm text-primary underline"
  >
<h3 className="text-lg font-medium mb-1 text-center">Forgot Password?</h3>
<p className="text-sm text-center text-gray-600 mb-4">
  No worries — just enter your email and we’ll send you a reset link.
</p>

  </button>
</div>

              {message && (
                <p className="text-center text-sm mt-2">{message}</p>
              )}
            </form>

            {showReset && (
              <div className="bg-lightprimary p-4 rounded mt-4">
                <p className="text-sm mb-2">
                  Enter your email to reset password:
                </p>
                <input
                  type="email"
                  placeholder="Your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="border p-2 w-full rounded mb-2"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setShowReset(false)}
                    className="text-xs text-gray-500 hover:underline"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReset}
                    className="text-xs text-primary font-medium hover:underline"
                  >
                    Send Reset Link
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-2 text-sm justify-center mt-4">
              <p>New to Edulx?</p>
              <Link to="/auth/register" className="text-primary font-medium">
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
