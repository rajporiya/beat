import { Podcast } from "../models/podcast.models.js";
import { Video } from "../models/video.models.js";
import {
    cloudinaryVideoThumbnail,
    parseBoolean,
    parseNumber,
    pickFile,
    removeTempFiles,
    uploadToCloudinary,
    validateFile,
} from "../lib/upload.js";

const cleanText = (value, fallback = "") =>
    typeof value === "string" ? value.trim() : fallback;

const parseTags = (value) => {
    if (Array.isArray(value)) return value.map(String).map((tag) => tag.trim()).filter(Boolean);
    if (typeof value !== "string") return [];
    const raw = value.trim();
    if (!raw) return [];
    if (raw.startsWith("[")) {
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed.map(String).map((tag) => tag.trim()).filter(Boolean) : [];
        } catch {
            return [];
        }
    }
    return raw.split(",").map((tag) => tag.trim()).filter(Boolean);
};

const resolveStatus = (value, fallback = "published") => {
    if (value === undefined) return fallback;
    return value === "draft" ? "draft" : "published";
};

const resolveDate = (value, fallback = new Date()) => {
    if (!value) return fallback;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? fallback : date;
};

const ensureFile = (file, kind) => {
    if (!file) return null;
    return validateFile(file, kind);
};

const uploadPodcastAssets = async (files) => {
    const audioFile = pickFile(files, "audioFile");
    const videoFile = pickFile(files, "videoFile");
    const coverFile = pickFile(files, "coverFile") || pickFile(files, "imageFile");
    const thumbnailFile = pickFile(files, "thumbnailFile") || pickFile(files, "videoThumbnailFile");

    for (const [file, kind] of [[audioFile, "audio"], [videoFile, "video"], [coverFile, "image"], [thumbnailFile, "image"]]) {
        const error = ensureFile(file, kind);
        if (error) {
            await removeTempFiles(files);
            throw Object.assign(new Error(error), { status: 400 });
        }
    }

    try {
        const [audio, video, cover, thumbnail] = await Promise.all([
            audioFile ? uploadToCloudinary(audioFile, { folder: "beat-music/podcasts/audio" }) : null,
            videoFile ? uploadToCloudinary(videoFile, { folder: "beat-music/podcasts/video" }) : null,
            coverFile ? uploadToCloudinary(coverFile, { folder: "beat-music/podcasts/covers" }) : null,
            thumbnailFile ? uploadToCloudinary(thumbnailFile, { folder: "beat-music/podcasts/thumbnails" }) : null,
        ]);

        return { audio, video, cover, thumbnail };
    } catch (error) {
        await removeTempFiles(files);
        throw error;
    }
};

const uploadVideoAssets = async (files) => {
    const videoFile = pickFile(files, "videoFile");
    const thumbnailFile = pickFile(files, "thumbnailFile") || pickFile(files, "imageFile");

    for (const [file, kind] of [[videoFile, "video"], [thumbnailFile, "image"]]) {
        const error = ensureFile(file, kind);
        if (error) {
            await removeTempFiles(files);
            throw Object.assign(new Error(error), { status: 400 });
        }
    }

    try {
        const [video, thumbnail] = await Promise.all([
            videoFile ? uploadToCloudinary(videoFile, { folder: "beat-music/videos" }) : null,
            thumbnailFile ? uploadToCloudinary(thumbnailFile, { folder: "beat-music/videos/thumbnails" }) : null,
        ]);

        return { video, thumbnail };
    } catch (error) {
        await removeTempFiles(files);
        throw error;
    }
};

/* -------------------------------------------------------------------------- */
/*                              Public podcast API                            */
/* -------------------------------------------------------------------------- */

