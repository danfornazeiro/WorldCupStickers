import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

async function resetDatabase() {
  try {
    console.log("Dropping all tables and migrations...");
    await db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS user_stickers CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS users CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS stickers CASCADE`);
    console.log("✓ All tables and migrations dropped");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

resetDatabase();
