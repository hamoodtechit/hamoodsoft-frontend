import { isAxiosError } from "axios";

/**
 * Extract an error message from the backend response body.
 * Backend error response structure:
 * { message: string | string[], error: string, statusCode: number }
 * or wrapped: { details: { message: string | string[], error: string, statusCode: number } }
 */
export function extractMessageFromData(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dataObj = data as Record<string, any>;

  // Check if there is a stringified ZodError
  const potentialZodMessage = (dataObj.error?.name === "ZodError" && typeof dataObj.error?.message === "string")
    ? dataObj.error.message
    : (dataObj.name === "ZodError" && typeof dataObj.message === "string" && dataObj.message.trim().startsWith("["))
      ? dataObj.message
      : null;

  if (potentialZodMessage) {
    try {
      const parsed = JSON.parse(potentialZodMessage);
      if (Array.isArray(parsed)) {
        const fieldMessages = parsed
          .map((detail: Record<string, unknown>) => {
            const field = Array.isArray(detail?.path) ? detail.path.join(".") : detail?.path;
            const message = detail?.message;
            return field && message ? `${field}: ${message}` : message;
          })
          .filter(Boolean)
          .join(" | ");

        if (fieldMessages) return fieldMessages;
      }
    } catch (_e) {
      // Ignore JSON parse errors and fall through
    }
  }

  // Extract cause message if error is an object (e.g. Prisma DriverAdapter error)
  const causeMessage =
    typeof dataObj.error === "object" && dataObj.error !== null
      ? dataObj.error.cause?.message || dataObj.error.cause?.originalMessage || dataObj.error.message
      : null;

  // Backend may wrap errors as { details: { message } } or flat { message }
  const rawMessage = dataObj.details?.message ?? dataObj.message;
  let baseMessage = rawMessage
    ? Array.isArray(rawMessage)
      ? rawMessage.join(", ")
      : rawMessage
    : typeof dataObj.error === "string"
    ? dataObj.error
    : causeMessage;

  if (baseMessage && baseMessage.toLowerCase().includes("internal server error") && causeMessage) {
    baseMessage = causeMessage;
  }

  // Extract validation arrays from known possible keys
  const validationArrays = [
    dataObj.errorSources,
    dataObj.errors,
    Array.isArray(dataObj.error) ? dataObj.error : null,
    dataObj.errorDetails,
    Array.isArray(dataObj.details) ? dataObj.details : null
  ];

  for (const validationArr of validationArrays) {
    if (Array.isArray(validationArr) && validationArr.length > 0) {
      const fieldMessages = validationArr
        .map((detail: Record<string, unknown> | string) => {
          if (typeof detail === "string") return detail;
          const field = detail?.field || detail?.path || detail?.name;
          const message = detail?.message || detail?.msg;
          if (field && message) return `${field}: ${message}`;
          if (message) return message;
          return null;
        })
        .filter(Boolean)
        .join(" | ");

      if (fieldMessages) {
        if (!baseMessage) return fieldMessages;
        // If the base message is just a generic 500 error or similar, replace it or append
        if (baseMessage.toLowerCase().includes("internal server error") || baseMessage.includes("500")) {
          return fieldMessages;
        }
        return `${baseMessage} (${fieldMessages})`;
      }
    }
  }

  return baseMessage;
}

export function extractErrorMessage(error: unknown): string {
  // console.log("Extracting error message from:", error);
  if (isAxiosError(error)) {
    const data = error.response?.data;
    
    if (!data) {
      return error.message || "An unknown error occurred";
    }

    return extractMessageFromData(data) || error.message || "An unknown error occurred";
  }

  if (error && typeof error === "object") {
    // If it's a plain object (e.g. from fetch response data) or already a custom error payload
    const extracted = extractMessageFromData(error);
    if (extracted) return extracted;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred";
}

export function extractError(error: any, defaultMessage: string = "An unexpected error occurred"): string {
  return extractErrorMessage(error) || defaultMessage;
}
