import { Stack } from "@mui/material";
import { useAuthContext } from "../App";
import { RecipeForm } from "../components/RecipeForm";
import { RecipeList } from "../components/RecipeList";
import { useKitchenItems } from "../hooks/useKitchenItems";
import { useRecipes } from "../hooks/useRecipes";

export function RecipesPage() {
  const { token, user } = useAuthContext();
  const { kitchenItems, kitchenItemsQuery } = useKitchenItems(token, user);
  const { recipes, recipesQuery, updateRecipeMutation } = useRecipes(token, user);

  return (
    <Stack spacing={3}>
      <RecipeForm />
      <RecipeList
        isKitchenLoading={kitchenItemsQuery.isPending}
        isLoading={recipesQuery.isPending}
        kitchenItems={kitchenItems}
        recipes={recipes}
        updateRecipeMutation={updateRecipeMutation}
      />
    </Stack>
  );
}
