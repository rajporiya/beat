import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        creator: { type: String, required: true, trim: true },
        description: { type: String, default: "", trim: true },
        category: { type: String, default: "Music", trim: true, index: true },
        thumbnailUrl: { type: String, default: "" },
        videoUrl: { type: String, required: true },
        duration: { type: Number, default: 0, min: 0 },
        views: { type: Number, default: 0, min: 0 },
        tags: [{ type: String, trim: true }],
        publishedAt: { type: Date, default: Date.now, index: true },
        featured: { type: Boolean, default: false, index: true },
        status: {
            type: String,
            enum: ["published", "draft"],
            default: "published",
            index: true,
        },
    },
    { timestamps: true },
);

videoSchema.index({ title: "text", creator: "text", description: "text" });

export const Video = mongoose.model("Video", videoSchema);
