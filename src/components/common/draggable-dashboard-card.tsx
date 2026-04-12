"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"
import { GripVertical } from "lucide-react"

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
        "flex flex-col items-center gap-3 cursor-pointer group w-24 relative",
        isDragging && "z-50 cursor-grabbing"
      )}
      onClick={onClick}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className={cn(
          "absolute -top-1 -right-1 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10",
          "hover:bg-slate-200/50 active:bg-slate-300/50 dark:hover:bg-slate-700/50",
          "focus:opacity-100 focus:outline-none"
        )}
        onClick={(e) => {
          e.stopPropagation()
        }}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4 text-slate-400" />
      </button>

      <div
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300",
          "group-hover:-translate-y-1.5 group-hover:shadow-md shadow-sm border border-white/50 dark:border-slate-700",
          bgColor
        )}
      >
        <Icon className={cn("w-6 h-6 stroke-2 transition-transform duration-300 group-hover:scale-110", color)} />
      </div>
      <span className="text-sm text-slate-500 dark:text-slate-400 font-medium text-center leading-tight group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
        {title}
      </span>
    </div>
  )
}
