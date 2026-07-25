"use client";

import {
  readWerewolfIdentity,
  saveWerewolfIdentity,
} from "@/lib/werewolf-identity";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

function WerewolfCreateNameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const nextPath = searchParams.get("next") || "/werewolf";

  useEffect(() => {
    const identity = readWerewolfIdentity();
    if (identity) {
      router.replace(nextPath);
    }
  }, [nextPath, router]);

  const canSubmit = useMemo(() => name.trim().length >= 2, [name]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;

    const saved = saveWerewolfIdentity(name);
    if (!saved) return;
    router.replace(nextPath);
  };

  return (
    <div className="min-h-screen w-full bg-bg-theme flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-5">
        <h1 className="text-xl font-semibold text-accent text-center">
          ตั้งชื่อผู้เล่น
        </h1>
        <p className="text-sm text-gray-500 text-center mt-1 mb-5">
          ระบบจะสร้างโค้ดยืนยันตัวตนและเก็บไว้ในเครื่องนี้
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">ชื่อของคุณ</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น Ton, Bee, Name"
              className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-accent/40"
              maxLength={30}
            />
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-accent text-white py-2 rounded-md hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            บันทึกชื่อและเริ่มใช้งาน
          </button>
        </form>
      </div>
    </div>
  );
}

export default function WerewolfCreateNamePage() {
  return (
    <Suspense fallback={<p className="text-center mt-10">Loading...</p>}>
      <WerewolfCreateNameContent />
    </Suspense>
  );
}
