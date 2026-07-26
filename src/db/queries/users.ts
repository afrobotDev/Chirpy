import { asc, eq } from "drizzle-orm";
import { db } from "../index.js";
import { type NewUser, type NewChirp, users, chirps } from "../schema.js";

// Users resouce
type UserResponse = Omit<NewUser, "hashedPassword">;
export async function createUser(
  email: string,
  password: string,
): Promise<UserResponse> {
  const [result] = await db
    .insert(users)
    .values({ email, hashedPassword: password })
    .onConflictDoNothing()
    .returning();
  return result as UserResponse;
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

export async function getOneChirp(chirpId: string) {
  const [result] = await db.select().from(chirps).where(eq(chirps.id, chirpId));
  return result;
}
