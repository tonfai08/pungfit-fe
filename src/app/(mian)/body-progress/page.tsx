"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { message, Modal, Select } from "antd";
import { FaCamera, FaChevronLeft, FaChevronRight, FaTrash } from "react-icons/fa";
import PageLoader from "@/components/PageLoader";
import { API_BASE_URL } from "@/lib/constants";
import { BodyProgressRecord, deleteBodyProgress, getBodyProgress, saveBodyProgress } from "@/lib/api/body-progress";

const displayDate = (date: string) => new Date(`${date}T00:00:00+07:00`).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });

async function cropImage(file: File, zoom: number, x: number, y: number) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = 900; canvas.height = 1200;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Crop failed");
  context.fillStyle = "#000";
  context.fillRect(0, 0, canvas.width, canvas.height);
  const containScale = Math.min(canvas.width / bitmap.width, canvas.height / bitmap.height);
  const drawWidth = bitmap.width * containScale * zoom;
  const drawHeight = bitmap.height * containScale * zoom;
  const drawX = (canvas.width - drawWidth) / 2 + (x / 200) * canvas.width;
  const drawY = (canvas.height - drawHeight) / 2 + (y / 200) * canvas.height;
  context.drawImage(bitmap, drawX, drawY, drawWidth, drawHeight);
  bitmap.close();
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Crop failed")), "image/jpeg", 0.88));
}

