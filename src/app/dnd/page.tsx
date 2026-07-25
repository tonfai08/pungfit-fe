"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  FaBug,
  FaCoins,
  FaCode,
  FaPaintBrush,
  FaServer,
  FaSmile,
  FaTasks,
} from "react-icons/fa";

type StatKey =
  | "customer"
  | "design"
  | "front"
  | "back"
  | "bugs";

type Stat = {
  key: StatKey;
  label: string;
  value: number;
  max: number;
  icon: ReactNode;
  tone: string;
  fill: string;
};

const roleCosts = [
  { role: "PM", cost: "15k", ot: "25k" },
  { role: "BA", cost: "12k", ot: "20k" },
  { role: "UX", cost: "15k", ot: "25k" },
  { role: "Junior", cost: "20k", ot: "30k" },
  { role: "Senior", cost: "35k", ot: "50k" },
  { role: "QA", cost: "12k", ot: "20k" },
];

const TASK_MAX = 20;
const TASK_TOTAL_MAX = TASK_MAX * 3;

const clamp = (value: number, max: number) => {
  if (!Number.isFinite(value)) return 0;
  return Math.min(max, Math.max(0, value));
};

function customerAsset(score: number) {
  if (score <= 3) {
    return {
      src: "/imgDnd/customer_3.png",
      label: "ลูกค้าไม่พอใจ",
      tone: "text-red-200",
    };
  }

  if (score <= 7) {
    return {
      src: "/imgDnd/customer_2.png",
      label: "ลูกค้ากำลังพิจารณา",
      tone: "text-amber-100",
    };
  }

  return {
    src: "/imgDnd/customer_1.png",
    label: "ลูกค้าพอใจมาก",
    tone: "text-emerald-100",
  };
}

