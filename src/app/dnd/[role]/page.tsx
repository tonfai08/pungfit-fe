"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  FaBriefcase,
  FaCheckCircle,
  FaCoins,
  FaHandHoldingHeart,
} from "react-icons/fa";

type RoleKey = "ceo" | "pm" | "ba" | "ux" | "junior" | "senior" | "qa";

type RoleInfo = {
  key: RoleKey;
  label: string;
  profile: string;
  cost: number;
  ot: number;
  status: {
    negotiation: number;
    requirement: number;
    design: number;
    frontend: number;
    backend: number;
    qa: number;
  };
  ability: {
    design: number;
    frontend: number;
    backend: number;
  };
};

const roles: RoleInfo[] = [
  {
    key: "ceo",
    label: "CEO",
    profile: "/imgDnd/profile-ceo.png",
    cost: 0,
    ot: 0,
    status: {
      negotiation: 1,
      requirement: 0,
      design: 0,
      frontend: 0,
      backend: 0,
      qa: 0,
    },
    ability: { design: 2, frontend: 1, backend: 1 },
  },
  {
    key: "pm",
    label: "PM",
    profile: "/imgDnd/profile-pm.png",
    cost: 15000,
    ot: 25000,
    status: {
      negotiation: 1,
      requirement: 3,
      design: 0,
      frontend: 1,
      backend: 1,
      qa: 0,
    },
    ability: { design: 2, frontend: 1, backend: 1 },
  },
  {
    key: "ba",
    label: "BA",
    profile: "/imgDnd/profile-ba.png",
    cost: 12000,
    ot: 20000,
    status: {
      negotiation: 3,
      requirement: 1,
      design: 0,
      frontend: 0,
      backend: 0,
      qa: 0,
    },
    ability: { design: 2, frontend: 1, backend: 1 },
  },
  {
    key: "ux",
    label: "UX",
    profile: "/imgDnd/profile-designer.png",
    cost: 15000,
    ot: 25000,
    status: {
      negotiation: 0,
      requirement: 1,
      design: 3,
      frontend: 1,
      backend: 0,
      qa: 0,
    },
    ability: { design: 4, frontend: 2, backend: 2 },
  },
  {
    key: "junior",
    label: "Junior",
    profile: "/imgDnd/profile-junior.png",
    cost: 20000,
    ot: 30000,
    status: {
      negotiation: -1,
      requirement: 0,
      design: 0,
      frontend: 2,
      backend: 2,
      qa: 0,
    },
    ability: { design: 2, frontend: 4, backend: 4 },
  },
  {
    key: "senior",
    label: "Senior",
    profile: "/imgDnd/profile-senior.png",
    cost: 35000,
    ot: 50000,
    status: {
      negotiation: -1,
      requirement: 1,
      design: 1,
      frontend: 3,
      backend: 3,
      qa: 1,
    },
    ability: { design: 2, frontend: 7, backend: 7 },
  },
  {
    key: "qa",
    label: "QA",
    profile: "/imgDnd/profile-qa.png",
    cost: 12000,
    ot: 20000,
    status: {
      negotiation: 0,
      requirement: 1,
      design: 0,
      frontend: 0,
      backend: 0,
      qa: 5,
    },
    ability: { design: 2, frontend: 1, backend: 1 },
  },
];

const roleMap = new Map(roles.map((role) => [role.key, role]));
const rolePathMap = new Map<string, RoleKey>([
  ["ceoQx709A".toLowerCase(), "ceo"],
  ["pmDe421D".toLowerCase(), "pm"],
  ["baR8m204".toLowerCase(), "ba"],
  ["uxPz91K".toLowerCase(), "ux"],
  ["jrN5v882".toLowerCase(), "junior"],
  ["srT7q330".toLowerCase(), "senior"],
  ["qaL4x118".toLowerCase(), "qa"],
]);

function normalizeRole(value: string | string[] | undefined): RoleKey | null {
  const role = Array.isArray(value) ? value[0] : value;
  if (!role) return null;
  return rolePathMap.get(role.toLowerCase()) ?? null;
}

function formatMoney(value: number) {
  return `${value.toLocaleString()} ฿`;
}

function AbilityMeter({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="rounded-lg bg-zinc-950/55 p-3 ring-1 ring-white/10">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-zinc-100">{label}</span>
        <span className="text-sm font-bold text-zinc-50">{value}</span>
      </div>
      <div className="h-3 overflow-hidden rounded bg-zinc-800">
        <div
          className={`h-full rounded ${tone}`}
          style={{ width: `${(value / 7) * 100}%` }}
        />
      </div>
    </div>
  );
}

