"use client";

import { API_BASE_URL } from "../constants";

export interface Food {
  _id: string;
  barcode: string;
  food_name: string;
  description?: string;
  brand?: string;
  servingSize?: number;
  servingUnit?: string;
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  sugar?: number;
  fiber?: number;
  sodium?: number;
  cholesterol?: number;
  calcium?: number;
  iron?: number;
  potassium?: number;
  vitaminC?: number;
  vitaminD?: number;
}

export type CreateFoodInput = {
  barcode: string;
  food_name?: string;
  description?: string;
  brand?: string;
  servingSize?: number;
  servingUnit?: string;
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  sugar?: number;
  fiber?: number;
  sodium?: number;
  cholesterol?: number;
  calcium?: number;
  iron?: number;
  potassium?: number;
  vitaminC?: number;
  vitaminD?: number;
};

interface FoodResponse {
  success?: boolean;
  food?: Food;
}

type AnalyzeFoodImageResponse = Partial<Food> & {
  food?: Partial<Food>;
  meal?: Partial<Food>;
};

export async function getFoodByBarcode(barcode: string) {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token");

  const res = await fetch(
    `${API_BASE_URL}/foods/barcode/${encodeURIComponent(barcode)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (res.status === 404) return null;
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`Failed to fetch food by barcode: ${msg}`);
  }

  const data = (await res.json().catch(() => ({}))) as FoodResponse;
  if (!data?.success || !data.food) return null;
  return data.food;
}

export async function createFood(input: CreateFoodInput) {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token");

  const res = await fetch(`${API_BASE_URL}/foods`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`Failed to create food: ${msg}`);
  }

  const data = (await res.json().catch(() => ({}))) as FoodResponse;
  if (!data?.success || !data.food) return null;
  return data.food;
}

export async function analyzeFoodImage(file: File) {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token");

  const formData = new FormData();
  formData.append("image", file);
  formData.append("lang", "th");

  const res = await fetch(`${API_BASE_URL}/meals/analyze-image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`Failed to analyze food image: ${msg}`);
  }

  const data = (await res.json().catch(() => ({}))) as AnalyzeFoodImageResponse;
  return data.meal ?? data.food ?? data;
}
