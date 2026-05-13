import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const stickerStatusEnum = pgEnum("sticker_status", [
  "COLADA",
  "FALTANDO",
  "REPETIDA",
]);

export const familyMemberStatusEnum = pgEnum("family_member_status", [
  "pending",
  "accepted",
  "rejected",
]);

export const familyMemberRoleEnum = pgEnum("family_member_role", [
  "leader",
  "member",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const stickers = pgTable("stickers", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  country: text("country").notNull(),
  type: text("type").notNull(),
});

export const families = pgTable(
  "families",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    code: text("code").notNull().unique(),
    leaderId: uuid("leader_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    codeIndex: uniqueIndex("families_code_unique").on(table.code),
  }),
);

export const familyMembers = pgTable(
  "family_members",
  {
    id: serial("id").primaryKey(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: familyMemberRoleEnum("role").notNull().default("member"),
    status: familyMemberStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    familyUserUnique: uniqueIndex("family_members_family_user_unique").on(
      table.familyId,
      table.userId,
    ),
  }),
);

export const familyStickers = pgTable(
  "family_stickers",
  {
    id: serial("id").primaryKey(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    stickerId: integer("sticker_id")
      .notNull()
      .references(() => stickers.id, { onDelete: "cascade" }),
    status: stickerStatusEnum("status").notNull().default("FALTANDO"),
    repeatedCount: integer("repeated_count").notNull().default(0),
    updatedBy: uuid("updated_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    familyStickerUnique: uniqueIndex(
      "family_stickers_family_sticker_unique",
    ).on(table.familyId, table.stickerId),
  }),
);

export const userStickers = pgTable(
  "user_stickers",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stickerId: integer("sticker_id")
      .notNull()
      .references(() => stickers.id, { onDelete: "cascade" }),
    status: stickerStatusEnum("status").notNull().default("FALTANDO"),
    repeatedCount: integer("repeated_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    synced: boolean("synced").notNull().default(true),
  },
  (table) => ({
    uniqueUserSticker: uniqueIndex("user_sticker_unique").on(
      table.userId,
      table.stickerId,
    ),
  }),
);

export type StickerStatus = (typeof stickerStatusEnum.enumValues)[number];
export type FamilyMemberStatus =
  (typeof familyMemberStatusEnum.enumValues)[number];
export type FamilyMemberRole = (typeof familyMemberRoleEnum.enumValues)[number];
