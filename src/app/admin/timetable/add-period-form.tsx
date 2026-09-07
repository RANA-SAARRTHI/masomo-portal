"use client";

import { useState, useTransition } from "react";
import { Select, Input, Button, Label } from "@/components/ui";
import { createTimetableSlot } from "@/lib/actions/admin";

export function AddPeriodForm({
  classGroupId,
  subjects,
}: {
  classGroupId: string;
  subjects: { id: string; name: string }[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await createTimetableSlot(formData);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not add this period.");
      }
    });
  }

  return (
    <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800">
      {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2 mb-3">{error}</p>}
      <form action={handleSubmit} className="grid sm:grid-cols-6 gap-3 items-end">
        <input type="hidden" name="classGroupId" value={classGroupId} />
        <div className="sm:col-span-2">
          <Label>Subject</Label>
          <Select name="subjectId" required>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Day</Label>
          <Select name="dayOfWeek" defaultValue="1">
            <option value="1">Monday</option>
            <option value="2">Tuesday</option>
            <option value="3">Wednesday</option>
            <option value="4">Thursday</option>
            <option value="5">Friday</option>
            <option value="6">Saturday</option>
          </Select>
        </div>
        <div>
          <Label>Start</Label>
          <Input type="time" name="startTime" required defaultValue="08:00" />
        </div>
        <div>
          <Label>End</Label>
          <Input type="time" name="endTime" required defaultValue="08:40" />
        </div>
        <div>
          <Label>Room</Label>
          <Input name="room" placeholder="e.g. Lab 2" />
        </div>
        <div className="sm:col-span-6">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Checking..." : "Add period"}
          </Button>
        </div>
      </form>
    </div>
  );
}
