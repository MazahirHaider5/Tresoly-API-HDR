import mongoose, { Schema } from "mongoose";

interface ISettings extends Document {
  key: String;
  value: String;
}

const SettingsSchema = new mongoose.Schema<ISettings>(
  {
    key: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ISettings>("Settings", SettingsSchema);
