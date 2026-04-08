/**
 * apiFetch — frontend wrapper for standard API responses.
 *
 * Handles { success, data, error, code } format.
 * Throws ApiError on error with message + code from API.
 * Returns data directly on success.
 *
 * Usage:
 *   const { bookings } = await apiFetch('/api/bookings?clientId=123');
 *
 * Error handling:
 *   try { ... } catch (err) {
 *     if (err instanceof ApiError && err.code === 'CONFLICT') { ... }
 *   }
 */

export class ApiError extends Error {
  public code: string;
  public status: number;

  constructor(message: string, code: string = "UNKNOWN", status: number = 500) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: any;
}

export async function apiFetch<T = any>(
  url: string,
  options?: ApiFetchOptions
): Promise<T> {
  const fetchOptions: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  };

  if (options?.body && typeof options.body === "object" && !(options.body instanceof FormData)) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, fetchOptions);
  const json = await res.json();

  // Handle standard format { success, data, error, code }
  if (json.success !== undefined) {
    if (!json.success) {
      throw new ApiError(
        json.error || "Wystąpił błąd",
        json.code || "UNKNOWN",
        res.status
      );
    }
    return json.data as T;
  }

  // Handle legacy format
  if (!res.ok) throw new ApiError(json.error || "Wystąpił błąd", "UNKNOWN", res.status);
  return json as T;
}
