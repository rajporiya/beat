import mongoose from "mongoose";

const artistFollowSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    artist: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

artistFollowSchema.index({ user: 1, artist: 1 }, { unique: true });

export const ArtistFollow = mongoose.model("ArtistFollow", artistFollowSchema);
