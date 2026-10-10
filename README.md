# ระบบจัดการครุภัณฑ์ — Next.js CRUD Starter

Starter repository สำหรับ lab **Docker + CI/CD** วิชา Full Stack Web Programming

## 1. ภาพรวม

repo นี้คือแอป **ระบบจัดการครุภัณฑ์ (Equipment)** ที่ทำงานได้ครบแล้ว ได้แก่ เพิ่ม ดู ค้นหา แก้ไข และลบ
ใช้ Next.js (App Router) + Prisma + PostgreSQL และรันทั้งระบบได้ด้วย Docker Compose คำสั่งเดียว

**สิ่งที่นิสิตต้องทำใน lab นี้**

1. รันแอปในเครื่องด้วย Docker Compose และทำความเข้าใจ `Dockerfile` กับ `docker-compose.yml`
2. นำโค้ดขึ้น GitHub repo ของตัวเอง
3. เขียน **GitHub Actions** สำหรับ CI (lint / typecheck / test / build)
4. เขียน **GitHub Actions** สำหรับ CD (build image → push ขึ้น GHCR → deploy ขึ้น VPS)
5. ตั้งค่า **Nginx** + HTTPS บน VPS ที่ผูกโดเมนจริง

```
 git push ──▶ GitHub Actions: CI ──▶ build Docker image ──▶ GHCR ──▶ VPS
              (lint, typecheck,      (docker build)        (ghcr.io)  (docker compose pull
               test, build)                                            + up -d, Nginx + HTTPS)
```

```mermaid
flowchart LR
  A[git push] --> B[CI: lint / typecheck / test]
  B --> C[build Docker image]
  C --> D[(GHCR)]
  D --> E[VPS: docker compose pull + up -d]
  E --> F[Nginx + HTTPS โดเมนจริง]
```

## 2. สิ่งที่ต้องติดตั้ง

