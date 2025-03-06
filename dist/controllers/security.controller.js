"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.togglePromotionAlerts = exports.toggleRegularAlerts = exports.toggleSecurityAlert = void 0;
const users_model_1 = __importDefault(require("../models/users.model"));
const toggleSecurityAlert = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    try {
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "userId is required",
            });
        }
        const user = yield users_model_1.default.findById(userId);
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found",
            });
        }
        user.security_alert_notification = !user.security_alert_notification;
        yield user.save();
        return res.status(200).json({
            success: true,
            message: `Security Notifications ${user.security_alert_notification ? "enabled" : "disabled"}`,
            user,
        });
    }
    catch (error) {
        console.error("Error toggling security notifications:", error);
        return res.status(500).json({
            success: true,
            message: "Internal server error",
        });
    }
});
exports.toggleSecurityAlert = toggleSecurityAlert;
const toggleRegularAlerts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    try {
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "userId is required",
            });
        }
        const user = yield users_model_1.default.findById(userId);
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found",
            });
        }
        user.regular_updates_notification = !user.regular_updates_notification;
        yield user.save();
        return res.status(200).json({
            success: true,
            message: `Regular Notifications ${user.regular_updates_notification ? "enabled" : "disabled"}`,
            user,
        });
    }
    catch (error) {
        console.error("Error toggling regular notifications:", error);
        return res.status(500).json({
            success: true,
            message: "Internal server error",
        });
    }
});
exports.toggleRegularAlerts = toggleRegularAlerts;
const togglePromotionAlerts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    try {
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "userId is required",
            });
        }
        const user = yield users_model_1.default.findById(userId);
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found",
            });
        }
        user.promotion_notification = !user.promotion_notification;
        yield user.save();
        return res.status(200).json({
            success: true,
            message: `Promotion Notifications ${user.promotion_notification ? "enabled" : "disabled"}`,
            user,
        });
    }
    catch (error) {
        console.error("Error toggling promotion notifications:", error);
        return res.status(500).json({
            success: true,
            message: "Internal server error",
        });
    }
});
exports.togglePromotionAlerts = togglePromotionAlerts;
