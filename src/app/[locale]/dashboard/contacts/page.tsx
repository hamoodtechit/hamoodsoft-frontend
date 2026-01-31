"use client"

import { ContactDialog } from "@/components/common/contact-dialog"
import { DataTable, type Column } from "@/components/common/data-table"
import { DeleteConfirmationDialog } from "@/components/common/delete-confirmation-dialog"
import { ExportButton } from "@/components/common/export-button"
import { PageLayout } from "@/components/common/page-layout"
import { ViewToggle, type ViewMode } from "@/components/common/view-toggle"
import { SkeletonList } from "@/components/skeletons/skeleton-list"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { type ContactsListParams } from "@/lib/api/contacts"
import { useContacts, useDeleteContact } from "@/lib/hooks/use-contacts"
import { type ExportColumn } from "@/lib/utils/export"
import { Contact } from "@/types"
import { Eye, Mail, MoreVertical, Pencil, Phone, Plus, Search, Trash2, User } from "lucide-react"
import { useTranslations } from "next-intl"
import { useMemo, useState } from "react"

export default function ContactsPage() {
  const t = useTranslations("contacts")
  const tCommon = useTranslations("common")

  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState<"CUSTOMER" | "SUPPLIER" | "">("")
  const limit = 10

  // View mode with localStorage persistence
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("contacts-view-mode") as ViewMode) || "cards"
    }
    return "cards"
  })

  const queryParams = useMemo<ContactsListParams>(() => {
    const trimmed = search.trim()
    const params: ContactsListParams = {
      page,
      limit,
    }

    if (trimmed) {
      params.search = trimmed
    }

    if (typeFilter) {
      params.type = typeFilter
    }

    return params
  }, [page, limit, search, typeFilter])

  const { data, isLoading } = useContacts(queryParams)

  const contacts = data?.items ?? []
  const meta = data?.meta
  const total = meta?.total ?? contacts.length
  const totalPages =
    meta?.totalPages ??
    Math.max(1, Math.ceil((total || 0) / (meta?.limit ?? limit)))
  const currentPage = meta?.page ?? page

  // Table columns configuration
  const tableColumns: Column<Contact>[] = useMemo(
    () => [
      {
        id: "name",
        header: t("name"),
        accessorKey: "name",
        sortable: true,
      },
      {
        id: "type",
        header: t("type"),
        cell: (row) => {
          const typeColors = {
            CUSTOMER: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
            SUPPLIER: "bg-green-500/10 text-green-600 dark:text-green-400",
          }
          const typeLabels = {
            CUSTOMER: t("typeCustomer"),
            SUPPLIER: t("typeSupplier"),
          }
          return (
            <Badge className={typeColors[row.type] || ""}>
              {typeLabels[row.type] || row.type}
            </Badge>
          )
        },
        sortable: true,
      },
      {
        id: "email",
        header: t("email"),
        accessorKey: "email",
        cell: (row) => row.email || "-",
        sortable: false,
      },
      {
        id: "phone",
        header: t("phone"),
        accessorKey: "phone",
        cell: (row) => row.phone || "-",
        sortable: false,
      },
      {
        id: "isIndividual",
        header: t("isIndividual"),
        cell: (row) => (row.isIndividual ? tCommon("yes") : tCommon("no")),
        sortable: true,
      },
      {
        id: "balance",
        header: t("balance"),
        accessorKey: "balance",
        cell: (row) => row.balance?.toFixed(2) || "0.00",
        sortable: true,
      },
    ],
    [t, tCommon]
  )

  // Export columns configuration
  const exportColumns: ExportColumn<Contact>[] = useMemo(
    () => [
      { key: "name", header: "Name", width: 25 },
      { key: "type", header: "Type", width: 15 },
      { key: "email", header: "Email", width: 25 },
      { key: "phone", header: "Phone", width: 20 },
      { key: "address", header: "Address", width: 30 },
      {
        key: "isIndividual",
        header: "Is Individual",
        format: (value) => (value ? "Yes" : "No"),
      },
      {
        key: "companyName",
        header: "Company Name",
        format: (value) => value || "-",
      },
      {
        key: "companyAddress",
        header: "Company Address",
        format: (value) => value || "-",
      },
      {
        key: "companyPhone",
        header: "Company Phone",
        format: (value) => value || "-",
      },
      {
        key: "balance",
        header: "Balance",
        format: (value) => (value ? Number(value).toFixed(2) : "0.00"),
      },
      {
        key: "creditLimit",
        header: "Credit Limit",
        format: (value) => (value ? Number(value).toFixed(2) : "0.00"),
      },
      {
        key: "createdAt",
        header: "Created At",
        format: (value) => (value ? new Date(value).toLocaleString() : "-"),
      },
      {
        key: "updatedAt",
        header: "Updated At",
        format: (value) => (value ? new Date(value).toLocaleString() : "-"),
      },
    ],
    []
  )

  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null)
  const [viewContact, setViewContact] = useState<Contact | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const deleteMutation = useDeleteContact()

  const handleCreate = () => {
    setSelectedContact(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (contact: Contact) => {
    setSelectedContact(contact)
    setIsDialogOpen(true)
  }

  const handleView = (contact: Contact) => {
    setViewContact(contact)
    setIsViewOpen(true)
  }

  const handleDelete = (contact: Contact) => {
    setContactToDelete(contact)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (!contactToDelete) return
    deleteMutation.mutate(contactToDelete.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false)
        setContactToDelete(null)
      },
    })
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "CUSTOMER":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400"
      case "SUPPLIER":
        return "bg-green-500/10 text-green-600 dark:text-green-400"
      default:
        return ""
    }
  }

  return (
    <PageLayout title={t("title")} description={t("description")} maxWidth="full">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <User className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>{t("title")}</CardTitle>
                <CardDescription>{t("description")}</CardDescription>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <div className="relative w-full sm:w-[280px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  placeholder={t("searchPlaceholder")}
                  className="pl-9"
                />
              </div>
              <ViewToggle view={viewMode} onViewChange={setViewMode} />
              <ExportButton
                data={contacts}
                columns={exportColumns}
                filename="contacts"
                disabled={isLoading || contacts.length === 0}
              />
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {t("createContact")}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <SkeletonList count={6} />
          ) : contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("noContacts")}</h3>
              <p className="text-muted-foreground mb-4">{t("noContactsDescription")}</p>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {t("createContact")}
              </Button>
            </div>
          ) : viewMode === "table" ? (
            <div className="rounded-md border">
              <DataTable
                data={contacts}
                columns={tableColumns}
                actions={(row) => (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleView(row)}>
                        <Eye className="mr-2 h-4 w-4" />
                        {t("viewDetails")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(row)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        {tCommon("edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(row)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {tCommon("delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                emptyMessage={t("noContacts")}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {contacts.map((contact) => (
                <Card key={contact.id} className="relative">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{contact.name}</h4>
                          <Badge className={getTypeColor(contact.type)}>
                            {contact.type === "CUSTOMER" ? t("typeCustomer") : t("typeSupplier")}
                          </Badge>
                          {!contact.isIndividual && contact.companyName && (
                            <span className="text-sm text-muted-foreground">
                              ({contact.companyName})
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          {contact.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">{contact.email}</span>
                            </div>
                          )}
                          {contact.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">{contact.phone}</span>
                            </div>
                          )}
                        </div>
                        {contact.address && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            {contact.address}
                          </div>
                        )}
                        <div className="mt-2 flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">
                            {t("balance")}: <span className="font-medium">{contact.balance?.toFixed(2) || "0.00"}</span>
                          </span>
                          <span className="text-muted-foreground">
                            {t("creditLimit")}: <span className="font-medium">{contact.creditLimit?.toFixed(2) || "0.00"}</span>
                          </span>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(contact)}>
                            <Eye className="mr-2 h-4 w-4" />
                            {t("viewDetails")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(contact)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {tCommon("edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(contact)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {tCommon("delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-muted-foreground">
                  {t("pagination", { page: currentPage, totalPages })}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    {tCommon("previous")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    {tCommon("next")}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ContactDialog contact={selectedContact} open={isDialogOpen} onOpenChange={setIsDialogOpen} />

      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDescription", { name: contactToDelete?.name || "" })}
        isLoading={deleteMutation.isPending}
      />

      <Sheet open={isViewOpen} onOpenChange={setIsViewOpen}>
        <SheetContent
          side="bottom"
          className="w-full max-w-3xl mx-auto rounded-t-2xl sm:rounded-2xl sm:max-h-[90vh] overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>{t("detailsTitle")}</SheetTitle>
            <SheetDescription>{t("detailsDescription")}</SheetDescription>
          </SheetHeader>
          {viewContact ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">{viewContact.name}</h3>
                  <div className="text-sm text-muted-foreground mt-1">
                    <Badge className={getTypeColor(viewContact.type)}>
                      {viewContact.type === "CUSTOMER" ? t("typeCustomer") : t("typeSupplier")}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {viewContact.email && (
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">{t("email")}</p>
                    <p className="font-medium">{viewContact.email}</p>
                  </div>
                )}
                {viewContact.phone && (
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">{t("phone")}</p>
                    <p className="font-medium">{viewContact.phone}</p>
                  </div>
                )}
                {viewContact.address && (
                  <div className="rounded-lg border p-3 sm:col-span-2">
                    <p className="text-xs text-muted-foreground">{t("address")}</p>
                    <p className="font-medium">{viewContact.address}</p>
                  </div>
                )}
              </div>

              {!viewContact.isIndividual && (
                <div className="space-y-3 border-t pt-4">
                  <h4 className="font-medium">{t("companyInformation")}</h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {viewContact.companyName && (
                      <div className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground">{t("companyName")}</p>
                        <p className="font-medium">{viewContact.companyName}</p>
                      </div>
                    )}
                    {viewContact.companyPhone && (
                      <div className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground">{t("companyPhone")}</p>
                        <p className="font-medium">{viewContact.companyPhone}</p>
                      </div>
                    )}
                    {viewContact.companyAddress && (
                      <div className="rounded-lg border p-3 sm:col-span-2">
                        <p className="text-xs text-muted-foreground">{t("companyAddress")}</p>
                        <p className="font-medium">{viewContact.companyAddress}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4 border-t pt-4">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">{t("balance")}</p>
                  <p className="font-medium text-lg">
                    {viewContact.balance?.toFixed(2) || "0.00"}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">{t("creditLimit")}</p>
                  <p className="font-medium text-lg">
                    {viewContact.creditLimit?.toFixed(2) || "0.00"}
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-sm text-muted-foreground border-t pt-4">
                <div>
                  <p className="text-xs uppercase tracking-wide">{tCommon("createdAt")}</p>
                  <p className="font-medium text-foreground">
                    {viewContact.createdAt
                      ? new Date(viewContact.createdAt).toLocaleString()
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide">{tCommon("updatedAt")}</p>
                  <p className="font-medium text-foreground">
                    {viewContact.updatedAt
                      ? new Date(viewContact.updatedAt).toLocaleString()
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </PageLayout>
  )
}
