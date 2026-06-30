import { Link } from "react-router-dom";

import { Button } from "@/components/ui";

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7fa] p-6 text-center">
      <div>
        <div className="text-sm font-bold tracking-[0.25em] text-[#e6a21a] uppercase">404</div>
        <h1 className="mt-3 text-3xl font-semibold text-[#182235]">Page not found</h1>
        <p className="mt-2 text-sm text-[#667085]">The page you requested does not exist.</p>
        <Link className="mt-6 inline-block" to="/applications">
          <Button>Return to applications</Button>
        </Link>
      </div>
    </main>
  );
}
