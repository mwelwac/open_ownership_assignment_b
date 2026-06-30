import { Menu } from "@base-ui-components/react/menu";
import { ChevronDown, ClipboardList, LogOut, Settings, UserRoundCheck } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import type { User } from "@/features/auth/api";
import { cn } from "@/lib/utils";

function roleLabel(user: User) {
  if (user.is_staff) return "Staff administrator";
  return user.role === "REVIEWER" ? "Reviewer" : "Applicant";
}

function initials(user: User) {
  const first = user.first_name?.[0] ?? "";
  const last = user.last_name?.[0] ?? "";
  return (first + last).toUpperCase() || user.email[0]?.toUpperCase() || "U";
}

export function UserMenu({
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
  const [open, setOpen] = useState(false);

  return (
    <Menu.Root open={open} onOpenChange={setOpen}>
      <Menu.Trigger
        type="button"
        aria-label={`Open user menu for ${user.full_name || user.email}`}
        className="group inline-flex h-10 items-center gap-2 rounded-full border border-[#d8e0eb] bg-white py-1 pr-2 pl-1 text-left shadow-sm transition-colors hover:border-[#b9c6d8] hover:bg-[#f8fafc] focus-visible:ring-2 focus-visible:ring-[#224d8e] focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#102a56] text-xs font-bold text-white">
          {initials(user)}
        </span>
        <span className="hidden max-w-40 min-w-0 lg:block">
          <span className="block truncate text-sm leading-4 font-semibold text-[#182235]">
            {user.full_name || user.email}
          </span>
          <span className="block truncate text-xs leading-4 text-[#667085]">{roleLabel(user)}</span>
        </span>
        <ChevronDown
          className={cn(
            "hidden h-4 w-4 text-[#667085] transition-transform sm:block",
            open && "rotate-180",
          )}
        />
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner align="end" sideOffset={8}>
          <Menu.Popup className="z-50 w-72 overflow-hidden rounded-xl border border-[#dde3ec] bg-white text-left shadow-2xl focus:outline-none">
            <div className="border-b border-[#edf0f4] px-4 py-3">
              <p className="truncate text-sm font-semibold text-[#182235]">
                {user.full_name || user.email}
              </p>
              <p className="mt-0.5 truncate text-xs text-[#667085]">{user.email}</p>
              <p className="mt-2 inline-flex rounded-full bg-[#eef3fa] px-2 py-0.5 text-[11px] font-semibold text-[#102a56]">
                {roleLabel(user)}
              </p>
            </div>
            <div className="p-1.5">
              <Menu.Item
                render={<Link to="/applications" />}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#344054] transition-colors hover:bg-[#f4f6f9] hover:text-[#102a56] focus:bg-[#f4f6f9] focus:text-[#102a56] focus:outline-none"
              >
                <ClipboardList className="h-4 w-4 text-[#667085]" />
                {workbenchLabel}
              </Menu.Item>
              {user.is_staff && (
                <Menu.Item
                  render={<Link to="/reviewers" />}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#344054] transition-colors hover:bg-[#f4f6f9] hover:text-[#102a56] focus:bg-[#f4f6f9] focus:text-[#102a56] focus:outline-none"
                >
                  <UserRoundCheck className="h-4 w-4 text-[#667085]" />
                  Reviewer management
                </Menu.Item>
              )}
              <Menu.Item
                render={<Link to="/account" />}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#344054] transition-colors hover:bg-[#f4f6f9] hover:text-[#102a56] focus:bg-[#f4f6f9] focus:text-[#102a56] focus:outline-none"
              >
                <Settings className="h-4 w-4 text-[#667085]" />
                Account settings
              </Menu.Item>
            </div>
            <Menu.Separator className="h-px bg-[#edf0f4]" />
            <div className="p-1.5">
              <Menu.Item
                nativeButton
                render={<button type="button" />}
                onClick={() => void onSignOut()}
                disabled={isSigningOut}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#b42318] transition-colors hover:bg-[#fef3f2] focus:bg-[#fef3f2] focus:outline-none disabled:pointer-events-none disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" />
                {isSigningOut ? "Signing out…" : "Sign out"}
              </Menu.Item>
            </div>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
