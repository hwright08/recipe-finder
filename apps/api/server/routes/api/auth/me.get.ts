import { requireAuthUser } from "../../../utils/auth";

export default defineEventHandler(async (event) => {
  return {
    user: await requireAuthUser(event)
  };
});
