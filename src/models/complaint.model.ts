import mongoose, { Schema, Document, Types } from "mongoose";

export interface IComplaint extends Document {
  user_id: Types.ObjectId;
  complain_user_name: string;
  complain_user_email: string;
  ticket_id: string;
  issue: "Technical Issue" | "Downtime" | "Billing Issue" | "Account Access" | "Other";
  subject: string;
  description: string;
  createdAt: Date;
  complaint_status: "Pending" | "Resolved";
  reply: string;
}

const generateTicketID = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const ComplaintSchema: Schema = new Schema<IComplaint>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "Users", required: true },
    complain_user_name: { type: String, required: true },
    complain_user_email: { type: String, required: true },
    ticket_id: { type: String, required: true, unique: true },
    issue: {
      type: String,
      enum: ["Technical Issue", "Downtime", "Billing Issue", "Account Access", "Other"],
      required: true,
    },
    subject: { type: String, required: true },
    
    description: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    complaint_status: { type: String, enum: ["Pending", "Resolved"], default: "Pending" },
    reply: {
      type: String,
      default: ""
    },
  },
  { timestamps: true }
);

export default mongoose.model<IComplaint>("Complaint", ComplaintSchema);
