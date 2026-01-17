"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Command, Search } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

interface SearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const t = useTranslations("common")
  const [searchQuery, setSearchQuery] = useState("")

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      // Small delay to ensure dialog is fully rendered
      setTimeout(() => {
        const input = document.querySelector<HTMLInputElement>('[data-search-input]')
        if (input) {
          input.focus()
        }
      }, 100)
    } else {
      setSearchQuery("")
    }
  }, [open])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        onOpenChange(true)
      }
      // Escape to close
      if (e.key === "Escape" && open) {
        onOpenChange(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, onOpenChange])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement search functionality
  
    // For now, just close the modal
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Search</DialogTitle>
          <DialogDescription>Search across your application</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSearch} className="w-full">
          <div className="flex items-center border-b px-4 py-2">
            <Search className="h-5 w-5 text-muted-foreground mr-3 flex-shrink-0" />
            <Input
              data-search-input
              type="search"
              placeholder="Search... (Press Cmd+K to open)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-12 text-base"
              autoFocus
            />
            <div className="hidden sm:flex items-center gap-1 ml-4 px-2 py-1 rounded border bg-muted text-xs text-muted-foreground">
              <Command className="h-3 w-3" />
              <span>K</span>
            </div>
          </div>
          <div className="p-6">
            {searchQuery ? (
              <div className="text-sm text-muted-foreground">
                Search results for &quot;{searchQuery}&quot; will appear here...
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-12">
                Start typing to search across your application
              </div>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
