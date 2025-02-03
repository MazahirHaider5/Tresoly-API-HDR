import { Request, Response } from "express";
import User from "../models/users.model";
import { comparePassword, hashPassword } from "../utils/bcrypt";
import { sendMail } from "../utils/sendMail";
import { uploadImageOnly } from "../config/multer";
import jwt from "jsonwebtoken";


// Helper function to get user by ID or email
const findUser = async (id: string | undefined, email?: string) => {
  let user;
  if (id) {
    user = await User.findById(id);
  } else if (email) {
    user = await User.findOne({ email });
  }
  return user;
};

export const getUsers = async (req: Request, res: Response) => {
  const { id, email } = req.query;
  try {
    if (id || email) {
      const user = await findUser(id as string, email as string);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      return res.status(200).json({ success: true, data: user });
    }
    const users = await User.find().select("-password");
    if (!users || users.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No users found" });
    }
    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      success: false,
      message: "Error occurred while fetching users",
      error: (error as Error).message
    });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const token =
      req.cookies.accessToken ||
      (req.headers.authorization && req.headers.authorization.split(" ")[1]);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized, no token provided"
      });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };

    const userId = decodedToken.id;
    const user = await User.findByIdAndDelete(userId);

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
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while deleting the account",
      error: (error as Error).message
    });
  }
};

export const updateUser = [
  uploadImageOnly.single("photo"),
  async (req: Request, res: Response) => {
    try {
      const token =
        req.cookies.accessToken ||
        (req.headers.authorization && req.headers.authorization.split(" ")[1]);

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized , token not provided"
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
          message: "User not found"
        });
      }
      const { email, name, phone } = req.body;
      if (email) user.email = email;
      if (name) user.name = name;
      if (phone) user.phone = phone;

      if (req.file) {
        user.photo = req.file.path;
      }
      await user.save();
      return res.status(200).json({
        success: true,
        message: "Updated successfully",
        user
      });
    } catch (error) {
      console.error("Error updating user", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: (error as Error).message
      });
    }
  }
];

export const updateSpecificFields = async (req: Request, res: Response) => {
  try {
    const token =
      req.cookies.accessToken ||
      (req.headers.authorization && req.headers.authorization.split(" ")[1]);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized, token not provided"
      });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };
    const userId = decodedToken.id;

    const {
      language,
      is_biomatric,
      is_two_factor,
    } = req.body;
    const updateFields: {
      [key: string]: any;
    } = {};

    if (language) updateFields.language = language;
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
    const updatedUser = await User.findByIdAndUpdate(userId, updateFields, {
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
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error updating user fields"
    });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Both old and new passwords are required",
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

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        message: "JWT_SECRET is not defined in environment variables",
      });
    }

    const decodedToken = jwt.verify(token, jwtSecret) as { id: string };
    const userId = decodedToken.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if the user's password exists
    if (!user?.password) {
      return res.status(400).json({
        success: false,
        message: "Password is missing in user data",
      });
    }

    // Compare the old password
    const isOldPasswordCorrect = await comparePassword(oldPassword, user.password);
    if (!isOldPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: "Old password is incorrect",
      });
    }

    // Hash the new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update the password in the database
    user.password = hashedNewPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    return res.status(500).json({
      success: false,
      message: "Error occurred while changing the password",
      error: (error as Error).message,
    });
  }
};
