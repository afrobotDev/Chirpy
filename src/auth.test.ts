import { describe, it, expect, vi } from "vitest";

vi.mock("./db/index.js", () => ({
  db: {},
}));

vi.mock("./db/schema.js", () => ({
  users: {},
}));

import { makeJWT, validateJWT } from "./auth.js";

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
