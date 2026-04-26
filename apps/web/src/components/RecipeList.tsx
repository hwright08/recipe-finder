import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControlLabel,
  Link,
  Stack,
  Switch,
  TextField,
  Typography
} from "@mui/material";
import { dateFormatter } from "../lib/date";
import type { KitchenFoodItem, Recipe } from "../types";

type RecipeInput = {
  title: string;
  description: string;
  source?: string;
  foodItems: string[];
};

type RecipeListProps = {
  isKitchenLoading: boolean;
  isLoading: boolean;
  kitchenItems: KitchenFoodItem[];
  recipes: Recipe[];
  updateRecipeMutation: UseMutationResult<
    { recipe: Recipe },
    Error,
    RecipeInput & { id: number },
    unknown
  >;
};

type RecipeCardProps = {
  editingRecipeId: number | null;
  kitchenItemByName: Map<string, KitchenFoodItem>;
  onRecipeUpdate: (event: FormEvent<HTMLFormElement>, recipe: Recipe) => Promise<void>;
  recipe: Recipe;
  setEditingRecipeId: (recipeId: number | null) => void;
  updateRecipeMutation: RecipeListProps["updateRecipeMutation"];
};

function normalizeFoodItemName(name: string) {
  return name.trim().toLocaleLowerCase();
}

function countKitchenMatches(recipe: Recipe, kitchenItemByName: Map<string, KitchenFoodItem>) {
  return recipe.foodItems.filter((item) => kitchenItemByName.has(normalizeFoodItemName(item)))
    .length;
}

function getSourceLabel(source: string | null) {
  return source?.trim() || "No source";
}

function isSourceLink(source: string) {
  try {
    const url = new URL(source);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function groupRecipesBySource(recipes: Recipe[]) {
  const groups = new Map<string, Recipe[]>();

  for (const recipe of recipes) {
    const source = getSourceLabel(recipe.source);
    groups.set(source, [...(groups.get(source) ?? []), recipe]);
  }

  return [...groups.entries()].map(([source, sourceRecipes]) => ({
    source,
    recipes: sourceRecipes
  }));
}

export function RecipeList({
  isKitchenLoading,
  isLoading,
  kitchenItems,
  recipes,
  updateRecipeMutation
}: RecipeListProps) {
  const [editingRecipeId, setEditingRecipeId] = useState<number | null>(null);
  const [isGroupedBySource, setIsGroupedBySource] = useState(false);
  const kitchenItemByName = useMemo(() => {
    return new Map(kitchenItems.map((item) => [normalizeFoodItemName(item.name), item]));
  }, [kitchenItems]);
  const sortedRecipes = useMemo(() => {
    return recipes
      .map((recipe, index) => ({
        index,
        matchCount: countKitchenMatches(recipe, kitchenItemByName),
        recipe
      }))
      .sort((left, right) => right.matchCount - left.matchCount || left.index - right.index)
      .map(({ recipe }) => recipe);
  }, [kitchenItemByName, recipes]);
  const sourceGroups = useMemo(() => groupRecipesBySource(sortedRecipes), [sortedRecipes]);

  async function handleRecipeUpdate(event: FormEvent<HTMLFormElement>, recipe: Recipe) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const foodItems = String(formData.get("foodItems") ?? "")
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);

    await updateRecipeMutation.mutateAsync({
      id: recipe.id,
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      source: String(formData.get("source") ?? ""),
      foodItems
    });
    setEditingRecipeId(null);
  }

  return (
    <Stack component="section" spacing={1.5} aria-label="Saved recipes">
      {recipes.length > 0 ? (
        <FormControlLabel
          control={
            <Switch
              checked={isGroupedBySource}
              onChange={(event) => setIsGroupedBySource(event.target.checked)}
            />
          }
          label="Group by source"
          sx={{ alignSelf: "flex-start" }}
        />
      ) : null}
      {isLoading ? <Typography color="text.secondary">Loading recipes...</Typography> : null}
      {!isKitchenLoading && kitchenItems.length === 0 ? (
        <Alert severity="info">
          Add kitchen items to compare your inventory with saved recipes.
        </Alert>
      ) : null}
      {isGroupedBySource
        ? sourceGroups.map((group) => (
            <Stack component="section" key={group.source} spacing={1.25}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                sx={{
                  alignItems: { xs: "flex-start", sm: "center" },
                  justifyContent: "space-between"
                }}
              >
                <Typography variant="h2" sx={{ fontSize: "1.1rem", fontWeight: 800 }}>
                  <SourceValue source={group.source} />
                </Typography>
                <Chip label={`${group.recipes.length} recipes`} size="small" />
              </Stack>
              {group.recipes.map((recipe) => (
                <RecipeCard
                  editingRecipeId={editingRecipeId}
                  key={recipe.id}
                  kitchenItemByName={kitchenItemByName}
                  onRecipeUpdate={handleRecipeUpdate}
                  recipe={recipe}
                  setEditingRecipeId={setEditingRecipeId}
                  updateRecipeMutation={updateRecipeMutation}
                />
              ))}
            </Stack>
          ))
        : sortedRecipes.map((recipe) => (
            <RecipeCard
              editingRecipeId={editingRecipeId}
              key={recipe.id}
              kitchenItemByName={kitchenItemByName}
              onRecipeUpdate={handleRecipeUpdate}
              recipe={recipe}
              setEditingRecipeId={setEditingRecipeId}
              updateRecipeMutation={updateRecipeMutation}
            />
          ))}
    </Stack>
  );
}

