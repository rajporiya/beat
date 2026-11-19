import jwt from "jsonwebtoken";
import { Song } from "../models/song.models.js";
import { Download } from "../models/download.models.js";
import {
  canDownload,
  getPlanDefinition,
  minimumPlanForDownload,
  resolveUserPlan,
} from "../config/plans.js";
import { asyncHandler, fail, ok } from "../utils/api.js";

const SECRET = process.env.JWT_SECRET || "beat_music_super_secure_jwt_secret_key_2026_spotify_clone";
const DOWNLOAD_TYPES = ["song", "podcast", "video"];

const safeFilename = (title, extension) => {
  const base = String(title || "beat-download")
    .replace(/[\\/:*?"<>|\r\n]+/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80) || "beat-download";
  return `${base}${extension}`;
};

const disposition = (filename) => {
  const ascii = filename.replace(/[^\x20-\x7E]/g, "").trim() || "beat-download";
  return `attachment; filename="${ascii.replace(/"/g, "")}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
};

const extensionFor = (type) => {
  if (type === "video") return ".mp4";
  return ".mp3";
};

const contentFor = (upstream, type) => {
  if (type === "video") return "video/mp4";
  return upstream.headers.get("content-type") || "audio/mpeg";
};

const fetchMedia = async (url) => {
  let upstream;
  try {
    upstream = await fetch(url);
  } catch {
    throw fail(502, "We could not reach the media file. Please try again.");
  }
  if (!upstream.ok) throw fail(502, "The media file is unavailable right now.");
  return upstream;
};

const assertDownloadAllowed = (user, type) => {
  const plan = resolveUserPlan(user);
  if (!canDownload(plan, type)) {
    const required = minimumPlanForDownload(type);
    throw fail(
      403,
      `${type === "song" ? "Song" : type === "podcast" ? "Podcast" : "Video"} downloads require the ${getPlanDefinition(required).name} plan`,
    );
  }
  return plan;
};

/**
 * POST /api/downloads/authorize
 * Validates the user's plan and returns either a direct static URL (for files
 * served by the web app) or a short-lived signed proxy URL (for remote files).
 */
export const authorizeDownload = asyncHandler(async (req, res) => {
  const { type, title, mediaUrl } = req.body ?? {};

  if (!DOWNLOAD_TYPES.includes(type)) {
    throw fail(422, "Download type must be song, podcast or video");
  }
  if (!mediaUrl || typeof mediaUrl !== "string") {
    throw fail(422, "A media URL is required");
  }

  const plan = assertDownloadAllowed(req.user, type);
  const filename = safeFilename(title, extensionFor(type));
  const isRelative = mediaUrl.startsWith("/");
  let downloadUrl = mediaUrl;
  let direct = isRelative;

  if (!isRelative) {
    if (!/^https?:\/\//i.test(mediaUrl)) {
      throw fail(422, "Only absolute media URLs are supported");
    }
    const token = jwt.sign(
      { sub: req.user._id.toString(), url: mediaUrl, filename, type },
      SECRET,
      { expiresIn: "15m" },
    );
    downloadUrl = `/api/downloads/file?token=${encodeURIComponent(token)}`;
    direct = false;
  }

  await Download.create({
    user: req.user._id,
    plan,
    type,
    title: String(title || filename).slice(0, 160),
    mediaUrl,
    filename,
  });

  ok(res, { downloadUrl, filename, direct, expiresIn: 900 }, "Download authorized");
});

/**
 * GET /api/downloads/file?token=...
 * Streams a remote media file through the API with a download filename.
 */
export const downloadFile = asyncHandler(async (req, res) => {
  let payload;
  try {
    payload = jwt.verify(String(req.query.token || ""), SECRET);
  } catch {
    throw fail(401, "This download link has expired. Please try again.");
  }

  if (payload.sub !== req.user._id.toString()) {
    throw fail(403, "This download belongs to another account");
  }

  const upstream = await fetchMedia(payload.url);
  const buffer = Buffer.from(await upstream.arrayBuffer());

  res.setHeader("Content-Type", contentFor(upstream, payload.type));
  res.setHeader("Content-Disposition", disposition(payload.filename));
  res.setHeader("Content-Length", buffer.length);
  res.send(buffer);
});

/**
 * GET /api/downloads/song/:id
 * Convenience endpoint for catalog songs. Verifies the plan before returning
 * the audio bytes (or redirecting to a locally served file).
 */
export const downloadSongById = asyncHandler(async (req, res) => {
  assertDownloadAllowed(req.user, "song");
  const plan = resolveUserPlan(req.user);

  const song = await Song.findById(req.params.id);
  if (!song) throw fail(404, "Song not found");

  const filename = safeFilename(`${song.title} - ${song.artist}`, ".mp3");
  await Download.create({
    user: req.user._id,
    plan,
    type: "song",
    title: song.title,
    mediaUrl: song.audioUrl,
    filename,
  });

  if (song.audioUrl.startsWith("/")) {
    return res.redirect(song.audioUrl);
  }

  const upstream = await fetchMedia(song.audioUrl);
  const buffer = Buffer.from(await upstream.arrayBuffer());
  res.setHeader("Content-Type", contentFor(upstream, "song"));
  res.setHeader("Content-Disposition", disposition(filename));
  res.setHeader("Content-Length", buffer.length);
  res.send(buffer);
});
