"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { message } from "antd";
import Modal from "@/components/Modal";
import PageLoader from "@/components/PageLoader";
import { useAppSelector } from "@/lib/hooks";
import {
  createFood,
  type CreateFoodInput,
} from "@/lib/api/food";
import {
  BarcodeFormat,
  BarcodeScanner,
  type DetectedBarcode,
} from "react-barcode-scanner";
import "react-barcode-scanner/polyfill";

const ADMIN_EMAIL = "tonbee11@gmail.com";

export default function AdminPage() {
  const email = useAppSelector((state) => state.userProfile.data?.email);
  const isAdmin = (email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const [isAddFoodOpen, setIsAddFoodOpen] = useState(false);
  const [isFoodScannerActive, setIsFoodScannerActive] = useState(false);
  const [foodScanError, setFoodScanError] = useState("");
  const [foodCameraError, setFoodCameraError] = useState("");
  const foodScanAppliedRef = useRef(false);
  const [foodForm, setFoodForm] = useState({
    barcode: "",
    food_name: "",
    description: "",
    brand: "",
    servingSize: "",
    servingUnit: "",
    calories: "",
    protein: "",
    fat: "",
    carbs: "",
    sugar: "",
    fiber: "",
    sodium: "",
    cholesterol: "",
    calcium: "",
    iron: "",
    potassium: "",
    vitaminC: "",
    vitaminD: "",
  });

  useEffect(() => {
    if (!isAddFoodOpen) return;
    foodScanAppliedRef.current = false;
    setFoodCameraError("");
    setFoodScanError("");
    setIsFoodScannerActive(true);
    if (
      typeof navigator !== "undefined" &&
      !navigator.mediaDevices?.getUserMedia
    ) {
      setFoodCameraError(
        "อุปกรณ์นี้ไม่รองรับการเปิดกล้อง ใช้กรอกรหัสด้วยตนเองแทนได้"
      );
      setIsFoodScannerActive(false);
    }
  }, [isAddFoodOpen]);

  if (!email) {
    return <PageLoader label="กำลังโหลดข้อมูลผู้ใช้..." />;
  }

  if (!isAdmin) {
    return (
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6 text-center">
        <h1 className="text-xl font-semibold mb-2">หน้านี้สำหรับผู้ดูแลเท่านั้น</h1>
        <p className="text-sm text-gray-500 mb-4">
          อีเมลของคุณยังไม่ได้รับสิทธิ์เข้าหน้าแอดมิน
        </p>
        <Link
          href="/dashboard"
          className="inline-block bg-[#d6a27a] text-white py-2 px-4 rounded-md hover:bg-[#c9966f]"
        >
          กลับหน้าแดชบอร์ด
        </Link>
      </div>
    );
  }

  const handleFoodBarcodeCapture = (barcodes: DetectedBarcode[]) => {
    if (foodScanAppliedRef.current) return;
    const value = barcodes?.[0]?.rawValue?.trim();
    if (value) {
      setFoodForm((prev) => ({ ...prev, barcode: value }));
      setFoodScanError("");
      foodScanAppliedRef.current = true;
      setIsFoodScannerActive(false);
    } else {
      setFoodScanError("สแกนไม่พบบาร์โค้ด/คิวอาร์ ลองใหม่อีกครั้ง");
    }
  };

  const handleCreateFood = async () => {
    if (!foodForm.barcode.trim()) {
      message.warning("กรุณาสแกนหรือกรอกรหัสบาร์โค้ดก่อน");
      return;
    }

    const toNumberOrUndefined = (value: string) =>
      value.trim() ? Number(value) : undefined;
    const toTextOrUndefined = (value: string) => value.trim() || undefined;

    const payload: CreateFoodInput = {
      barcode: foodForm.barcode.trim(),
      food_name: toTextOrUndefined(foodForm.food_name),
      description: toTextOrUndefined(foodForm.description),
      brand: toTextOrUndefined(foodForm.brand),
      servingSize: toNumberOrUndefined(foodForm.servingSize),
      servingUnit: toTextOrUndefined(foodForm.servingUnit),
      calories: toNumberOrUndefined(foodForm.calories),
      protein: toNumberOrUndefined(foodForm.protein),
      fat: toNumberOrUndefined(foodForm.fat),
      carbs: toNumberOrUndefined(foodForm.carbs),
      sugar: toNumberOrUndefined(foodForm.sugar),
      fiber: toNumberOrUndefined(foodForm.fiber),
      sodium: toNumberOrUndefined(foodForm.sodium),
      cholesterol: toNumberOrUndefined(foodForm.cholesterol),
      calcium: toNumberOrUndefined(foodForm.calcium),
      iron: toNumberOrUndefined(foodForm.iron),
      potassium: toNumberOrUndefined(foodForm.potassium),
      vitaminC: toNumberOrUndefined(foodForm.vitaminC),
      vitaminD: toNumberOrUndefined(foodForm.vitaminD),
    };

    try {
      await createFood(payload);
      setIsAddFoodOpen(false);
      setIsFoodScannerActive(false);
      setFoodForm({
        barcode: "",
        food_name: "",
        description: "",
        brand: "",
        servingSize: "",
        servingUnit: "",
        calories: "",
        protein: "",
        fat: "",
        carbs: "",
        sugar: "",
        fiber: "",
        sodium: "",
        cholesterol: "",
        calcium: "",
        iron: "",
        potassium: "",
        vitaminC: "",
        vitaminD: "",
      });
      message.success("เพิ่มอาหารสำเร็จ");
    } catch (err) {
      console.error("เพิ่มอาหารไม่สำเร็จ", err);
      message.error("เพิ่มอาหารไม่สำเร็จ");
    }
  };

  return (
    <div className="w-full max-w-full md:max-w-2xl lg:max-w-3xl mx-auto bg-white rounded-lg shadow p-6 mt-10">
      <h1 className="text-2xl font-semibold mb-2">Admin</h1>
      <p className="text-sm text-gray-500 mb-6">ยินดีต้อนรับ {email}</p>

      <div className="space-y-4 text-sm text-gray-700">
        <div className="bg-gray-50 p-4 rounded-md shadow-sm">
          <p className="font-semibold mb-2">เมนูจัดการอาหาร</p>
          <button
            className="w-full bg-white border border-accent text-accent px-4 py-2 rounded-lg shadow hover:bg-accent hover:text-white transition"
            onClick={() => setIsAddFoodOpen(true)}
          >
            เพิ่มอาหาร (สแกน QR/บาร์โค้ด)
          </button>
        </div>
      </div>

      <Modal
        isOpen={isAddFoodOpen}
        onClose={() => setIsAddFoodOpen(false)}
        title="เพิ่มอาหารด้วย QR/บาร์โค้ด"
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            สแกน QR/บาร์โค้ดเพื่อกรอกรหัส แล้วค่อยเติมข้อมูลโภชนาการจากซองได้เลย
          </p>

          <div className="aspect-video w-full overflow-hidden rounded-lg bg-black/5 border border-dashed border-gray-200 relative">
            {isAddFoodOpen && (
              <BarcodeScanner
                className="w-full h-full object-cover"
                paused={!isFoodScannerActive}
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
                onCapture={handleFoodBarcodeCapture}
                onError={() =>
                  setFoodCameraError(
                    "เปิดกล้องไม่สำเร็จ ใช้กรอกรหัสด้วยตนเองแทนได้"
                  )
                }
              />
            )}
            {foodCameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-xs text-red-500 px-4 text-center">
                {foodCameraError}
              </div>
            )}
            {!foodCameraError && (
              <div className="absolute inset-0 border-2 border-accent/60 m-6 rounded-2xl pointer-events-none animate-pulse"></div>
            )}
          </div>

          {!isFoodScannerActive && !foodCameraError && (
            <button
              type="button"
              onClick={() => {
                foodScanAppliedRef.current = false;
                setFoodScanError("");
                setIsFoodScannerActive(true);
              }}
              className="w-full bg-white border border-accent text-accent px-4 py-2 rounded-lg shadow hover:bg-accent hover:text-white transition"
            >
              เปิดกล้องสแกนอีกครั้ง
            </button>
          )}

          <input
            type="text"
            placeholder="รหัสบาร์โค้ด"
            value={foodForm.barcode}
            onChange={(e) => {
              setFoodForm({ ...foodForm, barcode: e.target.value });
              setFoodScanError("");
            }}
            className="w-full border rounded-md px-3 py-2"
          />
          {foodScanError && (
            <p className="text-xs text-red-500">{foodScanError}</p>
          )}

          <input
            type="text"
            placeholder="ชื่ออาหาร"
            value={foodForm.food_name}
            onChange={(e) =>
              setFoodForm({ ...foodForm, food_name: e.target.value })
            }
            className="w-full border rounded-md px-3 py-2"
          />
          <input
            type="text"
            placeholder="แบรนด์"
            value={foodForm.brand}
            onChange={(e) =>
              setFoodForm({ ...foodForm, brand: e.target.value })
            }
            className="w-full border rounded-md px-3 py-2"
          />
          <textarea
            placeholder="รายละเอียด (เช่น ขนาดบรรจุ/รสชาติ)"
            value={foodForm.description}
            onChange={(e) =>
              setFoodForm({ ...foodForm, description: e.target.value })
            }
            rows={2}
            className="w-full border rounded-md px-3 py-2 resize-none"
          ></textarea>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="ขนาดเสิร์ฟ"
              value={foodForm.servingSize}
              onChange={(e) =>
                setFoodForm({ ...foodForm, servingSize: e.target.value })
              }
              className="border rounded-md px-3 py-2"
            />
            <input
              type="text"
              placeholder="หน่วยเสิร์ฟ (เช่น g, ml)"
              value={foodForm.servingUnit}
              onChange={(e) =>
                setFoodForm({ ...foodForm, servingUnit: e.target.value })
              }
              className="border rounded-md px-3 py-2"
            />
            <input
              type="number"
              placeholder="แคลอรี"
              value={foodForm.calories}
              onChange={(e) =>
                setFoodForm({ ...foodForm, calories: e.target.value })
              }
              className="border rounded-md px-3 py-2"
            />
            <input
              type="number"
              placeholder="โปรตีน (g)"
              value={foodForm.protein}
              onChange={(e) =>
                setFoodForm({ ...foodForm, protein: e.target.value })
              }
              className="border rounded-md px-3 py-2"
            />
            <input
              type="number"
              placeholder="ไขมัน (g)"
              value={foodForm.fat}
              onChange={(e) =>
                setFoodForm({ ...foodForm, fat: e.target.value })
              }
              className="border rounded-md px-3 py-2"
            />
            <input
              type="number"
              placeholder="คาร์บ (g)"
              value={foodForm.carbs}
              onChange={(e) =>
                setFoodForm({ ...foodForm, carbs: e.target.value })
              }
              className="border rounded-md px-3 py-2"
            />
            <input
              type="number"
              placeholder="น้ำตาล (g)"
              value={foodForm.sugar}
              onChange={(e) =>
                setFoodForm({ ...foodForm, sugar: e.target.value })
              }
              className="border rounded-md px-3 py-2"
            />
            <input
              type="number"
              placeholder="ไฟเบอร์ (g)"
              value={foodForm.fiber}
              onChange={(e) =>
                setFoodForm({ ...foodForm, fiber: e.target.value })
              }
              className="border rounded-md px-3 py-2"
            />
            <input
              type="number"
              placeholder="โซเดียม (mg)"
              value={foodForm.sodium}
              onChange={(e) =>
                setFoodForm({ ...foodForm, sodium: e.target.value })
              }
              className="border rounded-md px-3 py-2"
            />
            <input
              type="number"
              placeholder="คอเลสเตอรอล (mg)"
              value={foodForm.cholesterol}
              onChange={(e) =>
                setFoodForm({ ...foodForm, cholesterol: e.target.value })
              }
              className="border rounded-md px-3 py-2"
            />
            <input
              type="number"
              placeholder="แคลเซียม (mg)"
              value={foodForm.calcium}
              onChange={(e) =>
                setFoodForm({ ...foodForm, calcium: e.target.value })
              }
              className="border rounded-md px-3 py-2"
            />
            <input
              type="number"
              placeholder="ธาตุเหล็ก (mg)"
              value={foodForm.iron}
              onChange={(e) =>
                setFoodForm({ ...foodForm, iron: e.target.value })
              }
              className="border rounded-md px-3 py-2"
            />
            <input
              type="number"
              placeholder="โพแทสเซียม (mg)"
              value={foodForm.potassium}
              onChange={(e) =>
                setFoodForm({ ...foodForm, potassium: e.target.value })
              }
              className="border rounded-md px-3 py-2"
            />
            <input
              type="number"
              placeholder="วิตามิน C (mg)"
              value={foodForm.vitaminC}
              onChange={(e) =>
                setFoodForm({ ...foodForm, vitaminC: e.target.value })
              }
              className="border rounded-md px-3 py-2"
            />
            <input
              type="number"
              placeholder="วิตามิน D (mcg)"
              value={foodForm.vitaminD}
              onChange={(e) =>
                setFoodForm({ ...foodForm, vitaminD: e.target.value })
              }
              className="border rounded-md px-3 py-2"
            />
          </div>

          <button
            onClick={handleCreateFood}
            className="w-full bg-[#d6a27a] text-white py-2 rounded-md hover:bg-[#c9966f]"
          >
            บันทึกอาหาร
          </button>
        </div>
      </Modal>
    </div>
  );
}
