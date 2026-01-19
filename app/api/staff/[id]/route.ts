import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const { id } = ctx.params;

  const body = await req.json();
  const displayName = body.displayName as string | undefined;
  const phone = body.phone as string | undefined;
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
}
