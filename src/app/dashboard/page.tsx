"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn, logout, getUserProfile } from "@/lib/api/auth";
import CompleteProfileForm from "@/components/CompleteProfileForm";
import BmiBar from "@/components/BmiBar";
import ProfileStatCard from "@/components/ProfileStatCard";
import MenuBar from "@/components/MenuBar";
import BottomMenuBar from "@/components/BottomMenuBar";
import DailyNutritionProgress from "@/components/DailyNutritionProgress";

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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const data = await getUserProfile();

        localStorage.setItem("userProfile", JSON.stringify({
          email: data.email || "",
          display_name: data.display_name || "",
          last_login: data.last_login || "",
          profile_image: data.profile_image || "",
        }));
        localStorage.setItem(
          "userBody",
          JSON.stringify({
            weight: data.weight_kg || "",
            height: data.height_cm || "",
            bodyFat: data.body_fat_percent || "",
            gender: data.gender || "",
            age: data.age || "",
            bmr: data.bmr || "",
            activity_level: data.activity_level || "",
            tdee: data.tdee || null,
          })
        );
        const profileRaw = localStorage.getItem("userBody");
        const profileParse = profileRaw ? JSON.parse(profileRaw) : {};
        setProfile(profileParse);


      } catch (e) {
        console.error("Failed to fetch profile:", e);
        logout();
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (!profile) return null;
  const { weight, height, bodyFat, gender, age ,activity_level} = profile;
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
      <BottomMenuBar />
    </div>
  );
}
