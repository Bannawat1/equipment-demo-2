import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "standalone" ให้ next build สร้างโฟลเดอร์ .next/standalone ที่มี server.js
  // พร้อมเฉพาะ node_modules ที่จำเป็นจริง → ใช้ทำ Docker image ขนาดเล็กได้
  output: "standalone",
  // ตัดไฟล์ที่ไม่ได้ใช้บน Node.js/Alpine ออกจาก standalone เพื่อให้ image เล็กลง
  outputFileTracingExcludes: {
    "*": [
      // Prisma engine แบบ WebAssembly สำหรับ edge runtime และ DB อื่น (เราใช้ native engine)
      "node_modules/@prisma/client/runtime/*.wasm-base64.*",
      // sharp สำหรับ glibc / wasm (Alpine ใช้ musl จึงเก็บไว้เฉพาะ *-linuxmusl-*)
      "node_modules/@img/sharp-libvips-linux-*",
      "node_modules/@img/sharp-linux-*",
      "node_modules/@img/sharp-wasm32/**",
    ],
  },
  // ใช้ Tailwind CSS v4 ผ่าน loader ของ Turbopack (bundler ค่าเริ่มต้นของ Next.js 16)
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
