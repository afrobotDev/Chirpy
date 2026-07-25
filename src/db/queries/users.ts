import { asc } from "drizzle-orm";
import { db } from "../index.js";
import { type NewUser, type NewChirp, users, chirps } from "../schema.js";

// Users resouce
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

// Chirps resouce
export async function createChirp(chirp: NewChirp) {
  const [result] = await db.insert(chirps).values(chirp).returning();
  return result;
}

export async function getChirps() {
  const [result] = await db.select().from(users).orderBy(asc(users.createdAt));
}
