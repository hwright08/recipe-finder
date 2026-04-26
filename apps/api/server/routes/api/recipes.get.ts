import { listRecipes } from "../../services/recipes";
import { requireAuthUser } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event);

  return {
    recipes: await listRecipes(user)
  };
});
