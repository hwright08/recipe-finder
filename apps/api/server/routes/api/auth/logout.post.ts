import { revokeAuthToken } from "../../../utils/auth";

export default defineEventHandler(async (event) => {
  await revokeAuthToken(event);

  return {
    ok: true
  };
});
