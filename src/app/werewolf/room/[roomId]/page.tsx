"use client";

import {
  assignWerewolfRandomRoles,
  finishWerewolfRoom,
  getWerewolfRoomTable,
  joinWerewolfRoomById,
  type WerewolfRoomTableResponse,
} from "@/lib/api/werewolf";
import {
  clearWerewolfCurrentRoomId,
  readWerewolfIdentity,
  saveWerewolfCurrentRoomId,
} from "@/lib/werewolf-identity";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function WerewolfRoomPage() {
  const router = useRouter();
  const { roomId } = useParams<{ roomId: string }>();
  const [identityName, setIdentityName] = useState("");
  const [identityCode, setIdentityCode] = useState("");
  const [roomData, setRoomData] = useState<WerewolfRoomTableResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const identity = readWerewolfIdentity();
    if (!identity) {
      router.replace("/werewolf/create-name");
      return;
    }
    setIdentityName(identity.name);
    setIdentityCode(identity.code);
  }, [router]);

  const fetchRoom = useCallback(async () => {
    if (!roomId || !identityCode) return;

    try {
      const table = await getWerewolfRoomTable({
        roomId,
        player_code: identityCode,
      });
      if (table.room.status === "started") {
        router.replace(`/werewolf/room/${roomId}/myrole`);
        return;
      }
      if (table.room.status === "finished") {
        clearWerewolfCurrentRoomId();
        router.replace("/werewolf/join");
        return;
      }
      saveWerewolfCurrentRoomId(roomId);
      setRoomData(table);
      setError("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "โหลดข้อมูลห้องไม่สำเร็จ";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [identityCode, roomId, router]);

  useEffect(() => {
    const ensureJoinAndLoad = async () => {
      if (!roomId || !identityCode || !identityName) return;
      setLoading(true);
      try {
        await joinWerewolfRoomById({
          roomId,
          player_code: identityCode,
          display_name: identityName,
        });
      } catch {
        // ถ้าเข้าห้องไม่ได้ ให้ fetchRoom เพื่อโชว์ข้อความ error จาก backend ต่อ
      }
      await fetchRoom();
    };

    ensureJoinAndLoad();
  }, [fetchRoom, identityCode, identityName, roomId]);

  useEffect(() => {
    if (!roomId || !identityCode) return;
    const interval = setInterval(() => {
      fetchRoom();
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchRoom, identityCode, roomId]);

  const handleStartGame = async () => {
    if (!roomId || !identityCode || !roomData) return;
    setStarting(true);
    setError("");
    try {
      await assignWerewolfRandomRoles({
        roomId,
        player_code: identityCode,
      });
      router.replace(`/werewolf/room/${roomId}/myrole`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "เริ่มเกมไม่สำเร็จ";
      setError(message);
    } finally {
      setStarting(false);
    }
  };

  const handleFinishGame = async () => {
    if (!roomId || !identityCode || !roomData) return;
    setFinishing(true);
    setError("");
    try {
      await finishWerewolfRoom({
        roomId,
        player_code: identityCode,
      });
      clearWerewolfCurrentRoomId();
      router.replace("/werewolf/join");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "จบห้องไม่สำเร็จ";
      setError(message);
    } finally {
      setFinishing(false);
    }
  };

  if (loading) {
    return <p className="text-center mt-10">Loading room...</p>;
  }

  if (error || !roomData) {
    return (
      <div className="w-full max-w-md bg-white rounded-xl shadow p-5">
        <p className="text-red-500 text-sm">
          {error || "ไม่พบข้อมูลห้อง หรือคุณยังไม่ได้อยู่ในห้องนี้"}
        </p>
      </div>
    );
  }

  const { room, table } = roomData;
  const isReadyToStart =
    room.requester_is_mod &&
    room.status === "waiting" &&
    room.current_players === room.max_players;

  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow p-5">
      <h1 className="text-xl font-semibold text-accent text-center">
        ห้อง {room.name}
      </h1>
      <p className="text-sm text-gray-600 text-center mt-1">
        สถานะ: {room.status} • โค้ดห้อง:{" "}
        <span className="font-semibold">{room.join_code}</span>
      </p>
      <p className="text-sm text-gray-600 text-center mt-1">
        ผู้เล่น: {room.current_players}/{room.max_players} (รวม Mod)
      </p>
      <p className="text-xs text-gray-500 text-center mt-1">
        ตอนนี้รอคนจอยเข้าห้อง...
      </p>
      {room.requester_is_mod && room.status === "waiting" && (
        <div className="mt-3">
          {!isReadyToStart && (
            <p className="text-xs text-amber-600 text-center mb-2">
              รอผู้เล่นให้ครบก่อนเริ่มเกม
            </p>
          )}
          <button
            type="button"
            onClick={handleStartGame}
            disabled={!isReadyToStart || starting}
            className="w-full bg-accent text-white py-2 rounded-md hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {starting ? "กำลังสุ่ม role..." : "เริ่มเกม (สุ่ม Role)"}
          </button>
        </div>
      )}
      {room.requester_is_mod && (
        <div className="mt-2">
          <button
            type="button"
            onClick={handleFinishGame}
            disabled={finishing}
            className="w-full border border-red-300 text-red-600 py-2 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {finishing ? "กำลังปิดห้อง..." : "Finish ห้องนี้"}
          </button>
        </div>
      )}

      <div className="mt-4">
        <p className="text-sm font-medium text-gray-800 mb-2">รายชื่อผู้เล่น</p>
        <div className="space-y-2">
          {table.map((player) => {
            const isMe = player.player_code === identityCode;
            const isMod = player.player_code === room.creator_code;
            return (
              <div
                key={player.player_code}
                className={`rounded-md border p-2 text-sm ${
                  isMe ? "border-accent bg-[#f9f6f3]" : "border-gray-200 bg-white"
                }`}
              >
                <p className="font-medium text-gray-800">
                  {player.display_name}
                  {isMe ? " (คุณ)" : ""}
                  {isMod ? " [Mod]" : ""}
                </p>
                <p className="text-xs text-gray-500">{player.player_code}</p>
                {room.requester_is_mod && player.role_name && (
                  <p className="text-xs text-accent mt-1">
                    {player.role_name}
                    {player.role_code ? ` (${player.role_code})` : ""}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
