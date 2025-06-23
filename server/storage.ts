import {
  users,
  notices,
  objections,
  type User,
  type InsertUser,
  type Notice,
  type InsertNotice,
  type Objection,
  type InsertObjection
} from "@shared/db/schema";
import { db } from "./db";
import { eq, desc, and, count, sql } from "drizzle-orm";

interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;

  getNotices(options: {
    page: number;
    limit: number;
    category?: string;
    search?: string;
    dateFilter?: string;
    sortBy?: string;
  }): Promise<(Notice & { objectionCount: number })[]>;

  getNoticesCount(options: {
    category?: string;
    search?: string;
    dateFilter?: string;
  }): Promise<number>;

  getNotice(id: number): Promise<Notice | undefined>;
  createNotice(insertNotice: InsertNotice): Promise<Notice>;

  createObjection(insertObjection: InsertObjection): Promise<Objection>;
  getCategoryCounts(): Promise<Record<string, number>>;
}

export class DatabaseStorage implements IStorage {
  async getUserByName(name: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.name, name));
    return user || undefined;
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        role: insertUser.role as "lawyer" | "user"
      })
      .returning();
    return user;
  }

  async getNotices(options: {
    page: number;
    limit: number;
    category?: string;
    search?: string;
    dateFilter?: string;
    sortBy?: string;
  }): Promise<(Notice & { objectionCount: number })[]> {
    const { page, limit, category, search, dateFilter, sortBy } = options;
    const offset = (page - 1) * limit;

    let conditions = [eq(notices.isActive, true)];

    if (category && category !== "all") {
      conditions.push(eq(notices.category, category));
    }

    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        sql`(${notices.title} ILIKE ${searchTerm} OR ${notices.lawyerName} ILIKE ${searchTerm} OR ${notices.location} ILIKE ${searchTerm})`
      );
    }

    if (dateFilter) {
      const now = new Date();
      let dateCondition;

      switch (dateFilter) {
        case "today": {
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          dateCondition = sql`${notices.uploadDate} >= ${todayStart} AND ${notices.uploadDate} < ${todayEnd}`;
          break;
        }
        case "last7days": {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateCondition = sql`${notices.uploadDate} >= ${sevenDaysAgo}`;
          break;
        }
        case "thismonth": {
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          dateCondition = sql`${notices.uploadDate} >= ${monthStart} AND ${notices.uploadDate} < ${monthEnd}`;
          break;
        }
      }

      if (dateCondition) {
        conditions.push(dateCondition);
      }
    }

    const orderBy = sortBy === "oldest" ? notices.uploadDate : desc(notices.uploadDate);

    const result = await db
      .select({
        id: notices.id,
        title: notices.title,
        content: notices.content,
        category: notices.category,
        lawyerName: notices.lawyerName,
        location: notices.location,
        uploadDate: notices.uploadDate,
        isActive: notices.isActive,
        filePath: notices.filePath,
        fileName: notices.fileName,
        fileType: notices.fileType,
        objectionCount: count(objections.id).as("objectionCount")
      })
      .from(notices)
      .leftJoin(objections, eq(objections.noticeId, notices.id))
      .where(and(...conditions))
      .groupBy(notices.id)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return result;
  }

  async getNoticesCount(options: {
    category?: string;
    search?: string;
    dateFilter?: string;
  }): Promise<number> {
    const { category, search, dateFilter } = options;

    let conditions = [eq(notices.isActive, true)];

    if (category && category !== "all") {
      conditions.push(eq(notices.category, category));
    }

    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        sql`(${notices.title} ILIKE ${searchTerm} OR ${notices.lawyerName} ILIKE ${searchTerm} OR ${notices.location} ILIKE ${searchTerm})`
      );
    }

    if (dateFilter) {
      const now = new Date();
      let dateCondition;

      switch (dateFilter) {
        case "today": {
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          dateCondition = sql`${notices.uploadDate} >= ${todayStart} AND ${notices.uploadDate} < ${todayEnd}`;
          break;
        }
        case "last7days": {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateCondition = sql`${notices.uploadDate} >= ${sevenDaysAgo}`;
          break;
        }
        case "thismonth": {
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          dateCondition = sql`${notices.uploadDate} >= ${monthStart} AND ${notices.uploadDate} < ${monthEnd}`;
          break;
        }
      }

      if (dateCondition) {
        conditions.push(dateCondition);
      }
    }

    const [result] = await db
      .select({ count: count() })
      .from(notices)
      .where(and(...conditions));

    return result.count;
  }

  async getNotice(id: number): Promise<Notice | undefined> {
    const [notice] = await db
      .select()
      .from(notices)
      .where(and(eq(notices.id, id), eq(notices.isActive, true)));
    return notice || undefined;
  }

  async createNotice(insertNotice: InsertNotice): Promise<Notice> {
    const [notice] = await db.insert(notices).values(insertNotice).returning();
    return notice;
  }

  async createObjection(insertObjection: InsertObjection): Promise<Objection> {
    const [objection] = await db
      .insert(objections)
      .values(insertObjection)
      .returning();
    return objection;
  }

  async getCategoryCounts(): Promise<Record<string, number>> {
    const result = await db
      .select({ category: notices.category, count: count() })
      .from(notices)
      .where(eq(notices.isActive, true))
      .groupBy(notices.category);

    return result.reduce((acc, { category, count }) => {
      acc[category] = count;
      return acc;
    }, {} as Record<string, number>);
  }
}

export const storage = new DatabaseStorage();
