'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { bkApi, BkUser, errorMessage } from '@/lib/bk-api';
import { EventList, EventEditor, TemplateList } from './Catalog';
import LayoutEditor from './LayoutEditor';
import People from './People';
import './booking-admin.css';

export default function BookingAdmin() {
  const pathname = usePathname();
  const router = useRouter();
  const parts = pathname
    .replace('/booking-admin', '')
    .split('/')
    .filter(Boolean);
  const page = parts[0] || 'events';
  const [user, setUser] = useState<BkUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    bkApi<{ user: BkUser }>('/auth/me')
      .then((data) => {
        if (!active) return;
        setUser(data.user);
        if (pathname.endsWith('/login'))
          router.replace('/booking-admin/events');
      })
      .catch(() => {
        if (active) {
          setUser(null);
          if (!pathname.endsWith('/login'))
            router.replace('/booking-admin/login');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [pathname, router]);
  async function login(form: FormData) {
    setBusy(true);
    setError('');
    try {
      const data = await bkApi<{ user: BkUser }>('/auth/login', {
        method: 'POST',
        body: { email: form.get('email'), password: form.get('password') },
      });
      setUser(data.user);
      router.replace('/booking-admin/events');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  if (loading)
    return <div className="bk-app bk-loading">กำลังตรวจสอบสิทธิ์…</div>;
  if (!user)
    return (
      <div className="bk-app bk-login">
        <div className="bk-login-story">
          <span className="bk-eyebrow">PUNGFIT / BOOKING</span>
          <h1>
            ทุกงานเริ่มต้น
            <br />
            จากการจัดการที่ดี
          </h1>
          <p>
            จัดผังโต๊ะ ดูแลผู้ร่วมงาน และติดตามการจอง
            <br />
            ทั้งหมดในที่เดียว
          </p>
          <div className="bk-decor" aria-hidden="true">
            <span>A01</span>
            <span>A02</span>
            <span>B01</span>
            <span>B02</span>
          </div>
        </div>
        <form className="bk-login-form" action={login}>
          <span className="bk-eyebrow">ADMIN WORKSPACE</span>
          <h2>เข้าสู่ระบบหลังบ้าน</h2>
          <p>สำหรับผู้ดูแลงานและ Super admin</p>
          <label>
            อีเมล
            <input name="email" type="email" autoComplete="username" required />
          </label>
          <label>
            รหัสผ่าน
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          {error && (
            <p className="bk-error" role="alert">
              {error}
            </p>
          )}
          <button className="bk-primary" disabled={busy}>
            {busy ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ →'}
          </button>
          <small>ยังไม่มีบัญชี? ติดต่อ Super admin ของคุณ</small>
        </form>
      </div>
    );
  const nav = [
    ['events', 'งานอีเวนต์'],
    ['templates', 'แม่แบบผังโต๊ะ'],
    ['customers', 'รายชื่อผู้ติดต่อ'],
    ...(user.role === 'super_admin' ? [['admins', 'ผู้ดูแลระบบ']] : []),
    ['audit', 'ประวัติการทำงาน'],
    ['account', 'บัญชีของฉัน'],
  ];
  return (
    <div className="bk-app bk-shell">
      <aside className="bk-sidebar">
        <Link href="/booking-admin/events" className="bk-brand">
          <b>
            bk<span>.</span>
          </b>
          <span>EVENT WORKSPACE</span>
        </Link>
        <p className="bk-nav-label">จัดการระบบ</p>
        <nav>
          {nav.map(([key, label]) => (
            <Link
              key={key}
              href={`/booking-admin/${key}`}
              className={page === key ? 'active' : ''}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="bk-user">
          <strong>{user.display_name}</strong>
          <small>{user.role === 'super_admin' ? 'Super admin' : 'Admin'}</small>
          <button
            onClick={async () => {
              try {
                await bkApi('/auth/logout', { method: 'POST' });
                setUser(null);
                router.replace('/booking-admin/login');
              } catch (err) {
                setError(errorMessage(err));
              }
            }}
          >
            ออกจากระบบ
          </button>
        </div>
      </aside>
      <main className="bk-main">
        <header className="bk-topbar">
          <span>
            หลังบ้าน / {nav.find(([key]) => key === page)?.[1] || 'งานอีเวนต์'}
          </span>
          <span className="bk-role">
            {user.role === 'super_admin' ? 'Super admin' : 'Admin'}
          </span>
        </header>
        <div className="bk-content">
          {error && (
            <p className="bk-error" role="alert">
              {error}
            </p>
          )}
          {page === 'events' &&
            (!parts[1] ? <EventList /> : <EventEditor key={parts[1]} id={parts[1]} />)}
          {page === 'templates' &&
            (!parts[1] ? (
              <TemplateList />
            ) : (
              <LayoutEditor key={parts[1]} templateId={parts[1]} />
            ))}
          {['customers', 'admins', 'audit', 'account'].includes(page) && (
            <People key={page} section={page} user={user} />
          )}
          {![
            'events',
            'templates',
            'customers',
            'admins',
            'audit',
            'account',
          ].includes(page) && (
            <p>
              ไม่พบหน้านี้{' '}
              <Link href="/booking-admin/events">กลับไปหน้างานอีเวนต์</Link>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
