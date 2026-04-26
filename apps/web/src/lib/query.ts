import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient();

export const queryKeys = {
  recipes: (token: string) => ["recipes", token] as const,
  session: (token: string) => ["auth", "me", token] as const,
  kitchenItems: (token: string) => ["kitchen", "food-items", token] as const
};
