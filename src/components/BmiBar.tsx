"use client";

import { useEffect, useState } from "react";

interface BmiBarProps {
    weight: number; // kg
    height: number; // cm
}

export default function BmiBar({ weight, height }: BmiBarProps) {
    const [arrowPos, setArrowPos] = useState(50);

    // ✅ คำนวณ BMI
    const heightM = height / 100;
    const bmi = weight / (heightM * heightM);

    // ✅ ช่วงค่า BMI (จาก WHO)
    const bmiRanges = [
        { label: "Underweight", min: 0, max: 18.4, color: "#60A5FA" }, // ฟ้า
        { label: "Healthy", min: 18.5, max: 24.9, color: "#34D399" },   // เขียว
        { label: "Overweight", min: 25, max: 29.9, color: "#FBBF24" }, // เหลือง
        { label: "Obese", min: 30, max: 34.9, color: "#F97316" },      // ส้ม
        { label: "Extremely Obese", min: 35, max: 100, color: "#EF4444" }, // แดง
    ];

    // ✅ หาช่วงที่อยู่
    const currentRange = bmiRanges.find(r => bmi >= r.min && bmi <= r.max);

    // ✅ แปลงค่า BMI เป็นตำแหน่งเปอร์เซ็นต์ (0–100%)
    const bmiMin = 10;
    const bmiMax = 40;
    const finalPos = Math.min(Math.max(((bmi - bmiMin) / (bmiMax - bmiMin)) * 100, 0), 100);

    useEffect(() => {
        const timer = setTimeout(() => setArrowPos(finalPos), 100); // เริ่มเลื่อนหลัง mount นิดหน่อย
        return () => clearTimeout(timer);
    }, [finalPos]);
    if (!weight || !height) return null;
    
    return (
        <div className="w-full max-w-md mt-8">
            <h2 className="text-lg font-semibold mb-2 text-center">
                BMI: {bmi.toFixed(1)}{" "}
                <span className="text-sm text-gray-600">
                    ({currentRange?.label || "N/A"})
                </span>
            </h2>

            {/* 🔹 Bar */}
            <div className="relative h-6 w-full rounded-full overflow-hidden flex">
                {bmiRanges.map((range, index) => (
                    <div
                        key={index}
                        className="h-full position"
                        style={{
                            width: `${100 / bmiRanges.length}%`,
                            backgroundColor: range.color,
                        }}
                    >

                    </div>

                ))}

                {/* 🔹 ลูกศรชี้ตำแหน่ง */}
                <div
                    className="absolute top-4 left-0 -translate-x-1/2 z-10 transition-all duration-2000 ease-out"
                    style={{ left: `${arrowPos}%` }}
                >
                    <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-transparent border-b-black mx-auto"></div>
                </div>
            </div>

            {/* 🔹 Label ด้านล่าง */}
            {/* <div className="flex justify-between text-[10px] mt-1 p-1">
        {bmiRanges.map((range) => (
          <span key={range.label} className="text-gray-700">
            {range.label}
          </span>
        ))}
      </div> */}
        </div>
    );
}
