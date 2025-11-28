"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaUserCircle } from "react-icons/fa";

export default function MenuBar() {
  const router = useRouter();
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("userProfile");
      if (stored) {
        try {
          const user = JSON.parse(stored);
          if (user?.profile_image) {
            const baseUrl =
              process.env.NEXT_PUBLIC_API_BASE_URL ||
              "https://api.pungfit.life/v1"; // fallback ปลอดภัย
            setProfileImage(`${baseUrl}${user.profile_image}`);
           
            
          }
        } catch (err) {
          console.error("Error parsing userProfile:", err);
        }
      }
    }
  }, []);

  return (
    <div className="w-full bg-white shadow-sm fixed top-0 left-0 z-50 flex items-center justify-between px-6 py-4">
      {/* โลโก้ทางซ้าย */}
      <div
        onClick={() => router.push("/dashboard")}
        className="flex items-center cursor-pointer hover:opacity-80 transition"
      >
        <Image
          src="/logo.png"
          alt="PungFit Logo"
          width={100}
          height={100}
          priority
        />
      </div>

      {/* โปรไฟล์ทางขวา */}
      <button
        onClick={() => router.push("/profile")}
        className="relative w-9 h-9 flex items-center justify-center rounded-full bg-[#f5f5f5] hover:bg-[#eaeaea] overflow-hidden transition"
      >
        {profileImage ? (
          <Image
            src={profileImage}
            alt="Profile Image"
            fill
            sizes="36px"
            className="object-cover"
            onError={() => setProfileImage(null)} // fallback ถ้าโหลด error
          />
        ) : (
          
          <FaUserCircle className="text-[#d6a27a] text-3xl" />
        )}
      </button>
    </div>
  );
}
