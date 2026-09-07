import { requireSession } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, CardHeader, Button, Input, Label } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { updateTenantBranding } from "@/lib/actions/admin";

export default async function SettingsPage() {
  const { tenantId } = await requireSession("/admin");
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });

  return (
    <div>
      <PageHeader title="Settings" subtitle="Branding and institution details." />
      <Card className="max-w-xl">
        <CardHeader title="School profile" />
        <form action={updateTenantBranding} className="p-4 sm:p-5 space-y-3">
          <div>
            <Label htmlFor="field-name">School name</Label>
            <Input id="field-name" name="name" defaultValue={tenant.name} required />
          </div>
          <div>
            <Label htmlFor="field-district">District</Label>
            <Input id="field-district" name="district" defaultValue={tenant.district ?? ""} placeholder="e.g. Wakiso" />
          </div>
          <div>
            <Label htmlFor="field-primarycolor">Brand colour</Label>
            <input id="field-primarycolor" type="color" name="primaryColor" defaultValue={tenant.primaryColor} className="h-10 w-16 rounded border border-slate-200 dark:border-slate-700" />
          </div>
          <div className="text-sm text-slate-500 pt-2 border-t border-slate-100 dark:text-slate-400 dark:border-slate-800">
            <p>Currency: {tenant.currency}</p>
            <p>Timezone: {tenant.timezone}</p>
            <p>Institution type: {tenant.type}</p>
          </div>
          <SubmitButton>Save changes</SubmitButton>
        </form>
      </Card>
    </div>
  );
}
