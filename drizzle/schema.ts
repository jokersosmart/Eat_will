import { index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const knowledgeEntries = mysqlTable("knowledge_entries", {
  id: int("id").autoincrement().primaryKey(),
  section: varchar("section", { length: 64 }).notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  peopleTags: text("peopleTags").notNull(),
  cuisineTags: text("cuisineTags").notNull(),
  timeTags: text("timeTags").notNull(),
  sortOrder: int("sortOrder").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("knowledge_entries_section_idx").on(table.section),
  index("knowledge_entries_category_idx").on(table.category),
]);

export const dinnerRoles = mysqlTable("dinner_roles", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 32 }).notNull().unique(),
  definition: text("definition").notNull(),
  signals: text("signals").notNull(),
  strategy: text("strategy").notNull(),
  notes: text("notes").notNull(),
  sortOrder: int("sortOrder").notNull(),
});

export const conversationStages = mysqlTable("conversation_stages", {
  id: int("id").autoincrement().primaryKey(),
  stage: mysqlEnum("stage", ["破冰", "探索", "推進", "成交", "關係"]).notNull(),
  layer: int("layer").notNull(),
  coreFocus: varchar("coreFocus", { length: 128 }).notNull(),
  topicGuidance: text("topicGuidance").notNull(),
  cautions: text("cautions").notNull(),
  sortOrder: int("sortOrder").notNull(),
}, (table) => [
  index("conversation_stages_stage_idx").on(table.stage),
]);

export const dinnerRecords = mysqlTable("dinner_records", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  guestCount: varchar("guestCount", { length: 32 }).notNull(),
  cuisine: varchar("cuisine", { length: 64 }).notNull(),
  timeSlot: varchar("timeSlot", { length: 64 }).notNull(),
  objective: text("objective").notNull(),
  stage: mysqlEnum("stage", ["破冰", "探索", "推進", "成交", "關係"]).notNull(),
  layer: int("layer").notNull(),
  context: text("context"),
  aiAdvice: text("aiAdvice"),
  reflection: text("reflection"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("dinner_records_user_created_idx").on(table.userId, table.createdAt),
]);

export const userPreferences = mysqlTable("user_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  defaultGuestCount: varchar("defaultGuestCount", { length: 32 }),
  defaultCuisine: varchar("defaultCuisine", { length: 64 }),
  defaultTimeSlot: varchar("defaultTimeSlot", { length: 64 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KnowledgeEntry = typeof knowledgeEntries.$inferSelect;
export type DinnerRole = typeof dinnerRoles.$inferSelect;
export type ConversationStage = typeof conversationStages.$inferSelect;
export type DinnerRecord = typeof dinnerRecords.$inferSelect;
