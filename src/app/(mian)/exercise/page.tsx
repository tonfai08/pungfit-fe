"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { isLoggedIn } from "@/lib/api/auth";
import Modal from "@/components/Modal";
import PageLoader from "@/components/PageLoader";
import { type DayKey, type WorkoutExercise } from "@/lib/api/workout";
import { fetchWorkoutPlan } from "@/lib/features/workoutPlanSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { staggerContainer, staggerItem } from "@/lib/motion";

const FALLBACK_IMAGE = "/images/exercise-placeholder.svg";

function getExerciseImage(item: WorkoutExercise) {
  return item.exerciseId?.media?.image_url || FALLBACK_IMAGE;
}

function ExerciseThumbnail({ src, alt }: { src: string; alt: string }) {
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => setImgSrc(src), [src]);

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill
      sizes="(max-width: 768px) 40vw, 200px"
      className="rounded-md object-cover bg-gray-100"
      onError={() => setImgSrc(FALLBACK_IMAGE)}
    />
  );
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

function isDirectVideo(url: string) {
  return /\.(mp4|mov|webm)(?:\?|$)/i.test(url);
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

  if (loading) return <PageLoader />;

  return (
    <div className="bg-white rounded-xl shadow p-6 w-full max-w-full md:max-w-2xl lg:max-w-3xl xl:max-w-4xl">
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
      <button onClick={() => router.push("/exercise-ai")} className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 font-medium text-white">
        ✨ ให้ AI จัดตารางออกกำลังกาย
      </button>

      {error ? <p className="text-sm text-red-500 mb-3">{error}</p> : null}

      {!plan ? (
        <p className="text-gray-600">ยังไม่มีโปรแกรมการออกกำลังกาย</p>
      ) : (
        <motion.div
          className="space-y-3"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {DAY_LABELS.map((day) => {
            const items = plan.days?.[day.key] ?? [];
            return (
              <motion.div
                key={day.key}
                variants={staggerItem}
                className="border rounded-lg p-4"
              >
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
                        const canPlay = Boolean(embedUrl || (rawVideoUrl && isDirectVideo(rawVideoUrl)));
                        return (
                      <li
                        key={`${day.key}-${item.exerciseId?._id ?? index}`}
                        className="flex items-start gap-4"
                      >
                        <button
                          type="button"
                          className={`relative w-1/2 h-24 ${canPlay ? "cursor-pointer" : "cursor-default"}`}
                          onClick={() => {
                            if (embedUrl || rawVideoUrl) setVideoUrl(embedUrl || rawVideoUrl || null);
                          }}
                          aria-label={
                            canPlay ? "ดูวิดีโอท่าออกกำลังกาย" : "ไม่มีวิดีโอ"
                          }
                        >
                          <ExerciseThumbnail
                            src={getExerciseImage(item)}
                            alt={item.exerciseId?.name || "exercise"}
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
                          {item.exerciseId?.execution_notes ? (
                            <p className="text-xs text-gray-500">
                              {item.exerciseId.execution_notes}
                            </p>
                          ) : null}
                          <p className="text-sm text-gray-600 mt-1">
                            {formatExerciseDetail(item)}
                          </p>
                          {item.exerciseId?.media?.source_url ? (
                            <a href={item.exerciseId.media.source_url} target="_blank" rel="noreferrer" className="mt-1 block text-[10px] text-gray-400 underline">
                              {item.exerciseId.media.attribution || item.exerciseId.media.source}
                              {item.exerciseId.media.license ? ` • ${item.exerciseId.media.license}` : ""}
                            </a>
                          ) : null}
                        </div>
                      </li>
                        );
                      })()
                    ))}
                  </ul>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {plan?.note ? (
        <p className="text-sm text-gray-500 mt-4">หมายเหตุ: {plan.note}</p>
      ) : null}

      <Modal
        isOpen={Boolean(videoUrl)}
        onClose={() => setVideoUrl(null)}
        title="วิดีโอการออกกำลังกาย"
      >
        {videoUrl && isDirectVideo(videoUrl) ? (
          <video src={videoUrl} controls playsInline className="max-h-[70vh] w-full rounded-lg bg-black" />
        ) : videoUrl ? (
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
