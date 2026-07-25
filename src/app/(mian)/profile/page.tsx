"use client";

import { message } from "antd";
import Modal from "@/components/Modal";
import PageLoader from "@/components/PageLoader";
import {
  isLoggedIn,
  updateDisplayName,
  updateProfileImage,
  updateUser,
} from "@/lib/api/auth";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaUserCircle } from "react-icons/fa";

interface UserProfile {
  email: string;
  last_login?: string;
  profile_image?: string;
  display_name?: string;
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
  const [savingName, setSavingName] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingImage, setSavingImage] = useState(false);

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
      const res = await updateProfileImage(selectedFile);
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
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
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
      </div>

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
        onClose={() => setIsEditImageOpen(false)}
        title="เปลี่ยนรูปโปรไฟล์"
      >
        <div className="flex flex-col items-center space-y-3">
          <label htmlFor="profile-image-input" className="cursor-pointer">
            {previewImage ? (
              <Image
                src={previewImage}
                alt="Preview"
                width={120}
                height={120}
                className="rounded-full object-cover h-[120px] w-[120px] ring-1 ring-transparent transition hover:ring-[#d6a27a]"
              />
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
