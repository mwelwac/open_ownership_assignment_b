import { Outlet, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { useLogout, useMe } from "@/features/auth/hooks";

export function AppLayout() {
  const { data: user } = useMe();
  const logout = useLogout();
  const navigate = useNavigate();
  if (!user) return null;
  const workbenchLabel = user.role === "REVIEWER" ? "Review queue" : "My applications";
  const signOut = async () => {
    try {
      await logout.mutateAsync();
      navigate("/login", { replace: true });
    } catch {
      toast.error("Sign out failed. Please try again.");
    }
  };
  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <SiteHeader
        user={user}
        workbenchLabel={workbenchLabel}
        onSignOut={signOut}
        isSigningOut={logout.isPending}
      />
      <main className="mx-auto max-w-7xl min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
