import { Request, Response } from "express";
import User from "../models/users.model";

export const toggleSecurityAlert = async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }
    user.security_alert_notification = !user.security_alert_notification;
    await user.save();
    return res.status(200).json({
      success: true,
      message: `Security Notifications ${user.security_alert_notification ? "enabled" : "disabled"}`,
      user,
    });
  } catch (error) {
    console.error("Error toggling security notifications:", error);
    return res.status(500).json({
      success: true,
      message: "Internal server error",
    });
  }
};

export const toggleRegularAlerts = async (req: Request, res: Response) => {
    const { userId } = req.params;
    try {
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "userId is required",
        });
      }
      const user = await User.findById(userId);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "User not found",
        });
      }
      user.regular_updates_notification = !user.regular_updates_notification;
      await user.save();
      return res.status(200).json({
        success: true,
        message: `Regular Notifications ${user.regular_updates_notification ? "enabled" : "disabled"}`,
        user,
      });
    } catch (error) {
      console.error("Error toggling regular notifications:", error);
      return res.status(500).json({
        success: true,
        message: "Internal server error",
      });
    }
  };

  export const togglePromotionAlerts = async (req: Request, res: Response) => {
    const { userId } = req.params;
    try {
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "userId is required",
        });
      }
      const user = await User.findById(userId);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "User not found",
        });
      }
      user.promotion_notification = !user.promotion_notification;
      await user.save();
      return res.status(200).json({
        success: true,
        message: `Promotion Notifications ${user.promotion_notification ? "enabled" : "disabled"}`,
        user,
      });
    } catch (error) {
      console.error("Error toggling promotion notifications:", error);
      return res.status(500).json({
        success: true,
        message: "Internal server error",
      });
    }
  };
