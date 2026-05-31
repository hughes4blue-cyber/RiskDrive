import { pgTable, integer, text, timestamp } from "drizzle-orm/pg-core";

// Singleton row (id=1 always). mode is the platform-wide Demo/Live switch.
export const appSettingsTable = pgTable("app_settings", {
  id: integer("id").primaryKey().default(1),
  mode: text("mode").notNull().default("demo"), // demo | live
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type AppSettings = typeof appSettingsTable.$inferSelect;
