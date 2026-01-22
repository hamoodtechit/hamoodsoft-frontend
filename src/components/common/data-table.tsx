"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowUpDown, MoreVertical, ArrowUp, ArrowDown } from "lucide-react"
import { useState, useMemo } from "react"

export interface Column<T> {
  id: string
  header: string
  accessorKey?: keyof T
  cell?: (row: T) => React.ReactNode
  sortable?: boolean
  width?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  onRowClick?: (row: T) => void
  actions?: (row: T) => React.ReactNode
  selectable?: boolean
  onSelectionChange?: (selected: T[]) => void
  emptyMessage?: string
}

type SortDirection = "asc" | "desc" | null

export function DataTable<T extends { id: string }>({
  data,
  columns,
  onRowClick,
  actions,
  selectable = false,
  onSelectionChange,
  emptyMessage = "No data available",
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())

  // Handle sorting
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return data

    return [...data].sort((a, b) => {
      const column = columns.find((col) => col.id === sortColumn)
      if (!column?.accessorKey) return 0

      const aValue = a[column.accessorKey]
      const bValue = b[column.accessorKey]

      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue
      }

      return 0
    })
  }, [data, sortColumn, sortDirection, columns])

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      if (sortDirection === "asc") {
        setSortDirection("desc")
      } else {
        setSortColumn(null)
        setSortDirection(null)
      }
    } else {
      setSortColumn(columnId)
      setSortDirection("asc")
    }
  }

  // Handle selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(data.map((row) => row.id))
      setSelectedRows(allIds)
      onSelectionChange?.(data)
    } else {
      setSelectedRows(new Set())
      onSelectionChange?.([])
    }
  }

  const handleSelectRow = (rowId: string, checked: boolean) => {
    const newSelected = new Set(selectedRows)
    if (checked) {
      newSelected.add(rowId)
    } else {
      newSelected.delete(rowId)
    }
    setSelectedRows(newSelected)

    const selectedData = data.filter((row) => newSelected.has(row.id))
    onSelectionChange?.(selectedData)
  }

  const allSelected = data.length > 0 && selectedRows.size === data.length
  const someSelected = selectedRows.size > 0 && selectedRows.size < data.length

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b bg-muted/50">
            {selectable && (
              <th className="w-12 px-4 py-3 text-left">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.id}
                className="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                style={{ width: column.width }}
              >
                {column.sortable !== false ? (
                  <button
                    onClick={() => handleSort(column.id)}
                    className="flex items-center gap-2 hover:text-foreground transition-colors"
                  >
                    {column.header}
                    {sortColumn === column.id ? (
                      sortDirection === "asc" ? (
                        <ArrowUp className="h-4 w-4" />
                      ) : (
                        <ArrowDown className="h-4 w-4" />
                      )
                    ) : (
                      <ArrowUpDown className="h-4 w-4 opacity-50" />
                    )}
                  </button>
                ) : (
                  column.header
                )}
              </th>
            ))}
            {actions && <th className="w-12 px-4 py-3"></th>}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row) => (
            <tr
              key={row.id}
              className={`border-b transition-colors ${
                onRowClick ? "cursor-pointer hover:bg-muted/50" : ""
              } ${selectedRows.has(row.id) ? "bg-muted/30" : ""}`}
              onClick={() => onRowClick?.(row)}
            >
              {selectable && (
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedRows.has(row.id)}
                    onCheckedChange={(checked) =>
                      handleSelectRow(row.id, checked as boolean)
                    }
                    aria-label={`Select row ${row.id}`}
                  />
                </td>
              )}
              {columns.map((column) => (
                <td key={column.id} className="px-4 py-3 text-sm">
                  {column.cell
                    ? column.cell(row)
                    : column.accessorKey
                      ? String(row[column.accessorKey] ?? "")
                      : ""}
                </td>
              ))}
              {actions && (
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  {actions(row)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
