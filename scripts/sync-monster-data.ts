import { getMonsterDetailsData, getMonsterDexData } from "@/lib/dc-api";
import { toNumber } from "@/lib/format-utils";
import { DCMonsterDetail } from "@/types/dc/monster-dex";
import { MonsterRecord } from "@/types/monter";
import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";

dotenv.config();

const token = process.env.DUNGEONCITIES_TOKEN ?? process.env.TOKEN;
const delayMs = Math.max(0, Number(process.env.REQUEST_DELAY_MS ?? 1200));

if (!token) {
  throw new Error(
    "Missing token. Set DUNGEONCITIES_TOKEN in .env before running this script.",
  );
}

if (!Number.isFinite(delayMs)) {
  throw new Error("REQUEST_DELAY_MS must be a valid number.");
}

const outputPath = path.join(
  process.cwd(),
  "src",
  "data",
  "monster-details.json",
);
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const dcApiOptions = { token };

function deriveItemNameFromImageUrl(imageUrl: string | null | undefined) {
  if (!imageUrl) {
    return null;
  }

  let fileName = "";

  try {
    const url = new URL(imageUrl);
    fileName = url.pathname.split("/").pop() ?? "";
  } catch {
    fileName = imageUrl.split("/").pop() ?? "";
  }

  const withoutExtension = decodeURIComponent(fileName)
    .replace(/\.[^/.]+$/, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[\-_]+/g, " ")
    .trim();

  if (!withoutExtension) {
    return null;
  }

  return withoutExtension
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function mapMonster(detail: DCMonsterDetail): MonsterRecord {
  const drops = Array.isArray(detail.drops) ? detail.drops : [];
  return {
    monsterId: detail.monster.monsterId,
    monsterName: detail.monster.name,
    monsterType: detail.monster.type,
    monsterClass: detail.monster.class,
    monsterImageUrl: detail.monster.imageUrl,
    totalEncounters: detail.totalEncounters,
    totalKills: detail.totalKills,
    totalDefeats: detail.totalDefeats,
    totalBossEncounters: detail.totalBossEncounters,
    totalBossKills: detail.totalBossKills,
    totalBossDefeats: detail.totalBossDefeats,
    firstEncounter: {
      encounteredAt: detail.firstEncounteredAt,
      dungeonId: detail.firstEncounteredDungeonId,
      dungeonName: detail.dungeonInfo?.name,
      floorNumber:
        detail.floorInfo?.floorNumber ?? detail.firstEncounteredFloor,
      floorName: detail.floorInfo?.name,
    },
    drops: drops.map((drop) => {
      const apiItemName = drop.item?.name ?? "???";
      const hasPlaceholderName = apiItemName.trim() === "???";
      const derivedItemName = deriveItemNameFromImageUrl(drop.item?.imageUrl);

      return {
        itemId: drop.itemId,
        itemName: apiItemName,
        derivedItemName,
        itemNameWarning: hasPlaceholderName,
        itemClass: drop.item?.class ?? "Unknown",
        itemImageUrl: drop.item?.imageUrl ?? "",
        dropChance: toNumber(drop.dropChance),
        minQuantity: toNumber(drop.minQuantity),
        maxQuantity: toNumber(drop.maxQuantity),
        bossDrop: Boolean(drop.bossDrop),
        unlocked: Boolean(drop.unlocked),
      };
    }),
  };
}

async function main() {
  console.log("Fetching monster dex list...");
  const dexResponse = await getMonsterDexData(dcApiOptions);

  if (!dexResponse?.success) {
    throw new Error("First call did not return success=true.");
  }

  const discoveries = Array.isArray(dexResponse.data?.discoveries)
    ? dexResponse.data.discoveries
    : [];

  const uniqueMonsterIds = [
    ...new Set(
      discoveries
        .map((discovery) => discovery.monsterId)
        .filter((monsterId): monsterId is number => Number.isFinite(monsterId)),
    ),
  ];

  console.log(
    `Found ${uniqueMonsterIds.length} unique monsters. Delay: ${delayMs}ms.`,
  );

  const monsters = [];
  const failedMonsterIds: number[] = [];

  for (let index = 0; index < uniqueMonsterIds.length; index += 1) {
    const monsterId = uniqueMonsterIds[index];

    if (index > 0 && delayMs > 0) {
      await sleep(delayMs);
    }

    try {
      const detailResponse = await getMonsterDetailsData(
        dcApiOptions,
        monsterId,
      );

      if (!detailResponse?.success || !detailResponse?.data) {
        throw new Error("Detail response missing success/data.");
      }

      monsters.push(mapMonster(detailResponse.data));
      console.log(
        `Fetched ${index + 1}/${uniqueMonsterIds.length}: monsterId=${monsterId}`,
      );
    } catch (error) {
      failedMonsterIds.push(monsterId);
      console.error(
        `Failed monsterId=${monsterId}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  const output = {
    generatedAt: new Date().toISOString(),
    requestDelayMs: delayMs,
    totalDiscoveries: discoveries.length,
    totalMonsters: dexResponse.data?.totalMonstersInGame ?? 0,
    failedMonsterIds,
    monsters,
  };

  await fs.writeFile(outputPath, JSON.stringify(output, null, 2), "utf8");
  console.log(`Saved ${monsters.length} monster records to ${outputPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
