"use client";

import { API_BASE_URL } from "../constants";

export interface WaterIntakeInput {
  amount_ml: number;
  date?: string;
}

export async function createWaterIntake(payload: WaterIntakeInput) {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token");

  const res = await fetch(`${API_BASE_URL}/water-intakes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`Failed to create water intake: ${msg}`);
  }

  return res.json();
}

export async function createWaterIntakeToday(amount_ml: number) {
  return createWaterIntake({ amount_ml });
}
