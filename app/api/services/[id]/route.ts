export const runtime = "nodejs";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

async function getBusinessId() {
  const business = await prisma.business.findFirst();
  if (!business) throw new Error("No business found (run bootstrap)");
  return business.id;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const businessId = await getBusinessId();
    const { id } = await params;

    const body = await req.json();

    const patch: any = {};
    if (body.name !== undefined) patch.name = body.name;
    if (body.description !== undefined) patch.description = body.description;
    if (body.durationMin !== undefined) patch.durationMin = body.durationMin;
    if (body.priceCents !== undefined) patch.priceCents = body.priceCents;
    if (body.depositCents !== undefined) patch.depositCents = body.depositCents;
    if (body.bufferBeforeMin !== undefined) patch.bufferBeforeMin = body.bufferBeforeMin;
    if (body.bufferAfterMin !== undefined) patch.bufferAfterMin = body.bufferAfterMin;
    if (body.bufferAfterMin !== undefined) patch.bufferAfterMin = body.bufferAfterMin;
    if (body.isActive !== undefined) patch.isActive = body.isActive;
    if (body.isPublic !== undefined) patch.isPublic = body.isPublic;

    const staffIds = (body.staffIds ?? null) as string[] | null;

    // Update core fields
    const updated = await prisma.service.update({
      where: { id },
      data: patch,
    });

    // If staffIds provided, replace assignments
    if (staffIds) {
      await prisma.serviceStaff.deleteMany({ where: { businessId, serviceId: id } });
      if (staffIds.length > 0) {
        await prisma.serviceStaff.createMany({
          data: staffIds.map((staffId) => ({ businessId, serviceId: id, staffId })),
        });
      }
    }

    const service = await prisma.service.findFirst({
      where: { businessId, id },
      include: { staffLinks: { include: { staff: true } } },
    });

    return Response.json({ ok: true, service: service ?? updated });
  } catch (e: any) {
    return Response.json({ ok: false, error: e.message || "Unknown error" }, { status: 400 });
  }
}
