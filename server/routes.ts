import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertNoticeSchema, insertObjectionSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import { z } from "zod";

// Configure multer for file uploads
const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage_config,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, JPEG, JPG, PNG files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all notices with pagination and filtering
  app.get("/api/notices", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const category = req.query.category as string;
      const search = req.query.search as string;

      const notices = await storage.getNotices({ page, limit, category, search });
      const total = await storage.getNoticesCount({ category, search });

      res.json({
        notices,
        total,
        page,
        limit,
        hasMore: page * limit < total
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notices" });
    }
  });

  // Get category counts
  app.get("/api/notices/categories", async (req, res) => {
    try {
      const counts = await storage.getCategoryCounts();
      res.json(counts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch category counts" });
    }
  });

  // Upload new notice
  app.post("/api/notices", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "File is required" });
      }

      const noticeData = {
        title: req.body.title,
        lawyerName: req.body.lawyerName,
        category: req.body.category,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileType: req.file.mimetype
      };

      const validatedData = insertNoticeSchema.parse(noticeData);
      const notice = await storage.createNotice(validatedData);

      res.status(201).json(notice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create notice" });
    }
  });

  // Get single notice
  app.get("/api/notices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const notice = await storage.getNotice(id);
      
      if (!notice) {
        return res.status(404).json({ message: "Notice not found" });
      }

      res.json(notice);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notice" });
    }
  });

  // File objection against notice
  app.post("/api/notices/:id/objections", async (req, res) => {
    try {
      const noticeId = parseInt(req.params.id);
      
      // Check if notice exists
      const notice = await storage.getNotice(noticeId);
      if (!notice) {
        return res.status(404).json({ message: "Notice not found" });
      }

      const objectionData = {
        noticeId,
        objectorName: req.body.objectorName,
        objectorEmail: req.body.objectorEmail,
        objectorPhone: req.body.objectorPhone,
        reason: req.body.reason
      };

      const validatedData = insertObjectionSchema.parse(objectionData);
      const objection = await storage.createObjection(validatedData);

      // In a real implementation, send notification to lawyer here
      console.log(`Objection filed against notice "${notice.title}" by lawyer ${notice.lawyerName}`);

      res.status(201).json(objection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to file objection" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', require('express').static('uploads'));

  const httpServer = createServer(app);
  return httpServer;
}
