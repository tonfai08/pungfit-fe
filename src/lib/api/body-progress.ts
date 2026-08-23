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
  return res.json() as Promise<{ records: BodyProgressRecord[]; today: string; limit: number }>;
}

export async function saveBodyProgress(image: Blob) {
  const form = new FormData();
  form.append("image", image, "body-progress.jpg");
  const res = await fetch(`${API_BASE_URL}/body-progress`, { method: "POST", headers: authHeaders(), body: form });
  if (!res.ok) throw new Error("บันทึกรูปไม่สำเร็จ");
  return res.json();
}

export async function deleteBodyProgress(id: string) {
  const res = await fetch(`${API_BASE_URL}/body-progress/${id}`, { method: "DELETE", headers: authHeaders() });
  if (!res.ok) throw new Error("ลบรูปไม่สำเร็จ");
}
