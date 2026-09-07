import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guard";
import { toCsv, watermarkCsv } from "@/lib/exports";
import { generateReportRows, REPORT_TYPES, REPORT_LABEL, type ReportType } from "@/lib/report-data";

export async function GET(req: NextRequest) {
  // requireSession redirects on failure, which is fine for a route handler too
  // (the browser download link is only ever rendered for an authorised admin).
  const { tenantId, userId, name } = await requireSession("/admin");
  const typeParam = req.nextUrl.searchParams.get("type") ?? "attendance";
  const type = (REPORT_TYPES as readonly string[]).includes(typeParam) ? (typeParam as ReportType) : "attendance";

  const [rows, tenant, user] = await Promise.all([
    generateReportRows(tenantId, type),
    prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } }),
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
  ]);

  const generatedAt = new Date();
  const csv = watermarkCsv(toCsv(rows), {
    tenantName: tenant.name,
    requestedBy: name,
    requestedByEmail: user.email,
    generatedAt,
    purpose: `${REPORT_LABEL[type]} export`,
  });

  await prisma.exportRun.create({
    data: { tenantId, type, requestedById: userId, rowCount: rows.length, content: csv },
  });
  await prisma.auditLog.create({
    data: { tenantId, actorId: userId, action: `EXPORT_${type.toUpperCase()}`, target: `${rows.length} rows` },
  });

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${type}-export-${generatedAt.toISOString().slice(0, 10)}.csv"`,
    },
  });
}
