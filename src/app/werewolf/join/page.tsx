"use client";

import {
  getWerewolfRoomTable,
  joinWerewolfRoomByCode,
} from "@/lib/api/werewolf";
import {
  clearWerewolfCurrentRoomId,
  readWerewolfCurrentRoomId,
  readWerewolfIdentity,
  saveWerewolfCurrentRoomId,
} from "@/lib/werewolf-identity";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function WerewolfJoinPage() {
  const router = useRouter();
  const [identityName, setIdentityName] = useState("");
  const [identityCode, setIdentityCode] = useState("");
  const [checking, setChecking] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const initialize = async () => {
      const identity = readWerewolfIdentity();
      if (!identity) {
        router.replace("/werewolf/create-name?next=/werewolf/join");
        return;
      }

      setIdentityName(identity.name);
      setIdentityCode(identity.code);

      const currentRoomId = readWerewolfCurrentRoomId();
      if (currentRoomId) {
        try {
          const table = await getWerewolfRoomTable({
            roomId: currentRoomId,
            player_code: identity.code,
          });
          if (table.room.status === "finished") {
            clearWerewolfCurrentRoomId();
          } else {
            router.replace(`/werewolf/room/${currentRoomId}`);
            return;
          }
        } catch {
          clearWerewolfCurrentRoomId();
        }
      }

      setChecking(false);
    };

    initialize();
  }, [router]);

  const canSubmit = useMemo(() => joinCode.trim().length >= 4, [joinCode]);

  const handleJoin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit || !identityCode || !identityName) return;

    setSubmitting(true);
    setError("");
    try {
      const result = await joinWerewolfRoomByCode({
        code: joinCode.trim(),
        player_code: identityCode,
        display_name: identityName,
      });
      const table = await getWerewolfRoomTable({
        roomId: result.room_id,
        player_code: identityCode,
      });
      if (table.room.status === "finished") {
        clearWerewolfCurrentRoomId();
        setError("ห้องนี้จบเกมแล้ว กรุณาเข้าห้องใหม่");
        return;
      }
      saveWerewolfCurrentRoomId(result.room_id);
      router.push(`/werewolf/room/${result.room_id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "เข้าร่วมห้องไม่สำเร็จ";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return <p className="text-center mt-10">Loading...</p>;
  }

  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow p-5">
      <h1 className="text-xl font-semibold text-accent text-center">
        เข้าร่วมห้อง Werewolf
      </h1>
      <p className="text-sm text-gray-500 text-center mt-1 mb-5">
        ใส่รหัสห้องเพื่อเข้าร่วมเกม
      </p>

      <div className="mb-4 rounded-lg bg-[#f9f6f3] border border-[#eddcca] p-3 text-sm text-gray-700">
        ผู้เล่น: <span className="font-semibold">{identityName}</span>
        {" • "}
        โค้ดยืนยัน: <span className="font-semibold">{identityCode}</span>
      </div>

      <form onSubmit={handleJoin} className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">รหัสห้อง</label>
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="เช่น AB12CD"
            maxLength={12}
            className="w-full border rounded-md px-3 py-2 uppercase outline-none focus:ring-2 focus:ring-accent/40"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="w-full bg-accent text-white py-2 rounded-md hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "กำลังเข้าห้อง..." : "เข้าร่วมห้อง"}
        </button>
      </form>

      <Link
        href="/werewolf"
        className="block text-center text-sm text-accent hover:underline mt-4"
      >
        กลับไปหน้าสร้างห้อง (สำหรับ Mod)
      </Link>
    </div>
  );
}
