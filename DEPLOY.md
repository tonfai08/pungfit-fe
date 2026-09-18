# Deploy Pungfit frontend

เมื่อสั่ง deploy ให้ build/push จาก repo frontend ไป registry นี้ ใช้ branch `dev` ตาม workflow โปรเจกต์

เวอร์ชันเดิมในภาพคือ `1.0.4` รอบนี้ใช้ `1.0.5` รอบถัดไปตรวจ release ล่าสุดและเพิ่ม patch version ไม่ใช้ตัวอย่างเก่า `1.0.2` และไม่เขียนทับ release เก่าโดยไม่ตั้งใจ

Next.js ต้องได้รับ public config และ booking API rewrite ตอน build อ่านเฉพาะ public config จาก `.env.local` ดังนี้

```powershell
# รันใน frontend
$bkPublicConfig = @{}
Get-Content '.env.local' | ForEach-Object {
    if ($_ -match '^(NEXT_PUBLIC_API_BASE_URL|NEXT_PUBLIC_GOOGLE_CLIENT_ID)=(.*)$') {
        $bkPublicConfig[$matches[1]] = $matches[2].Trim().Trim('"').Trim("'")
    }
}
if (!$bkPublicConfig['NEXT_PUBLIC_API_BASE_URL'] -or !$bkPublicConfig['NEXT_PUBLIC_GOOGLE_CLIENT_ID']) {
    throw 'Missing frontend public build configuration in .env.local'
}
# เปลี่ยน tag ตาม release ใหม่ในแต่ละรอบ
docker build `
    --build-arg 'BK_API_ORIGIN=https://api.pungfit.life' `
    --build-arg "NEXT_PUBLIC_API_BASE_URL=$($bkPublicConfig['NEXT_PUBLIC_API_BASE_URL'])" `
    --build-arg "NEXT_PUBLIC_GOOGLE_CLIENT_ID=$($bkPublicConfig['NEXT_PUBLIC_GOOGLE_CLIENT_ID'])" `
    -t ara-registry.gipsic.net/pungfit-fe:1.0.5 --push .
if ($LASTEXITCODE -ne 0) { throw 'Frontend build/push failed' }
```

ต้องเปิด Docker และ login registry ไว้ ห้ามบันทึกรหัสผ่านหรือ token ลงเอกสาร

Push image ไม่ได้อัปเดต container บน server อัตโนมัติ ต้องเปลี่ยน tag ใน Portainer stack `pungfit` แล้ว pull/redeploy และตรวจ `/booking-admin/login` กับ API หากไม่มี URL/access ให้รายงานว่า push แล้วแต่ยังไม่ได้อัปเดต server

Backend ใช้คำสั่งใน repo backend ไฟล์ `DEPLOY.md` และเพิ่มเวอร์ชันแยกกัน
