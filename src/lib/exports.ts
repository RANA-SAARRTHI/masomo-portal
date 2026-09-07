export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return lines.join("\n");
}

// Every export carries who pulled it, when, and from which tenant, right in
// the file — so a copy found later still identifies its origin. This is the
// spec's "watermarked export" requirement in a form that survives a CSV
// download (no image/PDF overlay needed for a plain-text export).
export function watermarkCsv(csv: string, meta: { tenantName: string; requestedBy: string; requestedByEmail: string; generatedAt: Date; purpose: string }): string {
  const header = [
    `# Masomo export — CONFIDENTIAL, do not redistribute`,
    `# School: ${meta.tenantName}`,
    `# Requested by: ${meta.requestedBy} <${meta.requestedByEmail}>`,
    `# Generated: ${meta.generatedAt.toISOString()}`,
    `# Purpose: ${meta.purpose}`,
    ``,
  ].join("\n");
  return header + csv;
}
