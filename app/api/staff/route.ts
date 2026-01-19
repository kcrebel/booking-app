import { prisma } from "@/lib/prisma";

export async function GET() {
  const business = await prisma.business.findFirst();
  if (!business) {
    return Response.json({ ok: false, error: "No business found" }, { status: 400 });
  }

  const staff = await prisma.staffProfile.findMany({
    where: { businessId: business.id },
    orderBy: { sortOrder: "asc" },
  });

  return Response.json({ ok: true, staff });
}

export async function POST(req: Request) {
  const business = await prisma.business.findFirst();
  if (!business) {
    return Response.json({ ok: false, error: "No business found" }, { status: 400 });
  }

  const body = await req.json();
  const email = body.email as string | undefined;
  const displayName = body.displayName as string | undefined;
  const phone = body.phone as string | undefined;

  if (!email || !displayName) {
    return Response.json(
      { ok: false, error: "email and displayName required" },
      { status: 400 }
    );
  }

  const user = await prisma.user.create({
    data: {
      businessId: business.id,
      email,
      role: "STAFF",
      staff: {
        create: {
          businessId: business.id,
          displayName,
          phone,
        },
      },
    },
    include: { staff: true },
  });

  return Response.json({ ok: true, user });
}
