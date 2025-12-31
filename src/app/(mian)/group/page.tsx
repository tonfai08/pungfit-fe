"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyGroups } from "@/lib/api/group";
import { isLoggedIn } from "@/lib/api/auth";
import MenuBar from "@/components/MenuBar";
import BottomMenuBar from "@/components/BottomMenuBar";

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

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  return (
    <>

      <div className="max-w-md mx-auto p-4">
        <h1 className="text-xl font-semibold mb-4 text-center text-accent">
          กลุ่มของฉัน
        </h1>

        {groups.length === 0 ? (
          <p className="text-center text-gray-500 mt-8">ยังไม่มีกลุ่ม</p>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <div
                key={group._id}
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
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
