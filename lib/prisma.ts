import { PrismaClient } from "@prisma/client";

// ตอนรัน `npm run dev` Next.js จะ reload โมดูลบ่อยๆ ถ้าสร้าง PrismaClient ใหม่ทุกครั้ง
// connection จะเต็มเร็ว จึงเก็บ instance ไว้ใน globalThis แล้วใช้ซ้ำ (singleton)
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
