import { API_BASE_URL } from "../constants";

export interface BodyProgressRecord {
  _id: string;
  date_key: string;
  image_path: string;
  createdAt: string;
  updatedAt: string;
}

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token") || ""}` });

export async function getBodyProgress(limit = 10) {
  const res = await fetch(`${API_BASE_URL}/body-progress?limit=${limit}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("โหลดรูปไม่สำเร็จ");
  return res.json() as Promise<{ records: BodyProgressRecord[]; today: string; limit: number; can_select_date: boolean }>;
}

export async function saveBodyProgress(image: Blob, dateKey?: string) {
  const form = new FormData();
  form.append("image", image, "body-progress.jpg");
  if (dateKey) form.append("date_key", dateKey);
  const res = await fetch(`${API_BASE_URL}/body-progress`, { method: "POST", headers: authHeaders(), body: form });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `บันทึกรูปไม่สำเร็จ (${res.status})`);
  }
  return res.json();
}

export async function deleteBodyProgress(id: string) {
  const res = await fetch(`${API_BASE_URL}/body-progress/${id}`, { method: "DELETE", headers: authHeaders() });
  if (!res.ok) throw new Error("ลบรูปไม่สำเร็จ");
}
