import { asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  conversationStages,
  dinnerRecords,
  dinnerRoles,
  InsertUser,
  knowledgeEntries,
  userPreferences,
  users,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

type KnowledgeFilters = {
  section?: string;
  category?: string;
  guestCount?: string;
  cuisine?: string;
  timeSlot?: string;
};

export function matchesPlanningTag(serializedTags: string, requested?: string) {
  if (!requested) return true;
  const tags = serializedTags.split("|");
  return tags.includes("不限") || tags.includes(requested);
}

/** 保留原始課程資料，但不將 Q&A 條目提供給公開前台。 */
export function isPublicKnowledgeEntry(entry: { category: string }) {
  return entry.category !== "Q&A";
}

export async function listKnowledgeEntries(filters: KnowledgeFilters = {}) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(knowledgeEntries).orderBy(asc(knowledgeEntries.sortOrder));
  return rows.filter((entry) =>
    isPublicKnowledgeEntry(entry)
    && (!filters.section || entry.section === filters.section)
    && (!filters.category || entry.category === filters.category)
    && matchesPlanningTag(entry.peopleTags, filters.guestCount)
    && matchesPlanningTag(entry.cuisineTags, filters.cuisine)
    && matchesPlanningTag(entry.timeTags, filters.timeSlot),
  );
}

export async function listRoles() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dinnerRoles).orderBy(asc(dinnerRoles.sortOrder));
}

export async function listConversationStages() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(conversationStages).orderBy(asc(conversationStages.sortOrder));
}

export async function getConversationStage(stage: "破冰" | "探索" | "推進" | "成交" | "關係", layer: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(conversationStages)
    .where(eq(conversationStages.stage, stage))
    .orderBy(asc(conversationStages.layer));
  return result.find((item) => item.layer === layer);
}

export async function listDinnerRecords(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dinnerRecords)
    .where(eq(dinnerRecords.userId, userId))
    .orderBy(desc(dinnerRecords.createdAt));
}

export async function createDinnerRecord(input: typeof dinnerRecords.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("資料庫目前無法使用");
  await db.insert(dinnerRecords).values(input);
}

export async function getUserPreferences(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function saveUserPreferences(input: typeof userPreferences.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("資料庫目前無法使用");
  await db.insert(userPreferences).values(input).onDuplicateKeyUpdate({
    set: {
      defaultGuestCount: input.defaultGuestCount,
      defaultCuisine: input.defaultCuisine,
      defaultTimeSlot: input.defaultTimeSlot,
    },
  });
}
