import { listKitchenFoodItems } from "../../../services/kitchenFoodItems";
import { requireAuthUser } from "../../../utils/auth";

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event);

  return {
    items: await listKitchenFoodItems(user)
  };
});
