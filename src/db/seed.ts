import { db } from "@/lib/db";
import { allStickerRecords } from "@/lib/stickers-data";
import { stickers } from "@/db/schema";

async function main() {
  const existing = await db
    .select({ code: stickers.code })
    .from(stickers)
    .limit(1);

  if (existing.length > 0) {
    console.log("Seed skipped: stickers table already contains data.");
    return;
  }

  await db.insert(stickers).values(allStickerRecords);
  console.log(`Inserted ${allStickerRecords.length} stickers.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
