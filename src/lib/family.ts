import { randomInt } from "crypto";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { computeAlbumStats, type StickerWithState } from "@/lib/album";
import {
  familyMembers,
  familyStickers,
  families,
  stickers,
  type FamilyMemberRole,
  type FamilyMemberStatus,
  type StickerStatus,
  userStickers,
  users,
} from "@/db/schema";

export type AlbumScope =
  | {
      kind: "user";
      userId: string;
    }
  | {
      kind: "family";
      userId: string;
      familyId: string;
      familyCode: string;
      familyName: string;
      leaderId: string;
      membershipId: number;
      role: FamilyMemberRole;
    };

export type FamilyMemberRecord = {
  id: number;
  familyId: string;
  userId: string;
  name: string;
  email: string;
  role: FamilyMemberRole;
  status: FamilyMemberStatus;
  createdAt: Date;
};

export type FamilyOverview = {
  id: string;
  name: string;
  code: string;
  leaderId: string;
  createdAt: Date;
  leaderName: string;
  leaderEmail: string;
  memberCount: number;
  pendingCount: number;
  acceptedCount: number;
  rejectedCount: number;
  stats: ReturnType<typeof computeAlbumStats>;
  members: FamilyMemberRecord[];
};

const FAMILY_CODE_PREFIX = "COPA-";

export function normalizeFamilyCode(code: string) {
  return code.trim().toUpperCase();
}

async function generateUniqueFamilyCode() {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const suffix = randomInt(36 ** 4)
      .toString(36)
      .toUpperCase()
      .padStart(4, "0");
    const code = `${FAMILY_CODE_PREFIX}${suffix}`;

    const [existing] = await db
      .select({ id: families.id })
      .from(families)
      .where(eq(families.code, code))
      .limit(1);

    if (!existing) {
      return code;
    }
  }

  throw new Error("Não foi possível gerar um código de família único.");
}

export async function getActiveFamilyMembership(userId: string) {
  const [membership] = await db
    .select({
      membershipId: familyMembers.id,
      familyId: familyMembers.familyId,
      role: familyMembers.role,
      status: familyMembers.status,
      familyName: families.name,
      familyCode: families.code,
      leaderId: families.leaderId,
    })
    .from(familyMembers)
    .innerJoin(families, eq(familyMembers.familyId, families.id))
    .where(
      and(
        eq(familyMembers.userId, userId),
        eq(familyMembers.status, "accepted"),
      ),
    )
    .orderBy(desc(familyMembers.createdAt))
    .limit(1);

  return membership ?? null;
}

export async function resolveAlbumScope(userId: string): Promise<AlbumScope> {
  const membership = await getActiveFamilyMembership(userId);

  if (!membership) {
    return {
      kind: "user",
      userId,
    };
  }

  return {
    kind: "family",
    userId,
    familyId: membership.familyId,
    familyCode: membership.familyCode,
    familyName: membership.familyName,
    leaderId: membership.leaderId,
    membershipId: membership.membershipId,
    role: membership.role,
  };
}

export async function loadAlbumStickers(
  userId: string,
): Promise<StickerWithState[]> {
  const scope = await resolveAlbumScope(userId);

  if (scope.kind === "family") {
    const rows = await db
      .select({
        id: stickers.id,
        code: stickers.code,
        country: stickers.country,
        type: stickers.type,
        familyStatus: familyStickers.status,
        familyRepeatedCount: familyStickers.repeatedCount,
        personalStatus: userStickers.status,
        personalRepeatedCount: userStickers.repeatedCount,
      })
      .from(stickers)
      .leftJoin(
        familyStickers,
        and(
          eq(familyStickers.stickerId, stickers.id),
          eq(familyStickers.familyId, scope.familyId),
        ),
      )
      .leftJoin(
        userStickers,
        and(
          eq(userStickers.stickerId, stickers.id),
          eq(userStickers.userId, scope.userId),
        ),
      );

    return rows.map((row) => ({
      ...row,
      status: row.familyStatus ?? row.personalStatus ?? null,
      repeatedCount: row.familyRepeatedCount ?? row.personalRepeatedCount ?? 0,
    }));
  }

  const rows = await db
    .select({
      id: stickers.id,
      code: stickers.code,
      country: stickers.country,
      type: stickers.type,
      status: userStickers.status,
      repeatedCount: userStickers.repeatedCount,
    })
    .from(stickers)
    .leftJoin(
      userStickers,
      and(
        eq(userStickers.stickerId, stickers.id),
        eq(userStickers.userId, scope.userId),
      ),
    );

  return rows.map((row) => ({
    ...row,
    status: row.status ?? null,
    repeatedCount: row.repeatedCount ?? 0,
  }));
}

