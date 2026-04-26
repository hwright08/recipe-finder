import { sendNoContent } from "h3";
import { z } from "zod";
import { deleteKitchenFoodItem } from "../../../../services/kitchenFoodItems";
import { requireAuthUser } from "../../../../utils/auth";
import { createRoute } from "../../../../utils/route";

const deleteKitchenFoodItemParamsSchema = z.object({
  id: z.coerce.number().int().positive()
});

export default createRoute({
  params: deleteKitchenFoodItemParamsSchema,
  handler: async (event, { params }) => {
    const user = await requireAuthUser(event);
    await deleteKitchenFoodItem(user, params.id);

    return sendNoContent(event);
  }
});
