"use client";

import { ContactDialog } from "@/components/common/contact-dialog";
import { PaymentDialog } from "@/components/common/payment-dialog";
import { PaymentReceiptDialog, type PaymentReceiptData } from "@/components/common/payment-receipt-dialog";
import { DataTable, type Column } from "@/components/common/data-table";
import { DeleteConfirmationDialog } from "@/components/common/delete-confirmation-dialog";
import { ExportButton } from "@/components/common/export-button";
import { PageLayout } from "@/components/common/page-layout";
import { ViewToggle, type ViewMode } from "@/components/common/view-toggle";
import { SkeletonList } from "@/components/skeletons/skeleton-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type ContactsListParams } from "@/lib/api/contacts";
import { useContacts, useDeleteContact } from "@/lib/hooks/use-contacts";
import { useHasPermission } from "@/lib/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/utils/permissions";
import { type ExportColumn } from "@/lib/utils/export";
import { Contact } from "@/types";
import {
  Eye,
  Mail,
  MoreVertical,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  User,
  Building2,
  Banknote,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";

export default function ContactsPage() {
  const t = useTranslations("contacts");
  const tCommon = useTranslations("common");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"customer" | "supplier">("customer");
  const [isIndividualFilter, setIsIndividualFilter] = useState<string>("all"); // "all", "true", "false"
  const limit = 10;

  // View mode with localStorage persistence
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("contacts-view-mode") as ViewMode) || "table";
    }
    return "table";
  });

  const queryParams = useMemo<ContactsListParams>(() => {
    const trimmed = search.trim();
    const params: ContactsListParams = {
      page,
      limit,
    };

    if (trimmed) {
      params.search = trimmed;
    }

    if (activeTab === "customer") {
      params.type = "CUSTOMER";
      if (isIndividualFilter !== "all") {
        params.isIndividual = isIndividualFilter === "true";
      }
    } else {
      params.type = "SUPPLIER";
    }

    return params;
  }, [page, limit, search, activeTab, isIndividualFilter]);

  const { data, isLoading } = useContacts(queryParams);

  const contacts = data?.items ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? contacts.length;
  const totalPages =
    meta?.totalPages ??
    Math.max(1, Math.ceil((total || 0) / (meta?.limit ?? limit)));
  const currentPage = meta?.page ?? page;

  // Permission checks
  const canCreate = useHasPermission(PERMISSIONS.CONTACTS_CREATE);
  const canUpdate = useHasPermission(PERMISSIONS.CONTACTS_UPDATE);
  const canDelete = useHasPermission(PERMISSIONS.CONTACTS_DELETE);

  // Table columns configuration
  const tableColumns: Column<Contact>[] = useMemo(
    () => [
      {
        id: "name",
        header: t("name"),
        accessorKey: "name",
        cell: (row) => (
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-foreground">{row.name}</span>
            {row.binNumber && (
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                BIN: {row.binNumber}
              </span>
            )}
            {row.address && (
              <span className="text-xs text-muted-foreground truncate max-w-[220px]">
                {row.address}
              </span>
            )}
          </div>
        ),
        sortable: true,
      },
      {
        id: "email",
        header: t("email"),
        accessorKey: "email",
        cell: (row) => <span className="text-sm text-muted-foreground">{row.email || "-"}</span>,
        sortable: false,
      },
      {
        id: "phone",
        header: t("phone"),
        accessorKey: "phone",
        cell: (row) => <span className="text-sm text-muted-foreground">{row.phone || "-"}</span>,
        sortable: false,
      },
      {
        id: "vehicles",
        header: "Vehicles",
        cell: (row) => {
          if (!row.vehicles || row.vehicles.length === 0) return <span className="text-sm text-muted-foreground">-</span>;
          return (
            <div className="flex flex-wrap items-center gap-1">
              {row.vehicles.map((v) => (
                <Badge key={v.id || v.vehicleNo} variant="outline" className="text-xs font-mono px-1.5 py-0.5">
                  {v.vehicleNo}
                  {v.driverName ? ` (${v.driverName})` : ""}
                </Badge>
              ))}
            </div>
          );
        },
      },
      {
        id: "balance",
        header: t("balance") || "Advance",
        accessorKey: "balance",
        cell: (row) => {
          const bal = row.balance || 0;
          return (
            <span className="text-emerald-500 font-semibold text-sm">
              {bal.toFixed(2)}
            </span>
          );
        },
        sortable: true,
      },
      {
        id: "credit",
        header: "Credit (Limit / Due)",
        cell: (row) => {
          const limit = row.creditLimit || 0;
          const due = row.totalDue || 0;
          return (
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Limit: {limit.toFixed(2)}</span>
              <span className={due > 0 ? "text-destructive font-semibold text-sm" : "text-sm"}>
                Due: {due.toFixed(2)}
              </span>
            </div>
          );
        },
      },
    ],
    [t],
  );

  // Export columns configuration
  const exportColumns: ExportColumn<Contact>[] = useMemo(
    () => [
      { key: "name", header: "Name", width: 25 },
      { key: "email", header: "Email", width: 25 },
      { key: "phone", header: "Phone", width: 20 },
      { key: "address", header: "Address", width: 30 },
      {
        key: "isIndividual",
        header: "Is Individual",
        format: (value) => (value ? "Yes" : "No"),
      },
      {
        key: "balance",
        header: "Advance Balance",
        format: (value) => (value ? Number(value).toFixed(2) : "0.00"),
      },
      {
        key: "creditLimit",
        header: "Credit Limit",
        format: (value) => (value ? Number(value).toFixed(2) : "0.00"),
      },
      {
        key: "totalDue",
        header: "Total Due",
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
    [],
  );

  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [defaultIsIndividual, setDefaultIsIndividual] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [viewContact, setViewContact] = useState<Contact | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentContact, setPaymentContact] = useState<Contact | null>(null);
  const [receiptData, setReceiptData] = useState<PaymentReceiptData | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const deleteMutation = useDeleteContact();
  const queryClient = useQueryClient();

  const handlePaymentSuccess = (res: any) => {
    queryClient.invalidateQueries({ queryKey: ["contacts"] });
    if (res?.allocations || res?.remainingDeposit > 0) {
      setReceiptData({
        contactName: paymentContact?.name || "Customer",
        totalPaid: res.totalPaid || 0,
        remainingDeposit: res.remainingDeposit || 0,
        allocations: res.allocations || [],
        date: new Date().toISOString(),
      });
      setIsReceiptOpen(true);
    }
  };

  const handleDeposit = (contact: Contact) => {
    setPaymentContact(contact);
    setIsPaymentOpen(true);
  };

  const handleCreate = () => {
    setSelectedContact(null);
    setDefaultIsIndividual(activeTab === "customer");
    setIsDialogOpen(true);
  };

  const handleEdit = (contact: Contact) => {
    setSelectedContact(contact);
    setDefaultIsIndividual(contact.isIndividual ?? true);
    setIsDialogOpen(true);
  };

  const handleView = (contact: Contact) => {
    setViewContact(contact);
    setIsViewOpen(true);
  };

  const handleDelete = (contact: Contact) => {
    setContactToDelete(contact);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!contactToDelete) return;
    deleteMutation.mutate(contactToDelete.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        setContactToDelete(null);
      },
    });
  };


  return (
    <PageLayout
      title={activeTab === "customer" ? "Customers" : "Suppliers"}
      description={activeTab === "customer" ? "Manage your customers" : "Manage your suppliers"}
      maxWidth="full"
    >
      <Tabs value={activeTab} onValueChange={(val) => {
        setActiveTab(val as "customer" | "supplier");
        setPage(1);
      }}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="customer" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="supplier" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Suppliers
            </TabsTrigger>
          </TabsList>
        </div>

      <Card>
        <CardHeader className="p-3 sm:p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                {activeTab === "customer" ? <User className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg">{activeTab === "customer" ? "Customers" : "Suppliers"}</CardTitle>
                <CardDescription className="text-xs">{activeTab === "customer" ? "Manage your customers" : "Manage your suppliers"}</CardDescription>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              {activeTab === "customer" && (
                <Select value={isIndividualFilter} onValueChange={(val) => { setIsIndividualFilter(val); setPage(1); }}>
                  <SelectTrigger className="w-full sm:w-[150px] h-9 text-sm">
                    <SelectValue placeholder="All Customers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="true">Individual</SelectItem>
                    <SelectItem value="false">Company</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <div className="relative w-full sm:w-[260px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder={t("searchPlaceholder")}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              <ViewToggle view={viewMode} onViewChange={setViewMode} />
              <ExportButton
                data={contacts}
                columns={exportColumns}
                filename="contacts"
                disabled={isLoading || contacts.length === 0}
              />
              {canCreate && (
                <Button size="sm" className="h-9 text-sm px-3" onClick={handleCreate}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  {t("createContact")}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3 sm:p-4 pt-0">
          {isLoading ? (
            <SkeletonList count={6} />
          ) : contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{activeTab === "customer" ? t("noContacts") : "No Suppliers"}</h3>
              <p className="text-muted-foreground mb-4">
                {t("noContactsDescription")}
              </p>
              {canCreate && (
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  {activeTab === "customer" ? t("createContact") : "Create Supplier"}
                </Button>
              )}
            </div>
          ) : viewMode === "table" ? (
            <div className="rounded-md border">
              <DataTable
                data={contacts}
                columns={tableColumns}
                density="compact"
                actions={(row) => (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleView(row)}>
                        <Eye className="mr-2 h-4 w-4" />
                        {t("viewDetails")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeposit(row)}>
                        <Banknote className="mr-2 h-4 w-4" />
                        Deposit / Make Payment
                      </DropdownMenuItem>
                      {canUpdate && (
                        <DropdownMenuItem onClick={() => handleEdit(row)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          {tCommon("edit")}
                        </DropdownMenuItem>
                      )}
                      {canDelete && (
                        <DropdownMenuItem
                          onClick={() => handleDelete(row)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {tCommon("delete")}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                emptyMessage={t("noContacts")}
              />
            </div>
          ) : (
            <div className="space-y-2">
              {contacts.map((contact) => (
                <Card key={contact.id} className="relative shadow-none border hover:border-border transition-colors">
                  <CardContent className="p-3 px-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                        {/* Title & Badge */}
                        <div className="flex items-center gap-2 min-w-[200px]">
                          <h4 className="font-semibold text-sm text-foreground truncate">{contact.name}</h4>
                          {!contact.isIndividual && (
                            <span className="text-xs text-muted-foreground font-medium">
                              (Company)
                            </span>
                          )}
                        </div>

                        {/* Phone & Email */}
                        <div className="flex items-center gap-3 text-muted-foreground text-xs sm:text-sm">
                          {contact.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5" />
                              <span>{contact.phone}</span>
                            </div>
                          )}
                          {contact.email && (
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5" />
                              <span>{contact.email}</span>
                            </div>
                          )}
                        </div>

                        {/* Vehicles */}
                        {contact.vehicles && contact.vehicles.length > 0 && (
                          <div className="flex items-center gap-1 text-xs">
                            <span className="text-muted-foreground">Vehicles:</span>
                            <div className="flex flex-wrap gap-1">
                              {contact.vehicles.map((v) => (
                                <Badge key={v.id || v.vehicleNo} variant="outline" className="text-xs font-mono px-1.5 py-0.5">
                                  {v.vehicleNo}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Balance & Address */}
                        <div className="ml-auto flex items-center gap-3 text-sm">
                          {contact.address && (
                            <span className="text-muted-foreground text-xs truncate max-w-[180px] hidden lg:inline">
                              {contact.address}
                            </span>
                          )}
                          <div className="text-right whitespace-nowrap">
                            <span className="text-muted-foreground text-xs">{t("balance")} (Adv): </span>
                            <span className="text-emerald-500 font-semibold">
                              {contact.balance?.toFixed(2) || "0.00"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t">
                          <div className="text-xs">
                            <span className="text-muted-foreground">Credit Limit: </span>
                            <span className="font-semibold">{contact.creditLimit?.toFixed(2) || "0.00"}</span>
                          </div>
                          <div className="text-xs">
                            <span className="text-muted-foreground">Total Due: </span>
                            <span className={contact.totalDue && contact.totalDue > 0 ? "text-destructive font-semibold" : "font-semibold"}>
                              {contact.totalDue?.toFixed(2) || "0.00"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(contact)}>
                            <Eye className="mr-2 h-4 w-4" />
                            {t("viewDetails")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeposit(contact)}>
                            <Banknote className="mr-2 h-4 w-4" />
                            Deposit / Make Payment
                          </DropdownMenuItem>
                          {canUpdate && (
                            <DropdownMenuItem onClick={() => handleEdit(contact)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              {tCommon("edit")}
                            </DropdownMenuItem>
                          )}
                          {canDelete && (
                            <DropdownMenuItem
                              onClick={() => handleDelete(contact)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {tCommon("delete")}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                  {t("pagination", { page: currentPage, totalPages })}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    {tCommon("previous")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
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

      <ContactDialog
        contact={selectedContact}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        defaultIsIndividual={defaultIsIndividual}
      />

      <PaymentDialog
        open={isPaymentOpen}
        onOpenChange={setIsPaymentOpen}
        defaultType={paymentContact?.type === "SUPPLIER" ? "PURCHASE_PAYMENT" : "SALE_PAYMENT"}
        defaultContactId={paymentContact?.id}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <PaymentReceiptDialog
        open={isReceiptOpen}
        onOpenChange={setIsReceiptOpen}
        data={receiptData}
      />

      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDescription", {
          name: contactToDelete?.name || "",
        })}
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
                    <Badge className={viewContact.type === "CUSTOMER" ? "bg-blue-100 text-blue-800 hover:bg-blue-200" : "bg-purple-100 text-purple-800 hover:bg-purple-200"}>
                      {viewContact.type === "CUSTOMER"
                        ? t("typeCustomer")
                        : t("typeSupplier")}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {viewContact.email && (
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">
                      {t("email")}
                    </p>
                    <p className="font-medium">{viewContact.email}</p>
                  </div>
                )}
                {viewContact.phone && (
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">
                      {t("phone")}
                    </p>
                    <p className="font-medium">{viewContact.phone}</p>
                  </div>
                )}
                {viewContact.address && (
                  <div className="rounded-lg border p-3 sm:col-span-2">
                    <p className="text-xs text-muted-foreground">
                      {t("address")}
                    </p>
                    <p className="font-medium">{viewContact.address}</p>
                  </div>
                )}
              </div>



              <div className="grid sm:grid-cols-2 gap-4 border-t pt-4">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">
                    {t("balance")}
                  </p>
                  <p
                    className={`font-medium text-lg ${(viewContact.balance || 0) < 0 ? "text-destructive" : "text-emerald-500"}`}
                  >
                    {viewContact.balance?.toFixed(2) || "0.00"}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">
                    {t("creditLimit")}
                  </p>
                  <p className="font-medium text-lg">
                    {viewContact.creditLimit?.toFixed(2) || "0.00"}
                  </p>
                </div>
              </div>

              {viewContact.vehicles && viewContact.vehicles.length > 0 && (
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground mb-2">Registered Vehicles</p>
                  <div className="flex flex-wrap gap-2">
                    {viewContact.vehicles.map((v) => (
                      <Badge key={v.id} variant="secondary" className="font-mono text-sm px-2.5 py-1">
                        {v.vehicleNo}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-3 text-sm text-muted-foreground border-t pt-4">
                <div>
                  <p className="text-xs uppercase tracking-wide">
                    {tCommon("createdAt")}
                  </p>
                  <p className="font-medium text-foreground">
                    {viewContact.createdAt
                      ? new Date(viewContact.createdAt).toLocaleString()
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide">
                    {tCommon("updatedAt")}
                  </p>
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
      </Tabs>
    </PageLayout>
  );
}
