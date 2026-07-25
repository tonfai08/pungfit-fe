"use client";

import {
  finishWerewolfRoom,
  getWerewolfMyRole,
  getWerewolfRoomTable,
} from "@/lib/api/werewolf";
import {
  clearWerewolfCurrentRoomId,
  readWerewolfIdentity,
  saveWerewolfCurrentRoomId,
} from "@/lib/werewolf-identity";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function WerewolfMyRolePage() {
  const router = useRouter();
  const { roomId } = useParams<{ roomId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState<{
    displayName: string;
    roleName: string;
    roleCode: string;
    roleTeam: string;
    roleDescription: string;
    isMod: boolean;
    roomStatus: string;
  } | null>(null);
  const [modTable, setModTable] = useState<
    Array<{
      player_code: string;
      display_name: string;
      role_name: string | null;
      role_code: string | null;
    }>
  >([]);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    const fetchMyRole = async () => {
      const identity = readWerewolfIdentity();
      if (!identity) {
        router.replace("/werewolf/create-name");
        return;
      }
      if (!roomId) return;

      try {
        const data = await getWerewolfMyRole({
          roomId,
          player_code: identity.code,
        });

        if (data.room_status === "finished") {
          clearWerewolfCurrentRoomId();
          router.replace("/werewolf/join");
          return;
        }

        saveWerewolfCurrentRoomId(roomId);
        setPayload({
          displayName: data.display_name,
          roleName: data.role?.name || (data.is_mod ? "Moderator" : "Unknown"),
          roleCode: data.role?.code || (data.is_mod ? "mod" : "-"),
          roleTeam: data.role?.team || (data.is_mod ? "mod" : "-"),
          roleDescription:
            data.role?.description ||
            (data.is_mod
              ? "คุณเป็นผู้คุมเกม จัดการเกมและดูบทบาททั้งหมดได้"
              : "รอระบบเปิดเผยข้อมูลบทบาท"),
          isMod: data.is_mod,
          roomStatus: data.room_status,
        });
        if (data.is_mod) {
          const tableData = await getWerewolfRoomTable({
            roomId,
            player_code: identity.code,
          });
          setModTable(
            tableData.table.map((row) => ({
              player_code: row.player_code,
              display_name: row.display_name,
              role_name: row.role_name,
              role_code: row.role_code,
            }))
          );
        } else {
          setModTable([]);
        }
        setError("");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "โหลดบทบาทไม่สำเร็จ";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchMyRole();
  }, [roomId, router]);

  if (loading) {
    return <p className="text-center mt-10">Loading role...</p>;
  }

  if (error || !payload) {
    return (
      <div className="w-full max-w-md bg-white rounded-xl shadow p-5">
        <p className="text-sm text-red-500">
          {error || "ไม่สามารถโหลดบทบาทได้"}
        </p>
      </div>
    );
  }

  const handleFinishRoom = async () => {
    const identity = readWerewolfIdentity();
    if (!identity || !roomId) return;

    setFinishing(true);
    setError("");
    try {
      await finishWerewolfRoom({
        roomId,
        player_code: identity.code,
      });
      clearWerewolfCurrentRoomId();
      router.replace("/werewolf/join");
    } catch (err) {
      const message = err instanceof Error ? err.message : "จบห้องไม่สำเร็จ";
      setError(message);
    } finally {
      setFinishing(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow p-5">
      <h1 className="text-xl font-semibold text-accent text-center">
        บทบาทของคุณ
      </h1>
      <p className="text-sm text-gray-500 text-center mt-1">
        สถานะห้อง: {payload.roomStatus}
      </p>

      <div className="mt-4 rounded-lg border border-[#eddcca] bg-[#f9f6f3] p-4">
        <p className="text-sm text-gray-600">ผู้เล่น</p>
        <p className="font-semibold text-gray-800">{payload.displayName}</p>

        <p className="text-sm text-gray-600 mt-3">Role</p>
        <p className="text-lg font-semibold text-accent">{payload.roleName}</p>
        <p className="text-xs text-gray-500 uppercase">
          {payload.roleCode} • {payload.roleTeam}
        </p>
        <p className="text-sm text-gray-700 mt-2">{payload.roleDescription}</p>
      </div>

      {!payload.isMod && (
        <p className="text-xs text-gray-500 text-center mt-3">
          เก็บบทบาทของคุณเป็นความลับจากผู้เล่นคนอื่น
        </p>
      )}
      {payload.isMod && (
        <div className="mt-4 rounded-lg border border-[#eddcca] bg-white p-4">
          <p className="text-sm font-medium text-gray-800 mb-2">
            Role ของผู้เล่นทั้งหมด
          </p>
          <div className="space-y-2">
            {modTable.map((row) => (
              <div
                key={row.player_code}
                className="border border-gray-200 rounded-md p-2"
              >
                <p className="text-sm font-medium text-gray-800">
                  {row.display_name}
                </p>
                <p className="text-xs text-gray-500">{row.player_code}</p>
                <p className="text-xs text-accent mt-1">
                  {row.role_name || "-"}
                  {row.role_code ? ` (${row.role_code})` : ""}
                </p>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleFinishRoom}
            disabled={finishing}
            className="mt-3 w-full border border-red-300 text-red-600 py-2 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {finishing ? "กำลังปิดห้อง..." : "Finish ห้องนี้"}
          </button>
        </div>
      )}
    </div>
  );
}
