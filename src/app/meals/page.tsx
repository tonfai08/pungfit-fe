"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import "dayjs/locale/th";
import { isLoggedIn } from "@/lib/api/auth";
import { getMealsForLastDays, createMealRecord } from "@/lib/api/meal";
import MenuBar from "@/components/MenuBar";
import BottomMenuBar from "@/components/BottomMenuBar";
import Modal from "@/components/Modal";

dayjs.locale("th");

interface Meal {
  meal_type: string;
  food_name: string;
  description?: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

interface DayMeal {
  date: string;
  meals: Meal[];
  summary: {
    calories?: number;
    protein?: number;
    fat?: number;
    carbs?: number;
  };
}

export default function MealsPage() {
  const router = useRouter();
  const [data, setData] = useState<DayMeal[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ สำหรับ modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mealForm, setMealForm] = useState({
    meal_type: "",
    food_name: "",
    description: "", // ✅ เพิ่ม description
    calories: "",
    protein: "",
    fat: "",
    carbs: "",
  });

  const fetchMeals = async () => {
    try {
      const res: DayMeal[] = await getMealsForLastDays(7); // ✅ ใส่ type ตรงนี้
      const filtered = res.filter((d) => d.meals && d.meals.length > 0);

      // ✅ เรียงวันใหม่สุดก่อน
      filtered.sort(
        (a: DayMeal, b: DayMeal) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      // ✅ เรียงมื้ออาหารภายในแต่ละวัน
      const mealOrder = ["breakfast", "lunch", "dinner", "snack"];
      filtered.forEach((day: DayMeal) => {
        day.meals.sort(
          (a: Meal, b: Meal) =>
            mealOrder.indexOf(a.meal_type) - mealOrder.indexOf(b.meal_type)
        );
      });

      setData(filtered);
    } catch (err) {
      console.error("❌ Failed to fetch meals:", err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    fetchMeals();
  }, [router]);

  // ✅ ฟังก์ชันเพิ่มมื้ออาหาร
  const handleAddMeal = async () => {
    const { meal_type, food_name, description, calories, protein, fat, carbs } =
      mealForm;
    if (!meal_type || !food_name || !calories)
      return alert("กรุณากรอกข้อมูลให้ครบถ้วน");

    try {
      await createMealRecord({
        date: dayjs().format("YYYY-MM-DD"),
        meal_type,
        food_name,
        description, // ✅ ส่งรายละเอียดไปด้วย
        calories: Number(calories),
        protein: Number(protein),
        fat: Number(fat),
        carbs: Number(carbs),
      });

      setIsModalOpen(false);
      setMealForm({
        meal_type: "",
        food_name: "",
        description: "",
        calories: "",
        protein: "",
        fat: "",
        carbs: "",
      });
      await fetchMeals();
    } catch (err) {
      console.error(err);
      alert("บันทึกไม่สำเร็จ");
    }
  };

  if (loading) return <p className="text-center mt-10">กำลังโหลดข้อมูล...</p>;

  return (
    <div className="min-h-screen bg-bg-theme p-4 py-22">
      <MenuBar />

      {/* 🔹 ปุ่มเพิ่มมื้ออาหาร */}
      <div className="flex justify-end mb-2">
        <button
          className="bg-white text-accent px-6 py-2 rounded-lg shadow hover:bg-accent transition"
          onClick={() => setIsModalOpen(true)}
        >
          + เพิ่มมื้ออาหาร
        </button>
      </div>

      {/* 🔹 แสดงรายการย้อนหลัง */}
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow p-4">
        <h1 className="text-xl font-semibold text-center mb-4">
          บันทึกอาหารย้อนหลัง 7 วัน
        </h1>

        {data.map((day) => (
          <div
            key={day.date}
            className="border-b border-gray-200 pb-4 mb-4 last:border-0 last:pb-0"
          >
            <h2 className="font-medium text-accent text-lg mb-2">
              📅 {dayjs(day.date).format("DD MMM YYYY")}
              {day.date === dayjs().format("YYYY-MM-DD") && (
                <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                  วันนี้
                </span>
              )}
            </h2>

            <ul className="space-y-2">
              {day.meals.map((meal, i) => (
                <li
                  key={i}
                  className="flex flex-col sm:flex-row sm:justify-between border rounded-lg px-3 py-2 bg-gray-50"
                >
                  <div>
                    <span className="font-medium">{meal.food_name}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({meal.meal_type})
                    </span>
                    {meal.description && (
                      <p className="text-xs text-gray-500 mt-1">
                        {meal.description}
                      </p>
                    )}
                  </div>
                  <span className="text-sm text-gray-700">
                    {meal.calories} kcal |{" "}
                    <span className="text-blue-500">
                      P {meal.protein.toFixed(0)}
                    </span>{" "}
                    <span className="text-yellow-500">
                      F {meal.fat.toFixed(0)}
                    </span>{" "}
                    <span className="text-green-500">
                      C {meal.carbs.toFixed(0)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-2 text-sm text-gray-700 font-medium">
              รวมวันนี้:{" "}
              <span className="text-orange-600">
                {day.summary?.calories?.toFixed(0) || 0} kcal
              </span>{" "}
              | P {day.summary?.protein?.toFixed(0) || 0} | F{" "}
              {day.summary?.fat?.toFixed(0) || 0} | C{" "}
              {day.summary?.carbs?.toFixed(0) || 0}
            </div>
          </div>
        ))}
      </div>

      {/* ✅ Modal เพิ่มมื้ออาหาร */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="เพิ่มมื้ออาหาร"
      >
        <div className="space-y-3">
          <select
            value={mealForm.meal_type}
            onChange={(e) =>
              setMealForm({ ...mealForm, meal_type: e.target.value })
            }
            className="w-full border rounded-md px-3 py-2"
          >
            <option value="">เลือกมื้ออาหาร</option>
            <option value="breakfast">มื้อเช้า</option>
            <option value="lunch">มื้อกลางวัน</option>
            <option value="dinner">มื้อเย็น</option>
            <option value="snack">ของว่าง</option>
          </select>

          <input
            type="text"
            placeholder="ชื่ออาหาร"
            value={mealForm.food_name}
            onChange={(e) =>
              setMealForm({ ...mealForm, food_name: e.target.value })
            }
            className="w-full border rounded-md px-3 py-2"
          />

          {/* ✅ ช่องรายละเอียด */}
          <textarea
            placeholder="รายละเอียด (เช่น ส่วนผสม หรือปริมาณ)"
            value={mealForm.description}
            onChange={(e) =>
              setMealForm({ ...mealForm, description: e.target.value })
            }
            rows={3}
            className="w-full border rounded-md px-3 py-2 resize-none"
          ></textarea>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="พลังงาน (kcal)"
              value={mealForm.calories}
              onChange={(e) =>
                setMealForm({ ...mealForm, calories: e.target.value })
              }
              className="border rounded-md px-3 py-2"
            />
            <input
              type="number"
              placeholder="โปรตีน (g)"
              value={mealForm.protein}
              onChange={(e) =>
                setMealForm({ ...mealForm, protein: e.target.value })
              }
              className="border rounded-md px-3 py-2"
            />
            <input
              type="number"
              placeholder="ไขมัน (g)"
              value={mealForm.fat}
              onChange={(e) =>
                setMealForm({ ...mealForm, fat: e.target.value })
              }
              className="border rounded-md px-3 py-2"
            />
            <input
              type="number"
              placeholder="คาร์บ (g)"
              value={mealForm.carbs}
              onChange={(e) =>
                setMealForm({ ...mealForm, carbs: e.target.value })
              }
              className="border rounded-md px-3 py-2"
            />
          </div>

          <button
            onClick={handleAddMeal}
            className="w-full bg-[#d6a27a] text-white py-2 rounded-md hover:bg-[#c9966f]"
          >
            บันทึก
          </button>
        </div>
      </Modal>

      <BottomMenuBar />
    </div>
  );
}
