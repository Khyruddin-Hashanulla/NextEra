import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Code,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function RichTextEditor({ value, onChange, placeholder, minHeight = '200px' }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Placeholder.configure({ placeholder: placeholder || 'Write your content here…' }),
      Link.configure({ openOnClick: false }),
      Image,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return null;

  const btn = (active: boolean, onClick: () => void, label: string, icon: React.ReactNode) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`rounded p-1.5 transition-colors hover:bg-accent ${active ? 'bg-accent text-primary' : 'text-muted-foreground'}`}
    >
      {icon}
    </button>
  );

  const addLink = () => {
    const url = window.prompt('Enter URL');
    if (url) editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="rounded-lg border border-input">
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/30 px-2 py-1.5">
        {btn(
          editor.isActive('heading', { level: 1 }),
          () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
          'Heading 1',
          <Heading1 className="h-4 w-4" />
        )}
        {btn(
          editor.isActive('heading', { level: 2 }),
          () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          'Heading 2',
          <Heading2 className="h-4 w-4" />
        )}
        {btn(
          editor.isActive('bold'),
          () => editor.chain().focus().toggleBold().run(),
          'Bold',
          <Bold className="h-4 w-4" />
        )}
        {btn(
          editor.isActive('italic'),
          () => editor.chain().focus().toggleItalic().run(),
          'Italic',
          <Italic className="h-4 w-4" />
        )}
        {btn(
          editor.isActive('underline'),
          () => editor.chain().focus().toggleUnderline().run(),
          'Underline',
          <UnderlineIcon className="h-4 w-4" />
        )}
        {btn(
          editor.isActive('strike'),
          () => editor.chain().focus().toggleStrike().run(),
          'Strikethrough',
          <Strikethrough className="h-4 w-4" />
        )}
        <span className="mx-1 h-5 w-px bg-border" />
        {btn(
          editor.isActive('bulletList'),
          () => editor.chain().focus().toggleBulletList().run(),
          'Bullet list',
          <List className="h-4 w-4" />
        )}
        {btn(
          editor.isActive('orderedList'),
          () => editor.chain().focus().toggleOrderedList().run(),
          'Numbered list',
          <ListOrdered className="h-4 w-4" />
        )}
        {btn(
          editor.isActive('blockquote'),
          () => editor.chain().focus().toggleBlockquote().run(),
          'Quote',
          <Quote className="h-4 w-4" />
        )}
        {btn(
          editor.isActive('codeBlock'),
          () => editor.chain().focus().toggleCodeBlock().run(),
          'Code block',
          <Code className="h-4 w-4" />
        )}
        {btn(editor.isActive('link'), addLink, 'Link', <LinkIcon className="h-4 w-4" />)}
        <span className="mx-1 h-5 w-px bg-border" />
        {btn(
          editor.isActive({ textAlign: 'left' }),
          () => editor.chain().focus().setTextAlign('left').run(),
          'Align left',
          <AlignLeft className="h-4 w-4" />
        )}
        {btn(
          editor.isActive({ textAlign: 'center' }),
          () => editor.chain().focus().setTextAlign('center').run(),
          'Align center',
          <AlignCenter className="h-4 w-4" />
        )}
        {btn(
          editor.isActive({ textAlign: 'right' }),
          () => editor.chain().focus().setTextAlign('right').run(),
          'Align right',
          <AlignRight className="h-4 w-4" />
        )}
        <span className="mx-1 h-5 w-px bg-border" />
        {btn(false, () => editor.chain().focus().undo().run(), 'Undo', <Undo className="h-4 w-4" />)}
        {btn(false, () => editor.chain().focus().redo().run(), 'Redo', <Redo className="h-4 w-4" />)}
      </div>
      <div className="tiptap" style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
