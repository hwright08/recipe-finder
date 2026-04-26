import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

const algorithm = "pbkdf2_sha256";
const iterations = 120_000;
const keyLength = 32;
const digest = "sha256";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, iterations, keyLength, digest).toString("hex");

  return `${algorithm}$${iterations}$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [storedAlgorithm, storedIterations, salt, hash] = storedHash.split("$");

  if (storedAlgorithm !== algorithm || !storedIterations || !salt || !hash) {
    return false;
  }

  const computedHash = pbkdf2Sync(
    password,
    salt,
    Number(storedIterations),
    Buffer.from(hash, "hex").length,
    digest
  );
  const storedHashBuffer = Buffer.from(hash, "hex");

  return (
    computedHash.length === storedHashBuffer.length &&
    timingSafeEqual(computedHash, storedHashBuffer)
  );
}
