"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import dayjs, { type Dayjs } from "dayjs";
import {
  Calendar,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popover,
  Select,
} from "antd";
import PageLoader from "@/components/PageLoader";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { isLoggedIn } from "@/lib/api/auth";
import {
  createExerciseLog,
  getExerciseLogs,
  type ExerciseLogType,
  type ExerciseIntensity,
} from "@/lib/api/exercise-log";
import {
  FaBolt,
  FaCalendarAlt,
  FaClock,
  FaDumbbell,
  FaLayerGroup,
  FaList,
  FaStickyNote,
} from "react-icons/fa";

type ExerciseLogApi = {
  _id?: string;
  id?: string;
  name: string;
  type?: ExerciseLogType | string;
  set1_weight_kg?: number | null;
  set1_reps?: number | null;
  set2_weight_kg?: number | null;
  set2_reps?: number | null;
  set3_weight_kg?: number | null;
  set3_reps?: number | null;
  duration_min?: number | null;
  intensity?: ExerciseIntensity | string | null;
  notes?: string | null;
  performed_at?: string;
  createdAt?: string;
  updatedAt?: string;
};

function normalizeLogs(data: unknown): ExerciseLogApi[] {
  if (Array.isArray(data)) return data as ExerciseLogApi[];
  if (data && typeof data === "object" && "logs" in data) {
    const logs = (data as { logs?: ExerciseLogApi[] }).logs;
    return Array.isArray(logs) ? logs : [];
  }
  return [];
}

function getDateKey(value?: string) {
  if (!value) return "";
  return dayjs(value).format("YYYY-MM-DD");
}

function formatLogDetail(log: ExerciseLogApi) {
  const parts: string[] = [];
  if (log.set1_weight_kg || log.set1_reps) {
    parts.push(
      `Set1 ${log.set1_weight_kg ?? "-"}kg x ${log.set1_reps ?? "-"}`
    );
  }
  if (log.set2_weight_kg || log.set2_reps) {
    parts.push(
      `Set2 ${log.set2_weight_kg ?? "-"}kg x ${log.set2_reps ?? "-"}`
    );
  }
  if (log.set3_weight_kg || log.set3_reps) {
    parts.push(
      `Set3 ${log.set3_weight_kg ?? "-"}kg x ${log.set3_reps ?? "-"}`
    );
  }
  if (log.duration_min) parts.push(`${log.duration_min} นาที`);
  return parts.length ? parts.join(" • ") : "-";
}

