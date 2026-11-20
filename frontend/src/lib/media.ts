/** Shared media helpers used by the admin upload flows and public pages. */

export const formatDuration = (seconds?: number) => {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const minutes = Math.floor(total / 60);
  const remainder = total % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
};

export const formatDurationLong = (seconds?: number) => {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainder = total % 60;
  if (hours) return `${hours} hr ${minutes} min`;
  if (minutes) return `${minutes} min ${remainder} sec`;
  return `${remainder} sec`;
};

export const formatNumber = (value?: number) => {
  const number = Number(value) || 0;
  return new Intl.NumberFormat("en", { notation: number >= 10000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(number);
};

export const formatBytes = (bytes?: number) => {
  const size = Number(bytes) || 0;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });
};

export const formatRelativeDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
};

export const readMediaDuration = (file: File) =>
  new Promise<number>((resolve) => {
    const element = document.createElement(file.type.startsWith("video/") ? "video" : "audio");
    element.preload = "metadata";
    const url = URL.createObjectURL(file);
    const finish = (duration: number) => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(duration) && duration > 0 ? duration : 0);
    };
    element.onloadedmetadata = () => finish(element.duration);
    element.onerror = () => finish(0);
    element.src = url;
  });

export const MEDIA_ACCEPT = {
  image: "image/png,image/jpeg,image/webp,image/gif,image/avif",
  audio: "audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/ogg,audio/webm,audio/mp4,audio/aac,audio/flac,audio/x-m4a",
  video: "video/mp4,video/webm,video/quicktime,video/x-matroska,video/x-msvideo",
} as const;

export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export const PODCAST_CATEGORIES = [
  "Talk",
  "Comedy",
  "Business",
  "Health & Fitness",
  "News",
  "Education",
  "Technology",
  "Sports",
  "Society & Culture",
  "True Crime",
  "Music",
  "TV & Film",
] as const;

export const VIDEO_CATEGORIES = [
  "Music",
  "Live",
  "Interview",
  "Documentary",
  "Tutorial",
  "Podcast",
  "Vlog",
  "Short",
] as const;