function ProgressBar({ stat }: { stat: Stat }) {
  const percent = (stat.value / stat.max) * 100;

  return (
    <div className="rounded-lg border border-white/15 bg-zinc-950/70 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.28)] backdrop-blur">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${stat.tone}`}
          >
            {stat.icon}
          </span>
          <p className="truncate text-sm font-semibold text-zinc-100">
            {stat.label}
          </p>
        </div>
        <p className="shrink-0 text-sm font-semibold text-zinc-100">
          {stat.value.toLocaleString()} / {stat.max.toLocaleString()}
        </p>
      </div>
      <div className="h-4 overflow-hidden rounded bg-zinc-800 ring-1 ring-white/10">
        <div
          className={`h-full rounded ${stat.fill}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function MoneyDisplay({ value }: { value: number }) {
  return (
    <div className="rounded-lg border border-yellow-300/30 bg-zinc-950/75 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.28)] backdrop-blur">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-yellow-500/20 text-xl text-yellow-200">
          <FaCoins />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-300">จำนวนเงิน</p>
          <p className="truncate text-3xl font-bold text-yellow-100">
            {value.toLocaleString()} ฿
          </p>
        </div>
      </div>
    </div>
  );
}

function Stepper({
  label,
  value,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="grid grid-cols-[minmax(90px,1fr)_auto] items-center gap-3 rounded-md bg-zinc-950/55 px-3 py-2 ring-1 ring-white/10">
      <label className="min-w-0 text-sm font-medium text-zinc-200">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`ลด${label}`}
          onClick={() => onChange(clamp(value - step, max))}
          className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-800 text-lg font-semibold text-zinc-100 transition hover:bg-zinc-700"
        >
          -
        </button>
        <input
          type="number"
          value={value}
          min={0}
          max={max}
          step={step}
          onChange={(event) => onChange(clamp(Number(event.target.value), max))}
          className="h-8 w-24 rounded-md border border-white/10 bg-zinc-900 text-center text-sm font-semibold text-zinc-100 outline-none focus:border-amber-300"
        />
        <button
          type="button"
          aria-label={`เพิ่ม${label}`}
          onClick={() => onChange(clamp(value + step, max))}
          className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-800 text-lg font-semibold text-zinc-100 transition hover:bg-zinc-700"
        >
          +
        </button>
      </div>
    </div>
  );
}

function ExpensePanel() {
  return (
    <div className="mt-4 rounded-lg bg-zinc-900/70 p-3 ring-1 ring-white/10">
      <div className="mb-3 flex items-center justify-between gap-3 rounded-md bg-yellow-500/12 px-3 py-2 ring-1 ring-yellow-300/20">
        <span className="text-sm font-semibold text-yellow-100">
          ค่าใช้จ่ายบริษัท
        </span>
        <span className="text-lg font-bold text-yellow-100">20,000 ฿</span>
      </div>

      <div className="overflow-hidden rounded-md ring-1 ring-white/10">
        <table className="w-full table-fixed text-left text-sm">
          <thead className="bg-zinc-950/85 text-xs uppercase text-zinc-400">
            <tr>
              <th className="px-3 py-2 font-semibold">Role</th>
              <th className="px-3 py-2 text-right font-semibold">Cost</th>
              <th className="px-3 py-2 text-right font-semibold">OT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 bg-zinc-950/35">
            {roleCosts.map((item) => (
              <tr key={item.role}>
                <td className="px-3 py-2 font-medium text-zinc-100">
                  {item.role}
                </td>
                <td className="px-3 py-2 text-right text-zinc-300">
                  {item.cost}
                </td>
                <td className="px-3 py-2 text-right text-zinc-300">
                  {item.ot}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function DndPage() {
  const [money, setMoney] = useState(72000);
  const [customer, setCustomer] = useState(8);
  const [design, setDesign] = useState(5);
  const [front, setFront] = useState(6);
  const [back, setBack] = useState(4);
  const [bugs, setBugs] = useState(3);

  const customerMood = customerAsset(customer);
  const taskTotal = design + front + back;

  const stats = useMemo<Stat[]>(
    () => [
      {
        key: "customer",
        label: "ความพอใจลูกค้า",
        value: customer,
        max: 10,
        icon: <FaSmile />,
        tone: "bg-emerald-500/20 text-emerald-200",
        fill: "bg-emerald-400",
      },
      {
        key: "design",
        label: "Task Design",
        value: design,
        max: TASK_MAX,
        icon: <FaPaintBrush />,
        tone: "bg-pink-500/20 text-pink-200",
        fill: "bg-pink-400",
      },
      {
        key: "front",
        label: "Task Front",
        value: front,
        max: TASK_MAX,
        icon: <FaCode />,
        tone: "bg-sky-500/20 text-sky-200",
        fill: "bg-sky-400",
      },
      {
        key: "back",
        label: "Task Back",
        value: back,
        max: TASK_MAX,
        icon: <FaServer />,
        tone: "bg-violet-500/20 text-violet-200",
        fill: "bg-violet-400",
      },
      {
        key: "bugs",
        label: "ค่าบัค",
        value: bugs,
        max: 10,
        icon: <FaBug />,
        tone: "bg-red-500/20 text-red-200",
        fill: "bg-red-500",
      },
    ],
    [back, bugs, customer, design, front]
  );

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div
        className="min-h-screen bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/imgDnd/bgDND.png')" }}
      >
        <div className="min-h-screen bg-black/55 px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto grid min-h-[calc(100vh-40px)] w-full max-w-7xl gap-4 lg:grid-cols-[1fr_360px]">
            <section className="grid gap-4 lg:grid-rows-[auto_1fr]">
              <header className="rounded-lg border border-white/15 bg-zinc-950/70 px-4 py-3 backdrop-blur">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-bold text-zinc-50 sm:text-3xl">
                      Software Quest Board
                    </h1>
                    <p className="mt-1 text-sm text-zinc-300">
                      หน้าลับสำหรับดูสถานะมินิเกมธีมบริษัทซอฟต์แวร์
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-md bg-zinc-900/80 px-3 py-2 ring-1 ring-white/10">
                    <FaTasks className="text-amber-200" />
                    <span className="text-sm font-semibold">
                      งานรวม {taskTotal} / {TASK_TOTAL_MAX}
                    </span>
                  </div>
                </div>
              </header>

              <div className="grid gap-4 xl:grid-cols-[minmax(320px,420px)_1fr]">
                <section className="rounded-lg border border-white/15 bg-zinc-950/72 p-4 backdrop-blur">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-zinc-50">
                        ลูกค้า
                      </h2>
                      <p className={`text-sm font-medium ${customerMood.tone}`}>
                        {customerMood.label}
                      </p>
                    </div>
                    <span className="rounded-md bg-zinc-900 px-3 py-1 text-sm font-bold ring-1 ring-white/10">
                      Lv. {customer}
                    </span>
                  </div>
                  <div className="relative mx-auto aspect-[4/5] w-full max-w-[320px] overflow-hidden rounded-lg bg-zinc-900/60 ring-1 ring-white/10">
                    <Image
                      src={customerMood.src}
                      alt={customerMood.label}
                      fill
                      sizes="(max-width: 768px) 80vw, 320px"
                      className="object-contain p-3"
                      priority
                    />
                  </div>
                </section>

                <section className="grid content-start gap-3">
                  <MoneyDisplay value={money} />
                  {stats.map((stat) => (
                    <ProgressBar key={stat.key} stat={stat} />
                  ))}
                </section>
              </div>
            </section>

            <aside className="rounded-lg border border-white/15 bg-zinc-950/78 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.38)] backdrop-blur">
              <h2 className="text-lg font-semibold text-zinc-50">
                ปรับค่าสถานะ
              </h2>
              <div className="mt-4 grid gap-2">
                <Stepper
                  label="เงิน"
                  value={money}
                  max={999000}
                  step={1000}
                  onChange={setMoney}
                />
                <Stepper
                  label="ลูกค้า"
                  value={customer}
                  max={10}
                  onChange={setCustomer}
                />
                <Stepper
                  label="Design"
                  value={design}
                  max={TASK_MAX}
                  onChange={setDesign}
                />
                <Stepper
                  label="Front"
                  value={front}
                  max={TASK_MAX}
                  onChange={setFront}
                />
                <Stepper
                  label="Back"
                  value={back}
                  max={TASK_MAX}
                  onChange={setBack}
                />
                <Stepper label="บัค" value={bugs} max={10} onChange={setBugs} />
              </div>
              <ExpensePanel />
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
