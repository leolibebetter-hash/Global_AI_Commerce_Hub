/**
 * Centralized API client with auth token management.
 * Handles token refresh, error normalization, and auth header injection.
 */

const TOKEN_KEY = "access_token";
const REFRESH_KEY = "refresh_token";
const EMAIL_KEY = "user_email";

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(EMAIL_KEY);
  localStorage.removeItem("user_phone");
}

export function getUserEmail(): string | null {
  return localStorage.getItem(EMAIL_KEY);
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions extends Omit<RequestInit, "headers"> {
  headers?: Record<string, string>;
  params?: Record<string, string>;
}

/**
 * Make an authenticated API request.
 * Automatically injects the Bearer token and normalizes errors.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { headers = {}, params, ...rest } = options;

  // Build URL with query params
  let url = path.startsWith("http") ? path : path;
  if (params && Object.keys(params).length > 0) {
    const qs = new URLSearchParams(params).toString();
    url += (url.includes("?") ? "&" : "?") + qs;
  }

  // Inject auth header
  const token = getAccessToken();
  const finalHeaders: Record<string, string> = { ...headers };
  if (token) {
    finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(rest.body instanceof FormData) && !finalHeaders["Content-Type"]) {
    finalHeaders["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    ...rest,
    headers: finalHeaders,
  });

  // Handle 401 — try token refresh once
  if (res.status === 401) {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (refreshToken) {
      try {
        const refreshRes = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setAccessToken(data.access_token);
          if (data.refresh_token) {
            localStorage.setItem(REFRESH_KEY, data.refresh_token);
          }

          // Retry original request with new token
          finalHeaders["Authorization"] = `Bearer ${data.access_token}`;
          const retryRes = await fetch(url, {
            ...rest,
            headers: finalHeaders,
          });

          if (!retryRes.ok) {
            const errBody = await retryRes.json().catch(() => ({}));
            throw new ApiError(
              errBody.detail || `Request failed (${retryRes.status})`,
              retryRes.status,
              errBody.detail,
            );
          }

          return retryRes.json();
        }
      } catch {
        // Refresh failed — clear auth
      }
    }

    // Not authenticated — redirect to login
    clearAuth();
    window.location.href = "/login";
    throw new ApiError("Session expired. Please log in again.", 401);
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new ApiError(
      errBody.detail || `Request failed (${res.status})`,
      res.status,
      errBody.detail,
    );
  }

  // Return JSON if available, otherwise undefined
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return res.json();
  }
  return undefined as T;
}
