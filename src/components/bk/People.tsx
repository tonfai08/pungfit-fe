'use client';
import { useCallback, useEffect, useState } from 'react';
import { bkApi, BkUser, errorMessage, dateLabel } from '@/lib/bk-api';
type Audit = {
  _id: string;
  actor_id: { display_name: string } | null;
  action: string;
  entity_type: string;
  created_at: string;
};

export default function People({
  section,
  user,
}: {
  section: string;
  user: BkUser;
}) {
  const [users, setUsers] = useState<BkUser[]>([]);
  const [logs, setLogs] = useState<Audit[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [resetTarget, setResetTarget] = useState<BkUser | null>(null);
  const load = useCallback(async () => {
    if (section === 'admins' && user.role === 'super_admin')
      setUsers(await bkApi<BkUser[]>('/auth/admins'));
    if (section === 'customers') setUsers(await bkApi<BkUser[]>('/customers'));
    if (section === 'audit') setLogs(await bkApi<Audit[]>('/audit'));
  }, [section, user.role]);
  useEffect(() => {
    setError('');
    setShowForm(false);
    load().catch((e) => setError(errorMessage(e)));
  }, [load]);
  async function changeAdmin(
    target: BkUser,
    action: 'toggle' | 'delete',
  ) {
    const body = { is_active: !target.is_active };
    if (
      action === 'delete' &&
      !window.confirm(
        `ลบสิทธิ์แอดมินของ ${target.display_name}? ประวัติการทำงานยังคงอยู่`,
      )
    )
      return;
    setBusy(true);
    setError('');
    try {
      await bkApi(`/auth/admins/${target._id}`, {
        method: action === 'delete' ? 'DELETE' : 'PATCH',
        ...(action !== 'delete' ? { body } : {}),
      });
      await load();
      setMessage('บันทึกแล้ว Session เดิมถูกเพิกถอนทันที');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  if (section === 'admins' && user.role !== 'super_admin')
    return <p className="bk-error">หน้านี้สำหรับ Super admin เท่านั้น</p>;
  return (
    <>
      <div className="bk-heading">
        <div>
          <span className="bk-eyebrow">WORKSPACE SETTINGS</span>
          <h1>
            {
              {
                customers: 'รายชื่อผู้ติดต่อ',
                admins: 'ผู้ดูแลระบบ',
                audit: 'ประวัติการทำงาน',
                account: 'บัญชีของฉัน',
              }[section]
            }
          </h1>
          <p>
            {section === 'admins'
              ? 'Admin จัดการงานและการจอง · Super admin จัดการผู้ดูแลได้ด้วย'
              : section === 'audit'
                ? '100 รายการล่าสุด'
                : ''}
          </p>
        </div>
        {['admins', 'customers'].includes(section) && (
          <button className="bk-primary" onClick={() => setShowForm(!showForm)}>
            {showForm
              ? 'ปิดแบบฟอร์ม'
              : section === 'admins'
                ? '+ เพิ่ม Admin'
                : '+ เพิ่มผู้ติดต่อ'}
          </button>
        )}
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
      {resetTarget && (
        <form className="bk-panel" action={async form => {
          setBusy(true); setError('');
          try {
            await bkApi(`/auth/admins/${resetTarget._id}`, { method: 'PATCH', body: { password: form.get('password') } });
            setResetTarget(null); setMessage('ตั้งรหัสผ่านใหม่แล้ว Session เดิมถูกเพิกถอนทันที');
          } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
        }}>
          <h3>ตั้งรหัสผ่านใหม่: {resetTarget.display_name}</h3>
          <label>รหัสผ่านใหม่<input name="password" type="password" minLength={12} autoComplete="new-password" required /></label>
          <div className="bk-inline"><button className="bk-primary" disabled={busy}>บันทึกรหัสผ่าน</button><button type="button" onClick={() => setResetTarget(null)}>ยกเลิก</button></div>
        </form>
      )}
      {showForm && (
        <form
          className="bk-panel"
          action={async (form) => {
            setBusy(true);
            setError('');
            try {
              const body =
                section === 'admins'
                  ? {
                      display_name: form.get('name'),
                      email: form.get('email'),
                      password: form.get('password'),
                    }
                  : {
                      display_name: form.get('name'),
                      phone: form.get('phone'),
                      x_account: form.get('x') || '',
                    };
              await bkApi(
                section === 'admins' ? '/auth/admins' : '/customers',
                { method: 'POST', body },
              );
              await load();
              setShowForm(false);
            } catch (err) {
              setError(errorMessage(err));
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="bk-form-grid">
            <label>
              ชื่อ
              <input name="name" required />
            </label>
            {section === 'admins' ? (
              <>
                <label>
                  อีเมล
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="off"
                  />
                </label>
                <label>
                  รหัสผ่านเริ่มต้น
                  <input
                    name="password"
                    type="password"
                    minLength={12}
                    required
                    autoComplete="new-password"
                  />
                </label>
                <p>บัญชีใหม่ได้รับสิทธิ์ Admin ทั่วไป</p>
              </>
            ) : (
              <>
                <label>
                  เบอร์โทร
                  <input name="phone" type="tel" minLength={5} required />
                </label>
                <label>
                  X account
                  <input name="x" />
                </label>
              </>
            )}
          </div>
          <button className="bk-primary" disabled={busy}>
            สร้างบัญชี
          </button>
        </form>
      )}
      {['admins', 'customers'].includes(section) && (
        <div className="bk-table-wrap">
          <table>
            <thead>
              <tr>
                <th>ชื่อ</th>
                <th>{section === 'admins' ? 'อีเมล' : 'เบอร์โทร'}</th>
                <th>สิทธิ์ / สถานะ</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {users.map((target) => (
                <tr key={target._id}>
                  <td>{target.display_name}</td>
                  <td>{section === 'admins' ? target.email : target.phone}</td>
                  <td>
                    <span className="bk-badge">
                      {target.role === 'super_admin'
                        ? 'Super admin'
                        : target.role === 'admin'
                          ? 'Admin'
                          : 'ผู้ติดต่อ'}{' '}
                      · {target.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                    </span>
                  </td>
                  <td>
                    {section === 'admins' && target.role === 'admin' && (
                      <div className="bk-inline">
                        <button
                          disabled={busy}
                          onClick={() => changeAdmin(target, 'toggle')}
                        >
                          {target.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => setResetTarget(target)}
                        >
                          ตั้งรหัสผ่านใหม่
                        </button>
                        <button
                          className="bk-danger"
                          disabled={busy}
                          onClick={() => changeAdmin(target, 'delete')}
                        >
                          ลบ Admin
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!users.length && <p className="bk-empty">ยังไม่มีรายการ</p>}
        </div>
      )}
      {section === 'audit' && (
        <div className="bk-table-wrap">
          <table>
            <thead>
              <tr>
                <th>เวลา</th>
                <th>ผู้ดำเนินการ</th>
                <th>การทำงาน</th>
                <th>ข้อมูล</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id}>
                  <td>{dateLabel(log.created_at)}</td>
                  <td>{log.actor_id?.display_name || 'ระบบ'}</td>
                  <td>{log.action}</td>
                  <td>{log.entity_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {section === 'account' && (
        <form
          className="bk-panel"
          action={async (form) => {
            setBusy(true);
            setError('');
            try {
              await bkApi('/auth/password', {
                method: 'POST',
                body: {
                  current_password: form.get('current'),
                  new_password: form.get('new'),
                },
              });
              window.location.assign('/booking-admin/login');
            } catch (err) {
              setError(errorMessage(err));
            } finally {
              setBusy(false);
            }
          }}
        >
          <h2>{user.display_name}</h2>
          <p>{user.email}</p>
          <div className="bk-form-grid">
            <label>
              รหัสผ่านปัจจุบัน
              <input
                name="current"
                type="password"
                required
                autoComplete="current-password"
              />
            </label>
            <label>
              รหัสผ่านใหม่
              <input
                name="new"
                type="password"
                required
                minLength={12}
                autoComplete="new-password"
              />
            </label>
          </div>
          <p>เมื่อเปลี่ยนรหัสผ่าน ระบบจะออกจากระบบทุกอุปกรณ์</p>
          <button className="bk-primary" disabled={busy}>
            เปลี่ยนรหัสผ่าน
          </button>
        </form>
      )}
    </>
  );
}
