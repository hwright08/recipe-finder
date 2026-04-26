import { createRequire } from "node:module";
import type pgPromiseModule = require("pg-promise");

const require = createRequire(import.meta.url);
const pgPromise = require("pg-promise") as typeof pgPromiseModule;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const pgp = pgPromise();
const pgpDb = pgp(connectionString);

export const db = {
  query<T = unknown>(query: string, values?: unknown) {
    return pgpDb.result<T>(query, values);
  },
  oneOrNone<T = unknown>(query: string, values?: unknown) {
    return pgpDb.oneOrNone<T>(query, values);
  },
  one<T = unknown>(query: string, values?: unknown) {
    return pgpDb.one<T>(query, values);
  },
  none(query: string, values?: unknown) {
    return pgpDb.none(query, values);
  },
  any<T = unknown>(query: string, values?: unknown) {
    return pgpDb.any<T>(query, values);
  }
};

export const pool = db;

export default db;
