"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const complaints_controller_1 = require("../controllers/complaints.controller");
const router = (0, express_1.Router)();
router.post("/createComplaint", complaints_controller_1.createComplaint);
router.get("/getComplaints", complaints_controller_1.getUserComplaints);
router.get("/getComplaint/:id", complaints_controller_1.getUserComplaints);
exports.default = router;
