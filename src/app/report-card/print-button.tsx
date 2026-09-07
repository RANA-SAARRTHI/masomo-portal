"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="fixed top-4 right-4 print:hidden bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 shadow-lg"
    >
      Print / Save as PDF
    </button>
  );
}
