"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn, logout } from "@/lib/api/auth";
import { fetchUserProfile } from "@/lib/features/userProfileSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { getWeightHistory, updateWeightToday } from "@/lib/api/weight";
import CompleteProfileForm from "@/components/CompleteProfileForm";
import BmiBar from "@/components/BmiBar";
import ProfileStatCard from "@/components/ProfileStatCard";
import MenuBar from "@/components/MenuBar";
import BottomMenuBar from "@/components/BottomMenuBar";
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
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const dispatch = useAppDispatch();
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

    dispatch(fetchUserProfile());
    fetchWeight();
  }, [router, dispatch]);

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
    <div className="font-roboto min-h-screen h-full bg-bg-theme flex flex-col py-22 p-4 items-center gap-2">
      <MenuBar />
      <>{children}</>
      <BottomMenuBar />
    </div>
  );
}



