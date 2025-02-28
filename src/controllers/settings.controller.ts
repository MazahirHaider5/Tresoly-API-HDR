import Setting from "../models/settings.model";
import { Request, Response } from "express";

export const getSettings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const settings = await Setting.find();
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res
      .status(400)
      .json({ success: false, message: "error fetching settings" });
  }
};

export const addSettings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { key, value } = req.body;
    if (!key || !value) {
      res
        .status(400)
        .json({ success: false, message: "Please provide key and value" });
      return;
    }
    const setting = new Setting({
      key,
      value,
    });
    const newSetting = await setting.save();
    res.status(201).json({ success: true, data: newSetting });
  } catch (error) {
    res
      .status(400)
      .json({ success: false, message: "error creating settings" });
  }
};
