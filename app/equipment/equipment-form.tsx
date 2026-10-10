"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { FormState } from "./actions";
import { EQUIPMENT_STATUSES, STATUS_LABELS } from "@/lib/validation";

type Values = {
  code: string;
  name: string;
  category: string;
  status: string;
  location: string;
};

type Props = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  initialValues?: Values;
  submitLabel: string;
};

const EMPTY: Values = {
  code: "",
  name: "",
  category: "",
  status: "AVAILABLE",
  location: "",
};

export function EquipmentForm({ action, initialValues = EMPTY, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const values = state.values ?? initialValues;

  return (
    // key ทำให้ฟอร์มถูกสร้างใหม่ด้วยค่าที่ผู้ใช้กรอกไว้ หลังจาก validate ไม่ผ่าน
    <form key={JSON.stringify(values)} action={formAction} className="space-y-5" noValidate>
      {state.message && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </p>
      )}

      <Field label="รหัสครุภัณฑ์" name="code" error={state.errors?.code}>
        <input
          id="code"
          name="code"
          defaultValue={values.code}
          placeholder="EQ-0001"
          className={inputClass(state.errors?.code)}
        />
      </Field>

      <Field label="ชื่อครุภัณฑ์" name="name" error={state.errors?.name}>
        <input
          id="name"
          name="name"
          defaultValue={values.name}
          placeholder="โน้ตบุ๊ก"
          className={inputClass(state.errors?.name)}
        />
      </Field>

      <Field label="หมวดหมู่" name="category" error={state.errors?.category}>
        <input
          id="category"
          name="category"
          defaultValue={values.category}
          placeholder="คอมพิวเตอร์"
          className={inputClass(state.errors?.category)}
        />
      </Field>

      <Field label="สถานะ" name="status" error={state.errors?.status}>
        <select
          id="status"
          name="status"
          defaultValue={values.status}
          className={inputClass(state.errors?.status)}
        >
          {EQUIPMENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="สถานที่ (ไม่บังคับ)" name="location" error={state.errors?.location}>
        <input
          id="location"
          name="location"
          defaultValue={values.location}
          placeholder="ห้อง 301"
          className={inputClass(state.errors?.location)}
        />
      </Field>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "กำลังบันทึก..." : submitLabel}
        </button>
        <Link href="/equipment" className="text-sm text-slate-600 hover:underline">
          ยกเลิก
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  error,
  children,
}: {
  label: string;
  name: string;
  error?: string[];
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {error?.map((message) => (
        <p key={message} className="mt-1 text-sm text-red-600">
          {message}
        </p>
      ))}
    </div>
  );
}

function inputClass(error?: string[]) {
  return [
    "w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2",
    error ? "border-red-400 focus:ring-red-200" : "border-slate-300 focus:ring-blue-200",
  ].join(" ");
}
