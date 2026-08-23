"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { API_BASE_URL } from "@/lib/constants";

function McpAuthorizeContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const apiOrigin = API_BASE_URL.replace(/\/v1\/?$/, "");
  const values = useMemo(() => Object.fromEntries(searchParams.entries()), [searchParams]);
  const hasSession = typeof window !== "undefined" && Boolean(localStorage.getItem("token"));

  const approve = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiOrigin}/oauth/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok || !data.redirect_url) throw new Error(data.error || "เชื่อมต่อไม่สำเร็จ");
      window.location.href = data.redirect_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "เชื่อมต่อไม่สำเร็จ");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-bg-theme px-4 py-12 flex items-center justify-center">
      <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
        <Image src="/logo.png" alt="PungFit" width={110} height={55} priority />
        <h1 className="mt-6 text-2xl font-semibold text-accent">เชื่อม PungFit กับ ChatGPT</h1>
        <p className="mt-2 text-sm text-gray-600">ChatGPT จะสามารถดูและบันทึกการออกกำลังกายในบัญชีของคุณได้</p>
        <ul className="mt-5 space-y-2 rounded-xl bg-accent/5 p-4 text-sm text-gray-700">
          <li>• ดูรายการออกกำลังกายของแต่ละวัน</li>
          <li>• บันทึกท่า เซต จำนวนครั้ง น้ำหนัก และคาร์ดิโอ</li>
        </ul>
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        <button type="button" onClick={approve} disabled={loading}
          className="mt-6 w-full rounded-xl bg-accent px-4 py-3 font-medium text-white transition hover:opacity-90 disabled:opacity-60">
          {loading ? "กำลังเชื่อมต่อ..." : hasSession ? "อนุญาตและเชื่อมต่อ" : "เข้าสู่ระบบ PungFit ก่อน"}
        </button>
        <p className="mt-3 text-center text-xs text-gray-500">คุณยกเลิกสิทธิ์ได้ภายหลังจากหน้าโปรไฟล์</p>
      </section>
    </main>
  );
}

export default function McpAuthorizePage() {
  return <Suspense fallback={<main className="min-h-screen bg-bg-theme" />}><McpAuthorizeContent /></Suspense>;
}
