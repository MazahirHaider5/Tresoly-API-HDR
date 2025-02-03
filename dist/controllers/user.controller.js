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
exports.changePassword = exports.updateSpecificFields = exports.updateUser = exports.deleteAccount = exports.getUsers = void 0;
const users_model_1 = __importDefault(require("../models/users.model"));
const bcrypt_1 = require("../utils/bcrypt");
const multer_1 = require("../config/multer");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Helper function to get user by ID or email
const findUser = (id, email) => __awaiter(void 0, void 0, void 0, function* () {
    let user;
    if (id) {
        user = yield users_model_1.default.findById(id);
    }
    else if (email) {
        user = yield users_model_1.default.findOne({ email });
    }
    return user;
});
const getUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, email } = req.query;
    try {
        if (id || email) {
            const user = yield findUser(id, email);
            if (!user) {
                return res
                    .status(404)
                    .json({ success: false, message: "User not found" });
            }
            return res.status(200).json({ success: true, data: user });
        }
        const users = yield users_model_1.default.find().select("-password");
        if (!users || users.length === 0) {
            return res
                .status(404)
                .json({ success: false, message: "No users found" });
        }
        return res.status(200).json({ success: true, data: users });
    }
    catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({
            success: false,
            message: "Error occurred while fetching users",
            error: error.message
        });
    }
});
exports.getUsers = getUsers;
const deleteAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.accessToken ||
            (req.headers.authorization && req.headers.authorization.split(" ")[1]);
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized, no token provided"
            });
        }
        const decodedToken = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const userId = decodedToken.id;
        const user = yield users_model_1.default.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        return res.status(200).json({
            success: true,
            message: "Account deleted successfully"
        });
    }
    catch (error) {
        console.error("Error deleting user:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while deleting the account",
            error: error.message
        });
    }
});
exports.deleteAccount = deleteAccount;
exports.updateUser = [
    multer_1.uploadImageOnly.single("photo"),
    (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const token = req.cookies.accessToken ||
                (req.headers.authorization && req.headers.authorization.split(" ")[1]);
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized , token not provided"
                });
            }
            const decodedToken = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            const userId = decodedToken.id;
            const user = yield users_model_1.default.findById(userId);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "User not found"
                });
            }
            const { email, name, phone } = req.body;
            if (email)
                user.email = email;
            if (name)
                user.name = name;
            if (phone)
                user.phone = phone;
            if (req.file) {
                user.photo = req.file.path;
            }
            yield user.save();
            return res.status(200).json({
                success: true,
                message: "Updated successfully",
                user
            });
        }
        catch (error) {
            console.error("Error updating user", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message
            });
        }
    })
];
const updateSpecificFields = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.accessToken ||
            (req.headers.authorization && req.headers.authorization.split(" ")[1]);
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized, token not provided"
            });
        }
        const decodedToken = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const userId = decodedToken.id;
        const { language, is_biomatric, is_two_factor, } = req.body;
        const updateFields = {};
        if (language)
            updateFields.language = language;
        if (typeof is_biomatric == "boolean")
            updateFields.is_biomatric = is_biomatric;
        if (typeof is_two_factor == "boolean")
            updateFields.is_two_factor = is_two_factor;
        if (Object.keys(updateFields).length == 0) {
            return res.status(400).json({
                success: false,
                message: "No valid fields provided to update"
            });
        }
        const updatedUser = yield users_model_1.default.findByIdAndUpdate(userId, updateFields, {
            new: true
        });
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "User updated successfully",
            user: updatedUser
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Error updating user fields"
        });
    }
});
exports.updateSpecificFields = updateSpecificFields;
const changePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
        return res.status(400).json({
            success: false,
            message: "Both old and new passwords are required",
        });
    }
    try {
        const token = req.cookies.accessToken ||
            (req.headers.authorization && req.headers.authorization.split(" ")[1]);
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized, token not provided",
            });
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            return res.status(500).json({
                success: false,
                message: "JWT_SECRET is not defined in environment variables",
            });
        }
        const decodedToken = jsonwebtoken_1.default.verify(token, jwtSecret);
        const userId = decodedToken.id;
        const user = yield users_model_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        // Check if the user's password exists
        if (!(user === null || user === void 0 ? void 0 : user.password)) {
            return res.status(400).json({
                success: false,
                message: "Password is missing in user data",
            });
        }
        // Compare the old password
        const isOldPasswordCorrect = yield (0, bcrypt_1.comparePassword)(oldPassword, user.password);
        if (!isOldPasswordCorrect) {
            return res.status(400).json({
                success: false,
                message: "Old password is incorrect",
            });
        }
        // Hash the new password
        const hashedNewPassword = yield (0, bcrypt_1.hashPassword)(newPassword);
        // Update the password in the database
        user.password = hashedNewPassword;
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
            message: "Error occurred while changing the password",
            error: error.message,
        });
    }
});
exports.changePassword = changePassword;
