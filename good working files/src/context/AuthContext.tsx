import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
  } from "react";
  import { onAuthStateChanged, User } from "firebase/auth";
  import { auth } from "src/firebase";
  import { doc, getDoc } from "firebase/firestore";
  import { db } from "src/firebase";
  
  type UserProfile = {
    name: string;
    mobile: string;
    email: string;
  };
  
  type AuthContextType = {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
  };
  
  const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
  });
  
  export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        setUser(currentUser);
  
        if (currentUser) {
          try {
            const profileRef = doc(db, "users", currentUser.uid);
            const profileSnap = await getDoc(profileRef);
  
            if (profileSnap.exists()) {
              setProfile(profileSnap.data() as UserProfile);
            } else {
              setProfile(null);
              console.warn("No profile found in Firestore for user.");
            }
          } catch (error) {
            console.error("Error fetching user profile:", error);
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
  
        setLoading(false);
      });
  
      return () => unsubscribe();
    }, []);
  
    return (
      <AuthContext.Provider value={{ user, profile, loading }}>
        {children}
      </AuthContext.Provider>
    );
  };
  
  export const useAuth = () => useContext(AuthContext);
  