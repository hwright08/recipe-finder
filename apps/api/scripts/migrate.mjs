import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pgPromise from "pg-promise";

await loadLocalEnv();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = await findSchemaPath([
  resolve(__dirname, "../../../db/init/001_schema.sql"),
  resolve(__dirname, "../db/init/001_schema.sql"),
  resolve(process.cwd(), "db/init/001_schema.sql")
]);
const schemaSql = await readFile(schemaPath, "utf8");

const pgp = pgPromise();
const db = pgp(databaseUrl);

try {
  await db.none(schemaSql);
  console.log("Database schema is up to date.");
} finally {
  pgp.end();
}

async function findSchemaPath(paths) {
  for (const path of paths) {
    try {
      await readFile(path, "utf8");
      return path;
    } catch (error) {
      if (error?.code !== "ENOENT") {
        throw error;
      }
    }
  }

  throw new Error("Could not find db/init/001_schema.sql");
}

async function loadLocalEnv() {
  if (process.env.DATABASE_URL) {
    return;
  }

  const envPath = await findFirstExistingPath([
    resolve(process.cwd(), ".env"),
    resolve(process.cwd(), "../../.env")
  ]);

  if (!envPath) {
    return;
  }

  const envFile = await readFile(envPath, "utf8");

  for (const line of envFile.split("\n")) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex);
    const value = trimmed.slice(separatorIndex + 1);

    process.env[key] ??= value;
  }
}

async function findFirstExistingPath(paths) {
  for (const path of paths) {
    try {
      await readFile(path, "utf8");
      return path;
    } catch (error) {
      if (error?.code !== "ENOENT") {
        throw error;
      }
    }
  }
}
