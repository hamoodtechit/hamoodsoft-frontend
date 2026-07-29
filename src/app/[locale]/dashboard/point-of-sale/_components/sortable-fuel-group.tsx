"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface SortableFuelGroupProps {
  id: string
  children: ReactNode
}

export function SortableFuelGroup({ id, children }: SortableFuelGroupProps) {
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
      className={cn(
        "relative rounded-xl overflow-hidden bg-background",
        isDragging && "z-50 opacity-50 shadow-xl ring-2 ring-primary",
        !isDragging && "border border-border/80 shadow-2xs"
      )}
    >
      <div 
        {...attributes} 
        {...listeners} 
        className="absolute top-2.5 right-2 p-1.5 cursor-grab active:cursor-grabbing hover:bg-muted rounded-md z-10 transition-colors"
        title="Drag to reorder"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      {children}
    </div>
  )
}
