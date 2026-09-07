import { requireSession } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, CardHeader, Table, Button, Input, Label, EmptyState } from "@/components/ui";
import { addRoute, assignStudent } from "@/lib/actions/transport";

export default async function TransportPage() {
  const { tenantId } = await requireSession("/transport");
  const routes = await prisma.transportRoute.findMany({
    where: { tenantId },
    include: { assignments: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader title="Transport" subtitle="Routes, vehicles and learner assignments." />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {routes.length === 0 ? (
            <Card>
              <EmptyState title="No routes yet" />
            </Card>
          ) : (
            routes.map((r) => (
              <Card key={r.id}>
                <CardHeader title={r.name} subtitle={`${r.vehicle ?? "No vehicle set"} · Driver: ${r.driver ?? "—"} · Capacity ${r.capacity}`} />
                <Table head={["Student", "Stop"]}>
                  {r.assignments.map((a) => (
                    <tr key={a.id}>
                      <td className="py-2 px-3">{a.studentName}</td>
                      <td className="py-2 px-3">{a.stop}</td>
                    </tr>
                  ))}
                </Table>
                <form action={assignStudent} className="p-4 flex gap-2">
                  <input type="hidden" name="routeId" value={r.id} />
                  <Input name="studentName" placeholder="Student name" className="flex-1" />
                  <Input name="stop" placeholder="Stop" className="flex-1" />
                  <Button type="submit" variant="secondary">
                    Assign
                  </Button>
                </form>
              </Card>
            ))
          )}
        </div>

        <Card className="h-fit">
          <CardHeader title="Add a route" />
          <form action={addRoute} className="p-4 sm:p-5 space-y-3">
            <div>
              <Label>Route name</Label>
              <Input name="name" required placeholder="e.g. Kireka - Ntinda" />
            </div>
            <div>
              <Label>Vehicle</Label>
              <Input name="vehicle" placeholder="e.g. UBH 123X" />
            </div>
            <div>
              <Label>Driver</Label>
              <Input name="driver" placeholder="Driver name" />
            </div>
            <div>
              <Label>Capacity</Label>
              <Input name="capacity" type="number" defaultValue={30} />
            </div>
            <Button type="submit" className="w-full">
              Add route
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
