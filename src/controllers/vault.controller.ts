import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Vault } from "../models/vaults.model";
import { hashPassword } from "../utils/bcrypt";
import User from "../models/users.model";

export const createVault = async (req: Request, res: Response) => {
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

    const {
      vault_category,
      vault_site_address,
      vault_username,
      password,
      secure_generated_password,
      tags,
    } = req.body;

    if (
      !vault_category ||
      !vault_site_address ||
      !vault_username ||
      !password ||
      !["browser", "mobile", "other"].includes(vault_category)
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Invalid or missing required fields",
        });
    }

    const hashedPassword = await hashPassword(password);

    const newVault = new Vault({
      user_id: userId,
      vault_category,
      vault_site_address,
      vault_username,
      password: hashedPassword,
      secure_generated_password,
      tags,
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
