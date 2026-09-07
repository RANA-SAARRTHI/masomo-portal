"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { runAllDueReports } from "@/lib/actions/scheduled-reports";

export function RunAllDueButton() {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setMessage(null);
    startTransition(async () => {
      const result = await runAllDueReports();
      setMessage(result.ran === 0 ? "Nothing due right now." : `Ran ${result.ran} due report${result.ran === 1 ? "" : "s"}.`);
    });
  }

  return (
    <div className="flex items-center gap-3">
      <Button type="button" variant="secondary" onClick={handleClick} disabled={isPending}>
        {isPending ? "Checking..." : "Run due reports now"}
      </Button>
      {message && <span className="text-sm text-slate-500 dark:text-slate-400">{message}</span>}
    </div>
  );
}
