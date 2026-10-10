import { PrismaClient, type EquipmentStatus } from "@prisma/client";

// ข้อมูลตัวอย่าง — รันซ้ำได้โดยไม่ error เพราะใช้ upsert ตาม code
// (ถ้ามี code นี้อยู่แล้วจะไม่แก้ไขอะไร จึงไม่ทับข้อมูลที่ผู้ใช้แก้ไขไว้)
const prisma = new PrismaClient();

const items: {
  code: string;
  name: string;
  category: string;
  status: EquipmentStatus;
  location: string | null;
}[] = [
  { code: "EQ-0001", name: "โน้ตบุ๊ก Dell Latitude 5440", category: "คอมพิวเตอร์", status: "AVAILABLE", location: "ห้อง 301" },
  { code: "EQ-0002", name: "โน้ตบุ๊ก Lenovo ThinkPad E14", category: "คอมพิวเตอร์", status: "BORROWED", location: "ห้อง 301" },
  { code: "EQ-0003", name: "โปรเจกเตอร์ Epson EB-X51", category: "อุปกรณ์นำเสนอ", status: "AVAILABLE", location: "ห้องประชุม 1" },
  { code: "EQ-0004", name: "โปรเจกเตอร์ BenQ MW560", category: "อุปกรณ์นำเสนอ", status: "MAINTENANCE", location: null },
  { code: "EQ-0005", name: "สวิตช์เครือข่าย Cisco 24 พอร์ต", category: "อุปกรณ์เครือข่าย", status: "AVAILABLE", location: "ห้อง Server" },
  { code: "EQ-0006", name: "เราเตอร์ไร้สาย TP-Link", category: "อุปกรณ์เครือข่าย", status: "AVAILABLE", location: "ห้อง 302" },
  { code: "EQ-0007", name: "จอภาพ 27 นิ้ว", category: "คอมพิวเตอร์", status: "BORROWED", location: null },
  { code: "EQ-0008", name: "ไมโครโฟนไร้สาย", category: "เครื่องเสียง", status: "AVAILABLE", location: "ห้องประชุม 2" },
  { code: "EQ-0009", name: "ลำโพงบลูทูธ", category: "เครื่องเสียง", status: "MAINTENANCE", location: "ห้องเก็บของ" },
  { code: "EQ-0010", name: "กล้องเว็บแคม Logitech C920", category: "อุปกรณ์ต่อพ่วง", status: "AVAILABLE", location: "ห้อง 303" },
];

async function main() {
  for (const item of items) {
    await prisma.equipment.upsert({
      where: { code: item.code },
      update: {},
      create: item,
    });
  }
  console.log(`Seed เสร็จสิ้น: ${items.length} รายการ`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
