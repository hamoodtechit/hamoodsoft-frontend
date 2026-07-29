"use client";

import { useEffect, useRef } from "react";

import { usePOS, type PaymentMethod, type SaleType } from "./pos-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/ui/numeric-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  CreditCard,
  Plus,
  Receipt,
  Save,
  Trash2,
  UserPlus,
} from "lucide-react";

export function CheckoutDrawer() {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    cart,
    cartTotals,
    taxRate,
    contacts,
    selectedContactId,
    setSelectedContactId,
    setIsContactDialogOpen,
    saleType,
    setSaleType,
    discountType,
    setDiscountType,
    discountAmount,
    setDiscountAmount,
    setTaxRate,
    paymentMethod,
    setPaymentMethod,
    paidAmountInput,
    setPaidAmountInput,
    cashAccountId,
    setCashAccountId,
    bankAccountId,
    setBankAccountId,
    cashAccounts,
    bankAccounts,
    accounts,
    paymentSplits,
    setPaymentSplits,
    addPaymentSplit,
    removePaymentSplit,
    updatePaymentSplit,
    isProcessing,
    handleCheckout,
  } = usePOS();

  const paidAmountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCheckoutOpen) {
      const timer = setTimeout(() => {
        if (paymentMethod !== "CREDIT" && paymentMethod !== "MIXED" && saleType !== "DRAFT") {
          paidAmountRef.current?.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isCheckoutOpen, paymentMethod, saleType]);



  const selectedContact = contacts.find((c) => c.id === selectedContactId);

  let cashPaid = 0;
  if (paymentMethod === "CREDIT") {
    cashPaid = 0;
  } else if (paymentMethod === "MIXED") {
    cashPaid = paymentSplits.reduce((acc, s) => acc + (s.amount || 0), 0);
  } else {
    cashPaid = paidAmountInput;
  }

  const unpaidAmount = Math.max(0, cartTotals.total - cashPaid);
  const availableCredit = selectedContact
    ? (selectedContact.balance || 0) + (selectedContact.creditLimit || 0)
    : 0;
  const isCreditExceeded =
    unpaidAmount > 0 && selectedContact && unpaidAmount > availableCredit;

  const handleDrawerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA") return;
      
      // Stop the Enter key from submitting random buttons if focused on them
      if (target.tagName !== "BUTTON") {
        e.preventDefault();
      }
      
      // Only proceed if valid
      if (cart.length > 0 && !isProcessing && !isCreditExceeded) {
        handleCheckout();
      }
    }
  };

  return (
    <Sheet open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
      <SheetTrigger asChild>
        <Button
          className="w-full h-12 text-lg font-bold shadow-lg transition-all active:scale-[0.98] bg-primary hover:bg-primary/90"
          disabled={cart.length === 0}
          onClick={() => setIsCheckoutOpen(true)}
        >
          <CreditCard className="mr-2 h-5 w-5" />
          Review & Pay
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col p-0 gap-0"
        onKeyDown={handleDrawerKeyDown}
      >
        <SheetHeader className="p-4 border-b bg-secondary/10 flex-shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            Checkout Details
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 min-h-0 custom-scrollbar">
          {/* Customer Selection and Sale Type */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Customer
                </Label>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-primary hover:bg-primary/10"
                  onClick={() => setIsContactDialogOpen(true)}
                >
                  <UserPlus className="h-3 w-3" />
                </Button>
              </div>
              <Select
                value={selectedContactId}
                onValueChange={setSelectedContactId}
              >
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder="Walk-in Customer" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedContact && (
                <div className="mt-2 text-xs p-2 rounded-md bg-muted/50 border">
                  <div className="flex justify-between text-muted-foreground mb-1">
                    <span>Balance:</span>
                    <span
                      className={
                        selectedContact.balance < 0
                          ? "text-destructive font-medium"
                          : "text-emerald-500 font-medium"
                      }
                    >
                      {selectedContact.balance.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground mb-1">
                    <span>Credit Limit:</span>
                    <span>{selectedContact.creditLimit.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t border-border pt-1 mt-1">
                    <span>Available Credit:</span>
                    <span
                      className={
                        availableCredit < 0
                          ? "text-destructive"
                          : "text-emerald-500"
                      }
                    >
                      {availableCredit.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Sale Type
              </Label>
              <Select
                value={saleType}
                onValueChange={(v: SaleType) => setSaleType(v)}
              >
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CARD">Direct Sale</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="QUOTATION">Quotation</SelectItem>
                  <SelectItem value="SUSPEND">Suspended (Hold)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sale Discount & Tax */}
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Global Sale Adjustment
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">
                  Discount Type
                </Label>
                <Select
                  value={discountType}
                  onValueChange={(v: "NONE" | "PERCENTAGE" | "FIXED") => {
                    setDiscountType(v);
                    if (v === "NONE") setDiscountAmount(0);
                  }}
                >
                  <SelectTrigger className="h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">None</SelectItem>
                    <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                    <SelectItem value="FIXED">Flat Target</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">
                  Discount Value
                </Label>
                <NumericInput
                  placeholder="Value"
                  className="h-10 text-sm"
                  value={discountType === "NONE" ? 0 : discountAmount}
                  disabled={discountType === "NONE"}
                  onValueChange={setDiscountAmount}
                />
              </div>
            </div>
            <div className="pt-2">
              <Label className="text-[10px] text-muted-foreground block mb-1">
                Global Tax (VAT %)
              </Label>
              <NumericInput
                value={taxRate}
                onValueChange={setTaxRate}
                className="h-10 w-full text-sm"
              />
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Payment Method
                </Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(v: PaymentMethod) => {
                    setPaymentMethod(v);
                    if (v === "MIXED" && paymentSplits.length === 0) {
                      setPaymentSplits([
                        { id: "1", accountId: "", amount: cartTotals.total },
                      ]);
                    }
                  }}
                >
                  <SelectTrigger className="h-10 text-sm">
                    <SelectValue placeholder="Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="CARD">Card</SelectItem>
                    <SelectItem value="CREDIT">Credit</SelectItem>
                    <SelectItem value="MIXED">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Amount Paid
                </Label>
                <NumericInput
                  ref={paidAmountRef}
                  value={
                    paymentMethod === "CREDIT" || saleType === "DRAFT"
                      ? 0
                      : paidAmountInput
                  }
                  // onValueChange={setPaidAmountInput}
                  onValueChange={(val) => setPaidAmountInput(Math.min(val, cartTotals.total))}
                  disabled={
                    paymentMethod === "CREDIT" ||
                    paymentMethod === "MIXED" ||
                    saleType === "DRAFT"
                  }
                  className="h-10 text-base font-bold border-primary/20 text-primary"
                />
              </div>
            </div>

            {(paymentMethod === "CASH" || paymentMethod === "CARD") &&
              accounts.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Target Account
                  </Label>
                  <Select
                    value={
                      paymentMethod === "CASH" ? cashAccountId : bankAccountId
                    }
                    onValueChange={
                      paymentMethod === "CASH"
                        ? setCashAccountId
                        : setBankAccountId
                    }
                  >
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue placeholder="Select Account" />
                    </SelectTrigger>
                    <SelectContent>
                      {(paymentMethod === "CASH"
                        ? cashAccounts
                        : bankAccounts
                      ).map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name} ({acc.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

            {/* Mixed Payment Splits */}
            {paymentMethod === "MIXED" && (
              <div className="pt-2 border-t border-dashed space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                    Payment Splits
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    onClick={addPaymentSplit}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
                <div className="space-y-2 py-1">
                  {paymentSplits.map((split) => (
                    <div key={split.id} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Select
                          value={split.accountId}
                          onValueChange={(v) =>
                            updatePaymentSplit(split.id, { accountId: v })
                          }
                        >
                          <SelectTrigger className="h-10 text-xs">
                            <SelectValue placeholder="Account" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            {accounts.map((acc) => (
                              <SelectItem
                                key={acc.id}
                                value={acc.id}
                                className="text-xs"
                              >
                                {acc.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-24">
                        <NumericInput
                          className="h-10 text-xs px-2"
                          value={split.amount}
                          onValueChange={(val) =>
                            updatePaymentSplit(split.id, { amount: val })
                          }
                          placeholder="Amt"
                        />
                      </div>
                      {paymentSplits.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 text-muted-foreground hover:text-destructive shrink-0 border"
                          onClick={() => removePaymentSplit(split.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                {Math.abs(
                  cartTotals.total -
                    paymentSplits.reduce((acc, s) => acc + s.amount, 0),
                ) > 0.01 && (
                  <div className="text-xs font-medium text-destructive bg-destructive/10 p-2 rounded">
                    Remaining Balance:{" "}
                    {(
                      cartTotals.total -
                      paymentSplits.reduce((acc, s) => acc + s.amount, 0)
                    ).toFixed(2)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer: Totals and Completion */}
        <div className="p-4 border-t bg-foreground text-background shrink-0 mt-auto">
          <div className="space-y-1 mb-4">
            <div className="flex justify-between text-xs opacity-70">
              <span>Subtotal</span>
              <span>{cartTotals.itemsSubtotal.toFixed(2)}</span>
            </div>
            {cartTotals.saleDiscount > 0 && (
              <div className="flex justify-between text-xs text-emerald-400">
                <span>Discount</span>
                <span>-{cartTotals.saleDiscount.toFixed(2)}</span>
              </div>
            )}
            {cartTotals.tax > 0 && (
              <div className="flex justify-between text-xs opacity-70">
                <span>Tax ({taxRate}%)</span>
                <span>{cartTotals.tax.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold border-t border-white/20 pt-1 mt-1">
              <span>Total Payable</span>
              <span>{cartTotals.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span
                className={cn(
                  "text-xs font-black uppercase tracking-widest",
                  paidAmountInput >= cartTotals.total - 0.01
                    ? "text-emerald-400"
                    : "text-rose-400",
                )}
              >
                {paidAmountInput >= cartTotals.total - 0.01
                  ? "Return Change"
                  : "Balance Due"}
              </span>
              <span
                className={cn(
                  "text-xl font-black",
                  paidAmountInput >= cartTotals.total - 0.01
                    ? "text-emerald-400"
                    : "text-rose-400",
                )}
              >
                {Math.abs(paidAmountInput - cartTotals.total).toFixed(2)}
              </span>
            </div>
            {unpaidAmount > 0 && selectedContact && (
              <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                <div className="flex justify-between text-xs opacity-70">
                  <span>Unpaid Amount</span>
                  <span>{unpaidAmount.toFixed(2)}</span>
                </div>
                {isCreditExceeded ? (
                  <div className="text-xs font-medium text-rose-500 bg-rose-500/10 p-2 rounded border border-rose-500/20 break-words">
                    Exceeds available credit of {availableCredit.toFixed(2)}
                  </div>
                ) : (
                  <div className="text-xs font-medium text-emerald-400 bg-emerald-500/10 p-2 rounded border border-emerald-500/20 break-words">
                    Within available credit limit
                  </div>
                )}
              </div>
            )}
          </div>

          <Button
            className={cn(
              "w-full h-14 text-lg font-black shadow-xl transition-all active:scale-[0.98]",
              paidAmountInput < cartTotals.total - 0.01 &&
                cartTotals.total > 0 &&
                saleType === "CARD" &&
                paymentMethod !== "CREDIT"
                ? "bg-rose-500 hover:bg-rose-600 text-white"
                : "bg-emerald-500 hover:bg-emerald-600 text-white",
              isProcessing && "opacity-70 cursor-not-allowed",
            )}
            disabled={
              cart.length === 0 ||
              isProcessing ||
              isCreditExceeded ||
              (paymentMethod === "MIXED" &&
                Math.abs(
                  cartTotals.total -
                    paymentSplits.reduce((acc, s) => acc + s.amount, 0),
                ) > 0.01)
            }
            onClick={() => {
              handleCheckout();
            }}
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                Processing...
              </div>
            ) : (
              <>
                <Save className="mr-3 h-6 w-6" />
                {saleType === "CARD"
                  ? "COMPLETE PAYMENT"
                  : `SAVE AS ${saleType}`}
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
