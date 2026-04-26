import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pgPromise from "pg-promise";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = resolve(__dirname, "../../../db/init/001_schema.sql");
const schemaSql = await readFile(schemaPath, "utf8");

const pgp = pgPromise();
const db = pgp(databaseUrl);

try {
  await db.none(schemaSql);
  console.log("Database schema is up to date.");
} finally {
  pgp.end();
}
