import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { saveVitals } from "../controllers/recordController.js";
import {
  saveDiseases,
  saveLifestyle,
  getUserRecords
} from "../controllers/recordController.js";

const router = express.Router();

router.post("/save-diseases", authMiddleware, saveDiseases);
router.post("/save-lifestyle", authMiddleware, saveLifestyle);
router.post("/save-vitals", authMiddleware, saveVitals);
router.get("/:userId", authMiddleware, getUserRecords);

export default router;   // 🔥 THIS LINE MUST EXIST