"use client";

import { API_BASE_URL } from "../constants";

export interface WerewolfRole {
  _id: string;
  code: string;
  name: string;
  team: "villager" | "werewolf" | "neutral";
  description?: string;
}

export interface WerewolfRoleSlotInput {
  roleId: string;
  count: number;
}

export interface CreateWerewolfRoomPayload {
  name: string;
  maxPlayers: number;
  player_code: string;
  display_name: string;
  role_slots: WerewolfRoleSlotInput[];
}

export interface WerewolfRoom {
  id?: string;
  name: string;
  roomCode?: string;
  maxPlayers: number;
  roleSlots?: Array<{ role?: string; count: number }>;
  createdAt?: string;
}

export interface WerewolfRoomTableResponse {
  room: {
    id: string;
    name: string;
    status: "waiting" | "started" | "finished";
    join_code: string;
    max_players: number;
    creator_code: string;
    creator_name: string;
    requester_is_mod: boolean;
    current_players: number;
    role_config: Array<{
      role_id: string;
      role_code: string | null;
      role_name: string | null;
      team: "villager" | "werewolf" | "neutral" | null;
      count: number;
    }>;
  };
  table: Array<{
    player_code: string;
    display_name: string;
    role_id: string | null;
    role_code: string | null;
    role_name: string | null;
    team: "villager" | "werewolf" | "neutral" | null;
    joined_at?: string;
  }>;
}

function getToken() {
  const token = localStorage.getItem("werewolf_code");
  if (!token) throw new Error("No token");
  return token;
}

function normalizeRoom(data: unknown): WerewolfRoom {
  const raw = (data ?? {}) as Record<string, unknown>;
  const room = (raw.room ?? raw.data ?? raw) as Record<string, unknown>;

  return {
    id: String(room.id ?? room._id ?? ""),
    name: String(room.name ?? ""),
    roomCode: String(room.roomCode ?? room.room_code ?? room.code ?? ""),
    maxPlayers: Number(room.maxPlayers ?? room.max_players ?? 0),
    roleSlots: Array.isArray(room.role_slots)
      ? (room.role_slots as Array<{ role?: string; count: number }>)
      : [],
    createdAt: typeof room.createdAt === "string" ? room.createdAt : undefined,
  };
}

export interface WerewolfMyRoleResponse {
  room_id: string;
  room_status: "waiting" | "started" | "finished";
  is_mod: boolean;
  player_code: string;
  display_name: string;
  role: {
    id: string | null;
    code: string | null;
    name: string | null;
    team: "villager" | "werewolf" | "neutral" | null;
    description: string | null;
  } | null;
}

export async function getWerewolfRoles() {
  const res = await fetch(`${API_BASE_URL}/werewolf/roles`);
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "Failed to fetch roles");
  }
  return (await res.json()) as WerewolfRole[];
}

export async function createWerewolfRoom(payload: CreateWerewolfRoomPayload) {
  const token = getToken();

  const res = await fetch(`${API_BASE_URL}/werewolf/rooms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: payload.name,
      max_players: payload.maxPlayers,
      player_code: payload.player_code,
      display_name: payload.display_name,
      role_slots: payload.role_slots,
    }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "Failed to create room");
  }

  const json = await res.json().catch(() => ({}));
  return normalizeRoom(json);
}

export async function joinWerewolfRoomById(payload: {
  roomId: string;
  player_code: string;
  display_name: string;
}) {
  const res = await fetch(`${API_BASE_URL}/werewolf/rooms/${payload.roomId}/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-player-code": payload.player_code,
      "x-player-name": payload.display_name,
    },
    body: JSON.stringify({
      player_code: payload.player_code,
      display_name: payload.display_name,
    }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "Failed to join room");
  }

  return res.json();
}

export async function joinWerewolfRoomByCode(payload: {
  code: string;
  player_code: string;
  display_name: string;
}) {
  const res = await fetch(`${API_BASE_URL}/werewolf/rooms/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-player-code": payload.player_code,
      "x-player-name": payload.display_name,
    },
    body: JSON.stringify({
      code: payload.code.trim().toUpperCase(),
      player_code: payload.player_code,
      display_name: payload.display_name,
    }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "Failed to join room by code");
  }

  return (await res.json()) as {
    message: string;
    room_id: string;
    join_code: string;
    player_code: string;
  };
}

export async function getWerewolfRoomTable(payload: {
  roomId: string;
  player_code: string;
}) {
  const query = new URLSearchParams({ player_code: payload.player_code });
  const res = await fetch(
    `${API_BASE_URL}/werewolf/rooms/${payload.roomId}/table?${query.toString()}`
  );

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "Failed to fetch room table");
  }

  return (await res.json()) as WerewolfRoomTableResponse;
}

export async function assignWerewolfRandomRoles(payload: {
  roomId: string;
  player_code: string;
}) {
  const res = await fetch(
    `${API_BASE_URL}/werewolf/rooms/${payload.roomId}/assign-random-roles`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-player-code": payload.player_code,
      },
      body: JSON.stringify({
        player_code: payload.player_code,
      }),
    }
  );

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "Failed to randomize roles");
  }

  return res.json();
}

export async function getWerewolfMyRole(payload: {
  roomId: string;
  player_code: string;
}) {
  const query = new URLSearchParams({ player_code: payload.player_code });
  const res = await fetch(
    `${API_BASE_URL}/werewolf/rooms/${payload.roomId}/my-role?${query.toString()}`
  );

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "Failed to fetch my role");
  }

  return (await res.json()) as WerewolfMyRoleResponse;
}

export async function finishWerewolfRoom(payload: {
  roomId: string;
  player_code: string;
}) {
  const res = await fetch(`${API_BASE_URL}/werewolf/rooms/${payload.roomId}/finish`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-player-code": payload.player_code,
    },
    body: JSON.stringify({
      player_code: payload.player_code,
    }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "Failed to finish room");
  }

  return res.json();
}
