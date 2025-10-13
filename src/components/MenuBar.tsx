"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaUserCircle } from "react-icons/fa";

export default function MenuBar() {
    const router = useRouter();

    return (
        <div className="w-full bg-white shadow-sm fixed top-0 left-0 z-50 flex items-center justify-between px-6 py-2">
            {/* โลโก้ทางซ้าย */}
            <div
                onClick={() => router.push("/dashboard")} // ✅ เพิ่มคลิกให้โลโก้
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
                className="relative w-10 h-10 flex items-center justify-center rounded-full bg-[#f5f5f5] hover:bg-[#eaeaea] transition"
            >
                <FaUserCircle className="text-[#d6a27a] text-3xl" />
            </button>
        </div>
    );
}