export const listPublicPodcasts = async (req, res, next) => {
    try {
        const { q, category, limit } = req.query;
        const filter = { status: "published" };

        if (category && category !== "All") filter.category = category;
        if (q) {
            const pattern = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
            filter.$or = [{ title: pattern }, { showName: pattern }, { host: pattern }, { category: pattern }];
        }

        const max = Math.min(Math.max(parseNumber(limit, 40), 1), 100);
        const podcasts = await Podcast.find(filter)
            .sort({ featured: -1, publishDate: -1, createdAt: -1 })
            .limit(max);

        res.status(200).json(podcasts);
    } catch (error) {
        next(error);
    }
};

export const getPublicPodcast = async (req, res, next) => {
    try {
        const podcast = await Podcast.findOne({ _id: req.params.id, status: "published" });
        if (!podcast) return res.status(404).json({ message: "Podcast not found" });
        res.status(200).json(podcast);
    } catch (error) {
        next(error);
    }
};

/* -------------------------------------------------------------------------- */
/*                               Public video API                             */
/* -------------------------------------------------------------------------- */

export const listPublicVideos = async (req, res, next) => {
    try {
        const { q, category, limit } = req.query;
        const filter = { status: "published" };

        if (category && category !== "All") filter.category = category;
        if (q) {
            const pattern = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
            filter.$or = [{ title: pattern }, { creator: pattern }, { category: pattern }];
        }

        const max = Math.min(Math.max(parseNumber(limit, 40), 1), 100);
        const videos = await Video.find(filter)
            .sort({ featured: -1, publishedAt: -1, createdAt: -1 })
            .limit(max);

        res.status(200).json(videos);
    } catch (error) {
        next(error);
    }
};

export const getPublicVideo = async (req, res, next) => {
    try {
        const video = await Video.findOne({ _id: req.params.id, status: "published" });
        if (!video) return res.status(404).json({ message: "Video not found" });
        res.status(200).json(video);
    } catch (error) {
        next(error);
    }
};

/* -------------------------------------------------------------------------- */
/*                              Admin podcast API                             */
/* -------------------------------------------------------------------------- */

export const listPodcasts = async (req, res, next) => {
    try {
        const { q, status, category } = req.query;
        const filter = {};

        if (status === "published" || status === "draft") filter.status = status;
        if (category && category !== "All") filter.category = category;
        if (q) {
            const pattern = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
            filter.$or = [{ title: pattern }, { showName: pattern }, { host: pattern }];
        }

        const podcasts = await Podcast.find(filter).sort({ createdAt: -1 });
        res.status(200).json(podcasts);
    } catch (error) {
        next(error);
    }
};

export const createPodcast = async (req, res, next) => {
    try {
        const body = req.body || {};
        const title = cleanText(body.title);
        const showName = cleanText(body.showName);

        if (!title) return res.status(400).json({ message: "Episode title is required" });
        if (!showName) return res.status(400).json({ message: "Show name is required" });

        const { audio, video, cover, thumbnail } = await uploadPodcastAssets(req.files);

        const audioUrl = audio?.url || cleanText(body.audioUrl);
        if (!audioUrl) {
            return res.status(400).json({ message: "Please upload an audio file or provide an audio URL" });
        }

        const videoUrl = video?.url || cleanText(body.videoUrl);
        const coverUrl = cover?.url || cleanText(body.coverUrl);
        const posterUrl =
            thumbnail?.url ||
            cleanText(body.videoThumbnailUrl) ||
            cloudinaryVideoThumbnail(videoUrl) ||
            coverUrl;

        const duration = Math.round(audio?.duration || parseNumber(body.duration, 0));

        const podcast = await Podcast.create({
            title,
            showName,
            host: cleanText(body.host),
            description: cleanText(body.description),
            category: cleanText(body.category) || "Talk",
            coverUrl,
            audioUrl,
            videoUrl,
            videoThumbnailUrl: posterUrl,
            duration,
            episodeNumber: parseNumber(body.episodeNumber, 0),
            season: parseNumber(body.season, 1),
            publishDate: resolveDate(body.publishDate),
            isExplicit: parseBoolean(body.isExplicit),
            featured: parseBoolean(body.featured),
            status: resolveStatus(body.status),
        });

        res.status(201).json(podcast);
    } catch (error) {
        next(error);
    }
};

