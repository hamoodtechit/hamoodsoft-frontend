"use client"

/**
 * Get the next onboarding step URL based on user's currentBusinessId
 * Since we removed the /business/status API, we only check user.currentBusinessId
 */

/**
 * Get the next onboarding step URL based on user's currentBusinessId
 * Since we removed the /business/status API, we only check user.currentBusinessId
 */
export function getNextOnboardingStep(
  locale: string = "en",
  user?: { currentBusinessId?: string | null } | null
): string | null {
  // If user has currentBusinessId, onboarding is complete
  if (user?.currentBusinessId) {
    return null // Onboarding complete - user has a business
  }

  // If user doesn't have currentBusinessId, redirect to register business
  return `/${locale}/register-business`
}
