import { Router } from "express";
import { verifyToken } from "../middlewares/authenticate";
import { togglePromotionAlerts, toggleRegularAlerts, toggleSecurityAlert } from "../controllers/security.controller";

const router = Router();

router.patch("/toggleSecurityNotifications/:userId", verifyToken, toggleSecurityAlert );
router.patch("/toggleRegularNotifications/:userId", verifyToken, toggleRegularAlerts );
router.patch("/togglePromotionNotifications/:userId", verifyToken, togglePromotionAlerts );


export default router;