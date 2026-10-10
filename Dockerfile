# syntax=docker/dockerfile:1
#
# Multi-stage Dockerfile สำหรับแอป Next.js + Prisma
# ---------------------------------------------------------------
# แบ่งเป็นหลาย stage เพื่อให้ image สุดท้าย (runner) เล็กที่สุด:
#   base     → image ตั้งต้นที่ทุก stage ใช้ร่วมกัน
#   deps     → ติดตั้ง dependency ทั้งหมด (npm ci)
#   builder  → prisma generate + next build
#   migrator → ใช้รัน migration และ seed (service "migrate" ใน compose)
#   runner   → image ที่ใช้รันแอปจริง มีเฉพาะไฟล์ที่จำเป็น
#
# build เฉพาะ stage ที่ต้องการได้ด้วย --target เช่น
#   docker build --target runner -t equipment-app:local .

# ---------- base ----------
# node:22-alpine = Node.js 22 LTS บน Alpine Linux (ขนาดเล็ก ใช้ musl libc)
FROM node:22-alpine AS base
# Prisma engine ต้องใช้ OpenSSL (ตรงกับ binaryTargets "linux-musl-openssl-3.0.x")
RUN apk add --no-cache openssl
WORKDIR /app
# ปิดการส่งข้อมูลการใช้งานของ Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# ---------- deps ----------
FROM base AS deps
# copy เฉพาะไฟล์ที่กำหนด dependency ก่อน เพื่อใช้ประโยชน์จาก layer cache:
# ถ้า package*.json ไม่เปลี่ยน Docker จะไม่รัน npm ci ใหม่แม้ source code เปลี่ยน
COPY package.json package-lock.json ./
# postinstall จะรัน "prisma generate" จึงต้องมี schema ก่อน
COPY prisma ./prisma
# npm ci ติดตั้งตาม package-lock.json แบบตรงเป๊ะ (เหมาะกับ build อัตโนมัติ)
RUN npm ci

# ---------- builder ----------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# ARG = ตัวแปรที่ใช้ได้เฉพาะตอน build รับค่าจาก --build-arg หรือ build.args ใน compose
# NEXT_PUBLIC_* จะถูกฝังลงใน JavaScript ตอน next build จึงต้องส่งมาตอน build เท่านั้น
ARG NEXT_PUBLIC_APP_VERSION=dev
ENV NEXT_PUBLIC_APP_VERSION=${NEXT_PUBLIC_APP_VERSION}
# สร้าง Prisma Client แล้ว build แอป (ไม่ต้องเชื่อมต่อ DB เพราะหน้าที่อ่าน DB เป็น dynamic)
RUN npx prisma generate && npm run build

# ---------- migrator ----------
# image สำหรับ service "migrate": มี Prisma CLI (devDependency) และโฟลเดอร์ prisma/
# รันครั้งเดียวก่อนแอปเริ่ม แล้วจบการทำงาน จึงไม่ต้องสนใจขนาดมากนัก
FROM base AS migrator
# ปิดข้อความแจ้งเตือนอัปเดตเวอร์ชันของ Prisma CLI ใน log
ENV PRISMA_HIDE_UPDATE_MESSAGE=1
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY prisma ./prisma
# migrate deploy = รัน migration ที่ยังไม่เคยรัน (ไม่สร้าง migration ใหม่)
# db seed       = รัน prisma/seed.ts (upsert จึงรันซ้ำได้)
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed"]

# ---------- runner ----------
FROM base AS runner
ENV NODE_ENV=production
# server.js ของ standalone ฟังที่ HOSTNAME:PORT
# ต้องเป็น 0.0.0.0 เพื่อรับ request จากนอก container (ค่าเดิมของ Docker คือ id ของ container)
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# copy เฉพาะผลลัพธ์จาก next build (ไม่มี source code และไม่มี devDependencies)
#   .next/standalone → server.js + node_modules เท่าที่จำเป็น
#   .next/static     → ไฟล์ JS/CSS ฝั่ง browser
#   public           → ไฟล์ static อื่นๆ
# --chown=node:node ให้ไฟล์เป็นของ user "node" (มีมาให้แล้วใน image node)
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

# รันด้วย user ที่ไม่ใช่ root เพื่อความปลอดภัย
USER node

# บอกว่าแอปฟังที่ port 3000 (เป็นเอกสาร การเปิด port จริงทำที่ compose: ports)
EXPOSE 3000

# Docker จะเรียก /api/health เป็นระยะ ถ้าล้มเหลวติดกันจะขึ้นสถานะ unhealthy
# (ดูได้จาก docker compose ps) — wget มีมาใน Alpine (busybox)
HEALTHCHECK --interval=15s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server.js"]
