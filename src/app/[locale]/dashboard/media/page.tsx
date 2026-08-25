"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { PageLayout } from "@/components/common/page-layout";
import { useMedia, useMediaFolders, useUploadMedia, useDeleteMedia } from "@/lib/hooks/use-media";
import { Media } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Folder,
  FolderPlus,
  Image as ImageIcon,
  FileText,
  FileSpreadsheet,
  File as FileIcon,
  Upload,
  Search,
  Grid,
  List,
  Copy,
  Download,
  Trash2,
  Eye,
  ExternalLink,
  MoreVertical,
  Loader2,
  HardDrive,
  Check,
  Plus,
} from "lucide-react";
import { DeleteConfirmationDialog } from "@/components/common/delete-confirmation-dialog";
import { toast } from "sonner";
import { Pagination } from "@/components/common/pagination";
import { SkeletonList } from "@/components/skeletons/skeleton-list";

// Helper for file sizes
function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

// Icon helper by file format / mime
function getFileIcon(media: Media) {
  const mime = (media.mimeType || "").toLowerCase();
  const format = (media.format || "").toLowerCase();

  if (media.type === "image" || mime.startsWith("image/")) {
    return <ImageIcon className="h-6 w-6 text-emerald-500" />;
  }
  if (mime.includes("pdf") || format === "pdf") {
    return <FileText className="h-6 w-6 text-red-500" />;
  }
  if (mime.includes("sheet") || mime.includes("excel") || mime.includes("csv") || format === "csv" || format === "xlsx") {
    return <FileSpreadsheet className="h-6 w-6 text-emerald-600" />;
  }
  return <FileIcon className="h-6 w-6 text-blue-500" />;
}

