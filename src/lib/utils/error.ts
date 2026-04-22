export function extractError(error: any, defaultMessage: string = "An unexpected error occurred"): string {
  if (!error) return defaultMessage;

  // Axios/NestJS error structure
  if (error.response?.data) {
    const data = error.response.data;
    
    // NestJS often sends arrays of strings for validation errors
    if (Array.isArray(data.message)) {
      return data.message.join(", ");
    }
    
    // Sometimes the message is directly a string
    if (typeof data.message === "string") {
      return data.message;
    }
    
    // In case the entire data itself is a string
    if (typeof data === "string") {
      return data;
    }
  }

  // Standard JS Error object
  if (error.message && typeof error.message === "string") {
    return error.message;
  }

  // If the error itself is a string
  if (typeof error === "string") {
    return error;
  }

  return defaultMessage;
}
