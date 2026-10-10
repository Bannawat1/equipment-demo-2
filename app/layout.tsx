import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "ระบบจัดการครุภัณฑ์",
  description: "ตัวอย่างแอป CRUD ด้วย Next.js + Prisma + PostgreSQL",
};

// NEXT_PUBLIC_* ถูก "ฝัง" ลงในโค้ดตอน `next build` ไม่ได้อ่านตอนรัน
// ถ้าเปลี่ยนค่าต้อง build image ใหม่ (ส่งผ่าน build-arg) ค่าถึงจะเปลี่ยน
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "dev";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th">
      <body className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-5xl px-4 py-4">
            <Link href="/equipment" className="text-lg font-semibold">
              ระบบจัดการครุภัณฑ์
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
          เวอร์ชัน {APP_VERSION}
        </footer>
      </body>
    </html>
  );
}
