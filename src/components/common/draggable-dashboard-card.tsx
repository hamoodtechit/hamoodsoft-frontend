"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"
import { Pin } from "lucide-react"

interface DraggableDashboardCardProps {
  id: string
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  onClick: () => void
  isDragging?: boolean
  isPinned?: boolean
  onPin?: (e: React.MouseEvent) => void
}

export function DraggableDashboardCard({
  id,
  title,
  icon: Icon,
  color,
  bgColor,
  onClick,
  isPinned,
  onPin,
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
    transform: CSS.Translate.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-col items-center gap-3 cursor-pointer group w-24 relative touch-none select-none transition-opacity duration-200",
        isDragging ? "z-50 cursor-grabbing opacity-50" : "opacity-100"
      )}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >

      <div
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 relative",
          "group-hover:-translate-y-1.5 group-hover:shadow-md shadow-sm border border-slate-200 dark:border-slate-700",
          bgColor
        )}
      >
        <Icon className={cn("w-6 h-6 stroke-2 transition-transform duration-300 group-hover:scale-110", color)} />
        {onPin && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onPin}
            className={cn(
              "absolute -top-1 -right-1 p-1.5 rounded-full z-10 transition-all duration-200",
              "bg-white dark:bg-slate-800 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.15)] border border-slate-200 dark:border-slate-700",
              isPinned ? "text-amber-500 opacity-100 scale-100" : "text-slate-400 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100",
              "hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
            )}
            title={isPinned ? "Remove from Favourites" : "Add to Favourites"}
          >
            <Pin className={cn("h-3.5 w-3.5", isPinned && "fill-current")} />
          </button>
        )}
      </div>
      <span className="text-sm text-slate-500 dark:text-slate-400 font-medium text-center leading-tight group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
        {title}
      </span>
    </div>
  )
}
