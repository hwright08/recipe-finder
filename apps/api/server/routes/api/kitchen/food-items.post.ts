import { setResponseStatus } from "h3";
import { z } from "zod";
import { createKitchenFoodItem } from "../../../services/kitchenFoodItems";
import { requireAuthUser } from "../../../utils/auth";
import { createRoute } from "../../../utils/route";

const createKitchenFoodItemBodySchema = z.object({
  name: z.string().trim().min(1),
  isLow: z.boolean().default(false)
});

export default createRoute({
  body: createKitchenFoodItemBodySchema,
  handler: async (event, { body }) => {
    const user = await requireAuthUser(event);
    const item = await createKitchenFoodItem(user, body);

    setResponseStatus(event, 201);

    return {
      item
    };
  }
});
