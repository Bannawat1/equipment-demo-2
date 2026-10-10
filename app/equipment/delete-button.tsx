"use client";

import { deleteEquipmentAction } from "./actions";

export function DeleteButton({ id, name }: { id: number; name: string }) {
  return (
    <form
      action={deleteEquipmentAction.bind(null, id)}
      onSubmit={(event) => {
        if (!confirm(`ยืนยันการลบ "${name}" ?`)) {
          event.preventDefault();
        }
      }}
    >
      <button type="submit" className="text-sm text-red-600 hover:underline">
        ลบ
      </button>
    </form>
  );
}
