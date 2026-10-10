#!/bin/sh
# สร้างไฟล์ .env สำหรับ production บน VPS (ส่วนที่ 4)
#
# วิธีใช้ (ในโฟลเดอร์ ~/app บน VPS, ในฐานะ user deploy):
#   sh make-env.sh ghcr.io/<username>/<repo>
#
# - สุ่มรหัสผ่านฐานข้อมูลใหม่ (hex 48 ตัว — ไม่มีอักขระพิเศษที่ทำให้ DATABASE_URL พัง)
# - ใส่รหัสผ่านเดียวกันทั้งใน POSTGRES_PASSWORD และ DATABASE_URL
# - bind แอปที่ 127.0.0.1 → เข้าได้ผ่าน Nginx เท่านั้น
# - ไม่เขียนทับ .env เดิม (ป้องกันรหัสผ่านไม่ตรงกับฐานข้อมูลที่สร้างไปแล้ว)
set -e

if [ -z "$1" ]; then
  echo "วิธีใช้: sh make-env.sh ghcr.io/<username>/<repo>"
  exit 1
fi

if [ -f .env ]; then
  echo "มีไฟล์ .env อยู่แล้ว — ไม่เขียนทับ (ถ้าต้องการสร้างใหม่ ให้ลบ .env ก่อน)"
  exit 1
fi

# ชื่อ image บน GHCR ต้องเป็นตัวพิมพ์เล็ก
IMAGE=$(echo "$1" | tr '[:upper:]' '[:lower:]')
PASSWORD=$(openssl rand -hex 24)

cat > .env <<EOF
POSTGRES_USER=equipment
POSTGRES_PASSWORD=$PASSWORD
POSTGRES_DB=equipment_db
DATABASE_URL=postgresql://equipment:$PASSWORD@db:5432/equipment_db?schema=public
# bind เฉพาะ 127.0.0.1 → เข้าได้ผ่าน Nginx เท่านั้น
APP_PORT=127.0.0.1:3300
APP_IMAGE=$IMAGE:latest
MIGRATOR_IMAGE=$IMAGE-migrator:latest
EOF

chmod 600 .env
echo "สร้าง .env แล้ว (image: $IMAGE)"
