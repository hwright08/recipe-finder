import { setResponseStatus } from "h3";
import { z } from "zod";
import { registerUser } from "../../../services/auth";
import { createRoute } from "../../../utils/route";

const registerBodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
  displayName: z.string().trim().min(1).optional()
});

export default createRoute({
  body: registerBodySchema,
  handler: async (event, { body }) => {
    const authResponse = await registerUser(body);
    setResponseStatus(event, 201);

    return authResponse;
  }
});
