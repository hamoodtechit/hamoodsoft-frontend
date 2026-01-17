import { cn } from "@/lib/utils"
import { PageContainer } from "./page-container"

interface PageLayoutProps {
  children: React.ReactNode
  title: string
  description?: string
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
  className?: string
}

export function PageLayout({
  children,
  title,
  description,
  maxWidth = "2xl",
  className,
}: PageLayoutProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header - Centered */}
      <PageContainer maxWidth={maxWidth}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-2">{description}</p>
          )}
        </div>
      </PageContainer>

      {/* Content */}
      <PageContainer maxWidth={maxWidth}>{children}</PageContainer>
    </div>
  )
}
