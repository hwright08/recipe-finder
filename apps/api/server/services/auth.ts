import { createError } from "h3";
import { createAuthToken } from "../utils/auth";
import db from "../utils/db";
import { hashPassword, verifyPassword } from "../utils/password";

type UserRow = {
  id: number;
  email: string;
  password_hash: string;
  display_name: string;
};

type PublicUserRow = {
  id: number;
  email: string;
  display_name: string;
};

export type AuthResponse = {
  token: string;
  user: {
    id: number;
    email: string;
    displayName: string;
  };
};

export async function loginUser(input: { email: string; password: string }): Promise<AuthResponse> {
  const user = await db.oneOrNone<UserRow>(
    /*sql*/ `
      SELECT
        id,
        email,
        password_hash,
        display_name
      FROM users
      WHERE email = $[email]`,
    { email: input.email }
  );

  if (!user || !verifyPassword(input.password, user.password_hash)) {
    throwInvalidLogin();
  }

  return {
    token: await createAuthToken(user.id),
    user: toPublicUser(user)
  };
}

export async function registerUser(input: {
  email: string;
  password: string;
  displayName?: string;
}): Promise<AuthResponse> {
  const displayName = input.displayName || input.email;
  const passwordHash = hashPassword(input.password);
  const user = await db
    .one<PublicUserRow>(
      /*sql*/ `
        WITH inserted_user AS (
          INSERT INTO users (email, password_hash, display_name)
          VALUES ($[email], $[passwordHash], $[displayName])
          RETURNING
            id,
            email,
            display_name
        ),
        inserted_kitchen AS (
          INSERT INTO kitchens (user_id)
          SELECT id FROM inserted_user
          RETURNING id
        )
        SELECT
          id,
          email,
          display_name
        FROM inserted_user`,
      { email: input.email, passwordHash, displayName }
    )
    .catch((error: { code?: string }) => {
      if (error.code === "23505") {
        throw createError({
          statusCode: 409,
          statusMessage: "Email is already registered"
        });
      }

      throw error;
    });

  return {
    token: await createAuthToken(user.id),
    user: toPublicUser(user)
  };
}

function toPublicUser(user: PublicUserRow) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name
  };
}

function throwInvalidLogin(): never {
  throw createError({
    statusCode: 401,
    statusMessage: "Invalid email or password"
  });
}
