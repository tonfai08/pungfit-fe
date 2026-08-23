"use client";

import { message } from "antd";
import Modal from "@/components/Modal";
import PageLoader from "@/components/PageLoader";
import {
  createMcpAccessKey,
  disableMcpAccess,
  isLoggedIn,
  updateDisplayName,
  updateProfileImage,
  updateUser,
} from "@/lib/api/auth";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaImages, FaUserCircle } from "react-icons/fa";

async function cropProfileImage(file: File, zoom: number, x: number, y: number) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 800;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Crop failed");
  context.fillStyle = "#000";
  context.fillRect(0, 0, canvas.width, canvas.height);
  const containScale = Math.min(canvas.width / bitmap.width, canvas.height / bitmap.height);
  const drawWidth = bitmap.width * containScale * zoom;
  const drawHeight = bitmap.height * containScale * zoom;
  const drawX = (canvas.width - drawWidth) / 2 + (x / 200) * canvas.width;
  const drawY = (canvas.height - drawHeight) / 2 + (y / 200) * canvas.height;
  context.drawImage(bitmap, drawX, drawY, drawWidth, drawHeight);
  bitmap.close();
  return new Promise<File>((resolve, reject) =>
    canvas.toBlob(
      (blob) => blob ? resolve(new File([blob], "profile.jpg", { type: "image/jpeg" })) : reject(new Error("Crop failed")),
      "image/jpeg",
      0.9
    )
  );
}

interface UserProfile {
  email: string;
  last_login?: string;
  profile_image?: string;
  display_name?: string;
  mcp_enabled?: boolean;
}

