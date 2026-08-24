"use client";

import { API_BASE_URL } from "../constants";

function getToken() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token");
  return token;
}

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface WorkoutExercise {
  exerciseName?: string;
  exerciseId?: {
    _id: string;
    name: string;
    aliases?: string[];
    execution_notes?: string;
    media?: {
      image_url?: string;
      video_url?: string;
      source?: string;
      source_url?: string;
      license?: string;
      license_url?: string;
      attribution?: string;
    };
  };
  type?: string;
  sets?: number;
  reps?: number;
  time_min?: number;
}

export interface WorkoutPlan {
  _id: string;
  weekLabel?: string;
  days: Record<DayKey, WorkoutExercise[]>;
  is_active?: boolean;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function getMyWorkoutPlan() {
  const token = getToken();

  const res = await fetch(`${API_BASE_URL}/workout-plans/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch workout plan");

  const data = await res.json().catch(() => ({}));
  return data?.workoutPlan ?? null;
}

export async function generateAIWorkoutPlan(prompt: string) {
  const res = await fetch(`${API_BASE_URL}/workout-plans/generate-ai`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "สร้างตารางไม่สำเร็จ");
  return data.plan;
}

export async function saveWorkoutPlan(plan: Omit<WorkoutPlan, "_id">) {
  const res = await fetch(`${API_BASE_URL}/workout-plans/me`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify(plan),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "บันทึกตารางไม่สำเร็จ");
  return data.workoutPlan;
}
