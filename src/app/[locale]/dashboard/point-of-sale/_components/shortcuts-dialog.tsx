"use client"

import { usePOS } from "./pos-provider"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { HelpCircle } from "lucide-react"

export function ShortcutsDialog() {
  const { showShortcutsHelp, setShowShortcutsHelp } = usePOS()

  return (
    <Dialog open={showShortcutsHelp} onOpenChange={setShowShortcutsHelp}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Quick actions for faster checkout
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          {[
            { key: "F1", label: "Focus Search" },
            { key: "F2", label: "Checkout / Save" },
            { key: "F3", label: "Toggle View Mode" },
            { key: "F4", label: "Clear Cart" },
            { key: "/", label: "Focus Barcode" },
            { key: "?", label: "Show this help" },
            { key: "ESC", label: "Close Dialogs" },
          ].map((s) => (
            <div key={s.key} className="flex items-center justify-between p-2 border rounded-lg bg-muted/30">
              <span className="text-xs font-bold text-muted-foreground">{s.label}</span>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={() => setShowShortcutsHelp(false)} className="w-full">
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
