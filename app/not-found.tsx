import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-2xl font-semibold">ไม่พบหน้าที่ต้องการ</h1>
      <Link href="/equipment" className="mt-4 inline-block text-blue-600 hover:underline">
        กลับไปหน้ารายการ
      </Link>
    </div>
  );
}
