import { notFound } from "next/navigation";
import { getEquipment } from "@/lib/equipment";
import { updateEquipmentAction } from "../../actions";
import { EquipmentForm } from "../../equipment-form";

export const dynamic = "force-dynamic";

export default async function EditEquipmentPage({ params }: PageProps<"/equipment/[id]/edit">) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const item = await getEquipment(id);
  if (!item) notFound();

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold">แก้ไขครุภัณฑ์</h1>
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <EquipmentForm
          action={updateEquipmentAction.bind(null, item.id)}
          submitLabel="บันทึกการแก้ไข"
          initialValues={{
            code: item.code,
            name: item.name,
            category: item.category,
            status: item.status,
            location: item.location ?? "",
          }}
        />
      </div>
    </div>
  );
}
