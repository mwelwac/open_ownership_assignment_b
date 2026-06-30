import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PageContainer({
  children,
  narrow = false,
}: {
  children: ReactNode;
  narrow?: boolean;
}) {
  return (
    <div
      className={cn("mx-auto w-full px-4 py-7 sm:px-6 lg:px-8", narrow ? "max-w-3xl" : "max-w-7xl")}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  backTo,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  backTo?: { to: string; label: string };
}) {
  return (
    <header className="mb-6">
      {backTo && (
        <Link
          className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-[#526078] hover:text-[#102a56]"
          to={backTo.to}
        >
          <ChevronLeft className="h-4 w-4" />
          {backTo.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#182235] sm:text-3xl">
            {title}
          </h1>
          {description && <p className="mt-1 text-sm text-[#667085]">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export function DetailItem({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs font-semibold tracking-wide text-[#7b879a] uppercase">{label}</dt>
      <dd className="mt-1 text-sm text-[#27364d]">{children}</dd>
    </div>
  );
}
