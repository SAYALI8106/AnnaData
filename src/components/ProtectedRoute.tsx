import { Navigate } from "react-router-dom";
import { auth } from "@/lib/firebase";

type Props = {
  children: JSX.Element;
};

const ProtectedRoute = ({ children }: Props) => {
  if (!auth.currentUser) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

export default ProtectedRoute;
