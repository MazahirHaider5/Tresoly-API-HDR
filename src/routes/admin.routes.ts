import { Router } from "express";
import {
//   getAllComplaints,
//   getAllSubscriptions,
  promoteToAdmin,
  sendAdminPromotionLink,
  SendSetPasswordLink,
//   replyToComplaint,
  activateOrDeactivateUser,
  getInfoAboutUsers,
  getDataOnTimeFrame,
  replyToComplaint
} from "../controllers/admin.controller";

const router = Router();


router.post("/sendAdminPromotionLink", sendAdminPromotionLink);
router.get("/promoteToAdmin", promoteToAdmin);
// router.get("/getAllComplaints", getAllComplaints);
router.post("/setPasswordLink", SendSetPasswordLink);
router.post("/ticketReply", replyToComplaint);
router.put("/activateOrDeactivate", activateOrDeactivateUser);
router.get("/getInfoAboutUsers", getInfoAboutUsers);
router.get("/getDataOnTimeFrame", getDataOnTimeFrame);

export default router;
