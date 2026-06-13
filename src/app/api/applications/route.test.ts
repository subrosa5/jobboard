import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    application: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    resume: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { GET, POST } from "./route";

const makeGetRequest = () =>
  new NextRequest("http://localhost/api/applications");

const makePostRequest = (body: object) =>
  new NextRequest("http://localhost/api/applications", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

const seekerUser = { id: "seeker-1", email: "s@s.com", name: "Seeker", role: "SEEKER" };
const employerUser = { id: "employer-1", email: "e@e.com", name: "Employer", role: "EMPLOYER" };

beforeEach(() => vi.clearAllMocks());

describe("GET /api/applications", () => {
  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(401);
  });

  it("returns applications list for a SEEKER", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(seekerUser);
    vi.mocked(prisma.application.findMany).mockResolvedValue([
      { id: "app-1", status: "PENDING", vacancy: { title: "Dev", companyName: "Acme", city: "Москва" } } as never,
    ]);
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveLength(1);
  });

  it("returns applications list for an EMPLOYER", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(employerUser);
    vi.mocked(prisma.application.findMany).mockResolvedValue([
      { id: "app-1", status: "PENDING" } as never,
      { id: "app-2", status: "ACCEPTED" } as never,
    ]);
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    expect((await res.json())).toHaveLength(2);
  });
});

describe("POST /api/applications", () => {
  const validBody = { vacancyId: "v-1", resumeId: "r-1", message: "Хочу работать у вас" };

  it("returns 403 when unauthenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(403);
  });

  it("returns 403 when user is an EMPLOYER", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(employerUser);
    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("Только соискатели могут откликаться");
  });

  it("returns 400 when vacancyId or resumeId is missing", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(seekerUser);
    const res = await POST(makePostRequest({ message: "Hello" }));
    expect(res.status).toBe(400);
  });

  it("returns 404 when resume does not belong to the user", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(seekerUser);
    vi.mocked(prisma.resume.findUnique).mockResolvedValue({
      id: "r-1", userId: "someone-else",
    } as never);
    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(404);
  });

  it("returns 409 when user already applied to this vacancy", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(seekerUser);
    vi.mocked(prisma.resume.findUnique).mockResolvedValue({ id: "r-1", userId: "seeker-1" } as never);
    vi.mocked(prisma.application.findUnique).mockResolvedValue({ id: "existing-app" } as never);

    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe("Вы уже откликнулись на эту вакансию");
  });

  it("returns 201 and created application on success", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(seekerUser);
    vi.mocked(prisma.resume.findUnique).mockResolvedValue({ id: "r-1", userId: "seeker-1" } as never);
    vi.mocked(prisma.application.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.application.create).mockResolvedValue({
      id: "new-app", userId: "seeker-1", vacancyId: "v-1", resumeId: "r-1", status: "PENDING",
    } as never);

    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.status).toBe("PENDING");
  });
});
