import { requireSession } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, CardHeader, Button, Input, Label } from "@/components/ui";
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
            <Label>School name</Label>
            <Input name="name" defaultValue={tenant.name} required />
          </div>
          <div>
            <Label>District</Label>
            <Input name="district" defaultValue={tenant.district ?? ""} placeholder="e.g. Wakiso" />
          </div>
          <div>
            <Label>Brand colour</Label>
            <input type="color" name="primaryColor" defaultValue={tenant.primaryColor} className="h-10 w-16 rounded border border-slate-200" />
          </div>
          <div className="text-sm text-slate-500 pt-2 border-t border-slate-100">
            <p>Currency: {tenant.currency}</p>
            <p>Timezone: {tenant.timezone}</p>
            <p>Institution type: {tenant.type}</p>
          </div>
          <Button type="submit">Save changes</Button>
        </form>
      </Card>
    </div>
  );
}
