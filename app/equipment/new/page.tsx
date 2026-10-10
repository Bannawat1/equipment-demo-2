import { createEquipmentAction } from "../actions";
import { EquipmentForm } from "../equipment-form";

export default function NewEquipmentPage() {
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold">เพิ่มครุภัณฑ์</h1>
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <EquipmentForm action={createEquipmentAction} submitLabel="บันทึก" />
      </div>
    </div>
  );
}
