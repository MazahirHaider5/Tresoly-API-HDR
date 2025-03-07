import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Vault } from "../models/vaults.model";
import { hashPassword } from "../utils/bcrypt";
import User from "../models/users.model";
import multer from "multer";
import zxcvbn from "zxcvbn";
import crypto from "crypto";
import mongoose from "mongoose";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: any) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only images are allowed"), false);
  }
};

const upload = multer({ storage, fileFilter }).single("icon");

export const createVault = async (req: Request, res: Response) => {
  upload(req, res, async function (err) {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Error uploading file",
      });
    }

    try {
      const token =
        req.cookies.accessToken ||
        (req.headers.authorization && req.headers.authorization.split(" ")[1]);

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized, token not provided",
        });
      }

      const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string;
      };
      const userId = decodedToken.id;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      // Parse form-data fields
      const {
        vault_category,
        vault_site_address,
        vault_username,
        password,
        secure_generated_password,
        tags,
        is_liked,
      } = req.body;

      // Validate required fields
      if (
        !vault_category ||
        !vault_site_address ||
        !vault_username ||
        !password ||
        !vault_category
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid or missing required fields",
        });
      }

      // Parse boolean field correctly
      const isLikedBool = is_liked === "true" || is_liked === true;
      const result = zxcvbn(password);
      let strength = ["Very Weak", "Weak", "Moderate", "Strong", "Very Strong"][
        result.score
      ];
      const hash = crypto
        .createHash("sha1")
        .update(password)
        .digest("hex")
        .toUpperCase();

      // Split hash: First 5 characters (prefix), rest (suffix)
      const prefix = hash.substring(0, 5);
      const suffix = hash.substring(5);

      // Make a request to the HIBP API
      const response = await fetch(
        `https://api.pwnedpasswords.com/range/${prefix}`
      );
      const data = await response.text();

      // Check if the suffix appears in the response
      const vulnerability = data.includes(suffix) ? "Breached" : "None";
      // Convert tags string to an array if necessary
      let parsedTags: string[] = [];
      if (tags) {
        parsedTags = Array.isArray(tags) ? tags : JSON.parse(tags);
      }

      // Hash password before saving
      const hashedPassword = await hashPassword(password);

      const newVault = new Vault({
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

      await newVault.save();

      return res.status(201).json({
        success: true,
        message: "Vault created successfully",
        vault: newVault,
      });
    } catch (error) {
      console.error("Error creating vault:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: (error as Error).message,
      });
    }
  });
};

