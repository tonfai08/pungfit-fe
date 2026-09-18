export type BkUser = {
  _id: string;
  email?: string;
  display_name: string;
  role: 'customer' | 'admin' | 'super_admin';
  is_active: boolean;
  phone?: string;
  x_account?: string;
  created_at?: string;
};
export type BkEvent = {
  booking_mode?: 'table' | 'capacity';
  capacity_limit?: number;
  max_attendees_per_booking?: number;
  price_per_attendee_satang?: number;
  _id: string;
  name: string;
  slug: string;
  status: 'draft' | 'scheduled' | 'cancelled' | 'archived';
  short_description?: string;
  content_json?: { html?: string };
  cover_file_id?: string | null;
  poster_file_id?: string | null;
  venue_name?: string;
  venue_address?: string;
  map_url?: string;
  starts_at?: string;
  ends_at?: string;
  publish_at?: string;
  booking_opens_at?: string;
  booking_closes_at?: string;
  hide_at?: string;
  timezone: string;
  table_selection_mode: 'customer_select' | 'admin_assign';
  waitlist_enabled: boolean;
  payment_required?: boolean;
  payment_due_minutes: number;
  payment_instructions?: string;
  booking_terms?: string;
};
export type TableType = {
  _id: string;
  name: string;
  capacity: number;
  price_satang: number;
  is_active: boolean;
  max_tables_per_booking?: number;
  total?: number;
  reserved?: number;
  available?: number;
};
export type CanvasObject = {
  _id: string;
  parent_object_id?: string | null;
  kind: 'table' | 'chair' | 'stage' | 'entrance' | 'text';
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  z_index: number;
  properties_json: { shape: 'round' | 'rect'; capacity: number; color?: string };
  table_type_id?: string | null;
  zone?: string;
  is_bookable?: boolean;
};
export type BkLayout = {
  _id?: string;
  name?: string;
  description?: string;
  canvas_width: number;
  canvas_height: number;
  version: number;
  objects: CanvasObject[];
};
export type BkTemplate = {
  _id: string;
  name: string;
  canvas_width: number;
  canvas_height: number;
};
export type BkTable = {
  _id: string;
  code: string;
  table_type_id: string;
  is_bookable: boolean;
  layout_object_id: string;
  zone?: string;
};
export type Assignment = {
  booking?: Booking;
  _id: string;
  event_table_id: string;
  booking_item_id: string;
};
export type Inventory = {
  booking_mode?: 'table' | 'capacity';
  capacity?: { total: number; reserved: number; available: number; max_attendees_per_booking: number; price_per_attendee_satang: number };
  types: TableType[];
  tables: BkTable[];
  assignments: Assignment[];
};
export type Booking = {
  booking_mode?: 'table' | 'capacity';
  unit_price_per_attendee_satang?: number;
  user_id?: string;
  _id: string;
  booking_no: string;
  contact_name: string;
  contact_phone: string;
  contact_x_account?: string;
  attendee_count: number;
  total_amount_satang: number;
  status: string;
  created_at: string;
  payment_due_at: string;
  hold_expires_at?: string;
  customer_note?: string;
  internal_note?: string;
  cancellation_reason?: string;
};
export type Payment = {
  _id: string;
  slip_file_id: string;
  submitted_amount_satang: number;
  transferred_at: string;
  status: string;
  review_note?: string;
};
export type BookingDetail = {
  booking: Booking;
  items: {
    _id: string;
    table_type_id: TableType;
    quantity: number;
    line_total_satang: number;
  }[];
  assignments: { booking_item_id: string; event_table_id: BkTable }[];
  payments: Payment[];
  check_ins: { _id: string; guest_count: number; checked_in_at: string }[];
};
export type Waitlist = {
  _id: string;
  contact_name: string;
  contact_phone: string;
  quantity: number;
  attendee_count: number;
  table_type_id: string;
  status: string;
  note?: string;
  offered_booking_id?: string;
};
let csrf = '';
export class BkApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function bkApi<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const response = await fetch(`/bk-api${path}`, {
    method: options.method || 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: {
      ...(options.body !== undefined
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...(csrf ? { 'X-Bk-Csrf': csrf } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  const data = await response
    .json()
    .catch(() => ({
      error: 'เชื่อมต่อ API ไม่สำเร็จ ตรวจสอบว่า backend เปิดอยู่',
    }));
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/auth/'))
      window.location.assign('/booking-admin/login');
    throw new BkApiError(data.error || 'เกิดข้อผิดพลาด', response.status);
  }
  if (typeof data.csrf === 'string') csrf = data.csrf;
  return data as T;
}
export async function bkUpload(
  file: File,
): Promise<{ _id: string; url: string }> {
  const form = new FormData();
  form.append('image', file);
  const response = await fetch('/bk-api/files', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'X-Bk-Csrf': csrf },
    body: form,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'อัปโหลดไม่สำเร็จ');
  return data;
}
export const money = (satang: number) =>
  (satang / 100).toLocaleString('th-TH', {
    style: 'currency',
    currency: 'THB',
  });
export const dateLabel = (value?: string) =>
  value
    ? new Date(value).toLocaleString('th-TH', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Bangkok',
      })
    : '—';
export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
export const statuses: Record<string, string> = {
  draft: 'ฉบับร่าง',
  scheduled: 'พร้อมเผยแพร่',
  cancelled: 'ยกเลิก',
  archived: 'เก็บถาวร',
  pending_payment: 'รอชำระ',
  payment_review: 'รอตรวจเงิน',
  confirmed: 'ยืนยันแล้ว',
  expired: 'หมดเวลา',
  pending: 'รอตรวจ',
  approved: 'ผ่าน',
  rejected: 'ไม่ผ่าน',
  waiting: 'รอติดต่อ',
  contacted: 'ติดต่อแล้ว',
  offered: 'เสนอสิทธิ์แล้ว',
  converted: 'เป็นการจองแล้ว',
  declined: 'ปฏิเสธ',
};
