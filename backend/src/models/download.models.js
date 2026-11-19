import mongoose from "mongoose";

const downloadSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    plan: { type: String, enum: ["free", "basic", "premium", "pro"], required: true },
    type: { type: String, enum: ["song", "podcast", "video"], required: true },
    title: { type: String, required: true, trim: true },
    mediaUrl: { type: String, required: true },
    filename: { type: String, required: true },
  },
  { timestamps: true },
);

downloadSchema.index({ user: 1, createdAt: -1 });

export const Download = mongoose.model("Download", downloadSchema);
