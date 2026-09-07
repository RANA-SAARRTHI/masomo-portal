"use client";

import { useState, useTransition } from "react";
import { Card, CardHeader, Button, Badge, EmptyState } from "@/components/ui";
import { previewStudentImport, commitStudentImport, type ImportPreview } from "@/lib/actions/import";

const SAMPLE = `name,email,admissionNo,className
Kato Ivan,kato.ivan@email.com,MS-2026-020,S4 East
Nansubuga Ruth,nansubuga.ruth@email.com,MS-2026-021,S3 West`;

export function ImportClient() {
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCsvText(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  function runPreview() {
    setResult(null);
    startTransition(async () => {
      const res = await previewStudentImport(csvText);
      setPreview(res);
    });
  }

  function confirmImport() {
    startTransition(async () => {
      const res = await commitStudentImport(csvText);
      setResult(res);
      setPreview(null);
      setCsvText("");
    });
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader title="1. Upload a CSV file" subtitle="Columns: name, email, admissionNo, className (className is optional)" />
          <div className="p-4 sm:p-5 space-y-3">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFile}
              className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-50 file:text-brand-700 file:text-sm hover:file:bg-brand-100 dark:text-slate-400"
            />
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              rows={8}
              placeholder={SAMPLE}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700"
            />
            <div className="flex gap-2">
              <Button type="button" onClick={runPreview} disabled={!csvText.trim() || isPending}>
                {isPending ? "Checking..." : "Validate"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setCsvText(SAMPLE)}>
                Load sample
              </Button>
            </div>
          </div>
        </Card>

        {preview && (
          <Card>
            <CardHeader
              title="2. Review before importing"
              subtitle={`${preview.valid.length} ready to import, ${preview.invalid.length} need fixing, out of ${preview.totalRows} rows`}
            />
            <div className="p-4 sm:p-5 space-y-4">
              {preview.invalid.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-rose-700 mb-2">Rows that will be skipped</p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {preview.invalid.map((r) => (
                      <div key={r.line} className="text-xs bg-rose-50 rounded-lg px-3 py-2">
                        <span className="font-medium">Line {r.line}:</span> {r.name || "(no name)"} — {r.errors.join("; ")}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {preview.valid.length > 0 ? (
                <div>
                  <p className="text-sm font-medium text-emerald-700 mb-2">Ready to import</p>
                  <div className="space-y-1 max-h-56 overflow-y-auto">
                    {preview.valid.map((r) => (
                      <div key={r.line} className="text-xs bg-emerald-50 rounded-lg px-3 py-2 flex justify-between">
                        <span>
                          {r.name} · {r.email} · {r.admissionNo}
                        </span>
                        {r.errors.length > 0 ? <Badge tone="amber">No class match</Badge> : <span className="text-slate-400 dark:text-slate-500">{r.className || "Unassigned"}</span>}
                      </div>
                    ))}
                  </div>
                  <Button type="button" className="mt-3" onClick={confirmImport} disabled={isPending}>
                    {isPending ? "Importing..." : `Import ${preview.valid.length} students`}
                  </Button>
                </div>
              ) : (
                <EmptyState title="Nothing valid to import" body="Fix the rows above and validate again." />
              )}
            </div>
          </Card>
        )}

        {result && (
          <Card className="p-4 sm:p-5 bg-emerald-50 border-emerald-200">
            <p className="text-sm text-emerald-800">
              Import complete: <strong>{result.created}</strong> students created
              {result.skipped > 0 ? `, ${result.skipped} skipped (already existed by the time of import)` : ""}.
            </p>
          </Card>
        )}
      </div>

      <Card className="h-fit p-4 sm:p-5 text-sm text-slate-600 space-y-2 dark:text-slate-400">
        <p className="font-medium text-slate-800 dark:text-slate-200">How this works</p>
        <p>Nothing is written to the database until you click Import. Validation only checks the file first.</p>
        <p>Every row needs a name, a valid email and an admission number. Duplicate emails or admission numbers, in the file or already on record, are skipped and listed.</p>
        <p>New accounts get the default password <code className="bg-slate-100 px-1 rounded dark:bg-slate-800">Masomo@2026</code> — ask students to change it after first login.</p>
        <p>This action is logged in the audit trail with the counts of created and skipped rows.</p>
      </Card>
    </div>
  );
}
