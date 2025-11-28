"use client";

import { API_BASE_URL } from "../constants";
interface ProfileData {
  weight?: number | string;
  height?: number | string;
  bodyFat?: number | string;
  gender?: string;
  age?: number | string;
  activity_level?: string;
}
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
      localStorage.setItem("userProfile", JSON.stringify({
        email: data.email || "",
        last_login: data.last_login || "",
        profile_image: data.profile_image || "",
      }));
      localStorage.setItem(
        "userBody",
        JSON.stringify({
          weight: data.weight_kg || "",
          height: data.height_cm || "",
          bodyFat: data.body_fat_percent || "",
          gender: data.gender || "",
          age: data.age || "",
          bmr: data.bmr || "",
          activity_level: data.activity_level || "",
          tdee: data.tdee || null,
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
  localStorage.removeItem("userBody");
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

  if (res.status === 401) {
    const { error } = await res.json().catch(() => ({}));
    if (error === "Token expired" || error === "Invalid token") {
      logout();
      throw new Error("Session expired");
    }
  }

  if (!res.ok) throw new Error("Failed to fetch profile");

  return res.json();
}

export async function updateUser(form: ProfileData) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token");

  const res = await fetch(`${API_BASE_URL}/users/me`, {
    method: "PUT", // ✅ ใช้ PUT แทน GET
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(form), // ✅ ส่งข้อมูล form ไปใน body
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to update profile");
  }

  return res.json();
}

export async function updateDisplayName(display_name: string) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token");

  const res = await fetch(`${API_BASE_URL}/users/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ display_name }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to update name");
  }

  return res.json();
}

export async function updateProfileImage(file: File) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token");

  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`${API_BASE_URL}/users/me/profile-image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to update profile image");
  }

  return res.json();
}
