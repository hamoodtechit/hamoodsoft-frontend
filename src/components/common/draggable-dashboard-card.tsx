"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"
import { GripVertical } from "lucide-react"
import { useState } from "react"

interface DraggableDashboardCardProps {
  id: string
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  onClick: () => void
  isDragging?: boolean
}

export function DraggableDashboardCard({
  id,
  title,
  href,
  icon: Icon,
  color,
  bgColor,
  onClick,
}: DraggableDashboardCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const [isHovered, setIsHovered] = useState(false)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex flex-col items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border-2 border-transparent px-1.5 py-2 sm:px-2 sm:py-3 md:px-3 md:py-4 transition-all duration-300",
        "hover:scale-105 hover:shadow-lg hover:shadow-primary/10",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
        "active:scale-95",
        bgColor,
        isDragging && "z-50 cursor-grabbing",
        !isDragging && "cursor-pointer"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className={cn(
          "absolute top-1 right-1 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200",
          "hover:bg-background/50 active:bg-background/70",
          "focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary"
        )}
        onClick={(e) => {
          e.stopPropagation()
        }}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
      </button>

      {/* Icon Container */}
      <div
        className={cn(
          "flex h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 items-center justify-center rounded-full transition-all duration-300",
          "group-hover:scale-110 group-hover:rotate-3",
          bgColor,
          "border-2 border-current/20 group-hover:border-current/40"
        )}
      >
        <Icon className={cn("h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 transition-transform duration-300", color)} />
      </div>

      {/* Title */}
      <span className="text-xs font-medium text-foreground text-center px-1 leading-tight transition-colors duration-200">
        {title}
      </span>

      {/* Hover Effect Overlay */}
      {isHovered && (
        <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-primary/5 pointer-events-none animate-in fade-in duration-200" />
      )}
    </div>
  )
}
