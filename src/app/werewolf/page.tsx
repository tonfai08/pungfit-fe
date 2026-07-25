"use client";
import {
  createWerewolfRoom,
  getWerewolfRoomTable,
  getWerewolfRoles,
  type WerewolfRole,
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

export default function WerewolfPage() {
  const router = useRouter();
  const [identityName, setIdentityName] = useState("");
  const [identityCode, setIdentityCode] = useState("");
  const [identityChecked, setIdentityChecked] = useState(false);
  const [checkingExistingRoom, setCheckingExistingRoom] = useState(true);
  const [name, setName] = useState("");
  const [nonModPlayers, setNonModPlayers] = useState(8);
  const [roles, setRoles] = useState<WerewolfRole[]>([]);
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({});
  const [rolesLoading, setRolesLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const initialize = async () => {
      const identity = readWerewolfIdentity();
      if (!identity) {
        router.replace("/werewolf/create-name");
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
            router.replace("/werewolf/join");
            return;
          } else {
            router.replace(`/werewolf/room/${currentRoomId}`);
            return;
          }
        } catch {
          clearWerewolfCurrentRoomId();
        }
      }

      setIdentityChecked(true);
      setCheckingExistingRoom(false);
    };

    initialize();
  }, [router]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const data = await getWerewolfRoles();
        setRoles(data);
        setRoleCounts((prev) => {
          const next = { ...prev };
          for (const role of data) {
            if (next[role._id] === undefined) next[role._id] = 0;
          }
          return next;
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "โหลด role ไม่สำเร็จ";
        setError(message);
      } finally {
        setRolesLoading(false);
      }
    };

    fetchRoles();
  }, []);

  const requiredRoleTotal = Math.max(nonModPlayers, 0);
  const totalPlayersIncludingMod = nonModPlayers + 1;
  const selectedRoleSlots = roles
    .map((role) => ({
      roleId: role._id,
      count: roleCounts[role._id] || 0,
    }))
    .filter((slot) => slot.count > 0);
  const assignedRoleTotal = selectedRoleSlots.reduce(
    (sum, slot) => sum + slot.count,
    0
  );
  const remainingRoleTotal = requiredRoleTotal - assignedRoleTotal;

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    if (nonModPlayers < 1 || nonModPlayers > 20) return false;
    if (rolesLoading || roles.length === 0) return false;
    if (selectedRoleSlots.length === 0) return false;
    if (assignedRoleTotal !== requiredRoleTotal) return false;
    return true;
  }, [
    assignedRoleTotal,
    name,
    nonModPlayers,
    requiredRoleTotal,
    roles.length,
    rolesLoading,
    selectedRoleSlots.length,
  ]);

  const handleRoleCountChange = (roleId: string, rawValue: string) => {
    const parsed = Number(rawValue);
    const safeValue = Number.isFinite(parsed)
      ? Math.max(0, Math.floor(parsed))
      : 0;

    setRoleCounts((prev) => ({
      ...prev,
      [roleId]: safeValue,
    }));
  };

  const handleCreateRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError("");

    try {
      const room = await createWerewolfRoom({
        name: name.trim(),
        maxPlayers: totalPlayersIncludingMod,
        player_code: identityCode,
        display_name: identityName,
        role_slots: selectedRoleSlots,
      });
      if (room.id) {
        saveWerewolfCurrentRoomId(room.id);
        router.push(`/werewolf/room/${room.id}`);
      } else {
        throw new Error("สร้างห้องสำเร็จแต่ไม่พบ room id");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "สร้างห้องไม่สำเร็จ";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!identityChecked || checkingExistingRoom) {
    return <p className="text-center mt-10">Loading...</p>;
  }

  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow p-5">
      <h1 className="text-xl font-semibold text-accent text-center">
        สร้างห้อง Werewolf
      </h1>
      <p className="text-sm text-gray-500 text-center mt-1 mb-5">
        ตั้งค่าห้องก่อนชวนเพื่อนเข้ามาเล่น
      </p>
      <Link
        href="/werewolf/join"
        className="block mb-4 text-center text-sm text-accent hover:underline"
      >
        มีรหัสห้องแล้ว? เข้าร่วมเกมที่นี่
      </Link>
      <div className="mb-4 rounded-lg bg-[#f9f6f3] border border-[#eddcca] p-3 text-sm text-gray-700">
        ผู้เล่น: <span className="font-semibold">{identityName}</span>
        {" • "}
        โค้ดยืนยัน: <span className="font-semibold">{identityCode}</span>
      </div>

      <form onSubmit={handleCreateRoom} className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">ชื่อห้อง</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="เช่น ห้องเพื่อน ม.6"
            className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-accent/40"
            maxLength={40}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            จำนวนผู้เล่น (ไม่รวม Mod)
          </label>
          <input
            type="number"
            min={1}
            max={20}
            value={nonModPlayers}
            onChange={(e) => setNonModPlayers(Number(e.target.value))}
            className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-accent/40"
          />
          <p className="text-xs text-gray-500 mt-1">
            ผู้เล่นรวมทั้งหมดในห้อง = {totalPlayersIncludingMod} (รวม Mod 1 คน)
          </p>
        </div>

        <div className="rounded-lg border border-[#eddcca] bg-[#f9f6f3] p-3">
          <p className="text-sm font-medium text-gray-800">
            ตั้งค่าบทบาท (Role Slots)
          </p>
          <p className="text-xs text-gray-600 mt-1">
            ต้องกำหนดรวมให้เท่ากับ {requiredRoleTotal} คน (ยกเว้นผู้สร้างห้อง)
          </p>

          <div className="space-y-2 mt-3">
            {rolesLoading && (
              <p className="text-sm text-gray-500">กำลังโหลด roles...</p>
            )}

            {!rolesLoading &&
              roles.map((role) => (
                <div
                  key={role._id}
                  className="flex items-center justify-between gap-2"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {role.name}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {role.code} • {role.team}
                    </p>
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={roleCounts[role._id] ?? 0}
                    onChange={(e) =>
                      handleRoleCountChange(role._id, e.target.value)
                    }
                    className="w-20 border rounded-md px-2 py-1 text-right outline-none focus:ring-2 focus:ring-accent/40"
                  />
                </div>
              ))}
          </div>

          <div className="mt-3 text-xs">
            <span
              className={
                remainingRoleTotal === 0 ? "text-green-600" : "text-amber-600"
              }
            >
              เหลือที่ต้องใส่: {remainingRoleTotal}
            </span>
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="w-full bg-accent text-white py-2 rounded-md hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "กำลังสร้างห้อง..." : "สร้างห้อง"}
        </button>
      </form>
    </div>
  );
}
