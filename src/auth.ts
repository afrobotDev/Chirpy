import argon2 from "argon2";
import { eq } from "drizzle-orm";
import { db } from "./db/index.js";
import { users } from "./db/schema.js";

export async function hashPassword(password: string): Promise<string> {
  try {
    const hash = await argon2.hash(password);
    return hash;
  } catch (err) {
    if (err instanceof Error) {
      console.log(err.message);
    }
    throw err;
  }
}

export async function checkPasswordHash(
  password: string,
  email: string,
): Promise<boolean> {
  const result = await db
    .select({ getHash: users.hashedPassword })
    .from(users)
    .where(eq(users.email, email));
  if (!result[0]) return false;
  const { getHash } = result[0];
  try {
    return await argon2.verify(getHash, password);
  } catch (err) {
    if (err instanceof Error) {
      console.log(err.message);
    }
    throw err;
  }
}
