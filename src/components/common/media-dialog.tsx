"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useDeleteMedia, useMedia, useUploadMedia } from "@/lib/hooks/use-media"
import { Media } from "@/types"
import {
    Check,
    Download,
    Image as ImageIcon,
    Loader2,
    Search,
    Trash2,
    Upload
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useCallback, useEffect, useRef, useState } from "react"

interface MediaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect?: (media: Media | Media[]) => void
  multiple?: boolean
  type?: "image" | "document" | "all"
}

export function MediaDialog({
  open,
  onOpenChange,
  onSelect,
  multiple = false,
  type = "all",
}: MediaDialogProps) {
  const t = useTranslations("media")
  const tCommon = useTranslations("common")
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState<"image" | "document" | "all">(type)
  const [selectedMedia, setSelectedMedia] = useState<Set<string>>(new Set())
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounterRef = useRef(0)
  const [isDragging, setIsDragging] = useState(false)

  const { data: mediaData, isLoading } = useMedia({
    search: search.trim() || undefined,
    type: filterType !== "all" ? filterType : undefined,
    page: 1,
    limit: 50,
  })

  const uploadMediaMutation = useUploadMedia()
  const deleteMediaMutation = useDeleteMedia()

  const mediaItems = mediaData?.items || []

  // Reset selection when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedMedia(new Set())
      setSearch("")
    }
  }, [open])

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return

      setUploading(true)
      try {
        const uploadPromises = Array.from(files).map((file) =>
          uploadMediaMutation.mutateAsync({
            file,
            name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension for name
          })
        )
        await Promise.all(uploadPromises)
      } catch (error) {
        console.error("Upload error:", error)
      } finally {
        setUploading(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      }
    },
    [uploadMediaMutation]
  )

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      dragCounterRef.current = 0

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileSelect(e.dataTransfer.files)
      }
    },
    [handleFileSelect]
  )

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFileSelect(e.target.files)
    },
    [handleFileSelect]
  )

  const toggleSelection = (mediaId: string) => {
    const newSelected = new Set(selectedMedia)
    if (newSelected.has(mediaId)) {
      newSelected.delete(mediaId)
    } else {
      if (!multiple && newSelected.size > 0) {
        newSelected.clear()
      }
      newSelected.add(mediaId)
    }
    setSelectedMedia(newSelected)
  }

  const handleInsert = () => {
    if (selectedMedia.size === 0) return

    const selected = mediaItems.filter((m) => selectedMedia.has(m.id))
    if (onSelect) {
      onSelect(multiple ? selected : selected[0])
    }
    onOpenChange(false)
  }

  const handleDelete = async (mediaId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(tCommon("delete") + "?")) {
      await deleteMediaMutation.mutateAsync(mediaId)
      setSelectedMedia((prev) => {
        const next = new Set(prev)
        next.delete(mediaId)
        return next
      })
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  const selectedCount = selectedMedia.size

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{t("title")}</DialogTitle>
              <DialogDescription>{t("selectMedia")}</DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {selectedCount > 0 && (
                <span className="text-sm text-muted-foreground">
                  {selectedCount} {t("selected")}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {t("upload")}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Search and Filter Bar */}
          <div className="px-6 py-4 border-b flex-shrink-0 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allTypes")}</SelectItem>
                <SelectItem value="image">{t("images")}</SelectItem>
                <SelectItem value="document">{t("documents")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Upload Area */}
          <div
            className={`mx-6 mt-4 mb-2 flex-shrink-0 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            }`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm font-medium mb-2">{t("dragDrop")}</p>
            <p className="text-xs text-muted-foreground mb-4">
              {t("or")} <span className="text-primary">{t("browse")}</span>
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileInputChange}
              accept={filterType === "image" ? "image/*" : filterType === "document" ? "application/*" : undefined}
            />
            {uploading && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("uploading") || "Uploading..."}
              </div>
            )}
          </div>

          {/* Media Grid */}
          <ScrollArea className="flex-1 px-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : mediaItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t("noMedia")}</h3>
                <p className="text-muted-foreground mb-4">{t("noMediaDescription")}</p>
                <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  {t("upload")}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-4">
                {mediaItems.map((media) => {
                  const isSelected = selectedMedia.has(media.id)
                  return (
                    <Card
                      key={media.id}
                      className={`relative cursor-pointer transition-all hover:shadow-md ${
                        isSelected ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => toggleSelection(media.id)}
                    >
                      <CardContent className="p-2">
                        {media.type === "image" ? (
                          <div className="relative aspect-square rounded-md overflow-hidden bg-muted">
                            <img
                              src={media.secureUrl || media.url}
                              alt={media.name}
                              className="w-full h-full object-cover"
                            />
                            {isSelected && (
                              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                <div className="bg-primary text-primary-foreground rounded-full p-1">
                                  <Check className="h-4 w-4" />
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="aspect-square rounded-md bg-muted flex items-center justify-center">
                            <div className="text-center">
                              <Download className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground truncate px-2">
                                {media.format.toUpperCase()}
                              </p>
                            </div>
                            {isSelected && (
                              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                <div className="bg-primary text-primary-foreground rounded-full p-1">
                                  <Check className="h-4 w-4" />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="mt-2 px-1">
                          <p className="text-xs font-medium truncate">{media.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(media.bytes)}
                            {media.width && media.height && ` • ${media.width}×${media.height}`}
                          </p>
                        </div>
                        <div className="absolute top-2 right-2 flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 bg-background/80 hover:bg-background"
                            onClick={(e) => handleDelete(media.id, e)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter className="px-6 py-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon("cancel")}
          </Button>
          <Button onClick={handleInsert} disabled={selectedCount === 0}>
            {multiple && selectedCount > 1
              ? `${t("insert")} (${selectedCount})`
              : t("insert")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
