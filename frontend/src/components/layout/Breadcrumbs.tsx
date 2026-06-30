import { ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import type { User } from "@/features/auth/api";
import { cn } from "@/lib/utils";

function portalCrumb(user: User) {
  return user.role === "REVIEWER" ? "Reviewer Portal" : "Applicant Portal";
}

function workbenchCrumb(user: User) {
  return user.role === "REVIEWER" ? "Review queue" : "My applications";
}

function breadcrumbsFor(pathname: string, user: User) {
  const crumbs: Array<{ label: string; to?: string }> = [
    { label: portalCrumb(user), to: "/applications" },
  ];
  if (pathname === "/account") return [...crumbs, { label: "Account" }];
  if (pathname === "/reviewers")
    return [...crumbs, { label: "Administration" }, { label: "Reviewers" }];
  if (pathname === "/applications/new") {
    return [
      ...crumbs,
      { label: workbenchCrumb(user), to: "/applications" },
      { label: "New application" },
    ];
  }
  const editMatch = pathname.match(/^\/applications\/(\d+)\/edit$/);
  if (editMatch) {
    return [
      ...crumbs,
      { label: workbenchCrumb(user), to: "/applications" },
      { label: `Application #${editMatch[1]}`, to: `/applications/${editMatch[1]}` },
      { label: "Edit" },
    ];
  }
  const detailMatch = pathname.match(/^\/applications\/(\d+)$/);
  if (detailMatch) {
    return [
      ...crumbs,
      { label: workbenchCrumb(user), to: "/applications" },
      { label: `Application #${detailMatch[1]}` },
    ];
  }
  return [...crumbs, { label: workbenchCrumb(user) }];
}

export function Breadcrumbs({ user }: { user: User }) {
  const { pathname } = useLocation();
  const crumbs = breadcrumbsFor(pathname, user);

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-max items-center gap-1.5 text-sm text-[#667085]">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li
              key={`${crumb.label}-${index}`}
              className="inline-flex min-w-0 items-center gap-1.5"
            >
              {index > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#98a2b3]" />}
              {crumb.to && !isLast ? (
                <Link
                  to={crumb.to}
                  className="font-medium whitespace-nowrap text-[#526078] transition-colors hover:text-[#102a56]"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={cn(
                    "whitespace-nowrap",
                    isLast && "font-semibold tracking-[-0.01em] text-[#182235]",
                  )}
                >
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
