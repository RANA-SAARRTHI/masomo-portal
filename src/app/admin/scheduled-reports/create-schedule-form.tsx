"use client";

import { useState, useTransition } from "react";
import { Button, Select, Label } from "@/components/ui";
import { createScheduledReport } from "@/lib/actions/scheduled-reports";
import { REPORT_LABEL } from "@/lib/report-data";

export function CreateScheduleForm({ eligibleUsers }: { eligibleUsers: { id: string; name: string; role: string }[] }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await createScheduledReport(formData);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not create this schedule.");
      }
    });
  }

  return (
    <div className="p-4 sm:p-5 border-t border-slate-100">
      {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2 mb-3">{error}</p>}
      <form action={handleSubmit} className="grid sm:grid-cols-4 gap-3 items-end">
        <div>
          <Label>Report</Label>
          <Select name="type" required>
            {Object.entries(REPORT_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Cadence</Label>
          <Select name="cadence" defaultValue="WEEKLY">
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
          </Select>
        </div>
        <div>
          <Label>Recipient</Label>
          <Select name="recipientId" required>
            {eligibleUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Adding..." : "Add schedule"}
        </Button>
      </form>
    </div>
  );
}
