"use client";

import { API_BASE_URL } from "../constants";

// 🧠 ดึง token จาก localStorage
function getToken() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token");
  return token;
}

/**
 * ✅ สร้างกลุ่มใหม่
 * POST /api/groups
 */
export async function createGroup(name: string, members: string[] = []) {
  const token = getToken();

  const res = await fetch(`${API_BASE_URL}/groups`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, members }),
  });

  if (!res.ok) throw new Error("Failed to create group");

  return res.json();
}

/**
 * ✅ ดึงกลุ่มของฉัน
 * GET /api/groups/my
 */
export async function getMyGroups() {
  const token = getToken();

  const res = await fetch(`${API_BASE_URL}/groups/my`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Failed to fetch my groups");

  return res.json();
}


export async function joinGroupByCode(code: string) {
  const token = getToken();

  const res = await fetch(`${API_BASE_URL}/groups/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ code }),
  });

  if (!res.ok) throw new Error("Failed to join group");

  return res.json();
}

/**
 * ✅ ดึงรายละเอียดกลุ่ม (พร้อมสมาชิก)
 * GET /api/groups/:groupId
 */
export async function getGroupDetail(groupId: string) {
  const token = getToken();

  const res = await fetch(`${API_BASE_URL}/groups/${groupId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Failed to fetch group detail");

  return res.json();
}

/**
 * ✅ เพิ่มสมาชิกด้วย userId
 * POST /api/groups/:groupId/members
 */
export async function addMemberToGroup(groupId: string, userId: string) {
  const token = getToken();

  const res = await fetch(`${API_BASE_URL}/groups/${groupId}/members`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userId }),
  });

  if (!res.ok) throw new Error("Failed to add member");

  return res.json();
}
