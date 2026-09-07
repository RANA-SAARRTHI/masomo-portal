"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "masomo-theme";

// Runs before paint via a blocking inline script in layout.tsx — this
// function's source is inlined there too, kept in one place for reference.
export const themeInitScript = `
try {
  var t = localStorage.getItem('${STORAGE_KEY}');
  if (t === 'dark') document.documentElement.classList.add('dark');
} catch (e) {}
`;

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // localStorage can throw in private browsing — the toggle still works for this page view
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
    >
      {isDark ? "☀ Light" : "🌙 Dark"}
    </button>
  );
}
