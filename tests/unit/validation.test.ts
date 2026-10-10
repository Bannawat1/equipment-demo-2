import { describe, expect, it } from "vitest";
import { equipmentSchema } from "@/lib/validation";

const valid = {
  code: "EQ-0001",
  name: "โน้ตบุ๊ก",
  category: "คอมพิวเตอร์",
  status: "AVAILABLE",
  location: "ห้อง 301",
};

describe("equipmentSchema", () => {
  it("ผ่านเมื่อข้อมูลถูกต้อง", () => {
    const result = equipmentSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("แปลง code เป็นตัวพิมพ์ใหญ่และตัดช่องว่าง", () => {
    const result = equipmentSchema.parse({ ...valid, code: "  eq-0002 ", name: " โปรเจกเตอร์ " });
    expect(result.code).toBe("EQ-0002");
    expect(result.name).toBe("โปรเจกเตอร์");
  });

  it("แปลง location ที่เป็นค่าว่างเป็น null", () => {
    expect(equipmentSchema.parse({ ...valid, location: "" }).location).toBeNull();
    expect(equipmentSchema.parse({ ...valid, location: "   " }).location).toBeNull();
    expect(equipmentSchema.parse({ ...valid, location: undefined }).location).toBeNull();
  });

  it("ไม่ผ่านเมื่อไม่กรอกช่องที่บังคับ", () => {
    const result = equipmentSchema.safeParse({ ...valid, code: "", name: "  ", category: "" });
    expect(result.success).toBe(false);
    const fields = result.error?.issues.map((issue) => issue.path[0]);
    expect(fields).toEqual(expect.arrayContaining(["code", "name", "category"]));
  });

  it("ไม่ผ่านเมื่อ code มีอักขระที่ไม่อนุญาต", () => {
    const result = equipmentSchema.safeParse({ ...valid, code: "EQ 0001!" });
    expect(result.success).toBe(false);
  });

  it("ไม่ผ่านเมื่อ status ไม่อยู่ในรายการ", () => {
    const result = equipmentSchema.safeParse({ ...valid, status: "LOST" });
    expect(result.success).toBe(false);
  });
});
