"use client";

import { API_BASE_URL } from "../constants";

/**
 * ✅ ดึงประวัติน้ำหนักย้อนหลัง
 */
export async function getWeightHistory(limit = 10) {
  if (typeof window === "undefined") return []; // ป้องกันการรันฝั่ง server
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token");

  const res = await fetch(`${API_BASE_URL}/weight/history?limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Failed to fetch weight history: ${msg}`);
  }

  return res.json();
}

/**
 * ✅ อัปเดต/เพิ่มน้ำหนักของวันนี้
 */
export async function updateWeightToday(weight_kg: number) {
  if (typeof window === "undefined") return null; // ป้องกัน SSR
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token");

  const res = await fetch(`${API_BASE_URL}/weight`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ weight_kg }),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Failed to update weight: ${msg}`);
  }

  return res.json();
}
