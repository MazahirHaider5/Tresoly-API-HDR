import mongoose, { Schema, Document } from "mongoose";

export interface IVault extends Document {
  user_id: mongoose.Schema.Types.ObjectId;
  vault_category: string;
  vault_site_address: string;
  vault_username: string;
  password: string;
  password_health_score: number;
  password_age: number;
  password_strength: string;
  password_vulnerability: string;
  secure_generated_password: string;
  password_reuse: boolean;
  two_factor_enabled: boolean;
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
    password_health_score: {
      type: Number,
      required: false,
    },
    password_age: {
      type: Number,
      required: false,
    },
    password_strength: {
      type: String,
      required: false,
    },
    password_vulnerability: {
      type: String,
      required: false,
    },
    password_reuse: {
      type: Boolean,
      default: false,
    },
    two_factor_enabled: {
      type: Boolean,
      default: false,
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
