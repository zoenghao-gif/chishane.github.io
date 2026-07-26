import { Navigate, Outlet } from "react-router-dom";
import { LoadingState } from "../components/LoadingState";
import { useAuth } from "../features/auth/AuthProvider";

export function ProtectedRoute() {
  const { session, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="mx-auto min-h-dvh max-w-[520px] bg-canvas px-5 pt-20">
        <LoadingState label="正在读取设备身份" />
      </div>
    );
  }
  return session ? <Outlet /> : <Navigate to="/" replace />;
}
