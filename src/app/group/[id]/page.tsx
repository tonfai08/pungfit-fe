"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { getGroupDetail } from "@/lib/api/group";
import { getUserProfile, isLoggedIn } from "@/lib/api/auth";
import MenuBar from "@/components/MenuBar";
import BottomMenuBar from "@/components/BottomMenuBar";
import { FaUserCircle } from "react-icons/fa";
import { differenceInMinutes, differenceInHours, differenceInDays } from "date-fns";

interface Member {
  id: string;
  name: string;
  height_cm: number;
  weight_kg: number;
  profile_image?: string;
  last_login?: string;
}

interface GroupDetail {
  _id: string;
  name: string;
  join_code: string;
  members: Member[];
}

export default function GroupDetailPage() {

  function getTimeAgo(thaiDate: string) {
    const now = new Date();
    const last = new Date(thaiDate);

    const mins = differenceInMinutes(now, last);
    if (mins < 60) return `${mins} นาที`;

    const hours = differenceInHours(now, last);
    if (hours < 24) return `${hours} ชั่วโมง`;

    const days = differenceInDays(now, last);
    return `${days} วัน`;
  }

  const router = useRouter();
  const { id } = useParams();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const user = await getUserProfile();
      setCurrentUserId(user.id);

      if (id) {
        const data = await getGroupDetail(id as string);

        // ✅ เรียงให้ user ปัจจุบันอยู่บนสุด
        const sortedMembers = [...data.members].sort((a, b) => {
          if (a.id === user.id) return -1;
          if (b.id === user.id) return 1;
          return 0;
        });

        setGroup({ ...data, members: sortedMembers });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    fetchData();
  }, [id, router]);

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  if (!group)
    return <p className="text-center mt-10 text-red-500">ไม่พบข้อมูลกลุ่ม</p>;

  // ✅ base URL สำหรับรูป
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

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

        <div className="grid grid-cols-2 gap-3 w-full max-w-full md:max-w-2/4">
          {group.members.length === 0 ? (
            <p className="text-gray-500 text-sm">ยังไม่มีสมาชิก</p>
          ) : (
            group.members.map((m: Member) => {
              const imageUrl = m.profile_image
                ? `${baseUrl}${m.profile_image}`
                : null;

              return (
                <div
                  key={m.id}
                  className={`bg-white w-full p-4 rounded-lg flex flex-col gap-2 items-center justify-center shadow hover:shadow-md hover:cursor-pointer transition ${m.id === currentUserId
                      ? "border-2 border-[#d6a27a]"
                      : "border border-gray-100"
                    }`}
                >
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={m.name}
                      width={36}
                      height={36}
                      className="w-9 h-9 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <FaUserCircle className="text-[#d6a27a] text-4xl " />
                  )}

                  <span
                    className={`text-sm ${m.id === currentUserId
                        ? "font-semibold text-[#d6a27a]"
                        : "text-gray-800"
                      }`}
                  >
                    {m.name}
                    {m.id === currentUserId && " (คุณ)"}
                  </span>
                  {m.last_login && (
                    <span className="text-gray-400 text-[11px]">
                      ออนไลน์ล่าสุด {getTimeAgo(m.last_login)}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <BottomMenuBar />
    </div>
  );
}
