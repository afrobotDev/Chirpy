import { describe, it, expect, vi, beforeEach } from "vitest";
import argon2 from "argon2";

const mocks = vi.hoisted(() => {
  const mockWhere = vi.fn();
  const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
  const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
  return { mockSelect, mockFrom, mockWhere };
});

vi.mock("./db/index.js", () => ({
  db: {
    select: (...args: any[]) => mocks.mockSelect(...args),
  },
}));

vi.mock("./db/schema.js", () => ({
  users: { email: "email", hashedPassword: "hashedPassword" },
}));

import { hashPassword, checkPasswordHash, makeJWT, validateJWT } from "./auth.js";

beforeEach(() => {
  mocks.mockWhere.mockReset();
  mocks.mockFrom.mockReset();
  mocks.mockSelect.mockReset();

  mocks.mockWhere.mockResolvedValue([]);
  mocks.mockFrom.mockReturnValue({ where: mocks.mockWhere });
  mocks.mockSelect.mockReturnValue({ from: mocks.mockFrom });
});

describe("hashPassword", () => {
  it("should return an argon2 hash", async () => {
    const hash = await hashPassword("mypassword");
    expect(hash).not.toBe("mypassword");
    expect(hash).toContain("$argon2");
  });

  it("should produce a hash that verifies correctly", async () => {
    const hash = await hashPassword("mypassword");
    const valid = await argon2.verify(hash, "mypassword");
    expect(valid).toBe(true);
  });

  it("should produce different hashes for same input (salt)", async () => {
    const hash1 = await hashPassword("mypassword");
    const hash2 = await hashPassword("mypassword");
    expect(hash1).not.toBe(hash2);
  });
});

describe("checkPasswordHash", () => {
  it("should return true for correct password", async () => {
    const hash = await argon2.hash("correctpass");
    mocks.mockWhere.mockResolvedValue([{ getHash: hash }]);

    const result = await checkPasswordHash("correctpass", "user@test.com");
    expect(result).toBe(true);
  });

  it("should return false for wrong password", async () => {
    const hash = await argon2.hash("correctpass");
    mocks.mockWhere.mockResolvedValue([{ getHash: hash }]);

    const result = await checkPasswordHash("wrongpass", "user@test.com");
    expect(result).toBe(false);
  });

  it("should return false when user not found", async () => {
    mocks.mockWhere.mockResolvedValue([]);

    const result = await checkPasswordHash("anypass", "nouser@test.com");
    expect(result).toBe(false);
  });
});

const secret = "test-secret";

describe("makeJWT", () => {
  it("should create a valid JWT", () => {
    const token = makeJWT("user-123", 3600, secret);
    const sub = validateJWT(token, secret);
    expect(sub).toBe("user-123");
  });

  it("should reject tokens signed with wrong secret", () => {
    const token = makeJWT("user-123", 3600, secret);
    expect(() => {
      validateJWT(token, "wrong-secret");
    }).toThrow("invalid token");
  });

  it("should reject expired tokens", () => {
    const token = makeJWT("user-123", -1, secret);
    expect(() => {
      validateJWT(token, secret);
    }).toThrow("invalid token");
  });
});
