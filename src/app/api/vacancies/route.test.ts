import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    vacancy: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { GET, POST } from "./route";

const makeGetRequest = (params = "") =>
  new NextRequest(`http://localhost/api/vacancies${params ? `?${params}` : ""}`);

const makePostRequest = (body: object) =>
  new NextRequest("http://localhost/api/vacancies", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

const mockVacancy = {
  id: "v-1",
  userId: "employer-1",
  companyName: "Acme Corp",
  title: "Frontend Developer",
  description: "Build UIs",
  requirements: "React, TypeScript",
  salaryFrom: 100000,
  salaryTo: 200000,
  city: "Москва",
  type: "FULL_TIME",
  isPublished: true,
  createdAt: new Date(),
  user: { name: "Employer", email: "employer@example.com" },
};

beforeEach(() => vi.clearAllMocks());

describe("GET /api/vacancies", () => {
  it("returns vacancy list with total and pages", async () => {
    vi.mocked(prisma.vacancy.findMany).mockResolvedValue([mockVacancy]);
    vi.mocked(prisma.vacancy.count).mockResolvedValue(1);

    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.vacancies).toHaveLength(1);
    expect(json.total).toBe(1);
    expect(json.pages).toBe(1);
  });

  it("returns empty list when no vacancies match", async () => {
    vi.mocked(prisma.vacancy.findMany).mockResolvedValue([]);
    vi.mocked(prisma.vacancy.count).mockResolvedValue(0);

    const res = await GET(makeGetRequest("search=doesnotexist"));
    const json = await res.json();
    expect(json.vacancies).toHaveLength(0);
    expect(json.total).toBe(0);
  });

  it("calculates pages correctly for multiple results", async () => {
    vi.mocked(prisma.vacancy.findMany).mockResolvedValue([]);
    vi.mocked(prisma.vacancy.count).mockResolvedValue(25);

    const res = await GET(makeGetRequest());
    const json = await res.json();
    expect(json.pages).toBe(3); // ceil(25 / 10)
  });
});

describe("POST /api/vacancies", () => {
  const validBody = {
    companyName: "Acme Corp",
    title: "Frontend Developer",
    description: "Build great UIs",
    city: "Москва",
    type: "FULL_TIME",
  };

  it("returns 403 when unauthenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(403);
  });

  it("returns 403 when user is a SEEKER", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "seeker-1", email: "s@s.com", name: "Seeker", role: "SEEKER",
    });
    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(403);
  });

  it("returns 400 when required fields are missing", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "employer-1", email: "e@e.com", name: "Employer", role: "EMPLOYER",
    });
    const res = await POST(makePostRequest({ companyName: "Acme" }));
    expect(res.status).toBe(400);
  });

  it("returns 201 and created vacancy for EMPLOYER", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "employer-1", email: "e@e.com", name: "Employer", role: "EMPLOYER",
    });
    vi.mocked(prisma.vacancy.create).mockResolvedValue(mockVacancy);

    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.title).toBe("Frontend Developer");
  });
});
