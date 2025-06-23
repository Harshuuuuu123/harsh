import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertNoticeSchema, insertObjectionSchema } from "@shared/db/schema";
import { sendObjectionMail } from "./mail";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import "dotenv/config";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ message: "Invalid or expired token" });
    req.user = user;
    next();
  });
};

const requireRole = (role: string) => {
  return (req: any, res: any, next: any) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ message: "Access denied: Insufficient role" });
    }
    next();
  };
};

const storage_config = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, "uploads/"),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage_config,
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb(new Error("Only PDF, DOC, DOCX, JPEG, JPG, PNG files are allowed"));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/auth/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await storage.createUser({
      name,
      email,
      password: hashedPassword,
      role: role as "lawyer" | "user",
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    console.error("❌ Error during registration:", error);
    res.status(500).json({ message: "Failed to register user", error: String(error) });
  }
});


  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
      res.status(500).json({ message: "Failed to login" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUserById(req.user.userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json({ id: user.id, email: user.email, role: user.role });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  app.post("/api/auth/logout", (_req, res) => {
    res.json({ message: "Logged out successfully" });
  });

  app.get("/api/notices", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const { category, search, dateFilter, sortBy } = req.query as any;

      const notices = await storage.getNotices({ page, limit, category, search, dateFilter, sortBy });
      const total = await storage.getNoticesCount({ category, search, dateFilter });

     res.json({
  notices: notices.map((n) => ({
    ...n,
    objectionCount: Number(n.objectionCount ?? 0), // 👈 force include
  })),
  total,
  page,
  limit,
  hasMore: page * limit < total,
});

    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notices" });
    }
  });

  app.get("/api/notices/categories", async (_req, res) => {
    try {
      const counts = await storage.getCategoryCounts();
      res.json(counts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch category counts" });
    }
  });

  app.post("/api/notices", authenticateToken, requireRole("lawyer"), upload.single("file"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "File is required" });

      const noticeData = {
        title: req.body.title,
        content: req.body.content || "",
        lawyerName: req.body.lawyerName,
        location: req.body.location || "",
        category: req.body.category,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileType: req.file.mimetype,
      };

      const validated = insertNoticeSchema.parse(noticeData);
      const notice = await storage.createNotice(validated);
      res.status(201).json(notice);
    } catch (error) {
      if (error instanceof z.ZodError)
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      res.status(500).json({ message: "Failed to create notice" });
    }
  });

  app.post("/api/notices/generated", authenticateToken, requireRole("lawyer"), async (req, res) => {
    try {
      const { imageData, title, lawyerName, location, category } = req.body;
      if (!imageData || !title || !lawyerName)
        return res.status(400).json({ message: "Missing required fields" });

      const buffer = Buffer.from(imageData.replace(/^data:image\/\w+;base64,/, ""), "base64");
      const fileName = `generated-notice-${Date.now()}.png`;
      const filePath = `uploads/${fileName}`;
      if (!fs.existsSync("uploads")) fs.mkdirSync("uploads", { recursive: true });
      fs.writeFileSync(filePath, buffer);

      const noticeData = {
        title,
        content: req.body.content || "",
        lawyerName,
        location: location || "",
        category: category || "public",
        fileName,
        filePath,
        fileType: "image/png",
      };

      const validated = insertNoticeSchema.parse(noticeData);
      const notice = await storage.createNotice(validated);
      res.status(201).json(notice);
    } catch (error) {
      if (error instanceof z.ZodError)
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      res.status(500).json({ message: "Failed to save generated notice" });
    }
  });

  app.get("/api/notices/:id/download", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const notice = await storage.getNotice(id);
      if (!notice) return res.status(404).json({ message: "Notice not found" });

      res.download(path.resolve(notice.filePath), notice.fileName, (err) => {
        if (err) {
          res.status(500).json({ message: "File download failed" });
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to download file" });
    }
  });

  app.post("/api/notices/:id/objections", async (req, res) => {
    try {
      const noticeId = parseInt(req.params.id);
      const notice = await storage.getNotice(noticeId);
      if (!notice) return res.status(404).json({ message: "Notice not found" });

      const objectionData = {
        noticeId,
        content: req.body.reason,
        objectorName: req.body.objectorName,
        objectorEmail: req.body.objectorEmail,
        objectorPhone: req.body.objectorPhone,
      };

      const validated = insertObjectionSchema.parse(objectionData);
      const objection = await storage.createObjection(validated);

      const lawyer = await storage.getUserByName(notice.lawyerName);
      if (lawyer?.email) {
        await sendObjectionMail(lawyer.email, notice.title, objection.objectorName, objection.content);
      }

      res.status(201).json(objection);
    } catch (error) {
      res.status(500).json({ message: "Failed to file objection" });
    }
  });

  app.use("/uploads", express.static("uploads"));
  return createServer(app);
}
