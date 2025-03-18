"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
// Mongoose schema
const UserSchema = new mongoose_1.Schema({
    googleId: { type: String, unique: true, sparse: true },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: false,
    },
    phone: {
        type: String,
        required: false,
    },
    password: {
        type: String,
        default: "",
    },
    photo: {
        type: String,
        default: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcStPiNn0fUvoPmedC8HjMSk7X2QATdqGz-FIQ&s",
    },
    stripe_customer_id: {
        type: String,
        default: null,
    },
    otp: {
        type: String,
        default: null,
    },
    otp_expiry: {
        type: Date,
        default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
    },
    is_verified: {
        type: Boolean,
        default: false,
    },
    language: {
        type: String,
        default: "English",
    },
    currency: {
        type: String,
        default: "US",
    },
    is_biomatric: {
        type: Boolean,
        default: false,
    },
    is_two_factor: {
        type: Boolean,
        default: false,
    },
    is_email_notification: {
        type: Boolean,
        default: false,
    },
    signup_date: {
        type: Date,
        default: null,
    },
    last_login: {
        type: Date,
        default: null,
    },
    reset_token: { type: String },
    reset_token_expiry: { type: Date },
    role: { type: String, default: "user" },
    account_status: { type: String, default: "active" },
    email_verified_at: { type: Date },
    two_factor_secret: { type: String },
    two_factor_recovery_codes: { type: String },
    two_factor_verified_at: { type: Date },
    email_notifications: { type: Number, default: 0 },
    data_breach_alert: { type: Boolean, default: false },
    security_alert_notification: { type: Boolean, default: false },
    regular_updates_notification: { type: Boolean, default: false },
    promotion_notification: { type: Boolean, default: false },
    lowercase_letters: { type: Boolean, default: false },
    uppercase_letters: { type: Boolean, default: false },
    special_characters: { type: Boolean, default: false },
    numbers: { type: Boolean, default: false },
    length: { type: Number },
    autolock_time: { type: Number, default: 5 },
});
exports.default = mongoose_1.default.model("Users", UserSchema);
