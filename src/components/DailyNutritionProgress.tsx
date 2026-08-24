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
    const [animatedProgress, setAnimatedProgress] = useState<Nutrient>({
        calories: 0, protein: 0, fat: 0, carbs: 0,
    });

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

    useEffect(() => {
        if (!summary || !tdee) return;
        const calc = (value: number, target: number) => target > 0
            ? Math.min((value / target) * 100, 100)
            : 0;
        setAnimatedProgress({ calories: 0, protein: 0, fat: 0, carbs: 0 });
        const frame = requestAnimationFrame(() => requestAnimationFrame(() => {
            setAnimatedProgress({
                calories: calc(summary.calories, tdee.calories),
                protein: calc(summary.protein, tdee.protein),
                fat: calc(summary.fat, tdee.fat),
                carbs: calc(summary.carbs, tdee.carbs),
            });
        }));
        return () => cancelAnimationFrame(frame);
    }, [summary, tdee]);

    if (loading) return <p className="text-sm text-gray-500">กำลังโหลดข้อมูล...</p>;
    if (!summary || !tdee) return null;

    return (
        <div className="bg-white w-full w-full max-w-full md:max-w-2xl lg:max-w-3xl xl:max-w-4xl rounded-xl flex flex-col align-items-center; justify-center p-4 mb-2">
            <h1 className="text-xl mb-4">สารอารหารวันนี้</h1>
        <div className="w-full grid grid-cols-2 gap-4">
            {/* 🔵 วงกลมฝั่งซ้าย (พลังงานรวม) */}
            <div className="w-36 h-36 relative flex flex-col items-center justify-center">
                <CircularProgressbar
                    value={animatedProgress.calories}
                    styles={buildStyles({
                        pathColor: "#f97316",
                        trailColor: "#eee",
                        textColor: "#333",
                        strokeLinecap: "round",
                        pathTransitionDuration: 1.2,
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
                    const percent = animatedProgress[item.key as keyof Nutrient];

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
                                    className={`${item.color} h-3 rounded-full transition-[width] duration-[1200ms] ease-out`}
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
