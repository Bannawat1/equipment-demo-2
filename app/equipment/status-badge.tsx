import { STATUS_LABELS, type EquipmentStatusValue } from "@/lib/validation";

const COLORS: Record<EquipmentStatusValue, string> = {
  AVAILABLE: "bg-green-100 text-green-800",
  BORROWED: "bg-amber-100 text-amber-800",
  MAINTENANCE: "bg-slate-200 text-slate-700",
};

export function StatusBadge({ status }: { status: EquipmentStatusValue }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
