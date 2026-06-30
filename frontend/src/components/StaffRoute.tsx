import { Navigate, Outlet } from "react-router-dom";

import { useMe } from "@/features/auth/hooks";

export function StaffRoute() {
  const { data: user } = useMe();
  if (!user?.is_staff) return <Navigate to="/applications" replace />;
  return <Outlet />;
}
