"use client";

import { useEffect, useState, useTransition } from "react";
import { Select, Input, Button, Label } from "@/components/ui";
import { getEligibleSubstitutes, assignSubstitute } from "@/lib/actions/substitution";

type SlotOption = { id: string; label: string; teacherName: string };

export function SubstitutionForm({
  slots,
  initialSlotId,
  initialDate,
}: {
  slots: SlotOption[];
  initialSlotId?: string;
  initialDate?: string;
}) {
  const [slotId, setSlotId] = useState(initialSlotId && slots.some((s) => s.id === initialSlotId) ? initialSlotId : slots[0]?.id ?? "");
  const [date, setDate] = useState(initialDate ?? new Date().toISOString().slice(0, 10));
  const [eligible, setEligible] = useState<{ id: string; name: string }[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Arriving here from an approved-leave coverage link: look up substitutes
  // for the pre-filled period automatically instead of making the admin
  // click "Find free teachers" for a period we already know they want.
  useEffect(() => {
    if (initialSlotId && initialDate) {
      findSubstitutes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function findSubstitutes() {
    setError(null);
    setSuccess(null);
    setEligible(null);
    startTransition(async () => {
      try {
        const result = await getEligibleSubstitutes(slotId);
        setEligible(result);
        if (result.length === 0) setError("No teacher at this school is free at that time.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not look up substitutes.");
      }
    });
  }

  function handleAssign(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await assignSubstitute(formData);
        setSuccess("Substitute assigned. They'll see it on their dashboard.");
        setEligible(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not assign substitute.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-3 items-end">
        <div>
          <Label htmlFor="substitution-period">Period</Label>
          <Select id="substitution-period" value={slotId} onChange={(e) => { setSlotId(e.target.value); setEligible(null); }}>
            {slots.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label} ({s.teacherName})
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="substitution-date">Date</Label>
          <Input id="substitution-date" type="date" value={date} onChange={(e) => { setDate(e.target.value); setEligible(null); }} />
        </div>
        <Button type="button" variant="secondary" onClick={findSubstitutes} disabled={isPending || !slotId}>
          {isPending ? "Checking..." : "Find free teachers"}
        </Button>
      </div>

      {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}
      {success && <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">{success}</p>}

      {eligible && eligible.length > 0 && (
        <form action={handleAssign} className="grid sm:grid-cols-3 gap-3 items-end border-t border-slate-100 pt-4 dark:border-slate-800">
          <input type="hidden" name="timetableSlotId" value={slotId} />
          <input type="hidden" name="date" value={date} />
          <div>
            <Label htmlFor="field-substituteteacherid">Substitute teacher</Label>
            <Select id="field-substituteteacherid" name="substituteTeacherId" required>
              {eligible.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="field-reason">Reason (optional)</Label>
            <Input id="field-reason" name="reason" placeholder="e.g. Sick leave" />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Assigning..." : "Assign substitute"}
          </Button>
        </form>
      )}
    </div>
  );
}
