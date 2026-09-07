import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAnySession } from "@/lib/guard";

export async function GET(req: NextRequest, { params }: { params: Promise<{ runId: string }> }) {
  const { tenantId, userId, role } = await requireAnySession();
  const { runId } = await params;

  const run = await prisma.exportRun.findUnique({
    where: { id: runId },
    include: { scheduledReport: true },
  });
  if (!run || run.tenantId !== tenantId) {
    return new Response("Not found", { status: 404 });
  }

  const isAdmin = role === "ADMIN" || role === "PRINCIPAL" || role === "PLATFORM_OWNER";
  const isRecipient = run.scheduledReport?.recipientId === userId;
  if (!isAdmin && !isRecipient) {
    return new Response("Forbidden", { status: 403 });
  }

  return new Response(run.content, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${run.type}-report-${run.createdAt.toISOString().slice(0, 10)}.csv"`,
    },
  });
}
