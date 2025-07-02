import { Navigate } from "react-router-dom";
import { useAuth } from "src/context/AuthContext";
import Spinner from "src/views/spinner/Spinner";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();

  if (loading) return <Spinner />;

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
