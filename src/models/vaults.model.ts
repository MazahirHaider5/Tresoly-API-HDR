import mongoose, { Schema, Document } from "mongoose";

export interface IVault extends Document {
  user_id: mongoose.Schema.Types.ObjectId;
  vault_category: "browser" | "mobile" | "other";
  vault_site_address: string;
  vault_username: string;
  password: string;
  secure_generated_password: string;
  tags: string[];
  icon: string;
  is_liked: boolean;
}

const VaultSchema: Schema = new Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vault_category: {
      type: String,
      enum: ["browser", "mobile", "other"], 
      required: true,
    },
    vault_site_address: {
      type: String,
      required: true,
    },
    vault_username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    secure_generated_password: {
      type: String,
      required: false,
    },
    tags: {
      type: [String],
      required: false,
    },
    icon: {
      type: String,
      required: false,
    },
    is_liked: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  { timestamps: true }
);

export const Vault = mongoose.model<IVault>("Vault", VaultSchema);
