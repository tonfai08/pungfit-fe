'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  bkApi,
  BkLayout,
  BkTemplate,
  CanvasObject,
  TableType,
  errorMessage,
  money,
} from '@/lib/bk-api';

const uid = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(12)), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
const emptyLayout = (): BkLayout => ({
  name: 'แม่แบบใหม่',
  canvas_width: 1000,
  canvas_height: 700,
  version: 0,
  objects: [],
});
function cleanLayout(layout: BkLayout) {
  return {
    name: layout.name,
    canvas_width: layout.canvas_width,
    canvas_height: layout.canvas_height,
    version: layout.version || 0,
    objects: layout.objects.map((object) => ({
      _id: object._id,
      parent_object_id: object.parent_object_id || null,
      kind: object.kind,
      label: object.label || '',
      x: object.x,
      y: object.y,
      width: object.width,
      height: object.height,
      rotation: object.rotation || 0,
      z_index: object.z_index || 0,
      properties_json: {
        shape: object.properties_json?.shape || 'round',
        capacity: object.properties_json?.capacity || 4,
      },
      table_type_id: object.table_type_id || null,
      zone: object.zone || '',
      is_bookable: object.is_bookable ?? true,
    })),
  };
}
export default function LayoutEditor({
  templateId,
  eventId,
}: {
  templateId?: string;
  eventId?: string;
}) {
  const router = useRouter();
  const [layout, setLayout] = useState<BkLayout>(emptyLayout);
  const [types, setTypes] = useState<TableType[]>([]);
  const [templates, setTemplates] = useState<BkTemplate[]>([]);
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const history = useRef<BkLayout[]>([]);
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{
    id: string;
    x: number;
    y: number;
    snapshot: BkLayout;
  } | null>(null);
  const current = layout.objects.find((object) => object._id === selected);
  const loadTypes = useCallback(async () => {
    if (eventId)
      setTypes(await bkApi<TableType[]>(`/events/${eventId}/table-types`));
  }, [eventId]);
  useEffect(() => {
    const load = async () => {
      if (eventId) {
        setLayout(await bkApi<BkLayout>(`/events/${eventId}/layout`));
        setTemplates(await bkApi<BkTemplate[]>('/templates'));
        await loadTypes();
      } else if (templateId !== 'new')
        setLayout(await bkApi<BkLayout>(`/templates/${templateId}`));
    };
    load()
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [eventId, templateId, loadTypes]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  function change(next: BkLayout, remember = true) {
    if (remember)
      history.current = [
        ...history.current.slice(-29),
        structuredClone(layout),
      ];
    setLayout(next);
    setDirty(true);
    setMessage('');
  }
  function patchObject(patch: Partial<CanvasObject>) {
    change({
      ...layout,
      objects: layout.objects.map((object) =>
        object._id === selected ? { ...object, ...patch } : object,
      ),
    });
  }
  function nextCode() {
    let count = 1;
    const codes = new Set(
      layout.objects
        .filter((object) => object.kind === 'table')
        .map((object) => object.label),
    );
    while (codes.has(`T${String(count).padStart(2, '0')}`)) count++;
    return `T${String(count).padStart(2, '0')}`;
  }
  function add(kind: CanvasObject['kind']) {
    if (eventId && kind === 'table' && !types.length) {
      setError('เพิ่มประเภทโต๊ะและราคาก่อนวางโต๊ะ');
      return;
    }
    const count = layout.objects.filter(
      (object) => object.kind === 'table',
    ).length;
    const object: CanvasObject = {
      _id: uid(),
      kind,
      label:
        kind === 'table'
          ? nextCode()
          : {
              chair: 'เก้าอี้',
              stage: 'เวที',
              entrance: 'ทางเข้า',
              text: 'ข้อความ',
            }[kind],
      x: Math.min(70 + (count % 5) * 160, layout.canvas_width - 200),
      y: Math.min(
        160 + Math.floor(count / 5) * 150,
        layout.canvas_height - 160,
      ),
      width: kind === 'table' ? 85 : kind === 'chair' ? 22 : 160,
      height: kind === 'table' ? 85 : kind === 'chair' ? 22 : 50,
      rotation: 0,
      z_index: layout.objects.length,
      properties_json: { shape: 'round', capacity: types[0]?.capacity || 4 },
      table_type_id: kind === 'table' ? types[0]?._id || null : null,
      is_bookable: true,
    };
    if (kind === 'chair' && current?.kind === 'table') {
      object.parent_object_id = current._id;
      object.x = Math.min(
        current.x + current.width + 10,
        layout.canvas_width - 22,
      );
      object.y = current.y;
    }
    object.x = Math.max(0, object.x);
    object.y = Math.max(0, object.y);
    const objects = [...layout.objects, object];
    if (kind === 'table') {
      for (let i = 0; i < object.properties_json.capacity; i++) {
        const angle = (Math.PI * 2 * i) / object.properties_json.capacity;
        objects.push({
          _id: uid(),
          parent_object_id: object._id,
          kind: 'chair',
          label: `ที่นั่ง ${i + 1}`,
          x: Math.max(
            0,
            Math.min(
              layout.canvas_width - 20,
              object.x + 32 + Math.cos(angle) * 66,
            ),
          ),
          y: Math.max(
            0,
            Math.min(
              layout.canvas_height - 20,
              object.y + 32 + Math.sin(angle) * 66,
            ),
          ),
          width: 20,
          height: 20,
          rotation: 0,
          z_index: objects.length,
          properties_json: { shape: 'round', capacity: 1 },
        });
      }
    }
    change({ ...layout, objects });
    setSelected(object._id);
  }
  function point(event: React.PointerEvent<SVGSVGElement>) {
    const matrix = svg.current?.getScreenCTM();
    if (!matrix) return { x: 0, y: 0 };
    return new DOMPoint(event.clientX, event.clientY).matrixTransform(
      matrix.inverse(),
    );
  }
  async function save() {
    setBusy(true);
    setError('');
    try {
      const saved = await bkApi<BkLayout>(
        eventId
          ? `/events/${eventId}/layout`
          : templateId === 'new'
            ? '/templates'
            : `/templates/${templateId}`,
        {
          method: templateId === 'new' ? 'POST' : 'PUT',
          body: cleanLayout(layout),
        },
      );
      setLayout(saved);
      history.current = [];
      setDirty(false);
      setMessage('บันทึกผังแล้ว');
      if (templateId === 'new')
        router.replace(`/booking-admin/templates/${saved._id}`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <p>กำลังโหลดผัง…</p>;
  return (
    <>
      {templateId && (
        <>
          <Link className="bk-back" href="/booking-admin/templates">
            ← แม่แบบทั้งหมด
          </Link>
          <div className="bk-heading">
            <div>
              <h1>ออกแบบผังโต๊ะ</h1>
              <p>ลากเพื่อย้ายตำแหน่ง หรือเลือกวัตถุเพื่อปรับรายละเอียด</p>
            </div>
          </div>
        </>
      )}
      {eventId && (
        <TableTypes types={types} eventId={eventId} onChange={loadTypes} />
      )}
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
      <div className="bk-panel">
        <div className="bk-form-grid">
          {templateId && (
            <label>
              ชื่อแม่แบบ
              <input
                value={layout.name || ''}
                onChange={(e) => change({ ...layout, name: e.target.value })}
              />
            </label>
          )}
          <div className="bk-inline">
            <label>
              กว้าง
              <input
                type="number"
                min={100}
                max={5000}
                value={layout.canvas_width}
                onChange={(e) =>
                  change({ ...layout, canvas_width: Number(e.target.value) })
                }
              />
            </label>
            <label>
              สูง
              <input
                type="number"
                min={100}
                max={5000}
                value={layout.canvas_height}
                onChange={(e) =>
                  change({ ...layout, canvas_height: Number(e.target.value) })
                }
              />
            </label>
          </div>
        </div>
        {eventId && !layout._id && (
          <label>
            เริ่มจากแม่แบบ
            <select
              defaultValue=""
              disabled={busy}
              onChange={async (e) => {
                if (!e.target.value) return;
                if (
                  layout.objects.length &&
                  !window.confirm('นำแม่แบบมาแทนผังที่ยังไม่ได้บันทึก?')
                )
                  return;
                setBusy(true);
                setError('');
                try {
                  const data = await bkApi<BkLayout>(
                    `/events/${eventId}/copy-template`,
                    { method: 'POST', body: { template_id: e.target.value } },
                  );
                  setLayout(data);
                  setDirty(false);
                  await loadTypes();
                  setMessage(
                    'นำเข้าแม่แบบแล้ว ตรวจสอบราคาประเภทโต๊ะก่อนเปิดจอง',
                  );
                } catch (err) {
                  setError(errorMessage(err));
                } finally {
                  setBusy(false);
                }
              }}
            >
              <option value="">เลือกแม่แบบ…</option>
              {templates.map((template) => (
                <option value={template._id} key={template._id}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="bk-toolbar">
          {(
            [
              ['table', '+ โต๊ะ'],
              ['chair', '+ เก้าอี้'],
              ['stage', '+ เวที'],
              ['entrance', '+ ทางเข้า'],
              ['text', '+ ข้อความ'],
            ] as const
          ).map(([kind, label]) => (
            <button key={kind} onClick={() => add(kind)}>
              {label}
            </button>
          ))}
          <button
            disabled={!history.current.length}
            onClick={() => {
              const previous = history.current.pop();
              if (previous) {
                setLayout(previous);
                setDirty(true);
              }
            }}
          >
            ย้อนกลับ
          </button>
          <span>
            {layout.objects.filter((o) => o.kind === 'table').length} โต๊ะ ·{' '}
            {layout.objects
              .filter((o) => o.kind === 'table')
              .reduce(
                (sum, object) =>
                  sum +
                  (types.find((type) => type._id === object.table_type_id)
                    ?.capacity || object.properties_json.capacity),
                0,
              )}{' '}
            ที่นั่ง
          </span>
          <button className="bk-primary" disabled={busy} onClick={save}>
            {busy ? 'กำลังบันทึก…' : dirty ? 'บันทึกผัง *' : 'บันทึกผัง'}
          </button>
        </div>
        <div className="bk-canvas-layout">
          <div className="bk-canvas-wrap">
            <svg
              ref={svg}
              viewBox={`0 0 ${Math.max(100, layout.canvas_width)} ${Math.max(100, layout.canvas_height)}`}
              role="group"
              aria-label="ผังโต๊ะและเก้าอี้"
              onPointerDown={(event) => {
                const target = (event.target as Element)
                  .closest('[data-object]')
                  ?.getAttribute('data-object');
                if (!target) {
                  setSelected('');
                  return;
                }
                setSelected(target);
                const position = point(event);
                drag.current = {
                  id: target,
                  x: position.x,
                  y: position.y,
                  snapshot: structuredClone(layout),
                };
                svg.current?.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                const moving = drag.current;
                if (!moving) return;
                const position = point(event);
                const affected = moving.snapshot.objects.filter(
                  (o) =>
                    o._id === moving.id || o.parent_object_id === moving.id,
                );
                const minX = Math.min(...affected.map((o) => o.x));
                const minY = Math.min(...affected.map((o) => o.y));
                const maxX = Math.max(...affected.map((o) => o.x + o.width));
                const maxY = Math.max(...affected.map((o) => o.y + o.height));
                const dx = Math.max(
                  -minX,
                  Math.min(layout.canvas_width - maxX, position.x - moving.x),
                );
                const dy = Math.max(
                  -minY,
                  Math.min(layout.canvas_height - maxY, position.y - moving.y),
                );
                setLayout({
                  ...moving.snapshot,
                  objects: moving.snapshot.objects.map((o) =>
                    affected.some((a) => a._id === o._id)
                      ? {
                          ...o,
                          x: Math.round(o.x + dx),
                          y: Math.round(o.y + dy),
                        }
                      : o,
                  ),
                });
                setDirty(true);
              }}
              onPointerUp={() => {
                if (drag.current) {
                  history.current = [
                    ...history.current.slice(-29),
                    drag.current.snapshot,
                  ];
                  drag.current = null;
                }
              }}
              onPointerCancel={() => {
                drag.current = null;
              }}
            >
              <defs>
                <pattern
                  id="bk-grid"
                  width="25"
                  height="25"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="1" cy="1" r="1" fill="#ccd7d4" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#bk-grid)" />
              {layout.objects.map((object) => (
                <g
                  data-object={object._id}
                  key={object._id}
                  transform={`translate(${object.x} ${object.y}) rotate(${object.rotation} ${object.width / 2} ${object.height / 2})`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${object.kind}: ${object.label}`}
                  onFocus={() => setSelected(object._id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') setSelected(object._id);
                  }}
                  className={`bk-canvas-object ${object.kind} ${selected === object._id ? 'selected' : ''}`}
                >
                  <rect
                    width={object.width}
                    height={object.height}
                    rx={
                      object.kind === 'table' &&
                      object.properties_json.shape === 'round'
                        ? Math.min(object.width, object.height) / 2
                        : 6
                    }
                  />
                  {object.kind !== 'chair' && (
                    <>
                      <text
                        x={object.width / 2}
                        y={
                          object.height / 2 - (object.kind === 'table' ? 4 : 0)
                        }
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        {object.label}
                      </text>
                      {object.kind === 'table' && (
                        <text
                          className="bk-seat-count"
                          x={object.width / 2}
                          y={object.height / 2 + 15}
                          textAnchor="middle"
                        >
                          {types.find(
                            (type) => type._id === object.table_type_id,
                          )?.capacity || object.properties_json.capacity}{' '}
                          คน
                        </text>
                      )}
                    </>
                  )}
                </g>
              ))}
            </svg>
          </div>
          <aside className="bk-object-panel">
            {current ? (
              <>
                <h3>ปรับแต่งวัตถุ</h3>
                <label>
                  ชื่อ / รหัส
                  <input
                    maxLength={current.kind === 'table' ? 50 : 100}
                    value={current.label}
                    onChange={(e) => patchObject({ label: e.target.value })}
                  />
                </label>
                <div className="bk-form-grid">
                  {(['x', 'y', 'width', 'height', 'rotation'] as const).map(
                    (key) => (
                      <label key={key}>
                        {
                          {
                            x: 'ตำแหน่ง X',
                            y: 'ตำแหน่ง Y',
                            width: 'กว้าง',
                            height: 'สูง',
                            rotation: 'หมุน (องศา)',
                          }[key]
                        }
                        <input
                          type="number"
                          min={0}
                          value={current[key]}
                          onChange={(e) =>
                            patchObject({ [key]: Number(e.target.value) })
                          }
                        />
                      </label>
                    ),
                  )}
                </div>
                {current.kind === 'table' && (
                  <>
                    <label>
                      รูปทรง
                      <select
                        value={current.properties_json.shape}
                        onChange={(e) =>
                          patchObject({
                            properties_json: {
                              ...current.properties_json,
                              shape: e.target.value as 'round' | 'rect',
                            },
                          })
                        }
                      >
                        <option value="round">กลม</option>
                        <option value="rect">สี่เหลี่ยม</option>
                      </select>
                    </label>
                    {eventId ? (
                      <>
                        <label>
                          ประเภทโต๊ะ
                          <select
                            value={current.table_type_id || ''}
                            onChange={(e) =>
                              patchObject({ table_type_id: e.target.value })
                            }
                          >
                            <option value="">เลือกประเภท</option>
                            {types.map((type) => (
                              <option key={type._id} value={type._id}>
                                {type.name} · {type.capacity} คน
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          โซน
                          <input
                            value={current.zone || ''}
                            onChange={(e) =>
                              patchObject({ zone: e.target.value })
                            }
                          />
                        </label>
                        <label className="bk-checkbox">
                          <input
                            type="checkbox"
                            checked={current.is_bookable ?? true}
                            onChange={(e) =>
                              patchObject({ is_bookable: e.target.checked })
                            }
                          />
                          เปิดให้จอง
                        </label>
                      </>
                    ) : (
                      <label>
                        จำนวนคนต่อโต๊ะ
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={current.properties_json.capacity}
                          onChange={(e) =>
                            patchObject({
                              properties_json: {
                                ...current.properties_json,
                                capacity: Number(e.target.value),
                              },
                            })
                          }
                        />
                      </label>
                    )}
                  </>
                )}
                <button
                  onClick={() => {
                    const copyId = uid();
                    const copy = {
                      ...current,
                      _id: copyId,
                      label:
                        current.kind === 'table' ? nextCode() : current.label,
                      x: Math.min(
                        layout.canvas_width - current.width,
                        current.x + 30,
                      ),
                      y: Math.min(
                        layout.canvas_height - current.height,
                        current.y + 30,
                      ),
                    };
                    const dx = copy.x - current.x;
                    const dy = copy.y - current.y;
                    const children = layout.objects
                      .filter((o) => o.parent_object_id === current._id)
                      .map((o) => ({
                        ...o,
                        _id: uid(),
                        parent_object_id: copyId,
                        x: Math.max(
                          0,
                          Math.min(layout.canvas_width - o.width, o.x + dx),
                        ),
                        y: Math.max(
                          0,
                          Math.min(layout.canvas_height - o.height, o.y + dy),
                        ),
                      }));
                    change({
                      ...layout,
                      objects: [...layout.objects, copy, ...children],
                    });
                    setSelected(copyId);
                  }}
                >
                  ทำสำเนา
                </button>
                <button
                  className="bk-danger"
                  onClick={() => {
                    change({
                      ...layout,
                      objects: layout.objects.filter(
                        (o) =>
                          o._id !== selected && o.parent_object_id !== selected,
                      ),
                    });
                    setSelected('');
                  }}
                >
                  ลบวัตถุที่เลือก
                </button>
                <small>ID: {current._id}</small>
              </>
            ) : (
              <p>เลือกโต๊ะ เก้าอี้ หรือวัตถุในผังเพื่อแก้ไข</p>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}

function TableTypes({
  types,
  eventId,
  onChange,
}: {
  types: TableType[];
  eventId: string;
  onChange: () => Promise<void>;
}) {
  const [editing, setEditing] = useState<TableType | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function save(form: FormData) {
    setBusy(true);
    setError('');
    try {
      await bkApi(
        `/events/${eventId}/table-types${editing ? `/${editing._id}` : ''}`,
        {
          method: editing ? 'PATCH' : 'POST',
          body: {
            name: form.get('name'),
            capacity: Number(form.get('capacity')),
            price_satang: Math.round(Number(form.get('price')) * 100),
            is_active: form.get('active') === 'on',
          },
        },
      );
      setEditing(null);
      await onChange();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="bk-panel">
      <h2>ประเภทโต๊ะและราคา</h2>
      <div className="bk-type-list">
        {types.map((type) => (
          <button key={type._id} onClick={() => setEditing(type)}>
            <strong>{type.name}</strong>
            <span>
              {type.capacity} คน · {money(type.price_satang)}
              {!type.is_active && ' · ปิดขาย'}
            </span>
          </button>
        ))}
      </div>
      <form key={editing?._id || 'new'} action={save} className="bk-inline">
        <label>
          ชื่อประเภท
          <input
            required
            name="name"
            defaultValue={editing?.name}
            placeholder="เช่น VIP"
          />
        </label>
        <label>
          คน / โต๊ะ
          <input
            name="capacity"
            type="number"
            required
            min={1}
            max={100}
            defaultValue={editing?.capacity || 4}
          />
        </label>
        <label>
          ราคา (บาท)
          <input
            name="price"
            type="number"
            required
            min={0}
            step="0.01"
            defaultValue={(editing?.price_satang || 0) / 100}
          />
        </label>
        <label className="bk-checkbox">
          <input
            name="active"
            type="checkbox"
            defaultChecked={editing?.is_active ?? true}
          />
          เปิดขาย
        </label>
        <button disabled={busy}>
          {editing ? 'บันทึกประเภท' : '+ เพิ่มประเภท'}
        </button>
        {editing && (
          <button type="button" onClick={() => setEditing(null)}>
            ยกเลิกแก้ไข
          </button>
        )}
      </form>
      {error && (
        <p className="bk-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
