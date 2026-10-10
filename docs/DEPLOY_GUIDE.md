# DEPLOY_GUIDE — เพิ่ม Docker + CI/CD ให้โปรเจกต์ของตัวเองด้วย AI (Claude Code / Codex)

> คู่มือนี้เขียนให้ **ทั้งนิสิตและ AI coding agent** อ่าน
> ใช้ **หลังจากทำ Lab Docker + CI/CD ส่วนที่ 1–6 เสร็จแล้ว** (มี VPS, user `deploy`, `docker login ghcr.io`, Nginx และโดเมนพร้อม)

---

## สำหรับนิสิต: วิธีใช้

1. ดาวน์โหลดไฟล์นี้ไปไว้ที่ root ของโปรเจกต์ตัวเอง

   ```bash
   curl -fsSL -o DEPLOY_GUIDE.md https://raw.githubusercontent.com/suriyapi/nextjs-crud-starter/main/docs/DEPLOY_GUIDE.md
   ```

2. เปิด Claude Code หรือ Codex ในโฟลเดอร์โปรเจกต์ แล้วสั่ง

   ```text
   อ่าน DEPLOY_GUIDE.md แล้วทำขั้นตอน A ถึง H กับโปรเจกต์นี้
   ทำตาม "กฎสำหรับ AI" อย่างเคร่งครัด ถามฉันก่อนถ้าข้อมูลไม่พอ
   และอธิบายทุกไฟล์ที่สร้างหรือแก้เป็นภาษาไทย
   ```

3. ตอบคำถามที่ AI ถาม (ขั้น A) ตรวจไฟล์ที่ AI สร้าง แล้วทำ **ขั้นที่นิสิตต้องทำเอง** (หัวข้อ 7) ด้วยตัวเอง
4. ถ้า AI ทำอะไรขัดกับกฎ (เช่น ขอ token หรือเปิดไฟล์ `.env`) ให้หยุดและปฏิเสธ

---

## 1. กฎสำหรับ AI (ต้องทำตามเคร่งครัด)

1. **แก้ได้เฉพาะไฟล์ใน repo นี้** — ห้าม SSH, ห้ามรันคำสั่งบน VPS, ห้ามแก้ GitHub settings, ห้าม `git push` (ให้แสดงคำสั่งให้นิสิตรันเอง)
2. **ห้ามแตะความลับ** — ห้ามเปิด อ่าน แสดง หรือ commit ไฟล์ `.env` / `.env.*` (ยกเว้น `.env.example`), ห้ามขอหรือรับ token / private key / รหัสผ่านจากนิสิต, ห้ามใส่ค่าความลับลงในไฟล์ใดๆ — ค่าความลับทั้งหมดอยู่ใน GitHub Secrets หรือ `.env` บน VPS ที่นิสิตตั้งเอง
3. **ห้ามทำให้ข้อมูลหาย** — ห้าม `docker compose down -v`, ห้ามลบ volume, ห้ามลบหรือแก้ migration ที่มีอยู่แล้ว
4. **แก้ business logic ให้น้อยที่สุด** — แก้เฉพาะสิ่งที่จำเป็นต่อการ deploy (health endpoint, การอ่าน config จาก env, การฟัง `0.0.0.0`, การ build โดยไม่ต้องต่อ DB)
5. **ถามก่อนตัดสินใจเรื่องใหญ่** — เช่น เปลี่ยนโครงสร้างโปรเจกต์, รวม frontend/backend, เปลี่ยนฐานข้อมูล
6. **รันคำสั่งในเครื่องได้** (`npm`, `pip`, `docker build`, `docker compose up/ps/logs/down` แบบไม่มี `-v`) เพื่อทดสอบ
7. **แม่แบบเป็นตัวอย่าง ไม่ใช่ข้อบังคับ** — ปรับตามสภาพแวดล้อมจริงของนิสิต แต่คงหลักการไว้ (image Private, tag `sha`, health check, bind `127.0.0.1`, ไม่มีความลับในไฟล์) และใช้เวอร์ชัน action ตามแม่แบบ ไม่เดาเวอร์ชันเอง
8. **จบงานด้วยสรุปเป็นภาษาไทย** — รายการไฟล์ที่สร้าง/แก้ + อธิบายแต่ละไฟล์ + ผลการทดสอบ + รายการขั้นตอนที่นิสิตต้องทำเอง (หัวข้อ 7) โดยแทนค่าจริงของโปรเจกต์ให้เรียบร้อย

