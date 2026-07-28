"use client"

import { usePOS } from "./pos-provider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Droplets, MapPin } from "lucide-react"

export function CategoryBar() {
  const {
    posMode, selectedCategoryId, setSelectedCategoryId, categories,
    branches, selectedBranchId, switchBranch,
  } = usePOS()

  if (posMode === "standard") {
    return (
      <Card className="flex-shrink-0">
        <CardContent className="p-3">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex space-x-2 pb-1">
              <Button
                variant={selectedCategoryId === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategoryId("all")}
                className="rounded-full px-5 text-xs font-semibold"
              >
                All Items
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategoryId === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategoryId(category.id)}
                  className="rounded-full px-5 text-xs font-semibold"
                >
                  {category.name}
                </Button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex-shrink-0">
      <CardContent className="p-2.5 sm:p-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold">
              <Droplets className="h-4 w-4 text-primary shrink-0" />
              <span>Petrol Pump Mode</span>
            </div>
            <Badge variant="outline" className="text-[10px] sm:text-xs px-2 py-0.5">Select Dispenser Below</Badge>
          </div>

          {/* Branch Selector for Petrol Pump */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select value={selectedBranchId || ""} onValueChange={switchBranch}>
              <SelectTrigger className="h-8 w-full sm:w-[200px] text-xs">
                <SelectValue placeholder="Select Branch" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id} className="text-xs">
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