function StatusCard({ label, value }: { label: string; value: number }) {
  const isNegative = value < 0;
  const isPositive = value > 0;
  const tone = isNegative
    ? "bg-red-500/20 text-red-100 ring-red-300/20"
    : isPositive
    ? "bg-emerald-400/20 text-emerald-100 ring-emerald-200/20"
    : "bg-zinc-950/55 text-zinc-300 ring-white/10";

  return (
    <div className={`rounded-lg p-3 ring-1 ${tone}`}>
      <p className="text-xs font-semibold uppercase text-current/75">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

function OwnStatusPanel({ role }: { role: RoleInfo }) {
  return (
    <section className="rounded-lg border border-white/15 bg-zinc-950/75 p-4 backdrop-blur">
      <div className="mb-3">
        <p className="text-sm font-semibold text-zinc-400">Status</p>
        <h2 className="text-2xl font-bold text-zinc-50">
          ความสามารถของ {role.label}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatusCard label="Negotiation" value={role.status.negotiation} />
        <StatusCard label="Requirement" value={role.status.requirement} />
        <StatusCard label="Design" value={role.status.design} />
        <StatusCard label="Frontend" value={role.status.frontend} />
        <StatusCard label="Backend" value={role.status.backend} />
        <StatusCard label="QA" value={role.status.qa} />
      </div>
    </section>
  );
}

function ProfileImage({
  role,
  size = "md",
}: {
  role: RoleInfo;
  size?: "sm" | "md" | "lg" | "half";
}) {
  const sizeClass =
    size === "half"
      ? "aspect-square w-1/2"
      : size === "lg"
      ? "h-28 w-28"
      : size === "sm"
      ? "h-16 w-16"
      : "h-16 w-16";

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-lg bg-zinc-900 ring-1 ring-white/15 ${sizeClass}`}
    >
      <Image
        src={role.profile}
        alt={`${role.label} profile`}
        fill
        sizes={
          size === "half"
            ? "(max-width: 768px) 50vw, 224px"
            : size === "lg"
            ? "112px"
            : "64px"
        }
        className="object-cover"
        priority={size === "half" || size === "lg"}
      />
    </div>
  );
}

function RoleCard({
  role,
  active,
  onSelect,
}: {
  role: RoleInfo;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-lg p-3 text-left ring-1 transition ${
        active
          ? "bg-amber-300 text-zinc-950 ring-amber-100"
          : "bg-zinc-950/65 text-zinc-100 ring-white/10 hover:bg-zinc-900"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <ProfileImage role={role} size="sm" />
          <span className="truncate text-base font-bold">{role.label}</span>
        </div>
        {active ? <FaCheckCircle className="shrink-0" /> : null}
      </div>
      <div
        className={`mt-2 grid grid-cols-2 gap-2 text-xs ${
          active ? "text-zinc-800" : "text-zinc-300"
        }`}
      >
        <span>Cost {formatMoney(role.cost)}</span>
        <span>OT {formatMoney(role.ot)}</span>
      </div>
    </button>
  );
}

export default function DndRolePage() {
  const params = useParams<{ role?: string }>();
  const currentRoleKey = normalizeRole(params.role);
  const currentRole = currentRoleKey ? roleMap.get(currentRoleKey) : null;
  const [selectedRoleKey, setSelectedRoleKey] = useState<RoleKey>(
    currentRole?.key === "ceo" ? "pm" : currentRole?.key ?? "pm"
  );
  const [helpUsed, setHelpUsed] = useState(false);

  const selectedRole = roleMap.get(selectedRoleKey) ?? roles[1];
  const isCeo = currentRole?.key === "ceo";

  const visibleRoles = useMemo(
    () =>
      isCeo
        ? roles.filter((role) => role.key !== "ceo")
        : currentRole
        ? [currentRole]
        : [],
    [currentRole, isCeo]
  );

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div
        className="min-h-screen bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/imgDnd/bgDND.png')" }}
      >
        <div className="min-h-screen bg-black/60 px-4 py-4">
          <div className="mx-auto flex min-h-[calc(100vh-32px)] w-full max-w-md flex-col gap-3">
            {!currentRole ? (
              <section className="mt-20 rounded-lg border border-white/15 bg-zinc-950/75 p-4 text-center backdrop-blur">
                <h1 className="text-2xl font-bold text-zinc-50">
                  ไม่พบข้อมูลตำแหน่ง
                </h1>
                <p className="mt-2 text-sm text-zinc-400">
                  path นี้ไม่ได้รับอนุญาตหรือ code ไม่ถูกต้อง
                </p>
              </section>
            ) : (
              <>
                <header className="rounded-lg border border-white/15 bg-zinc-950/75 p-4 backdrop-blur">
              <div className="flex items-stretch gap-3">
                <ProfileImage role={currentRole} size="half" />
                <div className="flex min-w-0 flex-1 flex-col pt-2">
                  <p className="text-sm font-semibold text-zinc-400">
                    ตำแหน่งของคุณ
                  </p>
                  <h1 className="truncate text-3xl font-bold text-zinc-50">
                    {currentRole.label}
                  </h1>
                </div>
              </div>
              {isCeo ? (
                <>
                  <p className="mt-3 text-sm leading-6 text-zinc-300">
                    มีตำแหน่งไว้ดูข้อมูลผู้เล่นอื่น มองเห็นค่าจ้างและความสามารถในการเคลียร์งานของแต่ละคน
                  </p>
                  <button
                    type="button"
                    disabled={helpUsed}
                    onClick={() => setHelpUsed(true)}
                    className={`mt-3 w-full rounded-lg p-3 text-left ring-1 transition ${
                      helpUsed
                        ? "bg-zinc-900/70 text-zinc-500 ring-white/10"
                        : "bg-emerald-400/20 text-emerald-100 ring-emerald-200/25 hover:bg-emerald-400/25"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FaHandHoldingHeart />
                      <span className="text-sm font-semibold">
                        ความสามารถพิเศษ
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-bold">
                      {helpUsed ? "ลงช่วยแล้ว" : "CEO ลงมาช่วยได้ 1 ครั้ง"}
                    </p>
                  </button>
                </>
              ) : null}
                </header>

                {isCeo ? (
                  <>
                <section className="rounded-lg border border-white/15 bg-zinc-950/75 p-4 backdrop-blur">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-zinc-50">
                        ดูข้อมูลผู้เล่น
                      </h2>
                      <p className="text-sm text-zinc-400">
                        แตะตำแหน่งเพื่อดูข้อมูล
                      </p>
                    </div>
                    <FaBriefcase className="text-amber-200" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {visibleRoles.map((role) => (
                      <RoleCard
                        key={role.key}
                        role={role}
                        active={role.key === selectedRole.key}
                        onSelect={() => setSelectedRoleKey(role.key)}
                      />
                    ))}
                  </div>
                </section>

                <section className="rounded-lg border border-white/15 bg-zinc-950/75 p-4 backdrop-blur">
                  <div className="mb-3 flex items-stretch gap-3">
                    <ProfileImage role={selectedRole} size="half" />
                    <div className="flex min-w-0 flex-1 flex-col pt-2">
                      <p className="text-sm font-semibold text-zinc-400">
                        รายละเอียด
                      </p>
                      <h2 className="truncate text-2xl font-bold text-zinc-50">
                        {selectedRole.label}
                      </h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-yellow-500/20 p-3 ring-1 ring-yellow-300/20">
                      <div className="flex items-center gap-2 text-yellow-100">
                        <FaCoins />
                        <span className="text-sm font-semibold">ค่าจ้าง</span>
                      </div>
                      <p className="mt-2 text-xl font-bold text-yellow-100">
                        {formatMoney(selectedRole.cost)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-zinc-900/85 p-3 ring-1 ring-white/10">
                      <div className="flex items-center gap-2 text-amber-100">
                        <FaBriefcase />
                        <span className="text-sm font-semibold">OT</span>
                      </div>
                      <p className="mt-2 text-xl font-bold text-amber-100">
                        {formatMoney(selectedRole.ot)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2">
                    <AbilityMeter
                      label="Design"
                      value={selectedRole.ability.design}
                      tone="bg-pink-400"
                    />
                    <AbilityMeter
                      label="Frontend"
                      value={selectedRole.ability.frontend}
                      tone="bg-sky-400"
                    />
                    <AbilityMeter
                      label="Backend"
                      value={selectedRole.ability.backend}
                      tone="bg-violet-400"
                    />
                  </div>
                </section>
                  </>
                ) : (
                  <OwnStatusPanel role={currentRole} />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
