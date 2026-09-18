'use client';
import { Tooltip, Tag } from 'antd';
import { BkLayout, CanvasObject, Inventory, BkTable, statuses } from '@/lib/bk-api';

export const pastelColors = [
  ['เขียวมิ้นต์', '#D7EBDD'], ['ฟ้า', '#D6EAF8'], ['ม่วง', '#E6DAF5'],
  ['ชมพู', '#F8DCE5'], ['พีช', '#FADEC9'], ['เหลือง', '#F8EDBE'],
  ['เขียวอ่อน', '#E5EBCB'], ['เทา', '#E1E5EB'],
] as const;
export function ObjectShape({ object, fill, caption }: {
  object: CanvasObject; fill?: string; caption?: string;
}) {
  return <>
    <rect width={object.width} height={object.height}
      style={{ fill: fill || object.properties_json.color }}
      rx={object.kind === 'table' && object.properties_json.shape === 'round'
        ? Math.min(object.width, object.height) / 2 : 6} />
    {object.kind !== 'chair' && <>
      <text x={object.width / 2} y={object.height / 2 - (object.kind === 'table' ? 4 : 0)}
        textAnchor="middle" dominantBaseline="middle">{object.label}</text>
      {object.kind === 'table' && <text className="bk-seat-count" x={object.width / 2}
        y={object.height / 2 + 15} textAnchor="middle">{caption || `${object.properties_json.capacity} คน`}</text>}
    </>}
  </>;
}
export function tableForObject(object: CanvasObject, inventory: Inventory) {
  return inventory.tables.find((table) => table.layout_object_id ===
    (object.kind === 'chair' ? object.parent_object_id : object._id));
}
export function OccupantInfo({ table, inventory }: { table: BkTable; inventory: Inventory }) {
  const booking = inventory.assignments.find((a) => a.event_table_id === table._id)?.booking;
  return <div><strong>{table.code}</strong>{booking ? <>
    <div>{statuses[booking.status]} · {booking.contact_name}</div>
    <div>UID: {booking.user_id || 'ไม่ได้เชื่อมผู้ติดต่อ'}</div>
    <div>เลขจอง: {booking.booking_no}</div>
    <div>X: {booking.contact_x_account || '—'}</div>
    <div>โทร: {booking.contact_phone || '—'}</div>
  </> : <div>{table.is_bookable ? 'ยังไม่ได้จัดให้ผู้จอง' : 'ปิดจอง'}</div>}</div>;
}
export default function SeatingCanvas({ layout, inventory, onTableClick, selectedIds = [] }: {
  layout: BkLayout; inventory: Inventory; onTableClick?: (table: BkTable) => void; selectedIds?: string[];
}) {
  return <>
    <div style={{ marginBottom: 12 }}><Tag color="orange">รอชำระ / รอตรวจ</Tag>
      <Tag color="red">จองแล้ว</Tag><Tag color="blue">กำลังเลือก</Tag><Tag>ปิดจอง</Tag></div>
    <div className="bk-canvas-wrap"><svg viewBox={`0 0 ${layout.canvas_width} ${layout.canvas_height}`}
      role="group" aria-label="ผังเลือกโต๊ะ">
      {layout.objects.map((object) => {
        const table = tableForObject(object, inventory);
        const booking = inventory.assignments.find((a) => a.event_table_id === table?._id)?.booking;
        const selected = table && selectedIds.includes(table._id);
        const fill = selected ? '#91CAFF' : booking ? (booking.status === 'confirmed' ? '#FFB8B8' : '#FFD591')
          : table && !table.is_bookable ? '#C8CDD3' : undefined;
        return <Tooltip key={object._id} title={table ? <OccupantInfo table={table} inventory={inventory} /> : object.label}>
          <g className={`bk-canvas-object ${object.kind} ${selected ? 'selected' : ''}`}
            transform={`translate(${object.x} ${object.y}) rotate(${object.rotation} ${object.width / 2} ${object.height / 2})`}
            role={table ? 'button' : undefined} tabIndex={table ? 0 : undefined}
            aria-label={`${object.label}${booking ? ` ${statuses[booking.status]}` : ''}`}
            onClick={() => table && onTableClick?.(table)}
            onKeyDown={(e) => { if (table && ['Enter', ' '].includes(e.key)) { e.preventDefault(); onTableClick?.(table); } }}>
            <ObjectShape object={object} fill={fill} caption={booking ? statuses[booking.status] : undefined} />
          </g>
        </Tooltip>;
      })}
    </svg></div>
  </>;
}