---

## 2. สถาปัตยกรรมเป้าหมาย (เหมือนใน Lab)

```text
git push (main)
  └─▶ CI (GitHub Actions): lint / test / docker build
        └─pass─▶ Deploy
                  ├─ build-push : build image → ghcr.io/<user>/<repo>[:latest|:sha-xxxxxxx]  (Private)
                  └─ deploy     : scp docker-compose.yml → VPS ~/<APP_DIR>/
                                  ssh: docker compose pull && up -d
                                  curl https://<domain>/<health path>
VPS: Nginx (HTTPS, certbot) ──proxy──▶ 127.0.0.1:<APP_PORT> ──▶ container app ──▶ db (volume)
```

---

## 3. ขั้นตอนสำหรับ AI

### ขั้น A — วิเคราะห์สภาพแวดล้อมและถามข้อมูล

**แม่แบบทั้งหมดในคู่มือนี้เป็นตัวอย่างอ้างอิง** — AI ต้องวิเคราะห์สภาพแวดล้อมจริงของนิสิตแล้วปรับให้เหมาะ ไม่ต้องลอกตาม:

- **เครื่องของนิสิต**: OS และ shell ที่ใช้ (Windows PowerShell / CMD / Git Bash / macOS / Linux) → เขียนคำสั่งในขั้นที่นิสิตต้องทำเองให้ตรงกับ shell นั้น
- **โปรเจกต์**: stack, เวอร์ชันภาษา/framework, package manager (npm/pnpm/yarn/pip/poetry), โครงสร้าง (monorepo, frontend+backend แยก), ไฟล์ Docker/CI ที่มีอยู่แล้ว (ถ้ามีให้ปรับต่อ ไม่สร้างทับ)
- **ฐานข้อมูลและการ migrate** ที่โปรเจกต์ใช้จริง (ORM, migration tool, seed)
- **VPS ที่นิสิตมี**: แอปอื่นที่รันอยู่ (port/โฟลเดอร์/โดเมนที่ใช้แล้ว) — ถามนิสิต ไม่ต้องเข้า VPS เอง

จากนั้นสำรวจไฟล์ (`package.json`, `requirements.txt`, `pyproject.toml`, `go.mod` ฯลฯ) แล้ว **สรุปให้นิสิตยืนยัน** พร้อมถามข้อมูลที่ยังไม่รู้:

| ข้อมูล | ตัวอย่าง | หมายเหตุ |
|---|---|---|
| GitHub username / ชื่อ repo | `somchai` / `todo-app` | ใช้ตั้งชื่อ image `ghcr.io/somchai/todo-app` (ตัวพิมพ์เล็ก) |
| stack และ port ที่แอปฟังภายใน container | Express, port 4000 | |
| ฐานข้อมูล | PostgreSQL / MySQL / MongoDB / ไม่มี | |
| คำสั่ง migrate / seed (ถ้ามี) | `npx prisma migrate deploy`, `npm run migrate` | ถ้าไม่มี migration ให้ข้าม stage `migrator` |
| ตัวแปรที่ต้องฝังตอน build (frontend) | `VITE_API_URL`, `NEXT_PUBLIC_*` | ต้องส่งเป็น build-arg |
| คำสั่ง test / lint ที่มีอยู่ | `npm test`, `pytest` | ถ้าไม่มี ให้ CI ทำเท่าที่มี |
| โดเมนที่จะใช้ | `todo.ictkudev888.tech` | ถ้า VPS มีแอป Lab อยู่แล้ว ใช้ **subdomain** |
| `APP_PORT` บน VPS | `127.0.0.1:3301` | **ห้ามซ้ำ** กับแอปอื่นบน VPS (Lab ใช้ 3300) |
| โฟลเดอร์บน VPS (`APP_DIR`) | `todo-app` | **ห้ามซ้ำ** กับแอปอื่น (Lab ใช้ `app`) |

### ขั้น B — เตรียมโค้ดให้พร้อม deploy

