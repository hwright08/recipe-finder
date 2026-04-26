import { createError } from "h3";
import db from "../utils/db";
import type { AuthUser } from "../utils/auth";

type KitchenFoodItemRow = {
  id: number;
  food_item_id: number;
  name: string;
  is_low: boolean;
  updated_at: Date;
};

type DeletedKitchenFoodItemRow = {
  id: number;
};

export type KitchenFoodItem = {
  id: number;
  foodItemId: number;
  name: string;
  isLow: boolean;
  updatedAt: string;
};

export async function listKitchenFoodItems(user: AuthUser): Promise<KitchenFoodItem[]> {
  const userId = user.id;
  const items = await db.any<KitchenFoodItemRow>(
    /*sql*/ `
      SELECT
        kitchen_food_items.id,
        food_items.id AS food_item_id,
        food_items.name,
        kitchen_food_items.is_low,
        kitchen_food_items.updated_at
      FROM kitchen_food_items
      INNER JOIN kitchens ON kitchens.id = kitchen_food_items.kitchen_id
      INNER JOIN food_items ON food_items.id = kitchen_food_items.food_item_id
      WHERE kitchens.user_id = $[userId]
      ORDER BY kitchen_food_items.is_low DESC, food_items.name ASC`,
    { userId }
  );

  return items.map(toKitchenFoodItem);
}

export async function createKitchenFoodItem(
  user: AuthUser,
  input: {
    name: string;
    isLow: boolean;
  }
): Promise<KitchenFoodItem> {
  const userId = user.id;
  const item = await db.oneOrNone<KitchenFoodItemRow>(
    /*sql*/ `
      WITH user_kitchen AS (
        SELECT id
        FROM kitchens
        WHERE user_id = $[userId]
        ORDER BY id ASC
        LIMIT 1
      ),
      inserted_food AS (
        INSERT INTO food_items (name)
        VALUES ($[name])
        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
        RETURNING
          id,
          name
      )
      INSERT INTO kitchen_food_items (
        kitchen_id,
        food_item_id,
        is_low
      )
      SELECT
        user_kitchen.id,
        inserted_food.id,
        $[isLow]
      FROM user_kitchen, inserted_food
      ON CONFLICT (kitchen_id, food_item_id)
        DO UPDATE SET
          is_low = EXCLUDED.is_low,
          updated_at = CURRENT_TIMESTAMP
      RETURNING
        id,
        food_item_id,
        (SELECT name FROM inserted_food) AS name,
        is_low,
        updated_at`,
    { userId, name: input.name, isLow: input.isLow }
  );

  if (!item) {
    throw createError({
      statusCode: 404,
      statusMessage: "Kitchen not found"
    });
  }

  return toKitchenFoodItem(item);
}

export async function updateKitchenFoodItem(
  user: AuthUser,
  input: {
    id: number;
    isLow: boolean;
  }
): Promise<KitchenFoodItem> {
  const userId = user.id;
  const item = await db.oneOrNone<KitchenFoodItemRow>(
    /*sql*/ `
      UPDATE kitchen_food_items
      SET
        is_low = $[isLow],
        updated_at = CURRENT_TIMESTAMP
      FROM kitchens, food_items
      WHERE kitchen_food_items.id = $[id]
        AND kitchen_food_items.kitchen_id = kitchens.id
        AND kitchen_food_items.food_item_id = food_items.id
        AND kitchens.user_id = $[userId]
      RETURNING
        kitchen_food_items.id,
        food_items.id AS food_item_id,
        food_items.name,
        kitchen_food_items.is_low,
        kitchen_food_items.updated_at`,
    { id: input.id, isLow: input.isLow, userId }
  );

  if (!item) {
    throw createError({
      statusCode: 404,
      statusMessage: "Kitchen food item not found"
    });
  }

  return toKitchenFoodItem(item);
}

export async function deleteKitchenFoodItem(user: AuthUser, id: number) {
  const userId = user.id;
  const deletedItem = await db.oneOrNone<DeletedKitchenFoodItemRow>(
    /*sql*/ `
      DELETE FROM kitchen_food_items
      USING kitchens
      WHERE kitchen_food_items.id = $[id]
        AND kitchen_food_items.kitchen_id = kitchens.id
        AND kitchens.user_id = $[userId]
      RETURNING kitchen_food_items.id`,
    { id, userId }
  );

  if (!deletedItem) {
    throw createError({
      statusCode: 404,
      statusMessage: "Kitchen food item not found"
    });
  }
}

function toKitchenFoodItem(item: KitchenFoodItemRow): KitchenFoodItem {
  return {
    id: item.id,
    foodItemId: item.food_item_id,
    name: item.name,
    isLow: item.is_low,
    updatedAt: item.updated_at.toISOString()
  };
}
