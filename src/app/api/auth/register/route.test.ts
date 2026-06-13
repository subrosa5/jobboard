import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { POST } from "./route";

const makeRequest = (body: object) =>
  new NextRequest("http://localhost/api/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

const validBody = {
  name: "Test User",
  email: "test@example.com",
  password: "secret123",
  role: "SEEKER",
};

const createdUser = {
  id: "new-user",
  name: validBody.name,
  email: validBody.email,
  password: "$2b$12$hashed",
  role: "SEEKER",
  telegramLinked: false,
  twoFAEnabled: false,
  telegramChatId: null,
  otpCode: null,
  otpExpiry: null,
  linkCode: null,
  phone: null,
  createdAt: new Date(),
};

beforeEach(() => vi.clearAllMocks());

describe("POST /api/auth/register", () => {
  it("returns 400 when name is missing", async () => {
    const res = await POST(makeRequest({ ...validBody, name: "" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when email is missing", async () => {
    const res = await POST(makeRequest({ ...validBody, email: "" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when password is missing", async () => {
    const res = await POST(makeRequest({ ...validBody, password: "" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when role is missing", async () => {
    const res = await POST(makeRequest({ ...validBody, role: "" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid role value", async () => {
    const res = await POST(makeRequest({ ...validBody, role: "MANAGER" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Неверная роль");
  });

  it("accepts SEEKER as a valid role", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue(createdUser);
    const res = await POST(makeRequest({ ...validBody, role: "SEEKER" }));
    expect(res.status).toBe(200);
  });

  it("accepts EMPLOYER as a valid role", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({ ...createdUser, role: "EMPLOYER" });
    const res = await POST(makeRequest({ ...validBody, role: "EMPLOYER" }));
    expect(res.status).toBe(200);
  });

  it("returns 409 when email is already taken", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(createdUser);
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe("Email уже занят");
  });

  it("returns 200 and user data on success", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue(createdUser);
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.user.email).toBe(validBody.email);
    expect(json.user.role).toBe("SEEKER");
  });

  it("does not expose the password hash in the response", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue(createdUser);
    const res = await POST(makeRequest(validBody));
    expect((await res.json()).user.password).toBeUndefined();
  });

  it("sets an httpOnly cookie on success", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue(createdUser);
    const res = await POST(makeRequest(validBody));
    expect(res.headers.get("set-cookie")).toContain("HttpOnly");
  });
});
