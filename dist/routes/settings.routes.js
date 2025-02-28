"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settings_controller_1 = require("../controllers/settings.controller");
const router = (0, express_1.Router)();
router.get("/getAllSettings", settings_controller_1.getSettings);
router.post("/addSettings", settings_controller_1.addSettings);
exports.default = router;
