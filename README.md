# LaundryPro Backend

Backend API untuk frontend LaundryPro dengan stack:

- Express 5
- Prisma 7
- Supabase PostgreSQL
- Arsitektur `Model / Service / Controller`
- OTP login via WhatsApp menggunakan Fonnte

## Struktur

```text
backend/
  prisma/
    schema.prisma
    seed.ts
  src/
    config/
    constants/
    lib/
    middlewares/
    modules/
    routes/
    utils/
```

## Setup

1. Install dependency

```bash
npm install
```

2. Sesuaikan `.env` atau duplikat dari `.env.example`

Gunakan connection string dari Supabase Dashboard:

- `DATABASE_URL`: Supavisor Transaction mode (`6543`) untuk runtime aplikasi, tambahkan `pgbouncer=true&connection_limit=1&sslmode=require`
- `DIRECT_URL`: Session mode/direct connection (`5432`) untuk migrate atau introspect nanti, tambahkan `sslmode=require`

3. Generate Prisma client

```bash
npm run prisma:generate
```

4. Jalankan migration

```bash
npm run prisma:migrate -- --name init
```

Kalau baru pindah dari SQLite ke Supabase, jangan jalankan migration lama dulu. Folder `prisma/migrations` tetap menyimpan SQL lama berbasis SQLite, sedangkan migration PostgreSQL aktif sekarang ada di `prisma/migrations-postgresql`.

5. Seed data demo

```bash
npm run prisma:seed
```

6. Jalankan server

```bash
npm run dev
```

## Script

- `npm run dev` menjalankan server development
- `npm run build` build TypeScript ke `dist/`
- `npm run start` menjalankan hasil build
- `npm run prisma:generate` generate Prisma client
- `npm run prisma:migrate` membuat migration baru, otomatis prefer `DIRECT_URL` kalau tersedia
- `npm run prisma:deploy` deploy migration, otomatis prefer `DIRECT_URL` kalau tersedia
- `npm run prisma:studio` buka Prisma Studio, otomatis prefer `DIRECT_URL` kalau tersedia
- `npm run prisma:seed` isi data demo, otomatis prefer `DIRECT_URL` kalau tersedia

## Endpoint Inti

- `POST /api/auth/request-otp`
- `POST /api/auth/verify-otp`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/dashboard`
- `GET /api/orders`
- `POST /api/orders`
- `PATCH /api/orders/:id`
- `PATCH /api/orders/:id/status`
- `POST /api/orders/:id/send-whatsapp`
- `GET /api/customers`
- `GET /api/branches`
- `GET /api/services`
- `GET /api/reports/financial`
- `GET /api/reports/analytics`

## Fonnte

Isi `FONNTE_TOKEN` di `.env` untuk kirim WhatsApp sungguhan.

Webhook status pesan:

```text
POST /api/webhooks/fonnte/status?secret=YOUR_SECRET
```

Kalau token belum diisi, mode development tetap bisa dipakai dengan `OTP_DEBUG_PREVIEW=true` untuk melihat OTP preview.

## Catatan Supabase

- Perubahan ini baru menyiapkan konfigurasi Prisma agar pakai Supabase PostgreSQL.
- Migration data/schema ke Supabase belum dijalankan di repo ini.
- Kalau dapat error `P1001`, cek lagi apakah URL Supabase sudah pakai host pooler yang benar, port yang sesuai (`6543` atau `5432`), dan `sslmode=require`.

Script Prisma di repo ini akan memakai `DIRECT_URL` untuk command database kalau variable itu ada, supaya runtime app tetap bisa memakai `DATABASE_URL`.
