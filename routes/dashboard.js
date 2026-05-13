import express from "express";
import { getDashboardData } from "../controllers/dashboardController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Auth middleware — must be logged in
router.get("/:userId", authMiddleware, getDashboardData);

export default router;
