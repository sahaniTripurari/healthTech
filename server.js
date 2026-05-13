import express from "express";
import compression from "compression";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dashboardRoutes from "./routes/dashboard.js";
import recordRoutes from "./routes/recordRoutes.js";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/userRoutes.js";
import User from "./models/User.js";
import passport from "passport";
import "./config/googleStrategy.js";
import startFitnessCron from "./services/fitnessCron.js";
import googleAuthRoutes from "./routes/googleAuthRoutes.js";
import authMiddleware from "./middleware/authMiddleware.js";

dotenv.config();

const app    = express();
app.use(compression());
const server = http.createServer(app);
const io     = new Server(server);
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("🟢 MongoDB Connected");
    startFitnessCron(); // 👈 Yaha add kiya
  })
  .catch(err => console.log("🔴 MongoDB Error:", err.message)); 
// ── Middleware ────────────────────────────────────────────
app.use(bodyParser.json());

// Security: Prevent access to sensitive files
app.use((req, res, next) => {
  const sensitiveFiles = [".env", "server.js", "package.json", "package-lock.json", "node_modules"];
  if (sensitiveFiles.some(file => req.path.includes(file))) {
    return res.status(403).send("Forbidden");
  }
  next();
});

// Static files with Cache-Control for performance
app.use(express.static(path.join(__dirname), {
  maxAge: "1d",
  setHeaders: (res, path) => {
    if (path.endsWith(".html")) {
      res.setHeader("Cache-Control", "no-cache");
    }
  }
}));
app.use("/uploads", express.static("uploads", { maxAge: "7d" }));
app.use(passport.initialize());
// ── Routes ────────────────────────────────────────────────
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/records",   recordRoutes);
app.use("/api/auth",      authRoutes);
app.use("/api/user",      userRoutes);
app.use("/api/auth", googleAuthRoutes);
// ── 🔍 Search user (inline — 100% guaranteed to register) ─
// Searches by: MongoDB _id  |  fullName  |  email
app.get("/api/user/search", authMiddleware, async (req, res) => {
  try {
    const q = (req.query.userId || "").replace(/\s+/g, "").trim();

    if (!q || q.length < 3) {
      return res.status(400).json({ message: "Please enter at least 3 characters." });
    }

    let user = null;

    // 1. Try ObjectId (24-char hex)
    if (/^[a-fA-F0-9]{24}$/.test(q)) {
      user = await User.findById(q).select("-password");
    }

    // 2. Try fullName (case-insensitive partial)
    if (!user) {
      user = await User.findOne({
        fullName: { $regex: q, $options: "i" }
      }).select("-password");
    }

    // 3. Try email
    if (!user) {
      user = await User.findOne({
        email: { $regex: q, $options: "i" }
      }).select("-password");
    }

    if (!user) {
      return res.status(404).json({
        message: "User not found. Try: full User ID, name, or email."
      });
    }

    res.json(user);
  } catch (err) {
    console.error("🔴 Search error:", err.message);
    res.status(500).json({ message: "Search failed: " + err.message });
  }
});

// ── AI Assistant ──────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.post("/api/ai-assistant", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.json({ answer: "Please ask something." });

    const prompt = `
You are a friendly AI Health Assistant.
Reply in the SAME language as the user.
Use clear bullet points and headings.
Be warm and human.

User:
${question}
`;
    const result = await model.generateContent(prompt);
    res.json({ answer: result.response.text() });

  } catch (error) {
    console.error(error);
    if (error.status === 429) {
      return res.json({ answer: "⚠️ AI limit reached. Please wait 1 minute and try again." });
    }
    res.status(500).json({ answer: "AI busy, try again later." });
  }
});

// ── Socket ────────────────────────────────────────────────
io.on("connection", socket => {
  console.log("🟢 Dashboard connected");
});

// ── Start ─────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`✅ Server running on port ${PORT}`)
);