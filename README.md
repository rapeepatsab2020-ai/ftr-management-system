# FTR Management System – Phase 1 (Data Entry + FTR Dashboard)
Next.js 14 + Tailwind + Recharts + Supabase (PostgreSQL, Auth, RLS)

## 1) Supabase
1. สร้างโปรเจกต์ที่ supabase.com
2. SQL Editor → รัน `supabase/schema.sql`
3. Authentication → สมัคร user คนแรกผ่านหน้า Login ของระบบ (คนแรก = administrator อัตโนมัติ)
4. Table Editor → เพิ่ม Master Data (production_lines, processes, customers, parts) ก่อนบันทึกข้อมูล (หน้า Master Data จะมาใน Phase ถัดไป)
5. Project Settings → API → คัดลอก URL และ anon key

## 2) Run local
cp .env.example .env.local   # ใส่ค่า Supabase
npm install && npm run dev

## 3) Deploy GitHub Pages
1. สร้าง repo → git init && git add . && git commit -m "Phase 1" && git branch -M main && git remote add origin <url> && git push -u origin main
2. Repo → Settings → Pages → Source = GitHub Actions
3. Settings → Secrets → Actions → เพิ่ม NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY
4. Push ใหม่ (หรือ Run workflow) → เว็บอยู่ที่ https://<user>.github.io/<repo>/
5. Supabase → Authentication → URL Configuration → ใส่ URL ข้างบนเป็น Site URL

## กติกา FTR
FTR% = First Time Good / Total Inspected × 100 · Inspected = FT Good + NG · Rework + Scrap ≤ NG (ตรวจทั้งใน UI และ DB constraint)
