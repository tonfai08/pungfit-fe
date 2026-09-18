'use client';

import { useEffect, useState } from 'react';

type PublicEvent = {
  id: string; slug: string; name: string; short_description: string;
  starts_at: string; timezone: string; venue_name: string;
  price_satang: number; payment_required: boolean;
  availability: 'open' | 'waitlist' | 'upcoming' | 'closed' | 'sold_out';
  available: number; cover_url: string | null;
};

const actionLabel: Record<PublicEvent['availability'], string> = {
  open: 'จองเลย', waitlist: 'ลงรายชื่อสำรอง', upcoming: 'ยังไม่เปิดจอง',
  closed: 'ปิดรับจองแล้ว', sold_out: 'ที่นั่งเต็ม',
};

function formatDate(value: string, timezone: string) {
  return new Intl.DateTimeFormat('th-TH', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: timezone,
  }).format(new Date(value));
}

function formatPrice(event: PublicEvent) {
  if (!event.payment_required || event.price_satang === 0) return 'เข้าร่วมฟรี';
  return `เริ่มต้น ${(event.price_satang / 100).toLocaleString('th-TH')} บาท`;
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase();
}

export default function EventPortal() {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetch('/bk-api/public/events', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('โหลดรายการงานไม่สำเร็จ');
        return response.json() as Promise<PublicEvent[]>;
      })
      .then(setEvents)
      .catch((cause) => { if (cause.name !== 'AbortError') setError(cause.message); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  return <div className="event-portal">
    <header className="event-portal__header">
      <span className="event-portal__brand">pung<span>Fit.</span></span>
      <span className="event-portal__header-note">Community events · Bangkok</span>
    </header>
    <main className="event-portal__main">
      <aside className="event-portal__poster" aria-label="โปสเตอร์ Sunday Running Club">
        <div>
          <div className="event-portal__poster-copy">
            <small>ESTD. 2026 · BANGKOK</small>
            <strong>Sunday<br />Running<br />Club</strong>
            <em>Move together, feel better.</em>
          </div>
          <div className="event-portal__runner" aria-hidden="true" />
        </div>
      </aside>
      <section className="event-portal__content" aria-labelledby="events-title">
        <p className="event-portal__eyebrow">Upcoming gatherings</p>
        <h1 id="events-title">เลือกงานที่อยากไป</h1>
        <p className="event-portal__intro">กิจกรรม วิ่ง และงานพบปะจากชุมชนของเรา เลือกงานเพื่อดูสถานะการจองและรายละเอียดเบื้องต้น</p>
        <div className="event-list" aria-live="polite">
          {loading && <><div className="event-skeleton" /><div className="event-skeleton" /></>}
          {!loading && error && <div className="event-state event-state--error"><strong>โหลดรายการไม่ได้</strong>{error}</div>}
          {!loading && !error && events.length === 0 && <div className="event-state"><strong>ยังไม่มีงานที่เปิดเผยแพร่</strong>งานใหม่จะปรากฏที่นี่เมื่อพร้อมให้จอง</div>}
          {events.map((event) => <article className="event-card" key={event.id} id={`event-${event.slug}`}>
            <div className="event-card__image" role="img" aria-label={event.cover_url ? `ภาพปก ${event.name}` : `ตัวย่อ ${event.name}`}
              style={event.cover_url ? { backgroundImage: `url(${event.cover_url})` } : undefined}>{!event.cover_url && initials(event.name)}</div>
            <div className="event-card__body">
              <h2>{event.name}</h2>
              <div className="event-card__meta">
                <span>◷ {formatDate(event.starts_at, event.timezone)}</span>
                <span>• {formatPrice(event)}</span>
                {event.venue_name && <span>• {event.venue_name}</span>}
              </div>
              {event.short_description && <p className="event-card__description">{event.short_description}</p>}
              <span className={`event-card__action ${event.availability}`}>{actionLabel[event.availability]}</span>
            </div>
          </article>)}
        </div>
      </section>
    </main>
  </div>;
}
