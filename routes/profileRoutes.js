import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";
import {
  getProfile,
  updateBasicInfo,
  changePassword,
  changeEmail,
  uploadProfileImage
} from "../controllers/profileController.js";

const router = express.Router();

router.get("/", authMiddleware, getProfile);
router.put("/basic", authMiddleware, updateBasicInfo);
router.put("/password", authMiddleware, changePassword);
router.put("/email", authMiddleware, changeEmail);
router.post("/upload", authMiddleware, upload.single("profileImage"), uploadProfileImage);

export default router;