export default function ExerciseLogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<ExerciseLogApi[]>([]);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ExerciseLogApi | null>(null);
  const [popoverDateKey, setPopoverDateKey] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [form] = Form.useForm();

  const logsByDate = useMemo(() => {
    const grouped: Record<string, ExerciseLogApi[]> = {};
    logs.forEach((log) => {
      const key = getDateKey(log.performed_at) || "";
      if (!key) return;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(log);
    });
    return grouped;
  }, [logs]);

  const selectedKey = selectedDate.format("YYYY-MM-DD");
  const selectedMonthKey = selectedDate.format("YYYY-MM");
  const selectedLogs = logsByDate[selectedKey] ?? [];

  const fetchLogs = useCallback(async (monthDate: Dayjs) => {
    try {
      setLoading(true);
      setError(null);
      const start = monthDate.startOf("month").format("YYYY-MM-DD");
      const end = monthDate
        .endOf("month")
        .add(1, "day")
        .format("YYYY-MM-DD");
      const data = (await getExerciseLogs({ start, end })) as unknown;
      setLogs(normalizeLogs(data));
    } catch (err) {
      console.error("Failed to fetch exercise logs:", err);
      setError("โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    void fetchLogs(dayjs(`${selectedMonthKey}-01`));
  }, [fetchLogs, router, selectedMonthKey]);

  const openCreateModal = () => {
    const baseDate = selectedDate.isValid() ? selectedDate : dayjs();
    form.setFieldsValue({
      name: "",
      type: "weight",
      intensity: "moderate",
      performed_at: baseDate
        .hour(dayjs().hour())
        .minute(dayjs().minute())
        .second(0),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const payload = {
        ...values,
        performed_at: values.performed_at
          ? (values.performed_at as Dayjs).toISOString()
          : undefined,
      };
      await createExerciseLog(payload);
      setIsModalOpen(false);
      await fetchLogs(selectedDate);
    } catch (err) {
      if (err instanceof Error) {
        console.error("Failed to create exercise log:", err);
      }
    } finally {
      setSaving(false);
    }
  };

  const openDetailModal = (log: ExerciseLogApi) => {
    setSelectedLog(log);
    setPopoverOpen(false);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="relative bg-white rounded-xl shadow p-6 w-full max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-accent">
            บันทึกการออกกำลังกาย
          </h1>
          <p className="text-sm text-gray-500">
            เลือกวันจากปฏิทินเพื่อดูรายละเอียด
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {selectedDate.format("DD/MM/YYYY")}
        </div>
      </div>

      {error ? <p className="text-sm text-red-500 mb-3">{error}</p> : null}

      {loading ? (
        <PageLoader label="กำลังโหลดบันทึก..." />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(360px,560px)_1fr] gap-6 items-start">
          <div className="bg-white rounded-lg border p-3">
            <Calendar
              value={selectedDate}
              fullscreen={false}
              onSelect={(date) => {
                setSelectedDate(date);
                setPopoverDateKey(date.format("YYYY-MM-DD"));
                setPopoverOpen(true);
              }}
              onPanelChange={(date) => {
                setSelectedDate(date);
                setPopoverOpen(false);
              }}
              cellRender={(current, info) => {
                if (info.type !== "date") return info.originNode;
                const key = current.format("YYYY-MM-DD");
                const items = logsByDate[key] ?? [];
                const count = items.length;
                const popoverContent =
                  count === 0 ? (
                    <p className="text-xs text-gray-500">ยังไม่มีบันทึก</p>
                  ) : (
                    <div className="grid grid-cols-[60px_1fr] gap-x-3 gap-y-2 text-xs">
                      {items.map((log, index) => {
                        const time = log.performed_at
                          ? dayjs(log.performed_at).format("HH:mm")
                          : "-";
                        return (
                          <div
                            key={log._id || log.id || `${key}-${index}`}
                            className="contents"
                          >
                            <span className="inline-flex h-5 items-center justify-center rounded-full bg-gray-100 text-[10px] font-medium text-gray-600">
                              {time}
                            </span>
                            <div>
                              <p className="font-medium text-gray-800">
                                {log.name}
                              </p>
                              <div className="text-gray-500">
                                {formatLogDetail(log)
                                  .split(" • ")
                                  .map((line, lineIndex) => (
                                    <p key={`${key}-${index}-${lineIndex}`}>
                                      {line}
                                    </p>
                                  ))}
                              </div>
                              <button
                                type="button"
                                onClick={() => openDetailModal(log)}
                                className="mt-1 inline-flex items-center text-[11px] font-medium text-accent hover:underline"
                              >
                                ดูข้อมูลละเอียด
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );

                return (
                  <Popover
                    content={popoverContent}
                    title={current.format("DD/MM/YYYY")}
                    trigger="click"
                    zIndex={900}
                    open={popoverOpen && popoverDateKey === key}
                    onOpenChange={(open) => {
                      if (open) {
                        setPopoverDateKey(key);
                        setPopoverOpen(true);
                      } else if (popoverDateKey === key) {
                        setPopoverOpen(false);
                      }
                    }}
                  >
                    <div className="relative h-5">
                      {count > 0 ? (
                        <span
                          className="absolute bottom-1 right-1 text-3xl text-accent"
                        >
                        •
                        </span>
                      ) : null}
                    </div>
                  </Popover>
                );
              }}
            />
          </div>

          <div className="hidden xl:block rounded-lg border bg-gray-50 p-4 min-h-[344px]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedDate.format("DD/MM/YYYY")}
                </h2>
                <p className="text-sm text-gray-500">
                  {selectedLogs.length} items
                </p>
              </div>
              <button
                type="button"
                onClick={openCreateModal}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm"
                style={{ backgroundColor: "var(--color-accent)" }}
              >
                + Add
              </button>
            </div>

            {selectedLogs.length === 0 ? (
              <div className="mt-12 flex min-h-40 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-white text-sm text-gray-500">
                No exercise logs for this day
              </div>
            ) : (
              <motion.div
                className="mt-4 grid grid-cols-1 2xl:grid-cols-2 gap-3"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {selectedLogs.map((log, index) => (
                  <motion.button
                    key={log._id || log.id || `${selectedKey}-${index}`}
                    variants={staggerItem}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => openDetailModal(log)}
                    className="rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-accent"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">
                          {log.name}
                        </p>
                        <p className="mt-1 text-xs capitalize text-gray-500">
                          {log.type ?? "-"}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                        {log.performed_at
                          ? dayjs(log.performed_at).format("HH:mm")
                          : "-"}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-gray-600">
                      {formatLogDetail(log)}
                    </p>
                    {log.notes ? (
                      <p className="mt-2 line-clamp-2 text-xs text-gray-500">
                        {log.notes}
                      </p>
                    ) : null}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={openCreateModal}
        className="fixed bottom-25 right-6 w-14 h-14 rounded-full text-white text-2xl shadow-lg flex items-center justify-center xl:hidden"
        style={{ backgroundColor: "var(--color-accent)" }}
        aria-label="เพิ่มบันทึกการออกกำลังกาย"
      >
        +
      </button>

      <Modal
        title={
          <div className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent">
              <FaDumbbell />
            </span>
            <span>Workout log</span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSubmit}
        okText="บันทึก"
        cancelText="ยกเลิก"
        confirmLoading={saving}
        centered
        width={440}
        forceRender
        destroyOnHidden
      >
        <Form form={form} layout="vertical" className="pt-2">
          <Form.Item
            label={
              <span className="flex items-center gap-2 font-medium text-gray-700">
                <FaDumbbell className="text-accent" />
                ชื่อการออกกำลังกาย
              </span>
            }
            name="name"
            rules={[{ required: true, message: "กรุณากรอกชื่อ" }]}
          >
            <Input size="large" placeholder="เช่น Bench Press" />
          </Form.Item>
          <Form.Item
            label={
              <span className="flex items-center gap-2 font-medium text-gray-700">
                <FaList className="text-accent" />
                ประเภท
              </span>
            }
            name="type"
          >
            <Select
              size="large"
              options={[
                { label: "Weight", value: "weight" },
                { label: "Cardio", value: "cardio" },
                { label: "Time", value: "time" },
                { label: "Other", value: "other" },
              ]}
            />
          </Form.Item>
          <div className="mb-5 rounded-xl border border-gray-100 bg-gray-50/80 p-3">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
              <FaLayerGroup className="text-accent" />
              Sets
            </div>
            <div className="grid grid-cols-[48px_1fr_1fr] gap-2 px-1 text-xs text-gray-500">
              <span></span>
              <span>Weight</span>
              <span>Reps</span>
            </div>
            <div className="mt-2 space-y-2">
            <div className="grid grid-cols-[48px_1fr_1fr] gap-2 items-center">
              <span className="text-xs font-medium text-gray-500">Set 1</span>
              <Form.Item name="set1_weight_kg" className="mb-0">
                <InputNumber className="w-full" size="large" min={0} step={0.5} />
              </Form.Item>
              <Form.Item name="set1_reps" className="mb-0">
                <InputNumber className="w-full" size="large" min={0} />
              </Form.Item>
            </div>
            <div className="grid grid-cols-[48px_1fr_1fr] gap-2 items-center">
              <span className="text-xs font-medium text-gray-500">Set 2</span>
              <Form.Item name="set2_weight_kg" className="mb-0">
                <InputNumber className="w-full" size="large" min={0} step={0.5} />
              </Form.Item>
              <Form.Item name="set2_reps" className="mb-0">
                <InputNumber className="w-full" size="large" min={0} />
              </Form.Item>
            </div>
            <div className="grid grid-cols-[48px_1fr_1fr] gap-2 items-center">
              <span className="text-xs font-medium text-gray-500">Set 3</span>
              <Form.Item name="set3_weight_kg" className="mb-0">
                <InputNumber className="w-full" size="large" min={0} step={0.5} />
              </Form.Item>
              <Form.Item name="set3_reps" className="mb-0">
                <InputNumber className="w-full" size="large" min={0} />
              </Form.Item>
            </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
          <Form.Item
            label={
              <span className="flex items-center gap-2 font-medium text-gray-700">
                <FaClock className="text-accent" />
                ระยะเวลา
              </span>
            }
            name="duration_min"
          >
            <InputNumber
              className="w-full"
              size="large"
              min={0}
              placeholder="นาที"
            />
          </Form.Item>
          <Form.Item
            label={
              <span className="flex items-center gap-2 font-medium text-gray-700">
                <FaBolt className="text-accent" />
                Intensity
              </span>
            }
            name="intensity"
          >
            <Select
              size="large"
              options={[
                { label: "Low", value: "low" },
                { label: "Moderate", value: "moderate" },
                { label: "High", value: "high" },
              ]}
            />
          </Form.Item>
          </div>
          <Form.Item
            label={
              <span className="flex items-center gap-2 font-medium text-gray-700">
                <FaStickyNote className="text-accent" />
                โน้ต
              </span>
            }
            name="notes"
          >
            <Input.TextArea rows={3} placeholder="รายละเอียดเพิ่มเติม" />
          </Form.Item>
          <Form.Item
            label={
              <span className="flex items-center gap-2 font-medium text-gray-700">
                <FaCalendarAlt className="text-accent" />
                เวลาที่ทำ
              </span>
            }
            name="performed_at"
          >
            <DatePicker showTime className="w-full" size="large" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="รายละเอียดการออกกำลังกาย"
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        {selectedLog ? (
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <div className="text-xs text-gray-500">ชื่อการออกกำลังกาย</div>
              <div className="font-medium text-gray-900">
                {selectedLog.name}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-500">เวลา</div>
                <div>
                  {selectedLog.performed_at
                    ? dayjs(selectedLog.performed_at).format(
                        "DD/MM/YYYY HH:mm"
                      )
                    : "-"}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">ประเภท</div>
                <div className="capitalize">
                  {selectedLog.type ?? "-"}
                </div>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">รายละเอียด</div>
              <div>
                {formatLogDetail(selectedLog)
                  .split(" • ")
                  .map((line, lineIndex) => (
                    <p key={`detail-${lineIndex}`}>{line}</p>
                  ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-500">Intensity</div>
                <div className="capitalize">
                  {selectedLog.intensity ?? "-"}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">ระยะเวลา (นาที)</div>
                <div>{selectedLog.duration_min ?? "-"}</div>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">โน้ต</div>
              <div>{selectedLog.notes ?? "-"}</div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
