import { describe, it, expect } from "vitest";
import { signToken, verifyToken, hashPassword, comparePassword } from "./auth";

describe("signToken / verifyToken", () => {
  const payload = { id: "user-1", email: "test@example.com", name: "Test User", role: "SEEKER" };

  it("signs a token and verifies it back with the correct payload", () => {
    const token = signToken(payload);
    const result = verifyToken(token);

    expect(result?.id).toBe(payload.id);
    expect(result?.email).toBe(payload.email);
    expect(result?.name).toBe(payload.name);
    expect(result?.role).toBe(payload.role);
  });

  it("preserves the role field (SEEKER)", () => {
    const token = signToken({ ...payload, role: "SEEKER" });
    expect(verifyToken(token)?.role).toBe("SEEKER");
  });

  it("preserves the role field (EMPLOYER)", () => {
    const token = signToken({ ...payload, role: "EMPLOYER" });
    expect(verifyToken(token)?.role).toBe("EMPLOYER");
  });

  it("returns null for a tampered token", () => {
    const token = signToken(payload);
    const tampered = token.slice(0, -5) + "xxxxx";
    expect(verifyToken(tampered)).toBeNull();
  });

  it("returns null for a completely invalid token", () => {
    expect(verifyToken("not.a.token")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(verifyToken("")).toBeNull();
  });
});

describe("hashPassword / comparePassword", () => {
  it("hashes a password and verifies it correctly", async () => {
    const hash = await hashPassword("myPassword123");
    expect(await comparePassword("myPassword123", hash)).toBe(true);
  });

  it("rejects the wrong password", async () => {
    const hash = await hashPassword("myPassword123");
    expect(await comparePassword("wrongPassword", hash)).toBe(false);
  });

  it("produces a bcrypt hash (starts with $2)", async () => {
    const hash = await hashPassword("secret");
    expect(hash.startsWith("$2")).toBe(true);
  });

  it("never stores the password in plaintext", async () => {
    const hash = await hashPassword("plaintext");
    expect(hash).not.toBe("plaintext");
  });

  it("produces unique hashes for the same input due to salting", async () => {
    const hash1 = await hashPassword("same");
    const hash2 = await hashPassword("same");
    expect(hash1).not.toBe(hash2);
  });
});
