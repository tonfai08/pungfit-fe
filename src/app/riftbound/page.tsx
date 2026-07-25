"use client";

import Image from "next/image";
import { useState } from "react";

type RuneDomain = "FURY" | "CALM" | "MIND" | "BODY" | "CHAOS" | "ORDER";
type RuneCounts = { ready: number; exhausted: number; recycled: number };
type PlayerRuneState = {
  selectedDomains: RuneDomain[];
  activeDomain: RuneDomain | null;
  runes: Record<RuneDomain, RuneCounts>;
};
type RuneConfig = { id: RuneDomain; name: string; image: string; accent: string; softAccent: string };

const RUNE_DOMAINS: RuneConfig[] = [
  { id: "FURY", name: "Fury", image: "/riftbound/fury-rune.avif", accent: "#dc4a3d", softAccent: "#fce2df" },
  { id: "CALM", name: "Calm", image: "/riftbound/calm-rune.avif", accent: "#3d96c6", softAccent: "#e0f3fb" },
  { id: "MIND", name: "Mind", image: "/riftbound/mind-rune.avif", accent: "#8759bf", softAccent: "#eee6f8" },
  { id: "BODY", name: "Body", image: "/riftbound/body-rune.avif", accent: "#b87935", softAccent: "#f8eadb" },
  { id: "CHAOS", name: "Chaos", image: "/riftbound/chaos-rune.avif", accent: "#a84096", softAccent: "#f8e1f4" },
  { id: "ORDER", name: "Order", image: "/riftbound/order-rune.avif", accent: "#d69b2e", softAccent: "#fff2d7" },
];

const emptyRunes = (): Record<RuneDomain, RuneCounts> =>
  Object.fromEntries(RUNE_DOMAINS.map(({ id }) => [id, { ready: 0, exhausted: 0, recycled: 0 }])) as Record<RuneDomain, RuneCounts>;

const createPlayer = (): PlayerRuneState => ({ selectedDomains: [], activeDomain: null, runes: emptyRunes() });
const getRune = (id: RuneDomain) => RUNE_DOMAINS.find((rune) => rune.id === id)!;

