"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authenticate_1 = require("../middlewares/authenticate");
const user_controller_1 = require("../controllers/user.controller");
const router = (0, express_1.Router)();
router.get("/allUsers", user_controller_1.getUsers);
router.patch("/updateUserProfile", authenticate_1.verifyToken, user_controller_1.updateUser);
router.patch("/updateSpecificDetails", authenticate_1.verifyToken, user_controller_1.updateSpecificFields);
router.patch("/toggleBioMatricAuth/:userId", authenticate_1.verifyToken, user_controller_1.toggleBiometricAuth);
router.delete("/deleteAccount", authenticate_1.verifyToken, user_controller_1.deleteAccount);
router.post("/changePassword", authenticate_1.verifyToken, user_controller_1.changePassword);
exports.default = router;
