export const runtime = "nodejs";
import { prisma } from "@/lib/prisma";
async function getBusinessId() {
  const business = await prisma.business.findFirst();
  if (!business) throw new Error("No business found (run bootstrap)");
  return business.id;
}

export async function GET() {
  try {
    const businessId = await getBusinessId();

    const services = await prisma.service.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      include: {
        staffLinks: {
          include: { staff: true },
        },
      },
    });

    return Response.json({ ok: true, services });
  } catch (e: any) {
    return Response.json({ ok: false, error: e.message || "Unknown error" }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const businessId = await getBusinessId();
    const body = await req.json();

    const name = body.name as string | undefined;
    const description = body.description as string | undefined;
    const durationMin = body.durationMin as number | undefined;
    const priceCents = body.priceCents as number | undefined;
    const depositCents = (body.depositCents ?? 0) as number;
    const bufferBeforeMin = (body.bufferBeforeMin ?? 0) as number;
    const bufferAfterMin = (body.bufferAfterMin ?? 0) as number;
    const isActive = (body.isActive ?? true) as boolean;
    const isPublic = (body.isPublic ?? true) as boolean;

    const staffIds = (body.staffIds ?? []) as string[];

    if (!name || !durationMin || priceCents === undefined) {
      return Response.json(
        { ok: false, error: "name, durationMin, priceCents required" },
        { status: 400 }
      );
    }

    const service = await prisma.service.create({
      data: {
        businessId,
        name,
        description,
        durationMin,
        priceCents,
        depositCents,
        bufferBeforeMin,
        bufferAfterMin,
        isActive,
        isPublic,
        staffLinks: {
          create: staffIds.map((staffId) => ({
            businessId,
            staffId,
          })),
        },
      },
      include: {
        staffLinks: { include: { staff: true } },
      },
    });

    return Response.json({ ok: true, service });
  } catch (e: any) {
    return Response.json({ ok: false, error: e.message || "Unknown error" }, { status: 400 });
  }
}
