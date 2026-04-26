const configuredOrigins = (process.env.FRONTEND_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export default defineEventHandler((event) => {
  const origin = event.node.req.headers.origin;

  if (!origin || configuredOrigins.length === 0) {
    return;
  }

  const allowedOrigin = configuredOrigins.includes("*")
    ? "*"
    : configuredOrigins.includes(origin)
      ? origin
      : undefined;

  if (!allowedOrigin) {
    return;
  }

  event.node.res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  event.node.res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  event.node.res.setHeader("Access-Control-Allow-Headers", "Authorization,Content-Type");
  event.node.res.setHeader("Vary", "Origin");

  if (event.node.req.method === "OPTIONS") {
    event.node.res.statusCode = 204;
    event.node.res.end();
  }
});