export const getUserVaults = async (req: Request, res: Response) => {
  try {
    const token =
      req.cookies.accessToken ||
      (req.headers.authorization && req.headers.authorization.split(" ")[1]);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized, token not provided",
      });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };
    const userId = decodedToken.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    const vaults = await Vault.find({ user_id: userId });

    return res.status(200).json({
      success: true,
      vaults,
    });
  } catch (error) {
    console.error("Error fetching vaults:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

export const getVaultDetailsById = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.accessToken || 
    (req.headers.authorization && req.headers.authorization.split(" ")[1]);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized, token missing",
      });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    const userId = decodedToken.id;

    const { vault_id } = req.params;

    if (!vault_id) {
      return res.status(400).json({
        success: false,
        message: "Vault ID missing",
      });
    }

    console.log("Vault ID:", vault_id);
    console.log("User ID:", userId);

    // Ensure both `vault_id` and `user_id` are valid
    if (!mongoose.Types.ObjectId.isValid(vault_id) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Vault ID or User ID",
      });
    }

    console.log("Finding vault with:", { _id: vault_id, user_id: userId });

    const vault = await Vault.findOne({ _id: vault_id, user_id: userId });
    
    console.log("Vault found:", vault);

    if (!vault) {
      return res.status(404).json({
        success: false,
        message: "Vault not found",
      });
    }

    return res.status(200).json({
      success: true,
      vault,
    });

  } catch (error) {
    console.error("Error fetching vault details:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};


export const updateVault = async (req: Request, res: Response) => {
  try {
    const token =
      req.cookies.accessToken ||
      (req.headers.authorization && req.headers.authorization.split(" ")[1]);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized, token not provided",
      });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };
    const userId = decodedToken.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    const { vaultId } = req.params;

    const vault = await Vault.findById(vaultId);
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

    const {
      vault_category,
      vault_site_address,
      vault_username,
      password,
      secure_generated_password,
      tags,
    } = req.body;

    let updatedPassword = vault.password;
    if (password) {
      updatedPassword = await hashPassword(password);
    }
    vault.vault_category = vault_category || vault.vault_category;
    vault.vault_site_address = vault_site_address || vault.vault_site_address;
    vault.vault_username = vault_username || vault.vault_username;
    vault.password = updatedPassword;
    vault.secure_generated_password =
      secure_generated_password || vault.secure_generated_password;
    vault.tags = tags || vault.tags;

    await vault.save();

    return res.status(200).json({
      success: true,
      message: "Vault updated successfully",
      vault,
    });
  } catch (error) {
    console.error("Error updating vault:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

export const deleteVault = async (req: Request, res: Response) => {
  try {
    const token =
      req.cookies.accessToken ||
      (req.headers.authorization && req.headers.authorization.split(" ")[1]);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized, token not provided",
      });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };
    const userId = decodedToken.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    const { vaultId } = req.params;

    const vault = await Vault.findById(vaultId);
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

    await Vault.findByIdAndDelete(vaultId);

    return res.status(200).json({
      success: true,
      message: "Vault deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting vault:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

export const getAllVaults = async (req: Request, res: Response) => {
  try {
    const vaults = await Vault.find();

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
  } catch (error) {
    console.error("Error fetching vaults:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

export const getVaultCategoryCounts = async (req: Request, res: Response) => {
  try {
    const token =
      req.cookies.accessToken ||
      (req.headers.authorization && req.headers.authorization.split(" ")[1]);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized, token not provided",
      });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };
    const userId = decodedToken.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    const categoryCounts = await Vault.aggregate([
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
      formattedCounts[category._id as keyof typeof formattedCounts] =
        category.count;
    });

    return res.status(200).json({
      success: true,
      categoryCounts: formattedCounts,
    });
  } catch (error) {
    console.error("Error getting vault category counts:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

export const getRecentlyUsedVaults = async (req: Request, res: Response) => {
  try {
    const token =
      req.cookies.accessToken ||
      (req.headers.authorization && req.headers.authorization.split(" ")[1]);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized, token not provided",
      });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };
    const userId = decodedToken.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }
    const recentVaults = await Vault.find({ user_id: userId })
      .sort({ updatedAt: -1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      recentVaults,
    });
  } catch (error) {
    console.error("Error fetching recent vaults:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

export const addVaultToFavourites = async (req: Request, res: Response) => {
  const { vaultId } = req.params;
  try {
    if (!vaultId) {
      return res.status(400).json({
        success: false,
        message: "VaultId is required",
      });
    }
    const vault = await Vault.findById(vaultId);
    if (!vault) {
      return res.status(400).json({
        success: false,
        message: "Vault not found",
      });
    }
    vault.is_liked = !vault.is_liked;
    await vault.save();
    return res.status(200).json({
      success: true,
      message: `Vault ${vault.is_liked ? "added to" : "removed from"} favorites`,
      vault,
    });
  } catch (error) {
    console.error("Error toggling faourite:", error);
    return res.status(500).json({
      success: true,
      message: "Internal server error",
    });
  }
};

export const getFavouriteVaults = async (req: Request, res: Response) => {
  try {
    const token =
      req.cookies.accessToken ||
      (req.headers.authorization && req.headers.authorization.split(" ")[1]);

      if(!token) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized, token missing"
        });
      }
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {id: string};
      const userId = decodedToken.id;

      const favouriteVaults = await Vault.find({user_id: userId, is_liked: true});

      return res.status(200).json({
        success: true,
        message: "Favourite vaults fetched successfully",
        vaults: favouriteVaults
      });
  } catch (error) {
    console.error("Error fetching favourite vaults: ", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message
    });
  }
};


export const getLastestEditedVaults = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.accessToken || 
    (req.headers.authorization && req.headers.authorization.split(" ")[1]);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized, token missing",
      });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {id: string};
    const userId = decodedToken.id;

    const lastEditedVaults = await Vault.find({user_id: userId})
    .sort({updatedAt: -1}).limit(10);

    return res.status(200).json({
      success: true,
      message: "Last edited vaults fetched successfully",
      lastEditedVaults,
    });

  } catch (error) {
    console.error("Error fetching vaults: ", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};