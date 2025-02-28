import { Router } from "express";
import { getSettings, addSettings } from "../controllers/settings.controller";

const router = Router();

router.get("/getAllSettings", getSettings);

router.post("/addSettings", addSettings);

export default router;
