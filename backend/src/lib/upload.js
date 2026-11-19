import fs from "node:fs/promises";
import cloudinary from "./cludinary.js";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"];
const AUDIO_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/ogg", "audio/webm", "audio/mp4", "audio/aac", "audio/flac", "audio/x-m4a"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/x-matroska", "video/x-msvideo", "video/mpeg", "video/ogg"];

export const MEDIA_LIMITS = {
    image: 10 * 1024 * 1024,
    audio: 100 * 1024 * 1024,
    video: 100 * 1024 * 1024,
};

/**
 * Normalise a value coming from multipart forms (express-fileupload can hand
 * back either a single file or an array when the same field is repeated).
 */
export const pickFile = (files, key) => {
    const value = files?.[key];
    if (!value) return null;
    return Array.isArray(value) ? value[0] : value;
};

export const pickFirstFile = (files, keys = []) => {
    for (const key of keys) {
        const file = pickFile(files, key);
        if (file) return file;
    }
    return null;
};

export const fileKind = (file) => {
    const mime = String(file?.mimetype || "").toLowerCase();
    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("audio/")) return "audio";
    if (mime.startsWith("video/")) return "video";
    return "other";
};

export const validateFile = (file, kind) => {
    if (!file) return null;
    const mime = String(file.mimetype || "").toLowerCase();
    const allowed =
        kind === "image" ? IMAGE_TYPES :
        kind === "audio" ? AUDIO_TYPES :
        kind === "video" ? VIDEO_TYPES : null;

    if (allowed && !allowed.includes(mime) && !mime.startsWith(`${kind}/`)) {
        return `Unsupported ${kind} file type: ${mime || "unknown"}`;
    }

    const limit = MEDIA_LIMITS[kind];
    if (limit && Number(file.size) > limit) {
        return `${kind[0].toUpperCase()}${kind.slice(1)} file must be ${Math.round(limit / (1024 * 1024))} MB or smaller`;
    }
    return null;
};

const resourceTypeFor = (file) => {
    const kind = fileKind(file);
    if (kind === "image") return "image";
    if (kind === "audio" || kind === "video") return "video";
    return "auto";
};

/**
 * Upload a temporary file to Cloudinary and always remove the local temp file.
 * Returns the URL, Cloudinary public id and (for audio/video) the duration in
 * seconds, which saves the browser from having to decode the media.
 */
export const uploadToCloudinary = async (file, { folder = "beat-music", resourceType } = {}) => {
    if (!file?.tempFilePath) {
        throw new Error("No file was provided for upload");
    }

    try {
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            throw Object.assign(new Error("Media storage is not configured. Add your Cloudinary credentials to the backend .env file."), { status: 503 });
        }

        const result = await cloudinary.uploader.upload(file.tempFilePath, {
            resource_type: resourceType || resourceTypeFor(file),
            folder,
            use_filename: true,
            unique_filename: true,
            overwrite: false,
        });

        return {
            url: result.secure_url,
            publicId: result.public_id,
            resourceType: result.resource_type,
            bytes: result.bytes || file.size || 0,
            duration: Number(result.duration) || 0,
        };
    } catch (error) {
        const wrapped = new Error(`Cloudinary upload failed: ${error?.message || "unknown error"}`);
        wrapped.status = error?.status || 500;
        throw wrapped;
    } finally {
        await fs.unlink(file.tempFilePath).catch(() => {});
    }
};

/** Build a JPG poster frame URL for a Cloudinary-hosted video. */
export const cloudinaryVideoThumbnail = (videoUrl) => {
    if (typeof videoUrl !== "string" || !videoUrl.includes("res.cloudinary.com") || !videoUrl.includes("/video/upload/")) {
        return "";
    }
    return videoUrl
        .replace("/video/upload/", "/video/upload/so_1/")
        .replace(/\.(mp4|webm|mov|mkv|avi|m4v|ogv)(\?.*)?$/i, ".jpg");
};

export const parseBoolean = (value) =>
    value === true || value === "true" || value === "1" || value === "on";

export const removeTempFiles = async (files) => {
    const values = Object.values(files || {}).flat();
    await Promise.all(
        values.map((file) =>
            file?.tempFilePath ? fs.unlink(file.tempFilePath).catch(() => {}) : Promise.resolve(),
        ),
    );
};

export const parseNumber = (value, fallback = 0) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
};
