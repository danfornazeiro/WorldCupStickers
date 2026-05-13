CREATE TYPE "public"."family_member_status" AS ENUM('pending', 'accepted', 'rejected');
CREATE TYPE "public"."family_member_role" AS ENUM('leader', 'member');

CREATE TABLE IF NOT EXISTS "families" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "code" text NOT NULL,
  "leader_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "families_code_unique" UNIQUE("code")
);

ALTER TABLE "families"
  ADD CONSTRAINT "families_leader_id_users_id_fk"
  FOREIGN KEY ("leader_id") REFERENCES "public"."users"("id") ON DELETE cascade;

CREATE TABLE IF NOT EXISTS "family_members" (
  "id" serial PRIMARY KEY NOT NULL,
  "family_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "role" "family_member_role" DEFAULT 'member' NOT NULL,
  "status" "family_member_status" DEFAULT 'pending' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "family_members_family_user_unique" UNIQUE("family_id", "user_id")
);

ALTER TABLE "family_members"
  ADD CONSTRAINT "family_members_family_id_families_id_fk"
  FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade;

ALTER TABLE "family_members"
  ADD CONSTRAINT "family_members_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade;

CREATE TABLE IF NOT EXISTS "family_stickers" (
  "id" serial PRIMARY KEY NOT NULL,
  "family_id" uuid NOT NULL,
  "sticker_id" integer NOT NULL,
  "status" "sticker_status" DEFAULT 'FALTANDO' NOT NULL,
  "repeated_count" integer DEFAULT 0 NOT NULL,
  "updated_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "family_stickers_family_sticker_unique" UNIQUE("family_id", "sticker_id")
);

ALTER TABLE "family_stickers"
  ADD CONSTRAINT "family_stickers_family_id_families_id_fk"
  FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade;

ALTER TABLE "family_stickers"
  ADD CONSTRAINT "family_stickers_sticker_id_stickers_id_fk"
  FOREIGN KEY ("sticker_id") REFERENCES "public"."stickers"("id") ON DELETE cascade;

ALTER TABLE "family_stickers"
  ADD CONSTRAINT "family_stickers_updated_by_users_id_fk"
  FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null;