export default function MediaManagerPage() {
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [fileTypeFilter, setFileTypeFilter] = useState<"all" | "image" | "document">("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(24);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<Media | null>(null);
  const [mediaToDelete, setMediaToDelete] = useState<Media | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Upload Form state
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadFolderName, setUploadFolderName] = useState<string>("products");
  const [customFolderName, setCustomFolderName] = useState<string>("");
  const [uploadDisplayName, setUploadDisplayName] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data fetching
  const { data: foldersData, isLoading: isLoadingFolders } = useMediaFolders();
  const { data: mediaData, isLoading: isLoadingMedia } = useMedia({
    page,
    limit,
    search: search.trim() || undefined,
    type: fileTypeFilter !== "all" ? fileTypeFilter : undefined,
    folder: selectedFolder !== "all" ? selectedFolder : undefined,
  });

  const uploadMutation = useUploadMedia();
  const deleteMutation = useDeleteMedia();

  const items = mediaData?.items || [];
  const meta = mediaData?.meta;
  const total = meta?.total || items.length;
  const totalPages = meta?.totalPages || Math.max(1, Math.ceil(total / limit));

  const folders = useMemo(() => {
    return foldersData || [
      { id: "all", name: "All Files", slug: "all", count: total },
      { id: "products", name: "Product Images", slug: "products", count: 0 },
      { id: "documents", name: "Documents & Contracts", slug: "documents", count: 0 },
      { id: "invoices", name: "Invoices & Receipts", slug: "invoices", count: 0 },
      { id: "station", name: "Station & Assets", slug: "station", count: 0 },
      { id: "images", name: "General Images", slug: "images", count: 0 },
    ];
  }, [foldersData, total]);

  const handleCopyUrl = (media: Media) => {
    const url = media.secureUrl || media.url;
    navigator.clipboard.writeText(url);
    setCopiedId(media.id);
    toast.success("Direct link copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (media: Media) => {
    const url = media.secureUrl || media.url;
    const a = document.createElement("a");
    a.href = url;
    a.download = media.originalFilename || media.name || "download";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setUploadFiles(Array.from(e.dataTransfer.files));
      if (!isUploadOpen) setIsUploadOpen(true);
    }
  };

  const executeUpload = async () => {
    if (uploadFiles.length === 0) return;

    setIsUploading(true);
    const targetFolder =
      uploadFolderName === "custom" && customFolderName.trim().length > 0
        ? customFolderName.trim()
        : uploadFolderName;

    try {
      for (const file of uploadFiles) {
        await uploadMutation.mutateAsync({
          file,
          name: uploadDisplayName.trim() || file.name.replace(/\.[^/.]+$/, ""),
          folder: targetFolder,
        });
      }
      setIsUploadOpen(false);
      setUploadFiles([]);
      setUploadDisplayName("");
      setCustomFolderName("");
    } catch (err) {
      // error handled by hook
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <PageLayout
      title="Media & File Manager"
      description="Upload, categorize in folders, preview, and access all station images, documents, invoices, and product assets."
      maxWidth="full"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Folder Navigation (3 Columns on Large Screens) */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="shadow-none border">
            <CardHeader className="p-4 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-semibold">Folder Directory</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => {
                    setUploadFolderName("custom");
                    setIsUploadOpen(true);
                  }}
                >
                  <FolderPlus className="h-3.5 w-3.5 mr-1" />
                  New Folder
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-2 pt-0 space-y-1">
              {folders.map((folder) => {
                const isSelected = selectedFolder === folder.slug;
                return (
                  <button
                    key={folder.id}
                    onClick={() => {
                      setSelectedFolder(folder.slug);
                      setPage(1);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Folder
                        className={`h-4 w-4 shrink-0 ${
                          isSelected ? "text-primary-foreground" : "text-amber-500"
                        }`}
                      />
                      <span className="truncate">{folder.name}</span>
                    </div>
                    <Badge
                      variant={isSelected ? "secondary" : "outline"}
                      className={`text-[10px] px-1.5 py-0 h-4 min-w-[20px] justify-center ${
                        isSelected ? "bg-primary-foreground/20 text-primary-foreground border-none" : ""
                      }`}
                    >
                      {folder.count}
                    </Badge>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Quick Storage Info Card */}
          <Card className="shadow-none border bg-muted/30">
            <CardContent className="p-4 text-xs space-y-2">
              <div className="flex items-center justify-between font-semibold">
                <span>Cloud Storage</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">Active CDN</span>
              </div>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                Files are auto-optimized with high-speed CDN delivery and secure cloud backups.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Media Explorer (9 Columns on Large Screens) */}
        <div className="lg:col-span-9 space-y-4">
          <Card className="shadow-none border">
            <CardHeader className="p-3 sm:p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                {/* Search & Type Filter */}
                <div className="flex flex-col sm:flex-row items-center gap-2 flex-1 max-w-lg">
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                      placeholder="Search files by name, format, or tag..."
                      className="pl-9 h-9 text-xs"
                    />
                  </div>

                  <Select
                    value={fileTypeFilter}
                    onValueChange={(val: any) => {
                      setFileTypeFilter(val);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-[130px] h-9 text-xs">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Formats</SelectItem>
                      <SelectItem value="image">Images</SelectItem>
                      <SelectItem value="document">Documents</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* View Switcher & Upload Button */}
                <div className="flex items-center gap-2 justify-end">
                  <div className="flex items-center rounded-lg border p-0.5 bg-muted/20">
                    <Button
                      variant={viewMode === "grid" ? "secondary" : "ghost"}
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setViewMode("grid")}
                      title="Grid View"
                    >
                      <Grid className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant={viewMode === "table" ? "secondary" : "ghost"}
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setViewMode("table")}
                      title="Table List View"
                    >
                      <List className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <Button
                    size="sm"
                    className="h-9 text-xs px-3 bg-primary text-primary-foreground gap-1.5"
                    onClick={() => {
                      setUploadFolderName(selectedFolder !== "all" ? selectedFolder : "products");
                      setIsUploadOpen(true);
                    }}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Upload Files
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-3 sm:p-4 pt-0">
              {isLoadingMedia ? (
                <SkeletonList count={6} />
              ) : items.length === 0 ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  className="flex flex-col items-center justify-center py-14 border-2 border-dashed rounded-xl border-muted-foreground/20 text-center p-6 bg-muted/10 hover:bg-muted/20 transition-colors"
                >
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
                    <Folder className="h-6 w-6" />
                  </div>
                  <h4 className="font-semibold text-sm mb-1">No files in this folder</h4>
                  <p className="text-xs text-muted-foreground max-w-sm mb-4">
                    Drag and drop images, PDFs, or documents here, or click below to upload.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => {
                      setUploadFolderName(selectedFolder !== "all" ? selectedFolder : "products");
                      setIsUploadOpen(true);
                    }}
                    className="h-8 text-xs"
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Add First File
                  </Button>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
                  {items.map((media) => {
                    const isImg = media.type === "image" || (media.mimeType || "").startsWith("image/");
                    const url = media.secureUrl || media.url;
                    return (
                      <Card
                        key={media.id}
                        className="group relative shadow-none border overflow-hidden hover:border-primary/50 transition-all flex flex-col"
                      >
                        {/* Thumbnail / Icon Container */}
                        <div
                          className="relative aspect-square w-full bg-muted/40 flex items-center justify-center overflow-hidden cursor-pointer"
                          onClick={() => setPreviewMedia(media)}
                        >
                          {isImg ? (
                            <img
                              src={url}
                              alt={media.name || "Media"}
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-1.5 p-2">
                              {getFileIcon(media)}
                              <span className="text-[10px] font-mono uppercase text-muted-foreground font-semibold">
                                {media.format || "FILE"}
                              </span>
                            </div>
                          )}

                          {/* Hover Action Overlay */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-7 w-7 rounded-full bg-background/90 hover:bg-background"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewMedia(media);
                              }}
                              title="Preview"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-7 w-7 rounded-full bg-background/90 hover:bg-background"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyUrl(media);
                              }}
                              title="Copy URL"
                            >
                              {copiedId === media.id ? (
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* File Details */}
                        <div className="p-2.5 flex-1 flex flex-col justify-between text-xs space-y-1">
                          <div>
                            <p
                              className="font-medium text-foreground truncate text-xs"
                              title={media.name || media.originalFilename || ""}
                            >
                              {media.name || media.originalFilename || "Untitled"}
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-0.5">
                              <span>{formatBytes(media.bytes)}</span>
                              <Badge variant="outline" className="text-[9px] px-1 py-0 uppercase">
                                {media.folder || "general"}
                              </Badge>
                            </div>
                          </div>

                          {/* Card Footer Menu */}
                          <div className="flex items-center justify-between pt-1 border-t">
                            <span className="text-[9px] text-muted-foreground font-mono">
                              {media.createdAt ? new Date(media.createdAt).toLocaleDateString() : ""}
                            </span>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setPreviewMedia(media)}>
                                  <Eye className="mr-2 h-3.5 w-3.5" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleCopyUrl(media)}>
                                  <Copy className="mr-2 h-3.5 w-3.5" />
                                  Copy Direct Link
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDownload(media)}>
                                  <Download className="mr-2 h-3.5 w-3.5" />
                                  Download
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setMediaToDelete(media)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                /* Table List Mode */
                <div className="rounded-md border overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 border-b text-muted-foreground font-semibold">
                      <tr>
                        <th className="p-3">File Name</th>
                        <th className="p-3">Folder</th>
                        <th className="p-3">Type / Format</th>
                        <th className="p-3">Size</th>
                        <th className="p-3">Uploaded</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {items.map((media) => {
                        const url = media.secureUrl || media.url;
                        return (
                          <tr key={media.id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-3 font-medium flex items-center gap-2">
                              <div className="h-8 w-8 rounded bg-muted/60 flex items-center justify-center overflow-hidden shrink-0">
                                {media.type === "image" ? (
                                  <img src={url} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  getFileIcon(media)
                                )}
                              </div>
                              <span className="truncate max-w-[200px]" title={media.name || ""}>
                                {media.name || media.originalFilename || "Untitled"}
                              </span>
                            </td>
                            <td className="p-3">
                              <Badge variant="outline" className="text-[10px] uppercase font-mono">
                                {media.folder || "general"}
                              </Badge>
                            </td>
                            <td className="p-3 text-muted-foreground font-mono uppercase">
                              {media.format || media.type}
                            </td>
                            <td className="p-3 text-muted-foreground">{formatBytes(media.bytes)}</td>
                            <td className="p-3 text-muted-foreground">
                              {media.createdAt ? new Date(media.createdAt).toLocaleDateString() : "-"}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleCopyUrl(media)}
                                  title="Copy URL"
                                >
                                  {copiedId === media.id ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => setPreviewMedia(media)}
                                  title="Preview"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleDownload(media)}
                                  title="Download"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive"
                                  onClick={() => setMediaToDelete(media)}
                                  title="Delete"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {meta && total > limit && (
                <div className="mt-4">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    totalItems={total}
                    limit={limit}
                    onPageChange={setPage}
                    onLimitChange={(newLimit) => {
                      setLimit(newLimit);
                      setPage(1);
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upload Modal */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Media & Documents</DialogTitle>
            <DialogDescription className="text-xs">
              Upload images, invoices, documents, or spreadsheets into a specific category folder.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Target Folder Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Target Category Folder</label>
              <Select value={uploadFolderName} onValueChange={setUploadFolderName}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="products">📁 Product Images (products)</SelectItem>
                  <SelectItem value="documents">📁 Documents & Contracts (documents)</SelectItem>
                  <SelectItem value="invoices">📁 Invoices & Receipts (invoices)</SelectItem>
                  <SelectItem value="station">📁 Station & Assets (station)</SelectItem>
                  <SelectItem value="images">📁 General Images (images)</SelectItem>
                  <SelectItem value="custom">➕ Create / Type Custom Folder</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {uploadFolderName === "custom" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">New Folder Name</label>
                <Input
                  value={customFolderName}
                  onChange={(e) => setCustomFolderName(e.target.value)}
                  placeholder="e.g. employee_nid, tank_certificates, vouchers"
                  className="h-9 text-xs font-mono"
                />
              </div>
            )}

            {/* Optional Display Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Display Title (Optional)</label>
              <Input
                value={uploadDisplayName}
                onChange={(e) => setUploadDisplayName(e.target.value)}
                placeholder="Friendly name (default is original filename)"
                className="h-9 text-xs"
              />
            </div>

            {/* Drag and Drop Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files) {
                  setUploadFiles(Array.from(e.dataTransfer.files));
                }
              }}
              className="border-2 border-dashed border-primary/30 hover:border-primary/60 rounded-xl p-6 text-center cursor-pointer bg-muted/20 hover:bg-muted/30 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    setUploadFiles(Array.from(e.target.files));
                  }
                }}
              />
              <Upload className="h-8 w-8 mx-auto text-primary mb-2" />
              <p className="text-xs font-semibold">
                {uploadFiles.length > 0
                  ? `${uploadFiles.length} file(s) selected`
                  : "Click to select or drag and drop files"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Images (JPG, PNG, WebP), PDFs, Excel/CSV, Word documents
              </p>
            </div>

            {uploadFiles.length > 0 && (
              <div className="space-y-1 max-h-28 overflow-y-auto rounded border p-2 text-xs bg-muted/30">
                {uploadFiles.map((f, i) => (
                  <div key={i} className="flex justify-between items-center py-0.5">
                    <span className="truncate max-w-[280px] font-medium">{f.name}</span>
                    <span className="text-[10px] text-muted-foreground">{formatBytes(f.size)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsUploadOpen(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={executeUpload}
              disabled={uploadFiles.length === 0 || isUploading}
              className="bg-primary text-primary-foreground"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Uploading...
                </>
              ) : (
                `Upload ${uploadFiles.length > 1 ? `(${uploadFiles.length}) Files` : "File"}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview & Metadata Dialog */}
      {previewMedia && (
        <Dialog open={!!previewMedia} onOpenChange={() => setPreviewMedia(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base truncate">
                {previewMedia.name || previewMedia.originalFilename || "File Preview"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Category: <span className="font-mono uppercase">{previewMedia.folder || "general"}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Full Image or Document Icon */}
              <div className="max-h-72 w-full bg-muted/40 rounded-xl flex items-center justify-center overflow-hidden border">
                {(previewMedia.type === "image" || (previewMedia.mimeType || "").startsWith("image/")) ? (
                  <img
                    src={previewMedia.secureUrl || previewMedia.url}
                    alt={previewMedia.name || ""}
                    className="max-h-72 w-auto object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 gap-2">
                    {getFileIcon(previewMedia)}
                    <span className="font-semibold text-sm">{previewMedia.name}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 text-xs"
                      onClick={() => handleDownload(previewMedia)}
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      Open / Download Document
                    </Button>
                  </div>
                )}
              </div>

              {/* Direct CDN Link Copy Bar */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Direct CDN URL</label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={previewMedia.secureUrl || previewMedia.url}
                    className="h-8 text-xs font-mono bg-muted/40"
                  />
                  <Button
                    size="sm"
                    className="h-8 text-xs shrink-0"
                    onClick={() => handleCopyUrl(previewMedia)}
                  >
                    {copiedId === previewMedia.id ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span className="ml-1.5">Copy</span>
                  </Button>
                </div>
              </div>

              {/* Metadata Table */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs border rounded-lg p-3 bg-muted/20">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase">Format</span>
                  <span className="font-semibold uppercase">{previewMedia.format || "N/A"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase">File Size</span>
                  <span className="font-semibold">{formatBytes(previewMedia.bytes)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase">Resolution</span>
                  <span className="font-semibold">
                    {previewMedia.width && previewMedia.height
                      ? `${previewMedia.width} x ${previewMedia.height}`
                      : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase">Uploaded</span>
                  <span className="font-semibold">
                    {previewMedia.createdAt ? new Date(previewMedia.createdAt).toLocaleDateString() : "-"}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between sm:justify-between">
              <Button
                variant="destructive"
                size="sm"
                className="text-xs"
                onClick={() => {
                  const toDelete = previewMedia;
                  setPreviewMedia(null);
                  setMediaToDelete(toDelete);
                }}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Delete File
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleDownload(previewMedia)}
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Download
                </Button>
                <Button size="sm" className="text-xs" onClick={() => setPreviewMedia(null)}>
                  Close
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmationDialog
        open={!!mediaToDelete}
        onOpenChange={(open) => {
          if (!open) setMediaToDelete(null);
        }}
        onConfirm={() => {
          if (!mediaToDelete) return;
          deleteMutation.mutate(mediaToDelete.id, {
            onSuccess: () => setMediaToDelete(null),
          });
        }}
        title="Delete Media File"
        description={`Are you sure you want to delete "${mediaToDelete?.name || mediaToDelete?.originalFilename || "this file"}"? This will also remove it from Cloudinary CDN.`}
        isLoading={deleteMutation.isPending}
      />
    </PageLayout>
  );
}
