"use client";

import { useRouter, usePathname } from "next/navigation";
import { FaHome, FaChartLine, FaUsers } from "react-icons/fa";
import { IoFastFoodOutline } from "react-icons/io5";
import { BsThreeDotsVertical } from "react-icons/bs";

export default function BottomMenuBar() {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    { label: "หน้าหลัก", icon: <FaHome />, path: "/dashboard"},
    { label: "อาหาร", icon: <IoFastFoodOutline />, path: "/meals" },
    { label: "กลุ่ม", icon: <FaUsers />, path: "/group" }, // ✅ เมนูกลาง
    { label: "น้ำหนัก", icon: <FaChartLine />, path: "/weight" },
    { label: "เพิ่มเติม", icon: <BsThreeDotsVertical />, path: "/more" },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white shadow-[0_-1px_10px_rgba(0,0,0,0.05)] z-50">
      <div className="flex justify-around items-center h-16 relative">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;

          // ✅ ถ้าเป็นปุ่มหลักตรงกลาง (กลุ่ม)
          // if (item.isMain) {
          //   return (
          //     <button
          //       key={item.path}
          //       onClick={() => router.push(item.path)}
          //       className={`absolute -top-4 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full flex flex-col items-center justify-center shadow-lg transition-all
          //         ${
          //           isActive
          //             ? "bg-accent-hover text-white"
          //             : "bg-accent text-white hover:bg-accent-hover"
          //         }`}
          //     >
          //       <div className="text-xl">{item.icon}</div>
          //       <span className="text-[10px] mt-0.5">{item.label}</span>
          //     </button>
          //   );
          // }

          // ✅ ปุ่มอื่น ๆ รอบข้าง
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className="flex flex-col items-center justify-center text-sm transition"
            >
              <div
                className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${
                  isActive
                    ? "bg-accent-hover/10 text-accent-hover"
                    : "text-accent hover:text-accent-hover"
                }`}
              >
                <div className="text-lg">{item.icon}</div>
              </div>
              <span
                className={`text-xs mt-1 ${
                  isActive ? "text-accent-hover" : "text-accent"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
