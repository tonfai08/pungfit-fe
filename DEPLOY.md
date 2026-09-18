# Deploy Pungfit frontend

เมื่อสั่ง deploy ให้ build/push จาก repo frontend ไป registry นี้ ใช้ branch `dev` ตาม workflow โปรเจกต์

รอบนี้ใช้เวอร์ชัน `1.0.11` ทั้ง backend และ frontend ตามคำสั่งให้เลขตรงกัน ก่อน deploy รอบถัดไปตรวจ release ล่าสุดและเพิ่มเวอร์ชันโดยไม่เขียนทับ tag เก่า

Next.js ต้องได้รับ public config และ booking API rewrite ตอน build ใช้ค่าที่ผู้ใช้ระบุโดยตรงดังนี้ Google Client ID เป็น public identifier ไม่ใช่ client secret

```powershell
# รันใน frontend
# เปลี่ยน tag ตาม release ใหม่ในแต่ละรอบ
docker build `
    --build-arg "BK_API_ORIGIN=https://api.pungfit.life" `
    --build-arg "NEXT_PUBLIC_API_BASE_URL=https://api.pungfit.life/v1" `
    --build-arg "NEXT_PUBLIC_GOOGLE_CLIENT_ID=836356824774-6efvqqtd7p3ande4joaeou26blke762i.apps.googleusercontent.com" `
    -t ara-registry.gipsic.net/pungfit-fe:1.0.11 `
    --push .
if ($LASTEXITCODE -ne 0) { throw 'Frontend build/push failed' }
```

ต้องเปิด Docker และ login registry ไว้ ห้ามบันทึกรหัสผ่านหรือ token ลงเอกสาร

Push image ไม่ได้อัปเดต container บน server อัตโนมัติ ต้องเปลี่ยน tag ใน Portainer stack `pungfit` แล้ว pull/redeploy และตรวจ `/booking-admin/login` กับ API หากไม่มี URL/access ให้รายงานว่า push แล้วแต่ยังไม่ได้อัปเดต server

Backend ใช้คำสั่งใน repo backend ไฟล์ `DEPLOY.md` โดยรอบนี้ใช้เลขเวอร์ชันเดียวกัน
