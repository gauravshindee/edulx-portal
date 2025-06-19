// src/views/auth/authforms/AuthLogin.tsx
import { Button, Checkbox, Label, TextInput } from "flowbite-react";
import { Link, useNavigate } from "react-router-dom"; // Using react-router-dom for Link and useNavigate

// Import Firebase auth and db instances
import { auth, db } from "src/firebase"; // Make sure this path to your firebase.ts is correct!
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";


const AuthLogin = () => {
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent default form submission behavior

    // Use FormData to easily get input values by their 'name' attribute
    const formData = new FormData(event.currentTarget);
    const email = formData.get("Username") as string; // Assuming 'Username' input is for email
    const password = formData.get("userpwd") as string;

    // Basic client-side validation
    if (!email || !password) {
      alert("Please enter both username (email) and password.");
      return; // Stop execution if inputs are empty
    }

    // Console log to trace the start of the login attempt
    console.log("AuthLogin: Attempting login for email:", email);

    try {
      // Step 1: Attempt to sign in the user with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user; // Get the authenticated user object

      // Console logs to confirm successful Firebase Auth login
      console.log("AuthLogin: Firebase signInWithEmailAndPassword successful.");
      console.log("AuthLogin: Authenticated user UID:", user?.uid);

      if (user) {
        // Step 2: Record login activity in Firestore upon successful authentication
        try {
          // Construct the path to the user's specific loginHistory subcollection
          const userActivityRef = collection(db, `users/${user.uid}/loginHistory`);
          
          // Add a new document to the loginHistory collection
          await addDoc(userActivityRef, {
            timestamp: serverTimestamp(), // Use Firestore's server timestamp for accuracy
            activityType: "login",       // A descriptor for the type of activity
          });
          
          // Console log to confirm successful Firestore write
          console.log("AuthLogin: Login activity recorded successfully in Firestore for user:", user.uid);
        } catch (firestoreError: any) {
          // Catch and log any errors specifically from the Firestore write operation
          console.error("AuthLogin: Error recording login activity to Firestore:", firestoreError);
          // Alert user/developer about the Firestore write failure
          alert("Login successful, but failed to record activity: " + firestoreError.message); 
        }
        
        // Step 3: Navigate to the dashboard upon overall success
        navigate("/"); 
      } else {
        // Fallback if signInWithEmailAndPassword doesn't return a user but also doesn't throw an error
        console.warn("AuthLogin: signInWithEmailAndPassword returned no user, but no error was thrown.");
        alert("Login failed: User object not returned.");
      }
    } catch (firebaseAuthError: any) {
      // Catch and handle errors from the Firebase Authentication process (e.g., wrong password, user not found)
      console.error("AuthLogin: Firebase Authentication failed:", firebaseAuthError);
      
      // Provide user-friendly error messages based on Firebase error codes
      let errorMessage = "Login failed. Please check your email and password.";
      if (firebaseAuthError.code === 'auth/user-not-found') {
        errorMessage = "No user found with this email. Please sign up or check the email.";
      } else if (firebaseAuthError.code === 'auth/wrong-password') {
        errorMessage = "Incorrect password. Please try again.";
      } else if (firebaseAuthError.code === 'auth/invalid-email') {
        errorMessage = "Invalid email format. Please enter a valid email address.";
      } else if (firebaseAuthError.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your internet connection.";
      }
      alert(errorMessage); // Display the error message to the user
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <div className="mb-2 block">
            <Label htmlFor="Username" value="Username" />
          </div>
          <TextInput
            id="Username"
            name="Username" // Crucial for formData.get("Username")
            type="email" // Recommended for email inputs
            sizing="md"
            required
            className="form-control form-rounded-xl"
          />
        </div>
        <div className="mb-4">
          <div className="mb-2 block">
            <Label htmlFor="userpwd" value="Password" />
          </div>
          <TextInput
            id="userpwd"
            name="userpwd" // Crucial for formData.get("userpwd")
            type="password"
            sizing="md"
            required
            className="form-control form-rounded-xl"
          />
        </div>
        <div className="flex justify-between my-5">
          <div className="flex items-center gap-2">
            <Checkbox id="accept" className="checkbox" />
            <Label
              htmlFor="accept"
              className="opacity-90 font-normal cursor-pointer"
            >
              Remember this Device
            </Label>
          </div>
          {/* Link to forgot password page, updated to a common auth path */}
          <Link to={"/auth/forgot-password"} className="text-primary text-sm font-medium">
            Forgot Password ?
          </Link>
        </div>
        <Button type="submit" color={"primary"} className="w-full bg-primary text-white rounded-xl">
          Sign in
        </Button>
      </form>
    </>
  );
};

export default AuthLogin;