'use client';
/* Payment evidence must be requested with the browser's cookie, not the public image optimizer. */
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useState } from 'react';
import {
  bkApi,
  bkUpload,
  Booking,
  BookingDetail,
  Inventory,
  Waitlist,
  errorMessage,
  money,
  dateLabel,
  statuses,
} from '@/lib/bk-api';

export default function Operations({
  eventId,
  mode,
}: {
  eventId: string;
  mode: string;
}) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [inventory, setInventory] = useState<Inventory>({
    types: [],
    tables: [],
    assignments: [],
  });
  const [waitlist, setWaitlist] = useState<Waitlist[]>([]);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const [rows, stock, waiting] = await Promise.all([
      bkApi<Booking[]>(`/events/${eventId}/bookings`),
      bkApi<Inventory>(`/events/${eventId}/inventory`),
      bkApi<Waitlist[]>(`/events/${eventId}/waitlist`),
    ]);
    setBookings(rows);
    setInventory(stock);
    setWaitlist(waiting);
  }, [eventId]);
  useEffect(() => {
    load().catch((e) => setError(errorMessage(e)));
  }, [load]);
  useEffect(() => {
    setSelected('');
    setShowForm(false);
  }, [mode]);
  const rows = bookings.filter(
    (booking) =>
      (mode !== 'payments' || booking.status === 'payment_review') &&
      (mode !== 'checkin' || booking.status === 'confirmed') &&
      `${booking.contact_name} ${booking.contact_phone} ${booking.booking_no}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  if (selected)
    return (
      <BookingView
        eventId={eventId}
        bookingId={selected}
        inventory={inventory}
        onBack={() => {
          setSelected('');
          load().catch((e) => setError(errorMessage(e)));
        }}
        onChange={load}
      />
    );
  async function waitAction(entry: Waitlist, action: string) {
    if (
      action === 'offer' &&
      !window.confirm('เสนอสิทธิ์และกันโต๊ะให้รายชื่อนี้ตามเวลาชำระเงินของงาน?')
    )
      return;
    setBusy(true);
    setError('');
    try {
      if (action === 'offer') {
        const booking = await bkApi<Booking>(
          `/events/${eventId}/waitlist/${entry._id}/offer`,
          { method: 'POST', body: { request_key: crypto.randomUUID() } },
        );
        setSelected(booking._id);
      } else
        await bkApi(`/events/${eventId}/waitlist/${entry._id}`, {
          method: 'PATCH',
          body: { status: action },
        });
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="bk-stats">
        {inventory.types.map((type) => (
          <div key={type._id}>
            <span>
              {type.name} · {type.capacity} คน
            </span>
            <strong>
              {type.available} <small>/ {type.total} โต๊ะว่าง</small>
            </strong>
            <span>{money(type.price_satang)} ต่อโต๊ะ</span>
          </div>
        ))}
      </div>
      <div className="bk-list-toolbar">
        <h2>
          {
            {
              bookings: 'รายการจอง',
              payments: 'คิวตรวจสอบการชำระเงิน',
              checkin: 'รายชื่อพร้อมเช็กอิน',
              waitlist: 'รายชื่อสำรอง',
            }[mode]
          }
        </h2>
        <div className="bk-inline">
          <button
            onClick={() => load().catch((e) => setError(errorMessage(e)))}
          >
            รีเฟรช
          </button>
          {['bookings', 'waitlist'].includes(mode) && (
            <button
              className="bk-primary"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm
                ? 'ปิดแบบฟอร์ม'
                : mode === 'waitlist'
                  ? '+ เพิ่มรายชื่อสำรอง'
                  : '+ สร้างการจอง'}
            </button>
          )}
        </div>
      </div>
      {error && (
        <p role="alert" className="bk-error">
          {error}
        </p>
      )}
      {showForm && (
        <ReservationForm
          eventId={eventId}
          inventory={inventory}
          waitlist={mode === 'waitlist'}
          onSaved={async () => {
            setShowForm(false);
            await load();
          }}
        />
      )}
      {mode === 'waitlist' ? (
        <div className="bk-table-wrap">
          <table>
            <thead>
              <tr>
                <th>ผู้ติดต่อ</th>
                <th>ประเภทโต๊ะ</th>
                <th>จำนวน</th>
                <th>สถานะ</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {waitlist.map((entry) => (
                <tr key={entry._id}>
                  <td>
                    <b>{entry.contact_name}</b>
                    <small>{entry.contact_phone}</small>
                  </td>
                  <td>
                    {
                      inventory.types.find(
                        (type) => type._id === entry.table_type_id,
                      )?.name
                    }
                  </td>
                  <td>
                    {entry.quantity} โต๊ะ / {entry.attendee_count} คน
                  </td>
                  <td>
                    <span className={`bk-badge ${entry.status}`}>
                      {statuses[entry.status]}
                    </span>
                  </td>
                  <td>
                    <div className="bk-inline">
                      {['waiting', 'contacted'].includes(entry.status) && (
                        <>
                          {entry.status === 'waiting' && (
                            <button
                              disabled={busy}
                              onClick={() => waitAction(entry, 'contacted')}
                            >
                              ติดต่อแล้ว
                            </button>
                          )}
                          <button
                            disabled={busy}
                            onClick={() => waitAction(entry, 'offer')}
                          >
                            เสนอสิทธิ์
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => waitAction(entry, 'declined')}
                          >
                            ปฏิเสธสิทธิ์
                          </button>
                        </>
                      )}
                      {entry.offered_booking_id && (
                        <button
                          onClick={() => setSelected(entry.offered_booking_id!)}
                        >
                          ดูการจอง
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!waitlist.length && <p className="bk-empty">ยังไม่มีรายชื่อสำรอง</p>}
        </div>
      ) : (
        <>
          <input
            className="bk-search"
            aria-label="ค้นหาการจอง"
            placeholder="ค้นหาเลขจอง ชื่อ หรือเบอร์โทร…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="bk-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ผู้จอง / เลขอ้างอิง</th>
                  <th>ผู้ร่วมงาน</th>
                  <th>ยอดเงิน</th>
                  <th>สถานะ</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((booking) => (
                  <tr key={booking._id}>
                    <td>
                      <strong>{booking.contact_name}</strong>
                      <small>{booking.contact_phone}</small>
                      <small className="bk-mono">{booking.booking_no}</small>
                    </td>
                    <td>{booking.attendee_count} คน</td>
                    <td>{money(booking.total_amount_satang)}</td>
                    <td>
                      <span className={`bk-badge ${booking.status}`}>
                        {statuses[booking.status]}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => setSelected(booking._id)}>
                        {mode === 'payments'
                          ? 'ตรวจสลิป →'
                          : mode === 'checkin'
                            ? 'เช็กอิน →'
                            : 'จัดการ →'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && <p className="bk-empty">ไม่มีรายการในขณะนี้</p>}
          </div>
        </>
      )}
    </>
  );
}

function ReservationForm({
  eventId,
  inventory,
  waitlist,
  onSaved,
}: {
  eventId: string;
  inventory: Inventory;
  waitlist: boolean;
  onSaved: () => Promise<void>;
}) {
  const [items, setItems] = useState([{ table_type_id: '', quantity: 1 }]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [requestKey] = useState(() => crypto.randomUUID());
  async function save(form: FormData) {
    setBusy(true);
    setError('');
    const contact = {
      contact_name: form.get('name'),
      contact_phone: form.get('phone'),
      contact_x_account: form.get('x') || '',
      attendee_count: Number(form.get('attendees')),
    };
    try {
      await bkApi(`/events/${eventId}/${waitlist ? 'waitlist' : 'bookings'}`, {
        method: 'POST',
        body: waitlist
          ? { ...contact, ...items[0], note: form.get('note') || '' }
          : {
              ...contact,
              items,
              request_key: requestKey,
              internal_note: form.get('note') || '',
            },
      });
      await onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form action={save} className="bk-panel">
      <h3>{waitlist ? 'เพิ่มผู้ติดต่อสำรอง' : 'สร้างการจองโดยแอดมิน'}</h3>
      <div className="bk-form-grid">
        <label>
          ชื่อผู้ติดต่อ
          <input required name="name" />
        </label>
        <label>
          เบอร์โทร
          <input required name="phone" type="tel" minLength={5} />
        </label>
        <label>
          X account
          <input name="x" placeholder="@username" />
        </label>
        <label>
          จำนวนผู้ร่วมงานจริง
          <input
            required
            name="attendees"
            type="number"
            min={1}
            defaultValue={1}
          />
        </label>
      </div>
      {items.map((item, index) => (
        <div className="bk-inline" key={index}>
          <label>
            ประเภทโต๊ะ
            <select
              required
              value={item.table_type_id}
              onChange={(e) =>
                setItems((previous) =>
                  previous.map((row, i) =>
                    i === index
                      ? { ...row, table_type_id: e.target.value }
                      : row,
                  ),
                )
              }
            >
              <option value="">เลือกประเภท…</option>
              {inventory.types.map((type) => (
                <option
                  key={type._id}
                  value={type._id}
                  disabled={!waitlist && (!type.is_active || !type.available)}
                >
                  {type.name} · {type.capacity} คน · {money(type.price_satang)}{' '}
                  {!waitlist &&
                    (type.available
                      ? `(เหลือ ${type.available})`
                      : '(เต็ม / ปิดขาย)')}
                </option>
              ))}
            </select>
          </label>
          <label>
            จำนวนโต๊ะ
            <input
              type="number"
              min={1}
              required
              value={item.quantity}
              onChange={(e) =>
                setItems((previous) =>
                  previous.map((row, i) =>
                    i === index
                      ? { ...row, quantity: Number(e.target.value) }
                      : row,
                  ),
                )
              }
            />
          </label>
          {items.length > 1 && (
            <button
              type="button"
              onClick={() =>
                setItems((previous) => previous.filter((_, i) => i !== index))
              }
            >
              เอาออก
            </button>
          )}
        </div>
      ))}
      {!waitlist && (
        <button
          type="button"
          onClick={() =>
            setItems((previous) => [
              ...previous,
              { table_type_id: '', quantity: 1 },
            ])
          }
        >
          + เพิ่มประเภทโต๊ะ
        </button>
      )}
      <label>
        หมายเหตุภายใน
        <textarea name="note" />
      </label>
      {!waitlist && (
        <p>
          ยอดรวม{' '}
          <strong>
            {money(
              items.reduce(
                (sum, item) =>
                  sum +
                  (inventory.types.find(
                    (type) => type._id === item.table_type_id,
                  )?.price_satang || 0) *
                    item.quantity,
                0,
              ),
            )}
          </strong>{' '}
          · สามารถจัดหมายเลขโต๊ะภายหลังได้
        </p>
      )}
      {error && (
        <p className="bk-error" role="alert">
          {error}
        </p>
      )}
      <button className="bk-primary" disabled={busy}>
        {busy
          ? 'กำลังบันทึก…'
          : waitlist
            ? 'บันทึกรายชื่อสำรอง'
            : 'สร้างการจองและกันโต๊ะ'}
      </button>
    </form>
  );
}

function BookingView({
  eventId,
  bookingId,
  inventory,
  onBack,
  onChange,
}: {
  eventId: string;
  bookingId: string;
  inventory: Inventory;
  onBack: () => void;
  onChange: () => Promise<void>;
}) {
  const [detail, setDetail] = useState<BookingDetail | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [slip, setSlip] = useState('');
  const root = `/events/${eventId}/bookings/${bookingId}`;
  const load = useCallback(async () => {
    const data = await bkApi<BookingDetail>(root);
    setDetail(data);
    setSelected(
      Object.fromEntries(
        data.items.map((item) => [
          item._id,
          data.assignments
            .filter((assignment) => assignment.booking_item_id === item._id)
            .map((assignment) => assignment.event_table_id._id),
        ]),
      ),
    );
  }, [root]);
  useEffect(() => {
    load().catch((e) => setError(errorMessage(e)));
  }, [load]);
  async function mutate(path: string, body: unknown, method = 'POST') {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await bkApi(root + path, { method, body });
      await load();
      await onChange();
      setMessage('บันทึกแล้ว');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  if (!detail)
    return (
      <>
        <button onClick={onBack}>← กลับ</button>
        <p>{error || 'กำลังโหลด…'}</p>
      </>
    );
  const { booking, items, payments, check_ins } = detail;
  const active = ['pending_payment', 'payment_review', 'confirmed'].includes(
    booking.status,
  );
  const checkedIn = check_ins.reduce(
    (sum, record) => sum + record.guest_count,
    0,
  );
  return (
    <>
      <button className="bk-back" onClick={onBack}>
        ← กลับรายการ
      </button>
      <div className="bk-heading">
        <div>
          <h2>{booking.contact_name}</h2>
          <p>
            {booking.contact_phone}{' '}
            {booking.contact_x_account && `· ${booking.contact_x_account}`}
          </p>
          <small className="bk-mono">{booking.booking_no}</small>
        </div>
        <span className={`bk-badge ${booking.status}`}>
          {statuses[booking.status]}
        </span>
      </div>
      {error && (
        <p className="bk-error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="bk-success" role="status">
          {message}
        </p>
      )}
      <div className="bk-stats">
        <div>
          <span>ยอดชำระ</span>
          <strong>{money(booking.total_amount_satang)}</strong>
        </div>
        <div>
          <span>ผู้ร่วมงาน</span>
          <strong>{booking.attendee_count} คน</strong>
        </div>
        <div>
          <span>เช็กอินแล้ว</span>
          <strong>{checkedIn} คน</strong>
        </div>
      </div>
      <div className="bk-panel">
        <h3>จัดโต๊ะ</h3>
        {items.map((item) => (
          <div key={item._id} className="bk-assignment">
            <h4>
              {item.table_type_id.name} · จอง {item.quantity} โต๊ะ ·{' '}
              {money(item.line_total_satang)}
            </h4>
            <div className="bk-seat-picker">
              {inventory.tables
                .filter(
                  (table) => table.table_type_id === item.table_type_id._id,
                )
                .map((table) => {
                  const assigned = inventory.assignments.find(
                    (assignment) => assignment.event_table_id === table._id,
                  );
                  const unavailable =
                    !table.is_bookable ||
                    !!(assigned && assigned.booking_item_id !== item._id);
                  const checked = (selected[item._id] || []).includes(
                    table._id,
                  );
                  return (
                    <label
                      key={table._id}
                      className={`${checked ? 'selected' : ''} ${unavailable ? 'unavailable' : ''}`}
                    >
                      <input
                        type="checkbox"
                        disabled={busy || !active || unavailable}
                        checked={checked}
                        onChange={(e) =>
                          setSelected((previous) => ({
                            ...previous,
                            [item._id]: e.target.checked
                              ? [...(previous[item._id] || []), table._id]
                              : previous[item._id].filter(
                                  (id) => id !== table._id,
                                ),
                          }))
                        }
                      />
                      <strong>{table.code}</strong>
                      <small>
                        {unavailable ? 'ไม่ว่าง' : table.zone || 'ว่าง'}
                      </small>
                    </label>
                  );
                })}
            </div>
            <p>
              เลือกแล้ว {(selected[item._id] || []).length} / {item.quantity}{' '}
              โต๊ะ
            </p>
            <button
              disabled={
                busy ||
                !active ||
                (selected[item._id] || []).length > item.quantity
              }
              onClick={() =>
                mutate(
                  `/assignments/${item._id}`,
                  { table_ids: selected[item._id] || [] },
                  'PUT',
                )
              }
            >
              บันทึกการจัดโต๊ะ
            </button>
          </div>
        ))}
      </div>
      <div className="bk-panel">
        <h3>การชำระเงิน</h3>
        <p>กำหนดชำระ: {dateLabel(booking.payment_due_at)}</p>
        {payments.map((payment) => (
          <div className="bk-payment" key={payment._id}>
            <a
              href={`/bk-api/files/${payment.slip_file_id}`}
              target="_blank"
              rel="noreferrer"
            >
              <img
                src={`/bk-api/files/${payment.slip_file_id}`}
                alt="หลักฐานการชำระเงิน"
              />
            </a>
            <div>
              <span className={`bk-badge ${payment.status}`}>
                {statuses[payment.status]}
              </span>
              <h3>{money(payment.submitted_amount_satang)}</h3>
              <p>โอนเมื่อ {dateLabel(payment.transferred_at)}</p>
              <p>{payment.review_note}</p>
              {payment.status === 'pending' &&
                booking.status === 'payment_review' && (
                  <div className="bk-inline">
                    <button
                      className="bk-primary"
                      disabled={busy}
                      onClick={() => {
                        if (
                          window.confirm(
                            'ตรวจสอบยอดและบัญชีรับเงินแล้ว ยืนยันอนุมัติการชำระเงิน?',
                          )
                        )
                          void mutate(`/payments/${payment._id}/review`, {
                            decision: 'approved',
                            note: '',
                          });
                      }}
                    >
                      อนุมัติการชำระเงิน
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => {
                        const note = window.prompt(
                          'เหตุผลที่ไม่ผ่าน / ข้อมูลที่ต้องแก้ไข',
                        );
                        if (note?.trim())
                          void mutate(`/payments/${payment._id}/review`, {
                            decision: 'rejected',
                            note,
                          });
                      }}
                    >
                      ขอหลักฐานใหม่
                    </button>
                  </div>
                )}
            </div>
          </div>
        ))}
        {booking.status === 'pending_payment' && (
          <form
            action={async (form) => {
              await mutate('/payments', {
                slip_file_id: slip,
                submitted_amount_satang: Math.round(
                  Number(form.get('amount')) * 100,
                ),
                transferred_at: new Date(
                  `${form.get('transferred')}:00+07:00`,
                ).toISOString(),
                transaction_reference: form.get('reference') || '',
              });
            }}
          >
            <h4>เพิ่มหลักฐานการชำระเงิน</h4>
            <div className="bk-form-grid">
              <label>
                รูปสลิป
                <input
                  type="file"
                  accept="image/*"
                  disabled={busy}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setBusy(true);
                    setError('');
                    try {
                      const uploaded = await bkUpload(file);
                      setSlip(uploaded._id);
                    } catch (err) {
                      setError(errorMessage(err));
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
                {slip && (
                  <img
                    className="bk-image-preview"
                    src={`/bk-api/files/${slip}`}
                    alt="สลิปที่อัปโหลด"
                  />
                )}
              </label>
              <label>
                ยอดโอน (บาท)
                <input
                  name="amount"
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  defaultValue={booking.total_amount_satang / 100}
                />
              </label>
              <label>
                เวลาโอน (เวลาไทย)
                <input name="transferred" type="datetime-local" required />
              </label>
              <label>
                เลขอ้างอิงธนาคาร
                <input name="reference" />
              </label>
            </div>
            <button disabled={busy || !slip}>ส่งหลักฐานเข้าคิวตรวจ</button>
          </form>
        )}
        {!payments.length && booking.status !== 'pending_payment' && (
          <p>ไม่มีหลักฐานการชำระเงิน</p>
        )}
      </div>
      {booking.status === 'confirmed' && (
        <div className="bk-panel">
          <h3>เช็กอินผู้ร่วมงาน</h3>
          <form
            className="bk-inline"
            action={async (form) => {
              await mutate('/check-ins', {
                guest_count: Number(form.get('count')),
              });
            }}
          >
            <label>
              จำนวนคนที่มาครั้งนี้
              <input
                name="count"
                type="number"
                required
                min={1}
                max={booking.attendee_count - checkedIn}
                defaultValue={1}
              />
            </label>
            <button
              className="bk-primary"
              disabled={busy || checkedIn >= booking.attendee_count}
            >
              เช็กอิน
            </button>
          </form>
          {check_ins.map((record) => (
            <p key={record._id}>
              {dateLabel(record.checked_in_at)} · {record.guest_count} คน
            </p>
          ))}
        </div>
      )}
      <div className="bk-panel">
        <h3>หมายเหตุและการยกเลิก</h3>
        <p>
          {booking.internal_note || booking.customer_note || 'ไม่มีหมายเหตุ'}
        </p>
        {booking.cancellation_reason && (
          <p>เหตุผลที่ยกเลิก: {booking.cancellation_reason}</p>
        )}
        {active && (
          <>
            <p>การยกเลิกจะคืนโต๊ะให้ว่าง ระบบไม่คืนเงินให้อัตโนมัติ</p>
            <button
              className="bk-danger"
              disabled={busy || checkedIn > 0}
              onClick={() => {
                const reason = window.prompt(
                  'ระบุเหตุผลการยกเลิก (หากชำระแล้ว ให้ระบุวิธีจัดการคืนเงิน)',
                );
                if (reason?.trim()) void mutate('/cancel', { reason });
              }}
            >
              ยกเลิกการจอง
            </button>
          </>
        )}
      </div>
    </>
  );
}
