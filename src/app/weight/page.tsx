"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { isLoggedIn } from "@/lib/api/auth";
import { getWeightHistory, updateWeightToday } from "@/lib/api/weight";
import MenuBar from "@/components/MenuBar";
import Modal from "@/components/Modal";
import BottomMenuBar from "@/components/BottomMenuBar";

interface WeightRecord {
  date: string;
  weight_kg: number;
}

export default function WeightPage() {
  const router = useRouter();
  const [data, setData] = useState<WeightRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWeight, setNewWeight] = useState("");

  const fetchData = async () => {
    try {
      const records = await getWeightHistory(10);
      const formatted = records.map((r: WeightRecord) => ({
        ...r,
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
    if (!newWeight) return alert("กรุณากรอกน้ำหนักก่อน");

    try {
      await updateWeightToday(Number(newWeight));
      setIsModalOpen(false);
      setNewWeight("");
      await fetchData(); // โหลดใหม่หลังบันทึก
    } catch (err) {
      console.error(err);
      alert("บันทึกไม่สำเร็จ");
    }
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="min-h-screen bg-bg-theme p-4 pt-18">
      <MenuBar />

      <div className="flex justify-end mb-2">
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
        <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow p-4">
          <h1 className="text-xl font-semibold text-center mb-6">ประวัติน้ำหนัก</h1>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                angle={-45}
                textAnchor="end"
                height={60}
                tick={{ fontSize: 12 }}
              />
              <YAxis domain={["dataMin - 1", "dataMax + 1"]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="weight_kg"
                stroke="#d6a27a"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
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
          className="w-full border rounded-md px-3 py-2 mb-4"
        />
        <button
          onClick={handleAddWeight}
          className="w-full bg-[#d6a27a] text-white py-2 rounded-md hover:bg-[#c9966f]"
        >
          บันทึก
        </button>
      </Modal>
      <BottomMenuBar /> 
    </div>
  );
}
