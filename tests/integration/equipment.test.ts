import { afterAll, beforeEach, afterEach, describe, expect, it } from "vitest";
import {
  createEquipment,
  deleteEquipment,
  DuplicateCodeError,
  getEquipment,
  listEquipment,
  updateEquipment,
} from "@/lib/equipment";
import { prisma } from "@/lib/prisma";
import type { EquipmentInput } from "@/lib/validation";

// test นี้ใช้ DB จริงตาม DATABASE_URL
// ลบเฉพาะข้อมูลที่ code ขึ้นต้นด้วย TEST- เพื่อไม่ให้ข้อมูล seed ในเครื่อง dev หายไป
const PREFIX = "TEST-";

const sample: EquipmentInput = {
  code: `${PREFIX}0001`,
  name: "โน้ตบุ๊กทดสอบ",
  category: "คอมพิวเตอร์",
  status: "AVAILABLE",
  location: "ห้องทดสอบ",
};

async function cleanup() {
  await prisma.equipment.deleteMany({ where: { code: { startsWith: PREFIX } } });
}

beforeEach(cleanup);
afterEach(cleanup);
afterAll(() => prisma.$disconnect());

describe("equipment CRUD", () => {
  it("create — สร้างรายการใหม่ได้", async () => {
    const created = await createEquipment(sample);
    expect(created.id).toBeGreaterThan(0);
    expect(created).toMatchObject(sample);
  });

  it("create — code ซ้ำต้อง throw DuplicateCodeError", async () => {
    await createEquipment(sample);
    await expect(createEquipment(sample)).rejects.toBeInstanceOf(DuplicateCodeError);
  });

  it("read — get ตาม id และค้นหา/กรองในรายการได้", async () => {
    const created = await createEquipment(sample);
    await createEquipment({ ...sample, code: `${PREFIX}0002`, name: "โปรเจกเตอร์ทดสอบ", status: "BORROWED" });

    expect(await getEquipment(created.id)).toMatchObject(sample);
    expect(await listEquipment({ q: PREFIX })).toHaveLength(2);
    expect(await listEquipment({ q: "โปรเจกเตอร์ทดสอบ" })).toHaveLength(1);
    expect(await listEquipment({ q: "test-0001" })).toHaveLength(1);
    const borrowed = await listEquipment({ q: PREFIX, status: "BORROWED" });
    expect(borrowed.map((item) => item.code)).toEqual([`${PREFIX}0002`]);
  });

  it("update — แก้ไขข้อมูลได้", async () => {
    const created = await createEquipment(sample);
    const updated = await updateEquipment(created.id, {
      ...sample,
      name: "ชื่อใหม่",
      status: "MAINTENANCE",
      location: null,
    });
    expect(updated).toMatchObject({ name: "ชื่อใหม่", status: "MAINTENANCE", location: null });
  });

  it("update — เปลี่ยน code ไปซ้ำกับรายการอื่นต้อง throw DuplicateCodeError", async () => {
    await createEquipment(sample);
    const other = await createEquipment({ ...sample, code: `${PREFIX}0002` });
    await expect(updateEquipment(other.id, sample)).rejects.toBeInstanceOf(DuplicateCodeError);
  });

  it("delete — ลบแล้วหาไม่เจอ", async () => {
    const created = await createEquipment(sample);
    await deleteEquipment(created.id);
    expect(await getEquipment(created.id)).toBeNull();
  });
});
