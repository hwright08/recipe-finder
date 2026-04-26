import type { AuthPayload, AuthResponse, AuthUser, KitchenFoodItem, Recipe } from "../types";

const apiBase = import.meta.env.VITE_API_BASE ?? "/api";

class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function fetchRecipes(token: string) {
  return requestJson<{ recipes: Recipe[] }>("/recipes", {
    headers: authHeaders(token)
  });
}

export async function fetchCurrentUser(token: string) {
  return requestJson<{ user: AuthUser }>("/auth/me", {
    headers: authHeaders(token)
  });
}

export async function fetchKitchenItems(token: string) {
  return requestJson<{ items: KitchenFoodItem[] }>("/kitchen/food-items", {
    headers: authHeaders(token)
  });
}

export async function authenticate(mode: "login" | "register", payload: AuthPayload) {
  return requestJson<AuthResponse>(`/auth/${mode}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export async function logout(token: string) {
  if (!token) {
    return;
  }

  await requestNoContent("/auth/logout", {
    method: "POST",
    headers: authHeaders(token)
  });
}

export async function createRecipe(
  token: string,
  input: {
    title: string;
    description: string;
    source?: string;
    foodItems: string[];
  }
) {
  return requestJson<{ recipe: Recipe }>("/recipes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token)
    },
    body: JSON.stringify(input)
  });
}

export async function updateRecipe(
  token: string,
  id: number,
  input: {
    title: string;
    description: string;
    source?: string;
    foodItems: string[];
  }
) {
  return requestJson<{ recipe: Recipe }>(`/recipes/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token)
    },
    body: JSON.stringify(input)
  });
}

export async function createKitchenItem(token: string, input: { name: string }) {
  return requestJson<{ item: KitchenFoodItem }>("/kitchen/food-items", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token)
    },
    body: JSON.stringify(input)
  });
}

export async function updateKitchenItem(token: string, id: number, isLow: boolean) {
  return requestJson<{ item: KitchenFoodItem }>(`/kitchen/food-items/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token)
    },
    body: JSON.stringify({ isLow })
  });
}

export async function deleteKitchenItem(token: string, id: number) {
  await requestNoContent(`/kitchen/food-items/${id}`, {
    method: "DELETE",
    headers: authHeaders(token)
  });
}

async function requestJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, options);

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }

  return response.json() as Promise<T>;
}

async function requestNoContent(path: string, options?: RequestInit) {
  const response = await fetch(`${apiBase}${path}`, options);

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`
  };
}

async function readErrorMessage(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      const body = (await response.json()) as {
        statusMessage?: string;
        message?: string;
      };

      return body.statusMessage || body.message || `Request failed with ${response.status}`;
    } catch {
      return `Request failed with ${response.status}`;
    }
  }

  const text = await response.text();
  return text.trim() || `Request failed with ${response.status}`;
}
