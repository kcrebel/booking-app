import { prisma } from "@/lib/prisma";

export async function POST() {
  // Safety: prevent running in production
  if (process.env.NODE_ENV === "production") {
    return new Response("Not allowed", { status: 403 });
  }

  const existing = await prisma.business.findFirst();
  if (existing) {
    return Response.json({ ok: true, message: "Already bootstrapped", businessId: existing.id });
  }

  const business = await prisma.business.create({
    data: {
      name: "Demo Business",
      timezone: "America/Chicago",
    },
  });

  // Create an owner user (for now without real auth)
  const owner = await prisma.user.create({
    data: {
      businessId: business.id,
      email: "owner@example.com",
      name: "Owner",
      role: "OWNER",
      staff: {
        create: {
          businessId: business.id,
          displayName: "Owner",
        },
      },
    },
    include: { staff: true },
  });

  return Response.json({ ok: true, business, owner });
}
