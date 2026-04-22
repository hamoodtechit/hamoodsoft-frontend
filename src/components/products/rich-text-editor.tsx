"use client"

import { cn } from "@/lib/utils"
import Link from "@tiptap/extension-link"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { useEffect } from "react"

interface RichTextEditorProps {
  field: { value: string | undefined; onChange: (value: string) => void }
  isLoading: boolean
}

export function RichTextEditor({ field, isLoading }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: field.value || "",
    editable: !isLoading,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      field.onChange(editor.getHTML())
    },
  })

  useEffect(() => {
    if (editor && field.value !== editor.getHTML()) {
      editor.commands.setContent(field.value || "")
    }
  }, [field.value, editor])

  if (!editor) {
    return null
  }

  return (
    <div className="border rounded-md min-h-[200px]">
      <div className="border-b p-2 flex gap-1 flex-wrap">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "px-2 py-1 rounded text-sm hover:bg-muted",
            editor.isActive("bold") && "bg-muted"
          )}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            "px-2 py-1 rounded text-sm hover:bg-muted",
            editor.isActive("italic") && "bg-muted"
          )}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={cn(
            "px-2 py-1 rounded text-sm hover:bg-muted",
            editor.isActive("strike") && "bg-muted"
          )}
        >
          <s>S</s>
        </button>
        <div className="w-px bg-border mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn(
            "px-2 py-1 rounded text-sm hover:bg-muted",
            editor.isActive("heading", { level: 1 }) && "bg-muted"
          )}
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(
            "px-2 py-1 rounded text-sm hover:bg-muted",
            editor.isActive("heading", { level: 2 }) && "bg-muted"
          )}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={cn(
            "px-2 py-1 rounded text-sm hover:bg-muted",
            editor.isActive("heading", { level: 3 }) && "bg-muted"
          )}
        >
          H3
        </button>
        <div className="w-px bg-border mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            "px-2 py-1 rounded text-sm hover:bg-muted",
            editor.isActive("bulletList") && "bg-muted"
          )}
        >
          •
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            "px-2 py-1 rounded text-sm hover:bg-muted",
            editor.isActive("orderedList") && "bg-muted"
          )}
        >
          1.
        </button>
        <div className="w-px bg-border mx-1" />
        <button
          type="button"
          onClick={() => {
            const url = window.prompt("Enter URL:")
            if (url) {
              editor.chain().focus().setLink({ href: url }).run()
            }
          }}
          className={cn(
            "px-2 py-1 rounded text-sm hover:bg-muted",
            editor.isActive("link") && "bg-muted"
          )}
        >
          Link
        </button>
      </div>
      <EditorContent editor={editor} className="prose prose-sm max-w-none p-4 min-h-[200px] [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[200px] [&_.ProseMirror]:placeholder:text-muted-foreground" />
    </div>
  )
}
