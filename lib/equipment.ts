import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import type { EquipmentInput, EquipmentStatusValue } from "./validation";

// ไฟล์นี้รวมฟังก์ชันเข้าถึงข้อมูลทั้งหมด แยกออกจาก UI เพื่อให้เขียน test ได้ง่าย

export class DuplicateCodeError extends Error {
  constructor(code: string) {
    super(`รหัสครุภัณฑ์ "${code}" มีอยู่ในระบบแล้ว`);
    this.name = "DuplicateCodeError";
  }
}

export type ListFilter = {
  q?: string;
  status?: EquipmentStatusValue;
};

export async function listEquipment(filter: ListFilter = {}) {
  const q = filter.q?.trim();
  return prisma.equipment.findMany({
    where: {
      status: filter.status,
      ...(q && {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { code: { contains: q, mode: "insensitive" } },
        ],
      }),
    },
    orderBy: { code: "asc" },
  });
}

export async function getEquipment(id: number) {
  return prisma.equipment.findUnique({ where: { id } });
}

export async function createEquipment(data: EquipmentInput) {
  try {
    return await prisma.equipment.create({ data });
  } catch (error) {
    throw toDomainError(error, data.code);
  }
}

export async function updateEquipment(id: number, data: EquipmentInput) {
  try {
    return await prisma.equipment.update({ where: { id }, data });
  } catch (error) {
    throw toDomainError(error, data.code);
  }
}

export async function deleteEquipment(id: number) {
  return prisma.equipment.delete({ where: { id } });
}

// P2002 = ละเมิด unique constraint (ในที่นี้คือ code ซ้ำ)
function toDomainError(error: unknown, code: string) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return new DuplicateCodeError(code);
  }
  return error;
}