- **Health endpoint**: `GET /api/health` (หรือ path ที่เหมาะกับโปรเจกต์) ตอบ `200 {"status":"ok","db":"up"}` เมื่อพร้อม และ `503` เมื่อต่อฐานข้อมูลไม่ได้ (ทดสอบ DB ด้วย query เบาๆ เช่น `SELECT 1`)
- **แอปต้องไม่ล่มเมื่อ DB หลุด** — ต้องตอบ 503 ได้ (ทดสอบแล้ว: Node.js + `pg` ถ้าไม่ใส่ `pool.on("error", ...)` process จะ crash ทันทีที่ DB หยุด) ให้ตั้ง connection timeout สั้นๆ ด้วย เช่น `new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 3000 })`
- **ฟังที่ `0.0.0.0`** ภายใน container และอ่าน port จาก env (`PORT`)
- **config จาก env** — connection string อ่านจาก `DATABASE_URL` (หรือชื่อเดิมที่โปรเจกต์ใช้) ห้าม hard-code
- **build ต้องไม่ต้องต่อ DB** — ถ้า framework พยายามต่อ DB ตอน build (เช่นหน้า static ที่ query DB) ให้ทำเป็น dynamic
- **`.env.example`** มีครบทุกตัวแปรด้วยค่าตัวอย่าง (ไม่ใช่ค่าจริง), **`.gitignore`** มี `.env`, `.env*.local`, `node_modules`
- **ตัวแปรของ frontend ที่ฝังตอน build** (`VITE_*`, `NEXT_PUBLIC_*`, `REACT_APP_*`) ต้องรับเป็น `ARG` ใน Dockerfile

### ขั้น C — Dockerfile และ .dockerignore

ข้อกำหนด:

- multi-stage; stage สุดท้ายชื่อ **`runner`** — มีเฉพาะไฟล์ที่จำเป็นต่อการรัน, **รันด้วย user ที่ไม่ใช่ root**, `EXPOSE <port>`, `HEALTHCHECK` เรียก health endpoint ด้วยเครื่องมือที่มีใน image (alpine มี `wget`; ถ้าไม่มีให้ใช้ `node -e`/`python -c`)
- ถ้ามี migration: stage **`migrator`** ที่มีเครื่องมือ migrate + ไฟล์ migration และ `CMD` รัน migrate (+ seed ที่รันซ้ำได้) แล้วจบ
- `.dockerignore` ต้องมี `.env*` (ยกเว้น `!.env.example`), `node_modules`, `.git`, `.github`, ไฟล์ build ในเครื่อง

ตัวอย่างโครง (Node.js) — ปรับตาม stack จริง:

```dockerfile
# syntax=docker/dockerfile:1
FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG VITE_API_URL=""            # ตัวอย่างตัวแปรที่ฝังตอน build (ลบถ้าไม่ใช้)
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build --if-present && npm prune --omit=dev   # ตัด devDependencies ออก

FROM base AS migrator          # เฉพาะเมื่อมี migration
COPY --from=deps /app/node_modules ./node_modules
COPY . .
CMD ["sh", "-c", "npm run migrate && npm run seed --if-present"]

FROM base AS runner
ENV NODE_ENV=production PORT=3000 HOST=0.0.0.0
COPY --from=builder --chown=node:node /app ./
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "server.js"]
```

ตัวอย่างโครง (Python):

```dockerfile
FROM python:3.12-slim AS runner
WORKDIR /app
ENV PYTHONUNBUFFERED=1 PORT=8000
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN useradd -m appuser && chown -R appuser /app
USER appuser
EXPOSE 8000
HEALTHCHECK --interval=15s --timeout=10s --start-period=20s --retries=3 \
  CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/api/health').status==200 else 1)"
CMD ["gunicorn", "-b", "0.0.0.0:8000", "app:app"]
```

### ขั้น D — docker-compose.yml และ docker-compose.override.yml

`docker-compose.yml` ต้องใช้ได้ทั้งในเครื่องและบน VPS (ปรับชื่อ image, port ภายใน, ตัวแปร DB ตาม stack):

```yaml
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:?set POSTGRES_USER in .env}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?set POSTGRES_PASSWORD in .env}
      POSTGRES_DB: ${POSTGRES_DB:?set POSTGRES_DB in .env}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 10
    # ไม่เปิด port ออกนอก

  migrate:                       # ลบ service นี้ถ้าไม่มี migration
    build:
      context: .
      target: migrator
    image: ${MIGRATOR_IMAGE:-myapp-migrator:local}
    environment:
      DATABASE_URL: ${DATABASE_URL:?set DATABASE_URL in .env}
    depends_on:
      db:
        condition: service_healthy
    restart: "no"

  app:
    build:
      context: .
      target: runner
    image: ${APP_IMAGE:-myapp:local}
    restart: unless-stopped
    environment:
      DATABASE_URL: ${DATABASE_URL:?set DATABASE_URL in .env}
    depends_on:
      migrate:
        condition: service_completed_successfully   # ถ้าไม่มี migrate: db: condition: service_healthy
    ports:
      - "${APP_PORT:-3000}:3000"                    # ขวา = port ภายใน container

volumes:
  pgdata:
```

