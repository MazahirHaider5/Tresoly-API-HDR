import { Request, Response } from "express";
import { comparePassword, hashPassword } from "../utils/bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} from "../utils/jwt";
import User, { IUser } from "../models/users.model";
import { sendMail } from "../utils/sendMail";
import { generateOtp } from "../utils/otp";
import NodeCache from "node-cache";
import jwt from "jsonwebtoken";
import Activity from "../models/activity.model";

const userCache = new NodeCache({ stdTTL: 60 });

export const userSignup = async (req: Request, res: Response) => {
  const { email, name, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }
    const hashedPassword = await hashPassword(password);
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
    await sendMail(email, subject, body);

    return res.status(201).json({
      success: true,
      message: "OTP sent to your email. Please verify to complete registration.",
    });

  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({
      success: false,
      message: "Error occurred while creating the user",
      error: (error as Error).message,
    });
  }
};

export const verifySignupOtp = async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res
      .status(400)
      .json({ success: false, message: "Email and OTP are required" });
  }

  try {
    const cachedUser = userCache.get(email) as {
      email: string;
      name: string;
      password: string;
      otp: string;
      otp_expiry: Date;
      signup_date: Date;
    };

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

    const newUser = new User({
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

    await newUser.save();
    userCache.del(email);

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully. You can now sign in.",
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Email and password are required" });
  }
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const passwordMatch = await comparePassword(password, user.password ?? "");
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

    const userPayload: IUser = user.toObject();
    delete (userPayload as any).password;
    delete (userPayload as any).two_factor_secret;
    delete (userPayload as any).two_factor_recovery_codes;

    const accessToken = generateAccessToken(userPayload);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000,
    });

    console.log("accessToken: ", accessToken);

    user.last_login = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: userPayload,
      accessToken: accessToken,
    });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

export const requestPasswordResetOtp = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required" });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const otp = generateOtp();

    user.otp = otp;
    (user.otp_expiry = new Date(Date.now() + 90 * 1000)), // 90 seconds expiry
      await user.save();

    const subject = "Password Reset OTP";
    const body = `Your OTP for password reset is: ${otp}. It will expire in 90 seconds.`;
    await sendMail(email, subject, body);

    return res
      .status(200)
      .json({ success: true, message: "OTP sent to email" });
  } catch (error) {
    console.log("Error requesting password reset: ", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const resendPasswordResetOtp = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required" });
  }
  try {
    const user = await User.findOne({ email });
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
    const otp = generateOtp();
    user.otp = otp;
    (user.otp_expiry = new Date(Date.now() + 90 * 1000)), // 90 seconds expiry
      (user.is_verified = false);

    await user.save();

    const subject = "Password Reset OTP";
    const body = `Your new OTP for password reset is: ${otp}. It will expire in 90 seconds.`;
    await sendMail(email, subject, body);

    return res
      .status(200)
      .json({ success: true, message: "OTP resent to email" });
  } catch (error) {
    console.error("Error resending OTP:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const verifyPasswordResetOtp = async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res
      .status(400)
      .json({ success: false, message: "Email and otp are required" });
  }
  try {
    const user = await User.findOne({ email });
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
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    console.log("Error occured in verifyOtp : ", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res
      .status(400)
      .json({ success: false, message: "Email and new password are required" });
  }
  try {
    const user = await User.findOne({ email });
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
    const hashedPassword = await hashPassword(newPassword);

    user.password = hashedPassword;
    user.otp = null;
    user.otp_expiry = null;
    user.is_verified = false;

    await user.save();
    await Activity.create({
      userId: user._id,
      activityType: "Password reset",
    });

    return res
      .status(200)
      .json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.log("Error resetting password: ", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const logout = async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error("Error during logout:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during logout",
      error: (error as Error).message,
    });
  }
};

export const toggleTwoFactorAuth = async (req: Request, res: Response) => {
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

    user.is_two_factor = !user.is_two_factor;
    await user.save();
    await Activity.create({
      userId: user._id,
      activityType: "Two Factor Authentication changed",
    });

    return res.status(200).json({
      success: true,
      message: `Two-factor authentication ${user.is_two_factor ? "enabled" : "disabled"} successfully`,
      is_two_factor: user.is_two_factor,
    });
  } catch (error) {
    console.error("Error toggling 2FA:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

export const verifyTwoFactorLogin = async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: "Email and verification code are required",
    });
  }

  try {
    const user = await User.findOne({ email });
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
    await user.save();

    const userPayload: IUser = user.toObject();
    delete userPayload.password;

    const accessToken = generateAccessToken(userPayload);

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
  } catch (error) {
    console.error("Error verifying 2FA:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

export const getLoggedInUserData = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get token from cookie or Authorization header
    const token =
      req.cookies.accessToken || req.headers.authorization?.split(" ")[1];

    if (!token) {
      res.status(401).json({
        success: false,
        message: "No access token provided. Please log in.",
      });
      return;
    }
    console.log("Tokeeen in auth.controller: ", token);

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
    };

    console.log("Tokeeen in auth.controller: ", decoded);

    const user = await User.findById(decoded.id).select(
      "-password -two_factor_secret -two_factor_recovery_codes"
    );

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "User data fetched successfully",
      user,
    });
  } catch (error) {
    console.error("Error fetching logged-in user data:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Old password and new password are required",
    });
  }

  try {
    const token =
      req.cookies.accessToken || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No access token provided. Please log in.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
    };
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const passwordMatch = await comparePassword(
      oldPassword,
      user.password ?? ""
    );
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Incorrect old password",
      });
    }

    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No access token provided. Please log in.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
    };
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await User.findByIdAndDelete(decoded.id);

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
  } catch (error) {
    console.error("Error deleting account:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};
