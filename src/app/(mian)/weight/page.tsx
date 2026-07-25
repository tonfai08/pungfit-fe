"use client";

import { motion } from "framer-motion";
import { message } from "antd";
import Modal from "@/components/Modal";
import PageLoader from "@/components/PageLoader";
import WeightChart from "@/components/WeightChart";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { isLoggedIn } from "@/lib/api/auth";
import { getWeightHistory, updateWeightToday } from "@/lib/api/weight";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface WeightRecord {
  date: string;
  displayDate?: string;
  weight_kg: number;
}

function formatHistoryDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
  });
}

function getWeightChangePercent(current: number, previous?: number) {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

export default function WeightPage() {
  const router = useRouter();
  const [data, setData] = useState<WeightRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWeight, setNewWeight] = useState("");

  const fetchData = async () => {
    try {
      const records = await getWeightHistory(10);
      const formatted = [...records]
        .sort(
          (a: WeightRecord, b: WeightRecord) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        )
        .map((r: WeightRecord) => ({
          ...r,
          displayDate: formatHistoryDate(r.date),
          date: new Date(r.date).toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
          }),
        }));
      setData(formatted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    fetchData();
  }, [router]);

  const handleAddWeight = async () => {
    if (!newWeight) return message.warning("กรุณากรอกน้ำหนักก่อน");

    try {
      setSaving(true);
      await updateWeightToday(Number(newWeight));
      setIsModalOpen(false);
      setNewWeight("");
      await fetchData(); // โหลดใหม่หลังบันทึก
    } catch (err) {
      console.error(err);
      message.error("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
   <>
      <div className="w-full max-w-full md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto flex justify-end mb-2">
        <button
          className="bg-white text-accent px-6 py-2 rounded-lg shadow hover:bg-accent transition"
          onClick={() => setIsModalOpen(true)}
        >
          + อัปเดตน้ำหนักวันนี้
        </button>
      </div>

      {data.length === 0 ? (
        <p className="text-center text-gray-500">ยังไม่มีข้อมูล</p>
      ) : (
        <div className="w-full max-w-full md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto bg-white rounded-lg shadow p-4">
          <h1 className="text-xl font-semibold text-center mb-6">ประวัติน้ำหนัก</h1>
          <WeightChart data={data} />
          <motion.div
            className="mt-4 divide-y divide-gray-100 border-t border-gray-100"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {[...data].reverse().map((record, index, reversedData) => {
              const previous = reversedData[index + 1];
              const percent = getWeightChangePercent(
                record.weight_kg,
                previous?.weight_kg
              );
              const isLoss = percent !== null && percent < 0;
              const isGain = percent !== null && percent > 0;

              return (
                <motion.div
                  key={`${record.displayDate ?? record.date}-${index}`}
                  variants={staggerItem}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <span className="text-gray-700">
                    {record.displayDate ?? record.date}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {record.weight_kg.toFixed(0)} kg
                    </span>
                    {percent !== null ? (
                      <span
                        className={`text-xs font-semibold ${
                          isLoss
                            ? "text-red-500"
                            : isGain
                              ? "text-green-500"
                              : "text-gray-400"
                        }`}
                      >
                        {percent > 0 ? "+" : ""}
                        {percent.toFixed(1)}%
                      </span>
                    ) : null}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      )}

      {/* ✅ Modal อัปเดตน้ำหนัก */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="อัปเดตน้ำหนักวันนี้"
      >
        <input
          type="number"
          placeholder="น้ำหนัก (กก.)"
          value={newWeight}
          onChange={(e) => setNewWeight(e.target.value)}
          disabled={saving}
          className="w-full border rounded-md px-3 py-2 mb-4"
        />
        <button
          onClick={handleAddWeight}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-[#d6a27a] py-2 text-white hover:bg-[#c9966f] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : null}
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </Modal>
    </>
  );
}