`docker-compose.override.yml` (เฉพาะเครื่อง dev — เปิด port DB ให้รัน dev/test จากเครื่อง):

```yaml
services:
  db:
    ports:
      - "${DB_PORT:-5432}:5432"
```

### ขั้น E — ทดสอบในเครื่อง (AI รันได้)

```bash
cp .env.example .env            # ถ้ายังไม่มี .env (ห้ามเปิดดูเนื้อหา .env ที่นิสิตมีอยู่แล้ว)
docker compose up --build -d
docker compose ps -a            # app/db healthy, migrate Exited (0)
curl http://localhost:<APP_PORT>/api/health
docker compose down             # ห้ามใส่ -v
```

ต้องผ่านก่อนไปขั้น F — ถ้าไม่ผ่าน ดู `docker compose logs app migrate` แล้วแก้

### ขั้น F — GitHub Actions

สร้าง `.github/workflows/ci.yml` — **ปรับเฉพาะส่วนติดตั้ง/ตรวจโค้ด** ให้ตรง stack ส่วนชื่อ `name: CI` ห้ามเปลี่ยน (deploy.yml อ้างชื่อนี้):

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    # ถ้ามี test ที่ต้องใช้ DB ให้เพิ่ม services: postgres (ดูตัวอย่างใน Lab ci.yml)
    steps:
      - uses: actions/checkout@v7

      # ---- Node.js ----
      - uses: actions/setup-node@v7
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint --if-present
      - run: npm test --if-present

      # ---- Python (ใช้แทนส่วน Node.js) ----
      # - uses: actions/setup-python@v7
      #   with:
      #     python-version: "3.12"
      #     cache: pip
      # - run: pip install -r requirements.txt
      # - run: pytest

  docker-build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v7
      - run: docker build --target runner -t app:ci .
      - run: docker build --target migrator -t migrator:ci .   # ลบบรรทัดนี้ถ้าไม่มี migrator
```

สร้าง `.github/workflows/deploy.yml` — โครงตามนี้ ปรับจุดที่มีคอมเมนต์ `# ปรับ:` และส่วนอื่นที่จำเป็นต่อโปรเจกต์ (เช่น image หลายตัว)

```yaml
name: Deploy

on:
  workflow_run:
    workflows: [CI]
    types: [completed]
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  packages: write

jobs:
  build-push:
    if: github.event_name == 'workflow_dispatch' || github.event.workflow_run.conclusion == 'success'
    runs-on: ubuntu-latest
    outputs:
      image: ${{ steps.vars.outputs.image }}
      tag: ${{ steps.vars.outputs.tag }}
    steps:
      - uses: actions/checkout@v7
        with:
          ref: ${{ github.event.workflow_run.head_sha || github.sha }}

      - name: Set image name and tag
        id: vars
        run: |
          SHA="${{ github.event.workflow_run.head_sha || github.sha }}"
          echo "image=ghcr.io/${GITHUB_REPOSITORY,,}" >> "$GITHUB_OUTPUT"
          echo "tag=sha-${SHA::7}" >> "$GITHUB_OUTPUT"

      - uses: docker/login-action@v4
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - uses: docker/setup-buildx-action@v4

      - name: Build and push app image
        uses: docker/build-push-action@v7
        with:
          context: .
          target: runner
          push: true
          # ปรับ: build-args ของตัวแปรที่ฝังตอน build (ลบถ้าไม่มี)
          # build-args: VITE_API_URL=https://todo.example.com
          tags: |
            ${{ steps.vars.outputs.image }}:latest
            ${{ steps.vars.outputs.image }}:${{ steps.vars.outputs.tag }}
          cache-from: type=gha,scope=runner
          cache-to: type=gha,mode=max,scope=runner

      # ปรับ: ลบ step นี้ถ้าไม่มี migrator
      - name: Build and push migrator image
        uses: docker/build-push-action@v7
        with:
          context: .
          target: migrator
          push: true
          tags: |
            ${{ steps.vars.outputs.image }}-migrator:latest
            ${{ steps.vars.outputs.image }}-migrator:${{ steps.vars.outputs.tag }}
          cache-from: type=gha,scope=migrator
          cache-to: type=gha,mode=max,scope=migrator

  deploy:
    needs: build-push
    if: vars.APP_URL != ''
    runs-on: ubuntu-latest
    concurrency: production
    steps:
      - uses: actions/checkout@v7

      - name: Copy docker-compose.yml to VPS
        uses: appleboy/scp-action@v1.0.0
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          source: docker-compose.yml
          target: todo-app                 # ปรับ: = APP_DIR (โฟลเดอร์บน VPS)

      - name: Pull and restart on VPS
        uses: appleboy/ssh-action@v1.2.5
        env:
          APP_IMAGE: ${{ needs.build-push.outputs.image }}:${{ needs.build-push.outputs.tag }}
          MIGRATOR_IMAGE: ${{ needs.build-push.outputs.image }}-migrator:${{ needs.build-push.outputs.tag }}
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          envs: APP_IMAGE,MIGRATOR_IMAGE
          script: |
            set -e
            cd ~/todo-app                  # ปรับ: = APP_DIR
            docker compose pull
            docker compose up -d
            docker image prune -f

      - name: Health check
        run: |
          for i in $(seq 1 20); do
            if curl -fsS "${{ vars.APP_URL }}/api/health"; then exit 0; fi   # ปรับ: path ของ health
            echo "waiting... ($i)"; sleep 5
          done
          exit 1
```

