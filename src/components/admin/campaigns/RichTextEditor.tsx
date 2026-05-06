import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import { Extension } from '@tiptap/core';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Minus,
  CaseSensitive,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import React, { useEffect, useRef, useState } from 'react';

/* ──────────────────── FontSize Extension ──────────────────── */

const FontSize = Extension.create({
  name: 'fontSize',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize?.replace('px', '') || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}px` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }: any) => {
          return chain().setMark('textStyle', { fontSize }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }: any) => {
          return chain().setMark('textStyle', { fontSize: null }).unsetMark('textStyle').run();
        },
    } as any;
  },
});

/* ──────────────────── Font Size Options ──────────────────── */

const FONT_SIZES = [
  { label: 'Kecil', value: '12' },
  { label: 'Normal', value: '16' },
  { label: 'Sedang', value: '20' },
  { label: 'Besar', value: '28' },
  { label: 'XL', value: '36' },
  { label: 'XXL', value: '48' },
  { label: '3XL', value: '64' },
];

/* ──────────────────── Types ──────────────────── */

type RichTextEditorProps = {
  label: string;
  hint?: string;
  error?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
};

/* ──────────────────── Toolbar Button ──────────────────── */

function ToolbarBtn({
  onAction,
  active,
  disabled,
  children,
  title,
}: {
  onAction: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      tabIndex={-1}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onAction();
      }}
      disabled={disabled}
      className={cn(
        'rounded p-1.5 transition-colors hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed',
        active ? 'bg-gray-200 text-gray-900' : 'text-gray-600',
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-1 h-4 w-px bg-gray-300" />;
}

/* ──────────────────── Menu Bar ──────────────────── */

function MenuBar({ editor }: { editor: Editor }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const handler = () => setTick((t) => t + 1);
    editor.on('transaction', handler);
    return () => { editor.off('transaction', handler); };
  }, [editor]);

  const addLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL:', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  // Get current font size from selection
  const currentFontSize = editor.getAttributes('textStyle').fontSize || '';

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault();
    const size = e.target.value;
    if (!size) {
      (editor.chain().focus() as any).unsetFontSize().run();
    } else {
      (editor.chain().focus() as any).setFontSize(size).run();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50/50 px-3 py-2">
      <ToolbarBtn title="Bold" onAction={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}>
        <Bold size={16} />
      </ToolbarBtn>
      <ToolbarBtn title="Italic" onAction={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}>
        <Italic size={16} />
      </ToolbarBtn>

      <Divider />

      {/* Font Size Dropdown */}
      <div className="flex items-center gap-1" title="Ukuran Font">
        <CaseSensitive size={15} className="text-gray-500 shrink-0" />
        <select
          tabIndex={-1}
          value={currentFontSize}
          onMouseDown={(e) => e.stopPropagation()}
          onChange={handleFontSizeChange}
          className="h-7 rounded border border-gray-200 bg-white px-1.5 text-xs text-gray-700 outline-none hover:border-gray-300 focus:border-zinc-900 cursor-pointer"
        >
          <option value="">— Ukuran —</option>
          {FONT_SIZES.map((fs) => (
            <option key={fs.value} value={fs.value}>
              {fs.label} ({fs.value}px)
            </option>
          ))}
        </select>
      </div>

      <Divider />

      <ToolbarBtn title="Heading 1" onAction={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })}>
        <Heading1 size={16} />
      </ToolbarBtn>
      <ToolbarBtn title="Heading 2" onAction={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })}>
        <Heading2 size={16} />
      </ToolbarBtn>

      <Divider />

      <ToolbarBtn title="Bullet List" onAction={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}>
        <List size={16} />
      </ToolbarBtn>
      <ToolbarBtn title="Ordered List" onAction={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}>
        <ListOrdered size={16} />
      </ToolbarBtn>
      <ToolbarBtn title="Blockquote" onAction={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')}>
        <Quote size={16} />
      </ToolbarBtn>
      <ToolbarBtn title="Horizontal Rule" onAction={() => editor.chain().focus().setHorizontalRule().run()}>
        <Minus size={16} />
      </ToolbarBtn>

      <Divider />

      <ToolbarBtn title="Link" onAction={addLink} active={editor.isActive('link')}>
        <LinkIcon size={16} />
      </ToolbarBtn>

      <Divider />

      <ToolbarBtn title="Undo" onAction={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
        <Undo size={16} />
      </ToolbarBtn>
      <ToolbarBtn title="Redo" onAction={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
        <Redo size={16} />
      </ToolbarBtn>
    </div>
  );
}

/* ──────────────────── Rich Text Editor ──────────────────── */

export default function RichTextEditor({
  label,
  hint,
  error,
  value = '',
  onChange,
  className,
}: RichTextEditorProps) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const isUpdatingFromEditor = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-zinc-900 underline' },
      }),
      TextStyle,
      FontSize,
    ],
    content: value,
    immediatelyRender: true,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        class: 'tiptap-editor focus:outline-none min-h-[180px] px-4 py-4',
      },
    },
    onUpdate: ({ editor: e }) => {
      isUpdatingFromEditor.current = true;
      onChangeRef.current?.(e.getHTML());
    },
  });

  useEffect(() => {
    if (isUpdatingFromEditor.current) {
      isUpdatingFromEditor.current = false;
      return;
    }
    if (editor && !editor.isDestroyed && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-gray-700">{label}</label>
      </div>
      <div
        className={cn(
          'overflow-hidden rounded-lg border bg-white shadow-sm transition-colors',
          error ? 'border-red-500' : 'border-gray-200 focus-within:border-zinc-900',
          className,
        )}
      >
        {editor ? <MenuBar editor={editor} /> : null}
        <EditorContent editor={editor} className="bg-white" />
      </div>
      {hint && !error ? <p className="text-xs text-gray-500">{hint}</p> : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
