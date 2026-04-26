import { setResponseStatus } from "h3";
import { z } from "zod";
import { createRecipe } from "../../services/recipes";
import { requireAuthUser } from "../../utils/auth";
import { createRoute } from "../../utils/route";

const createRecipeBodySchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().default(""),
  source: z.string().trim().optional(),
  foodItems: z.array(z.string().trim().min(1)).default([])
});

export default createRoute({
  body: createRecipeBodySchema,
  handler: async (event, { body }) => {
    const user = await requireAuthUser(event);
    const recipe = await createRecipe(user, body);

    setResponseStatus(event, 201);

    return {
      recipe
    };
  }
});
