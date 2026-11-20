import { Clapperboard, Loader2, Sparkles, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import Modal from "@/components/ui/modal";
import { axiosInstance } from "@/lib/axios";
import { useMusicStore } from "@/stores/useMusicStore";
import type { VideoMedia } from "@/types";
import { VIDEO_CATEGORIES, formatDuration, readMediaDuration } from "@/lib/media";
import { ProgressBar, fieldClass, labelClass, primaryButtonClass, secondaryButtonClass } from "./AdminUI";
import FileDropzone from "./FileDropzone";

type AddVideoModalProps = {
  open: boolean;
  onClose: () => void;
  video?: VideoMedia | null;
};

const toDateInput = (value?: string) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
};

const AddVideoModal = ({ open, onClose, video }: AddVideoModalProps) => {
  const { fetchAdminVideos, fetchVideos, fetchStats } = useMusicStore();
  const editing = Boolean(video);

  const [title, setTitle] = useState("");
  const [creator, setCreator] = useState("");
  const [category, setCategory] = useState("Music");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [publishedAt, setPublishedAt] = useState(toDateInput());
  const [duration, setDuration] = useState(0);
  const [status, setStatus] = useState<"published" | "draft">("published");
  const [featured, setFeatured] = useState(false);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(video?.title ?? "");
    setCreator(video?.creator ?? "");
    setCategory(video?.category || "Music");
    setDescription(video?.description ?? "");
    setTags(video?.tags?.join(", ") ?? "");
    setPublishedAt(toDateInput(video?.publishedAt));
    setDuration(video?.duration ?? 0);
    setStatus(video?.status ?? "published");
    setFeatured(Boolean(video?.featured));
    setVideoFile(null);
    setThumbnailFile(null);
    setProgress(0);
    setError(null);
  }, [open, video]);

  const handleVideoSelect = async (file: File | null) => {
    setVideoFile(file);
    if (!file) return;
    const detected = await readMediaDuration(file);
    if (detected) setDuration(Math.round(detected));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!title.trim() || !creator.trim()) {
      setError("Video title and creator are required.");
      return;
    }
    if (!editing && !videoFile) {
      setError("Please upload the video file.");
      return;
    }

    setLoading(true);
    setProgress(0);

    const data = new FormData();
    data.append("title", title.trim());
    data.append("creator", creator.trim());
    data.append("category", category);
    data.append("description", description.trim());
    data.append("tags", tags);
    data.append("publishedAt", `${publishedAt}T12:00:00`);
    data.append("duration", String(Number(duration) || 0));
    data.append("status", status);
    data.append("featured", String(featured));
    if (videoFile) data.append("videoFile", videoFile);
    if (thumbnailFile) data.append("thumbnailFile", thumbnailFile);

    const options = {
      onUploadProgress: (event: { loaded: number; total?: number }) => {
        if (event.total) setProgress(Math.round((event.loaded / event.total) * 100));
      },
    };

    try {
      if (editing && video) {
        await axiosInstance.put(`/admin/videos/${video._id}`, data, options);
      } else {
        await axiosInstance.post("/admin/videos", data, options);
      }
      setProgress(100);
      await Promise.all([fetchAdminVideos(), fetchVideos(), fetchStats()]);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message ?? "Failed to save video");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit video" : "Upload video"}
      className="max-w-3xl border border-white/10 bg-[#161616]"
    >
      <form onSubmit={handleSubmit} className="max-h-[78vh] space-y-6 overflow-y-auto pr-1">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/15 via-[#181818] to-[#181818] p-4">
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-400 text-black">
              <Clapperboard className="size-5" />
            </div>
            <div>
              <p className="font-bold text-white">{editing ? "Update video details" : "Add a video to the library"}</p>
              <p className="mt-0.5 text-xs text-zinc-400">
                Upload a video, add a thumbnail and publish it to the video feed.
              </p>
            </div>
          </div>
        </div>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
            <Sparkles className="size-3.5 text-violet-400" /> Video details
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className={`${labelClass} sm:col-span-2`}>
              Video title <span className="text-violet-400">*</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Live session — Midnight City"
                className={fieldClass}
                required
              />
            </label>

            <label className={labelClass}>
              Creator / channel <span className="text-violet-400">*</span>
              <input
                value={creator}
                onChange={(event) => setCreator(event.target.value)}
                placeholder="Creator or artist name"
                className={fieldClass}
                required
              />
            </label>

            <label className={labelClass}>
              Category
              <select value={category} onChange={(event) => setCategory(event.target.value)} className={fieldClass}>
                {VIDEO_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className={labelClass}>
              Status
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as "published" | "draft")}
                className={fieldClass}
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </label>

            <label className={labelClass}>
              Publish date
              <input type="date" value={publishedAt} onChange={(event) => setPublishedAt(event.target.value)} className={fieldClass} />
            </label>

            <label className={labelClass}>
              Duration (seconds)
              <input
                type="number"
                min="0"
                value={duration}
                onChange={(event) => setDuration(Number(event.target.value))}
                className={fieldClass}
              />
              <span className="mt-1 block text-[11px] font-normal text-zinc-500">
                {duration > 0 ? `Playback length: ${formatDuration(duration)}` : "Auto-detected when you choose a video file"}
              </span>
            </label>

            <label className={labelClass}>
              Tags
              <input
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="live, session, indie"
                className={fieldClass}
              />
              <span className="mt-1 block text-[11px] font-normal text-zinc-500">Separate tags with commas.</span>
            </label>

            <label className={`${labelClass} sm:col-span-2`}>
              Description
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                placeholder="Describe this video..."
                className={`${fieldClass} resize-none`}
              />
            </label>
          </div>

          <label className="flex w-fit cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-[#202020] px-3.5 py-2 text-xs font-semibold text-zinc-300">
            <input
              type="checkbox"
              checked={featured}
              onChange={(event) => setFeatured(event.target.checked)}
              className="size-4 accent-violet-400"
            />
            Feature this video
          </label>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
            <Sparkles className="size-3.5 text-violet-400" /> Media files
          </div>

          <FileDropzone
            label="Video file"
            kind="video"
            file={videoFile}
            onChange={handleVideoSelect}
            existingUrl={video?.videoUrl}
            required={!editing}
            hint={editing ? "Leave empty to keep the current video." : "MP4 or WEBM recommended. Processing starts after upload."}
          />

          <FileDropzone
            label="Thumbnail (optional)"
            kind="image"
            file={thumbnailFile}
            onChange={setThumbnailFile}
            existingUrl={video?.thumbnailUrl}
            hint="Use a 16:9 image. If empty, a poster frame is generated from the video."
          />
        </section>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            {error}
          </div>
        )}

        {loading && (
          <div className="space-y-2 rounded-xl border border-white/10 bg-[#202020] p-3">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
              <span>Uploading to Cloudinary...</span>
              <span>{progress}%</span>
            </div>
            <ProgressBar value={progress} />
          </div>
        )}

        <div className="sticky bottom-0 -mx-1 flex flex-col gap-2 border-t border-white/10 bg-[#161616]/95 px-1 pt-4 backdrop-blur sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className={secondaryButtonClass} disabled={loading}>
            Cancel
          </button>
          <button
            type="submit"
            className={`${primaryButtonClass} bg-violet-400 hover:bg-violet-300`}
            disabled={loading}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Clapperboard className="size-4" />}
            {editing ? "Save changes" : "Publish video"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddVideoModal;
