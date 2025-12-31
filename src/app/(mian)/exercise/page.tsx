"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/api/auth";
import Modal from "@/components/Modal";
import { type DayKey, type WorkoutExercise } from "@/lib/api/workout";
import { fetchWorkoutPlan } from "@/lib/features/workoutPlanSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";

const FALLBACK_IMAGE = "/images/exercise-placeholder.svg";

function getExerciseImage(item: WorkoutExercise) {
  console.log('image_url', item.exerciseId?.media?.image_url);
  return item.exerciseId?.media?.image_url || FALLBACK_IMAGE;

}

const DAY_LABELS: { key: DayKey; label: string }[] = [
  { key: "mon", label: "จันทร์" },
  { key: "tue", label: "อังคาร" },
  { key: "wed", label: "พุธ" },
  { key: "thu", label: "พฤหัสบดี" },
  { key: "fri", label: "ศุกร์" },
  { key: "sat", label: "เสาร์" },
  { key: "sun", label: "อาทิตย์" },
];

function formatExerciseDetail(item: WorkoutExercise) {
  if (item.type === "cardio") {
    if (item.time_min) return `${item.time_min} นาที`;
    return "คาร์ดิโอ";
  }

  const parts: string[] = [];
  if (item.sets) parts.push(`${item.sets} เซ็ต`);
  if (item.reps) parts.push(`${item.reps} ครั้ง`);
  if (parts.length > 0) return parts.join(" • ");
  return item.type || "-";
}

function getYoutubeEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }
    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }
  } catch {
    return "";
  }
  return "";
}

export default function ExercisePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { data: plan, loading, error } = useAppSelector(
    (state) => state.workoutPlan
  );
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }

    dispatch(fetchWorkoutPlan());
  }, [router, dispatch]);

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="bg-white rounded-xl shadow p-6 w-full max-w-full md:max-w-2/4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-accent">ออกกำลังกาย</h1>
          {/* {plan?.weekLabel ? (
            <p className="text-sm text-gray-500">สัปดาห์: {plan.weekLabel}</p>
          ) : null} */}
        </div>
        {plan?.is_active !== undefined ? (
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              plan.is_active
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {plan.is_active ? "Active" : "Inactive"}
          </span>
        ) : null}
      </div>

      {error ? <p className="text-sm text-red-500 mb-3">{error}</p> : null}

      {!plan ? (
        <p className="text-gray-600">ยังไม่มีโปรแกรมการออกกำลังกาย</p>
      ) : (
        <div className="space-y-3">
          {DAY_LABELS.map((day) => {
            const items = plan.days?.[day.key] ?? [];
            return (
              <div key={day.key} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">{day.label}</h2>
                  <span className="text-xs text-gray-500">
                    {items.length} รายการ
                  </span>
                </div>
                {items.length === 0 ? (
                  <p className="text-sm text-gray-500 mt-2">พัก / ไม่มีโปรแกรม</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {items.map((item, index) => (
                      (() => {
                        const rawVideoUrl = item.exerciseId?.media?.video_url;
                        const embedUrl = rawVideoUrl
                          ? getYoutubeEmbedUrl(rawVideoUrl)
                          : "";
                        const canPlay = Boolean(embedUrl);
                        return (
                      <li
                        key={`${day.key}-${item.exerciseId?._id ?? index}`}
                        className="flex items-start gap-4"
                      >
                        <button
                          type="button"
                          className={`relative w-1/2 ${canPlay ? "cursor-pointer" : "cursor-default"}`}
                          onClick={() => {
                            if (embedUrl) setVideoUrl(embedUrl);
                          }}
                          aria-label={
                            canPlay ? "ดูวิดีโอท่าออกกำลังกาย" : "ไม่มีวิดีโอ"
                          }
                        >
                          <img
                            src={getExerciseImage(item)}
                            alt={item.exerciseId?.name || "exercise"}
                            className="w-full h-24 rounded-md object-cover bg-gray-100"
                            onError={(e) => {
                              e.currentTarget.src = FALLBACK_IMAGE;
                            }}
                          />
                          {canPlay ? (
                            <span className="absolute inset-0 flex items-center justify-center text-white text-xs">
                              ▶
                            </span>
                          ) : null}
                        </button>
                        <div className="w-1/2">
                          <p className="font-medium">
                            {item.exerciseId?.name ?? "ไม่พบชื่อท่า"}
                          </p>
                          {item.exerciseId?.aliases?.length ? (
                            <p className="text-xs text-gray-500">
                              {item.exerciseId.aliases[0]}
                            </p>
                          ) : null}
                          <p className="text-sm text-gray-600 mt-1">
                            {formatExerciseDetail(item)}
                          </p>
                        </div>
                      </li>
                        );
                      })()
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      {plan?.note ? (
        <p className="text-sm text-gray-500 mt-4">หมายเหตุ: {plan.note}</p>
      ) : null}

      <Modal
        isOpen={Boolean(videoUrl)}
        onClose={() => setVideoUrl(null)}
        title="วิดีโอการออกกำลังกาย"
      >
        {videoUrl ? (
          <div className="relative w-full pt-[56.25%]">
            <iframe
              src={videoUrl}
              title="Exercise video"
              className="absolute inset-0 w-full h-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

