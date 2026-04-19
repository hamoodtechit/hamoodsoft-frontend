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
    // Axios sets generic error messages like "Request failed with status code 400"
    // that aren't very useful to the end user. If we have a generic message,
    // we still return it but the response data checked above is preferred.
    return error.message;
  }

  // If the error itself is a string
  if (typeof error === "string") {
    return error;
  }

  return defaultMessage;
}
