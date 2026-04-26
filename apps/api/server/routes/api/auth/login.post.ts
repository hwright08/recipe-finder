import { z } from "zod";
import { loginUser } from "../../../services/auth";
import { createRoute } from "../../../utils/route";

const loginBodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1)
});

export default createRoute({
  body: loginBodySchema,
  handler: async (_event, { body }) => {
    return loginUser(body);
  }
});