interface UserBody {
  weight?: string | number;
  height?: string | number;
  bodyFat?: string | number;
  gender?: string;
  age?: string | number;
  activity_level?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [body, setBody] = useState<UserBody | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [isEditInfoOpen, setIsEditInfoOpen] = useState(false);
  const [isEditImageOpen, setIsEditImageOpen] = useState(false);
  const [isMcpAccessOpen, setIsMcpAccessOpen] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingImage, setSavingImage] = useState(false);
  const [creatingMcpKey, setCreatingMcpKey] = useState(false);
  const [disablingMcp, setDisablingMcp] = useState(false);
  const [confirmDisableMcp, setConfirmDisableMcp] = useState(false);

  const [newName, setNewName] = useState("");
  const [form, setForm] = useState<UserBody>({
    weight: "",
    height: "",
    bodyFat: "",
    gender: "",
    age: "",
    activity_level: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [profileZoom, setProfileZoom] = useState(1);
  const [profileX, setProfileX] = useState(0);
  const [profileY, setProfileY] = useState(0);
  const [mcpAccessKey, setMcpAccessKey] = useState("");

  const updateStoredMcpStatus = (enabled: boolean) => {
    const stored = localStorage.getItem("userProfile");
    const updated = {
      ...(stored ? JSON.parse(stored) : profile || {}),
      mcp_enabled: enabled,
    };
    localStorage.setItem("userProfile", JSON.stringify(updated));
    setProfile(updated);
  };

  const resetMcpAccessModal = () => {
    setIsMcpAccessOpen(false);
    setMcpAccessKey("");
    setConfirmDisableMcp(false);
  };

  const closeMcpAccessModal = () => {
    if (creatingMcpKey || disablingMcp) return;
    resetMcpAccessModal();
  };

  const handleCreateMcpKey = async () => {
    try {
      setCreatingMcpKey(true);
      const result = await createMcpAccessKey();
      setMcpAccessKey(result.access_key);
      updateStoredMcpStatus(true);
      message.success("สร้าง AI Access Key แล้ว กรุณาคัดลอกเก็บไว้ตอนนี้");
    } catch (error) {
      console.error(error);
      message.error(
        error instanceof Error ? error.message : "สร้าง Access Key ไม่สำเร็จ"
      );
    } finally {
      setCreatingMcpKey(false);
    }
  };

  const copyText = async (text: string, successText: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success(successText);
    } catch {
      message.error("คัดลอกไม่สำเร็จ กรุณาเลือกข้อความแล้วคัดลอกเอง");
    }
  };

  const handleDisableMcp = async () => {
    try {
      setDisablingMcp(true);
      await disableMcpAccess();
      updateStoredMcpStatus(false);
      resetMcpAccessModal();
      message.success("ปิดการเชื่อมต่อ AI และยกเลิก Access Key แล้ว");
    } catch (error) {
      console.error(error);
      message.error(
        error instanceof Error ? error.message : "ปิดการเชื่อมต่อไม่สำเร็จ"
      );
    } finally {
      setDisablingMcp(false);
    }
  };

  // ✅ โหลดข้อมูลจาก localStorage
  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }

    const userProfile = localStorage.getItem("userProfile");
    const userBody = localStorage.getItem("userBody");

    if (userProfile) {
      try {
        const user: UserProfile = JSON.parse(userProfile);
        setProfile(user);

        // ตรวจสอบและสร้าง URL รูปเต็ม
        if (user.profile_image) {
          const baseUrl =
            process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.pungfit.life/v1";
          const imageUrl = user.profile_image.startsWith("http")
            ? user.profile_image
            : `${baseUrl}${user.profile_image.startsWith("/") ? "" : "/"}${user.profile_image}`;
          setProfileImageUrl(imageUrl);
        }

        if (user.display_name) setNewName(user.display_name);
      } catch (err) {
        console.error("Error parsing userProfile:", err);
      }
    }

    if (userBody) {
      try {
        const parsed: UserBody = JSON.parse(userBody);
        setBody(parsed);
        setForm(parsed);
      } catch (err) {
        console.error("Error parsing userBody:", err);
      }
    }
  }, [router]);

  // ✅ บันทึกชื่อ
  const handleSaveName = async () => {
    try {
      setSavingName(true);
      await updateDisplayName(newName);

      const profileData = localStorage.getItem("userProfile");
      if (profileData) {
        const updated = { ...JSON.parse(profileData), display_name: newName };
        localStorage.setItem("userProfile", JSON.stringify(updated));
        setProfile(updated);
      }

      setIsEditNameOpen(false);
      message.success("บันทึกชื่อเรียบร้อย");
    } catch (err) {
      console.error(err);
      message.error("บันทึกชื่อไม่สำเร็จ");
    } finally {
      setSavingName(false);
    }
  };

  // ✅ บันทึกข้อมูลทั่วไป
  const handleSaveInfo = async () => {
    try {
      setSavingInfo(true);
      await updateUser(form);
      localStorage.setItem("userBody", JSON.stringify(form));
      setBody(form);
      setIsEditInfoOpen(false);
      message.success("บันทึกข้อมูลเรียบร้อย");
    } catch (err) {
      console.error(err);
      message.error("บันทึกข้อมูลไม่สำเร็จ");
    } finally {
      setSavingInfo(false);
    }
  };

  // ✅ อัปโหลดและบันทึกรูปโปรไฟล์
  const handleSaveProfileImage = async () => {
    if (!selectedFile) {
      message.warning("กรุณาเลือกรูปก่อน");
      return;
    }

    try {
      setSavingImage(true);
      const croppedFile = await cropProfileImage(selectedFile, profileZoom, profileX, profileY);
      const res = await updateProfileImage(croppedFile);
      const newImageUrl = res.profile_image;

      const baseUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.pungfit.life/v1";
      const fullUrl = newImageUrl.startsWith("http")
        ? newImageUrl
        : `${baseUrl}${newImageUrl.startsWith("/") ? "" : "/"}${newImageUrl}`;
      const imageVersion = Date.now();

      // ✅ อัปเดต localStorage
      const userProfile = localStorage.getItem("userProfile");
      if (userProfile) {
        const updated = {
          ...JSON.parse(userProfile),
          profile_image: newImageUrl,
          profile_image_updated_at: imageVersion,
        };
        localStorage.setItem("userProfile", JSON.stringify(updated));
        setProfile(updated);
        window.dispatchEvent(new Event("userProfileUpdated"));
      }

      // ✅ รีเฟรช URL รูปใน state
      setProfileImageUrl(`${fullUrl}${fullUrl.includes("?") ? "&" : "?"}v=${imageVersion}`);
      setPreviewImage(null);
      setSelectedFile(null);
      setIsEditImageOpen(false);

      message.success("อัปเดตรูปโปรไฟล์เรียบร้อย");
    } catch (err) {
      console.error(err);
      message.error("อัปเดตรูปโปรไฟล์ไม่สำเร็จ");
    } finally {
      setSavingImage(false);
    }
  };

  // ✅ แสดง preview เมื่อเลือกรูป
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (previewImage) URL.revokeObjectURL(previewImage);
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
      setProfileZoom(1);
      setProfileX(0);
      setProfileY(0);
    }
  };

  if (!profile || !body) return <PageLoader label="กำลังโหลดข้อมูล..." />;

  return (
    <>
      <div className="w-full max-w-full md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto bg-white rounded-lg shadow p-6 text-center">
        {/* ✅ รูปโปรไฟล์ */}
        <div className="flex flex-col items-center mb-4">
          {profileImageUrl ? (
            <Image
              src={profileImageUrl}
              alt="Profile"
              width={100}
              height={100}
              className="rounded-full object-cover border"
            />
          ) : (
            <FaUserCircle className="text-gray-400 text-[100px]" />
          )}
          <button
            onClick={() => setIsEditImageOpen(true)}
            className="text-sm text-accent hover:underline mt-2"
          >
            เปลี่ยนรูปโปรไฟล์
          </button>
        </div>

        {/* ✅ ชื่อ */}
        <h2 className="text-xl font-semibold mb-2">
          {newName || "ไม่ระบุชื่อ"}
        </h2>
        <button
          onClick={() => setIsEditNameOpen(true)}
          className="text-sm text-accent hover:underline"
        >
          แก้ไขชื่อ
        </button>

        <p className="text-gray-500 text-sm mt-2">{profile.email}</p>
        <p className="text-gray-400 text-xs mt-1">
          เข้าสู่ระบบล่าสุด:{" "}
          {profile.last_login
            ? new Date(profile.last_login).toLocaleString("th-TH")
            : "-"}
        </p>

        {/* ✅ ข้อมูลทั่วไป */}
        <div className="grid grid-cols-2 gap-3 mt-6 text-sm text-gray-700">
          <div className="bg-gray-50 p-3 rounded-md shadow-sm">
            <p>น้ำหนัก</p>
            <p className="font-semibold">{body.weight || "-"} กก.</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-md shadow-sm">
            <p>ส่วนสูง</p>
            <p className="font-semibold">{body.height || "-"} ซม.</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-md shadow-sm">
            <p>ไขมัน</p>
            <p className="font-semibold">{body.bodyFat || "-"}%</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-md shadow-sm">
            <p>อายุ</p>
            <p className="font-semibold">{body.age || "-"} ปี</p>
          </div>
        </div>

        <button
          onClick={() => setIsEditInfoOpen(true)}
          className="mt-6 bg-[#d6a27a] text-white py-2 px-6 rounded-md hover:bg-[#c9966f]"
        >
          แก้ไขข้อมูลทั่วไป
        </button>

        <button
          type="button"
          onClick={() => router.push("/body-progress")}
          className="mt-6 flex w-full items-center gap-4 rounded-2xl border border-accent/25 bg-accent/5 p-4 text-left transition hover:border-accent/50 hover:bg-accent/10"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-white">
            <FaImages />
          </span>
          <span>
            <span className="block font-semibold text-gray-800">ฟิล์มรูปร่างของฉัน</span>
            <span className="mt-1 block text-sm text-gray-500">บันทึกรูปวันละครั้งและดูการเปลี่ยนแปลง</span>
          </span>
        </button>

        <div className="mt-8 rounded-2xl border border-accent/25 bg-accent/5 p-4 text-left sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-800">
                  การเชื่อมต่อ AI
                </h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    profile.mcp_enabled
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {profile.mcp_enabled ? "เปิดใช้งาน" : "ยังไม่เปิดใช้งาน"}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                สร้าง Access Key เพื่อให้ Codex บันทึกการออกกำลังกายให้คุณ
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsMcpAccessOpen(true)}
              className="shrink-0 rounded-lg border border-accent bg-white px-4 py-2 text-sm font-medium text-accent transition hover:bg-accent hover:text-white"
            >
              {profile.mcp_enabled ? "จัดการการเชื่อมต่อ" : "เชื่อมต่อ Codex"}
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isMcpAccessOpen}
        onClose={closeMcpAccessModal}
        title="เชื่อมต่อ Codex กับ PungFit"
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-blue-50 p-3 text-sm text-blue-800">
            สร้างรหัสแล้วนำไปตั้งค่าใน Codex เพียงครั้งเดียว หลังจากนั้นคุณสั่งให้ AI
            บันทึกการออกกำลังกายได้ทันที
          </div>

          {mcpAccessKey ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-green-200 bg-green-50 p-3">
                <p className="font-medium text-green-800">สร้าง Access Key สำเร็จ</p>
                <p className="mt-1 text-xs text-green-700">
                  รหัสนี้จะแสดงเพียงครั้งเดียว ห้ามส่งในแชตหรือให้บุคคลอื่น
                </p>
              </div>
              <div className="break-all rounded-lg border bg-gray-50 p-3 font-mono text-xs text-gray-700">
                {mcpAccessKey}
              </div>
              <button
                type="button"
                onClick={() => copyText(mcpAccessKey, "คัดลอก Access Key แล้ว")}
                className="w-full rounded-lg bg-accent py-2.5 font-medium text-white hover:bg-accent-hover"
              >
                คัดลอก Access Key
              </button>
              <div className="rounded-xl border border-gray-200 p-3 text-sm text-gray-600">
                <p className="font-medium text-gray-800">ขั้นตอนต่อไป</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5">
                  <li>เปิด Codex → Settings → MCP servers</li>
                  <li>เพิ่ม Streamable HTTP server</li>
                  <li>URL: <code>https://api.pungfit.life/mcp</code></li>
                  <li>ใช้ Access Key นี้เป็น Bearer token แล้วเปิด Codex ใหม่</li>
                </ol>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleCreateMcpKey}
              disabled={creatingMcpKey || disablingMcp}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 font-medium text-white transition hover:bg-accent-hover disabled:opacity-60"
            >
              {creatingMcpKey ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : null}
              {creatingMcpKey
                ? "กำลังสร้าง..."
                : profile.mcp_enabled
                  ? "สร้าง Access Key ใหม่"
                  : "สร้าง AI Access Key"}
            </button>
          )}

          {profile.mcp_enabled ? (
            <div className="border-t border-gray-200 pt-4">
              {confirmDisableMcp ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                  <p className="text-sm text-red-700">
                    Access Key จะใช้ไม่ได้ทันที ต้องการปิดต่อหรือไม่?
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmDisableMcp(false)}
                      disabled={disablingMcp}
                      className="flex-1 rounded-lg border border-gray-300 bg-white py-2 text-sm text-gray-700"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      onClick={handleDisableMcp}
                      disabled={disablingMcp}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 py-2 text-sm text-white disabled:opacity-60"
                    >
                      {disablingMcp ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      ) : null}
                      ยืนยันปิด
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDisableMcp(true)}
                  className="w-full py-1 text-sm text-red-600 hover:underline"
                >
                  ปิดการเชื่อมต่อ AI
                </button>
              )}
            </div>
          ) : null}
        </div>
      </Modal>

      {/* ✅ Modal แก้ไขชื่อ */}
      <Modal
        isOpen={isEditNameOpen}
        onClose={() => setIsEditNameOpen(false)}
        title="แก้ไขชื่อผู้ใช้"
      >
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          disabled={savingName}
          className="w-full border rounded-md px-3 py-2 mb-4"
        />
        <button
          onClick={handleSaveName}
          disabled={savingName}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-[#d6a27a] py-2 text-white hover:bg-[#c9966f] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {savingName ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : null}
          {savingName ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </Modal>

      {/* ✅ Modal แก้ไขข้อมูลทั่วไป */}
      <Modal
        isOpen={isEditInfoOpen}
        onClose={() => setIsEditInfoOpen(false)}
        title="แก้ไขข้อมูลทั่วไป"
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">น้ำหนัก (กก.)</label>
            <input
              type="number"
              placeholder="น้ำหนัก (กก.)"
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">ส่วนสูง (ซม.)</label>
            <input
              type="number"
              placeholder="ส่วนสูง (ซม.)"
              value={form.height}
              onChange={(e) => setForm({ ...form, height: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">ไขมัน (%)</label>
            <input
              type="number"
              placeholder="ไขมัน (%)"
              value={form.bodyFat}
              onChange={(e) => setForm({ ...form, bodyFat: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">อายุ</label>
            <input
              type="number"
              placeholder="อายุ"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          <div className="mb-6">
            <label className="block mb-1 font-medium">เพศ</label>
            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              className="border border-accent focus:border-accent-hover focus:ring-1 focus:ring-accent-hover rounded-md w-full px-3 py-2 outline-none bg-white"
              required
            >
              <option value="" disabled>เลือกเพศ</option>
              <option value="male">ชาย</option>
              <option value="female">หญิง</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block mb-1 font-medium">ระดับกิจกรรม</label>
            <select
              value={form.activity_level || ""}
              onChange={(e) => setForm({ ...form, activity_level: e.target.value })}
              className="border border-accent focus:border-accent-hover focus:ring-1 focus:ring-accent-hover rounded-md w-full px-3 py-2 outline-none bg-white"
              required
            >
              <option value="" disabled>เลือกระดับกิจกรรม</option>
              <option value="sedentary">นั่งทำงาน / ไม่ออกกำลังกาย</option>
              <option value="light">ออกกำลังกายเล็กน้อย (1–3 วัน/สัปดาห์)</option>
              <option value="moderate">ออกกำลังกายปานกลาง (3–5 วัน/สัปดาห์)</option>
              <option value="active">ออกกำลังกายหนัก (6–7 วัน/สัปดาห์)</option>
              <option value="very_active">ออกกำลังกายหนักมาก / ใช้แรงงาน</option>
            </select>
          </div>
        </div>
        <button
          onClick={handleSaveInfo}
          disabled={savingInfo}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-[#d6a27a] py-2 text-white hover:bg-[#c9966f] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {savingInfo ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : null}
          {savingInfo ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </Modal>


      <Modal
        isOpen={isEditImageOpen}
        onClose={() => {
          if (savingImage) return;
          setIsEditImageOpen(false);
          setSelectedFile(null);
          if (previewImage) URL.revokeObjectURL(previewImage);
          setPreviewImage(null);
        }}
        title="เปลี่ยนรูปโปรไฟล์"
      >
        <div className="flex flex-col items-center space-y-3">
          <label htmlFor="profile-image-input" className="cursor-pointer">
            {previewImage ? (
              <div className="h-[240px] w-[240px] overflow-hidden rounded-full bg-black ring-2 ring-[#d6a27a]">
              <img
                src={previewImage}
                alt="ตัวอย่างรูปโปรไฟล์"
                className="h-full w-full object-contain"
                style={{ transform: `translate(${profileX / 2}%, ${profileY / 2}%) scale(${profileZoom})` }}
              />
              </div>
            ) : (
              <FaUserCircle className="text-gray-300 text-[120px] transition hover:text-gray-400" />
            )}
          </label>
          <input
            id="profile-image-input"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={savingImage}
            className="sr-only"
          />
          <span className="text-xs text-gray-500">แตะที่รูปเพื่อเลือกไฟล์</span>
          {previewImage ? (
            <div className="w-full space-y-2 text-left text-sm text-gray-600">
              <label className="block">ซูม
                <input className="block w-full accent-[#d6a27a]" type="range" min="1" max="2" step="0.05" value={profileZoom} onChange={(e) => setProfileZoom(Number(e.target.value))} />
              </label>
              <label className="block">ซ้าย–ขวา
                <input className="block w-full accent-[#d6a27a]" type="range" min="-100" max="100" value={profileX} onChange={(e) => setProfileX(Number(e.target.value))} />
              </label>
              <label className="block">บน–ล่าง
                <input className="block w-full accent-[#d6a27a]" type="range" min="-100" max="100" value={profileY} onChange={(e) => setProfileY(Number(e.target.value))} />
              </label>
            </div>
          ) : null}
          <button
            onClick={handleSaveProfileImage}
            disabled={savingImage}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[#d6a27a] py-2 text-white hover:bg-[#c9966f] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {savingImage ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : null}
            {savingImage ? "กำลังอัปโหลด..." : "บันทึก"}
          </button>
        </div>
      </Modal>

     </>
  );
}
