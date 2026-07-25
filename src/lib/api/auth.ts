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
function persistSession(data: { token?: string; user?: Record<string, unknown> }) {
  if (!data?.token || !data.user) return false;

  const user = data.user;
  localStorage.setItem("token", data.token);
  localStorage.setItem(
    "userProfile",
    JSON.stringify({
      email: user.email || "",
      last_login: user.last_login || "",
      profile_image: user.profile_image || "",
      display_name: user.display_name || "",
    })
  );
  localStorage.setItem(
    "userBody",
    JSON.stringify({
      weight: user.weight_kg || "",
      height: user.height_cm || "",
      bodyFat: user.body_fat_percent || "",
      gender: user.gender || "",
      age: user.age || "",
      bmr: user.bmr || "",
      activity_level: user.activity_level || "",
      tdee: user.tdee || null,
    })
  );
  return true;
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
    return persistSession(data);
  } catch (error) {
    console.error("🚨 Login error:", error);
    return false;
  }
}

// 🔹 LOGIN WITH GOOGLE
export async function loginWithGoogle(idToken: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/google`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id_token: idToken }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    return persistSession(data);
  } catch (error) {
    console.error("🚨 Google login error:", error);
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
