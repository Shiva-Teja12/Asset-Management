export const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086";

export function auth(): Record<string, string> {
  if (typeof window === "undefined") {
    return {};
  }

  const token = localStorage.getItem("token");

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function api(
  path: string,
  options: RequestInit = {}
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...auth(),
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(`${API}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const error = await response.json();

      message =
        error.message ||
        error.error ||
        error.detail ||
        message;
    } catch {
      // Response did not contain JSON.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type");

  if (
    contentType &&
    contentType.includes("application/json")
  ) {
    return response.json();
  }

  return response.text();
}