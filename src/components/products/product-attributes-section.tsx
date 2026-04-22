"use client"

import { AttributeDialog } from "@/components/common/attribute-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useAttributes, useCreateAttribute } from "@/lib/hooks/use-attributes"
import { cn } from "@/lib/utils"
import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { useMemo, useState } from "react"

interface AttributeItem {
  id: string
  name: string
  values: string[]
  allIds: string[]
}

interface ProductAttributesSectionProps {
  brandId: string | undefined
  isLoading: boolean
  isEdit: boolean
  lockedAttributeValues?: Record<string, string[]>
  selectedAttributeIds: string[]
  setSelectedAttributeIds: (ids: string[]) => void
  selectedAttributeValues: Record<string, string[]>
  setSelectedAttributeValues: (values: Record<string, string[]> | ((prev: Record<string, string[]>) => Record<string, string[]>)) => void
  onUserModified: () => void
}

export function ProductAttributesSection({
  brandId,
  isLoading,
  isEdit: _isEdit,
  lockedAttributeValues = {},
  selectedAttributeIds,
  setSelectedAttributeIds,
  selectedAttributeValues,
  setSelectedAttributeValues,
  onUserModified,
}: ProductAttributesSectionProps) {
  const t = useTranslations("products")
  const tAttributes = useTranslations("attributes")

  const [isAttributeDialogOpen, setIsAttributeDialogOpen] = useState(false)
  const createAttributeMutation = useCreateAttribute()

  const { data: attributesData } = useAttributes(
    brandId ? { brandId } : undefined
  )

  // Group attributes by name and combine their values
  const availableAttributes: AttributeItem[] = useMemo(() => {
    const attrs = attributesData?.items || []
    // Group attributes with the same name together
    const grouped = new Map<string, { id: string; name: string; values: string[]; allIds: string[] }>()
    
    attrs.forEach((attr) => {
      const key = attr.name.toLowerCase()
      if (grouped.has(key)) {
        const existing = grouped.get(key)!
        // Merge values, avoiding duplicates
        const mergedValues = [...new Set([...existing.values, ...attr.values])]
        existing.values = mergedValues
        existing.allIds.push(attr.id)
      } else {
        grouped.set(key, {
          id: attr.id,
          name: attr.name,
          values: [...attr.values],
          allIds: [attr.id],
        })
      }
    })
    
    return Array.from(grouped.values())
  }, [attributesData?.items])

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>{tAttributes("title")}</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAttributeDialogOpen(true)}
            disabled={isLoading}
          >
            <Plus className="mr-2 h-4 w-4" />
            {tAttributes("createAttribute")}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("selectAttributesDescription")}
        </p>
        {availableAttributes.length === 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t("noAttributesHint")}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAttributeDialogOpen(true)}
              disabled={isLoading}
            >
              <Plus className="mr-2 h-4 w-4" />
              {tAttributes("createAttribute")}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {availableAttributes.map((attr) => {
              const selectedValues = selectedAttributeValues[attr.id] || []
              const hasSelectedValues = selectedValues.length > 0
              const lockedValues = lockedAttributeValues[attr.id] || []
              // The select-all checkbox is disabled if ALL values of this attribute are locked
              const allValuesLocked = lockedValues.length > 0 && attr.values.every((v) => lockedValues.includes(v))
              // If any values are locked, the select-all unchecking should be prevented
              const hasAnyLockedValues = lockedValues.length > 0
              
              return (
                <Card key={attr.id} className={cn("border", hasSelectedValues && "border-primary bg-primary/5")}>
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">{attr.name}</Label>
                        <Checkbox
                          checked={hasSelectedValues}
                          onCheckedChange={(val) => {
                            onUserModified()
                            if (val) {
                              // Select all values
                              setSelectedAttributeValues((prev: Record<string, string[]>) => ({
                                ...prev,
                                [attr.id]: attr.values,
                              }))
                              if (!selectedAttributeIds.includes(attr.id)) {
                                setSelectedAttributeIds([...selectedAttributeIds, attr.id])
                              }
                            } else {
                              // Only allow unchecking if no values are locked
                              if (hasAnyLockedValues) return
                              // Deselect all values
                              setSelectedAttributeValues((prev: Record<string, string[]>) => {
                                const next = { ...prev }
                                delete next[attr.id]
                                return next
                              })
                              setSelectedAttributeIds(selectedAttributeIds.filter((id) => id !== attr.id))
                            }
                          }}
                          disabled={isLoading || allValuesLocked}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {attr.values.map((value) => {
                          const isValueSelected = selectedValues.includes(value)
                          const isValueLocked = lockedValues.includes(value)
                          return (
                            <label
                              key={value}
                              className={cn(
                                "flex items-center gap-2 rounded-md border px-2 py-1 transition-colors",
                                isValueLocked
                                  ? "cursor-not-allowed opacity-60"
                                  : "cursor-pointer",
                                isValueSelected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : isValueLocked
                                    ? "border-border"
                                    : "border-border hover:bg-muted"
                              )}
                            >
                              <Checkbox
                                checked={isValueSelected}
                                onCheckedChange={(val) => {
                                  if (isValueLocked) return
                                  onUserModified()
                                  const currentValues = selectedAttributeValues[attr.id] || []
                                  let newValues: string[]
                                  
                                  if (val) {
                                    newValues = [...currentValues, value]
                                  } else {
                                    newValues = currentValues.filter((v) => v !== value)
                                  }
                                  
                                  setSelectedAttributeValues((prev: Record<string, string[]>) => ({
                                    ...prev,
                                    [attr.id]: newValues,
                                  }))
                                  
                                  // Update selectedAttributeIds based on whether any values are selected
                                  if (newValues.length > 0) {
                                    if (!selectedAttributeIds.includes(attr.id)) {
                                      setSelectedAttributeIds([...selectedAttributeIds, attr.id])
                                    }
                                  } else {
                                    setSelectedAttributeIds(selectedAttributeIds.filter((id) => id !== attr.id))
                                  }
                                }}
                                disabled={isLoading || isValueLocked}
                              />
                              <span className="text-xs">{value}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Attribute Creation Dialog */}
      <AttributeDialog
        attribute={null}
        open={isAttributeDialogOpen}
        onOpenChange={setIsAttributeDialogOpen}
        onSubmitCreate={(data) => {
          createAttributeMutation.mutate(data, {
            onSuccess: () => {
              setIsAttributeDialogOpen(false)
            },
          })
        }}
        onSubmitUpdate={() => {}}
        isLoading={createAttributeMutation.isPending}
      />
    </>
  )
}

// Re-export the available attributes hook for use by the form orchestrator
export function useAvailableAttributes(brandId: string | undefined) {
  const { data: attributesData } = useAttributes(
    brandId ? { brandId } : undefined
  )

  return useMemo(() => {
    const attrs = attributesData?.items || []
    const grouped = new Map<string, { id: string; name: string; values: string[]; allIds: string[] }>()
    
    attrs.forEach((attr) => {
      const key = attr.name.toLowerCase()
      if (grouped.has(key)) {
        const existing = grouped.get(key)!
        const mergedValues = [...new Set([...existing.values, ...attr.values])]
        existing.values = mergedValues
        existing.allIds.push(attr.id)
      } else {
        grouped.set(key, {
          id: attr.id,
          name: attr.name,
          values: [...attr.values],
          allIds: [attr.id],
        })
      }
    })
    
    return Array.from(grouped.values())
  }, [attributesData?.items])
}
