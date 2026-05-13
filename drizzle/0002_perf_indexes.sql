CREATE INDEX "family_members_user_status_created_idx" ON "family_members" USING btree ("user_id","status","created_at" DESC);
--> statement-breakpoint
CREATE INDEX "family_members_family_created_idx" ON "family_members" USING btree ("family_id","created_at" DESC);