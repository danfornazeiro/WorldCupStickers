import { db } from "@/lib/db";
import { users } from "@/db/schema";

async function main() {
  try {
    const allUsers = await db.select().from(users);
    console.log("Users in database:", allUsers);
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
