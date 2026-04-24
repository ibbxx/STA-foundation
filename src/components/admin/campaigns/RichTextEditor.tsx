import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
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
  Image as ImageIcon,
  Minus,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useCallback, useEffect, useRef, useState } from 'react';

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
        // Critical: prevent the button from stealing focus from the editor.
        // Without this, the selection inside the editor is lost before
        // the onClick handler runs, so formatting commands have nothing to apply.
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
  // Force re-render on every transaction so active states update
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

  const addImage = () => {
    const url = window.prompt('Image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const uploadImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          editor.chain().focus().setImage({ src: result }).run();
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
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
      <ToolbarBtn title="Image URL" onAction={addImage}>
        <ImageIcon size={16} />
      </ToolbarBtn>
      <ToolbarBtn title="Upload Image" onAction={uploadImage}>
        <span className="text-[10px] font-bold">📎</span>
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
  // Stable ref for onChange to prevent editor re-creation
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Guard: skip external sync when the change originated from editor itself
  const isUpdatingFromEditor = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-emerald-600 underline' },
      }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: { class: 'rounded-lg max-w-full cursor-pointer' },
      }),
    ],
    content: value,
    // Tiptap v3: render synchronously for immediate availability
    immediatelyRender: true,
    // Tiptap v3: we handle re-renders ourselves via the transaction listener in MenuBar
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        class: 'tiptap-editor focus:outline-none min-h-[220px] px-4 py-4',
      },
    },
    onUpdate: ({ editor: e }) => {
      isUpdatingFromEditor.current = true;
      onChangeRef.current?.(e.getHTML());
    },
  });

  // External sync: only when value changes from outside (form reset, campaign switch)
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
          error ? 'border-red-500' : 'border-gray-200 focus-within:border-emerald-500',
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
