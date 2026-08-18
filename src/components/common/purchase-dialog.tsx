"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/ui/numeric-input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { useBranchSelection } from "@/lib/hooks/use-branch-selection";
import { useBranches } from "@/lib/hooks/use-branches";
import { useContacts } from "@/lib/hooks/use-contacts";
import { useProducts } from "@/lib/hooks/use-products";
import { useFuelTypes } from "@/lib/hooks/use-fuel-types";
import { useTankers } from "@/lib/hooks/use-tankers";
import {
  useCreatePurchase,
  useUpdatePurchase,
} from "@/lib/hooks/use-purchases";
import { useUnits } from "@/lib/hooks/use-units";
import { cn } from "@/lib/utils";
import {
  createPurchaseSchema,
  updatePurchaseSchema,
  type CreatePurchaseInput,
  type UpdatePurchaseInput,
} from "@/lib/validations/purchases";
import { Purchase, FuelType, Tanker } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, Droplets, Package, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { ModalWrapper } from "@/components/common/modal-wrapper";
import { toast } from "sonner";

// ─── Fuel item state type (client-side only, not sent to API directly) ───
interface FuelItemState {
  id: string;
  fuelTypeId: string;
  fuelTypeName: string;
  costPrice: number;
  quantity: number; // total quantity (liters)
  tankerAllocations: {
    id: string;
    tankerId: string;
    tankerName: string;
    quantity: number;
  }[];
}

// ─── Validation error tracking for fuel items ───
interface FuelItemErrors {
  fuelTypeId?: string;
  costPrice?: string;
  quantity?: string;
  tankerAllocations?: string;
  allocations?: Record<number, { tankerId?: string; quantity?: string }>;
}

