"use client";
import { API_BASE_URL } from "../constants";
import dayjs from "dayjs";

interface MealInput {
  date: string;
  meal_type: string;
  food_name: string;
  description?: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export async function getMealsByDate(date: string) {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token");

  const res = await fetch(`${API_BASE_URL}/meals?date=${date}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Failed to fetch meals: ${msg}`);
  }

  return res.json();
}
export async function getMealsForLastDays(days = 7) {
  if (typeof window === "undefined") return [];
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token");

  const today = dayjs();
  const requests = [];

  for (let i = 0; i < days; i++) {
    const date = today.subtract(i, "day").format("YYYY-MM-DD");
    requests.push(
      fetch(`${API_BASE_URL}/meals?date=${date}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json().catch(() => null))
    );
  }

  const responses = await Promise.all(requests);
  return responses
    .map((res, i) => ({
      date: today.subtract(i, "day").format("YYYY-MM-DD"),
      meals: res?.meals || [],
      summary: res?.summary || {},
    }))
    .reverse(); // วันที่เก่ามาก → ใหม่ล่าสุด
}

export async function createMealRecord(payload: MealInput) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token");

  const res = await fetch(`${API_BASE_URL}/meals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Failed to create meal record: ${msg}`);
  }

  return res.json();
}