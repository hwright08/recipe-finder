import { z } from "zod";
import { updateKitchenFoodItem } from "../../../../services/kitchenFoodItems";
import { requireAuthUser } from "../../../../utils/auth";
import { createRoute } from "../../../../utils/route";

const updateKitchenFoodItemParamsSchema = z.object({
  id: z.coerce.number().int().positive()
});

const updateKitchenFoodItemBodySchema = z.object({
  isLow: z.boolean()
});

export default createRoute({
  params: updateKitchenFoodItemParamsSchema,
  body: updateKitchenFoodItemBodySchema,
  handler: async (event, { body, params }) => {
    const user = await requireAuthUser(event);
    const item = await updateKitchenFoodItem(user, {
      id: params.id,
      isLow: body.isLow
    });

    return {
      item
    };
  }
});
