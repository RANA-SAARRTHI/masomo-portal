const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type SlotView = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string | null;
  subjectName: string;
  extra?: React.ReactNode;
};

export function TimetableGrid({ slots }: { slots: SlotView[] }) {
  const byDay = new Map<number, SlotView[]>();
  for (const s of slots) {
    const list = byDay.get(s.dayOfWeek) ?? [];
    list.push(s);
    byDay.set(s.dayOfWeek, list);
  }
  for (const list of byDay.values()) list.sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-6 gap-2 min-w-[720px]">
        {DAYS.map((day, i) => (
          <div key={day} className="flex flex-col gap-2">
            <div className="text-xs font-semibold text-slate-500 text-center pb-1 border-b border-slate-100">{day}</div>
            {(byDay.get(i + 1) ?? []).length === 0 ? (
              <div className="text-xs text-slate-300 text-center py-4">—</div>
            ) : (
              (byDay.get(i + 1) ?? []).map((s) => (
                <div key={s.id} className="rounded-lg bg-brand-50 border border-brand-100 px-2 py-1.5 text-xs">
                  <div className="font-medium text-brand-800">{s.subjectName}</div>
                  <div className="text-brand-600">
                    {s.startTime}–{s.endTime}
                    {s.room ? ` · ${s.room}` : ""}
                  </div>
                  {s.extra}
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
