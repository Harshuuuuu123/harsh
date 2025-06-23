import { pgTable, serial, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").$type<"lawyer" | "user">().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const notices = pgTable("notices", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  category: text("category").notNull(),
  lawyerName: text("lawyer_name").notNull(),
  location: text("location").notNull(),
  uploadDate: timestamp("upload_date").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  filePath: text("file_path").notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull()
});

export const objections = pgTable("objections", {
  id: serial("id").primaryKey(),
  noticeId: integer("notice_id").notNull().references(() => notices.id),
  content: text("content"),
  objectorName: text("objector_name").notNull(),
  objectorEmail: text("objector_email"),
  objectorPhone: text("objector_phone"),
  createdAt: timestamp("created_at").defaultNow()
});

// Schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertNoticeSchema = createInsertSchema(notices);
export const insertObjectionSchema = createInsertSchema(objections);

// TypeScript types
export type User = z.infer<typeof selectUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Notice = typeof notices.$inferSelect;
export type InsertNotice = z.infer<typeof insertNoticeSchema>;
export type Objection = z.infer<typeof insertObjectionSchema>;
export type InsertObjection = z.infer<typeof insertObjectionSchema>; 
export type NoticeWithObjection = Notice & {
  objectionCount: number;
};
