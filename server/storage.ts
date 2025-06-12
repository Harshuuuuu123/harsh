import { users, notices, objections, type User, type InsertUser, type Notice, type InsertNotice, type Objection, type InsertObjection } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ilike, count, sql } from "drizzle-orm";

interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  
  // Notice methods
  getNotices(options: { page: number; limit: number; category?: string; search?: string }): Promise<Notice[]>;
  getNoticesCount(options: { category?: string; search?: string }): Promise<number>;
  getNotice(id: number): Promise<Notice | undefined>;
  createNotice(insertNotice: InsertNotice): Promise<Notice>;
  
  // Objection methods
  createObjection(insertObjection: InsertObjection): Promise<Objection>;
  
  // Category methods
  getCategoryCounts(): Promise<Record<string, number>>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
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
  }): Promise<Notice[]> {
    const { page, limit, category, search, dateFilter, sortBy } = options;
    const offset = (page - 1) * limit;

    let conditions = [eq(notices.isActive, true)];

    // Apply category filter
    if (category && category !== 'all') {
      conditions.push(eq(notices.category, category));
    }

    // Apply search filter
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        sql`(${notices.title} ILIKE ${searchTerm} OR ${notices.lawyerName} ILIKE ${searchTerm} OR ${notices.location} ILIKE ${searchTerm})`
      );
    }

    // Apply date filter
    if (dateFilter) {
      const now = new Date();
      let dateCondition;
      
      switch (dateFilter) {
        case 'today':
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          dateCondition = sql`${notices.uploadDate} >= ${todayStart} AND ${notices.uploadDate} < ${todayEnd}`;
          break;
        case 'last7days':
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateCondition = sql`${notices.uploadDate} >= ${sevenDaysAgo}`;
          break;
        case 'thismonth':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          dateCondition = sql`${notices.uploadDate} >= ${monthStart} AND ${notices.uploadDate} < ${monthEnd}`;
          break;
      }
      
      if (dateCondition) {
        conditions.push(dateCondition);
      }
    }

    // Determine sort order
    let orderBy;
    switch (sortBy) {
      case 'oldest':
        orderBy = notices.uploadDate;
        break;
      case 'newest':
      default:
        orderBy = desc(notices.uploadDate);
        break;
    }

    const result = await db
      .select()
      .from(notices)
      .where(and(...conditions))
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

    // Apply category filter
    if (category && category !== 'all') {
      conditions.push(eq(notices.category, category));
    }

    // Apply search filter
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        sql`(${notices.title} ILIKE ${searchTerm} OR ${notices.lawyerName} ILIKE ${searchTerm} OR ${notices.location} ILIKE ${searchTerm})`
      );
    }

    // Apply date filter
    if (dateFilter) {
      const now = new Date();
      let dateCondition;
      
      switch (dateFilter) {
        case 'today':
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          dateCondition = sql`${notices.uploadDate} >= ${todayStart} AND ${notices.uploadDate} < ${todayEnd}`;
          break;
        case 'last7days':
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateCondition = sql`${notices.uploadDate} >= ${sevenDaysAgo}`;
          break;
        case 'thismonth':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          dateCondition = sql`${notices.uploadDate} >= ${monthStart} AND ${notices.uploadDate} < ${monthEnd}`;
          break;
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
    const [notice] = await db
      .insert(notices)
      .values(insertNotice)
      .returning();
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
    const categoryCounts = await db
      .select({
        category: notices.category,
        count: count()
      })
      .from(notices)
      .where(eq(notices.isActive, true))
      .groupBy(notices.category);

    // Get total count for 'all' category
    const [totalResult] = await db
      .select({ count: count() })
      .from(notices)
      .where(eq(notices.isActive, true));

    const counts: Record<string, number> = {
      all: totalResult.count
    };

    // Add individual category counts
    for (const item of categoryCounts) {
      counts[item.category] = item.count;
    }

    return counts;
  }
}

export const storage = new DatabaseStorage();