"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface SortableProductWrapperProps {
  id: string
  children: ReactNode
}

export function SortableProductWrapper({ id, children }: SortableProductWrapperProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "relative cursor-grab active:cursor-grabbing",
        isDragging && "z-50 opacity-50 shadow-xl ring-2 ring-primary rounded-xl"
      )}
    >
      {/* We use pointer-events-none on the wrapper if we want dragging from anywhere, 
          but usually the product card itself has click handlers. 
          To allow both clicking the card and dragging it, dnd-kit handles click vs drag automatically. */}
      {children}
    </div>
  )
}
