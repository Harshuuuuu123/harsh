import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const notices = pgTable("notices", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  lawyerName: text("lawyer_name").notNull(),
  location: text("location"),
  category: varchar("category", { length: 50 }).notNull(),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileType: varchar("file_type", { length: 20 }).notNull(),
  uploadDate: timestamp("upload_date").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const objections = pgTable("objections", {
  id: serial("id").primaryKey(),
  noticeId: integer("notice_id").references(() => notices.id).notNull(),
  objectorName: text("objector_name"),
  objectorEmail: text("objector_email"),
  objectorPhone: text("objector_phone"),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertNoticeSchema = createInsertSchema(notices).omit({
  id: true,
  uploadDate: true,
  isActive: true,
});

export const insertObjectionSchema = createInsertSchema(objections).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Notice = typeof notices.$inferSelect;
export type InsertNotice = z.infer<typeof insertNoticeSchema>;
export type Objection = typeof objections.$inferSelect;
export type InsertObjection = z.infer<typeof insertObjectionSchema>;
