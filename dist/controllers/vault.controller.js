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
exports.getRecentlyUsedVaults = exports.getVaultCategoryCounts = exports.getAllVaults = exports.deleteVault = exports.updateVault = exports.getUserVaults = exports.createVault = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const vaults_model_1 = require("../models/vaults.model");
const bcrypt_1 = require("../utils/bcrypt");
const users_model_1 = __importDefault(require("../models/users.model"));
const multer_1 = __importDefault(require("multer"));
const zxcvbn_1 = __importDefault(require("zxcvbn"));
const crypto_1 = __importDefault(require("crypto"));
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    },
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    }
    else {
        cb(new Error("Only images are allowed"), false);
    }
};
const upload = (0, multer_1.default)({ storage, fileFilter }).single("icon");
const createVault = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    upload(req, res, function (err) {
        return __awaiter(this, void 0, void 0, function* () {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: err.message || "Error uploading file",
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
                const decodedToken = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                const userId = decodedToken.id;
                const user = yield users_model_1.default.findById(userId);
                if (!user) {
                    return res.status(401).json({
                        success: false,
                        message: "User not found",
                    });
                }
                // Parse form-data fields
                const { vault_category, vault_site_address, vault_username, password, secure_generated_password, tags, is_liked, } = req.body;
                // Validate required fields
                if (!vault_category ||
                    !vault_site_address ||
                    !vault_username ||
                    !password ||
                    !["browser", "mobile", "other"].includes(vault_category)) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid or missing required fields",
                    });
                }
                // Parse boolean field correctly
                const isLikedBool = is_liked === "true" || is_liked === true;
                const result = (0, zxcvbn_1.default)(password);
                let strength = ["Very Weak", "Weak", "Moderate", "Strong", "Very Strong"][result.score];
                const hash = crypto_1.default
                    .createHash("sha1")
                    .update(password)
                    .digest("hex")
                    .toUpperCase();
                // Split hash: First 5 characters (prefix), rest (suffix)
                const prefix = hash.substring(0, 5);
                const suffix = hash.substring(5);
                // Make a request to the HIBP API
                const response = yield fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
                const data = yield response.text();
                // Check if the suffix appears in the response
                const vulnerability = data.includes(suffix) ? "Breached" : "None";
                // Convert tags string to an array if necessary
                let parsedTags = [];
                if (tags) {
                    parsedTags = Array.isArray(tags) ? tags : JSON.parse(tags);
                }
                // Hash password before saving
                const hashedPassword = yield (0, bcrypt_1.hashPassword)(password);
                const newVault = new vaults_model_1.Vault({
                    user_id: userId,
                    vault_category,
                    vault_site_address,
                    vault_username,
                    password: hashedPassword,
                    password_strength: strength,
                    password_health_score: result.score * 25,
                    password_vulnerability: vulnerability,
                    secure_generated_password,
                    tags: parsedTags,
                    icon: req.file ? req.file.path : "", // Save file path if uploaded
                    is_liked: isLikedBool,
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
    });
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
const getVaultCategoryCounts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const categoryCounts = yield vaults_model_1.Vault.aggregate([
            { $match: { user_id: user._id } },
            {
                $group: {
                    _id: "$vault_category",
                    count: { $sum: 1 },
                },
            },
        ]);
        const formattedCounts = {
            browser: 0,
            mobile: 0,
            other: 0,
        };
        categoryCounts.forEach((category) => {
            formattedCounts[category._id] =
                category.count;
        });
        return res.status(200).json({
            success: true,
            categoryCounts: formattedCounts,
        });
    }
    catch (error) {
        console.error("Error getting vault category counts:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
});
exports.getVaultCategoryCounts = getVaultCategoryCounts;
const getRecentlyUsedVaults = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const recentVaults = yield vaults_model_1.Vault.find({ user_id: userId })
            .sort({ updatedAt: -1 })
            .limit(3)
            .select("vault_site_address vault_username icon is_liked vault_category");
        return res.status(200).json({
            success: true,
            recentVaults,
        });
    }
    catch (error) {
        console.error("Error fetching recent vaults:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
});
exports.getRecentlyUsedVaults = getRecentlyUsedVaults;
