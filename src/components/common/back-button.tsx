"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface BackButtonProps {
  href?: string
  onClick?: () => void
  className?: string
  label?: string
}

export function BackButton({ href, onClick, className, label = "Back" }: BackButtonProps) {
  const router = useRouter()
  const params = useParams()
  const locale = Array.isArray(params?.locale) ? params.locale[0] : params?.locale || "en"

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else if (href) {
      router.push(`/${locale}${href}`)
    } else {
      // Default to dashboard if no href provided
      router.push(`/${locale}/dashboard`)
    }
  }

  return (
    <Button
      variant="ghost"
      onClick={handleClick}
      className={cn("mb-2 -ml-2", className)}
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      {label}
    </Button>
  )
}
