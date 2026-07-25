"use client";

import { motion } from "framer-motion";
import { isLoggedIn } from "@/lib/api/auth";
import { getMyGroups } from "@/lib/api/group";
import PageLoader from "@/components/PageLoader";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Group {
  _id: string;
  name: string;
  join_code: string;
  members?: { _id: string }[];
  createdAt: string;
}

export default function GroupPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ โหลดข้อมูลกลุ่มของฉัน
  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }

    const fetchGroups = async () => {
      try {
        const data = await getMyGroups();
        setGroups(data);
      } catch (error) {
        console.error("🚨 Fetch group error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [router]);

  if (loading) return <PageLoader />;

  return (
    <>

      <div className="w-full max-w-full md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto p-4">
        <h1 className="text-xl font-semibold mb-4 text-center text-accent">
          กลุ่มของฉัน
        </h1>

        {groups.length === 0 ? (
          <p className="text-center text-gray-500 mt-8">ยังไม่มีกลุ่ม</p>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {groups.map((group) => (
              <motion.div
                key={group._id}
                variants={staggerItem}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push(`/group/${group._id}`)} // ✅ ไปหน้า detail
                className="bg-white rounded-xl p-4 shadow hover:shadow-md cursor-pointer transition border border-gray-100 hover:border-accent-hover"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-medium text-gray-800">{group.name}</h2>
                  <span className="text-xs text-gray-500">
                    {new Date(group.createdAt).toLocaleDateString("th-TH")}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  สมาชิก {group.members?.length || 0} คน
                </p>
                <p className="text-xs text-gray-400">
                  รหัสเข้าร่วม: {group.join_code}
                </p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </>
  );
}