function SourceValue({ source }: { source: string }) {
  if (isSourceLink(source)) {
    return (
      <Link href={source} target="_blank" rel="noreferrer" underline="hover">
        {source}
      </Link>
    );
  }

  return source;
}

function RecipeCard({
  editingRecipeId,
  kitchenItemByName,
  onRecipeUpdate,
  recipe,
  setEditingRecipeId,
  updateRecipeMutation
}: RecipeCardProps) {
  const requiredItems = recipe.foodItems.map((item) => ({
    name: item,
    kitchenItem: kitchenItemByName.get(normalizeFoodItemName(item))
  }));
  const matchedItems = requiredItems.filter((item) => item.kitchenItem);
  const lowItems = matchedItems.filter((item) => item.kitchenItem?.isLow);
  const missingItems = requiredItems.filter((item) => !item.kitchenItem);
  const matchPercent =
    requiredItems.length > 0 ? Math.round((matchedItems.length / requiredItems.length) * 100) : 0;

  return (
    <Card variant="outlined">
      <CardContent>
        {editingRecipeId === recipe.id ? (
          <Stack component="form" spacing={2} onSubmit={(event) => onRecipeUpdate(event, recipe)}>
            <TextField
              name="title"
              label="Recipe title"
              defaultValue={recipe.title}
              required
              fullWidth
            />
            <TextField name="source" label="Source" defaultValue={recipe.source ?? ""} fullWidth />
            <TextField
              name="description"
              label="Description"
              defaultValue={recipe.description}
              multiline
              minRows={2}
              fullWidth
            />
            <TextField
              name="foodItems"
              label="Food items"
              defaultValue={recipe.foodItems.join("\n")}
              multiline
              minRows={4}
              fullWidth
            />
            <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
              <Button
                type="button"
                variant="outlined"
                disabled={updateRecipeMutation.isPending}
                onClick={() => setEditingRecipeId(null)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={updateRecipeMutation.isPending}>
                Save recipe
              </Button>
            </Stack>
          </Stack>
        ) : (
          <>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              sx={{
                alignItems: { xs: "flex-start", sm: "center" },
                justifyContent: "space-between"
              }}
            >
              <Typography variant="h2" sx={{ fontSize: "1.15rem", fontWeight: 800 }}>
                {recipe.title}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                {requiredItems.length > 0 ? (
                  <Chip
                    color={
                      missingItems.length === 0
                        ? "success"
                        : matchedItems.length > 0
                          ? "primary"
                          : "default"
                    }
                    label={`${matchedItems.length}/${requiredItems.length} in kitchen`}
                    size="small"
                  />
                ) : null}
                <Typography variant="body2" color="text.secondary">
                  <time dateTime={recipe.createdAt}>
                    {dateFormatter.format(new Date(recipe.createdAt))}
                  </time>
                </Typography>
              </Stack>
            </Stack>

            {recipe.description ? (
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                {recipe.description}
              </Typography>
            ) : null}

            {recipe.source ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Source: <SourceValue source={recipe.source} />
              </Typography>
            ) : null}

            {requiredItems.length > 0 ? (
              <Box sx={{ mt: 1.5 }}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={0.75}
                  sx={{
                    alignItems: { xs: "flex-start", sm: "center" },
                    justifyContent: "space-between"
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Ingredient match
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {matchPercent}% ready
                    {lowItems.length > 0 ? `, ${lowItems.length} low` : ""}
                  </Typography>
                </Stack>
                <Stack spacing={1} sx={{ mt: 1.25 }}>
                  {matchedItems.length > 0 ? (
                    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                      {matchedItems.map((item) => (
                        <Chip
                          color={item.kitchenItem?.isLow ? "warning" : "success"}
                          key={item.name}
                          label={`${item.name}${item.kitchenItem?.isLow ? " (low)" : ""}`}
                          size="small"
                          variant={item.kitchenItem?.isLow ? "outlined" : "filled"}
                        />
                      ))}
                    </Stack>
                  ) : null}
                  {missingItems.length > 0 ? (
                    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                      {missingItems.map((item) => (
                        <Chip key={item.name} label={`Missing: ${item.name}`} size="small" />
                      ))}
                    </Stack>
                  ) : null}
                </Stack>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                Add food items to this recipe to compare it with your kitchen.
              </Typography>
            )}

            <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end", mt: 1.5 }}>
              <Button
                type="button"
                variant="outlined"
                size="small"
                onClick={() => setEditingRecipeId(recipe.id)}
              >
                Edit
              </Button>
            </Stack>
          </>
        )}
      </CardContent>
    </Card>
  );
}
