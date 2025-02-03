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
exports.logout = exports.resetPassword = exports.verifyPasswordResetOtp = exports.resendPasswordResetOtp = exports.requestPasswordResetOtp = exports.login = exports.verifySignupOtp = exports.userSignup = void 0;
const bcrypt_1 = require("../utils/bcrypt");
const jwt_1 = require("../utils/jwt");
const users_model_1 = __importDefault(require("../models/users.model"));
const sendMail_1 = require("../utils/sendMail");
const otp_1 = require("../utils/otp");
const node_cache_1 = __importDefault(require("node-cache"));
const userCache = new node_cache_1.default({ stdTTL: 90 });
const userSignup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, name, phone, password } = req.body;
    if (!email || !password || !name || !phone) {
        return res
            .status(400)
            .json({ success: false, message: "Missing required fields" });
    }
    try {
        // Check if the user already exists
        const existingUser = yield users_model_1.default.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User with this email already exists",
            });
        }
        // Hash the password
        const hashedPassword = yield (0, bcrypt_1.hashPassword)(password);
        // Create a new user and save to database
        const newUser = new users_model_1.default({
            email,
            name,
            phone,
            password: hashedPassword,
            signup_date: new Date(),
        });
        yield newUser.save();
        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                id: newUser._id,
                email: newUser.email,
                name: newUser.name,
                phone: newUser.phone,
            },
        });
    }
    catch (error) {
        console.error("Error creating user:", error);
        return res.status(500).json({
            success: false,
            message: "Error occurred while creating the user",
            error: error.message,
        });
    }
});
exports.userSignup = userSignup;
const verifySignupOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res
            .status(400)
            .json({ success: false, message: "Email and OTP are required" });
    }
    try {
        const cachedUser = userCache.get(email);
        if (!cachedUser) {
            return res
                .status(404)
                .json({ success: false, message: "OTP expired or invalid request" });
        }
        if (cachedUser.otp !== otp) {
            return res.status(400).json({ success: false, message: "Incorrect OTP" });
        }
        if (new Date() > new Date(cachedUser.otp_expiry)) {
            return res
                .status(400)
                .json({ success: false, message: "OTP has expired" });
        }
        const newUser = new users_model_1.default({
            email: cachedUser.email,
            name: cachedUser.name,
            password: cachedUser.password,
            user_type: "",
            is_verified: true,
            signup_date: new Date(),
        });
        if (!cachedUser.signup_date) {
            cachedUser.signup_date = new Date();
        }
        yield newUser.save();
        userCache.del(email);
        return res.status(200).json({
            success: true,
            message: "OTP verified successfully. You can now sign in.",
        });
    }
    catch (error) {
        console.error("Error verifying OTP:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});
exports.verifySignupOtp = verifySignupOtp;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { email, password } = req.body;
    if (!email || !password) {
        return res
            .status(400)
            .json({ success: false, message: "Email and password are required" });
    }
    try {
        const user = yield users_model_1.default.findOne({ email }).select("email password");
        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "User not found" });
        }
        const passwordMatch = yield (0, bcrypt_1.comparePassword)(password, (_a = user.password) !== null && _a !== void 0 ? _a : "");
        if (!passwordMatch) {
            return res
                .status(401)
                .json({ success: false, message: "Incorrect password" });
        }
        const userPayload = user.toObject();
        delete userPayload.password;
        const accessToken = (0, jwt_1.generateAccessToken)(userPayload);
        const refreshToken = (0, jwt_1.generateRefreshToken)(userPayload);
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "none",
            maxAge: 24 * 60 * 60 * 1000, // 1 day expiration
        });
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days expiration
        });
        user.last_login = new Date();
        yield user.save();
        return res.status(200).json({
            success: true,
            message: "Login successful",
            user: userPayload,
            accessToken: accessToken,
            refreshToken: refreshToken,
        });
    }
    catch (error) {
        console.error("Error during login:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
});
exports.login = login;
const requestPasswordResetOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    if (!email) {
        return res
            .status(400)
            .json({ success: false, message: "Email is required" });
    }
    try {
        const user = yield users_model_1.default.findOne({ email });
        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "User not found" });
        }
        const otp = (0, otp_1.generateOtp)();
        user.otp = otp;
        (user.otp_expiry = new Date(Date.now() + 90 * 1000)), // 90 seconds expiry
            yield user.save();
        const subject = "Password Reset OTP";
        const body = `Your OTP for password reset is: ${otp}. It will expire in 90 seconds.`;
        yield (0, sendMail_1.sendMail)(email, subject, body);
        return res
            .status(200)
            .json({ success: true, message: "OTP sent to email" });
    }
    catch (error) {
        console.log("Error requesting password reset: ", error);
        return res
            .status(500)
            .json({ success: false, message: "Internal server error" });
    }
});
exports.requestPasswordResetOtp = requestPasswordResetOtp;
const resendPasswordResetOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    if (!email) {
        return res
            .status(400)
            .json({ success: false, message: "Email is required" });
    }
    try {
        const user = yield users_model_1.default.findOne({ email });
        if (!user) {
            return res
                .status(400)
                .json({ success: false, message: "User not found" });
        }
        //OTP will be sent only when the previous OTP is expired
        if (user.otp_expiry && new Date() < user.otp_expiry) {
            return res
                .status(400)
                .json({ success: false, message: "OTP is still valid" });
        }
        const otp = (0, otp_1.generateOtp)();
        user.otp = otp;
        (user.otp_expiry = new Date(Date.now() + 90 * 1000)), // 90 seconds expiry
            (user.is_verified = false);
        yield user.save();
        const subject = "Password Reset OTP";
        const body = `Your new OTP for password reset is: ${otp}. It will expire in 90 seconds.`;
        yield (0, sendMail_1.sendMail)(email, subject, body);
        return res
            .status(200)
            .json({ success: true, message: "OTP resent to email" });
    }
    catch (error) {
        console.error("Error resending OTP:", error);
        return res
            .status(500)
            .json({ success: false, message: "Internal server error" });
    }
});
exports.resendPasswordResetOtp = resendPasswordResetOtp;
const verifyPasswordResetOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res
            .status(400)
            .json({ success: false, message: "Email and otp are required" });
    }
    try {
        const user = yield users_model_1.default.findOne({ email });
        if (!user) {
            return res
                .status(400)
                .json({ success: false, message: "User not found" });
        }
        //checking if otp is correct
        if (user.otp !== otp) {
            return res.status(400).json({ success: false, message: "Incorrect OTP" });
        }
        //checking if otp is expired
        if (user.otp_expiry && new Date() > user.otp_expiry) {
            return res
                .status(400)
                .json({ success: false, message: "OTP has expired" });
        }
        user.is_verified = true;
        yield user.save();
        return res
            .status(200)
            .json({ success: true, message: "OTP verified successfully" });
    }
    catch (error) {
        console.log("Error occured in verifyOtp : ", error);
        return res
            .status(500)
            .json({ success: false, message: "Internal server error" });
    }
});
exports.verifyPasswordResetOtp = verifyPasswordResetOtp;
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
        return res
            .status(400)
            .json({ success: false, message: "Email and new password are required" });
    }
    try {
        const user = yield users_model_1.default.findOne({ email });
        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "User not found" });
        }
        //checking if user is verified or not
        if (!user.is_verified) {
            return res
                .status(400)
                .json({ success: false, message: "Otp not verified" });
        }
        const hashedPassword = yield (0, bcrypt_1.hashPassword)(newPassword);
        user.password = hashedPassword;
        user.otp = null;
        user.otp_expiry = null;
        user.is_verified = false;
        yield user.save();
        return res
            .status(200)
            .json({ success: true, message: "Password reset successfully" });
    }
    catch (error) {
        console.log("Error resetting password: ", error);
        return res
            .status(500)
            .json({ success: false, message: "Internal server error" });
    }
});
exports.resetPassword = resetPassword;
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.clearCookie("accessToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "none",
        });
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "none",
        });
        return res.status(200).json({
            success: true,
            message: "Logout successful",
        });
    }
    catch (error) {
        console.error("Error during logout:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during logout",
            error: error.message,
        });
    }
});
exports.logout = logout;
