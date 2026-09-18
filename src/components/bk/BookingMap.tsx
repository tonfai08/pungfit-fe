'use client';
import { useEffect, useState } from 'react';
import { Alert, Button, InputNumber, Modal, Radio, Select } from 'antd';
import { bkApi, BkLayout, BkTable, BkUser, Booking, BookingDetail, Inventory, errorMessage } from '@/lib/bk-api';
import SeatingCanvas, { OccupantInfo } from './SeatingCanvas';

export default function BookingMap({ eventId, inventory, bookings, onChange }: {
  eventId: string; inventory: Inventory; bookings: Booking[]; onChange: () => Promise<void>;
}) {
  const [layout, setLayout] = useState<BkLayout>();
  const [users, setUsers] = useState<BkUser[]>([]);
  const [table, setTable] = useState<BkTable>();
  const [kind, setKind] = useState('customer');
  const [target, setTarget] = useState<string>();
  const [count, setCount] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [requestKey, setRequestKey] = useState('');
  useEffect(() => {
    Promise.all([bkApi<BkLayout>(`/events/${eventId}/layout`), bkApi<BkUser[]>('/customers')])
      .then(([map, customers]) => { setLayout(map); setUsers(customers.filter((u) => u.is_active)); })
      .catch((e) => setError(errorMessage(e)));
  }, [eventId]);
  const assignment = inventory.assignments.find((a) => a.event_table_id === table?._id);
  const type = inventory.types.find((t) => t._id === table?.table_type_id);
  async function save() {
    if (!table || !target) return;
    setBusy(true); setError('');
    try {
      if (kind === 'customer') {
        const user = users.find((u) => u._id === target);
        if (!user?.phone) throw new Error('เพิ่มเบอร์โทรของผู้ติดต่อก่อนจอง');
        await bkApi(`/events/${eventId}/bookings`, { method: 'POST', body: {
          request_key: requestKey, user_id: user._id, contact_name: user.display_name,
          contact_phone: user.phone, contact_x_account: user.x_account || '', attendee_count: count,
          items: [{ table_type_id: table.table_type_id, quantity: 1, table_ids: [table._id] }],
        } });
      } else {
        const detail = await bkApi<BookingDetail>(`/events/${eventId}/bookings/${target}`);
        const item = detail.items.find((i) => i.table_type_id._id === table.table_type_id);
        if (!item) throw new Error('การจองนี้ไม่มีประเภทโต๊ะที่เลือก');
        const ids = detail.assignments.filter((a) => a.booking_item_id === item._id).map((a) => a.event_table_id._id);
        if (ids.length >= item.quantity) throw new Error('การจองนี้จัดโต๊ะครบแล้ว ไปหน้ารายละเอียดเพื่อย้ายโต๊ะ');
        await bkApi(`/events/${eventId}/bookings/${target}/assignments/${item._id}`, {
          method: 'PUT', body: { table_ids: [...ids, table._id] },
        });
      }
      setTable(undefined);
      await onChange();
    } catch (e) {
      setError(errorMessage(e));
      await onChange().catch(() => undefined);
    } finally { setBusy(false); }
  }
  return <div className="bk-panel">
    <h3>เลือกผู้จองบนผัง</h3>
    <p>คลิกโต๊ะหรือเก้าอี้เพื่อจองทั้งโต๊ะให้ผู้ลงทะเบียน หรือจัดให้รายการจองที่มีอยู่</p>
    {error && !table && <Alert type="error" title={error} />}
    {layout && <SeatingCanvas layout={layout} inventory={inventory} onTableClick={(next) => {
      setTable(next); setTarget(undefined); setCount(1); setError(''); setRequestKey(crypto.randomUUID());
    }} />}
    <Modal open={!!table} title={'โต๊ะ ' + (table?.code || '')} onCancel={() => !busy && setTable(undefined)}
      footer={assignment || !table?.is_bookable ? null : <Button type="primary" loading={busy}
        disabled={!target} onClick={save}>บันทึกผู้จอง</Button>}>
      {table && <OccupantInfo table={table} inventory={inventory} />}
      {error && <Alert style={{ marginTop: 12 }} type="error" title={error} />}
      {!assignment && table?.is_bookable && <div style={{ display: 'grid', gap: 16, marginTop: 20 }}>
        <Radio.Group value={kind} onChange={(e) => { setKind(e.target.value); setTarget(undefined); }}
          options={[{ value: 'customer', label: 'ผู้ลงทะเบียน' }, { value: 'booking', label: 'การจองที่มีอยู่' }]} />
        <Select aria-label="เลือกผู้จอง" showSearch optionFilterProp="label" value={target} onChange={setTarget}
          placeholder="ค้นหา UID ชื่อ X หรือเบอร์โทร" style={{ width: '100%' }}
          options={kind === 'customer' ? users.map((u) => ({ value: u._id,
            label: `${u.display_name} · ${u.x_account || '—'} · ${u.phone || 'ไม่มีเบอร์'} · ${u._id}` }))
            : bookings.filter((b) => ['confirmed', 'payment_review', 'pending_payment'].includes(b.status) &&
              (b.status !== 'pending_payment' || new Date(b.hold_expires_at || 0).getTime() > Date.now()))
              .map((b) => ({ value: b._id, label: `${b.contact_name} · ${b.booking_no} · ${b.contact_phone}` }))} />
        {kind === 'customer' && <label>จำนวนผู้ร่วมงาน (สูงสุด {type?.capacity || 1} คน)
          <InputNumber aria-label="จำนวนผู้ร่วมงาน" min={1} max={type?.capacity || 1} value={count}
            onChange={(value) => setCount(value || 1)} style={{ width: '100%' }} /></label>}
        {kind === 'customer' && !users.length && <Alert type="info" title="เพิ่มผู้ลงทะเบียนที่เมนูรายชื่อผู้ติดต่อก่อน" />}
      </div>}
    </Modal>
  </div>;
}
