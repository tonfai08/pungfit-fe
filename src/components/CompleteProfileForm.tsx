"use client";

import { updateUser } from "@/lib/api/auth";
import { useState, useEffect } from "react";

interface ProfileData {
  weight?: number | string;
  height?: number | string;
  bodyFat?: number | string;
  gender?: string;
  age?: number | string;
  activity_level?: string;
}

export default function CompleteProfileForm({
  weight,
  height,
  bodyFat,
  gender,
  age,
  activity_level,
}: ProfileData) {
  const [form, setForm] = useState({
    weight_kg: "",
    height_cm: "",
    body_fat_percent: "",
    gender: "",
    age: "",
    activity_level: "", 
  });

  useEffect(() => {
    setForm({
      weight_kg: weight ? String(weight) : "",
      height_cm: height ? String(height) : "",
      body_fat_percent: bodyFat ? String(bodyFat) : "",
      gender: gender ? String(gender) : "",
      age: age ? String(age) : "",
      activity_level: "",
    });
  }, [weight, height, bodyFat, gender, age]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token");

      await updateUser(form)


      alert("บันทึกข้อมูลเรียบร้อยแล้ว!");
      window.location.reload();
    } catch (err) {
      console.error("❌ Update failed:", err);
      setError("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full max-w-full md:max-w-1/2 text-text-primary flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="p-8 bg-white rounded-2xl shadow-md w-full max-w-sm"
      >
        <h2 className="text-2xl font-semibold mb-6 text-center">
          กรอกข้อมูลสุขภาพ
        </h2>

        {error && (
          <p className="text-red-500 text-sm mb-3 text-center">{error}</p>
        )}

        {/* 🔹 น้ำหนัก */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">น้ำหนัก (กก.)</label>
          <input
            type="number"
            min="30"
            max="200"
            value={form.weight_kg}
            onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
            className="border border-accent focus:border-accent-hover focus:ring-1 focus:ring-accent-hover rounded-md w-full px-3 py-2 outline-none"
            placeholder="เช่น 70"
            required
          />
        </div>

        {/* 🔹 ส่วนสูง */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">ส่วนสูง (ซม.)</label>
          <input
            type="number"
            min="130"
            max="220"
            value={form.height_cm}
            onChange={(e) => setForm({ ...form, height_cm: e.target.value })}
            className="border border-accent focus:border-accent-hover focus:ring-1 focus:ring-accent-hover rounded-md w-full px-3 py-2 outline-none"
            placeholder="เช่น 170"
            required
          />
        </div>

        {/* 🔹 เปอร์เซ็นต์ไขมัน */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">เปอร์เซ็นต์ไขมัน (%)</label>
          <input
            type="number"
            min="1"
            max="60"
            value={form.body_fat_percent}
            onChange={(e) =>
              setForm({ ...form, body_fat_percent: e.target.value })
            }
            className="border border-accent focus:border-accent-hover focus:ring-1 focus:ring-accent-hover rounded-md w-full px-3 py-2 outline-none"
            placeholder="เช่น 20"
          />
        </div>

        {/* 🔹 อายุ */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">อายุ (ปี)</label>
          <input
            type="number"
            min="10"
            max="120"
            value={form.age}
            onChange={(e) => setForm({ ...form, age: e.target.value })}
            className="border border-accent focus:border-accent-hover focus:ring-1 focus:ring-accent-hover rounded-md w-full px-3 py-2 outline-none"
            placeholder="เช่น 35"
            required
          />
        </div>

        {/* 🔹 เพศ */}
        <div className="mb-6">
          <label className="block mb-1 font-medium">เพศ</label>
          <select
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
            className="border border-accent focus:border-accent-hover focus:ring-1 focus:ring-accent-hover rounded-md w-full px-3 py-2 outline-none bg-white"
            required
          >
            <option value="" disabled>เลือกเพศ</option>
            <option value="male">ชาย</option>
            <option value="female">หญิง</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block mb-1 font-medium">ระดับกิจกรรม</label>
          <select
            value={form.activity_level || ""}
            onChange={(e) => setForm({ ...form, activity_level: e.target.value })}
            className="border border-accent focus:border-accent-hover focus:ring-1 focus:ring-accent-hover rounded-md w-full px-3 py-2 outline-none bg-white"
            required
          >
            <option value="" disabled>เลือกระดับกิจกรรม</option>
            <option value="sedentary">นั่งทำงาน / ไม่ออกกำลังกาย</option>
            <option value="light">ออกกำลังกายเล็กน้อย (1–3 วัน/สัปดาห์)</option>
            <option value="moderate">ออกกำลังกายปานกลาง (3–5 วัน/สัปดาห์)</option>
            <option value="active">ออกกำลังกายหนัก (6–7 วัน/สัปดาห์)</option>
            <option value="very_active">ออกกำลังกายหนักมาก / ใช้แรงงาน</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent hover:bg-accent-hover text-white py-2 rounded-md"
        >
          {loading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
        </button>
      </form>
    </div>
  );
}
