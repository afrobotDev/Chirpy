import { asc, eq, desc } from "drizzle-orm";
import { db } from "../index.js";
import {
  type NewUser,
  type NewChirp,
  type NewRefreshTokens,
  users,
  chirps,
  refreshTokens,
} from "../schema.js";

// Users resouce
export type UserResponse = Omit<NewUser, "hashedPassword">;
export async function createUser(
  email: string,
  password: string,
): Promise<UserResponse> {
  const result = await db
    .insert(users)
    .values({ email, hashedPassword: password })
    .onConflictDoNothing()
    .returning();
  if (!result[0]) throw new Error("Failed to create user");
  const { hashedPassword: _, ...user } = result[0];
  return user;
}

export async function getUser(email: string): Promise<UserResponse> {
  const result = await db.select().from(users).where(eq(users.email, email));
  if (!result[0]) throw new Error("User not found");
  const { hashedPassword: _, ...user } = result[0];
  return user;
}

export async function getUsers(): Promise<UserResponse[]> {
  const result = await db.select().from(users).orderBy(desc(users.createdAt));
  return result.map(({ hashedPassword: _, ...user }) => user);
}

export async function updateUserCredentials(
  userId: string,
  email: string,
  password: string,
) {
  const [result] = await db
    .update(users)
    .set({ email, hashedPassword: password })
    .where(eq(users.id, userId))
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

export async function getOneChirp(chirpId: string) {
  const [result] = await db.select().from(chirps).where(eq(chirps.id, chirpId));
  return result;
}

// Refresh Tokens resource
export async function createRefreshToken(refreshToken: NewRefreshTokens) {
  const [result] = await db
    .insert(refreshTokens)
    .values(refreshToken)
    .returning();
  return result;
}

export async function getRefreshToken(token: string) {
  const [result] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.token, token));
  return result;
}

export async function revokeRefreshToken(token: string) {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date(), updatedAt: new Date() })
    .where(eq(refreshTokens.token, token));
}
