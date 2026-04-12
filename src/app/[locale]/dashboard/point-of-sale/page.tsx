"use client"

import { ContactDialog } from "@/components/common/contact-dialog"
import { DeleteConfirmationDialog } from "@/components/common/delete-confirmation-dialog"
import { InvoiceDialog } from "@/components/common/invoice-dialog"
import { PageLayout } from "@/components/common/page-layout"
import { ProductDialog } from "@/components/common/product-dialog"
import { SaleDialog } from "@/components/common/sale-dialog"
import { CloseSessionDialog, OpenSessionDialog } from "@/components/pos/session-dialogs"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"

import { POSProvider, usePOS } from "./_components/pos-provider"
import { POSHeader } from "./_components/pos-header"
import { POSToolbar } from "./_components/pos-toolbar"
import { CategoryBar } from "./_components/category-bar"
import { ProductGrid } from "./_components/product-grid"
import { CartPanel } from "./_components/cart-panel"
import { CalculatorDialog } from "./_components/calculator-dialog"
import { ShortcutsDialog } from "./_components/shortcuts-dialog"
import { FilterDialog } from "./_components/filter-dialog"
import { VariantPickerDialog } from "./_components/variant-picker-dialog"
import { RecentTransactionsDialog } from "./_components/recent-transactions-dialog"
import { usePOSKeyboardShortcuts } from "./_components/use-pos-keyboard-shortcuts"

export default function PointOfSalePage() {
  return (
    <POSProvider>
      <POSContent />
    </POSProvider>
  )
}

function POSContent() {
  const {
    currentBusiness,
    // Session
    activeSession, isLoadingSession, refetchSession,
    selectedBranchId, showCloseSession, setShowCloseSession,
    // Dialogs
    showProductDialog, setShowProductDialog,
    showInvoice, setShowInvoice,
    completedSale,
    showRecentTransactions, setShowRecentTransactions,
    isContactDialogOpen, setIsContactDialogOpen,
    setSelectedContactId,
    saleToEdit, setSaleToEdit,
    isSaleDialogOpen, setIsSaleDialogOpen,
    saleToDelete, setSaleToDelete,
    isDeleteDialogOpen, setIsDeleteDialogOpen,
    deleteSaleMutation,
  } = usePOS()

  // Register keyboard shortcuts
  usePOSKeyboardShortcuts()

  if (!currentBusiness?.modules?.includes("point-of-sale")) {
    return (
      <PageLayout title="Access Denied" description="You don&apos;t have access to this module">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              You don&apos;t have access to the Point of Sale module.
            </p>
          </CardContent>
        </Card>
      </PageLayout>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header */}
      <POSHeader />

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
          {/* Left Panel - Filters and Products */}
          <div className="lg:col-span-8 flex flex-col space-y-4 min-h-0">
            <POSToolbar />
            <CategoryBar />
            <ProductGrid />
          </div>

          {/* Right Panel - Cart */}
          <CartPanel />
        </div>
      </div>

      {/* ── Dialogs ─────────────────────────────────────────────────────── */}

      {/* Session Management */}
      <OpenSessionDialog
        open={!activeSession && !isLoadingSession && !!selectedBranchId}
        branchId={selectedBranchId || ""}
        onOpenSuccess={() => refetchSession()}
      />

      {activeSession && (
        <CloseSessionDialog
          open={showCloseSession}
          onOpenChange={setShowCloseSession}
          branchId={selectedBranchId || ""}
          expectedBalance={activeSession.openingBalance}
          onCloseSuccess={() => refetchSession()}
        />
      )}

      {/* POS Dialogs */}
      <CalculatorDialog />
      <ShortcutsDialog />
      <FilterDialog />
      <VariantPickerDialog />
      <RecentTransactionsDialog />

      {/* Sale Edit Dialog */}
      <SaleDialog
        sale={saleToEdit}
        open={isSaleDialogOpen}
        onOpenChange={(open) => {
          setIsSaleDialogOpen(open)
          if (!open) {
            setSaleToEdit(null)
          }
        }}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={() => {
          if (saleToDelete) {
            deleteSaleMutation.mutate(saleToDelete.id, {
              onSuccess: () => {
                setIsDeleteDialogOpen(false)
                setSaleToDelete(null)
                toast.success("Transaction deleted successfully")
              },
            })
          }
        }}
        title="Delete Transaction"
        description={`Are you sure you want to delete transaction ${saleToDelete?.invoiceNumber || saleToDelete?.id}? This action cannot be undone.`}
      />

      {/* Product Dialog */}
      <ProductDialog
        product={null}
        open={showProductDialog}
        onOpenChange={setShowProductDialog}
      />

      {/* Invoice Dialog */}
      <InvoiceDialog
        sale={completedSale}
        open={showInvoice}
        onOpenChange={setShowInvoice}
        onOpenRecentTransactions={() => {
          setShowInvoice(false)
          setShowRecentTransactions(true)
        }}
      />

      {/* Contact Creation Dialog */}
      <ContactDialog
        open={isContactDialogOpen}
        onOpenChange={setIsContactDialogOpen}
        contact={null}
        onSuccess={(newContact) => {
          setSelectedContactId(newContact.id)
        }}
      />
    </div>
  )
}