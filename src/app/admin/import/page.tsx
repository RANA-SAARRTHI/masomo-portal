import { requireSession } from "@/lib/guard";
import { PageHeader } from "@/components/ui";
import { ImportClient } from "./import-client";

export default async function ImportPage() {
  await requireSession("/admin");
  return (
    <div>
      <PageHeader title="Bulk import students" subtitle="Upload a spreadsheet of admissions instead of adding students one by one." />
      <ImportClient />
    </div>
  );
}
