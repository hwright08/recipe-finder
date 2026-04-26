import { z } from "zod";
import { updateRecipe } from "../../../services/recipes";
import { requireAuthUser } from "../../../utils/auth";
import { createRoute } from "../../../utils/route";

const updateRecipeParamsSchema = z.object({
  id: z.coerce.number().int().positive()
});

const updateRecipeBodySchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().default(""),
  source: z.string().trim().optional(),
  foodItems: z.array(z.string().trim().min(1)).default([])
});

export default createRoute({
  params: updateRecipeParamsSchema,
  body: updateRecipeBodySchema,
  handler: async (event, { params, body }) => {
    const user = await requireAuthUser(event);
    const recipe = await updateRecipe(user, params.id, body);

    return {
      recipe
    };
  }
});
