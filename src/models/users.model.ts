import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  _id: string;
  googleId?: string;
  email: string;
  name: string;
  phone?: string;
  password?: string;
  photo?: string;
  stripe_customer_id: string | null;
  otp?: string | null;
  otp_expiry?: Date | null;
  is_verified: boolean;
  reset_token?: string;
  reset_token_expiry?: Date;
  language: string;
  currency: string;
  is_biomatric: boolean;
  is_two_factor: boolean;
  is_email_notification: boolean;
  signup_date: Date;
  last_login: Date;
  role: string;
  account_status: string;
  email_verified_at: Date;
  two_factor_secret: string;
  two_factor_recovery_codes: string;
  two_factor_verified_at: Date;
  auto_lock_time: number;
  email_notifications: number;
  security_alert_notification: boolean;
  regular_updates_notification: boolean;
  promotion_notification: boolean;
  lowercase_letters: boolean;
  uppercase_letters: boolean;
  special_characters: boolean;
  numbers: boolean;
  length: number;
  autolock_time: number;
  data_breach_alert: boolean;
}

// Mongoose schema
const UserSchema: Schema = new Schema<IUser>({
  googleId: { type: String, unique: true, sparse: true },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: false,
  },
  phone: {
    type: String,
    required: false,
  },
  password: {
    type: String,
    default: "",
  },
  photo: {
    type: String,
    default:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcStPiNn0fUvoPmedC8HjMSk7X2QATdqGz-FIQ&s",
  },
  stripe_customer_id: {
    type: String,
    default: null,
  },
  otp: {
    type: String,
    default: null,
  },
  otp_expiry: {
    type: Date,
    default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
  },
  is_verified: {
    type: Boolean,
    default: false,
  },
  language: {
    type: String,
    default: "English",
  },
  currency: {
    type: String,
    default: "US",
  },
  is_biomatric: {
    type: Boolean,
    default: false,
  },
  is_two_factor: {
    type: Boolean,
    default: false,
  },
  is_email_notification: {
    type: Boolean,
    default: false,
  },
  signup_date: {
    type: Date,
    default: null,
  },
  last_login: {
    type: Date,
    default: null,
  },
  reset_token: { type: String },
  reset_token_expiry: { type: Date },
  role: { type: String, default: "user" },
  account_status: { type: String, default: "active" },
  email_verified_at: { type: Date },
  two_factor_secret: { type: String },
  two_factor_recovery_codes: { type: String },
  two_factor_verified_at: { type: Date },
  email_notifications: { type: Number, default: 0 },
  data_breach_alert: { type:  Boolean, default: false },
  security_alert_notification: {type: Boolean, default: false},
  regular_updates_notification: {type: Boolean, default: false},
  promotion_notification: {type: Boolean, default: false},
  lowercase_letters: {type: Boolean, default: false},
  uppercase_letters: {type: Boolean, default: false},
  special_characters: {type: Boolean, default: false},
  numbers: {type: Boolean, default: false},
  length: {type: Number},
  autolock_time: {type: Number, default: 5},
});

export default mongoose.model<IUser>("Users", UserSchema);


