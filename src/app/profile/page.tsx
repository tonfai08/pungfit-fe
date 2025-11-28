"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaUserCircle } from "react-icons/fa";
import MenuBar from "@/components/MenuBar";
import BottomMenuBar from "@/components/BottomMenuBar";
import Modal from "@/components/Modal";
import {
  isLoggedIn,
  updateUser,
  updateDisplayName,
  updateProfileImage,
} from "@/lib/api/auth";

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
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [body, setBody] = useState<UserBody | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [isEditInfoOpen, setIsEditInfoOpen] = useState(false);
  const [isEditImageOpen, setIsEditImageOpen] = useState(false);

  const [newName, setNewName] = useState("");
  const [form, setForm] = useState<UserBody>({
    weight: "",
    height: "",
    bodyFat: "",
    gender: "",
    age: "",
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
      await updateDisplayName(newName);

      const profileData = localStorage.getItem("userProfile");
      if (profileData) {
        const updated = { ...JSON.parse(profileData), display_name: newName };
        localStorage.setItem("userProfile", JSON.stringify(updated));
        setProfile(updated);
      }

      setIsEditNameOpen(false);
      alert("บันทึกชื่อเรียบร้อย");
    } catch (err) {
      console.error(err);
      alert("บันทึกชื่อไม่สำเร็จ");
    }
  };

  // ✅ บันทึกข้อมูลทั่วไป
  const handleSaveInfo = async () => {
    try {
      await updateUser(form);
      localStorage.setItem("userBody", JSON.stringify(form));
      setBody(form);
      setIsEditInfoOpen(false);
      alert("บันทึกข้อมูลเรียบร้อย");
    } catch (err) {
      console.error(err);
      alert("บันทึกข้อมูลไม่สำเร็จ");
    }
  };

  // ✅ อัปโหลดและบันทึกรูปโปรไฟล์
  const handleSaveProfileImage = async () => {
    if (!selectedFile) {
      alert("กรุณาเลือกรูปก่อน");
      return;
    }

    try {
      const res = await updateProfileImage(selectedFile);
      const newImageUrl = res.profile_image;

      const baseUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.pungfit.life/v1";
      const fullUrl = newImageUrl.startsWith("http")
        ? newImageUrl
        : `${baseUrl}${newImageUrl.startsWith("/") ? "" : "/"}${newImageUrl}`;

      // ✅ อัปเดต localStorage
      const userProfile = localStorage.getItem("userProfile");
      if (userProfile) {
        const updated = { ...JSON.parse(userProfile), profile_image: newImageUrl };
        localStorage.setItem("userProfile", JSON.stringify(updated));
        setProfile(updated);
      }

      // ✅ รีเฟรช URL รูปใน state
      setProfileImageUrl(fullUrl);
      setPreviewImage(null);
      setSelectedFile(null);
      setIsEditImageOpen(false);

      alert("อัปเดตรูปโปรไฟล์เรียบร้อย");
    } catch (err) {
      console.error(err);
      alert("อัปเดตรูปโปรไฟล์ไม่สำเร็จ");
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

  if (!profile || !body)
    return <p className="text-center mt-10">กำลังโหลดข้อมูล...</p>;

  return (
    <div className="min-h-screen bg-bg-theme p-4 pt-20">
      <MenuBar />

      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6 text-center">
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
          className="w-full border rounded-md px-3 py-2 mb-4"
        />
        <button
          onClick={handleSaveName}
          className="w-full bg-[#d6a27a] text-white py-2 rounded-md hover:bg-[#c9966f]"
        >
          บันทึก
        </button>
      </Modal>

      {/* ✅ Modal แก้ไขข้อมูลทั่วไป */}
      <Modal
        isOpen={isEditInfoOpen}
        onClose={() => setIsEditInfoOpen(false)}
        title="แก้ไขข้อมูลทั่วไป"
      >
        <div className="space-y-3">
          <input
            type="number"
            placeholder="น้ำหนัก (กก.)"
            value={form.weight}
            onChange={(e) => setForm({ ...form, weight: e.target.value })}
            className="w-full border rounded-md px-3 py-2"
          />
          <input
            type="number"
            placeholder="ส่วนสูง (ซม.)"
            value={form.height}
            onChange={(e) => setForm({ ...form, height: e.target.value })}
            className="w-full border rounded-md px-3 py-2"
          />
          <input
            type="number"
            placeholder="ไขมัน (%)"
            value={form.bodyFat}
            onChange={(e) => setForm({ ...form, bodyFat: e.target.value })}
            className="w-full border rounded-md px-3 py-2"
          />
          <input
            type="number"
            placeholder="อายุ"
            value={form.age}
            onChange={(e) => setForm({ ...form, age: e.target.value })}
            className="w-full border rounded-md px-3 py-2"
          />
          <input
            type="text"
            placeholder="เพศ (ชาย/หญิง)"
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
            className="w-full border rounded-md px-3 py-2"
          />
        </div>
        <button
          onClick={handleSaveInfo}
          className="w-full mt-4 bg-[#d6a27a] text-white py-2 rounded-md hover:bg-[#c9966f]"
        >
          บันทึก
        </button>
      </Modal>

      {/* ✅ Modal เปลี่ยนรูปโปรไฟล์ */}
      <Modal
        isOpen={isEditImageOpen}
        onClose={() => setIsEditImageOpen(false)}
        title="เปลี่ยนรูปโปรไฟล์"
      >
        <div className="flex flex-col items-center space-y-3">
          {previewImage ? (
            <Image
              src={previewImage}
              alt="Preview"
              width={120}
              height={120}
              className="rounded-full object-cover"
            />
          ) : (
            <FaUserCircle className="text-gray-300 text-[120px]" />
          )}

          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full text-sm"
          />
          <button
            onClick={handleSaveProfileImage}
            className="w-full bg-[#d6a27a] text-white py-2 rounded-md hover:bg-[#c9966f]"
          >
            บันทึก
          </button>
        </div>
      </Modal>

      <BottomMenuBar />
    </div>
  );
}
