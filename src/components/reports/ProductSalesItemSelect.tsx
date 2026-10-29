"use client"

import { useEffect, useState } from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { useProductSalesOptions } from "@/lib/hooks/use-reports"
import {
  ProductSalesOption,
  ProductSalesOptionsParams
} from "@/lib/api/reports"

export function ProductSalesItemSelect({
  businessId,
  branchId,
  itemType,
  value,
  onChange
}: {
  businessId?: string
  branchId: string
  itemType: ProductSalesOptionsParams["itemType"]
  value: ProductSalesOption | null
  onChange: (option: ProductSalesOption) => void
}) {
  const t = useTranslations("productSalesReport")
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 250)
    return () => clearTimeout(timer)
  }, [search])
  const options = useProductSalesOptions(
    businessId,
    { branchId, itemType, search: debouncedSearch },
    open
  )
  const items = options.data?.pages.flatMap((page) => page.items) || []
  const searching = options.isLoading || search !== debouncedSearch

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id="report-item"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={!branchId}
        >
          <span className="truncate">{value?.name || t("selectItem")}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(360px,90vw)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t("searchItems")}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {searching ? (
              <p role="status" className="p-3 text-sm">
                {t("loading")}
              </p>
            ) : options.isError ? (
              <div role="alert" className="p-3 text-sm">
                {t("loadError")}{" "}
                <Button variant="link" onClick={() => options.refetch()}>
                  {t("retry")}
                </Button>
              </div>
            ) : (
              <>
                {items.length === 0 && (
                  <p className="p-3 text-sm">{t("noItems")}</p>
                )}
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onSelect={() => {
                      onChange(item)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${value?.id === item.id ? "opacity-100" : "opacity-0"}`}
                    />
                    {item.name}
                  </CommandItem>
                ))}
                {options.hasNextPage && (
                  <Button
                    variant="ghost"
                    className="w-full"
                    disabled={options.isFetchingNextPage}
                    onClick={() => options.fetchNextPage()}
                  >
                    {options.isFetchingNextPage && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {t("loadMore")}
                  </Button>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
