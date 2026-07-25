"use client";

export const WEREWOLF_NAME_KEY = "werewolf_name";
export const WEREWOLF_CODE_KEY = "werewolf_code";
export const WEREWOLF_CURRENT_ROOM_ID_KEY = "werewolf_current_room_id";

export interface WerewolfIdentity {
  name: string;
  code: string;
}

export function readWerewolfIdentity(): WerewolfIdentity | null {
  if (typeof window === "undefined") return null;

  const name = localStorage.getItem(WEREWOLF_NAME_KEY)?.trim() || "";
  const code = localStorage.getItem(WEREWOLF_CODE_KEY)?.trim() || "";

  if (!name || !code) return null;
  return { name, code };
}

export function randomWerewolfCode(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    const index = Math.floor(Math.random() * chars.length);
    out += chars[index];
  }
  return out;
}

export function saveWerewolfIdentity(name: string, code?: string) {
  if (typeof window === "undefined") return null;
  const normalizedName = name.trim();
  if (!normalizedName) return null;

  const finalCode = (code || randomWerewolfCode()).trim();
  localStorage.setItem(WEREWOLF_NAME_KEY, normalizedName);
  localStorage.setItem(WEREWOLF_CODE_KEY, finalCode);

  return {
    name: normalizedName,
    code: finalCode,
  };
}

export function readWerewolfCurrentRoomId() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(WEREWOLF_CURRENT_ROOM_ID_KEY)?.trim() || "";
}

export function saveWerewolfCurrentRoomId(roomId: string) {
  if (typeof window === "undefined") return;
  const normalized = roomId.trim();
  if (!normalized) return;
  localStorage.setItem(WEREWOLF_CURRENT_ROOM_ID_KEY, normalized);
}

export function clearWerewolfCurrentRoomId() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(WEREWOLF_CURRENT_ROOM_ID_KEY);
}
