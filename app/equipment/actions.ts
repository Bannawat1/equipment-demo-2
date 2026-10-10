"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createEquipment,
  deleteEquipment,
  DuplicateCodeError,
  updateEquipment,
} from "@/lib/equipment";
import { equipmentSchema } from "@/lib/validation";

const FIELDS = ["code", "name", "category", "status", "location"] as const;
type Field = (typeof FIELDS)[number];

export type FormState = {
  message?: string;
  errors?: Partial<Record<Field, string[]>>;
  // ค่าที่ผู้ใช้กรอกไว้ ส่งกลับไปเติมในฟอร์มเมื่อ validate ไม่ผ่าน
  values?: Record<Field, string>;
};

function readForm(formData: FormData) {
  return Object.fromEntries(
    FIELDS.map((field) => [field, String(formData.get(field) ?? "")]),
  ) as Record<Field, string>;
}

async function save(
  formData: FormData,
  persist: (data: z.infer<typeof equipmentSchema>) => Promise<unknown>,
): Promise<FormState> {
  const values = readForm(formData);
  const parsed = equipmentSchema.safeParse(values);

  if (!parsed.success) {
    return {
      message: "กรุณาตรวจสอบข้อมูลที่กรอก",
      errors: z.flattenError(parsed.error).fieldErrors,
      values,
    };
  }

  try {
    await persist(parsed.data);
  } catch (error) {
    if (error instanceof DuplicateCodeError) {
      return { errors: { code: [error.message] }, values };
    }
    throw error;
  }

  revalidatePath("/equipment");
  // redirect() ทำงานโดยการ throw จึงต้องเรียกนอก try/catch
  redirect("/equipment");
}

export async function createEquipmentAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return save(formData, (data) => createEquipment(data));
}

export async function updateEquipmentAction(
  id: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return save(formData, (data) => updateEquipment(id, data));
}

export async function deleteEquipmentAction(id: number) {
  await deleteEquipment(id);
  revalidatePath("/equipment");
}