interface PurchaseDialogProps {
  purchase: Purchase | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PurchaseDialog({
  purchase,
  open,
  onOpenChange,
}: PurchaseDialogProps) {
  const t = useTranslations("purchases");
  const tCommon = useTranslations("common");
  const { data: branches = [] } = useBranches();
  const { selectedBranchId } = useBranchSelection();
  const { data: units = [] } = useUnits(selectedBranchId || undefined);
  const { data: contactsData } = useContacts();
  const contacts =
    contactsData?.items?.filter((c) => c.type === "SUPPLIER") || [];
  const { data: accountsData } = useAccounts({ limit: 1000 });
  const accounts = accountsData?.items?.filter((acc) => acc.isActive) || [];
  const createMutation = useCreatePurchase();
  const updateMutation = useUpdatePurchase();

  // Fuel data hooks
  const { data: fuelTypesData } = useFuelTypes();
  const fuelTypes: FuelType[] = fuelTypesData?.items || [];
  const { data: tankersData } = useTankers({ limit: 1000 });
  const tankers: Tanker[] = tankersData?.items || [];

  const isEdit = !!purchase;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const schema = isEdit ? updatePurchaseSchema : createPurchaseSchema;

  // ─── Purchase type toggle (Product vs Fuel) ───
  const [purchaseType, setPurchaseType] = useState<"PRODUCT" | "FUEL">("PRODUCT");

  // ─── Fuel items state (managed outside react-hook-form for flexibility) ───
  const [fuelItems, setFuelItems] = useState<FuelItemState[]>([]);
  const [fuelErrors, setFuelErrors] = useState<Record<number, FuelItemErrors>>({});

  const defaultValues = useMemo(() => {
    if (!purchase) {
      return {
        purchaseType: "PRODUCT" as const,
        branchId: selectedBranchId || "",
        contactId: "",
        items: [
          {
            sku: "",
            itemName: "",
            itemDescription: "",
            unit: "",
            price: 0,
            quantity: 1,
            discountType: "NONE" as const,
            discountAmount: 0,
            totalPrice: 0,
          },
        ],
        status: "PENDING" as const,
        paymentStatus: "DUE" as const,
        paidAmount: 0,
        totalPrice: 0,
        discountType: "NONE" as const,
        discountAmount: 0,
        taxType: "NONE" as const,
        taxRate: 0,
        taxAmount: 0,
      };
    }
    // For update, only include fields that can be updated
    return {
      branchId: purchase.branchId || selectedBranchId || "",
      contactId: purchase.contactId || "",
      status: purchase.status || "PENDING",
      paidAmount: purchase.paidAmount || 0,
      dueAmount: purchase.dueAmount || 0,
    };
  }, [purchase, selectedBranchId]);

  const form = useForm<CreatePurchaseInput | UpdatePurchaseInput>({
    resolver: zodResolver(schema as any),
    defaultValues,
  });

  // Fetch products for selection - watch branchId from form
  const branchId = useWatch({ control: form.control, name: "branchId" });
  const { data: productsData } = useProducts({
    branchId: branchId || selectedBranchId || undefined,
    limit: 1000,
  });
  const products = productsData?.items || [];

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items" as any,
  });

  // Track selected products and popover state for each item
  const [selectedProducts, setSelectedProducts] = useState<
    Record<number, any | null>
  >({});
  const [comboboxOpen, setComboboxOpen] = useState<Record<number, boolean>>({});

  // Payment method and account selection
  type PaymentMethod = "CASH" | "CARD" | "CREDIT" | "MIXED";
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [cashAccountId, setCashAccountId] = useState<string>("");
  const [bankAccountId, setBankAccountId] = useState<string>("");

  // Payment splits for MIXED payment method
  interface PaymentSplit {
    id: string;
    accountId: string;
    amount: number;
  }
  const [paymentSplits, setPaymentSplits] = useState<PaymentSplit[]>([]);

  // Watch paidAmount to auto-calculate dueAmount in edit mode
  const paidAmount = useWatch({
    control: form.control,
    name: "paidAmount" as any,
  });

  const watchedStatus = useWatch({
    control: form.control,
    name: "status" as any,
  });

  // Watch for status changes to auto-allocate tankers for fuel items
  useEffect(() => {
    if (isEdit && purchaseType === "FUEL" && watchedStatus === "COMPLETED") {
      setFuelItems((prevItems) => {
        let changed = false;
        const newItems = prevItems.map((item) => {
          if (item.tankerAllocations.length === 0) {
            const autoTankers = tankers.filter((t) => t.fuelTypeId === item.fuelTypeId);
            if (autoTankers.length > 0) {
              changed = true;
              return {
                ...item,
                tankerAllocations: [
                  {
                    id: `alloc-${Date.now()}-${Math.random()}`,
                    tankerId: autoTankers[0].id,
                    tankerName: autoTankers[0].name,
                    quantity: item.quantity || 0,
                  },
                ],
              };
            }
          }
          return item;
        });
        return changed ? newItems : prevItems;
      });
    }
  }, [watchedStatus, isEdit, purchaseType, tankers]);

  useEffect(() => {
    if (accounts.length > 0) {
      if (!cashAccountId) setCashAccountId(accounts[0].id);
      if (!bankAccountId) setBankAccountId(accounts[0].id);
    }
  }, [accounts, cashAccountId, bankAccountId]);

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
      if (!isEdit) {
        setPurchaseType("PRODUCT");
        setFuelItems([]);
        setFuelErrors({});
        form.setValue("items" as any, [
          {
            sku: "",
            itemName: "",
            itemDescription: "",
            unit: "",
            price: 0,
            quantity: 1,
            discountType: "NONE" as const,
            discountAmount: 0,
            totalPrice: 0,
          },
        ]);
        // Set initial totalPrice
        form.setValue("totalPrice" as any, 0, { shouldValidate: false });
        // Auto-select branch if available
        if (selectedBranchId) {
          form.setValue("branchId", selectedBranchId);
        }
        // Reset product selections
        setSelectedProducts({});
        setComboboxOpen({});
        // Reset payment method and accounts
        setPaymentMethod("CASH");
        setCashAccountId("");
        setBankAccountId("");
        setPaymentSplits([]);
      } else if (purchase && purchase.purchaseType === "FUEL") {
        setPurchaseType("FUEL");
        const fuelMap = new Map<string, FuelItemState>();
        purchase.items?.forEach((item: any) => {
          if (item.itemType === "FUEL" && item.fuelTypeId) {
            const key = `${item.fuelTypeId}-${item.price}`;
            if (!fuelMap.has(key)) {
              fuelMap.set(key, {
                id: `fuel-${Date.now()}-${Math.random()}`,
                fuelTypeId: item.fuelTypeId,
                fuelTypeName: item.itemName,
                costPrice: Number(item.price),
                quantity: 0,
                tankerAllocations: []
              });
            }
            const state = fuelMap.get(key)!;
            state.quantity += Number(item.quantity);
            if (item.tankerId) {
              state.tankerAllocations.push({
                 id: `alloc-${Date.now()}-${Math.random()}`,
                 tankerId: item.tankerId,
                 tankerName: item.itemDescription?.replace("Tanker: ", "") || "",
                 quantity: Number(item.quantity)
              });
            }
          }
        });
        setFuelItems(Array.from(fuelMap.values()));
        setFuelErrors({});
      }
    }
  }, [open, defaultValues, form, isEdit, selectedBranchId, purchase]);

  // ─── Fuel helpers ───

  const addFuelItem = () => {
    setFuelItems((prev) => [
      ...prev,
      {
        id: `fuel-${Date.now()}-${Math.random()}`,
        fuelTypeId: "",
        fuelTypeName: "",
        costPrice: 0,
        quantity: 0,
        tankerAllocations: [],
      },
    ]);
  };

  const removeFuelItem = (index: number) => {
    if (fuelItems.length > 1) {
      setFuelItems((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const updateFuelItem = (index: number, updates: Partial<FuelItemState>) => {
    setFuelItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  };

  const addTankerAllocation = (fuelIndex: number) => {
    setFuelItems((prev) =>
      prev.map((item, i) =>
        i === fuelIndex
          ? {
              ...item,
              tankerAllocations: [
                ...item.tankerAllocations,
                {
                  id: `alloc-${Date.now()}-${Math.random()}`,
                  tankerId: "",
                  tankerName: "",
                  quantity: 0,
                },
              ],
            }
          : item
      )
    );
  };

  const removeTankerAllocation = (fuelIndex: number, allocIndex: number) => {
    setFuelItems((prev) =>
      prev.map((item, i) =>
        i === fuelIndex
          ? {
              ...item,
              tankerAllocations: item.tankerAllocations.filter(
                (_, ai) => ai !== allocIndex
              ),
            }
          : item
      )
    );
  };

  const updateTankerAllocation = (
    fuelIndex: number,
    allocIndex: number,
    updates: { tankerId?: string; tankerName?: string; quantity?: number }
  ) => {
    setFuelItems((prev) =>
      prev.map((item, i) =>
        i === fuelIndex
          ? {
              ...item,
              tankerAllocations: item.tankerAllocations.map((alloc, ai) =>
                ai === allocIndex ? { ...alloc, ...updates } : alloc
              ),
            }
          : item
      )
    );
  };

  // Get tankers that carry a specific fuel type
  const getTankersForFuelType = (fuelTypeId: string) => {
    return tankers.filter((t) => t.fuelTypeId === fuelTypeId);
  };

  // Calculate fuel items total
  const fuelTotal = useMemo(() => {
    return fuelItems.reduce((sum, item) => {
      return sum + (item.quantity || 0) * (item.costPrice || 0);
    }, 0);
  }, [fuelItems]);

  // ─── Fuel validation ───
  const validateFuelItems = (status: string): boolean => {
    const errors: Record<number, FuelItemErrors> = {};
    let hasError = false;
    const isCompleted = status === "COMPLETED";

    for (let i = 0; i < fuelItems.length; i++) {
      const item = fuelItems[i];
      const itemErrors: FuelItemErrors = {};

      if (!item.fuelTypeId) {
        itemErrors.fuelTypeId = "Fuel type is required";
        hasError = true;
      }

      if (!item.costPrice || item.costPrice <= 0) {
        itemErrors.costPrice = "Cost price must be greater than 0";
        hasError = true;
      }

      if (!item.quantity || item.quantity <= 0) {
        itemErrors.quantity = "Quantity must be greater than 0";
        hasError = true;
      }

      // If COMPLETED, tanker allocations are required
      if (isCompleted) {
        if (item.tankerAllocations.length === 0) {
          itemErrors.tankerAllocations = "At least one tanker allocation is required for completed purchases";
          hasError = true;
        } else {
          const allocErrors: Record<number, { tankerId?: string; quantity?: string }> = {};
          let totalAllocQty = 0;
          for (let j = 0; j < item.tankerAllocations.length; j++) {
            const alloc = item.tankerAllocations[j];
            const aErr: { tankerId?: string; quantity?: string } = {};
            if (!alloc.tankerId) {
              aErr.tankerId = "Tanker is required";
              hasError = true;
            }
            if (!alloc.quantity || alloc.quantity <= 0) {
              aErr.quantity = "Quantity must be > 0";
              hasError = true;
            }
            totalAllocQty += (alloc.quantity || 0);
            if (Object.keys(aErr).length > 0) {
              allocErrors[j] = aErr;
            }
          }
          // Allow allocation total to differ from purchased quantity (transport loss/gain)
          if (false && item.quantity > 0 && Math.abs(totalAllocQty - item.quantity) > 0.01) {
            itemErrors.tankerAllocations = `Tanker allocations total (${totalAllocQty.toFixed(2)} L) must equal quantity (${item.quantity.toFixed(2)} L)`;
            hasError = true;
          }
          if (Object.keys(allocErrors).length > 0) {
            itemErrors.allocations = allocErrors;
          }
        }
      }

      if (Object.keys(itemErrors).length > 0) {
        errors[i] = itemErrors;
      }
    }

    setFuelErrors(errors);
    return !hasError;
  };

  // ─── Product submission logic (existing) ───

  const onSubmit = (data: CreatePurchaseInput | UpdatePurchaseInput) => {
    console.log("Purchase form submitted", data);

    if (isEdit && purchase) {
      if (purchaseType === "FUEL") {
        const status = (data as any).status || purchase.status;
        
        // Run inline validation
        if (!validateFuelItems(status)) return;

        // Build purchase items
        const purchaseItems: any[] = [];
        for (const fuelItem of fuelItems) {
          if (fuelItem.tankerAllocations.length > 0) {
            let allocatedQty = 0;
            for (const alloc of fuelItem.tankerAllocations) {
              if (!alloc.tankerId || alloc.quantity <= 0) continue;
              allocatedQty += alloc.quantity;
              purchaseItems.push({
                sku: `FUEL-${fuelItem.fuelTypeId}-${alloc.tankerId}-${Date.now()}`,
                itemName: fuelItem.fuelTypeName || "Fuel",
                itemDescription: alloc.tankerName ? `Tanker: ${alloc.tankerName}` : "",
                unit: "L",
                price: fuelItem.costPrice,
                quantity: alloc.quantity,
                totalPrice: alloc.quantity * fuelItem.costPrice,
                fuelTypeId: fuelItem.fuelTypeId,
                tankerId: alloc.tankerId,
                itemType: "FUEL",
                discountType: "NONE",
                discountAmount: 0,
              });
            }
            const remainingQty = fuelItem.quantity - allocatedQty;
            if (remainingQty > 0) {
              purchaseItems.push({
                sku: `FUEL-${fuelItem.fuelTypeId}-unalloc-${Date.now()}`,
                itemName: fuelItem.fuelTypeName || "Fuel",
                itemDescription: "",
                unit: "L",
                price: fuelItem.costPrice,
                quantity: remainingQty,
                totalPrice: remainingQty * fuelItem.costPrice,
                fuelTypeId: fuelItem.fuelTypeId,
                itemType: "FUEL",
                discountType: "NONE",
                discountAmount: 0,
              });
            }
          } else {
            // No allocations at all
            purchaseItems.push({
              sku: `FUEL-${fuelItem.fuelTypeId}-${Date.now()}`,
              itemName: fuelItem.fuelTypeName || "Fuel",
              itemDescription: "",
              unit: "L",
              price: fuelItem.costPrice,
              quantity: fuelItem.quantity,
              totalPrice: fuelItem.quantity * fuelItem.costPrice,
              fuelTypeId: fuelItem.fuelTypeId,
              itemType: "FUEL",
              discountType: "NONE",
              discountAmount: 0,
            });
          }
        }

        const updateData = {
          ...data,
          items: purchaseItems
        };
        
        updateMutation.mutate(
          { id: purchase.id, data: updateData as unknown as UpdatePurchaseInput },
          { onSuccess: () => onOpenChange(false) }
        );
        return;
      }

      updateMutation.mutate(
        { id: purchase.id, data: data as UpdatePurchaseInput },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        },
      );
      return;
    }

    // ─── FUEL PURCHASE ───
    if (purchaseType === "FUEL") {
      const status = (data as any).status || "PENDING";

      // Run inline validation
      if (!validateFuelItems(status)) {
        return;
      }

      // Build purchase items from fuel items (one PurchaseItem per tanker allocation)
      const purchaseItems: any[] = [];
      for (const fuelItem of fuelItems) {
        if (fuelItem.tankerAllocations.length > 0) {
          let allocatedQty = 0;
          for (const alloc of fuelItem.tankerAllocations) {
            if (!alloc.tankerId || alloc.quantity <= 0) continue;
            allocatedQty += alloc.quantity;
            purchaseItems.push({
              sku: `FUEL-${fuelItem.fuelTypeId}-${alloc.tankerId}-${Date.now()}`,
              itemName: fuelItem.fuelTypeName || "Fuel",
              itemDescription: alloc.tankerName
                ? `Tanker: ${alloc.tankerName}`
                : "",
              unit: "L",
              price: fuelItem.costPrice,
              quantity: alloc.quantity,
              totalPrice: alloc.quantity * fuelItem.costPrice,
              fuelTypeId: fuelItem.fuelTypeId,
              tankerId: alloc.tankerId,
              itemType: "FUEL",
              discountType: "NONE",
              discountAmount: 0,
            });
          }
          const remainingQty = fuelItem.quantity - allocatedQty;
          if (remainingQty > 0) {
            purchaseItems.push({
              sku: `FUEL-${fuelItem.fuelTypeId}-unalloc-${Date.now()}`,
              itemName: fuelItem.fuelTypeName || "Fuel",
              itemDescription: "",
              unit: "L",
              price: fuelItem.costPrice,
              quantity: remainingQty,
              totalPrice: remainingQty * fuelItem.costPrice,
              fuelTypeId: fuelItem.fuelTypeId,
              itemType: "FUEL",
              discountType: "NONE",
              discountAmount: 0,
            });
          }
        } else {
          // No allocations at all
          purchaseItems.push({
            sku: `FUEL-${fuelItem.fuelTypeId}-${Date.now()}`,
            itemName: fuelItem.fuelTypeName || "Fuel",
            itemDescription: "",
            unit: "L",
            price: fuelItem.costPrice,
            quantity: fuelItem.quantity,
            totalPrice: fuelItem.quantity * fuelItem.costPrice,
            fuelTypeId: fuelItem.fuelTypeId,
            itemType: "FUEL",
            discountType: "NONE",
            discountAmount: 0,
          });
        }
      }

      if (purchaseItems.length === 0) {
        toast.error("Please add at least one fuel item with quantity");
        return;
      }

      // Calculate totals
      const itemsTotal = purchaseItems.reduce(
        (sum, item) => sum + (item.totalPrice || 0),
        0
      );
      
      const taxType = (data as any).taxType || "NONE";
      const taxRate = (data as any).taxRate || 0;
      const taxAmount = (data as any).taxAmount || 0;

      let tax = 0;
      if (taxType === "PERCENTAGE" && taxRate) {
        tax = (itemsTotal * taxRate) / 100;
      } else if (taxType === "FIXED" && taxAmount) {
        tax = taxAmount;
      }

      const grandTotal = itemsTotal + tax;

      // Build payments (same logic as product)
      const payments = buildPayments(data, grandTotal);
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      let paymentStatus: "PAID" | "DUE" | "PARTIAL" = "DUE";
      if (totalPaid >= grandTotal) paymentStatus = "PAID";
      else if (totalPaid > 0) paymentStatus = "PARTIAL";

      const purchaseData: any = {
        purchaseType: "FUEL",
        branchId: (data as CreatePurchaseInput).branchId,
        contactId: (data as CreatePurchaseInput).contactId,
        status,
        items: purchaseItems,
        payments: payments.length > 0 ? payments : undefined,
        totalPrice: grandTotal,
        taxType,
        taxRate: taxType === "PERCENTAGE" ? taxRate : undefined,
        taxAmount: taxType === "FIXED" ? taxAmount : tax,
        paidAmount: totalPaid,
        paymentStatus,
      };

      createMutation.mutate(purchaseData, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset(defaultValues);
          setFuelItems([]);
          setFuelErrors({});
        },
      });
      return;
    }

    // ─── PRODUCT PURCHASE (existing logic) ───
    const items = (data as CreatePurchaseInput).items || [];
    const calculatedItems = items.map((item: any, index: number) => {
      if (!item.sku || item.sku.trim() === "") {
        item.sku = `SKU-${Date.now()}-${index}`;
      }

      const discountType = item.discountType || "NONE";
      const discountAmount = item.discountAmount || 0;

      const baseTotal = (item.price || 0) * (item.quantity || 0);
      let itemTotal = baseTotal;

      if (discountType === "PERCENTAGE" && discountAmount) {
        itemTotal = baseTotal * (1 - discountAmount / 100);
      } else if (discountType === "FIXED" && discountAmount) {
        itemTotal = Math.max(0, baseTotal - discountAmount);
      }

      return {
        ...item,
        sku: item.sku,
        discountType,
        discountAmount,
        totalPrice: itemTotal,
      };
    });

    const itemsTotal = calculatedItems.reduce(
      (sum, item) => sum + (item.totalPrice || 0),
      0,
    );
    const purchaseDiscountType = (data as any).discountType || "NONE";
    const purchaseDiscountAmount = (data as any).discountAmount || 0;

    let purchaseTotal = itemsTotal;
    if (purchaseDiscountType === "PERCENTAGE" && purchaseDiscountAmount) {
      purchaseTotal = itemsTotal * (1 - purchaseDiscountAmount / 100);
    } else if (purchaseDiscountType === "FIXED" && purchaseDiscountAmount) {
      purchaseTotal = Math.max(0, itemsTotal - purchaseDiscountAmount);
    }

    const taxType = (data as any).taxType || "NONE";
    const taxRate = (data as any).taxRate || 0;
    const taxAmount = (data as any).taxAmount || 0;

    let tax = 0;
    if (taxType === "PERCENTAGE" && taxRate) {
      tax = (purchaseTotal * taxRate) / 100;
    } else if (taxType === "FIXED" && taxAmount) {
      tax = taxAmount;
    }

    purchaseTotal = purchaseTotal + tax;

    // Build payments
    const payments = buildPayments(data, purchaseTotal);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    let paymentStatus: "PAID" | "DUE" | "PARTIAL" = "DUE";
    if (totalPaid >= purchaseTotal) {
      paymentStatus = "PAID";
    } else if (totalPaid > 0) {
      paymentStatus = "PARTIAL";
    }

    const purchaseData: any = {
      ...(data as CreatePurchaseInput),
      purchaseType: "PRODUCT",
      items: calculatedItems,
      payments: payments.length > 0 ? payments : undefined,
      totalPrice: purchaseTotal,
      taxType,
      taxRate: taxType === "PERCENTAGE" ? taxRate : undefined,
      taxAmount: taxType === "FIXED" ? taxAmount : tax,
      paidAmount: totalPaid,
      paymentStatus,
    };

    createMutation.mutate(purchaseData, {
      onSuccess: () => {
        onOpenChange(false);
        form.reset(defaultValues);
      },
    });
  };

  // ─── Build payments array (shared between product and fuel) ───
  function buildPayments(data: any, totalAmount: number) {
    const payments: Array<{
      type: "PURCHASE_PAYMENT";
      accountId: string;
      amount: number;
      branchId?: string;
      contactId?: string;
      note?: string;
    }> = [];

    const paymentAmountToUse =
      data.paidAmount !== undefined
        ? Number(data.paidAmount)
        : totalAmount;

    if (paymentAmountToUse <= 0) {
      return [];
    }

    if (paymentAmountToUse > 0) {
      if (paymentMethod === "CASH" && !cashAccountId) {
        toast.error(
          tCommon("error") + ": Please select an account for cash payment",
        );
        return [];
      }
      if (paymentMethod === "CARD" && !bankAccountId) {
        toast.error(
          tCommon("error") + ": Please select an account for card payment",
        );
        return [];
      }
      if (
        paymentMethod === "MIXED" &&
        (!paymentSplits || paymentSplits.length === 0)
      ) {
        toast.error(
          tCommon("error") +
          ": Please distribute the payment amount among accounts",
        );
        return [];
      }
    }

    if (paymentMethod === "CASH" && cashAccountId) {
      payments.push({
        accountId: cashAccountId,
        amount: paymentAmountToUse,
        type: "PURCHASE_PAYMENT",
        branchId: data.branchId,
        contactId: data.contactId,
      });
    } else if (paymentMethod === "CARD" && bankAccountId) {
      payments.push({
        accountId: bankAccountId,
        amount: paymentAmountToUse,
        type: "PURCHASE_PAYMENT",
        branchId: data.branchId,
        contactId: data.contactId,
      });
    } else if (paymentMethod === "MIXED" && paymentSplits.length > 0) {
      paymentSplits.forEach((split) => {
        if (split.accountId && split.amount > 0) {
          payments.push({
            accountId: split.accountId,
            amount: split.amount,
            type: "PURCHASE_PAYMENT",
            branchId: data.branchId,
            contactId: data.contactId,
          });
        }
      });
    }

    return payments;
  }

  const addItem = () => {
    const newIndex = fields.length;
    append({
      sku: "",
      itemName: "",
      itemDescription: "",
      unit: "",
      price: 0,
      quantity: 1,
      discountType: "NONE" as const,
      discountAmount: 0,
      totalPrice: 0,
    });
    setSelectedProducts((prev) => ({ ...prev, [newIndex]: null }));
    setComboboxOpen((prev) => ({ ...prev, [newIndex]: false }));
  };

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
      setSelectedProducts((prev) => {
        const updated = { ...prev };
        delete updated[index];
        const reindexed: Record<number, any> = {};
        Object.keys(updated).forEach((key) => {
          const oldIndex = parseInt(key);
          if (oldIndex > index) {
            reindexed[oldIndex - 1] = updated[oldIndex];
          } else if (oldIndex < index) {
            reindexed[oldIndex] = updated[oldIndex];
          }
        });
        return reindexed;
      });
      setComboboxOpen((prev) => {
        const updated = { ...prev };
        delete updated[index];
        const reindexed: Record<number, boolean> = {};
        Object.keys(updated).forEach((key) => {
          const oldIndex = parseInt(key);
          if (oldIndex > index) {
            reindexed[oldIndex - 1] = updated[oldIndex];
          } else if (oldIndex < index) {
            reindexed[oldIndex] = updated[oldIndex];
          }
        });
        return reindexed;
      });
    }
  };

  // Calculate item total price (price * quantity - discount)
  const calculateItemTotal = (item: any) => {
    if (!item || typeof item !== "object") return 0;
    const subtotal = (item.price || 0) * (item.quantity || 0);
    const discountType = item.discountType || "NONE";
    const discountAmount = item.discountAmount || 0;
    let discount = 0;
    if (discountType === "PERCENTAGE") {
      discount = (subtotal * discountAmount) / 100;
    } else if (discountType === "FIXED") {
      discount = discountAmount;
    }
    return Math.max(0, subtotal - discount);
  };

  const calculateTotal = () => {
    if (isEdit) return null;

    // For fuel purchases, use fuel total
    if (purchaseType === "FUEL") {
      const taxType = form.watch("taxType" as any) || "NONE";
      const taxRate = form.watch("taxRate" as any) || 0;
      const taxAmountVal = form.watch("taxAmount" as any) || 0;

      let tax = 0;
      if (taxType === "PERCENTAGE") {
        tax = (fuelTotal * taxRate) / 100;
      } else if (taxType === "FIXED") {
        tax = taxAmountVal;
      }
      return fuelTotal + tax;
    }

    // For product purchases
    const items = form.watch("items" as any) || [];
    const purchaseDiscountType = form.watch("discountType" as any) || "NONE";
    const purchaseDiscountAmount = form.watch("discountAmount" as any) || 0;

    const itemsTotal = items.reduce((sum: number, item: any) => {
      return sum + calculateItemTotal(item);
    }, 0);

    let discount = 0;
    if (purchaseDiscountType === "PERCENTAGE") {
      discount = (itemsTotal * purchaseDiscountAmount) / 100;
    } else if (purchaseDiscountType === "FIXED") {
      discount = purchaseDiscountAmount;
    }

    const purchaseSubtotal = Math.max(0, itemsTotal - discount);

    const taxType = form.watch("taxType" as any) || "NONE";
    const taxRate = form.watch("taxRate" as any) || 0;
    const taxAmountVal = form.watch("taxAmount" as any) || 0;

    let tax = 0;
    if (taxType === "PERCENTAGE") {
      tax = (purchaseSubtotal * taxRate) / 100;
    } else if (taxType === "FIXED") {
      tax = taxAmountVal;
    }

    return purchaseSubtotal + tax;
  };

  const total = calculateTotal();

  // Auto-calculate dueAmount when paidAmount changes
  useEffect(() => {
    const totalAmount =
      isEdit && purchase
        ? purchase.totalPrice || purchase.totalAmount || 0
        : total || 0;
    const newPaidAmount = paidAmount || 0;
    const newDueAmount = Math.max(0, totalAmount - newPaidAmount);
    form.setValue("dueAmount" as any, newDueAmount, { shouldValidate: false });
  }, [paidAmount, isEdit, purchase, total, form]);

  // Watch items to update totalPrice
  const watchedItems = form.watch("items" as any) || [];
  const watchedDiscountType = form.watch("discountType" as any) || "NONE";
  const watchedDiscountAmount = form.watch("discountAmount" as any) || 0;
  const watchedContactId = form.watch("contactId" as any);
  const selectedContact = contacts.find((c) => c.id === watchedContactId);

  // Compute how much is unpaid
  let cashPaid = 0;
  if (paymentMethod === "MIXED") {
    cashPaid = paymentSplits.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  } else if (paymentMethod === "CREDIT") {
    cashPaid = 0;
  } else {
    cashPaid = Number(paidAmount) || 0;
  }

  const dueAmount = isEdit
    ? Number(form.watch("dueAmount" as any) || 0)
    : total !== null
      ? Math.max(0, total - cashPaid)
      : 0;

  const availableCredit = selectedContact
    ? (selectedContact.balance || 0) + (selectedContact.creditLimit || 0)
    : 0;
  const isCreditExceeded =
    !isEdit && dueAmount > 0 && selectedContact && dueAmount > availableCredit;

  // Update item totalPrice when item fields change
  useEffect(() => {
    if (!isEdit && purchaseType === "PRODUCT") {
      watchedItems.forEach((item: any, index: number) => {
        const itemTotal = calculateItemTotal(item);
        form.setValue(`items.${index}.totalPrice` as any, itemTotal, {
          shouldValidate: false,
        });
      });
    }
  }, [watchedItems, form, isEdit, purchaseType]);

  // Update purchase totalPrice when items or discount change
  useEffect(() => {
    if (!isEdit && total !== null) {
      form.setValue("totalPrice" as any, total, { shouldValidate: false });
    }
  }, [total, form, isEdit]);

  // Initialize fuel items when switching to FUEL mode
  useEffect(() => {
    if (purchaseType === "FUEL" && fuelItems.length === 0) {
      addFuelItem();
    }
  }, [purchaseType]);

  return (
    <ModalWrapper
      open={open}
      onOpenChange={onOpenChange}
      size="5xl"
      contentClassName="max-h-[90vh] flex flex-col p-0 overflow-hidden"
    >
      <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
        <DialogTitle className="flex items-center gap-2">
          {purchaseType === "FUEL" ? (
            <Droplets className="h-5 w-5" />
          ) : (
            <Package className="h-5 w-5" />
          )}
          {isEdit ? t("editPurchase") : t("createPurchase")}
        </DialogTitle>
        <DialogDescription>
          {isEdit ? t("editDescription") : t("createDescription")}
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            
            if (!isEdit && purchaseType === "FUEL") {
              // For fuel: validate only common fields, skip items validation
              const commonFieldsValid = await form.trigger(["branchId", "contactId", "status"] as any);
              if (!commonFieldsValid) return;
              
              // Get form values and run fuel-specific submission
              const data = form.getValues();
              onSubmit(data as any);
            } else {
              // For product/edit: use standard form submission with full Zod validation
              form.handleSubmit(onSubmit, (errors) => {
                console.log("Form validation errors:", errors);
              })(e);
            }
          }}
          className="flex flex-col flex-1 min-h-0"
        >
          <ScrollArea className="h-[calc(90vh-220px)]">
            <div className="px-6 pb-6 space-y-4">
              {/* ─── Purchase Type Toggle (create mode only) ─── */}
              {!isEdit && (
                <div className="flex items-center gap-2 p-1 rounded-lg bg-muted w-fit">
                  <Button
                    type="button"
                    variant={purchaseType === "PRODUCT" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      setPurchaseType("PRODUCT");
                      // Restore default product item when switching back
                      form.setValue("items" as any, [
                        {
                          sku: "",
                          itemName: "",
                          itemDescription: "",
                          unit: "",
                          price: 0,
                          quantity: 1,
                          discountType: "NONE" as const,
                          discountAmount: 0,
                          totalPrice: 0,
                        },
                      ]);
                      form.clearErrors("items" as any);
                    }}
                    className="gap-2"
                  >
                    <Package className="h-4 w-4" />
                    {t("productPurchase")}
                  </Button>
                  <Button
                    type="button"
                    variant={purchaseType === "FUEL" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      setPurchaseType("FUEL");
                      // Clear product items so Zod doesn't validate them
                      form.setValue("items" as any, []);
                      form.clearErrors("items" as any);
                      setFuelErrors({});
                    }}
                    className="gap-2"
                  >
                    <Droplets className="h-4 w-4" />
                    {t("fuelPurchase")}
                  </Button>
                </div>
              )}

              {/* ─── Common Fields: Branch, Contact, Status ─── */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="branchId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("branch")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("selectBranch")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {branches.map((branch) => (
                            <SelectItem key={branch.id} value={branch.id}>
                              {branch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("contact")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isEdit}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("selectContact")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {contacts.map((contact) => (
                            <SelectItem key={contact.id} value={contact.id}>
                              {contact.name}{" "}
                              {contact.email ? `(${contact.email})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>


{/* 
                      {selectedContact && !isEdit && (
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
                            <span>
                              {selectedContact.creditLimit.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between font-medium border-t pt-1 mt-1">
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
                      )} */}





                      {/* Supplier balance/credit info hidden per business requirement */}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("status")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || "PENDING"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ORDERED">
                            {t("statusOrdered") || "Ordered"}
                          </SelectItem>
                          <SelectItem value="PENDING">
                            {t("statusPending") || "Pending"}
                          </SelectItem>
                          <SelectItem value="COMPLETED">
                            {t("statusCompleted") || "Completed"}
                          </SelectItem>
                          <SelectItem value="CANCELLED">
                            {t("statusCancelled") || "Cancelled"}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* ─── FUEL ITEMS SECTION ─── */}
              {purchaseType === "FUEL" && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">
                      {t("fuelItems")}
                    </Label>
                    {!isEdit && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addFuelItem}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {t("addFuelItem")}
                      </Button>
                    )}
                  </div>

                  {fuelItems.map((fuelItem, fuelIndex) => {
                    const matchingTankers = getTankersForFuelType(
                      fuelItem.fuelTypeId
                    );
                    const itemErrors = fuelErrors[fuelIndex];
                    const isCompleted = watchedStatus === "COMPLETED";
                    const allocTotalQty = fuelItem.tankerAllocations.reduce(
                      (s, a) => s + (a.quantity || 0),
                      0
                    );

                    return (
                      <div
                        key={fuelItem.id}
                        className={cn(
                          "p-4 border rounded-lg space-y-4 bg-muted/50 relative",
                          itemErrors && "border-destructive/50"
                        )}
                      >
                        <div className="absolute top-2 right-2">
                          {fuelItems.length > 1 && !isEdit && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFuelItem(fuelIndex)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        {/* Row 1: Fuel Type + Cost Price + Quantity */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                          {/* Fuel Type */}
                          <div className="space-y-2">
                            <Label className="text-sm">
                              {t("fuelType")} <span className="text-destructive">*</span>
                            </Label>
                            <Select
                              value={fuelItem.fuelTypeId}
                              disabled={isEdit}
                              onValueChange={(val) => {
                                const ft = fuelTypes.find((f) => f.id === val);
                                // Auto-fill costPrice from fuel type
                                const autoTankers = tankers.filter((t) => t.fuelTypeId === val);
                                // Auto-create one tanker allocation if tankers available
                                const autoAllocations = autoTankers.length > 0
                                  ? [{
                                      id: `alloc-${Date.now()}-${Math.random()}`,
                                      tankerId: autoTankers[0].id,
                                      tankerName: autoTankers[0].name,
                                      quantity: fuelItem.quantity || 0,
                                    }]
                                  : [];
                                updateFuelItem(fuelIndex, {
                                  fuelTypeId: val,
                                  fuelTypeName: ft?.name || "",
                                  costPrice: ft?.costPrice || 0,
                                  tankerAllocations: autoAllocations,
                                });
                                // Clear this field's error
                                setFuelErrors((prev) => {
                                  const updated = { ...prev };
                                  if (updated[fuelIndex]) {
                                    delete updated[fuelIndex].fuelTypeId;
                                  }
                                  return updated;
                                });
                              }}
                            >
                              <SelectTrigger
                                className={cn(
                                  itemErrors?.fuelTypeId && "border-destructive ring-destructive"
                                )}
                              >
                                <SelectValue
                                  placeholder={t("selectFuelType")}
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {fuelTypes.map((ft) => (
                                  <SelectItem key={ft.id} value={ft.id}>
                                    {ft.name} — Sell: ৳{ft.price}/L | Cost: ৳{ft.costPrice ?? 0}/L
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {itemErrors?.fuelTypeId && (
                              <p className="text-[0.8rem] font-medium text-destructive">
                                {itemErrors.fuelTypeId}
                              </p>
                            )}
                          </div>




                          {/* Cost Price — read-only display */}
                          <div className="space-y-2 flex flex-col justify-center">
                            <Label className="text-sm text-muted-foreground">{t("costPrice")}</Label>
                            <div className="font-medium text-base">
                              {fuelItem.costPrice !== undefined && fuelItem.fuelTypeId ? `৳${fuelItem.costPrice.toFixed(2)}` : "—"}
                            </div>
                          </div>

                          {/* Quantity (Liters) */}
                          <div className="space-y-2">
                            <Label className="text-sm">
                              {t("quantity")} ({t("liters")}) <span className="text-destructive">*</span>
                            </Label>
                            <NumericInput
                              value={fuelItem.quantity}
                              disabled={isEdit}
                              onValueChange={(val) => {
                                updateFuelItem(fuelIndex, { quantity: val });
                                setFuelErrors((prev) => {
                                  const updated = { ...prev };
                                  if (updated[fuelIndex]) {
                                    delete updated[fuelIndex].quantity;
                                  }
                                  return updated;
                                });
                              }}
                              min={0}
                              className={cn(
                                itemErrors?.quantity && "border-destructive ring-destructive"
                              )}
                            />
                            {itemErrors?.quantity && (
                              <p className="text-[0.8rem] font-medium text-destructive">
                                {itemErrors.quantity}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Subtotal row */}
                        {fuelItem.quantity > 0 && fuelItem.costPrice > 0 && (
                          <div className="flex justify-end items-center text-sm">
                            <span className="text-muted-foreground mr-2">
                              {t("subtotal")}:
                            </span>
                            <span className="font-bold text-base">
                              {(fuelItem.quantity * fuelItem.costPrice).toFixed(2)}
                            </span>
                          </div>
                        )}

                        {/* Tanker Allocations (always visible when fuel type is selected) */}
                        {fuelItem.fuelTypeId && (
                          <div className="space-y-3 border-t pt-3">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium">
                                {t("tankerAllocations")}
                                {isCompleted && (
                                  <span className="text-destructive ml-1">*</span>
                                )}
                              </Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addTankerAllocation(fuelIndex)}
                                disabled={matchingTankers.length === 0}
                                className="h-7 text-xs"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                {t("addTankerAllocation")}
                              </Button>
                            </div>

                            {matchingTankers.length === 0 && (
                              <p className="text-xs text-muted-foreground text-center py-2">
                                No tankers found for this fuel type. Create a
                                tanker first.
                              </p>
                            )}

                            {fuelItem.tankerAllocations.length === 0 &&
                              matchingTankers.length > 0 && (
                                <p className={cn(
                                  "text-xs text-center py-2",
                                  itemErrors?.tankerAllocations
                                    ? "text-destructive font-medium"
                                    : "text-muted-foreground"
                                )}>
                                  {itemErrors?.tankerAllocations || t("noTankerAllocations")}
                                </p>
                              )}

                            {fuelItem.tankerAllocations.map(
                              (alloc, allocIndex) => {
                                const allocError = itemErrors?.allocations?.[allocIndex];
                                return (
                                  <div
                                    key={alloc.id}
                                    className="flex gap-2 items-start"
                                  >
                                    <div className="flex-1 space-y-1">
                                      <Label className="text-xs">
                                        {t("tanker")} <span className="text-destructive">*</span>
                                      </Label>
                                      <Select
                                        value={alloc.tankerId}
                                        onValueChange={(val) => {
                                          const tk = matchingTankers.find(
                                            (t) => t.id === val
                                          );
                                          updateTankerAllocation(
                                            fuelIndex,
                                            allocIndex,
                                            {
                                              tankerId: val,
                                              tankerName: tk?.name || "",
                                            }
                                          );
                                        }}
                                      >
                                        <SelectTrigger
                                          className={cn(
                                            "h-9 text-xs",
                                            allocError?.tankerId && "border-destructive ring-destructive"
                                          )}
                                        >
                                          <SelectValue
                                            placeholder={t("selectTanker")}
                                          />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {matchingTankers
                                            .filter((tk) => {
                                              // Filter out tankers already selected in other allocations
                                              const selectedInOther = fuelItem.tankerAllocations.some(
                                                (a, ai) => ai !== allocIndex && a.tankerId === tk.id
                                              );
                                              return !selectedInOther;
                                            })
                                            .map((tk) => (
                                            <SelectItem
                                              key={tk.id}
                                              value={tk.id}
                                            >
                                              {tk.name} ({tk.currentFuel}/
                                              {tk.capacity}L)
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      {allocError?.tankerId && (
                                        <p className="text-[0.8rem] font-medium text-destructive">
                                          {allocError.tankerId}
                                        </p>
                                      )}
                                    </div>
                                    <div className="w-[140px] space-y-1">
                                      <Label className="text-xs">
                                        {t("quantity")} (L) <span className="text-destructive">*</span>
                                      </Label>
                                      <NumericInput
                                        value={alloc.quantity}
                                        onValueChange={(val) =>
                                          updateTankerAllocation(
                                            fuelIndex,
                                            allocIndex,
                                            { quantity: val }
                                          )
                                        }
                                        min={0}
                                        className={cn(
                                          "h-9 text-xs",
                                          allocError?.quantity && "border-destructive ring-destructive"
                                        )}
                                      />
                                      {allocError?.quantity && (
                                        <p className="text-[0.8rem] font-medium text-destructive">
                                          {allocError.quantity}
                                        </p>
                                      )}
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        removeTankerAllocation(
                                          fuelIndex,
                                          allocIndex
                                        )
                                      }
                                      className="h-9 w-9 p-0 mt-5"
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                );
                              }
                            )}

                            {/* Tanker allocation summary + mismatch error */}
                            {fuelItem.tankerAllocations.length > 0 && (
                              <div className="pt-2 border-t space-y-1">
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-muted-foreground">
                                    Allocated: {allocTotalQty.toFixed(2)} L / {(fuelItem.quantity || 0).toFixed(2)} L
                                  </span>
                                  {fuelItem.quantity > 0 && Math.abs(allocTotalQty - fuelItem.quantity) > 0.01 && (
                                    <span className="text-xs text-destructive font-medium">
                                      Mismatch: {(allocTotalQty - fuelItem.quantity).toFixed(2)} L
                                    </span>
                                  )}
                                </div>
                                {itemErrors?.tankerAllocations && (
                                  <p className="text-[0.8rem] font-medium text-destructive">
                                    {itemErrors.tankerAllocations}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ─── PRODUCT ITEMS SECTION (existing) ─── */}
              {!isEdit && purchaseType === "PRODUCT" && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">
                      {t("items")}
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addItem}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t("selectItem") || t("addItem")}
                    </Button>
                  </div>

                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="p-4 border rounded-lg space-y-4 bg-muted/50 relative"
                    >
                      <div className="absolute top-2 right-2">
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(index)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {/* Top row: Product Search */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end mt-2">
                        <FormField
                          control={form.control}
                          name={`items.${index}.itemName` as any}
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>{t("product") || "Product"}</FormLabel>
                              <Popover
                                open={comboboxOpen[index]}
                                onOpenChange={(isOpen) =>
                                  setComboboxOpen((prev) => ({
                                    ...prev,
                                    [index]: isOpen,
                                  }))
                                }
                              >
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      className={cn(
                                        "w-full justify-between",
                                        !field.value && "text-muted-foreground",
                                      )}
                                    >
                                      {field.value
                                        ? field.value
                                        : t("selectProduct") ||
                                        "Select product..."}
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-[300px] sm:w-[400px] p-0"
                                  align="start"
                                >
                                  <Command>
                                    <CommandInput
                                      placeholder={
                                        t("searchPlaceholder") ||
                                        "Search products..."
                                      }
                                    />
                                    <CommandList>
                                      <CommandEmpty>
                                        {t("noResults") || "No product found."}
                                      </CommandEmpty>
                                      <CommandGroup>
                                        {products.map((product) => {
                                          const productVariants = product.productVariants || product.variants || []
                                          
                                          // If product has no variants, show as a single item
                                          if (productVariants.length === 0) {
                                            return (
                                              <CommandItem
                                                value={`${product.name} ${product.barcode || ""} ${product.id}`}
                                                key={product.id}
                                                onSelect={() => {
                                                  setSelectedProducts((prev) => ({ ...prev, [index]: product }));
                                                  field.onChange(product.name);
                                                  form.setValue(`items.${index}.sku` as any, product.barcode || `SKU-${product.id}`);
                                                  form.setValue(`items.${index}.itemDescription` as any, product.description || "");
                                                  form.setValue(`items.${index}.unit` as any, product.unit?.suffix || "");
                                                  form.setValue(`items.${index}.price` as any, product.price ?? 0);
                                                  form.setValue(`items.${index}.productId` as any, product.id);
                                                  form.setValue(`items.${index}.variantId` as any, undefined);
                                                  form.setValue(`items.${index}.itemType` as any, "PRODUCT");
                                                  setComboboxOpen((prev) => ({ ...prev, [index]: false }));
                                                }}
                                              >
                                                <Check className={cn("mr-2 h-4 w-4", selectedProducts[index]?.id === product.id ? "opacity-100" : "opacity-0")} />
                                                <div className="flex flex-col w-full text-sm">
                                                  <div className="flex justify-between w-full">
                                                    <span className="font-medium">{product.name}</span>
                                                    <span className="text-muted-foreground">{product.price} {product.unit?.suffix}</span>
                                                  </div>
                                                  {product.barcode && <span className="text-xs text-muted-foreground font-mono">{product.barcode}</span>}
                                                </div>
                                              </CommandItem>
                                            )
                                          }

                                          // If product has variants, show each variant
                                          return productVariants.map((variant) => (
                                            <CommandItem
                                              value={`${product.name} ${variant.variantName} ${variant.sku || ""} ${variant.id}`}
                                              key={variant.id}
                                              onSelect={() => {
                                                setSelectedProducts((prev) => ({ ...prev, [index]: { ...product, selectedVariant: variant } }));
                                                field.onChange(`${product.name} - ${variant.variantName}`);
                                                form.setValue(`items.${index}.sku` as any, variant.sku || `SKU-${variant.id}`);
                                                form.setValue(`items.${index}.itemDescription` as any, product.description || "");
                                                form.setValue(`items.${index}.unit` as any, (variant as any).unit?.suffix || product.unit?.suffix || "");
                                                form.setValue(`items.${index}.price` as any, variant.price ?? product.price ?? 0);
                                                form.setValue(`items.${index}.productId` as any, product.id);
                                                form.setValue(`items.${index}.variantId` as any, variant.id);
                                                form.setValue(`items.${index}.itemType` as any, "PRODUCT");
                                                setComboboxOpen((prev) => ({ ...prev, [index]: false }));
                                              }}
                                            >
                                              <Check className={cn("mr-2 h-4 w-4", selectedProducts[index]?.selectedVariant?.id === variant.id ? "opacity-100" : "opacity-0")} />
                                              <div className="flex flex-col w-full text-sm">
                                                <div className="flex justify-between w-full">
                                                  <span className="font-medium">{product.name} - {variant.variantName}</span>
                                                  <span className="text-muted-foreground">{variant.price ?? product.price} {product.unit?.suffix}</span>
                                                </div>
                                                {variant.sku && <span className="text-xs text-muted-foreground font-mono">{variant.sku}</span>}
                                              </div>
                                            </CommandItem>
                                          ))
                                        })}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`items.${index}.itemDescription` as any}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("itemDescription")}</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder={t("itemDescriptionPlaceholder")}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Bottom Row: Qty, Price, Unit, Subtotal */}
                      <div className="flex flex-wrap items-end gap-3 mt-4">
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity` as any}
                          render={({ field }) => (
                            <FormItem className="flex-1 min-w-[100px]">
                              <FormLabel>{t("quantity")}</FormLabel>
                              <FormControl>
                                <NumericInput
                                  value={field.value || 0}
                                  onValueChange={field.onChange}
                                  min={1}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`items.${index}.unit` as any}
                          render={({ field }) => (
                            <FormItem className="flex-[1.5] min-w-[120px]">
                              <FormLabel>{t("unit")}</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue
                                      placeholder={t("unitPlaceholder")}
                                    />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {units.map((unit) => (
                                    <SelectItem
                                      key={unit.id}
                                      value={unit.suffix}
                                    >
                                      {unit.name} ({unit.suffix})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`items.${index}.price` as any}
                          render={({ field }) => (
                            <FormItem className="flex-1 min-w-[100px]">
                              <FormLabel>{t("price")}</FormLabel>
                              <FormControl>
                                <NumericInput
                                  value={field.value || 0}
                                  onValueChange={field.onChange}
                                  min={0}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex-1 min-w-[100px] pb-2 text-right">
                          <span className="text-sm text-muted-foreground mr-2">
                            {t("subtotal")}:
                          </span>
                          <span className="font-bold whitespace-nowrap">
                            {(
                              (form.watch(`items.${index}.price` as any) || 0) *
                              (form.watch(`items.${index}.quantity` as any) ||
                                0)
                            ).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {total !== null && (
                    <>
                      {/* Order Summary (Discount & Tax) */}
                      <div className="space-y-4 pt-4 border-t">
                        <Label className="text-base font-medium">
                          Order Summary
                        </Label>
                        <div className="grid grid-cols-2 gap-4">
                          {/* Discount */}
                          <div className="space-y-2">
                            <Label className="text-sm">Discount</Label>
                            <div className="flex gap-2">
                              <FormField
                                control={form.control}
                                name="discountType"
                                render={({ field }) => (
                                  <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                  >
                                    <SelectTrigger className="w-[110px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="NONE">None</SelectItem>
                                      <SelectItem value="PERCENTAGE">
                                        %
                                      </SelectItem>
                                      <SelectItem value="FIXED">
                                        Fixed
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                              {(form.watch("discountType" as any) ===
                                "PERCENTAGE" ||
                                form.watch("discountType" as any) ===
                                "FIXED") && (
                                  <FormField
                                    control={form.control}
                                    name="discountAmount"
                                    render={({ field }) => (
                                      <NumericInput
                                        className="flex-1"
                                        {...field}
                                        value={field.value || 0}
                                        onValueChange={field.onChange}
                                      />
                                    )}
                                  />
                                )}
                            </div>
                          </div>

                          {/* Tax */}
                          <div className="space-y-2">
                            <Label className="text-sm">Tax</Label>
                            <div className="flex gap-2">
                              <FormField
                                control={form.control}
                                name="taxType"
                                render={({ field }) => (
                                  <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                  >
                                    <SelectTrigger className="w-[110px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="NONE">None</SelectItem>
                                      <SelectItem value="PERCENTAGE">
                                        %
                                      </SelectItem>
                                      <SelectItem value="FIXED">
                                        Fixed
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                              {form.watch("taxType" as any) ===
                                "PERCENTAGE" && (
                                  <FormField
                                    control={form.control}
                                    name="taxRate"
                                    render={({ field }) => (
                                      <NumericInput
                                        className="flex-1"
                                        {...field}
                                        value={field.value || 0}
                                        onValueChange={field.onChange}
                                      />
                                    )}
                                  />
                                )}
                              {form.watch("taxType" as any) === "FIXED" && (
                                <FormField
                                  control={form.control}
                                  name="taxAmount"
                                  render={({ field }) => (
                                    <NumericInput
                                      className="flex-1"
                                      {...field}
                                      value={field.value || 0}
                                      onValueChange={field.onChange}
                                    />
                                  )}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ─── TAX SECTION FOR FUEL (shown outside product items block) ─── */}
              {!isEdit && purchaseType === "FUEL" && fuelItems.length > 0 && (
                <div className="space-y-4 pt-4 border-t">
                  <Label className="text-base font-medium">
                    Order Summary
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Tax */}
                    <div className="space-y-2">
                      <Label className="text-sm">Tax</Label>
                      <div className="flex gap-2">
                        <FormField
                          control={form.control}
                          name="taxType"
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger className="w-[110px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="NONE">None</SelectItem>
                                <SelectItem value="PERCENTAGE">
                                  %
                                </SelectItem>
                                <SelectItem value="FIXED">
                                  Fixed
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {form.watch("taxType" as any) ===
                          "PERCENTAGE" && (
                            <FormField
                              control={form.control}
                              name="taxRate"
                              render={({ field }) => (
                                <NumericInput
                                  className="flex-1"
                                  {...field}
                                  value={field.value || 0}
                                  onValueChange={field.onChange}
                                />
                              )}
                            />
                          )}
                        {form.watch("taxType" as any) === "FIXED" && (
                          <FormField
                            control={form.control}
                            name="taxAmount"
                            render={({ field }) => (
                              <NumericInput
                                className="flex-1"
                                {...field}
                                value={field.value || 0}
                                onValueChange={field.onChange}
                              />
                            )}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── PAYMENT & TOTAL SECTION (shared for both types) ─── */}
              {!isEdit && total !== null && (
                <>
                  {/* Payment Method Selection */}
                  <div className="space-y-4 pt-4 border-t">
                    <Label className="text-base font-medium">
                      {t("paymentMethod")}
                    </Label>
                    <div className="flex gap-2 flex-wrap">
                      <Button type="button" variant={paymentMethod === "CASH" ? "default" : "outline"} size="sm" onClick={() => setPaymentMethod("CASH")} className="text-xs">Cash</Button>
                      <Button type="button" variant={paymentMethod === "CARD" ? "default" : "outline"} size="sm" onClick={() => setPaymentMethod("CARD")} className="text-xs">Card</Button>
                      {/* Credit payment option hidden per business requirement */}
                      <Button type="button" variant={paymentMethod === "MIXED" ? "default" : "outline"} size="sm" onClick={() => setPaymentMethod("MIXED")} className="text-xs">Mixed</Button>
                    </div>

                    {/* Account Selection for CASH */}
                    {paymentMethod === "CASH" && accounts.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm">{t("account")}</Label>
                        <Select value={cashAccountId} onValueChange={setCashAccountId}>
                          <SelectTrigger><SelectValue placeholder={t("selectAccount")} /></SelectTrigger>
                          <SelectContent>
                            {accounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>{account.name} ({account.type})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Account Selection for CARD */}
                    {paymentMethod === "CARD" && accounts.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm">{t("account")}</Label>
                        <Select value={bankAccountId} onValueChange={setBankAccountId}>
                          <SelectTrigger><SelectValue placeholder={t("selectAccount")} /></SelectTrigger>
                          <SelectContent>
                            {accounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>{account.name} ({account.type})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Payment Splits for MIXED */}
                    {paymentMethod === "MIXED" && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">{t("paymentSplit")}</Label>
                          <Button type="button" variant="outline" size="sm" onClick={() => setPaymentSplits([...paymentSplits, { id: `split-${Date.now()}-${Math.random()}`, accountId: "", amount: 0 }])} className="h-7 text-xs">
                            <Plus className="h-3 w-3 mr-1" />{t("addAccount")}
                          </Button>
                        </div>
                        {paymentSplits.length === 0 && (
                          <p className="text-xs text-muted-foreground text-center py-2">{t("noPaymentSplits")}</p>
                        )}
                        {paymentSplits.map((split, index) => (
                          <div key={split.id} className="flex gap-2 items-start">
                            <div className="flex-1 space-y-1">
                              <Select value={split.accountId} onValueChange={(value) => { const updated = [...paymentSplits]; updated[index].accountId = value; setPaymentSplits(updated); }}>
                                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t("selectAccount")} /></SelectTrigger>
                                <SelectContent>
                                  {accounts.map((account) => (
                                    <SelectItem key={account.id} value={account.id}>{account.name} ({account.type})</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <NumericInput value={split.amount || 0} onValueChange={(value) => { const updated = [...paymentSplits]; updated[index].amount = Math.max(0, Math.min(value, total)); setPaymentSplits(updated); }} className="h-9 text-xs" min={0} />
                            </div>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setPaymentSplits(paymentSplits.filter((_, i) => i !== index))} className="h-9 w-9 p-0">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                        {paymentSplits.length > 0 && (
                          <div className="pt-2 border-t space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">{t("totalAllocated")}:</span>
                              <span className="font-medium">{paymentSplits.reduce((sum, s) => sum + (s.amount || 0), 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">{t("remaining")}:</span>
                              <span className={(total - paymentSplits.reduce((sum, s) => sum + (s.amount || 0), 0)) < 0 ? "text-destructive font-medium" : "font-medium"}>
                                {(total - paymentSplits.reduce((sum, s) => sum + (s.amount || 0), 0)).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
                    <div className="flex items-center justify-between text-lg font-semibold">
                      <span>{t("total")}:</span>
                      <span>{total.toFixed(2)}</span>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="w-[150px] sm:w-[250px]">
                        {(paymentMethod === "CASH" || paymentMethod === "CARD") && (
                          <FormField
                            control={form.control}
                            name="paidAmount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("paidAmount")}</FormLabel>
                                <FormControl>
                                  <NumericInput
                                    min={0}
                                    {...field}
                                    value={field.value || 0}
                                    onValueChange={(val) => {
                                      const currentTotal = total || 0;
                                      field.onChange(Math.min(val, currentTotal));
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        {paymentMethod === "MIXED" && (
                          <div className="space-y-1 pt-1 text-sm text-muted-foreground">
                            <span>{t("paymentSplit")} active</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end justify-center space-y-1">
                        <Label className="text-muted-foreground">
                          {t("dueAmount")}
                        </Label>
                        <div className="text-2xl font-bold pt-1">
                          <span
                            className={
                              Number(form.watch("dueAmount" as any) || 0) > 0
                                ? "text-destructive"
                                : "text-emerald-600"
                            }
                          >
                            {Number(
                              form.watch("dueAmount" as any) || 0,
                            ).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!isEdit &&
                      dueAmount > 0 &&
                      selectedContact &&
                      isCreditExceeded && (
                        <div className="flex justify-end pt-2">
                          <p className="text-xs font-medium text-destructive bg-destructive/10 p-1.5 rounded border border-destructive/20">
                            Exceeds available credit of{" "}
                            {availableCredit.toFixed(2)}
                          </p>
                        </div>
                      )}
                  </div>
                </>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="px-6 py-4 border-t flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  {tCommon("loading")}
                </>
              ) : (
                tCommon("save")
              )}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </ModalWrapper>
  );
}
