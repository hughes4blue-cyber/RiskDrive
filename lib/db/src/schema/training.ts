import { pgTable, serial, text, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { driversTable } from "./drivers";

export const trainingModulesTable = pgTable("training_modules", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(20),
  behaviorTrigger: text("behavior_trigger"),
  videoUrl: text("video_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const driverTrainingTable = pgTable("driver_training", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").notNull().references(() => driversTable.id),
  moduleId: integer("module_id").notNull().references(() => trainingModulesTable.id),
  status: text("status").notNull().default("assigned"),
  score: real("score"),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertTrainingModuleSchema = createInsertSchema(trainingModulesTable).omit({ id: true, createdAt: true });
export const insertDriverTrainingSchema = createInsertSchema(driverTrainingTable).omit({ id: true, assignedAt: true });
export type InsertTrainingModule = z.infer<typeof insertTrainingModuleSchema>;
export type InsertDriverTraining = z.infer<typeof insertDriverTrainingSchema>;
export type TrainingModule = typeof trainingModulesTable.$inferSelect;
export type DriverTraining = typeof driverTrainingTable.$inferSelect;
