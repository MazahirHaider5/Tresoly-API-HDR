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
exports.deleteAccount = exports.changePassword = exports.getLoggedInUserData = exports.verifyTwoFactorLogin = exports.toggleTwoFactorAuth = exports.logout = exports.resetPassword = exports.verifyPasswordResetOtp = exports.resendPasswordResetOtp = exports.requestPasswordResetOtp = exports.login = exports.verifySignupOtp = exports.userSignup = void 0;
const bcrypt_1 = require("../utils/bcrypt");
const jwt_1 = require("../utils/jwt");
const users_model_1 = __importDefault(require("../models/users.model"));
const sendMail_1 = require("../utils/sendMail");
const otp_1 = require("../utils/otp");
const node_cache_1 = __importDefault(require("node-cache"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const activity_model_1 = __importDefault(require("../models/activity.model"));
const userCache = new node_cache_1.default({ stdTTL: 60 });
const userSignup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, name, password } = req.body;
    if (!email || !password) {
        return res
            .status(400)
            .json({ success: false, message: "Missing required fields" });
    }
    try {
        const existingUser = yield users_model_1.default.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User with this email already exists",
            });
        }
        const hashedPassword = yield (0, bcrypt_1.hashPassword)(password);
        const generateOtp = Math.floor(1000 + Math.random() * 9000).toString();
        userCache.set(email, {
            email,
            name: name || "Tresoly User",
            password: hashedPassword,
            otp: generateOtp,
            otp_expiry: new Date(Date.now() + 60 * 1000), // OTP expires in 60 seconds
            signup_date: new Date(),
        });
        const subject = "Tresoly Account Signup Verification";
        const body = `Your OTP is ${generateOtp}. It will expire in 60 seconds`;
        yield (0, sendMail_1.sendMail)(email, subject, body);
        return res.status(201).json({
            success: true,
            message: "OTP sent to your email. Please verify to complete registration.",
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
        const user = yield users_model_1.default.findOne({ email });
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
        // if (user.is_two_factor) {
        //   const otp = generateOtp();
        //   user.otp = otp;
        //   user.otp_expiry = new Date(Date.now() + 90 * 1000); // 90 seconds expiry
        //   await user.save();
        //   const subject = "Login Verification Code";
        //   const body = `Your login verification code is: ${otp}. It will expire in 90 seconds.`;
        //   await sendMail(user.email, subject, body);
        //   return res.status(200).json({
        //     success: true,
        //     message: "2FA verification code sent to email",
        //     requires2FA: true
        //   });
        // }
        const userPayload = user.toObject();
        delete userPayload.password;
        delete userPayload.two_factor_secret;
        delete userPayload.two_factor_recovery_codes;
        const accessToken = (0, jwt_1.generateAccessToken)(userPayload);
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "none",
            maxAge: 24 * 60 * 60 * 1000,
        });
        console.log("accessToken: ", accessToken);
        user.last_login = new Date();
        yield user.save();
        return res.status(200).json({
            success: true,
            message: "Login successful",
            user: userPayload,
            accessToken: accessToken,
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
        yield activity_model_1.default.create({
            userId: user._id,
            activityType: "Password reset",
        });
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
const toggleTwoFactorAuth = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.accessToken ||
            (req.headers.authorization && req.headers.authorization.split(" ")[1]);
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized, token not provided",
            });
        }
        const decodedToken = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const userId = decodedToken.id;
        const user = yield users_model_1.default.findById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found",
            });
        }
        user.is_two_factor = !user.is_two_factor;
        yield user.save();
        yield activity_model_1.default.create({
            userId: user._id,
            activityType: "Two Factor Authentication changed",
        });
        return res.status(200).json({
            success: true,
            message: `Two-factor authentication ${user.is_two_factor ? "enabled" : "disabled"} successfully`,
            is_two_factor: user.is_two_factor,
        });
    }
    catch (error) {
        console.error("Error toggling 2FA:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
});
exports.toggleTwoFactorAuth = toggleTwoFactorAuth;
const verifyTwoFactorLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({
            success: false,
            message: "Email and verification code are required",
        });
    }
    try {
        const user = yield users_model_1.default.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        if (user.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid verification code",
            });
        }
        if (user.otp_expiry && new Date() > user.otp_expiry) {
            return res.status(400).json({
                success: false,
                message: "Verification code has expired",
            });
        }
        user.otp = null;
        user.otp_expiry = null;
        user.last_login = new Date();
        yield user.save();
        const userPayload = user.toObject();
        delete userPayload.password;
        const accessToken = (0, jwt_1.generateAccessToken)(userPayload);
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "none",
            maxAge: 24 * 60 * 60 * 1000,
        });
        return res.status(200).json({
            success: true,
            message: "Login successful",
            user: userPayload,
        });
    }
    catch (error) {
        console.error("Error verifying 2FA:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
});
exports.verifyTwoFactorLogin = verifyTwoFactorLogin;
const getLoggedInUserData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Get token from cookie or Authorization header
        const token = req.cookies.accessToken || ((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1]);
        if (!token) {
            res.status(401).json({
                success: false,
                message: "No access token provided. Please log in.",
            });
            return;
        }
        console.log("Tokeeen in auth.controller: ", token);
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        console.log("Tokeeen in auth.controller: ", decoded);
        const user = yield users_model_1.default.findById(decoded.id).select("-password -two_factor_secret -two_factor_recovery_codes");
        if (!user) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }
        res.status(200).json({
            success: true,
            message: "User data fetched successfully",
            user,
        });
    }
    catch (error) {
        console.error("Error fetching logged-in user data:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
});
exports.getLoggedInUserData = getLoggedInUserData;
const changePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
        return res.status(400).json({
            success: false,
            message: "Old password and new password are required",
        });
    }
    try {
        const token = req.cookies.accessToken || ((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1]);
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "No access token provided. Please log in.",
            });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = yield users_model_1.default.findById(decoded.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        const passwordMatch = yield (0, bcrypt_1.comparePassword)(oldPassword, (_b = user.password) !== null && _b !== void 0 ? _b : "");
        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Incorrect old password",
            });
        }
        const hashedPassword = yield (0, bcrypt_1.hashPassword)(newPassword);
        user.password = hashedPassword;
        yield user.save();
        return res.status(200).json({
            success: true,
            message: "Password changed successfully",
        });
    }
    catch (error) {
        console.error("Error changing password:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
});
exports.changePassword = changePassword;
const deleteAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.accessToken;
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "No access token provided. Please log in.",
            });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = yield users_model_1.default.findById(decoded.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        yield users_model_1.default.findByIdAndDelete(decoded.id);
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
            message: "User account deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting account:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
});
exports.deleteAccount = deleteAccount;