export async function saveStickerState(
  userId: string,
  stickerId: number,
  status: StickerStatus,
  repeatedCount: number,
) {
  const scope = await resolveAlbumScope(userId);

  if (scope.kind === "family") {
    const [updated] = await db
      .insert(familyStickers)
      .values({
        familyId: scope.familyId,
        stickerId,
        status,
        repeatedCount,
        updatedBy: userId,
      })
      .onConflictDoUpdate({
        target: [familyStickers.familyId, familyStickers.stickerId],
        set: {
          status,
          repeatedCount,
          updatedBy: userId,
          updatedAt: new Date(),
        },
      })
      .returning();

    await db
      .insert(userStickers)
      .values({
        userId,
        stickerId,
        status,
        repeatedCount,
      })
      .onConflictDoUpdate({
        target: [userStickers.userId, userStickers.stickerId],
        set: {
          status,
          repeatedCount,
          updatedAt: new Date(),
        },
      });

    return updated;
  }

  const [updated] = await db
    .insert(userStickers)
    .values({
      userId,
      stickerId,
      status,
      repeatedCount,
    })
    .onConflictDoUpdate({
      target: [userStickers.userId, userStickers.stickerId],
      set: {
        status,
        repeatedCount,
        updatedAt: new Date(),
      },
    })
    .returning();

  return updated;
}

export async function loadFamilyOverview(
  userId: string,
): Promise<FamilyOverview | null> {
  const membership = await getActiveFamilyMembership(userId);

  if (!membership) {
    return null;
  }

  const [family] = await db
    .select({
      id: families.id,
      name: families.name,
      code: families.code,
      leaderId: families.leaderId,
      createdAt: families.createdAt,
      leaderName: users.name,
      leaderEmail: users.email,
    })
    .from(families)
    .innerJoin(users, eq(families.leaderId, users.id))
    .where(eq(families.id, membership.familyId))
    .limit(1);

  if (!family) {
    return null;
  }

  const members = await db
    .select({
      id: familyMembers.id,
      familyId: familyMembers.familyId,
      userId: familyMembers.userId,
      name: users.name,
      email: users.email,
      role: familyMembers.role,
      status: familyMembers.status,
      createdAt: familyMembers.createdAt,
    })
    .from(familyMembers)
    .innerJoin(users, eq(familyMembers.userId, users.id))
    .where(eq(familyMembers.familyId, family.id))
    .orderBy(desc(familyMembers.createdAt));

  const acceptedCount = members.filter(
    (member) => member.status === "accepted",
  ).length;
  const pendingCount = members.filter(
    (member) => member.status === "pending",
  ).length;
  const rejectedCount = members.filter(
    (member) => member.status === "rejected",
  ).length;

  const rows = await db
    .select({
      id: stickers.id,
      code: stickers.code,
      country: stickers.country,
      type: stickers.type,
      status: familyStickers.status,
      repeatedCount: familyStickers.repeatedCount,
    })
    .from(stickers)
    .leftJoin(
      familyStickers,
      and(
        eq(familyStickers.stickerId, stickers.id),
        eq(familyStickers.familyId, family.id),
      ),
    );

  const stats = computeAlbumStats(
    rows.map((row) => ({
      ...row,
      status: row.status ?? null,
      repeatedCount: row.repeatedCount ?? 0,
    })),
  );

  return {
    id: family.id,
    name: family.name,
    code: family.code,
    leaderId: family.leaderId,
    createdAt: family.createdAt,
    leaderName: family.leaderName,
    leaderEmail: family.leaderEmail,
    memberCount: acceptedCount,
    pendingCount,
    acceptedCount,
    rejectedCount,
    stats,
    members,
  };
}

