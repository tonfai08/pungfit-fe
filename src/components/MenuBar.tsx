"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaUserCircle } from "react-icons/fa";

export default function MenuBar() {
  const router = useRouter();
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    const loadProfileImage = () => {
      const stored = localStorage.getItem("userProfile");
      if (!stored) {
        setProfileImage(null);
        return;
      }

      try {
        const user = JSON.parse(stored);
        if (!user?.profile_image) {
          setProfileImage(null);
          return;
        }

        const baseUrl =
          process.env.NEXT_PUBLIC_API_BASE_URL ||
          "https://api.pungfit.life/v1";
        const imageUrl = user.profile_image.startsWith("http")
          ? user.profile_image
          : `${baseUrl}${user.profile_image.startsWith("/") ? "" : "/"}${user.profile_image}`;
        const version = user.profile_image_updated_at;

        setProfileImage(version ? `${imageUrl}?v=${version}` : imageUrl);
      } catch (err) {
        console.error("Error parsing userProfile:", err);
      }
    };

    loadProfileImage();
    window.addEventListener("userProfileUpdated", loadProfileImage);
    window.addEventListener("storage", loadProfileImage);

    return () => {
      window.removeEventListener("userProfileUpdated", loadProfileImage);
      window.removeEventListener("storage", loadProfileImage);
    };
  }, []);

  return (
    <div className="fixed left-0 top-0 z-50 flex w-full items-center justify-between bg-white px-6 py-4 shadow-sm">
      <button
        type="button"
        onClick={() => router.push("/dashboard")}
        className="flex items-center transition hover:opacity-80"
        aria-label="หน้าหลัก"
      >
        <Image
          src="/logo.png"
          alt="PungFit Logo"
          width={100}
          height={100}
          priority
        />
      </button>

      <button
        type="button"
        onClick={() => router.push("/profile")}
        className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#f5f5f5] transition hover:bg-[#eaeaea]"
        aria-label="โปรไฟล์"
      >
        {profileImage ? (
          <Image
            src={profileImage}
            alt="Profile Image"
            fill
            sizes="36px"
            className="object-cover"
            onError={() => setProfileImage(null)}
          />
        ) : (
          <FaUserCircle className="text-3xl text-[#d6a27a]" />
        )}
      </button>
    </div>
  );
}
