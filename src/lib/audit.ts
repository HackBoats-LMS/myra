import { prisma } from "./prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import type { Prisma } from "@/generated/prisma";

/**
 * Persist an audit trail entry for restricted (admin/delivery) actions.
 * Never throws — audit failures must not break the primary operation.
 */
export async function logAudit(
  action: string,
  entity?: string,
  entityId?: string,
  meta?: Prisma.InputJsonValue
) {
  try {
    const session = await getServerSession(authOptions);
    await prisma.auditLog.create({
      data: {
        actorId: session?.user?.id || null,
        action,
        entity: entity || null,
        entityId: entityId || null,
        meta: meta ?? undefined,
      },
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }
}