import { Router } from "express";
import { verifyToken } from "../middlewares/authenticate";
import { createComplaint, getUserComplaints } from "../controllers/complaints.controller";

const router = Router();

router.post("/createComplaint", createComplaint );

router.get("/getComplaints", getUserComplaints);

export default router;