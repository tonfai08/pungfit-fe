"use client";

import React from "react";
import { FaWeight, FaRulerVertical, FaPercentage, FaFireAlt } from "react-icons/fa";
import { useRouter } from "next/navigation";

interface ProfileStatCardProps {
  weight?: number | string;
  height?: number | string;
  bodyFat?: number | string;
  gender?: string;
  age?: number | string;
  bmr?: number | string;
}

export default function ProfileStatCard({
  weight,
  height,
  bodyFat,
  gender,
  age,
  bmr,
}: ProfileStatCardProps) {
  const router = useRouter();
  // ✅ แปลงค่าเป็น number
  // const w = Number(weight);
  // const h = Number(height);
  // const a = Number(age);

  // // ✅ คำนวณ BMR
  // let bmr = 0;
  // if (gender === "male") {
  //   bmr = 10 * w + 6.25 * h - 5 * a + 5;
  // } else if (gender === "female") {
  //   bmr = 10 * w + 6.25 * h - 5 * a - 161;
  // } else {
  //   bmr = 10 * w + 6.25 * h - 5 * a;
  // }

  // ✅ สมมติระดับกิจกรรมปานกลาง (1.55)
  // const TDEE = Math.round(bmr * 1.55);

  return (
    <div className="grid grid-cols-2 gap-3 w-full max-w-full md:max-w-2/4">
      {/* น้ำหนัก */}
      <div
        onClick={() => router.push("/weight")}
        className="bg-white h-[130px] w-full p-4 rounded-lg flex flex-col items-center justify-center shadow hover:shadow-md hover:cursor-pointer transition"
      >
        <FaWeight className="text-accent text-4xl mb-2" />
        <p className="text-sm font-medium text-gray-700">
          น้ำหนัก: {weight ?? "-"} กก.
        </p>
        <p className="text-xs text-gray-500 mt-1">(แตะเพื่อดูประวัติ)</p>
      </div>

      {/* ส่วนสูง */}
      <div className="bg-white h-[130px] w-full p-4 rounded-lg flex flex-col items-center justify-center shadow hover:shadow-md transition">
        <FaRulerVertical className="text-accent text-4xl mb-2" />
        <p className="text-sm font-medium text-gray-700">
          ส่วนสูง: {height ?? "-"} ซม.
        </p>
      </div>

      {/* ไขมัน */}
      <div className="bg-white h-[130px] w-full p-4 rounded-lg flex flex-col items-center justify-center shadow hover:shadow-md transition">
        <FaPercentage className="text-accent text-4xl mb-2" />
        <p className="text-sm font-medium text-gray-700">
          ไขมัน: {bodyFat ?? "-"}%
        </p>
      </div>

      {/* แคลอรี่ต่อวัน */}
      <div className="bg-white h-[130px] w-full p-4 rounded-lg flex flex-col items-center justify-center shadow hover:shadow-md transition">
        <FaFireAlt className="text-accent text-4xl mb-2" />
        <p className="text-sm font-medium text-gray-700 text-center">
          BMR<br />
          <span className="font-semibold text-lg text-gray-800">
            {bmr }
          </span>{" "}
          kcal
        </p>
      </div>
    </div>
  );
}
