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
