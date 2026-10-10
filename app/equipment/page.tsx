import Link from "next/link";
import { listEquipment } from "@/lib/equipment";
import { EQUIPMENT_STATUSES, STATUS_LABELS } from "@/lib/validation";
import { DeleteButton } from "./delete-button";
import { StatusBadge } from "./status-badge";

// บังคับให้ render ทุก request → `next build` ไม่ต้องเชื่อมต่อ DB
export const dynamic = "force-dynamic";

export default async function EquipmentListPage({ searchParams }: PageProps<"/equipment">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const status = EQUIPMENT_STATUSES.find((s) => s === params.status);

  const items = await listEquipment({ q, status });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">รายการครุภัณฑ์</h1>
        <Link
          href="/equipment/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + เพิ่มครุภัณฑ์
        </Link>
      </div>

      {/* ใช้ GET form ธรรมดา: ค่าค้นหาจะไปอยู่ใน URL (?q=...&status=...) */}
      <form className="flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="ค้นหาด้วยชื่อหรือรหัส"
          className="min-w-60 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">ทุกสถานะ</option>
          {EQUIPMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-100"
        >
          ค้นหา
        </button>
        {(q || status) && (
          <Link href="/equipment" className="self-center text-sm text-slate-600 hover:underline">
            ล้างตัวกรอง
          </Link>
        )}
      </form>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">รหัส</th>
              <th className="px-4 py-3 font-medium">ชื่อ</th>
              <th className="px-4 py-3 font-medium">หมวดหมู่</th>
              <th className="px-4 py-3 font-medium">สถานะ</th>
              <th className="px-4 py-3 font-medium">สถานที่</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 font-mono">{item.code}</td>
                <td className="px-4 py-3">{item.name}</td>
                <td className="px-4 py-3">{item.category}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-4 py-3 text-slate-600">{item.location ?? "-"}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-4">
                    <Link
                      href={`/equipment/${item.id}/edit`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      แก้ไข
                    </Link>
                    <DeleteButton id={item.id} name={item.name} />
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  ไม่พบข้อมูล
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-slate-500">ทั้งหมด {items.length} รายการ</p>
    </div>
  );
}
