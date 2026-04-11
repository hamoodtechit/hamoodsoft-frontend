"use client"

import { usePOS } from "./pos-provider"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function CalculatorDialog() {
  const {
    showCalculator, setShowCalculator,
    calculatorValue, calculatorDisplay,
    handleCalculatorInput,
  } = usePOS()

  return (
    <Dialog open={showCalculator} onOpenChange={setShowCalculator}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>Calculator</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <div className="p-3 border rounded-lg bg-muted text-right">
            <div className="text-xs text-muted-foreground min-h-[16px]">{calculatorDisplay}</div>
            <div className="text-2xl font-bold">{calculatorValue}</div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {["C", "/", "*", "-"].map((op) => (
              <Button key={op} variant="outline" onClick={() => handleCalculatorInput(op)}>
                {op}
              </Button>
            ))}
            {["7", "8", "9", "+"].map((num) => (
              <Button key={num} variant="outline" onClick={() => handleCalculatorInput(num)}>
                {num}
              </Button>
            ))}
            {["4", "5", "6", "="].map((num) => (
              <Button key={num} variant="outline" onClick={() => handleCalculatorInput(num)}>
                {num}
              </Button>
            ))}
            {["1", "2", "3"].map((num) => (
              <Button key={num} variant="outline" onClick={() => handleCalculatorInput(num)}>
                {num}
              </Button>
            ))}
            <Button
              variant="outline"
              className="col-span-2"
              onClick={() => handleCalculatorInput("0")}
            >
              0
            </Button>
            <Button variant="outline" onClick={() => handleCalculatorInput(".")}>
              .
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
