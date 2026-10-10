import { z } from "zod";

export const EQUIPMENT_STATUSES = ["AVAILABLE", "BORROWED", "MAINTENANCE"] as const;
export type EquipmentStatusValue = (typeof EQUIPMENT_STATUSES)[number];

export const STATUS_LABELS: Record<EquipmentStatusValue, string> = {
  AVAILABLE: "พร้อมใช้งาน",
  BORROWED: "ถูกยืม",
  MAINTENANCE: "ซ่อมบำรุง",
};

export const equipmentSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, "กรุณากรอกรหัสครุภัณฑ์")
    .max(20, "รหัสต้องยาวไม่เกิน 20 ตัวอักษร")
    .regex(/^[A-Z0-9-]+$/, "รหัสใช้ได้เฉพาะ A-Z, 0-9 และ - (เช่น EQ-0001)"),
  name: z
    .string()
    .trim()
    .min(1, "กรุณากรอกชื่อครุภัณฑ์")
    .max(100, "ชื่อต้องยาวไม่เกิน 100 ตัวอักษร"),
  category: z
    .string()
    .trim()
    .min(1, "กรุณากรอกหมวดหมู่")
    .max(50, "หมวดหมู่ต้องยาวไม่เกิน 50 ตัวอักษร"),
  status: z.enum(EQUIPMENT_STATUSES, { error: "สถานะไม่ถูกต้อง" }),
  // ช่องว่าง ("") จากฟอร์มให้แปลงเป็น null เพื่อเก็บใน DB ว่า "ไม่ระบุ"
  location: z
    .string()
    .trim()
    .max(100, "สถานที่ต้องยาวไม่เกิน 100 ตัวอักษร")
    .nullish()
    .transform((value) => (value ? value : null)),
});

export type EquipmentInput = z.infer<typeof equipmentSchema>;