### ขั้น G — ไฟล์สำหรับ VPS

`deploy/make-env.sh` — สร้าง `.env` บน VPS พร้อมสุ่มรหัสผ่าน (ปรับชื่อตัวแปร/ฐานข้อมูลตาม stack):

```sh
#!/bin/sh
# วิธีใช้ (บน VPS ในโฟลเดอร์ ~/<APP_DIR>):  sh make-env.sh ghcr.io/<user>/<repo> 127.0.0.1:3301
set -e
[ -z "$1" ] || [ -z "$2" ] && { echo "วิธีใช้: sh make-env.sh ghcr.io/<user>/<repo> 127.0.0.1:<port>"; exit 1; }
[ -f .env ] && { echo "มี .env อยู่แล้ว — ไม่เขียนทับ"; exit 1; }
IMAGE=$(echo "$1" | tr '[:upper:]' '[:lower:]')
PASSWORD=$(openssl rand -hex 24)
cat > .env <<EOF
POSTGRES_USER=app
POSTGRES_PASSWORD=$PASSWORD
POSTGRES_DB=app_db
DATABASE_URL=postgresql://app:$PASSWORD@db:5432/app_db
APP_PORT=$2
APP_IMAGE=$IMAGE:latest
MIGRATOR_IMAGE=$IMAGE-migrator:latest
EOF
chmod 600 .env
echo "สร้าง .env แล้ว (image: $IMAGE, port: $2)"
```

