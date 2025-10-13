"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn, logout, getUserProfile } from "@/lib/auth";
import CompleteProfileForm from "@/components/CompleteProfileForm";
import BmiBar from "@/components/BmiBar";
import ProfileStatCard from "@/components/ProfileStatCard";
import MenuBar from "@/components/MenuBar";
import BottomMenuBar from "@/components/BottomMenuBar";

interface Profile {
  weight?: number | string;
  height?: number | string;
  bodyFat?: number | string;
  gender?: string;
  age?: number | string;
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

        localStorage.setItem(
          "userProfile",
          JSON.stringify({
            weight: data.weight_kg || "",
            height: data.height_cm || "",
            bodyFat: data.body_fat_percent || "",
            gender: data.gender || "",
            age: data.age || "",
          })
        );
        const profileRaw = localStorage.getItem("userProfile");
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
  const { weight, height, bodyFat, gender, age } = profile;
  const isComplete = weight && height && bodyFat && gender && age;
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
    <div className="font-roboto min-h-screen h-full bg-bg-theme flex flex-col pt-18 p-4 items-center gap-2">
      <MenuBar />
      <ProfileStatCard
        weight={profile.weight}
        height={profile.height}
        bodyFat={profile.bodyFat}
        gender={profile.gender}
        age={profile.age}
      />

      <div className='bg-white w-full max-w-full md:max-w-2/4 mt-4 p-4 rounded-lg flex flex-col p-4 items-center'>
        <div className="mb-4 w-full"> <BmiBar weight={Number(weight)} height={Number(height)} /></div>
      </div>
      <button
        onClick={() => {
          logout();
          router.push("/login");
        }}
        className="mt-6 bg-gray-800 text-white px-4 py-2 rounded-lg"
      >
        Logout
      </button>
      <BottomMenuBar />
    </div>
  );
}
