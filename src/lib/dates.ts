// Local-calendar-date formatting, deliberately not toISOString().slice(0,10).
// toISOString() reads the UTC date, which is a day behind the local one for
// any positive UTC offset (e.g. Africa/Kampala, UTC+3) between local
// midnight and UTC midnight — verified this actually shifts the reported
// date by one day at that offset. Every date in this app is built and
// compared in local-server-time terms (new Date(dateStr + "T00:00:00"),
// .toDateString()), so formatting has to match that, not UTC, or "today"
// and stored calendar dates silently disagree for part of every day.
export function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
