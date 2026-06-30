import { Navigate, Outlet, useLocation } from "react-router-dom";

import { Spinner } from "@/components/ui";
import { useMe } from "@/features/auth/hooks";

export function ProtectedRoute() {
  const { data: user, isPending, isError } = useMe();
  const location = useLocation();
  if (isPending)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Loading your account…" />
      </div>
    );
  if (isError)
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center text-sm text-[#667085]">
        We could not reach the server. Refresh the page to try again.
      </div>
    );
  if (!user)
    return (
      <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
    );
  return <Outlet />;
}
