"use client";

import Link from "next/link";
import { Button } from "@/components/ui";

// Catches any error thrown by a server action or server component that
// isn't already caught by a client-side wrapper (useTransition + try/catch).
// Several plain <form action={...}> forms in this app call actions that
// throw on a business-rule failure (e.g. "no copies available") rather than
// failing silently — without this boundary those would hit Next's bare
// default error screen instead of something that fits the rest of the app.
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 text-center">
        <div className="h-10 w-10 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4 font-semibold">
          !
        </div>
        <h1 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Something went wrong</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          {error.message || "That action couldn't be completed. Please try again."}
        </p>
        <div className="flex gap-2 justify-center">
          <Button type="button" onClick={reset}>
            Try again
          </Button>
          <Link href="/redirect">
            <Button type="button" variant="secondary">
              Back to dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