export const updatePodcast = async (req, res, next) => {
    try {
        const podcast = await Podcast.findById(req.params.id);
        if (!podcast) return res.status(404).json({ message: "Podcast not found" });

        const body = req.body || {};
        const { audio, video, cover, thumbnail } = await uploadPodcastAssets(req.files);

        if (typeof body.title === "string") podcast.title = body.title.trim();
        if (typeof body.showName === "string") podcast.showName = body.showName.trim();
        if (typeof body.host === "string") podcast.host = body.host.trim();
        if (typeof body.description === "string") podcast.description = body.description.trim();
        if (typeof body.category === "string") podcast.category = body.category.trim() || "Talk";
        if (body.episodeNumber !== undefined) podcast.episodeNumber = parseNumber(body.episodeNumber, podcast.episodeNumber);
        if (body.season !== undefined) podcast.season = parseNumber(body.season, podcast.season);
        if (body.publishDate) podcast.publishDate = resolveDate(body.publishDate, podcast.publishDate);
        if (body.duration !== undefined) podcast.duration = parseNumber(body.duration, podcast.duration);
        if (body.isExplicit !== undefined) podcast.isExplicit = parseBoolean(body.isExplicit);
        if (body.featured !== undefined) podcast.featured = parseBoolean(body.featured);
        if (body.status !== undefined) podcast.status = resolveStatus(body.status, podcast.status);

        if (audio) {
            podcast.audioUrl = audio.url;
            podcast.duration = Math.round(audio.duration || podcast.duration);
        } else if (typeof body.audioUrl === "string" && body.audioUrl.trim()) {
            podcast.audioUrl = body.audioUrl.trim();
        }

        if (video) {
            podcast.videoUrl = video.url;
        } else if (typeof body.videoUrl === "string") {
            podcast.videoUrl = body.videoUrl.trim();
        }

        if (cover) {
            podcast.coverUrl = cover.url;
        } else if (typeof body.coverUrl === "string") {
            podcast.coverUrl = body.coverUrl.trim();
        }

        if (thumbnail) {
            podcast.videoThumbnailUrl = thumbnail.url;
        } else if (typeof body.videoThumbnailUrl === "string") {
            podcast.videoThumbnailUrl = body.videoThumbnailUrl.trim();
        } else if (video && !podcast.videoThumbnailUrl) {
            podcast.videoThumbnailUrl = cloudinaryVideoThumbnail(podcast.videoUrl) || podcast.coverUrl;
        }

        await podcast.save();
        res.status(200).json(podcast);
    } catch (error) {
        next(error);
    }
};

export const deletePodcast = async (req, res, next) => {
    try {
        const podcast = await Podcast.findByIdAndDelete(req.params.id);
        if (!podcast) return res.status(404).json({ message: "Podcast not found" });
        res.status(200).json({ message: "Podcast deleted successfully" });
    } catch (error) {
        next(error);
    }
};

/* -------------------------------------------------------------------------- */
/*                               Admin video API                              */
/* -------------------------------------------------------------------------- */

export const listVideos = async (req, res, next) => {
    try {
        const { q, status, category } = req.query;
        const filter = {};

        if (status === "published" || status === "draft") filter.status = status;
        if (category && category !== "All") filter.category = category;
        if (q) {
            const pattern = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
            filter.$or = [{ title: pattern }, { creator: pattern }, { category: pattern }];
        }

        const videos = await Video.find(filter).sort({ createdAt: -1 });
        res.status(200).json(videos);
    } catch (error) {
        next(error);
    }
};

