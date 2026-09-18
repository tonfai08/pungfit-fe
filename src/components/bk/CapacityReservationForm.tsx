'use client';
import { useEffect, useState } from 'react';
import { Alert, Button, Input, InputNumber, Select } from 'antd';
import { bkApi, BkUser, Inventory, errorMessage, money } from '@/lib/bk-api';

export default function CapacityReservationForm({ eventId, capacity, waitlist, onSaved }: {
  eventId: string; capacity: NonNullable<Inventory['capacity']>; waitlist: boolean; onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [x, setX] = useState('');
  const [count, setCount] = useState(1);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [requestKey] = useState(() => crypto.randomUUID());
  const [users, setUsers] = useState<BkUser[]>([]);
  const [userId, setUserId] = useState<string>();
  useEffect(() => { bkApi<BkUser[]>('/customers').then(setUsers).catch((e) => setError(errorMessage(e))); }, []);
  const max = waitlist ? capacity.max_attendees_per_booking : Math.min(capacity.available, capacity.max_attendees_per_booking);
  async function save() {
    setBusy(true); setError('');
    try {
      const contact = { contact_name: name, contact_phone: phone, contact_x_account: x, attendee_count: count };
      await bkApi(`/events/${eventId}/${waitlist ? 'waitlist' : 'bookings'}`, { method: 'POST', body: waitlist
        ? { ...contact, note } : { ...contact, user_id: userId, request_key: requestKey, internal_note: note } });
      await onSaved();
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  return <form className="bk-panel" onSubmit={(e) => { e.preventDefault(); void save(); }}>
    <h3>{waitlist ? 'เพิ่มผู้ติดต่อสำรอง' : 'ลงทะเบียนผู้ร่วมงาน'}</h3>
    {!waitlist && <div style={{ marginBottom: 16 }}>
      <p>เลือกผู้ติดต่อเดิม หรือกรอกข้อมูลใหม่ด้านล่าง</p>
      <Select aria-label="เลือกผู้ติดต่อเดิม" allowClear showSearch optionFilterProp="label" style={{ width: '100%' }}
        value={userId} options={users.filter((u) => u.is_active).map((u) => ({ value: u._id, label: `${u.display_name} · ${u.phone || ''} · ${u._id}` }))}
        onChange={(id) => { setUserId(id); const user = users.find((u) => u._id === id);
          setName(user?.display_name || ''); setPhone(user?.phone || ''); setX(user?.x_account || ''); }} />
    </div>}
    <div className="bk-form-grid">
      <label>ชื่อผู้ติดต่อ<Input required disabled={!!userId} value={name} onChange={(e) => setName(e.target.value)} /></label>
      <label>เบอร์โทร<Input required disabled={!!userId} minLength={5} value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
      <label>X account<Input disabled={!!userId} value={x} onChange={(e) => setX(e.target.value)} /></label>
      <label>จำนวนที่นั่ง<InputNumber aria-label="จำนวนที่นั่ง" min={1} max={Math.max(1, max)} precision={0} value={count}
        onChange={(value) => setCount(value || 1)} style={{ width: '100%' }} /></label>
    </div>
    <label>หมายเหตุภายใน<Input.TextArea value={note} onChange={(e) => setNote(e.target.value)} /></label>
    <p>ได้สูงสุด {capacity.max_attendees_per_booking} ที่นั่งต่อการจอง · เหลือ {capacity.available} / {capacity.total} ที่นั่ง</p>
    {!waitlist && <p>ยอดรวม <strong>{money(count * capacity.price_per_attendee_satang)}</strong></p>}
    {error && <Alert type="error" title={error} />}
    <Button htmlType="submit" type="primary" loading={busy} disabled={max < 1 || count > max || !name || phone.length < 5}>
      {waitlist ? 'บันทึกรายชื่อสำรอง' : 'ลงทะเบียนและกันที่นั่ง'}
    </Button>
  </form>;
}