`deploy/nginx.conf` — แทน `example.com` และ port ให้ตรงกับ `APP_PORT`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name example.com;

    location / {
        proxy_pass http://127.0.0.1:3301;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### ขั้น H — สรุปให้นิสิต

สรุปเป็นภาษาไทย: ไฟล์ที่สร้าง/แก้ + เหตุผล + ผลทดสอบขั้น E + **รายการในหัวข้อ 7 ที่แทนค่าจริงแล้ว** (ชื่อ repo, APP_DIR, APP_PORT, โดเมน, path ของ health)

---

## 4. ปัญหาที่พบบ่อย (สำหรับ AI และนิสิต)

| อาการ | สาเหตุ / วิธีแก้ |
|---|---|
| `app` unhealthy | แอปไม่ฟัง `0.0.0.0`, port ใน `HEALTHCHECK` ไม่ตรง, หรือ image ไม่มี `wget` |
| หยุด db แล้วแอป crash / health ไม่ตอบ 503 | ไม่ได้จัดการ error ของ connection pool — Node.js + `pg`: เพิ่ม `pool.on("error", ...)` และ `connectionTimeoutMillis` |
| build ใน Docker ต้องต่อ DB | หน้า/โค้ดที่ query DB ตอน build — ทำให้เป็น runtime |
| frontend เรียก API ผิด URL บนเว็บจริง | ตัวแปรที่ฝังตอน build ไม่ได้ส่งเป็น build-arg ใน deploy.yml |
| `migrate` Exited (1) | คำสั่ง migrate ผิด หรือ `DATABASE_URL` ไม่ตรง — ดู `docker compose logs migrate` |
| Deploy ไม่รันหลัง CI | `name:` ใน ci.yml ไม่ใช่ `CI` |
| `deploy` เป็น skipped | ยังไม่ได้ตั้ง Variable `APP_URL` (ต้องเป็น Variable ไม่ใช่ Secret) |
| `cd: ~/<APP_DIR>: No such file` | ยังไม่ได้สร้างโฟลเดอร์บน VPS หรือ `target`/`cd` ใน deploy.yml ไม่ตรงกัน |
| `port is already allocated` บน VPS | `APP_PORT` ซ้ำกับแอปอื่น — เปลี่ยนใน `.env` บน VPS และ `proxy_pass` ใน Nginx |
| `unauthorized` ตอน pull | token `read:packages` บน VPS หมดอายุ — `docker login ghcr.io` ใหม่ |

---

## 5. สิ่งที่ AI ต้องไม่ทำ (ทวนซ้ำ)

- ❌ เปิด/แสดง/commit `.env` หรือค่าความลับใดๆ
- ❌ ขอ token, private key, รหัสผ่าน จากนิสิต
- ❌ SSH หรือรันคำสั่งบน VPS, `git push`, แก้ GitHub settings
- ❌ `docker compose down -v` หรือลบ volume / migration

---

## 6. เช็กลิสต์ก่อนส่งงานให้นิสิต (AI ตรวจเอง)

- [ ] `docker compose up --build -d` ผ่าน — app/db healthy (migrate Exited 0 ถ้ามี)
- [ ] health endpoint ตอบ 200 และตอบ 503 เมื่อ `docker compose stop db` (แล้ว `docker compose start db` กลับ)
- [ ] `.env` ไม่อยู่ใน git (`git check-ignore .env` ต้องแสดง `.env`)
- [ ] `.dockerignore` มี `.env*`
- [ ] `ci.yml` ชื่อ `CI`, `deploy.yml` ใช้ action เวอร์ชันตามคู่มือ
- [ ] `target` และ `cd` ใน deploy.yml = APP_DIR, health path ถูกต้อง
- [ ] `deploy/nginx.conf` ใช้ port เดียวกับ APP_PORT

---

## 7. ขั้นที่นิสิตต้องทำเอง (AI ห้ามทำ)

แทน `<...>` ด้วยค่าจริง (AI จะสรุปค่าให้ในขั้น H)

1. **commit และ push** ขึ้น repo ของตัวเอง → ดูแท็บ Actions: CI ✓, Deploy: build-push ✓, deploy skipped
2. **DNS**: เพิ่ม `A` record ชื่อ `<subdomain>` (เช่น `todo`) → IP ของ VPS
3. **บน VPS (user deploy)**:
   ```bash
   mkdir -p ~/<APP_DIR>
   ```
   **บนเครื่องตัวเอง** (ในโฟลเดอร์โปรเจกต์):
   ```bash
   scp docker-compose.yml deploy/make-env.sh deploy/nginx.conf deploy@<IP>:<APP_DIR>/
   ```
   **บน VPS (user deploy)**:
   ```bash
   cd ~/<APP_DIR>
   sh make-env.sh ghcr.io/<user>/<repo> 127.0.0.1:<port>
   docker compose pull && docker compose up -d && docker compose ps -a
   ```
   (ถ้า `unauthorized` ให้ `docker login ghcr.io -u <user>` ด้วย token `read:packages`)
4. **บน VPS (root)** — Nginx + HTTPS สำหรับโดเมนใหม่ (ไม่กระทบแอป Lab):
   ```bash
   sed 's/example\.com/<domain>/g' /home/deploy/<APP_DIR>/nginx.conf > /etc/nginx/sites-available/<APP_DIR>
   ln -s /etc/nginx/sites-available/<APP_DIR> /etc/nginx/sites-enabled/
   nginx -t && systemctl reload nginx
   certbot --nginx -d <domain> --redirect
   ```
5. **GitHub → Settings → Secrets and variables → Actions** ของ repo นี้:
   Secrets `VPS_HOST`, `VPS_USER` (= `deploy`), `VPS_SSH_KEY` (ใช้ key `gha_deploy` จาก Lab ได้) และ Variable `APP_URL` = `https://<domain>`
6. **Actions → Deploy → Run workflow** → deploy ✓ → เปิด `https://<domain>`
