"use client"

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTranslations } from "next-intl"
import { UseFormReturn } from "react-hook-form"
import { CreateProductInput, UpdateProductInput } from "@/lib/validations/products"

interface ProductInventorySectionProps {
  form: UseFormReturn<CreateProductInput | UpdateProductInput>
  isLoading: boolean
}

export function ProductInventorySection({
  form,
  isLoading,
}: ProductInventorySectionProps) {
  const t = useTranslations("products")

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField
        control={form.control}
        name="barcode"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("barcode") || "Barcode"}</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value ?? ""}
                placeholder={t("barcodePlaceholder") || "Enter barcode"}
                disabled={isLoading}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="barcodeType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("barcodeType") || "Barcode Type"}</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value || "EAN_13"}
              disabled
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={t("barcodeType") || "Select barcode type"} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="EAN_13">EAN-13</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="weight"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("weight") || "Weight"}</FormLabel>
            <FormControl>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                placeholder="0.00"
                disabled={isLoading}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="alertQuantity"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("alertQuantity") || "Alert Quantity"}</FormLabel>
            <FormControl>
              <Input
                type="number"
                inputMode="numeric"
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                placeholder="0"
                disabled={isLoading}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
