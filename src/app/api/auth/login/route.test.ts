import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/telegram", () => ({
  sendTelegramMessage: vi.fn(),
  generateOTP: vi.fn(() => "123456"),
}));

import { prisma } from "@/lib/prisma";
import { POST } from "./route";

const makeRequest = (body: object) =>
  new NextRequest("http://localhost/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

const makeUser = async (overrides = {}) => ({
  id: "user-1",
  name: "Test User",
  email: "test@example.com",
  password: await bcrypt.hash("secret123", 12),
  role: "SEEKER",
  twoFAEnabled: false,
  telegramChatId: null,
  telegramLinked: false,
  otpCode: null,
  otpExpiry: null,
  linkCode: null,
  phone: null,
  createdAt: new Date(),
  ...overrides,
});

beforeEach(() => vi.clearAllMocks());

describe("POST /api/auth/login", () => {
  it("returns 400 when email is missing", async () => {
    const res = await POST(makeRequest({ email: "", password: "secret" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when password is missing", async () => {
    const res = await POST(makeRequest({ email: "test@example.com", password: "" }));
    expect(res.status).toBe(400);
  });

  it("returns 401 when user does not exist", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    const res = await POST(makeRequest({ email: "ghost@example.com", password: "secret" }));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("Неверный email или пароль");
  });

  it("returns 401 when password is wrong", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(await makeUser());
    const res = await POST(makeRequest({ email: "test@example.com", password: "wrongPassword" }));
    expect(res.status).toBe(401);
  });

  it("returns 200 and sets cookie on valid credentials", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(await makeUser());
    const res = await POST(makeRequest({ email: "test@example.com", password: "secret123" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.user.email).toBe("test@example.com");
    expect(res.headers.get("set-cookie")).toContain("token=");
  });

  it("returns requireOTP when 2FA is enabled", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(
      await makeUser({ twoFAEnabled: true, telegramChatId: "123456789" })
    );
    vi.mocked(prisma.user.update).mockResolvedValue({} as never);

    const res = await POST(makeRequest({ email: "test@example.com", password: "secret123" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.requireOTP).toBe(true);
    expect(json.userId).toBe("user-1");
  });

  it("does not set a cookie when 2FA OTP is pending", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(
      await makeUser({ twoFAEnabled: true, telegramChatId: "123456789" })
    );
    vi.mocked(prisma.user.update).mockResolvedValue({} as never);

    const res = await POST(makeRequest({ email: "test@example.com", password: "secret123" }));
    expect(res.headers.get("set-cookie")).toBeNull();
  });
});
