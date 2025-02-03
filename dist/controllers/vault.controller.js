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
exports.getAllVaults = exports.deleteVault = exports.updateVault = exports.getUserVaults = exports.createVault = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const vaults_model_1 = require("../models/vaults.model");
const bcrypt_1 = require("../utils/bcrypt");
const users_model_1 = __importDefault(require("../models/users.model"));
const createVault = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const { vault_category, vault_site_address, vault_username, password, secure_generated_password, tags, } = req.body;
        if (!vault_category ||
            !vault_site_address ||
            !vault_username ||
            !password ||
            !["browser", "mobile", "other"].includes(vault_category)) {
            return res
                .status(400)
                .json({
                success: false,
                message: "Invalid or missing required fields",
            });
        }
        const hashedPassword = yield (0, bcrypt_1.hashPassword)(password);
        const newVault = new vaults_model_1.Vault({
            user_id: userId,
            vault_category,
            vault_site_address,
            vault_username,
            password: hashedPassword,
            secure_generated_password,
            tags,
        });
        yield newVault.save();
        return res.status(201).json({
            success: true,
            message: "Vault created successfully",
            vault: newVault,
        });
    }
    catch (error) {
        console.error("Error creating vault:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
});
exports.createVault = createVault;
const getUserVaults = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const vaults = yield vaults_model_1.Vault.find({ user_id: userId });
        return res.status(200).json({
            success: true,
            vaults,
        });
    }
    catch (error) {
        console.error("Error fetching vaults:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
});
exports.getUserVaults = getUserVaults;
const updateVault = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const { vaultId } = req.params;
        const vault = yield vaults_model_1.Vault.findById(vaultId);
        if (!vault) {
            return res.status(404).json({
                success: false,
                message: "Vault not found",
            });
        }
        if (vault.user_id.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: You do not own this vault",
            });
        }
        const { vault_category, vault_site_address, vault_username, password, secure_generated_password, tags, } = req.body;
        let updatedPassword = vault.password;
        if (password) {
            updatedPassword = yield (0, bcrypt_1.hashPassword)(password);
        }
        vault.vault_category = vault_category || vault.vault_category;
        vault.vault_site_address = vault_site_address || vault.vault_site_address;
        vault.vault_username = vault_username || vault.vault_username;
        vault.password = updatedPassword;
        vault.secure_generated_password =
            secure_generated_password || vault.secure_generated_password;
        vault.tags = tags || vault.tags;
        yield vault.save();
        return res.status(200).json({
            success: true,
            message: "Vault updated successfully",
            vault,
        });
    }
    catch (error) {
        console.error("Error updating vault:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
});
exports.updateVault = updateVault;
const deleteVault = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const { vaultId } = req.params;
        const vault = yield vaults_model_1.Vault.findById(vaultId);
        if (!vault) {
            return res.status(404).json({
                success: false,
                message: "Vault not found",
            });
        }
        if (vault.user_id.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: You do not own this vault",
            });
        }
        yield vaults_model_1.Vault.findByIdAndDelete(vaultId);
        return res.status(200).json({
            success: true,
            message: "Vault deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting vault:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
});
exports.deleteVault = deleteVault;
const getAllVaults = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const vaults = yield vaults_model_1.Vault.find();
        if (!vaults.length) {
            return res.status(404).json({
                success: false,
                message: "No vaults found",
            });
        }
        return res.status(200).json({
            success: true,
            message: "Vaults retrieved successfully",
            vaults,
        });
    }
    catch (error) {
        console.error("Error fetching vaults:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
});
exports.getAllVaults = getAllVaults;
