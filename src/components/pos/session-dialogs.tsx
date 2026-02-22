"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { NumericInput } from "@/components/ui/numeric-input"
import { Textarea } from "@/components/ui/textarea"
import { useClosePOSSession, useOpenPOSSession } from "@/lib/hooks/use-pos-sessions"
import { LogIn, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface OpenSessionDialogProps {
  open: boolean
  branchId: string
  onOpenSuccess: () => void
}

export function OpenSessionDialog({ open, branchId, onOpenSuccess }: OpenSessionDialogProps) {
  const router = useRouter()
  const [openingBalance, setOpeningBalance] = useState(0)
  const [openingNote, setOpeningNote] = useState("")
  const openMutation = useOpenPOSSession()

  const handleOpen = () => {
    openMutation.mutate({
      branchId,
      openingBalance,
      openingNote,
    }, {
      onSuccess: () => {
        onOpenSuccess()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[425px]" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogIn className="h-5 w-5 text-primary" />
            Open POS Session
          </DialogTitle>
          <DialogDescription>
            Enter the starting cash balance for this session.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="openingBalance">Opening Balance</Label>
            <NumericInput
              id="openingBalance"
              value={openingBalance}
              onValueChange={setOpeningBalance}
              placeholder="0.00"
              autoFocus
              onFocus={(e) => e.target.select()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="openingNote">Opening Note (Optional)</Label>
            <Textarea
              id="openingNote"
              placeholder="Enter any notes..."
              value={openingNote}
              onChange={(e) => setOpeningNote(e.target.value)}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline"
            className="flex-1"
            onClick={() => router.push("/dashboard")}
          >
            Exit to Dashboard
          </Button>
          <Button 
            className="flex-1" 
            onClick={handleOpen}
            disabled={openMutation.isPending}
          >
            {openMutation.isPending ? "Opening..." : "Start Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface CloseSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  branchId: string
  expectedBalance: number
  onCloseSuccess: () => void
}

export function CloseSessionDialog({ open, onOpenChange, branchId, expectedBalance, onCloseSuccess }: CloseSessionDialogProps) {
  const [actualBalance, setActualBalance] = useState(expectedBalance)
  const [closingNote, setClosingNote] = useState("")
  const closeMutation = useClosePOSSession()

  const handleClose = () => {
    closeMutation.mutate({
      branchId,
      actualBalance,
      closingNote,
    }, {
      onSuccess: () => {
        onCloseSuccess()
        onOpenChange(false)
      }
    })
  }

  const difference = actualBalance - expectedBalance

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5 text-destructive" />
            Close POS Session
          </DialogTitle>
          <DialogDescription>
            Review and enter the final cash balance.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="p-3 bg-muted rounded-lg border flex items-center justify-between">
            <div className="text-sm font-medium">Expected Balance</div>
            <div className="text-lg font-black text-primary">{expectedBalance.toFixed(2)}</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="actualBalance">Actual Cash in Drawer</Label>
            <NumericInput
              id="actualBalance"
              value={actualBalance}
              onValueChange={setActualBalance}
              placeholder="0.00"
              autoFocus
              onFocus={(e) => e.target.select()}
            />
          </div>

          <div className="p-3 rounded-lg border flex items-center justify-between text-sm">
            <div className="font-medium">Difference</div>
            <div className={`font-bold ${difference === 0 ? "text-green-600" : difference > 0 ? "text-primary" : "text-destructive"}`}>
              {difference > 0 ? "+" : ""}{difference.toFixed(2)}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="closingNote">Closing Note (Optional)</Label>
            <Textarea
              id="closingNote"
              placeholder="Enter any notes..."
              value={closingNote}
              onChange={(e) => setClosingNote(e.target.value)}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={closeMutation.isPending}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive"
            onClick={handleClose}
            disabled={closeMutation.isPending}
          >
            {closeMutation.isPending ? "Closing..." : "Close Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
