"use client"

import { useState } from "react"
import { ContactDialog } from "@/components/common/contact-dialog"
import { DeleteConfirmationDialog } from "@/components/common/delete-confirmation-dialog"
import { InvoiceDialog } from "@/components/common/invoice-dialog"
import { PageLayout } from "@/components/common/page-layout"
import { SaleDialog } from "@/components/common/sale-dialog"
import { CloseSessionDialog, OpenSessionDialog } from "@/components/pos/session-dialogs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ArrowRight, ShoppingCart } from "lucide-react"
import { toast } from "sonner"

import { POSProvider, usePOS } from "./_components/pos-provider"
import { POSHeader } from "./_components/pos-header"
import { POSToolbar } from "./_components/pos-toolbar"
import { CategoryBar } from "./_components/category-bar"
import { ProductGrid } from "./_components/product-grid"
import { CartPanel, CartContentView } from "./_components/cart-panel"
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
  const [showMobileCart, setShowMobileCart] = useState(false)
  const {
    currentBusiness,
    cart, cartTotals,
    // Session
    activeSession, isLoadingSession, refetchSession,
    selectedBranchId, showCloseSession, setShowCloseSession,
    // Dialogs
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
    <div className="flex flex-col h-screen bg-background overflow-hidden relative">
      {/* Header */}
      <POSHeader />

      {/* Main Content */}
      <div className="flex-1 p-2 sm:p-4 md:p-6 lg:p-8 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 h-full">
          {/* Left Panel - Filters and Products */}
          <div className="col-span-full lg:col-span-8 flex flex-col space-y-3 sm:space-y-4 min-h-0 h-full pb-16 lg:pb-0">
            <POSToolbar />
            <CategoryBar />
            <ProductGrid />
          </div>

          {/* Right Panel - Cart (Desktop) */}
          <CartPanel />
        </div>
      </div>

      {/* Mobile Sticky Floating Cart Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t p-3 shadow-xl flex items-center justify-between lg:hidden">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-2 bg-primary/10 rounded-full text-primary">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <Badge className="absolute -top-1 -right-1 px-1.5 py-0 text-[10px] h-4 min-w-4 flex items-center justify-center bg-primary text-primary-foreground font-bold shadow-xs">
              {cart.length}
            </Badge>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground font-medium">{cart.length} {cart.length === 1 ? 'item' : 'items'} in cart</span>
            <span className="text-base font-black text-primary">${cartTotals.total.toFixed(2)}</span>
          </div>
        </div>

        <Sheet open={showMobileCart} onOpenChange={setShowMobileCart}>
          <SheetTrigger asChild>
            <Button size="sm" className="font-semibold shadow-sm gap-2 h-9 px-4 bg-primary hover:bg-primary/90 text-primary-foreground">
              <span>View Cart / Pay</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] p-3 flex flex-col gap-0 rounded-t-2xl">
            <SheetHeader className="pb-2 border-b mb-2 text-left shrink-0">
              <SheetTitle className="flex items-center gap-2 text-base">
                <ShoppingCart className="w-4 h-4 text-primary" />
                Mobile Cart & Checkout
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 min-h-0 overflow-hidden">
              <CartContentView />
            </div>
          </SheetContent>
        </Sheet>
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