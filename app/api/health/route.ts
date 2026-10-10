import { prisma } from "@/lib/prisma";

// ห้าม cache และห้ามรันตอน build — ต้องเช็ก DB จริงทุกครั้งที่ถูกเรียก
export const dynamic = "force-dynamic";

// ใช้โดย Docker HEALTHCHECK และใช้ตรวจหลัง deploy ว่าแอป + DB พร้อมใช้งาน
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", db: "up" });
  } catch {
    return Response.json({ status: "error", db: "down" }, { status: 503 });
  }
}
