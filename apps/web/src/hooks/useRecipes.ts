import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRecipe, fetchRecipes, updateRecipe } from "../lib/api";
import { queryKeys } from "../lib/query";
import type { AuthUser, Recipe } from "../types";

type RecipeInput = {
  title: string;
  description: string;
  source?: string;
  foodItems: string[];
};

export function useRecipes(token: string, user: AuthUser | null) {
  const queryClient = useQueryClient();
  const recipesQuery = useQuery({
    queryKey: queryKeys.recipes(token),
    queryFn: () => fetchRecipes(token),
    enabled: Boolean(token && user),
    retry: false
  });
  const createRecipeMutation = useMutation({
    mutationFn: (input: RecipeInput) => createRecipe(token, input),
    onSuccess: (data) => {
      queryClient.setQueryData<{ recipes: Recipe[] }>(queryKeys.recipes(token), (current) => ({
        recipes: [
          data.recipe,
          ...(current?.recipes ?? []).filter((recipe) => recipe.id !== data.recipe.id)
        ]
      }));
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes(token) });
    }
  });
  const updateRecipeMutation = useMutation({
    mutationFn: (input: RecipeInput & { id: number }) => updateRecipe(token, input.id, input),
    onSuccess: (data) => {
      queryClient.setQueryData<{ recipes: Recipe[] }>(queryKeys.recipes(token), (current) => ({
        recipes: (current?.recipes ?? []).map((recipe) =>
          recipe.id === data.recipe.id ? data.recipe : recipe
        )
      }));
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes(token) });
    }
  });

  return {
    createRecipeMutation,
    recipes: recipesQuery.data?.recipes ?? [],
    recipesQuery,
    updateRecipeMutation
  };
}
