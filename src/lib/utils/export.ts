import * as XLSX from "xlsx"

export interface ExportColumn<T = any> {
  key: keyof T | string
  header: string
  width?: number
  format?: (value: any, row: T) => string | number
}

/**
 * Export data to Excel file
 * @param data Array of objects to export
 * @param columns Column definitions
 * @param filename Output filename (without extension)
 */
export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string = "export"
) {
  // Prepare worksheet data
  const worksheetData = data.map((row) => {
    const rowData: Record<string, any> = {}
    columns.forEach((col) => {
      const key = col.key as string
      const value = row[key]
      rowData[col.header] = col.format ? col.format(value, row) : value ?? ""
    })
    return rowData
  })

  // Create workbook and worksheet
  const worksheet = XLSX.utils.json_to_sheet(worksheetData)

  // Set column widths
  const columnWidths = columns.map((col) => ({
    wch: col.width || 15,
  }))
  worksheet["!cols"] = columnWidths

  // Create workbook
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1")

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split("T")[0]
  const fullFilename = `${filename}_${timestamp}.xlsx`

  // Download file
  XLSX.writeFile(workbook, fullFilename)
}

/**
 * Export data to CSV file
 * @param data Array of objects to export
 * @param columns Column definitions
 * @param filename Output filename (without extension)
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string = "export"
) {
  // Create headers
  const headers = columns.map((col) => col.header)
  const csvRows = [headers.join(",")]

  // Add data rows
  data.forEach((row) => {
    const values = columns.map((col) => {
      const key = col.key as string
      const value = row[key]
      const formatted = col.format ? col.format(value, row) : value ?? ""
      // Escape commas and quotes in CSV
      const stringValue = String(formatted)
      if (stringValue.includes(",") || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      return stringValue
    })
    csvRows.push(values.join(","))
  })

  // Create blob and download
  const csvContent = csvRows.join("\n")
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  const timestamp = new Date().toISOString().split("T")[0]
  const fullFilename = `${filename}_${timestamp}.csv`

  link.setAttribute("href", url)
  link.setAttribute("download", fullFilename)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
