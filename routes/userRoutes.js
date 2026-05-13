import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getProfile, updateProfile, uploadProfileImage } from "../controllers/userController.js";
import upload from "../middleware/upload.js";
import User from "../models/User.js";

const router = express.Router();

router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);
router.post("/profile-image", authMiddleware, upload.single("profileImage"), uploadProfileImage);

// ✅ Search user by _id OR by name (for dashboard search)
router.get("/search", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId || userId.trim() === "") {
      return res.status(400).json({ message: "userId query required" });
    }

    const query = userId.trim();
    let user = null;

    // 1️⃣ Try exact ObjectId match first
    if (query.match(/^[a-fA-F0-9]{24}$/)) {
      user = await User.findById(query).select("-password");
    }

    // 2️⃣ If not found by ID, try name search (case-insensitive)
    if (!user) {
      user = await User.findOne({
        fullName: { $regex: query, $options: "i" }
      }).select("-password");
    }

    // 3️⃣ Try email search
    if (!user) {
      user = await User.findOne({
        email: { $regex: query, $options: "i" }
      }).select("-password");
    }

    if (!user) {
      return res.status(404).json({ message: "User not found. Check the User ID." });
    }

    res.json(user);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ message: "Search failed: " + err.message });
  }
});

// Delete account
router.delete("/delete-account", authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.json({ message: "Account deleted", forceLogout: true });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

export default router;