| โปรแกรม | จำเป็น? | หมายเหตุ |
|---|---|---|
| [Git](https://git-scm.com/) | ✅ | |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | ✅ | มี Docker Compose v2 มาให้แล้ว |
| [Node.js 22 LTS](https://nodejs.org/) | ไม่บังคับ | ใช้เมื่ออยากรันแบบ dev หรือรัน test ในเครื่อง (เวอร์ชันอยู่ใน `.nvmrc`) |

## 3. รันในเครื่องด้วย Docker Compose (วิธีหลัก)

```bash
git clone https://github.com/<OWNER>/nextjs-crud-starter.git
cd nextjs-crud-starter
cp .env.example .env
docker compose up --build
```

✅ เปิด <http://localhost:3300> แล้วเพิ่ม ดู แก้ไข ลบข้อมูลได้ และ <http://localhost:3300/api/health> ตอบ `{"status":"ok","db":"up"}`

- **หยุด:** `docker compose down` — ลบ container แต่ **ข้อมูลยังอยู่**
- **ลบข้อมูลทั้งหมด:** `docker compose down -v`

> **เรื่อง volume:** ข้อมูลของ PostgreSQL เก็บใน named volume ชื่อ `pgdata` ซึ่งแยกจาก container
> การลบ container (`down`) จึงไม่ทำให้ข้อมูลหาย ต้องสั่ง `-v` เพื่อลบ volume ด้วย
> ครั้งต่อไปที่ `up` ฐานข้อมูลจะว่างเปล่า แล้ว migrate + seed จะสร้างข้อมูลตัวอย่างให้ใหม่

> **เรื่อง port:** ค่าเริ่มต้นใช้ port **3300** (แอป) และ **5532** (PostgreSQL) บนเครื่อง
> เพื่อไม่ชนกับ project อื่นที่มักใช้ 3000 / 5432
> ถ้าขึ้น error `port is already allocated` ให้แก้ `APP_PORT` หรือ `DB_PORT` ใน `.env` เป็นเลขอื่น แล้ว `docker compose up` ใหม่
> (port ภายใน container ยังเป็น 3000 / 5432 เหมือนเดิม ไม่ต้องแก้ `DATABASE_URL` ที่ใช้ host `db`)

คำสั่งที่ใช้บ่อย:

```bash
docker compose ps            # ดูสถานะ (app ควรเป็น healthy)
docker compose logs -f app   # ดู log ของแอป
docker compose logs migrate  # ดูผลการ migrate + seed
```

## 4. รันแบบ dev (ไม่บังคับ)

ใช้เมื่ออยากแก้โค้ดแล้วเห็นผลทันที (hot reload) ต้องมี Node.js 22

```bash
docker compose up -d db      # เปิดเฉพาะฐานข้อมูล (port 5532 เปิดผ่าน docker-compose.override.yml)
```

แก้ `DATABASE_URL` ใน `.env` ให้ host เป็น `localhost` และ port เป็น `5532` (ค่า `DB_PORT`) แทน `db:5432`

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5532/equipment_db?schema=public
```

```bash
npm install
npm run db:deploy            # สร้างตาราง
npm run db:seed              # ใส่ข้อมูลตัวอย่าง
npm run dev                  # http://localhost:3300
```

> ⚠️ ถ้าจะกลับไปใช้ `docker compose up` ให้เปลี่ยนกลับเป็น `db:5432`
> และหยุด `npm run dev` ก่อน เพราะทั้งคู่ใช้ port 3300

## 5. นำขึ้น repo ของตัวเอง

1. สร้าง repo ใหม่บน GitHub แบบ **Public** และ **ว่างเปล่า** (ไม่ติ๊ก README, .gitignore, license)
2. เปลี่ยน remote เดิม (ของอาจารย์) เป็น `upstream` แล้วเพิ่ม repo ของตัวเองเป็น `origin`

```bash
git remote rename origin upstream
git remote add origin https://github.com/<ชื่อนิสิต>/<ชื่อ repo>.git
git push -u origin main
```

- **ดึงอัปเดตจากอาจารย์:** `git pull upstream main` แล้ว `git push`
- **หมายเหตุ:** ไม่ใช้ปุ่ม Fork เพราะ repo ที่ fork มามีข้อจำกัดเรื่อง GitHub Actions และ secrets

## 6. อธิบาย Dockerfile และ docker-compose.yml

### Dockerfile (multi-stage)

| Stage | หน้าที่ |
|---|---|
| `base` | `node:22-alpine` + OpenSSL (Prisma ต้องใช้) เป็นฐานของทุก stage |
| `deps` | copy `package*.json` + `prisma/` แล้ว `npm ci` (ใช้ layer cache: ถ้า dependency ไม่เปลี่ยน จะไม่ติดตั้งใหม่) |
| `builder` | `prisma generate` + `next build` รับ `ARG NEXT_PUBLIC_APP_VERSION` ผลลัพธ์คือ `.next/standalone` |
| `migrator` | มี Prisma CLI + `prisma/` ใช้รัน `prisma migrate deploy` และ `prisma db seed` |
| `runner` | image ที่ใช้รันจริง: copy เฉพาะ standalone + `public/` + `.next/static` รันด้วย user `node` (ไม่ใช่ root) มี `HEALTHCHECK` เรียก `/api/health` |

image `runner` ไม่มี source code และ devDependencies จึงเล็กกว่ามาก ดูขนาดได้ด้วย `docker images`

### docker-compose.yml

| Service | หน้าที่ |
|---|---|
| `db` | PostgreSQL 16 เก็บข้อมูลใน volume `pgdata` มี healthcheck `pg_isready` ไม่เปิด port ออกนอก |
| `migrate` | build จาก target `migrator` รอ `db` healthy แล้วรัน migrate + seed จากนั้นจบการทำงาน |
| `app` | build จาก target `runner` เริ่มหลัง `migrate` สำเร็จ เปิด port `${APP_PORT}` |

- ทุกค่าอ่านจาก `.env` — service ต่างๆ คุยกันด้วยชื่อ service เช่น host `db`
- `APP_IMAGE` / `MIGRATOR_IMAGE` ใช้เปลี่ยนเป็น image จาก GHCR ตอน deploy โดยไม่ต้องแก้ไฟล์ compose
- `docker-compose.override.yml` ถูกอ่านอัตโนมัติในเครื่อง dev เพื่อเปิด port `${DB_PORT}` (5532)

## 7. รันคำสั่งตรวจสอบ

```bash
npm ci
npm run lint                 # ESLint
npm run typecheck            # TypeScript (tsc --noEmit)
npm test                     # unit test — ไม่ต้องมี DB
npm run build                # build production — ไม่ต้องมี DB
```

integration test ต้องมี PostgreSQL ทำงานอยู่ (เช่น `docker compose up -d db`)

```bash
# macOS / Linux / Git Bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5532/equipment_db?schema=public" npm run test:integration
```

```powershell
# Windows PowerShell
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5532/equipment_db?schema=public"; npm run test:integration
```

> integration test จะสร้างและลบเฉพาะข้อมูลที่ `code` ขึ้นต้นด้วย `TEST-` ข้อมูล seed จึงไม่หาย
> ถ้าเป็น DB ใหม่ ให้รัน `npm run db:deploy` ก่อน

## 8. โครงสร้างโปรเจกต์

```
.
├── app/
│   ├── api/health/route.ts      # GET /api/health ตรวจการเชื่อมต่อ DB
│   ├── equipment/
│   │   ├── page.tsx             # ตารางรายการ + ค้นหา + filter
│   │   ├── new/page.tsx         # ฟอร์มเพิ่ม
│   │   ├── [id]/edit/page.tsx   # ฟอร์มแก้ไข
│   │   ├── actions.ts           # Server Actions (create / update / delete)
│   │   ├── equipment-form.tsx   # ฟอร์ม (client component)
│   │   ├── delete-button.tsx    # ปุ่มลบ + confirm
│   │   └── status-badge.tsx
│   ├── layout.tsx               # layout + footer แสดงเวอร์ชัน
│   └── page.tsx                 # redirect ไป /equipment
├── lib/
│   ├── prisma.ts                # Prisma client singleton
│   ├── validation.ts            # Zod schema
│   └── equipment.ts             # ฟังก์ชัน list / get / create / update / delete
├── prisma/
│   ├── schema.prisma
│   ├── migrations/              # migration ที่ commit ไว้
│   └── seed.ts                  # ข้อมูลตัวอย่าง 10 รายการ
├── tests/
│   ├── unit/                    # npm test
│   └── integration/             # npm run test:integration
├── .github/workflows/*.yml.todo # 📝 งานของนิสิต
├── deploy/nginx.conf            # 📝 งานของนิสิต
├── Dockerfile
├── docker-compose.yml
├── docker-compose.override.yml  # เฉพาะเครื่อง dev
└── .env.example
```

## 9. งานของนิสิต

| ไฟล์ | สิ่งที่ต้องทำ |
|---|---|
| `.github/workflows/ci.yml.todo` | CI: checkout, setup-node + cache, `npm ci`, lint, typecheck, unit test, Postgres service + migrate + integration test, ทดลอง `docker build` — เสร็จแล้ว **เปลี่ยนชื่อเป็น `ci.yml`** |
| `.github/workflows/deploy.yml.todo` | CD: build + push image ไป GHCR (tag `latest` และ `sha`, ส่ง build-arg `NEXT_PUBLIC_APP_VERSION`), SSH เข้า VPS, ตั้ง `APP_IMAGE`, `docker compose pull` แล้ว `up -d` เฉพาะ branch `main` — เสร็จแล้ว **เปลี่ยนชื่อเป็น `deploy.yml`** |
| `deploy/nginx.conf` | reverse proxy: `server_name` เป็นโดเมนจริง, `proxy_pass` ไปที่ port ของแอป แล้วทำ HTTPS ด้วย certbot |

ในแต่ละไฟล์มี checklist และคำใบ้อยู่แล้ว ไฟล์ workflow ใช้นามสกุล `.yml.todo` เพื่อไม่ให้ GitHub Actions รันไฟล์ที่ยังเขียนไม่เสร็จ

## 10. ข้อควรระวัง

- 🔒 **ห้าม commit `.env`** (มีรหัสผ่าน) — `.gitignore` กันไว้แล้ว ให้ commit เฉพาะ `.env.example`
- 🔑 **secret ทุกอย่าง** (SSH key, IP/host ของ VPS, รหัสผ่าน DB บน production) เก็บใน **GitHub Secrets** ห้ามเขียนลงไฟล์ workflow
- 🏗️ **`NEXT_PUBLIC_*` ถูกฝังตอน build** ไม่ได้อ่านตอนรัน — ถ้าเปลี่ยนค่าต้อง build image ใหม่ และต้องส่งผ่าน `--build-arg` (ใน CI ด้วย)
- 🚫 **`docker-compose.override.yml` ไม่ต้องขึ้น VPS** — ไฟล์นี้เปิด port ฐานข้อมูลออกนอกเครื่อง
- 🔐 บน VPS ให้ตั้ง `POSTGRES_PASSWORD` ใหม่ที่เดายาก (อย่าใช้ค่าจาก `.env.example`) และแก้ `DATABASE_URL` ให้ตรงกัน

## License

[MIT](LICENSE)
