"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getGroupDetail } from "@/lib/api/group";
import MenuBar from "@/components/MenuBar";
import BottomMenuBar from "@/components/BottomMenuBar";

interface Member {
  id: string;
  name: string;
  height_cm: number;
  weight_kg: number;
}

interface GroupDetail {
  _id: string;
  name: string;
  join_code: string;
  members: Member[];
}
export default function GroupDetailPage() {
  const { id } = useParams();
//   const router = useRouter();
 const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchDetail = async () => {
      try {
        const data = await getGroupDetail(id as string);
        setGroup(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  if (!group)
    return <p className="text-center mt-10 text-red-500">ไม่พบข้อมูลกลุ่ม</p>;

  return (
    <div className="min-h-screen bg-bg-theme pb-20 pt-16">
      <MenuBar />

      <div className="max-w-md mx-auto p-4">
        <h1 className="text-xl font-semibold text-center text-accent mb-2">
          {group.name}
        </h1>
        <p className="text-center text-sm text-gray-500 mb-4">
          รหัสเข้าร่วม: {group.join_code}
        </p>

        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-medium text-gray-800 mb-3">สมาชิกในกลุ่ม</h2>
          {group.members.length === 0 ? (
            <p className="text-gray-500 text-sm">ยังไม่มีสมาชิก</p>
          ) : (
            <ul className="space-y-2">
              {group.members.map((m: Member) => (
                <li
                  key={m.id}
                  className="flex justify-between items-center text-sm border-b border-gray-100 pb-2"
                >
                  <span>{m.name}</span>
                  <span className="text-gray-500">
                    {m.weight_kg ?? "-"} กก. / {m.height_cm ?? "-"} ซม.
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <BottomMenuBar />
    </div>
  );
}
