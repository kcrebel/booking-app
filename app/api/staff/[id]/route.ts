export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await req.json();
    const displayName = body.displayName as string | undefined;
    const phone = body.phone as string | null | undefined;
    const isActive = body.isActive as boolean | undefined;
    const sortOrder = body.sortOrder as number | undefined;

    const staff = await prisma.staffProfile.update({
      where: { id },
      data: {
        ...(displayName !== undefined ? { displayName } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
        ...(sortOrder !== undefined ? { sortOrder } : {}),
      },
    });

    return Response.json({ ok: true, staff });
  } catch (e: any) {
    return Response.json(
      { ok: false, error: e?.message || "Staff PATCH failed" },
      { status: 500 }
    );
  }
}
