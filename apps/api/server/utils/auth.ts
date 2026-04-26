import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { H3Event } from "h3";
import { createError, getHeader } from "h3";
import db from "./db";

const authSecret = process.env.AUTH_SECRET;
const tokenTtlSeconds = 60 * 60 * 24 * 7;

if (!authSecret || authSecret.length < 32) {
  throw new Error("AUTH_SECRET must be set to a strong value");
}

type TokenPayload = {
  sub: number;
  exp: number;
  nonce: string;
};

type UserRow = {
  id: number;
  email: string;
  display_name: string;
};

export type AuthUser = {
  id: number;
  email: string;
  displayName: string;
};

export async function createAuthToken(userId: number) {
  const payload: TokenPayload = {
    sub: userId,
    exp: Math.floor(Date.now() / 1000) + tokenTtlSeconds,
    nonce: randomBytes(16).toString("hex")
  };
  const token = signToken(payload);

  const tokenHash = hashToken(token);

  await db.none(
    /*sql*/ `
      INSERT INTO user_sessions (
        user_id,
        token_hash,
        expires_at
      )
      VALUES ($[userId], $[tokenHash], to_timestamp($[expiresAt]))`,
    { userId, tokenHash, expiresAt: payload.exp }
  );

  return token;
}

export async function requireAuthUser(event: H3Event): Promise<AuthUser> {
  const token = getBearerToken(event);
  const payload = verifyToken(token);

  const userId = payload.sub;
  const tokenHash = hashToken(token);
  const user = await db.oneOrNone<UserRow>(
    /*sql*/ `
      SELECT
        users.id,
        users.email,
        users.display_name
      FROM users
      INNER JOIN user_sessions ON user_sessions.user_id = users.id
      WHERE users.id = $[userId]
        AND user_sessions.token_hash = $[tokenHash]
        AND user_sessions.expires_at > CURRENT_TIMESTAMP`,
    { userId, tokenHash }
  );

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized"
    });
  }

  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name
  };
}

export async function revokeAuthToken(event: H3Event) {
  const token = getBearerToken(event);
  const tokenHash = hashToken(token);

  await db.none(
    /*sql*/ `
      DELETE FROM user_sessions
      WHERE token_hash = $[tokenHash]`,
    { tokenHash }
  );
}

function getBearerToken(event: H3Event) {
  const authorization = getHeader(event, "authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw createError({
      statusCode: 401,
      statusMessage: "Missing bearer token"
    });
  }

  return authorization.slice("Bearer ".length);
}

function signToken(payload: TokenPayload) {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = createSignature(`${header}.${body}`);

  return `${header}.${body}.${signature}`;
}

function verifyToken(token: string): TokenPayload {
  const [header, body, signature] = token.split(".");

  if (!header || !body || !signature) {
    throwUnauthorized();
  }

  const expectedSignature = createSignature(`${header}.${body}`);

  if (!timingSafeEqualString(signature, expectedSignature)) {
    throwUnauthorized();
  }

  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as TokenPayload;

  if (!payload.sub || !payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) {
    throwUnauthorized();
  }

  return payload;
}

function createSignature(value: string) {
  return createHmac("sha256", authSecret).update(value).digest("base64url");
}

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function hashToken(token: string) {
  return createHmac("sha256", authSecret).update(token).digest("hex");
}

function timingSafeEqualString(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function throwUnauthorized(): never {
  throw createError({
    statusCode: 401,
    statusMessage: "Unauthorized"
  });
}
