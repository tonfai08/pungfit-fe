"use client";

import { API_BASE_URL } from "../constants";

export type ExerciseLogType = "weight" | "cardio" | "time" | "other";
export type ExerciseIntensity = "low" | "moderate" | "high";

export interface ExerciseLogCreatePayload {
  name: string;
  type: ExerciseLogType;
  set1_weight_kg?: number;
  set1_reps?: number;
  set2_weight_kg?: number;
  set2_reps?: number;
  set3_weight_kg?: number;
  set3_reps?: number;
  duration_min?: number;
  intensity?: ExerciseIntensity;
  notes?: string;
  performed_at?: string;
}

export type ExerciseLogUpdatePayload = Partial<ExerciseLogCreatePayload>;

export interface ExerciseLog {
  id: string;
  name: string;
  type: ExerciseLogType;
  set1_weight_kg?: number | null;
  set1_reps?: number | null;
  set2_weight_kg?: number | null;
  set2_reps?: number | null;
  set3_weight_kg?: number | null;
  set3_reps?: number | null;
  duration_min?: number | null;
  intensity?: ExerciseIntensity | null;
  notes?: string | null;
  performed_at?: string;
  created_at?: string;
  updated_at?: string;
}

function getToken() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token");
  return token;
}

/**
 * ✅ สร้าง exercise log
 * POST /exercise-logs
 */
export async function createExerciseLog(payload: ExerciseLogCreatePayload) {
  const token = getToken();

  const res = await fetch(`${API_BASE_URL}/exercise-logs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Failed to create exercise log: ${msg}`);
  }

  return res.json() as Promise<ExerciseLog>;
}

/**
 * ✅ แก้ไข exercise log
 * PUT /exercise-logs/:id
 */
export async function updateExerciseLog(
  id: string,
  payload: ExerciseLogUpdatePayload
) {
  const token = getToken();

  const res = await fetch(`${API_BASE_URL}/exercise-logs/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Failed to update exercise log: ${msg}`);
  }

  return res.json() as Promise<ExerciseLog>;
}

/**
 * ✅ ลบ exercise log
 * DELETE /exercise-logs/:id
 */
export async function deleteExerciseLog(id: string) {
  const token = getToken();

  const res = await fetch(`${API_BASE_URL}/exercise-logs/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Failed to delete exercise log: ${msg}`);
  }

  return res.json();
}

/**
 * ✅ ดึงรายการ exercise logs
 * GET /exercise-logs
 * GET /exercise-logs?start=YYYY-MM-DD&end=YYYY-MM-DD
 */
export async function getExerciseLogs(params?: {
  start?: string;
  end?: string;
}) {
  const token = getToken();
  const search = new URLSearchParams();

  if (params?.start) search.set("start", params.start);
  if (params?.end) search.set("end", params.end);

  const query = search.toString();
  const url = query
    ? `${API_BASE_URL}/exercise-logs?${query}`
    : `${API_BASE_URL}/exercise-logs`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Failed to fetch exercise logs: ${msg}`);
  }

  return res.json() as Promise<ExerciseLog[]>;
}
