"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const router = (0, express_1.Router)();
//
router.post("/sendAdminPromotionLink", admin_controller_1.sendAdminPromotionLink);
router.get("/promoteToAdmin", admin_controller_1.promoteToAdmin);
// router.get("/getAllComplaints", getAllComplaints);
router.post("/setPasswordLink", admin_controller_1.SendSetPasswordLink);
router.post("/ticketReply", admin_controller_1.replyToComplaint);
router.put("/activateOrDeactivate", admin_controller_1.activateOrDeactivateUser);
router.get("/getInfoAboutUsers", admin_controller_1.getInfoAboutUsers);
router.get("/getDataOnTimeFrame", admin_controller_1.getDataOnTimeFrame);
exports.default = router;
