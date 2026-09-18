'use client';
import { useEffect, useRef, useState } from 'react';
import { bkUpload, errorMessage } from '@/lib/bk-api';

export default function RichEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const editor = useRef<HTMLDivElement>(null);
  const range = useRef<Range | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (
      editor.current &&
      document.activeElement !== editor.current &&
      editor.current.innerHTML !== value
    )
      editor.current.innerHTML = value;
  }, [value]);
  function remember() {
    const selection = window.getSelection();
    if (selection?.rangeCount && editor.current?.contains(selection.anchorNode))
      range.current = selection.getRangeAt(0).cloneRange();
  }
  function command(name: string, arg?: string) {
    editor.current?.focus();
    if (range.current) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range.current);
    }
    document.execCommand(name, false, arg);
    remember();
    onChange(editor.current?.innerHTML || '');
  }
  return (
    <div className="bk-rich">
      <div className="bk-toolbar">
        {[
          ['bold', 'ตัวหนา'],
          ['italic', 'ตัวเอียง'],
          ['insertUnorderedList', 'รายการ'],
        ].map(([cmd, label]) => (
          <button
            type="button"
            key={cmd}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => command(cmd)}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => command('formatBlock', 'h2')}
        >
          หัวข้อ
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => command('formatBlock', 'p')}
        >
          ย่อหน้า
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            remember();
            file.current?.click();
          }}
        >
          {busy ? 'กำลังอัปโหลด…' : '+ รูปภาพ'}
        </button>
        <input
          hidden
          ref={file}
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const image = e.target.files?.[0];
            if (!image) return;
            setBusy(true);
            setError('');
            try {
              const uploaded = await bkUpload(image);
              command('insertImage', uploaded.url);
            } catch (err) {
              setError(errorMessage(err));
            } finally {
              setBusy(false);
              e.target.value = '';
            }
          }}
        />
      </div>
      <div
        ref={editor}
        className="bk-rich-content"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label="รายละเอียดงานแบบบทความ"
        aria-multiline
        onKeyUp={remember}
        onMouseUp={remember}
        onInput={() => {
          remember();
          onChange(editor.current?.innerHTML || '');
        }}
      />
      {error && (
        <p className="bk-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
