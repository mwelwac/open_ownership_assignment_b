import { Settings } from "lucide-react";
import { Link } from "react-router-dom";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PortalBrand } from "@/components/layout/PortalBrand";
import { UserMenu } from "@/components/layout/UserMenu";
import type { User } from "@/features/auth/api";
import { NotificationBell } from "@/features/notifications/NotificationBell";

export function SiteHeader({
  user,
  workbenchLabel,
  onSignOut,
  isSigningOut,
}: {
  user: User;
  workbenchLabel: string;
  onSignOut: () => Promise<void>;
  isSigningOut: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#dde3ec] bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <PortalBrand />
        <div className="hidden h-6 w-px shrink-0 bg-[#d8e0eb] md:block" />
        <div className="min-w-0 flex-1 overflow-x-auto py-2">
          <Breadcrumbs user={user} />
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            to="/account"
            aria-label="Account settings"
            title="Account settings"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#667085] transition-colors hover:bg-[#f4f6f9] hover:text-[#102a56] focus-visible:ring-2 focus-visible:ring-[#224d8e] focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <Settings className="h-4 w-4" />
          </Link>
          <NotificationBell />
          <UserMenu
            user={user}
            workbenchLabel={workbenchLabel}
            onSignOut={onSignOut}
            isSigningOut={isSigningOut}
          />
        </div>
      </div>
    </header>
  );
}