function RuneCard({ domain, status, onClick }: { domain: RuneDomain; status: "ready" | "exhausted" | "recycled"; onClick?: () => void }) {
  const rune = getRune(domain);
  const used = status !== "ready";
  const canToggle = status !== "recycled";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!canToggle}
      aria-label={status === "ready" ? `Use ${rune.name} rune` : status === "exhausted" ? `Return ${rune.name} rune to ready` : `${rune.name} rune recycled`}
      className={`relative flex w-full min-w-0 flex-col items-center px-0.5 py-1 transition active:scale-95 sm:py-2 ${used ? "opacity-80" : ""} ${canToggle ? "cursor-pointer" : "cursor-default"}`}
    >
      <Image src={rune.image} alt={rune.name} width={82} height={82} className={`h-auto w-full max-w-[72px] object-contain sm:max-w-[86px] ${status === "exhausted" ? "grayscale" : ""}`} />
      {used && (
        <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${status === "exhausted" ? "bg-amber-400" : "bg-violet-500"}`} />
      )}
    </button>
  );
}

function DomainPicker({ playerNumber, player, onChange }: { playerNumber: number; player: PlayerRuneState; onChange: (player: PlayerRuneState) => void }) {
  const toggleDomain = (domain: RuneDomain) => {
    const isSelected = player.selectedDomains.includes(domain);
    if (!isSelected && player.selectedDomains.length === 2) return;
    const selectedDomains = isSelected ? player.selectedDomains.filter((item) => item !== domain) : [...player.selectedDomains, domain];
    onChange({ ...player, selectedDomains, activeDomain: selectedDomains[0] ?? null });
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-3 shadow-[0_12px_35px_rgba(15,23,42,0.09)] sm:p-5">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Setup</p>
      <div className="mb-3 flex items-end justify-between gap-2">
        <h2 className="text-lg font-black text-slate-900 sm:text-2xl">Player {playerNumber}</h2>
        <span className={`rounded-full px-2 py-1 text-[10px] font-black ${player.selectedDomains.length === 2 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
          {player.selectedDomains.length}/2 selected
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {RUNE_DOMAINS.map((rune) => {
          const selected = player.selectedDomains.includes(rune.id);
          const disabled = !selected && player.selectedDomains.length === 2;
          return (
            <button
              type="button"
              key={rune.id}
              disabled={disabled}
              onClick={() => toggleDomain(rune.id)}
              className="flex min-h-[78px] flex-col items-center justify-center rounded-2xl border-2 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-35"
              style={{ borderColor: selected ? rune.accent : "#e2e8f0", backgroundColor: selected ? rune.softAccent : "#f8fafc" }}
            >
              <Image src={rune.image} alt="" width={42} height={42} className="h-9 w-9 object-contain sm:h-10 sm:w-10" />
              <span className="mt-1 text-[10px] font-black sm:text-xs" style={{ color: selected ? rune.accent : "#64748b" }}>{rune.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function PlayerPanel({ playerNumber, player, onChange, onResetGame }: { playerNumber: number; player: PlayerRuneState; onChange: (player: PlayerRuneState) => void; onResetGame: () => void }) {
  const readyCards = player.selectedDomains.flatMap((domain) => Array.from({ length: player.runes[domain].ready }, (_, index) => ({ domain, index })));
  const usedCards = player.selectedDomains.flatMap((domain) => [
    ...Array.from({ length: player.runes[domain].exhausted }, (_, index) => ({ domain, index, status: "exhausted" as const })),
  ]);

  const updateRune = (domain: RuneDomain, change: (counts: RuneCounts) => RuneCounts) => {
    onChange({ ...player, runes: { ...player.runes, [domain]: change(player.runes[domain]) } });
  };

  const resetTurn = () => {
    onChange({
      ...player,
      runes: Object.fromEntries(RUNE_DOMAINS.map(({ id }) => [id, { ...player.runes[id], ready: player.runes[id].ready + player.runes[id].exhausted, exhausted: 0 }])) as Record<RuneDomain, RuneCounts>,
    });
  };

  const toggleCard = (domain: RuneDomain, status: "ready" | "exhausted" | "recycled") => {
    if (status === "recycled") return;
    onChange({
      ...player,
      runes: {
        ...player.runes,
        [domain]: status === "ready"
          ? { ...player.runes[domain], ready: player.runes[domain].ready - 1, exhausted: player.runes[domain].exhausted + 1 }
          : { ...player.runes[domain], ready: player.runes[domain].ready + 1, exhausted: player.runes[domain].exhausted - 1 },
      },
    });
  };

  return (
    <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-3 shadow-[0_12px_35px_rgba(15,23,42,0.09)] sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div><h2 className="text-lg font-black text-slate-900 sm:text-2xl">Player {playerNumber}</h2></div>
        <button type="button" onClick={onResetGame} className="min-h-10 rounded-xl border border-slate-200 px-2 text-[10px] font-bold text-slate-500 hover:bg-red-50 hover:text-red-600 sm:text-xs">Reset Game</button>
      </div>

      <div className="mb-4 rounded-3xl border border-slate-200 bg-slate-50 p-2 sm:p-3">
        <div className="grid grid-cols-2 gap-2">
          {player.selectedDomains.map((domain) => {
            const rune = getRune(domain);
            const counts = player.runes[domain];
            return (
              <article key={domain} className="overflow-hidden rounded-2xl border-2 bg-white" style={{ borderColor: rune.accent }}>
                <div className="flex min-h-[108px] flex-col items-center justify-center px-2 py-2" style={{ backgroundColor: rune.softAccent, color: rune.accent }}>
                  <Image src={rune.image} alt="" width={52} height={52} className="h-12 w-12 object-contain" />
                  <span className="mt-1 text-xs font-black">{rune.name}</span>
                  <span className="mt-1 text-[9px] font-bold opacity-75">Ready {counts.ready} · Used {counts.exhausted}</span>
                </div>
                <div className="grid grid-cols-2 border-t" style={{ borderColor: rune.accent }}>
                  <button type="button" onClick={() => updateRune(domain, (current) => ({ ...current, ready: current.ready + 1 }))} className="min-h-11 border-r px-1 text-[10px] font-black text-emerald-700 hover:bg-emerald-50" style={{ borderColor: rune.accent }}>+ Add</button>
                  <button type="button" disabled={!counts.ready} onClick={() => updateRune(domain, (current) => ({ ...current, ready: current.ready - 1 }))} className="min-h-11 px-1 text-[10px] font-black text-violet-700 hover:bg-violet-50 disabled:opacity-35">Recycle</button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="mt-4 max-h-[520px] space-y-3 overflow-y-auto pr-1">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-2.5 sm:p-3">
          <div className="mb-2 flex items-center justify-between"><p className="text-xs font-black text-emerald-900">Ready Runes</p><span className="text-[10px] font-bold text-emerald-700">{readyCards.length} cards</span></div>
          {readyCards.length ? <div className="grid min-h-[150px] grid-cols-7 content-start gap-0.5 sm:gap-1">{readyCards.map(({ domain, index }) => <RuneCard key={`${domain}-ready-${index}`} domain={domain} status="ready" onClick={() => toggleCard(domain, "ready")} />)}</div> : <p className="flex min-h-[150px] items-center justify-center text-center text-xs font-semibold text-emerald-800/60">Add runes for the selected domains.</p>}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2.5 sm:p-3">
          <div className="mb-2 flex items-center justify-between"><p className="text-xs font-black text-slate-700">Used Runes</p></div>
          {usedCards.length ? <div className="grid min-h-[150px] grid-cols-7 content-start gap-0.5 sm:gap-1">{usedCards.map(({ domain, index, status }) => <RuneCard key={`${domain}-${status}-${index}`} domain={domain} status={status} onClick={() => toggleCard(domain, status)} />)}</div> : <p className="flex min-h-[150px] items-center justify-center text-center text-xs font-semibold text-slate-400">Used runes will appear here.</p>}
        </div>
      </div>

      <button type="button" onClick={resetTurn} className="mt-3 min-h-12 w-full rounded-2xl border-2 border-slate-800 bg-white px-3 text-xs font-black text-slate-800 hover:bg-slate-100">Reset Turn <span className="font-medium text-slate-500">(return Exhausted to Ready)</span></button>
    </section>
  );
}

export default function RiftboundRuneTrackerPage() {
  const [players, setPlayers] = useState<[PlayerRuneState, PlayerRuneState]>(() => [createPlayer(), createPlayer()]);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const updatePlayer = (index: 0 | 1, player: PlayerRuneState) => setPlayers((current) => { const next = [...current] as [PlayerRuneState, PlayerRuneState]; next[index] = player; return next; });
  const canStart = players.every((player) => player.selectedDomains.length === 2);

  return (
    <main className="min-h-screen w-full bg-[radial-gradient(circle_at_top,#e0f2fe_0%,#f8fafc_38%,#eef2ff_100%)] px-2 py-4 sm:px-4 sm:py-6">
      <div className="w-full">
        {!isSetupComplete ? (
          <>
            <p className="mx-auto mb-5 max-w-md text-center text-sm font-medium text-slate-600">Each player chooses exactly two Rune Domains before the game starts.</p>
            <div className="grid grid-cols-2 gap-2 sm:gap-5"><DomainPicker playerNumber={1} player={players[0]} onChange={(player) => updatePlayer(0, player)} /><DomainPicker playerNumber={2} player={players[1]} onChange={(player) => updatePlayer(1, player)} /></div>
            <button type="button" disabled={!canStart} onClick={() => setIsSetupComplete(true)} className="mx-auto mt-5 flex min-h-14 w-full max-w-md items-center justify-center rounded-2xl bg-indigo-600 px-5 text-sm font-black text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-35">Ready — Start Tracking</button>
          </>
        ) : (
          <>
            <div className="mb-4 flex justify-center"><button type="button" onClick={() => setIsSetupComplete(false)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Change selected domains</button></div>
            <div className="grid grid-cols-2 gap-2 sm:gap-5"><PlayerPanel playerNumber={1} player={players[0]} onChange={(player) => updatePlayer(0, player)} onResetGame={() => { updatePlayer(0, createPlayer()); setIsSetupComplete(false); }} /><PlayerPanel playerNumber={2} player={players[1]} onChange={(player) => updatePlayer(1, player)} onResetGame={() => { updatePlayer(1, createPlayer()); setIsSetupComplete(false); }} /></div>
          </>
        )}
      </div>
    </main>
  );
}
