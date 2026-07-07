import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../stores/auth.store";

export function ProtectedRoute() {
  const { currentUser } = useAuthStore();

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
