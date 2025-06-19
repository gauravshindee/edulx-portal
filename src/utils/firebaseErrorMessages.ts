export const getFriendlyFirebaseError = (code: string) => {
    const map: Record<string, string> = {
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/user-not-found": "No account found with this email.",
      "auth/wrong-password": "Incorrect password. Please try again.",
      "auth/too-many-requests": "Too many login attempts. Please wait and try again.",
      "auth/email-already-in-use": "An account with this email already exists.",
      "auth/weak-password": "Password should be at least 6 characters.",
      "auth/network-request-failed": "Network error. Please check your internet connection.",
      "auth/internal-error": "Something went wrong. Please try again later.",
      "auth/invalid-credential": "Login failed. Please check your credentials.",
    };
  
    return map[code] || "An unexpected error occurred. Please try again.";
  };
  