export default function BodyProgressPage() {
  const [records, setRecords] = useState<BodyProgressRecord[]>([]);
  const [today, setToday] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [canSelectDate, setCanSelectDate] = useState(false);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [active, setActive] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [zoom, setZoom] = useState(1);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const track = useRef<HTMLDivElement>(null);

  const load = useCallback(async (nextLimit: number) => {
    try { setLoading(true); const data = await getBodyProgress(nextLimit); setRecords(data.records); setToday(data.today); setSelectedDate(data.today); setCanSelectDate(data.can_select_date); setActive(0); }
    catch (err) { message.error(err instanceof Error ? err.message : "โหลดไม่สำเร็จ"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(limit); }, [limit, load]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const chooseFile = (selected?: File) => {
    if (!selected) return;
    if (preview) URL.revokeObjectURL(preview);
    setFile(selected); setPreview(URL.createObjectURL(selected)); setZoom(1); setX(0); setY(0);
  };
  const closeEditor = () => { if (!saving) { setFile(null); setPreview(""); } };
  const save = async () => {
    if (!file) return;
    try { setSaving(true); await saveBodyProgress(await cropImage(file, zoom, x, y), canSelectDate ? selectedDate : undefined); message.success("บันทึกรูปเรียบร้อย"); setFile(null); setPreview(""); await load(limit); }
    catch (err) { message.error(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ"); }
    finally { setSaving(false); }
  };
  const remove = (record: BodyProgressRecord) => Modal.confirm({ title: `ลบรูปวันที่ ${displayDate(record.date_key)}?`, content: "เมื่อลบแล้วจะกู้คืนไม่ได้", okText: "ลบ", okType: "danger", cancelText: "ยกเลิก", onOk: async () => { await deleteBodyProgress(record._id); message.success("ลบแล้ว"); await load(limit); } });
  const scrollTo = (index: number) => track.current?.children[index]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });

  if (loading) return <PageLoader label="กำลังโหลดฟิล์มรูปร่าง..." />;
  const hasToday = records.some(r => r.date_key === today);
  return <div className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white py-6 shadow">
    <div className="flex items-start justify-between gap-3 px-5">
      <div><h1 className="text-2xl font-semibold text-accent">ฟิล์มรูปร่างของฉัน</h1><p className="mt-1 text-sm text-gray-500">เลื่อนดูการเปลี่ยนแปลงจากใหม่ไปเก่า</p></div>
      <Select value={limit} onChange={setLimit} options={[10,20,30,50].map(value => ({ value, label: `${value} รูป` }))} />
    </div>
    {records.length ? <div className="relative mt-6">
      <div ref={track} onScroll={() => { const el = track.current; if (!el) return; const center = el.scrollLeft + el.clientWidth / 2; let nearest=0, distance=Infinity; Array.from(el.children).forEach((child,i) => { const node=child as HTMLElement; const d=Math.abs(node.offsetLeft+node.offsetWidth/2-center); if(d<distance){distance=d;nearest=i;} }); setActive(nearest); }} className="flex touch-pan-x snap-x snap-proximity gap-3 overflow-x-auto overscroll-x-contain px-[14%] pb-4 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
        {records.map((record, index) => <article key={record._id} className={`relative w-[72%] max-w-sm shrink-0 snap-center transition duration-300 ${active===index ? "scale-100 opacity-100 blur-none" : Math.abs(active-index)===1 ? "scale-90 opacity-55 blur-[2px]" : "scale-85 opacity-30 blur-sm"}`}>
          <div className="aspect-[3/4] overflow-hidden rounded-2xl bg-gray-100 shadow-xl"><img src={`${API_BASE_URL}${record.image_path}?v=${record.updatedAt}`} alt={`รูปร่างวันที่ ${record.date_key}`} className="h-full w-full object-cover" /></div>
          <div className="mt-3 flex items-center justify-center gap-3"><p className="text-center font-medium text-gray-700">{displayDate(record.date_key)}</p><button onClick={() => remove(record)} aria-label="ลบรูป" className="rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"><FaTrash /></button></div>
        </article>)}
      </div>
      <button onClick={() => scrollTo(Math.max(0,active-1))} className="absolute left-2 top-[42%] rounded-full bg-white/85 p-3 text-accent shadow"><FaChevronLeft /></button>
      <button onClick={() => scrollTo(Math.min(records.length-1,active+1))} className="absolute right-2 top-[42%] rounded-full bg-white/85 p-3 text-accent shadow"><FaChevronRight /></button>
      <div className="flex justify-center gap-2">{records.map((r,i) => <button key={r._id} onClick={() => scrollTo(i)} className={`h-2 rounded-full transition-all ${i===active ? "w-6 bg-accent" : "w-2 bg-accent/25"}`} aria-label={`รูปที่ ${i+1}`} />)}</div>
    </div> : <div className="mx-5 mt-8 rounded-2xl border border-dashed border-accent/30 bg-accent/5 px-6 py-16 text-center text-gray-500">ยังไม่มีรูป เริ่มบันทึกการเปลี่ยนแปลงวันนี้ได้เลย</div>}
    <div className="mt-7 flex justify-center"><label className="flex cursor-pointer items-center gap-2 rounded-full bg-accent px-5 py-3 font-medium text-white shadow-lg"><FaCamera />{canSelectDate ? "เพิ่มรูปสำหรับทดสอบ" : hasToday ? "เปลี่ยนรูปวันนี้" : "บันทึกรูปวันนี้"}<input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" onChange={e => chooseFile(e.target.files?.[0])} /></label></div>
    <p className="mt-3 text-center text-xs text-gray-400">วันเก่าลบได้ แต่เปลี่ยนรูปย้อนหลังไม่ได้</p>
    <Modal open={Boolean(file)} onCancel={closeEditor} onOk={save} okText={saving ? "กำลังบันทึก..." : "บันทึกรูป"} cancelText="ยกเลิก" confirmLoading={saving} title="จัดตำแหน่งรูปแนวตั้ง">
      {preview ? <>{canSelectDate ? <label className="mb-4 block text-sm font-medium">วันที่สำหรับทดสอบ<input type="date" value={selectedDate} max={today} onChange={e => setSelectedDate(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2" /></label> : null}<div className="mx-auto aspect-[3/4] w-full max-w-xs overflow-hidden rounded-xl bg-black"><img src={preview} alt="ตัวอย่างก่อนบันทึก" className="h-full w-full object-contain" style={{ transform:`translate(${x/2}%, ${y/2}%) scale(${zoom})` }} /></div>
      <label className="mt-4 block text-sm">ซูม<input className="w-full" type="range" min="1" max="2" step="0.05" value={zoom} onChange={e=>setZoom(Number(e.target.value))}/></label>
      <label className="mt-2 block text-sm">ซ้าย–ขวา<input className="w-full" type="range" min="-100" max="100" value={x} onChange={e=>setX(Number(e.target.value))}/></label>
      <label className="mt-2 block text-sm">บน–ล่าง<input className="w-full" type="range" min="-100" max="100" value={y} onChange={e=>setY(Number(e.target.value))}/></label></> : null}
    </Modal>
  </div>;
}
