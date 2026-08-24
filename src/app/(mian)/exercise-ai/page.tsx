"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { message } from "antd";
import { FaArrowLeft, FaMagic } from "react-icons/fa";
import { DayKey, generateAIWorkoutPlan, saveWorkoutPlan, WorkoutPlan } from "@/lib/api/workout";

const days: { key: DayKey; label: string }[] = [
  { key: "mon", label: "จันทร์" }, { key: "tue", label: "อังคาร" },
  { key: "wed", label: "พุธ" }, { key: "thu", label: "พฤหัสบดี" },
  { key: "fri", label: "ศุกร์" }, { key: "sat", label: "เสาร์" }, { key: "sun", label: "อาทิตย์" },
];

export default function ExerciseAIPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [plan, setPlan] = useState<Omit<WorkoutPlan, "_id"> | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const generate = async () => {
    if (prompt.trim().length < 10) return message.warning("บอกเป้าหมายให้ละเอียดอีกนิด");
    try { setLoading(true); setPlan(await generateAIWorkoutPlan(prompt)); }
    catch (error) { message.error(error instanceof Error ? error.message : "สร้างตารางไม่สำเร็จ"); }
    finally { setLoading(false); }
  };
  const save = async () => {
    if (!plan) return;
    try { setSaving(true); await saveWorkoutPlan(plan); message.success("บันทึกตารางแล้ว"); router.push("/exercise"); }
    catch (error) { message.error(error instanceof Error ? error.message : "บันทึกไม่สำเร็จ"); }
    finally { setSaving(false); }
  };

  return <div className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow">
    <button onClick={() => router.back()} className="mb-4 flex items-center gap-2 text-sm text-gray-500"><FaArrowLeft /> กลับ</button>
    <h1 className="text-2xl font-semibold text-accent">สร้างตารางด้วย AI</h1>
    <p className="mt-1 text-sm text-gray-500">บอกเป้าหมาย จำนวนวัน อุปกรณ์ ประสบการณ์ และข้อจำกัดของคุณ</p>
    <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={6} maxLength={2000}
      placeholder="เช่น อยากลดไขมันและเพิ่มกล้าม ออกได้ 4 วันต่อสัปดาห์ ครั้งละ 45 นาที มีดัมเบล เคยเจ็บเข่าซ้าย"
      className="mt-4 w-full resize-none rounded-xl border border-gray-300 p-3 outline-none focus:border-accent" />
    <button onClick={generate} disabled={loading} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 font-medium text-white disabled:opacity-60">
      <FaMagic /> {loading ? "AI กำลังจัดตาราง..." : "ให้ AI จัดตาราง"}
    </button>
    {plan ? <div className="mt-6 space-y-3">
      <h2 className="font-semibold">ตรวจตารางก่อนบันทึก</h2>
      {days.map(({ key, label }) => <section key={key} className="rounded-xl border p-3">
        <div className="font-medium text-accent">{label}</div>
        {plan.days[key]?.length ? <ul className="mt-2 space-y-1 text-sm">{plan.days[key].map((item, index) =>
          <li key={index}>• {item.exerciseName || "ท่าออกกำลังกาย"} — {item.type === "cardio" ? `${item.time_min || 0} นาที` : `${item.sets || 0} × ${item.reps || 0}`}</li>)}</ul>
          : <p className="mt-1 text-sm text-gray-400">พัก</p>}
      </section>)}
      {plan.note ? <p className="text-sm text-gray-500">{plan.note}</p> : null}
      <button onClick={save} disabled={saving} className="w-full rounded-xl bg-[#d6a27a] py-3 font-medium text-white disabled:opacity-60">{saving ? "กำลังบันทึก..." : "ใช้ตารางนี้"}</button>
    </div> : null}
  </div>;
}
