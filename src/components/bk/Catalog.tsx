'use client';
/* Private images need the browser's session cookie; the Next image optimizer does not forward it. */
/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  bkApi,
  bkUpload,
  BkEvent,
  BkTemplate,
  dateLabel,
  errorMessage,
  statuses,
} from '@/lib/bk-api';
import RichEditor from './RichEditor';
import LayoutEditor from './LayoutEditor';
import Operations from './Operations';

export function EventList() {
  const [events, setEvents] = useState<BkEvent[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  useEffect(() => {
    bkApi<BkEvent[]>('/events')
      .then(setEvents)
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);
  return (
    <>
      <div className="bk-heading">
        <div>
          <span className="bk-eyebrow">EVENT MANAGEMENT</span>
          <h1>งานอีเวนต์</h1>
          <p>สร้างงาน วางผัง และดูแลการจองของคุณ</p>
        </div>
        <Link className="bk-button bk-primary" href="/booking-admin/events/new">
          + สร้าง Event
        </Link>
      </div>
      <div className="bk-stats">
        <div>
          <span>งานทั้งหมด</span>
          <strong>{events.length}</strong>
        </div>
        <div>
          <span>พร้อมเผยแพร่</span>
          <strong>
            {events.filter((e) => e.status === 'scheduled').length}
          </strong>
        </div>
        <div>
          <span>ฉบับร่าง</span>
          <strong>{events.filter((e) => e.status === 'draft').length}</strong>
        </div>
      </div>
      <div className="bk-list-toolbar">
        <h2>รายการงาน</h2>
        <input
          aria-label="ค้นหางาน"
          placeholder="ค้นหาชื่องาน…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {error && (
        <p role="alert" className="bk-error">
          {error}
        </p>
      )}
      {loading ? (
        <p>กำลังโหลด…</p>
      ) : (
        <div className="bk-event-grid">
          {events
            .filter((event) =>
              event.name.toLowerCase().includes(search.toLowerCase()),
            )
            .map((event) => (
              <Link
                className="bk-event-card"
                key={event._id}
                href={`/booking-admin/events/${event._id}`}
              >
                <div className="bk-event-cover">
                  {event.cover_file_id ? (
                    <img src={`/bk-api/files/${event.cover_file_id}`} alt="" />
                  ) : (
                    <span>bk. / EVENT</span>
                  )}
                  <span className={`bk-badge ${event.status}`}>
                    {statuses[event.status]}
                  </span>
                </div>
                <div className="bk-event-copy">
                  <h2>{event.name}</h2>
                  <p>{event.short_description || 'ยังไม่มีรายละเอียดย่อ'}</p>
                  <footer>
                    <span>{dateLabel(event.starts_at)}</span>
                    <b>จัดการ →</b>
                  </footer>
                </div>
              </Link>
            ))}
          {events.length === 0 && (
            <div className="bk-empty">
              <h2>เริ่มสร้างงานแรกของคุณ</h2>
              <p>ตั้งชื่อ กำหนดวัน และเลือกแม่แบบผังโต๊ะ</p>
              <Link href="/booking-admin/events/new" className="bk-button">
                สร้าง Event
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  );
}
export function TemplateList() {
  const [templates, setTemplates] = useState<BkTemplate[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    bkApi<BkTemplate[]>('/templates')
      .then(setTemplates)
      .catch((e) => setError(errorMessage(e)));
  }, []);
  return (
    <>
      <div className="bk-heading">
        <div>
          <span className="bk-eyebrow">SEATING DESIGN</span>
          <h1>แม่แบบผังโต๊ะ</h1>
          <p>ออกแบบครั้งเดียว นำไปใช้กับหลายงานได้</p>
        </div>
        <Link
          href="/booking-admin/templates/new"
          className="bk-button bk-primary"
        >
          + สร้างแม่แบบ
        </Link>
      </div>
      {error && <p className="bk-error">{error}</p>}
      <div className="bk-event-grid">
        {templates.map((item) => (
          <Link
            href={`/booking-admin/templates/${item._id}`}
            className="bk-panel"
            key={item._id}
          >
            <div className="bk-template-art" aria-hidden="true">
              ○　○　○
              <br />
              ○　○　○
            </div>
            <h2>{item.name}</h2>
            <p>
              พื้นที่ {item.canvas_width} × {item.canvas_height}
            </p>
            <span>แก้ไขผัง →</span>
          </Link>
        ))}
        {!templates.length && (
          <p className="bk-empty">
            ยังไม่มีแม่แบบ เริ่มเพิ่มโต๊ะ เก้าอี้ และเวทีได้เลย
          </p>
        )}
      </div>
    </>
  );
}
type EventDraft = Omit<Partial<BkEvent>, 'status'> & {
  status: BkEvent['status'];
  content_html: string;
};
const dateFields = [
  ['starts_at', 'เริ่มงาน'],
  ['ends_at', 'จบงาน'],
  ['publish_at', 'เผยแพร่'],
  ['booking_opens_at', 'เปิดจอง'],
  ['booking_closes_at', 'ปิดจอง'],
  ['hide_at', 'เลิกแสดง'],
] as const;
function localDate(value?: string) {
  return value
    ? new Date(new Date(value).getTime() + 7 * 3600000)
        .toISOString()
        .slice(0, 16)
    : '';
}
export function EventEditor({ id }: { id: string }) {
  const router = useRouter();
  const [tab, setTab] = useState('info');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(id !== 'new');
  const [draft, setDraft] = useState<EventDraft>({
    name: '',
    slug: '',
    status: 'draft',
    content_html: '',
    timezone: 'Asia/Bangkok',
    table_selection_mode: 'admin_assign',
    waitlist_enabled: false,
    payment_due_minutes: 30,
  });
  useEffect(() => {
    if (id === 'new') return;
    bkApi<BkEvent>(`/events/${id}`)
      .then((event) => {
        const { _id, content_json, ...fields } = event;
        void _id;
        setDraft({ ...fields, content_html: content_json?.html || '' });
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [id]);
  const set = (key: string, value: unknown) =>
    setDraft((previous) => ({ ...previous, [key]: value }));
  async function save() {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const allowed = [
        'name',
        'slug',
        'status',
        'short_description',
        'content_html',
        'cover_file_id',
        'poster_file_id',
        'venue_name',
        'venue_address',
        'map_url',
        'timezone',
        'table_selection_mode',
        'waitlist_enabled',
        'payment_due_minutes',
        'payment_instructions',
        'booking_terms',
        ...dateFields.map(([key]) => key),
      ];
      const body = Object.fromEntries(
        Object.entries(draft).filter(([key]) => allowed.includes(key)),
      );
      const saved = await bkApi<BkEvent>(
        id === 'new' ? '/events' : `/events/${id}`,
        { method: id === 'new' ? 'POST' : 'PATCH', body },
      );
      if (id === 'new') router.replace(`/booking-admin/events/${saved._id}`);
      else setMessage('บันทึกข้อมูลแล้ว');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <p>กำลังโหลดงาน…</p>;
  return (
    <>
      <Link className="bk-back" href="/booking-admin/events">
        ← งานอีเวนต์ทั้งหมด
      </Link>
      <div className="bk-heading">
        <div>
          <span className="bk-eyebrow">EVENT WORKSPACE</span>
          <h1>{id === 'new' ? 'สร้าง Event' : draft.name}</h1>
          <p>ข้อมูล ผังโต๊ะ และผู้ร่วมงานในพื้นที่เดียวกัน</p>
        </div>
        <span className={`bk-badge ${draft.status}`}>
          {statuses[draft.status]}
        </span>
      </div>
      <div className="bk-tabs" role="tablist">
        {[
          ['info', 'ข้อมูลและเนื้อหา'],
          ['layout', 'ผังโต๊ะและราคา'],
          ['bookings', 'การจอง / จัดโต๊ะ'],
          ['payments', 'ตรวจชำระเงิน'],
          ['waitlist', 'รายชื่อสำรอง'],
          ['checkin', 'เช็กอิน'],
        ].map(([key, label]) => (
          <button
            role="tab"
            aria-selected={tab === key}
            className={tab === key ? 'active' : ''}
            key={key}
            disabled={id === 'new' && key !== 'info'}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
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
      {tab === 'info' && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <div className="bk-panel">
            <h2>รายละเอียดงาน</h2>
            <div className="bk-form-grid">
              <label>
                ชื่องาน
                <input
                  required
                  value={draft.name || ''}
                  onChange={(e) => set('name', e.target.value)}
                />
              </label>
              <label>
                URL ของงาน (ตัวอักษรอังกฤษ ตัวเลข และ -)
                <input
                  required
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  value={draft.slug || ''}
                  onChange={(e) => set('slug', e.target.value)}
                />
              </label>
              <label className="bk-wide">
                รายละเอียดย่อ
                <textarea
                  maxLength={1000}
                  value={draft.short_description || ''}
                  onChange={(e) => set('short_description', e.target.value)}
                />
              </label>
              {(['cover_file_id', 'poster_file_id'] as const).map(
                (key, index) => (
                  <label key={key}>
                    {index === 0 ? 'ภาพปกแนวนอน' : 'ภาพโปสเตอร์แนวตั้ง'}
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
                          set(key, uploaded._id);
                        } catch (err) {
                          setError(errorMessage(err));
                        } finally {
                          setBusy(false);
                          e.target.value = '';
                        }
                      }}
                    />
                    {draft[key] && (
                      <>
                        <img
                          className="bk-image-preview"
                          src={`/bk-api/files/${draft[key]}`}
                          alt={index === 0 ? 'ภาพปก' : 'โปสเตอร์'}
                        />
                        <button type="button" onClick={() => set(key, null)}>
                          เอารูปออก
                        </button>
                      </>
                    )}
                  </label>
                ),
              )}
            </div>
            <label>เนื้อหาบทความ</label>
            <RichEditor
              value={draft.content_html}
              onChange={(html) => set('content_html', html)}
            />
          </div>
          <div className="bk-panel">
            <h2>สถานที่และกำหนดการ</h2>
            <p>วันเวลาทั้งหมดใช้เขตเวลาไทย (Asia/Bangkok)</p>
            <div className="bk-form-grid">
              <label>
                สถานที่
                <input
                  value={draft.venue_name || ''}
                  onChange={(e) => set('venue_name', e.target.value)}
                />
              </label>
              <label>
                ลิงก์แผนที่
                <input
                  type="url"
                  value={draft.map_url || ''}
                  onChange={(e) => set('map_url', e.target.value)}
                />
              </label>
              <label className="bk-wide">
                ที่อยู่
                <textarea
                  value={draft.venue_address || ''}
                  onChange={(e) => set('venue_address', e.target.value)}
                />
              </label>
              {dateFields.map(([key, label]) => (
                <label key={key}>
                  {label}
                  <input
                    type="datetime-local"
                    value={localDate(draft[key])}
                    onChange={(e) =>
                      set(
                        key,
                        e.target.value
                          ? new Date(`${e.target.value}:00+07:00`).toISOString()
                          : null,
                      )
                    }
                  />
                </label>
              ))}
            </div>
          </div>
          <div className="bk-panel">
            <h2>เงื่อนไขการจอง</h2>
            <div className="bk-form-grid">
              <label>
                สถานะงาน
                <select
                  value={draft.status}
                  onChange={(e) => set('status', e.target.value)}
                >
                  {['draft', 'scheduled', 'cancelled', 'archived'].map(
                    (status) => (
                      <option value={status} key={status}>
                        {statuses[status]}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <label>
                การเลือกโต๊ะ
                <select
                  value={draft.table_selection_mode}
                  onChange={(e) => set('table_selection_mode', e.target.value)}
                >
                  <option value="admin_assign">แอดมินจัดโต๊ะให้</option>
                  <option value="customer_select">ลูกค้าเลือกโต๊ะเอง</option>
                </select>
              </label>
              <label>
                เวลาชำระเงิน (นาที)
                <input
                  type="number"
                  min={1}
                  max={10080}
                  value={draft.payment_due_minutes}
                  onChange={(e) =>
                    set('payment_due_minutes', Number(e.target.value))
                  }
                />
              </label>
              <label className="bk-checkbox">
                <input
                  type="checkbox"
                  checked={draft.waitlist_enabled}
                  onChange={(e) => set('waitlist_enabled', e.target.checked)}
                />
                รับรายชื่อสำรอง
              </label>
              <label>
                วิธีชำระเงิน
                <textarea
                  value={draft.payment_instructions || ''}
                  onChange={(e) => set('payment_instructions', e.target.value)}
                />
              </label>
              <label>
                เงื่อนไขการจอง / ยกเลิก
                <textarea
                  value={draft.booking_terms || ''}
                  onChange={(e) => set('booking_terms', e.target.value)}
                />
              </label>
            </div>
          </div>
          <div className="bk-actions">
            <button className="bk-primary" disabled={busy}>
              {busy ? 'กำลังบันทึก…' : 'บันทึก Event'}
            </button>
          </div>
        </form>
      )}
      {tab === 'layout' && <LayoutEditor eventId={id} />}
      {['bookings', 'payments', 'waitlist', 'checkin'].includes(tab) && (
        <Operations eventId={id} mode={tab} />
      )}
    </>
  );
}
