import { cn } from "@/lib/utils"

interface PageContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  full: "max-w-full",
}

export function PageContainer({
  children,
  className,
  maxWidth = "2xl",
}: PageContainerProps) {
  if (maxWidth === "full") {
    return <div className={cn("w-full", className)}>{children}</div>
  }
  return (
    <div className={cn("flex justify-center", className)}>
      <div className={cn("w-full", maxWidthClasses[maxWidth])}>{children}</div>
    </div>
  )
}
