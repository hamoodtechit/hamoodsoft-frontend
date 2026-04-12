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
  const { handleDispenserClick, cart, productViewMode } = usePOS()

  const tanker = dispenser.tanker
  const fuelType = tanker?.fuelType
  const inCart = cart.some((item) => item.dispenserId === dispenser.id)
  const fuelLevel = tanker ? (tanker.currentFuel / tanker.capacity) * 100 : 0

  if (productViewMode === "list") {
    return (
      <button
        onClick={() => handleDispenserClick(dispenser)}
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
          "bg-gradient-to-br", getRandomGradient(dispenser.id, 'subtle'),
          "hover:border-primary/50 hover:bg-primary/5",
          inCart && "border-primary/30 ring-1 ring-primary/20"
        )}
      >
        <div className={cn(
          "w-10 h-10 rounded flex-shrink-0 border flex overflow-hidden bg-gradient-to-br",
          getRandomGradient(dispenser.id, 'vibrant')
        )}>
          <Droplets className="h-6 w-6 m-auto text-primary" />
        </div>
        <div className="flex-1 text-left">
          <div className="font-bold text-sm truncate">{dispenser.name}</div>
          <div className="text-xs text-muted-foreground">{fuelType?.name || 'Loading...'}</div>
        </div>
        <div className="text-right">
          <div className="font-black text-primary">{fuelType?.price.toFixed(2)}</div>
          <div className="text-[10px] text-muted-foreground">per Liter</div>
        </div>
        <div className="ml-4 w-24">
          <div className="text-[10px] mb-1">Level: {tanker?.currentFuel || 0}L</div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn("h-full", fuelLevel < 20 ? "bg-destructive" : "bg-primary")}
              style={{ width: `${fuelLevel}%` }}
            />
          </div>
        </div>
      </button>
    )
  }

  return (
    <button
      onClick={() => handleDispenserClick(dispenser)}
      className={cn(
        "group relative border-2 rounded-xl overflow-hidden p-4",
        "bg-gradient-to-br", getRandomGradient(dispenser.id, 'subtle'),
        "transition-all duration-200 ease-in-out",
        "hover:shadow-lg hover:shadow-primary/10 hover:border-primary/50",
        "active:scale-[0.98]",
        "flex flex-col h-full",
        inCart && "border-primary/40 shadow-md shadow-primary/5"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={cn(
          "h-10 w-10 flex items-center justify-center rounded-lg bg-gradient-to-br text-primary",
          getRandomGradient(dispenser.id, 'vibrant')
        )}>
          <Droplets className="h-6 w-6" />
        </div>
        {inCart && (
          <div className="rounded-full bg-primary text-primary-foreground p-1 shadow-md">
            <Check className="h-3 w-3" />
          </div>
        )}
      </div>

      <div className="text-left flex-1">
        <h3 className="font-bold text-sm truncate mb-1">{dispenser.name}</h3>
        <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider font-semibold">
          {fuelType?.name || 'Loading...'}
        </p>

        <div className="flex items-end justify-between mt-auto">
          <div>
            <div className="text-lg font-black text-primary">{fuelType?.price.toFixed(2)}</div>
            <div className="text-[10px] text-muted-foreground">Price/Liter</div>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold">{tanker?.currentFuel || 0}L</div>
            <div className="text-[10px] text-muted-foreground">Current Level</div>
          </div>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-3">
          <div
            className={cn("h-full", fuelLevel < 20 ? "bg-destructive" : "bg-primary")}
            style={{ width: `${fuelLevel}%` }}
          />
        </div>
      </div>
    </button>
  )
}
