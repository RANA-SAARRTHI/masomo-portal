"use client";

import { useState, useTransition } from "react";
import { Select, Input, Button, Label } from "@/components/ui";
import { getEligibleSubstitutes, assignSubstitute } from "@/lib/actions/substitution";

type SlotOption = { id: string; label: string; teacherName: string };

export function SubstitutionForm({ slots }: { slots: SlotOption[] }) {
  const [slotId, setSlotId] = useState(slots[0]?.id ?? "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [eligible, setEligible] = useState<{ id: string; name: string }[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
          <Label>Period</Label>
          <Select value={slotId} onChange={(e) => { setSlotId(e.target.value); setEligible(null); }}>
            {slots.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label} ({s.teacherName})
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => { setDate(e.target.value); setEligible(null); }} />
        </div>
        <Button type="button" variant="secondary" onClick={findSubstitutes} disabled={isPending || !slotId}>
          {isPending ? "Checking..." : "Find free teachers"}
        </Button>
      </div>

      {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}
      {success && <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">{success}</p>}

      {eligible && eligible.length > 0 && (
        <form action={handleAssign} className="grid sm:grid-cols-3 gap-3 items-end border-t border-slate-100 pt-4">
          <input type="hidden" name="timetableSlotId" value={slotId} />
          <input type="hidden" name="date" value={date} />
          <div>
            <Label>Substitute teacher</Label>
            <Select name="substituteTeacherId" required>
              {eligible.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Reason (optional)</Label>
            <Input name="reason" placeholder="e.g. Sick leave" />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Assigning..." : "Assign substitute"}
          </Button>
        </form>
      )}
    </div>
  );
}