export const createVideo = async (req, res, next) => {
    try {
        const body = req.body || {};
        const title = cleanText(body.title);
        const creator = cleanText(body.creator);

        if (!title) return res.status(400).json({ message: "Video title is required" });
        if (!creator) return res.status(400).json({ message: "Creator name is required" });

        const { video, thumbnail } = await uploadVideoAssets(req.files);

        const videoUrl = video?.url || cleanText(body.videoUrl);
        if (!videoUrl) {
            return res.status(400).json({ message: "Please upload a video file or provide a video URL" });
        }

        const thumbnailUrl =
            thumbnail?.url ||
            cleanText(body.thumbnailUrl) ||
            cloudinaryVideoThumbnail(videoUrl);

        const record = await Video.create({
            title,
            creator,
            description: cleanText(body.description),
            category: cleanText(body.category) || "Music",
            thumbnailUrl,
            videoUrl,
            duration: Math.round(video?.duration || parseNumber(body.duration, 0)),
            tags: parseTags(body.tags),
            publishedAt: resolveDate(body.publishedAt),
            featured: parseBoolean(body.featured),
            status: resolveStatus(body.status),
        });

        res.status(201).json(record);
    } catch (error) {
        next(error);
    }
};

export const updateVideo = async (req, res, next) => {
    try {
        const record = await Video.findById(req.params.id);
        if (!record) return res.status(404).json({ message: "Video not found" });

        const body = req.body || {};
        const { video, thumbnail } = await uploadVideoAssets(req.files);

        if (typeof body.title === "string") record.title = body.title.trim();
        if (typeof body.creator === "string") record.creator = body.creator.trim();
        if (typeof body.description === "string") record.description = body.description.trim();
        if (typeof body.category === "string") record.category = body.category.trim() || "Music";
        if (body.duration !== undefined) record.duration = parseNumber(body.duration, record.duration);
        if (body.tags !== undefined) record.tags = parseTags(body.tags);
        if (body.publishedAt) record.publishedAt = resolveDate(body.publishedAt, record.publishedAt);
        if (body.featured !== undefined) record.featured = parseBoolean(body.featured);
        if (body.status !== undefined) record.status = resolveStatus(body.status, record.status);

        if (video) {
            record.videoUrl = video.url;
            record.duration = Math.round(video.duration || record.duration);
        } else if (typeof body.videoUrl === "string" && body.videoUrl.trim()) {
            record.videoUrl = body.videoUrl.trim();
        }

        if (thumbnail) {
            record.thumbnailUrl = thumbnail.url;
        } else if (typeof body.thumbnailUrl === "string") {
            record.thumbnailUrl = body.thumbnailUrl.trim();
        } else if (video && !record.thumbnailUrl) {
            record.thumbnailUrl = cloudinaryVideoThumbnail(record.videoUrl);
        }

        await record.save();
        res.status(200).json(record);
    } catch (error) {
        next(error);
    }
};

export const deleteVideo = async (req, res, next) => {
    try {
        const record = await Video.findByIdAndDelete(req.params.id);
        if (!record) return res.status(404).json({ message: "Video not found" });
        res.status(200).json({ message: "Video deleted successfully" });
    } catch (error) {
        next(error);
    }
};

export const getMediaLibrary = async (_req, res, next) => {
    try {
        const [podcasts, videos, podcastCount, videoCount, podcastPlays, videoViews] = await Promise.all([
            Podcast.find().sort({ createdAt: -1 }).limit(8).select("title showName coverUrl status createdAt duration"),
            Video.find().sort({ createdAt: -1 }).limit(8).select("title creator thumbnailUrl status createdAt duration"),
            Podcast.countDocuments(),
            Video.countDocuments(),
            Podcast.aggregate([{ $group: { _id: null, total: { $sum: "$plays" } } }]),
            Video.aggregate([{ $group: { _id: null, total: { $sum: "$views" } } }]),
        ]);

        res.status(200).json({
            podcasts,
            videos,
            totals: {
                podcasts: podcastCount,
                videos: videoCount,
                podcastPlays: podcastPlays[0]?.total || 0,
                videoViews: videoViews[0]?.total || 0,
            },
        });
    } catch (error) {
        next(error);
    }
};
