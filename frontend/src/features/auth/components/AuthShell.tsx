import type { ReactNode } from "react";

import { Card } from "@/components/ui";

function BrandMark({ label = "CaseMan" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center">
      <span className="text-xl font-semibold tracking-tight text-white">{label}</span>
    </div>
  );
}

export function AuthShell({
  title,
  description,
  children,
  footer,
  brandLabel = "CaseMan",
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  brandLabel?: string;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_right,#224d8e_0,#102a56_42%,#0a1b38_100%)] px-4 py-10">
      <div className="w-full max-w-md">
        <BrandMark label={brandLabel} />
        <Card className="mt-7 p-6 shadow-2xl sm:p-8">
          <h1 className="text-2xl font-semibold text-[#182235]">{title}</h1>
          <p className="mt-1 text-sm text-[#667085]">{description}</p>
          <div className="mt-6">{children}</div>
          {footer && (
            <div className="mt-6 border-t border-[#e4e9f0] pt-5 text-center text-sm text-[#667085]">
              {footer}
            </div>
          )}
        </Card>
        <p className="mt-5 text-center text-xs text-white/55">
          Case management for applications and reviews
        </p>
      </div>
    </main>
  );
}
