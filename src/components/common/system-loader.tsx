import { cn } from "@/lib/utils"

interface SystemLoaderProps {
  className?: string
  text?: string
  showText?: boolean
  size?: "sm" | "md" | "lg"
}

export function SystemLoader({ 
  className, 
  text = "Loading...", 
  showText = true,
  size = "md" 
}: SystemLoaderProps) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl"
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className={cn("animate-spin", sizeClasses[size])}>⏳</div>
      {showText && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  )
}
