"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn, logout } from "@/lib/api/auth";
import { useAppSelector } from "@/lib/hooks";
import { getWeightHistory, updateWeightToday } from "@/lib/api/weight";
import CompleteProfileForm from "@/components/CompleteProfileForm";
import BmiBar from "@/components/BmiBar";
import ProfileStatCard from "@/components/ProfileStatCard";
import DailyNutritionProgress from "@/components/DailyNutritionProgress";
import WeightChart, { type WeightRecordPoint } from "@/components/WeightChart";
import Modal from "@/components/Modal";

interface Profile {
  weight?: number | string;
  height?: number | string;
  bodyFat?: number | string;
  gender?: string;
  age?: number | string;
  bmr?: number | string;
  activity_level?: string;
  tdee?: {
    calories?: number;
    protein?: number;
    fat?: number;
    carbs?: number;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: userProfile, loading, error } = useAppSelector((state) => state.userProfile);
  const [weightData, setWeightData] = useState<WeightRecordPoint[]>([]);
  const [weightLoading, setWeightLoading] = useState(true);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [newWeight, setNewWeight] = useState("");

  const fetchWeight = async () => {
    setWeightLoading(true);
    try {
      const records = await getWeightHistory(10);
      const formatted = records.map((r: WeightRecordPoint) => ({
        ...r,
        date: new Date(r.date).toLocaleDateString("en-US", {
          day: "2-digit",
          month: "short",
        }),
      }));
      setWeightData(formatted);
    } catch (err) {
      console.error("Failed to fetch weight history:", err);
    } finally {
      setWeightLoading(false);
    }
  };

  const handleAddWeight = async () => {
    if (!newWeight) return alert("กรุณากรอกน้ำหนักก่อน");
    try {
      await updateWeightToday(Number(newWeight));
      setIsWeightModalOpen(false);
      setNewWeight("");
      await fetchWeight();
    } catch (err) {
      console.error("Failed to update weight:", err);
      alert("บันทึกไม่สำเร็จ");
    }
  };

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }

    fetchWeight();
  }, [router]);

  useEffect(() => {
    if (!error) return;
    console.error("Failed to fetch profile:", error);
    logout();
    router.push("/login");
  }, [error, router]);

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  const profile: Profile | null = userProfile
    ? {
        weight: userProfile.weight_kg ?? "",
        height: userProfile.height_cm ?? "",
        bodyFat: userProfile.body_fat_percent ?? "",
        gender: userProfile.gender ?? "",
        age: userProfile.age ?? "",
        bmr: userProfile.bmr ?? "",
        activity_level: userProfile.activity_level ?? "",
        tdee: userProfile.tdee ?? undefined,
      }
    : null;
  if (!profile) return null;
  const { weight, height, bodyFat, gender, age, activity_level } = profile;
  const isComplete = weight && height && bodyFat && gender && age && activity_level;
  if (!isComplete) {
    return (
      <div className="min-h-screen bg-bg-theme flex flex-col items-center justify-center">
        <CompleteProfileForm
          weight={profile.weight}
          height={profile.height}
          bodyFat={profile.bodyFat}
          gender={profile.gender}
          age={profile.age}
        />
      </div>
    );
  }

  return (
   <>
      <DailyNutritionProgress />
      <ProfileStatCard
        weight={profile.weight}
        height={profile.height}
        bodyFat={profile.bodyFat}
        gender={profile.gender}
        age={profile.age}
        bmr={profile.bmr}
      />

      <div className='bg-white w-full max-w-full md:max-w-2/4 mt-4 p-4 rounded-lg flex flex-col p-4 items-center'>
        <div className="mb-4 w-full"> <BmiBar weight={Number(weight)} height={Number(height)} /></div>
      </div>

      <div className="bg-white w-full max-w-full md:max-w-2/4 mt-4 p-4 rounded-lg flex flex-col items-center gap-3">
        <div className="flex w-full justify-between items-center gap-2">
          <h2 className="text-lg font-semibold">กราฟน้ำหนัก</h2>
          <button
            className="text-sm px-3 py-1 rounded-md border border-accent text-accent hover:bg-accent hover:text-white transition"
            onClick={() => setIsWeightModalOpen(true)}
          >
            + อัปเดตน้ำหนัก
          </button>
        </div>

        {weightLoading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : weightData.length === 0 ? (
          <p className="text-sm text-gray-500">ยังไม่มีข้อมูลน้ำหนัก</p>
        ) : (
          <div className="w-full">
            <WeightChart data={weightData} />
          </div>
        )}
      </div>

      <Modal
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        title="อัปเดตน้ำหนักวันนี้"
      >
        <input
          type="number"
          placeholder="น้ำหนัก (กก.)"
          value={newWeight}
          onChange={(e) => setNewWeight(e.target.value)}
          className="w-full border rounded-md px-3 py-2 mb-4"
        />
        <button
          onClick={handleAddWeight}
          className="w-full bg-[#d6a27a] text-white py-2 rounded-md hover:bg-[#c9966f]"
        >
          บันทึก
        </button>
      </Modal>
    </>
  );
}





