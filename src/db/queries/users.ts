import { asc, eq } from "drizzle-orm";
import { type Request } from "express";
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

// Chirps resource
export async function createChirp(chirp: NewChirp) {
  const [result] = await db.insert(chirps).values(chirp).returning();
  return result;
}

export async function getChirps() {
  const result = await db.select().from(chirps).orderBy(asc(chirps.createdAt));
  return result;
}

export async function getOneChirp(req: Request, chirpId: string) {
  const [result] = await db
    .select()
    .from(chirps)
    .where(eq(chirps.id, `${req.params}.${chirpId}`));
  return result;
}
