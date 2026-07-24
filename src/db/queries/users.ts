import { db } from "../index.js";
import { type NewUser, type NewChirp, users, chirps } from "../schema.js";

export async function createUser(user: NewUser) {
  const [result] = await db
    .insert(users)
    .values(user)
    .onConflictDoNothing()
    .returning();
  return result;
}

export async function deleteUsers() {
  await db.delete(users);
}

export async function createChirp(chirp: NewChirp) {
  const [result] = await db.insert(chirps).values(chirp).returning();
  return result;
}
