'use client';

import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { Alert, Button, ColorPicker, Input, InputNumber, Modal, Select, Space } from 'antd';
import { bkUpload, errorMessage } from '@/lib/bk-api';
import { articleExtensions } from './article-extensions';

function ArticlePreview({ html }: { html: string }) {
  const editor = useEditor({ extensions: articleExtensions(), content: html, editable: false,
    immediatelyRender: false, editorProps: { attributes: { class: 'bk-rich-content' } } });
  return <EditorContent editor={editor} />;
}

export default function RichEditor({ value, onChange, onBusyChange }: {
  value: string; onChange: (html: string) => void; onBusyChange?: (busy: boolean) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const uploading = useRef(false);
  const emitted = useRef(value);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [link, setLink] = useState('');
  const [linkError, setLinkError] = useState('');
  const [imageOpen, setImageOpen] = useState(false);
  const [alt, setAlt] = useState('');
  const [caption, setCaption] = useState('');
  const [width, setWidth] = useState<number | null>(null);
  const editor = useEditor({
    extensions: articleExtensions(), content: value, immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    onUpdate: ({ editor: current }) => { emitted.current = current.getHTML(); onChange(emitted.current); },
    editorProps: {
      attributes: { class: 'bk-rich-content', role: 'textbox', 'aria-label': 'รายละเอียดงานแบบบทความ', 'aria-multiline': 'true' },
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.files || []);
        if (!files.length) return false;
        void uploadImages(files); return true;
      },
      handleDrop: (view, event, _slice, moved) => {
        const files = Array.from(event.dataTransfer?.files || []);
        if (moved || !files.length) return false;
        const position = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
        void uploadImages(files, position); return true;
      },
    },
  });
  useEffect(() => {
    if (editor && value !== emitted.current) {
      editor.commands.setContent(value, { emitUpdate: false }); emitted.current = value;
    }
  }, [editor, value]);

  async function uploadImages(files: File[], position?: number) {
    if (!editor || uploading.current) return;
    uploading.current = true; setBusy(true); onBusyChange?.(true); setError('');
    editor.setEditable(false);
    try {
      if (position !== undefined) editor.commands.setTextSelection(position);
      for (const file of files) {
        if (!file.type.startsWith('image/')) throw new Error('กรุณาเลือกไฟล์รูปภาพ');
        if (file.size > 6 * 1024 * 1024) throw new Error('รูปภาพต้องมีขนาดไม่เกิน 6 MB');
        const uploaded = await bkUpload(file);
        if (editor.isDestroyed) return;
        editor.chain().setImage({ src: uploaded.url, alt: file.name }).run();
      }
    } catch (cause) { setError(errorMessage(cause)); }
    finally {
      uploading.current = false; setBusy(false); onBusyChange?.(false);
      if (!editor.isDestroyed) { editor.setEditable(true); editor.commands.focus(); }
    }
  }

  if (!editor) return <div className="bk-rich">กำลังโหลดเครื่องมือเขียนบทความ…</div>;
  const tool = (label: string, action: () => void, active = false, disabled = false) =>
    <Button htmlType="button" type={active ? 'primary' : 'default'} aria-pressed={active}
      disabled={busy || disabled} onMouseDown={(event) => event.preventDefault()} onClick={action}>{label}</Button>;

  return <div className="bk-rich bk-tiptap">
    <div className="bk-article-toolbar" role="toolbar" aria-label="จัดรูปแบบบทความ">
      <Select aria-label="รูปแบบย่อหน้า" disabled={busy} style={{ width: 125 }}
        value={editor.isActive('heading', { level: 2 }) ? 'h2' : editor.isActive('heading', { level: 3 }) ? 'h3' : 'p'}
        options={[{ value: 'p', label: 'ย่อหน้า' }, { value: 'h2', label: 'หัวข้อใหญ่' }, { value: 'h3', label: 'หัวข้อย่อย' }]}
        onChange={(v) => { if (v === 'p') editor.chain().focus().setParagraph().run(); else editor.chain().focus().toggleHeading({ level: v === 'h2' ? 2 : 3 }).run(); }} />
      {tool('ตัวหนา', () => { editor.chain().focus().toggleBold().run(); }, editor.isActive('bold'))}
      {tool('ตัวเอียง', () => { editor.chain().focus().toggleItalic().run(); }, editor.isActive('italic'))}
      {tool('ขีดเส้นใต้', () => { editor.chain().focus().toggleUnderline().run(); }, editor.isActive('underline'))}
      {tool('ขีดฆ่า', () => { editor.chain().focus().toggleStrike().run(); }, editor.isActive('strike'))}
      <ColorPicker disabled={busy} value={editor.getAttributes('textStyle').color || '#173c38'} showText={() => 'สีข้อความ'}
        onChangeComplete={(color) => editor.chain().focus().setColor(color.toHexString()).run()} />
      <ColorPicker disabled={busy} value={editor.getAttributes('textStyle').backgroundColor || '#fff3b0'} showText={() => 'ไฮไลต์'}
        onChangeComplete={(color) => editor.chain().focus().setBackgroundColor(color.toHexString()).run()} />
      {tool('รายการ •', () => { editor.chain().focus().toggleBulletList().run(); }, editor.isActive('bulletList'))}
      {tool('รายการ 1.', () => { editor.chain().focus().toggleOrderedList().run(); }, editor.isActive('orderedList'))}
      {tool('คำอ้างอิง', () => { editor.chain().focus().toggleBlockquote().run(); }, editor.isActive('blockquote'))}
      <Select aria-label="จัดแนวข้อความ" disabled={busy} style={{ width: 115 }}
        value={editor.getAttributes('paragraph').textAlign || editor.getAttributes('heading').textAlign || 'left'}
        options={[{ value: 'left', label: 'ชิดซ้าย' }, { value: 'center', label: 'กึ่งกลาง' }, { value: 'right', label: 'ชิดขวา' }, { value: 'justify', label: 'เต็มบรรทัด' }]}
        onChange={(v) => editor.chain().focus().setTextAlign(v).run()} />
      {tool('ลิงก์', () => { setLink(editor.getAttributes('link').href || ''); setLinkError(''); setLinkOpen(true); }, editor.isActive('link'))}
      {tool('เอาลิงก์ออก', () => { editor.chain().focus().extendMarkRange('link').unsetLink().run(); }, false, !editor.isActive('link'))}
      {tool('เส้นคั่น', () => { editor.chain().focus().setHorizontalRule().run(); })}
      {tool('เพิ่มตาราง', () => { editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); })}
      {tool('เพิ่มรูปภาพ', () => input.current?.click())}
      {tool('ตั้งค่ารูปภาพ', () => {
        const attrs = editor.getAttributes('image'); setAlt(attrs.alt || ''); setCaption(attrs.caption || '');
        setWidth(attrs.width || null); setImageOpen(true);
      }, false, !editor.isActive('image'))}
      {tool('ล้างรูปแบบ', () => { editor.chain().focus().unsetAllMarks().clearNodes().run(); })}
      {tool('ย้อนกลับ', () => { editor.chain().focus().undo().run(); }, false, !editor.can().undo())}
      {tool('ทำซ้ำ', () => { editor.chain().focus().redo().run(); }, false, !editor.can().redo())}
      {tool('ดูตัวอย่าง', () => setPreview(editor.getHTML()))}
    </div>
    {editor.isActive('table') && <div className="bk-article-toolbar" aria-label="เครื่องมือตาราง">
      {tool('เพิ่มแถว', () => { editor.chain().focus().addRowAfter().run(); })}
      {tool('เพิ่มคอลัมน์', () => { editor.chain().focus().addColumnAfter().run(); })}
      {tool('ลบแถว', () => { editor.chain().focus().deleteRow().run(); })}
      {tool('ลบคอลัมน์', () => { editor.chain().focus().deleteColumn().run(); })}
      {tool('รวมเซลล์', () => { editor.chain().focus().mergeCells().run(); }, false, !editor.can().mergeCells())}
      {tool('แยกเซลล์', () => { editor.chain().focus().splitCell().run(); }, false, !editor.can().splitCell())}
      {tool('ลบตาราง', () => { editor.chain().focus().deleteTable().run(); })}
    </div>}
    <input ref={input} hidden type="file" accept="image/*" multiple aria-label="อัปโหลดรูปบทความ"
      onChange={(event) => { void uploadImages(Array.from(event.target.files || [])); event.target.value = ''; }} />
    <EditorContent editor={editor} />
    <p className="bk-article-hint">{busy ? 'กำลังอัปโหลดรูปภาพ…' : 'ลากรูปหรือวางจากคลิปบอร์ดได้ • คลิกรูปแล้วเลือก “ตั้งค่ารูปภาพ” เพื่อปรับขนาดและคำบรรยาย'}</p>
    {error && <Alert type="error" title={error} closable onClose={() => setError('')} />}
    <Modal title="เพิ่มหรือแก้ไขลิงก์" open={linkOpen} onCancel={() => setLinkOpen(false)} okText="บันทึกลิงก์" cancelText="ยกเลิก"
      onOk={() => {
        const href = link.trim();
        if (!/^(https?:\/\/\S+|mailto:[^\s@]+@[^\s@]+)$/i.test(href)) { setLinkError('ใส่ URL ที่ขึ้นต้นด้วย https:// หรือ mailto:'); return; }
        editor.chain().focus().extendMarkRange('link').setLink({ href }).run(); setLinkOpen(false);
      }}>
      <Input aria-label="URL ของลิงก์" value={link} onChange={(event) => setLink(event.target.value)} placeholder="https://example.com" />
      {linkError && <Alert type="error" title={linkError} />}
    </Modal>
    <Modal title="ตั้งค่ารูปภาพ" open={imageOpen} onCancel={() => setImageOpen(false)} okText="บันทึกรูปภาพ" cancelText="ยกเลิก"
      onOk={() => { editor.chain().focus().updateAttributes('image', { alt, caption, width }).run(); setImageOpen(false); }}>
      <Space orientation="vertical" style={{ width: '100%' }}>
        <label>ข้อความอธิบายรูป (Alt)<Input aria-label="ข้อความอธิบายรูป" value={alt} maxLength={500} onChange={(event) => setAlt(event.target.value)} /></label>
        <label>คำบรรยายใต้รูป<Input aria-label="คำบรรยายใต้รูป" value={caption} maxLength={1000} onChange={(event) => setCaption(event.target.value)} /></label>
        <label>ความกว้าง (พิกเซล)<InputNumber aria-label="ความกว้างรูป" min={50} max={2400} precision={0} value={width} onChange={setWidth} placeholder="ขนาดเดิม" style={{ width: '100%' }} /></label>
      </Space>
    </Modal>
    <Modal title="ตัวอย่างบทความ" open={preview !== null} onCancel={() => setPreview(null)} footer={null} width={850} destroyOnHidden>
      {preview !== null && <ArticlePreview html={preview} />}
    </Modal>
  </div>;
}
