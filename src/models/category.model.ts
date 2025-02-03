import mongoose, { Schema, Document } from "mongoose";

export interface ICategory extends Document {
  name: "browser" | "mobile" | "other";
}

const CategorySchema: Schema = new Schema(
  {
    name: {
      type: String,
      enum: ["browser", "mobile", "other"],
      required: true,
    },
  },
  { timestamps: true }
);

export const Category = mongoose.model<ICategory>("Category", CategorySchema);