export async function createFamilyForUser(userId: string, name: string) {
  const active = await getActiveFamilyMembership(userId);

  if (active) {
    throw new Error("Você já faz parte de uma família ativa.");
  }

  const code = await generateUniqueFamilyCode();

  const result = await db.transaction(async (transaction) => {
    const [family] = await transaction
      .insert(families)
      .values({
        name,
        code,
        leaderId: userId,
      })
      .returning();

    if (!family) {
      throw new Error("Falha ao criar a família.");
    }

    await transaction.insert(familyMembers).values({
      familyId: family.id,
      userId,
      role: "leader",
      status: "accepted",
    });

    const personalStickers = await transaction
      .select({
        stickerId: userStickers.stickerId,
        status: userStickers.status,
        repeatedCount: userStickers.repeatedCount,
      })
      .from(userStickers)
      .where(eq(userStickers.userId, userId));

    if (personalStickers.length > 0) {
      await transaction.insert(familyStickers).values(
        personalStickers.map((sticker) => ({
          familyId: family.id,
          stickerId: sticker.stickerId,
          status: sticker.status,
          repeatedCount: sticker.repeatedCount,
          updatedBy: userId,
        })),
      );
    }

    return family;
  });

  return { ...result, code };
}

export async function requestJoinFamily(userId: string, code: string) {
  const active = await getActiveFamilyMembership(userId);

  if (active) {
    throw new Error("Você já faz parte de uma família ativa.");
  }

  const normalizedCode = normalizeFamilyCode(code);

  const [family] = await db
    .select({
      id: families.id,
      code: families.code,
      name: families.name,
      leaderId: families.leaderId,
    })
    .from(families)
    .where(eq(families.code, normalizedCode))
    .limit(1);

  if (!family) {
    throw new Error("Código de família inválido.");
  }

  const [existing] = await db
    .select({ id: familyMembers.id, status: familyMembers.status })
    .from(familyMembers)
    .where(
      and(
        eq(familyMembers.familyId, family.id),
        eq(familyMembers.userId, userId),
      ),
    )
    .limit(1);

  if (existing?.status === "accepted") {
    throw new Error("Você já está nessa família.");
  }

  const [member] = await db
    .insert(familyMembers)
    .values({
      familyId: family.id,
      userId,
      role: "member",
      status: "pending",
    })
    .onConflictDoUpdate({
      target: [familyMembers.familyId, familyMembers.userId],
      set: {
        role: "member",
        status: "pending",
      },
    })
    .returning();

  return { family, member };
}

export async function updateFamilyMemberStatus({
  leaderId,
  memberId,
  action,
}: {
  leaderId: string;
  memberId: number;
  action: "approve" | "reject" | "remove";
}) {
  const family = await getActiveFamilyMembership(leaderId);

  if (!family || family.leaderId !== leaderId || family.role !== "leader") {
    throw new Error("Apenas o líder pode gerenciar a família.");
  }

  const [target] = await db
    .select({
      id: familyMembers.id,
      familyId: familyMembers.familyId,
      userId: familyMembers.userId,
      status: familyMembers.status,
      role: familyMembers.role,
    })
    .from(familyMembers)
    .where(
      and(
        eq(familyMembers.id, memberId),
        eq(familyMembers.familyId, family.familyId),
      ),
    )
    .limit(1);

  if (!target) {
    throw new Error("Membro não encontrado.");
  }

  if (target.userId === leaderId) {
    throw new Error("O líder não pode ser removido ou alterado dessa forma.");
  }

  const nextStatus = action === "approve" ? "accepted" : "rejected";
  const [updated] = await db
    .update(familyMembers)
    .set({
      status: nextStatus,
      role: "member",
    })
    .where(eq(familyMembers.id, memberId))
    .returning();

  return updated;
}

export async function deleteFamilyForLeader(leaderId: string) {
  const family = await getActiveFamilyMembership(leaderId);

  if (!family || family.leaderId !== leaderId || family.role !== "leader") {
    throw new Error("Apenas o líder pode excluir a família.");
  }

  const [deleted] = await db
    .delete(families)
    .where(eq(families.id, family.familyId))
    .returning();

  return deleted;
}
