"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn, logout } from "@/lib/api/auth";
import { fetchUserProfile } from "@/lib/features/userProfileSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import CompleteProfileForm from "@/components/CompleteProfileForm";
import MenuBar from "@/components/MenuBar";
import BottomMenuBar from "@/components/BottomMenuBar";
import PageLoader from "@/components/PageLoader";
import PageTransition from "@/components/PageTransition";

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

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }

    dispatch(fetchUserProfile());
  }, [router, dispatch]);

  useEffect(() => {
    if (!error) return;
    console.error("Failed to fetch profile:", error);
    logout();
    router.push("/login");
  }, [error, router]);

  if (loading)
    return (
      <div className="font-roboto min-h-screen h-full bg-bg-theme flex flex-col items-center justify-center">
        <PageLoader label="กำลังเตรียมข้อมูลของคุณ..." />
      </div>
    );
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
      <PageTransition>{children}</PageTransition>
      <BottomMenuBar />
    </div>
  );
}
