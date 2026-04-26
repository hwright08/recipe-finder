import { createError } from "h3";
import db from "../utils/db";
import type { AuthUser } from "../utils/auth";

type RecipeRow = {
  id: number;
  title: string;
  description: string;
  source: string | null;
  created_at: Date;
  author_id: number;
  author_name: string;
  food_items: string[];
};

type CreatedRecipeRow = {
  id: number;
  title: string;
  description: string;
  source: string | null;
  created_at: Date;
};

export type Recipe = {
  id: number;
  title: string;
  description: string;
  source: string | null;
  foodItems: string[];
  createdAt: string;
  author: {
    id: number;
    displayName: string;
  };
};

type RecipeInput = {
  title: string;
  description: string;
  source?: string;
  foodItems: string[];
};

export async function listRecipes(user: AuthUser): Promise<Recipe[]> {
  const userId = user.id;
  const recipes = await db.any<RecipeRow>(
    /*sql*/ `
      SELECT
        recipes.id,
        recipes.title,
        recipes.description,
        recipes.source,
        recipes.created_at,
        users.id AS author_id,
        users.display_name AS author_name,
        COALESCE(
          array_agg(food_items.name ORDER BY food_items.name)
            FILTER (WHERE food_items.id IS NOT NULL),
          '{}'
        ) AS food_items
      FROM recipes
      INNER JOIN users ON users.id = recipes.user_id
      LEFT JOIN recipe_food_items ON recipe_food_items.recipe_id = recipes.id
      LEFT JOIN food_items ON food_items.id = recipe_food_items.food_item_id
      WHERE recipes.user_id = $[userId]
      GROUP BY recipes.id, users.id, users.display_name
      ORDER BY recipes.created_at DESC`,
    { userId }
  );

  return recipes.map((recipe) =>
    toRecipe(recipe, {
      id: recipe.author_id,
      displayName: recipe.author_name
    })
  );
}

export async function createRecipe(
  user: AuthUser,
  input: RecipeInput
): Promise<Recipe> {
  const userId = user.id;
  const source = input.source?.trim() || null;
  const foodItems = normalizeFoodItems(input.foodItems);
  const recipe = await db.one<CreatedRecipeRow>(
    /*sql*/ `
      INSERT INTO recipes (
        user_id,
        title,
        description,
        source
      )
      VALUES ($[userId], $[title], $[description], $[source])
      RETURNING
        id,
        title,
        description,
        source,
        created_at`,
    { userId, title: input.title, description: input.description, source }
  );

  await replaceRecipeFoodItems(recipe.id, foodItems);

  return toRecipe(
    { ...recipe, food_items: foodItems },
    {
      id: user.id,
      displayName: user.displayName
    }
  );
}

export async function updateRecipe(user: AuthUser, id: number, input: RecipeInput): Promise<Recipe> {
  const userId = user.id;
  const source = input.source?.trim() || null;
  const foodItems = normalizeFoodItems(input.foodItems);
  const recipe = await db.oneOrNone<CreatedRecipeRow>(
    /*sql*/ `
      UPDATE recipes
      SET
        title = $[title],
        description = $[description],
        source = $[source],
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $[id]
        AND user_id = $[userId]
      RETURNING
        id,
        title,
        description,
        source,
        created_at`,
    { id, userId, title: input.title, description: input.description, source }
  );

  if (!recipe) {
    throw createError({
      statusCode: 404,
      statusMessage: "Recipe not found"
    });
  }

  await replaceRecipeFoodItems(recipe.id, foodItems);

  return toRecipe(
    { ...recipe, food_items: foodItems },
    {
      id: user.id,
      displayName: user.displayName
    }
  );
}

function normalizeFoodItems(foodItems: string[]) {
  return [...new Set(foodItems.map((item) => item.trim()).filter(Boolean))];
}

async function replaceRecipeFoodItems(recipeId: number, foodItems: string[]) {
  await db.none(
    /*sql*/ `
      DELETE FROM recipe_food_items
      WHERE recipe_id = $[recipeId]`,
    { recipeId }
  );

  for (const name of foodItems) {
    await db.none(
      /*sql*/ `
        WITH inserted_food AS (
          INSERT INTO food_items (name)
          VALUES ($[name])
          ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
          RETURNING id
        )
        INSERT INTO recipe_food_items (
          recipe_id,
          food_item_id
        )
        SELECT
          $[recipeId],
          inserted_food.id
        FROM inserted_food
        ON CONFLICT (recipe_id, food_item_id) DO NOTHING`,
      { recipeId, name }
    );
  }
}

function toRecipe(
  recipe: CreatedRecipeRow & { food_items: string[] },
  author: {
    id: number;
    displayName: string;
  }
): Recipe {
  return {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    source: recipe.source,
    foodItems: recipe.food_items,
    createdAt: recipe.created_at.toISOString(),
    author
  };
}
