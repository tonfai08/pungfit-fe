"use client";

import { useEffect, useState } from "react";
import { getMealsByDate } from "@/lib/api/meal";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import dayjs from "dayjs";

interface Nutrient {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
}

export default function DailyNutritionProgress() {
    const [summary, setSummary] = useState<Nutrient | null>(null);
    const [tdee, setTdee] = useState<Nutrient | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userRaw = localStorage.getItem("userBody");
                if (!userRaw) return;
                const user = JSON.parse(userRaw);
                if (user?.tdee) setTdee(user.tdee);

                const today = dayjs().format("YYYY-MM-DD");
                const data = await getMealsByDate(today);
                setSummary(data.summary || null);
            } catch (err) {
                console.error("❌ Failed to fetch meal summary:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <p className="text-sm text-gray-500">กำลังโหลดข้อมูล...</p>;
    if (!summary || !tdee) return null;

    const calcPercent = (value: number, target: number) =>
        Math.min((value / target) * 100, 100);

    const progress = {
        calories: calcPercent(summary.calories, tdee.calories),
        protein: calcPercent(summary.protein, tdee.protein),
        fat: calcPercent(summary.fat, tdee.fat),
        carbs: calcPercent(summary.carbs, tdee.carbs),
    };

    return (
        <div className="bg-white w-full md:max-w-2/4 rounded-xl flex flex-col align-items-center; justify-center p-4 mb-2">
            <h1 className="text-xl mb-4">สารอารหารวันนี้</h1>
        <div className="w-full grid grid-cols-2 gap-4">
            {/* 🔵 วงกลมฝั่งซ้าย (พลังงานรวม) */}
            <div className="w-36 h-36 relative flex flex-col items-center justify-center">
                <CircularProgressbar
                    value={progress.calories}
                    styles={buildStyles({
                        pathColor: "#f97316",
                        trailColor: "#eee",
                        textColor: "#333",
                        strokeLinecap: "round",
                    })}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-gray-700">
                        {summary.calories.toFixed(0)}
                    </span>
                    <span className="text-xs text-gray-500">/ {tdee.calories} kcal</span>
                </div>
            </div>

            {/* 🟩 แถบ progress ฝั่งขวา */}
            <div className="flex-1 w-full space-y-4">
                {[
                    { label: "โปรตีน", key: "protein", color: "bg-blue-500" },
                    { label: "ไขมัน", key: "fat", color: "bg-yellow-400" },
                    { label: "คาร์บ", key: "carbs", color: "bg-green-500" },
                ].map((item) => {
                    const value = summary[item.key as keyof Nutrient] || 0;
                    const goal = tdee[item.key as keyof Nutrient] || 1;
                    const percent = calcPercent(value, goal);

                    return (
                        <div key={item.key}>
                            <div className="flex justify-between mb-1 text-sm text-gray-600">
                                <span>{item.label}</span>
                                <span>
                                    {value.toFixed(0)} / {goal} g
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                                <div
                                    className={`${item.color} h-3 rounded-full transition-all duration-500`}
                                    style={{ width: `${percent}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
        </div>
    );
}
