import express from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import vaultRoutes from "./vault.routes";
import complaintRoutes from "./complaint.routes";
import adminRoutes from "./admin.routes";
import activityRoutes from "./activities.routes";
import settingsRoutes from "./settings.routes";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/vault", vaultRoutes);
router.use("/complaint", complaintRoutes);
router.use("/admin", adminRoutes);
router.use("/activities", activityRoutes);
router.use("/settings", settingsRoutes);

export default router;
