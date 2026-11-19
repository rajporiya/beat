import mongoose from "mongoose";

const podcastSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        showName: { type: String, required: true, trim: true },
        host: { type: String, default: "", trim: true },
        description: { type: String, default: "", trim: true },
        category: { type: String, default: "Talk", trim: true, index: true },
        coverUrl: { type: String, default: "" },
        audioUrl: { type: String, required: true },
        videoUrl: { type: String, default: "" },
        videoThumbnailUrl: { type: String, default: "" },
        duration: { type: Number, default: 0, min: 0 },
        episodeNumber: { type: Number, default: 0, min: 0 },
        season: { type: Number, default: 1, min: 0 },
        publishDate: { type: Date, default: Date.now, index: true },
        plays: { type: Number, default: 0, min: 0 },
        isExplicit: { type: Boolean, default: false },
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

podcastSchema.index({ title: "text", showName: "text", description: "text" });

export const Podcast = mongoose.model("Podcast", podcastSchema);
