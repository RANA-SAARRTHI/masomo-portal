"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SearchResult } from "@/app/api/search/route";

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results ?? []);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.group] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      <input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search students, classes, staff..."
        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
      />
      {open && query.trim().length >= 2 && (
        <div className="absolute z-20 mt-1 w-full bg-white rounded-lg border border-slate-200 shadow-lg max-h-80 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-slate-400 px-3 py-2">Searching...</p>
          ) : results.length === 0 ? (
            <p className="text-sm text-slate-400 px-3 py-2">No matches</p>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <p className="text-xs font-medium text-slate-400 px-3 pt-2 pb-1">{group}</p>
                {items.map((r) => (
                  <button
                    key={group + r.id}
                    onClick={() => {
                      setOpen(false);
                      setQuery("");
                      router.push(r.href);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span className="text-slate-800">{r.label}</span>
                    {r.sublabel ? <span className="text-xs text-slate-400">{r.sublabel}</span> : null}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
