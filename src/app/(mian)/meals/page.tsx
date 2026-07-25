"use client";

import { motion } from "framer-motion";
import { message } from "antd";
import Modal from "@/components/Modal";
import PageLoader from "@/components/PageLoader";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { isLoggedIn } from "@/lib/api/auth";
import { analyzeFoodImage, getFoodByBarcode, type Food } from "@/lib/api/food";
import {
  createMealRecord,
  deleteMealRecord,
  getMealsForLastDays,
} from "@/lib/api/meal";
import dayjs from "dayjs";
import "dayjs/locale/th";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import {
  BarcodeFormat,
  BarcodeScanner,
  type DetectedBarcode,
} from "react-barcode-scanner";
import "react-barcode-scanner/polyfill";
import {
  FaAlignLeft,
  FaBarcode,
  FaCalendarAlt,
  FaCamera,
  FaFire,
  FaPlus,
  FaTag,
  FaTrash,
  FaUtensils,
} from "react-icons/fa";

dayjs.locale("th");

interface Meal {
  _id?: string;
  id?: string;
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
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [mealForm, setMealForm] = useState({
    date: dayjs().format("YYYY-MM-DD"),
    meal_type: "",
    food_name: "",
    description: "", // ✅ เพิ่ม description
    calories: "",
    protein: "",
    fat: "",
    carbs: "",
  });
  const [scanInput, setScanInput] = useState("");
  const [scanError, setScanError] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [imageAnalyzeError, setImageAnalyzeError] = useState("");
  const [imageAnalyzing, setImageAnalyzing] = useState(false);
  const [mealSaving, setMealSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    name?: string;
  } | null>(null);
  const scanAppliedRef = useRef(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

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

  useEffect(() => {
    if (!isScanModalOpen) return;
    scanAppliedRef.current = false;
    setCameraError("");
    setScanError("");
    if (
      typeof navigator !== "undefined" &&
      !navigator.mediaDevices?.getUserMedia
    ) {
      setCameraError("อุปกรณ์นี้ไม่รองรับการเปิดกล้อง ใช้กรอกรหัสด้วยตนเองแทนได้");
    }
  }, [isScanModalOpen]);


  // ✅ ฟังก์ชันเพิ่มมื้ออาหาร
  const handleAddMeal = async () => {
    const {
      date,
      meal_type,
      food_name,
      description,
      calories,
      protein,
      fat,
      carbs,
    } = mealForm;
    if (!date || !meal_type || !food_name || !calories)
      return message.warning("กรุณากรอกข้อมูลให้ครบถ้วน");

    try {
      setMealSaving(true);
      await createMealRecord({
        date,
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
        date: dayjs().format("YYYY-MM-DD"),
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
      message.error("บันทึกไม่สำเร็จ");
    } finally {
      setMealSaving(false);
    }
  };

  const applyFoodToForm = (food: Partial<Food>, barcode: string) => {
    setMealForm((prev) => ({
      ...prev,
      meal_type: prev.meal_type || "snack",
      food_name: food.food_name || prev.food_name || "อาหารที่สแกน",
      description:
        food.description ||
        prev.description ||
        (food.brand ? `แบรนด์ ${food.brand}` : `บาร์โค้ด ${barcode}`),
      calories: (food.calories ?? prev.calories ?? "").toString(),
      protein: (food.protein ?? prev.protein ?? "").toString(),
      fat: (food.fat ?? prev.fat ?? "").toString(),
      carbs: (food.carbs ?? prev.carbs ?? "").toString(),
    }));
    setIsScanModalOpen(false);
    setIsModalOpen(true);
    setScanInput("");
    setScanError("");
  };

  const applyAnalyzedFoodToForm = (food: Partial<Food>) => {
    setMealForm((prev) => ({
      ...prev,
      meal_type: prev.meal_type || "snack",
      food_name: food.food_name || prev.food_name || "",
      description: food.description || prev.description || "ประเมินจากรูปภาพ",
      calories: (food.calories ?? prev.calories ?? "").toString(),
      protein: (food.protein ?? prev.protein ?? "").toString(),
      fat: (food.fat ?? prev.fat ?? "").toString(),
      carbs: (food.carbs ?? prev.carbs ?? "").toString(),
    }));
    setIsModalOpen(true);
    setImageAnalyzeError("");
  };

  const handleFoodImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImageAnalyzing(true);
      setImageAnalyzeError("");
      const food = await analyzeFoodImage(file);
      if (!food) {
        setImageAnalyzeError("ไม่พบข้อมูลจากรูปภาพนี้");
        return;
      }
      applyAnalyzedFoodToForm(food);
    } catch (err) {
      console.error("Failed to analyze food image:", err);
      setImageAnalyzeError("วิเคราะห์รูปอาหารไม่สำเร็จ");
    } finally {
      setImageAnalyzing(false);
      e.target.value = "";
    }
  };

  const handleScanResult = async (code?: string) => {
    const barcode = (code || scanInput).trim();
    if (!barcode) {
      setScanError("กรุณากรอกหรือสแกนบาร์โค้ด");
      return false;
    }

    try {
      const food = await getFoodByBarcode(barcode);
      if (food) {
        applyFoodToForm(food, barcode);
        return true;
      }
      setScanError("ไม่พบบาร์โค้ดนี้ในระบบ ลองใหม่หรือปิดหน้าต่าง");
      return false;
    } catch (err) {
      console.error("โหลดข้อมูลอาหารจากบาร์โค้ดไม่สำเร็จ", err);
      setScanError("โหลดข้อมูลจากบาร์โค้ดไม่สำเร็จ ลองใหม่หรือกรอกเอง");
      return false;
    }
  };

  const handleBarcodeCapture = async (barcodes: DetectedBarcode[]) => {
    if (scanAppliedRef.current) return;
    const value = barcodes?.[0]?.rawValue?.trim();
    if (value) {
      const applied = await handleScanResult(value);
      scanAppliedRef.current = applied;
    } else {
      setScanError("สแกนไม่พบบาร์โค้ด ลองใหม่อีกครั้ง");
    }
  };


  const handleDeleteMeal = async (mealId?: string) => {
    if (!mealId) {
      message.error("ไม่พบรหัสรายการอาหาร");
      return;
    }
    setConfirmDelete(null);
    try {
      setDeletingId(mealId);
      await deleteMealRecord(mealId);
      await fetchMeals();
    } catch (err) {
      console.error("ลบรายการอาหารไม่สำเร็จ", err);
      message.error("ลบรายการไม่สำเร็จ");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <PageLoader label="กำลังโหลดข้อมูล..." />;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4">
      <div className="mx-auto grid w-full max-w-md grid-cols-3 gap-3 rounded-2xl bg-white p-2 shadow-sm">
        <button
          type="button"
          className="flex h-16 flex-col items-center justify-center gap-1 rounded-xl text-[0px] text-accent transition hover:bg-accent hover:text-white"
          onClick={() => setIsScanModalOpen(true)}
          aria-label="สแกนบาร์โค้ด"
        >
          <FaBarcode className="h-5 w-5" />
          <span className="text-xs">Barcode</span>
          สแกนบาร์โค้ด
        </button>
        <button
          type="button"
          className="flex h-16 flex-col items-center justify-center gap-1 rounded-xl text-[0px] text-accent transition hover:bg-accent hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => imageInputRef.current?.click()}
          disabled={imageAnalyzing}
          aria-label="วิเคราะห์จากรูป"
        >
          <FaCamera className="h-5 w-5" />
          <span className="text-xs">{imageAnalyzing ? "Analyzing" : "AI"}</span>
          {imageAnalyzing ? "กำลังวิเคราะห์..." : "วิเคราะห์จากรูป"}
        </button>
        <button
          type="button"
          className="flex h-16 flex-col items-center justify-center gap-1 rounded-xl text-[0px] text-accent transition hover:bg-accent hover:text-white"
          onClick={() => setIsModalOpen(true)}
          aria-label="เพิ่มมื้ออาหาร"
        >
          <FaPlus className="h-5 w-5" />
          <span className="text-xs">Add meal</span>
          + เพิ่มมื้ออาหาร
        </button>
      </div>

      {/* 🔹 แสดงรายการย้อนหลัง */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFoodImageChange}
      />
      {imageAnalyzeError ? (
        <p className="text-center text-sm text-red-500">{imageAnalyzeError}</p>
      ) : null}
      {imageAnalyzing ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/35 px-6 backdrop-blur-sm">
          <div className="flex w-full max-w-xs flex-col items-center rounded-2xl bg-white p-6 text-center shadow-xl">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-accent/20 border-t-accent" />
            <p className="font-semibold text-gray-900">AI กำลังวิเคราะห์อาหาร</p>
            <p className="mt-1 text-sm text-gray-500">
              รอสักครู่ ระบบกำลังประเมินสารอาหารจากรูป
            </p>
          </div>
        </div>
      ) : null}

      <div className="w-full">
        <h1 className="text-xl font-semibold text-center mb-4">
          บันทึกอาหารย้อนหลัง 7 วัน
        </h1>

        <motion.div
          className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4 items-start"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
        {data.map((day) => {
          const grouped = day.meals.reduce<Record<string, Meal[]>>((acc, m) => {
            (acc[m.meal_type] ||= []).push(m);
            return acc;
          }, {});
          return (
            <motion.div
              key={day.date}
              variants={staggerItem}
              className="flex flex-col border-b border-gray-200 p-4 bg-white rounded-2xl shadow-md"
            >
              <h2 className="font-medium text-accent text-lg mb-2">📅 {dayjs(day.date).format("DD MMM YYYY")}</h2>

              {["breakfast", "lunch", "dinner", "snack"].map((type) =>
                grouped[type]?.length ? (
                  <div key={type} className="mb-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-accent">
                      <span className="uppercase">{type}</span>
                      <span className="text-xs text-gray-500">
                        kcal {grouped[type].reduce((s, m) => s + m.calories, 0).toFixed(0)}
                      </span>
                    </div>
                    <ul className="mt-1 space-y-2">
                      {grouped[type].map((meal, i) => (
                        <li
                          key={meal._id || meal.id || i}
                          className="grid grid-cols-[1fr_auto] gap-3 items-center border border-gray-200 rounded-lg px-3 py-2 bg-gray-50"
                        >
                          <div className="flex flex-col gap-2">
                            <div className="flex-1 min-w-0">
                              <span className="font-medium">{meal.food_name}</span>
                              {meal.description && <p className="text-xs text-gray-500 mt-1">{meal.description}</p>}
                            </div>
                            <div className="flex items-center gap-3 sm:justify-end sm:self-center">
                              <span className="text-sm text-gray-700 whitespace-nowrap">
                                {meal.calories} kcal | <span className="text-blue-500">P {meal.protein.toFixed(0)}</span>{" "}
                                <span className="text-yellow-500">F {meal.fat.toFixed(0)}</span>{" "}
                                <span className="text-green-500">C {meal.carbs.toFixed(0)}</span>
                              </span>

                            </div>
                          </div>
                          <button
                            aria-label="ลบรายการอาหาร"
                            onClick={() =>
                              setConfirmDelete({
                                id: meal._id || meal.id || "",
                                name: meal.food_name,
                              })
                            }
                            disabled={deletingId === (meal._id || meal.id)}
                            className="p-2 text-accent hover:text-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <FaTrash className="h-5 w-5" />

                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null
              )}
              {/* รวมวันนี้เหมือนเดิม */}
            </motion.div>
          );
        })}
        </motion.div>
      </div>

      {/* ✅ Modal เพิ่มมื้ออาหาร */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="เพิ่มมื้ออาหาร"
      >
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <FaCalendarAlt className="text-accent" />
            Date
          </label>
          <input
            type="date"
            value={mealForm.date}
            onChange={(e) => setMealForm({ ...mealForm, date: e.target.value })}
            className="w-full border rounded-md px-3 py-2"
          />

          <label className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <FaUtensils className="text-accent" />
            Meal type
          </label>
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

          <label className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <FaTag className="text-accent" />
            Food name
          </label>
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
          <label className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <FaAlignLeft className="text-accent" />
            Detail
          </label>
          <textarea
            placeholder="รายละเอียด (เช่น ส่วนผสม หรือปริมาณ)"
            value={mealForm.description}
            onChange={(e) =>
              setMealForm({ ...mealForm, description: e.target.value })
            }
            rows={3}
            className="w-full border rounded-md px-3 py-2 resize-none"
          ></textarea>

          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <FaFire className="text-accent" />
            Nutrition
          </div>
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
            disabled={mealSaving}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[#d6a27a] py-2 text-white hover:bg-[#c9966f] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {mealSaving ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : null}
            {mealSaving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </Modal>

      {/* ✅ Modal สแกนบาร์โค้ดจริง */}
      <Modal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        title="สแกนบาร์โค้ด"
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            เปิดกล้องหรือกรอกรหัสบาร์โค้ด ระบบจะค้นหาข้อมูลจริงจากฐานข้อมูล และกรอกค่าลงฟอร์มให้ทันที
          </p>

          <div className="aspect-video w-full overflow-hidden rounded-lg bg-black/5 border border-dashed border-gray-200 relative">
            {isScanModalOpen && (
              <BarcodeScanner
                className="w-full h-full object-cover"
                paused={!isScanModalOpen}
                trackConstraints={{ facingMode: { ideal: "environment" } }}
                options={{
                  formats: [
                    BarcodeFormat.EAN_13,
                    BarcodeFormat.UPC_A,
                    BarcodeFormat.CODE_128,
                    BarcodeFormat.QR_CODE,
                  ],
                  delay: 600,
                }}
                onCapture={handleBarcodeCapture}
                onError={() =>
                  setCameraError(
                    "เปิดกล้องไม่สำเร็จ ใช้กรอกรหัสด้วยตนเองแทนได้"
                  )
                }
              />
            )}
            {cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-xs text-red-500 px-4 text-center">
                {cameraError}
              </div>
            )}
            {!cameraError && (
              <div className="absolute inset-0 border-2 border-accent/60 m-6 rounded-2xl pointer-events-none animate-pulse"></div>
            )}
          </div>


          <input
            type="text"
            placeholder="กรอกรหัสบาร์โค้ดเองได้ เช่น 8850999xxxx"
            value={scanInput}
            onChange={(e) => {
              setScanInput(e.target.value);
              setScanError("");
            }}
            className="w-full border rounded-md px-3 py-2"
          />
          {scanError && (
            <p className="text-xs text-red-500">{scanError}</p>
          )}

          <button
            onClick={() => handleScanResult()}
            className="w-full bg-[#d6a27a] text-white py-2 rounded-md hover:bg-[#c9966f]"
          >
            ใช้ผลสแกนเพื่อใส่ในฟอร์ม
          </button>
        </div>
      </Modal>


      {/* ✅ Modal ยืนยันการลบ */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="ยืนยันการลบ"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            ต้องการลบรายการ{" "}
            <span className="font-semibold">
              {confirmDelete?.name || "อาหารนี้"}
            </span>{" "}
            หรือไม่?
          </p>
          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
              onClick={() => setConfirmDelete(null)}
              disabled={!!deletingId}
            >
              ยกเลิก
            </button>
            <button
              className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 disabled:opacity-60"
              onClick={() => handleDeleteMeal(confirmDelete?.id)}
              disabled={!!deletingId}
            >
              {deletingId ? "กำลังลบ..." : "ลบรายการ"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
