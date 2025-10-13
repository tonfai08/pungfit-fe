"use client";

import { API_BASE_URL } from "../constants";

// 🔹 LOGIN
export async function login(email: string, password: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) return false;

    const data = await res.json();

    if (data?.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "userProfile",
        JSON.stringify({
          weight: data.weight_kg || "",
          height: data.height_cm || "",
          bodyFat: data.body_fat_percent || "",
          gender: data.gender || "",
          age: data.age || "",
        })
      );
      return true;
    }

    return false;
  } catch (error) {
    console.error("🚨 Login error:", error);
    return false;
  }
}

// 🔹 LOGOUT
export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userProfile");
}

// 🔹 CHECK LOGIN STATE
export function isLoggedIn() {
  return !!localStorage.getItem("token");
}

// 🔹 GET USER PROFILE
export async function getUserProfile() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token");

  const res = await fetch(`${API_BASE_URL}/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to fetch profile");

  return res.json();
}
