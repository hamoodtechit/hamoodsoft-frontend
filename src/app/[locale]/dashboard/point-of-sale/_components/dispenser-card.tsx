"use client"

import { usePOS } from "./pos-provider"
import { cn } from "@/lib/utils"
import { getRandomGradient } from "@/lib/utils/aesthetics"
import { Check, Droplets } from "lucide-react"
import type { Dispenser } from "@/types"

interface DispenserCardProps {
  dispenser: Dispenser
}

export function DispenserCard({ dispenser }: DispenserCardProps) {
  const { handleDispenserClick, cart } = usePOS()

  const tanker = dispenser.tanker
  const fuelType = tanker?.fuelType
  const inCart = cart.some((item) => item.dispenserId === dispenser.id)
  const fuelLevel = tanker && tanker.capacity ? Math.min(100, Math.max(0, (tanker.currentFuel / tanker.capacity) * 100)) : 0

  return (
    <button
      onClick={() => handleDispenserClick(dispenser)}
      className={cn(
        "w-full flex items-center justify-between gap-3 sm:gap-4 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-lg border transition-all text-left group overflow-hidden relative",
        "hover:shadow-sm hover:brightness-95 dark:hover:brightness-110",
        "active:scale-[0.99]",
        inCart ? "border-primary/50 shadow-xs ring-1 ring-primary/30 bg-primary/[0.05]" : "border-border/60"
      )}
      style={!inCart && fuelType?.color ? { backgroundColor: `${fuelType.color}40`, borderColor: `${fuelType.color}80` } : undefined}
    >
      {/* Left: Icon & Name */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div 
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex-shrink-0 border flex items-center justify-center shadow-2xs transition-transform group-hover:scale-105"
          style={fuelType?.color ? { backgroundColor: `${fuelType.color}80`, borderColor: fuelType.color } : { backgroundColor: 'var(--muted)', borderColor: 'var(--border)' }}
        >
          <Droplets className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: fuelType?.color || 'currentColor' }} />
        </div>
        <div className="min-w-0 flex-1 flex flex-wrap sm:flex-nowrap items-center gap-1.5 sm:gap-2">
          <span className="font-bold text-xs sm:text-base truncate text-foreground">
            {dispenser.name}
          </span>
          {tanker && (
            <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground bg-secondary/80 px-1.5 sm:px-2 py-0.5 rounded shrink-0">
              {tanker.name}
            </span>
          )}
          {inCart && (
            <span className="inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-primary text-primary-foreground text-[10px] sm:text-xs font-bold shadow-2xs shrink-0">
              ✓
            </span>
          )}
        </div>
      </div>

      {/* Middle: Tanker Fuel Level indicator */}
      <div className="hidden md:flex flex-col items-end justify-center w-44 lg:w-52 px-2">
        <div className="flex justify-between w-full text-xs font-semibold mb-1">
          <span className="text-muted-foreground">Level</span>
          <span className={cn(fuelLevel < 20 ? "text-destructive font-bold" : "text-foreground font-semibold")}>
            {tanker?.currentFuel || 0}L <span className="text-muted-foreground font-normal">/ {tanker?.capacity || 0}L</span>
          </span>
        </div>
        <div className="w-full h-2 bg-secondary/80 rounded-full overflow-hidden border border-border/40">
          <div
            className={cn("h-full transition-all duration-500 rounded-full", fuelLevel < 20 ? "bg-destructive" : "bg-primary")}
            style={{ width: `${fuelLevel}%` }}
          />
        </div>
      </div>

      {/* Right: Price & Action */}
      <div className="flex items-center gap-3 sm:gap-4 text-right flex-shrink-0 pl-2 sm:pl-3 border-l border-border/40">
        <div className="font-black text-base sm:text-lg text-primary leading-none whitespace-nowrap">
          {fuelType?.price !== undefined ? `${fuelType.price.toFixed(2)}` : '0.00'} <span className="text-xs font-normal text-muted-foreground">/ L</span>
        </div>
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-2xs",
          inCart ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground"
        )}>
          <span className="text-base font-bold leading-none">+</span>
        </div>
      </div>
    </button>
  )
}
