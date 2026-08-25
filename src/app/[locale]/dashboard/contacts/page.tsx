"use client";

import { ContactDialog } from "@/components/common/contact-dialog";
import { PaymentDialog } from "@/components/common/payment-dialog";
import { PaymentReceiptDialog, type PaymentReceiptData } from "@/components/common/payment-receipt-dialog";
import { DataTable, type Column } from "@/components/common/data-table";
import { DeleteConfirmationDialog } from "@/components/common/delete-confirmation-dialog";
import { ExportButton } from "@/components/common/export-button";
import { PageLayout } from "@/components/common/page-layout";
import { ViewToggle, type ViewMode } from "@/components/common/view-toggle";
import { Pagination } from "@/components/common/pagination";
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
import { Contact, ContactPerson } from "@/types";
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
  PhoneCall,
  Car,
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
  const [limit, setLimit] = useState(10);

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

  // Permission checks
  const canCreate = useHasPermission(PERMISSIONS.CONTACTS_CREATE);
  const canUpdate = useHasPermission(PERMISSIONS.CONTACTS_UPDATE);
  const canDelete = useHasPermission(PERMISSIONS.CONTACTS_DELETE);

  // Helper to parse contact persons
  const parsePersons = (contactPersons?: ContactPerson[] | string): ContactPerson[] => {
    if (!contactPersons) return [];
    if (Array.isArray(contactPersons)) return contactPersons;
    try {
      const parsed = JSON.parse(contactPersons);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  // Table columns configuration
  const tableColumns: Column<Contact>[] = useMemo(
    () => {
      const cols: Column<Contact>[] = [
        {
          id: "name",
          header: activeTab === "customer" ? "Customer Name" : "Supplier / Company Name",
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
          header: activeTab === "customer" ? t("phone") : "Office Phone",
          accessorKey: "phone",
          cell: (row) => <span className="text-sm text-muted-foreground">{row.phone || "-"}</span>,
          sortable: false,
        },
      ];

      // If customer: show vehicles column
      if (activeTab === "customer") {
        cols.push({
          id: "vehicles",
          header: "Vehicles",
          cell: (row) => {
            if (!row.vehicles || row.vehicles.length === 0)
              return <span className="text-sm text-muted-foreground">-</span>;
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
        });
      } else {
        // If supplier: show Contact Persons / Additional Phones column
        cols.push({
          id: "contactPersons",
          header: "Contact Persons & Phones",
          cell: (row) => {
            const persons = parsePersons(row.contactPersons);
            if (persons.length === 0)
              return <span className="text-sm text-muted-foreground">-</span>;
            return (
              <div className="flex flex-col gap-1 max-w-[240px]">
                {persons.map((p, idx) => (
                  <div key={idx} className="text-xs flex flex-wrap items-center gap-1">
                    <span className="font-medium text-foreground">{p.name}:</span>
                    <span className="text-muted-foreground font-mono">{p.phone}</span>
                    {p.designation && (
                      <span className="text-[10px] bg-muted px-1.5 py-0.2 rounded text-muted-foreground">
                        {p.designation}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            );
          },
        });
      }

      cols.push(
        {
          id: "balance",
          header: activeTab === "customer" ? "Advance Received" : "Advance Given",
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
          header: activeTab === "customer" ? "Credit (Limit / They Owe)" : "Credit (Limit / We Owe)",
          cell: (row) => {
            const limitVal = row.creditLimit || 0;
            const due = row.totalDue || 0;
            return (
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Limit: {limitVal.toFixed(2)}</span>
                <span className={due > 0 ? "text-destructive font-semibold text-sm" : "text-sm"}>
                  {activeTab === "customer" ? "They Owe" : "We Owe"}: {due.toFixed(2)}
                </span>
              </div>
            );
          },
        },
      );

      return cols;
    },
    [t, activeTab],
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
        contactName: paymentContact?.name || (activeTab === "customer" ? "Customer" : "Supplier"),
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
    setDefaultIsIndividual(contact.isIndividual ?? (contact.type === "CUSTOMER"));
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
      description={
        activeTab === "customer"
          ? "Manage your customer accounts, vehicles, and credit limits"
          : "Manage your fuel and product supplier companies and representatives"
      }
      maxWidth="full"
    >
      <Tabs
        value={activeTab}
        onValueChange={(val) => {
          setActiveTab(val as "customer" | "supplier");
          setPage(1);
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid grid-cols-2 w-full sm:w-[320px]">
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
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    activeTab === "customer"
                      ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                  }`}
                >
                  {activeTab === "customer" ? <User className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg">
                    {activeTab === "customer" ? "Customer Directory" : "Supplier Directory"}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {activeTab === "customer"
                      ? "View and manage all registered individual and corporate customers"
                      : "View and manage verified fuel, lubricant, and product supplier accounts"}
                  </CardDescription>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                {activeTab === "customer" && (
                  <Select
                    value={isIndividualFilter}
                    onValueChange={(val) => {
                      setIsIndividualFilter(val);
                      setPage(1);
                    }}
                  >
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
                    placeholder={
                      activeTab === "customer"
                        ? "Search customers..."
                        : "Search suppliers..."
                    }
                    className="pl-9 h-9 text-sm"
                  />
                </div>
                <ViewToggle view={viewMode} onViewChange={setViewMode} />
                <ExportButton
                  data={contacts}
                  columns={exportColumns}
                  filename={activeTab === "customer" ? "customers" : "suppliers"}
                  disabled={isLoading || contacts.length === 0}
                />
                {canCreate && (
                  <Button size="sm" className="h-9 text-sm px-3" onClick={handleCreate}>
                    <Plus className="mr-1.5 h-4 w-4" />
                    {activeTab === "customer" ? "Create Customer" : "Create Supplier"}
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
                {activeTab === "customer" ? (
                  <User className="h-12 w-12 text-muted-foreground mb-4" />
                ) : (
                  <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                )}
                <h3 className="text-lg font-semibold mb-2">
                  {activeTab === "customer" ? "No Customers Found" : "No Suppliers Found"}
                </h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  {activeTab === "customer"
                    ? "Get started by registering your first customer."
                    : "Get started by adding your first supplier company."}
                </p>
                {canCreate && (
                  <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    {activeTab === "customer" ? "Create Customer" : "Create Supplier"}
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
                          {activeTab === "customer" ? "View Customer Details" : "View Supplier Details"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeposit(row)}>
                          <Banknote className="mr-2 h-4 w-4" />
                          {activeTab === "customer"
                            ? "Receive Payment / Deposit"
                            : "Make Payment / Deposit"}
                        </DropdownMenuItem>
                        {canUpdate && (
                          <DropdownMenuItem onClick={() => handleEdit(row)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {activeTab === "customer" ? "Edit Customer" : "Edit Supplier"}
                          </DropdownMenuItem>
                        )}
                        {canDelete && (
                          <DropdownMenuItem
                            onClick={() => handleDelete(row)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {activeTab === "customer" ? "Delete Customer" : "Delete Supplier"}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  emptyMessage={activeTab === "customer" ? "No customers found" : "No suppliers found"}
                />
                {meta && (
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    totalItems={meta.total || 0}
                    limit={limit}
                    onPageChange={setPage}
                    onLimitChange={(newLimit) => {
                      setLimit(newLimit);
                      setPage(1);
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {contacts.map((contact) => {
                  const persons = parsePersons(contact.contactPersons);
                  return (
                    <Card
                      key={contact.id}
                      className="relative shadow-none border hover:border-border transition-colors"
                    >
                      <CardContent className="p-3 px-3.5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                            {/* Title & Badge */}
                            <div className="flex items-center gap-2 min-w-[200px]">
                              <h4 className="font-semibold text-sm text-foreground truncate">
                                {contact.name}
                              </h4>
                              {activeTab === "customer" && !contact.isIndividual && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                  Company
                                </Badge>
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

                            {/* Customer Vehicles */}
                            {activeTab === "customer" && contact.vehicles && contact.vehicles.length > 0 && (
                              <div className="flex items-center gap-1 text-xs">
                                <span className="text-muted-foreground">Vehicles:</span>
                                <div className="flex flex-wrap gap-1">
                                  {contact.vehicles.map((v) => (
                                    <Badge
                                      key={v.id || v.vehicleNo}
                                      variant="outline"
                                      className="text-xs font-mono px-1.5 py-0.5"
                                    >
                                      {v.vehicleNo}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Supplier Contact Persons */}
                            {activeTab === "supplier" && persons.length > 0 && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <PhoneCall className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                <span>{persons.length} contact person(s)</span>
                              </div>
                            )}

                            {/* Balance & Address */}
                            <div className="ml-auto flex items-center gap-3 text-sm">
                              {contact.address && (
                                <span className="text-muted-foreground text-xs truncate max-w-[180px] hidden lg:inline">
                                  {contact.address}
                                </span>
                              )}
                              <div className="flex flex-col items-end">
                                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                  {(contact.balance || 0).toFixed(2)} Advance
                                </span>
                                {(contact.totalDue || 0) > 0 && (
                                  <span className="text-[11px] text-destructive font-medium">
                                    {activeTab === "customer" ? "Owes" : "We Owe"}:{" "}
                                    {(contact.totalDue || 0).toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleView(contact)}>
                                <Eye className="mr-2 h-4 w-4" />
                                {activeTab === "customer" ? "View Customer Details" : "View Supplier Details"}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeposit(contact)}>
                                <Banknote className="mr-2 h-4 w-4" />
                                {activeTab === "customer"
                                  ? "Receive Payment / Deposit"
                                  : "Make Payment / Deposit"}
                              </DropdownMenuItem>
                              {canUpdate && (
                                <DropdownMenuItem onClick={() => handleEdit(contact)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  {activeTab === "customer" ? "Edit Customer" : "Edit Supplier"}
                                </DropdownMenuItem>
                              )}
                              {canDelete && (
                                <DropdownMenuItem
                                  onClick={() => handleDelete(contact)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {activeTab === "customer" ? "Delete Customer" : "Delete Supplier"}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {meta && (
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    totalItems={meta.total || 0}
                    limit={limit}
                    onPageChange={setPage}
                    onLimitChange={(newLimit) => {
                      setLimit(newLimit);
                      setPage(1);
                    }}
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create / Edit Dialog */}
        <ContactDialog
          contact={selectedContact}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          contactType={activeTab === "customer" ? "CUSTOMER" : "SUPPLIER"}
          defaultIsIndividual={defaultIsIndividual}
        />

        {/* Payment / Deposit Dialog */}
        <PaymentDialog
          open={isPaymentOpen}
          onOpenChange={setIsPaymentOpen}
          defaultType={paymentContact?.type === "SUPPLIER" ? "PURCHASE_PAYMENT" : "SALE_PAYMENT"}
          defaultContactId={paymentContact?.id}
          onPaymentSuccess={handlePaymentSuccess}
        />

        {/* Payment Receipt Dialog */}
        <PaymentReceiptDialog
          open={isReceiptOpen}
          onOpenChange={setIsReceiptOpen}
          data={receiptData}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={confirmDelete}
          title={activeTab === "customer" ? "Delete Customer" : "Delete Supplier"}
          description={`Are you sure you want to delete "${contactToDelete?.name || ""}"? This action cannot be undone.`}
          isLoading={deleteMutation.isPending}
        />

        {/* View Details Sheet */}
        <Sheet open={isViewOpen} onOpenChange={setIsViewOpen}>
          <SheetContent
            side="bottom"
            className="w-full max-w-3xl mx-auto rounded-t-2xl sm:rounded-2xl sm:max-h-[90vh] overflow-y-auto"
          >
            <SheetHeader>
              <SheetTitle>
                {viewContact?.type === "SUPPLIER" ? "Supplier Profile Details" : "Customer Profile Details"}
              </SheetTitle>
              <SheetDescription>
                {viewContact?.type === "SUPPLIER"
                  ? "Complete supplier account, representative phone numbers, and balances."
                  : "Complete customer profile, vehicles, and transaction balances."}
              </SheetDescription>
            </SheetHeader>
            {viewContact ? (
              <div className="space-y-4 pt-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">{viewContact.name}</h3>
                    <div className="text-sm text-muted-foreground mt-1">
                      <Badge
                        className={
                          viewContact.type === "CUSTOMER"
                            ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                            : "bg-purple-100 text-purple-800 hover:bg-purple-200"
                        }
                      >
                        {viewContact.type === "CUSTOMER"
                          ? viewContact.isIndividual
                            ? "Individual Customer"
                            : "Corporate Customer"
                          : "Supplier Company"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {viewContact.email && (
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">{t("email")}</p>
                      <p className="font-medium text-sm">{viewContact.email}</p>
                    </div>
                  )}
                  {viewContact.phone && (
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">
                        {viewContact.type === "SUPPLIER" ? "Main Office Phone" : t("phone")}
                      </p>
                      <p className="font-medium text-sm">{viewContact.phone}</p>
                    </div>
                  )}
                  {viewContact.binNumber && (
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">BIN / VAT Number</p>
                      <p className="font-medium text-sm">{viewContact.binNumber}</p>
                    </div>
                  )}
                  {viewContact.address && (
                    <div className="rounded-lg border p-3 sm:col-span-2">
                      <p className="text-xs text-muted-foreground">{t("address")}</p>
                      <p className="font-medium text-sm">{viewContact.address}</p>
                    </div>
                  )}
                </div>

                {/* Contact Persons list in View Sheet */}
                {(() => {
                  const persons = parsePersons(viewContact.contactPersons);
                  if (persons.length === 0) return null;
                  return (
                    <div className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        <PhoneCall className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                        <span>Contact Persons & Representatives</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {persons.map((p, idx) => (
                          <div key={idx} className="bg-muted/40 p-2.5 rounded-md border text-sm">
                            <p className="font-semibold text-foreground">{p.name}</p>
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">{p.phone}</p>
                            {p.designation && (
                              <Badge variant="secondary" className="text-[10px] mt-1">
                                {p.designation}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Financial Summary */}
                <div className="grid sm:grid-cols-2 gap-4 border-t pt-4">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">
                      {viewContact.type === "CUSTOMER" ? "Advance Received" : "Advance Given"}
                    </p>
                    <p
                      className={`font-medium text-lg ${
                        (viewContact.balance || 0) < 0 ? "text-destructive" : "text-emerald-500"
                      }`}
                    >
                      {(viewContact.balance || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">
                      {viewContact.type === "CUSTOMER" ? "Outstanding (They Owe)" : "Outstanding (We Owe)"}
                    </p>
                    <p
                      className={`font-medium text-lg ${
                        (viewContact.totalDue || 0) > 0 ? "text-destructive" : "text-foreground"
                      }`}
                    >
                      {(viewContact.totalDue || 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Vehicles (only if customer and has vehicles) */}
                {viewContact.type === "CUSTOMER" && viewContact.vehicles && viewContact.vehicles.length > 0 && (
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      <Car className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Registered Customer Vehicles</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {viewContact.vehicles.map((v) => (
                        <Badge key={v.id} variant="secondary" className="font-mono text-sm px-2.5 py-1">
                          {v.vehicleNo}
                          {v.vehicleType ? ` - ${v.vehicleType}` : ""}
                          {v.driverName ? ` (${v.driverName})` : ""}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

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
      </Tabs>
    </PageLayout>
  );
}
