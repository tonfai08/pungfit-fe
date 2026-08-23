"use client";

import { motion } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { FaHome, FaDumbbell, FaImages } from "react-icons/fa";
import { IoFastFoodOutline } from "react-icons/io5";
import { BsThreeDotsVertical } from "react-icons/bs";

export default function BottomMenuBar() {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    { label: "อาหาร", icon: <IoFastFoodOutline />, path: "/meals" },
    { label: "รูปร่าง", icon: <FaImages />, path: "/body-progress" },
    { label: "หน้าหลัก", icon: <FaHome />, path: "/dashboard",isMain:true},
    { label: "ออกกำลังกาย", icon: <FaDumbbell />, path: "/exercise-log" },
    { label: "เพิ่มเติม", icon: <BsThreeDotsVertical />, path: "/profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full flex justify-center bg-white shadow-[0_-1px_10px_rgba(0,0,0,0.05)] z-50">
      <div className="flex flex-1 justify-around items-center h-14 relative mx-4 my-2 max-w-full md:max-w-2xl lg:max-w-3xl xl:max-w-4xl">
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
              className="flex flex-col flex-1 items-center justify-center text-sm transition"
            >
              <div
                className={`relative w-16 h-16 flex items-center justify-center rounded-full transition-colors ${
                  isActive ? "text-accent-hover" : "text-accent hover:text-accent-hover"
                }`}
              >
                {isActive ? (
                  <motion.span
                    layoutId="bottom-nav-active"
                    className="absolute inset-0 rounded-full bg-accent-hover/10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                ) : null}
                <motion.div
                  className="relative text-2xl"
                  animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  {item.icon}
                </motion.div>
              </div>
              <span className="sr-only">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
