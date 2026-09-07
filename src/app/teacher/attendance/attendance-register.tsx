"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Button, Input, Badge } from "@/components/ui";
import { submitAttendance } from "@/lib/actions/teacher";

const STATUSES = ["PRESENT", "ABSENT", "LATE", "EXCUSED"];

type StudentRow = { id: string; name: string; status: string; reason: string };

function draftKey(classGroupId: string, date: string) {
  return `masomo:attendance-draft:${classGroupId}:${date}`;
}

export function AttendanceRegister({
  classGroupId,
  date,
  students,
}: {
  classGroupId: string;
  date: string;
  students: { id: string; name: string; status: string; reason: string }[];
}) {
  const [rows, setRows] = useState<StudentRow[]>(students);
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<"idle" | "saved-offline" | "synced" | "syncing" | "error">("idle");
  const [isPending, startTransition] = useTransition();
  const key = draftKey(classGroupId, date);
  const loadedDraft = useRef(false);

  // Restore any draft saved while offline (or if the tab closed before syncing).
  useEffect(() => {
    setIsOnline(navigator.onLine);
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const draft: StudentRow[] = JSON.parse(raw);
        setRows((current) => current.map((r) => draft.find((d) => d.id === r.id) ?? r));
        setSyncStatus("saved-offline");
        loadedDraft.current = true;
      }
    } catch {
      // localStorage can throw in private browsing; treat as no draft.
    }
  }, [key]);

  useEffect(() => {
    function goOnline() {
      setIsOnline(true);
      if (loadedDraft.current) trySync(rows);
    }
    function goOffline() {
      setIsOnline(false);
    }
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateRow(id: string, patch: Partial<StudentRow>) {
    setRows((current) => {
      const next = current.map((r) => (r.id === id ? { ...r, ...patch } : r));
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // ignore quota/private-mode errors — sync will just carry current state
      }
      return next;
    });
  }

  function trySync(currentRows: StudentRow[]) {
    setSyncStatus("syncing");
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("classGroupId", classGroupId);
        formData.set("date", date);
        for (const r of currentRows) {
          formData.append("studentId", r.id);
          formData.set(`status-${r.id}`, r.status);
          formData.set(`reason-${r.id}`, r.reason);
        }
        await submitAttendance(formData);
        try {
          localStorage.removeItem(key);
        } catch {}
        loadedDraft.current = false;
        setSyncStatus("synced");
      } catch {
        setSyncStatus("saved-offline");
      }
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!navigator.onLine) {
      try {
        localStorage.setItem(key, JSON.stringify(rows));
      } catch {}
      loadedDraft.current = true;
      setSyncStatus("saved-offline");
      return;
    }
    trySync(rows);
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3">
      <div className="flex items-center gap-2 text-sm">
        {!isOnline && <Badge tone="amber">Offline — register will save on this device</Badge>}
        {syncStatus === "saved-offline" && <Badge tone="amber">Draft saved on this device, not yet submitted</Badge>}
        {syncStatus === "syncing" && <Badge tone="brand">Syncing...</Badge>}
        {syncStatus === "synced" && <Badge tone="emerald">Submitted</Badge>}
      </div>

      {rows.map((r) => (
        <div key={r.id} className="flex flex-col sm:flex-row sm:items-center gap-2 border-b border-slate-50 pb-3 last:border-0 dark:border-slate-800">
          <span className="font-medium text-slate-800 flex-1 min-w-[10rem] dark:text-slate-200">{r.name}</span>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((st) => (
              <label
                key={st}
                className="text-xs px-2 py-1 rounded-full border border-slate-200 has-[:checked]:bg-brand-600 has-[:checked]:text-white has-[:checked]:border-brand-600 cursor-pointer dark:border-slate-700"
              >
                <input
                  type="radio"
                  name={`status-${r.id}`}
                  value={st}
                  checked={r.status === st}
                  onChange={() => updateRow(r.id, { status: st })}
                  className="sr-only"
                />
                {st}
              </label>
            ))}
          </div>
          <Input
            placeholder="Reason (optional)"
            value={r.reason}
            onChange={(e) => updateRow(r.id, { reason: e.target.value })}
            className="sm:w-48"
          />
        </div>
      ))}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Submitting..." : isOnline ? "Submit register" : "Save register (offline)"}
        </Button>
        {!isOnline && <span className="text-xs text-slate-400 dark:text-slate-500">Will submit automatically once you're back online.</span>}
      </div>
    </form>
  );
}
