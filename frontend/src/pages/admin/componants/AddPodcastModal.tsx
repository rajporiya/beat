import { Loader2, Podcast as PodcastIcon, Sparkles, TriangleAlert, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";
import Modal from "@/components/ui/modal";
import { axiosInstance } from "@/lib/axios";
import { useMusicStore } from "@/stores/useMusicStore";
import type { Podcast } from "@/types";
import { PODCAST_CATEGORIES, formatDuration, readMediaDuration } from "@/lib/media";
import { ProgressBar, fieldClass, labelClass, primaryButtonClass, secondaryButtonClass } from "./AdminUI";
import FileDropzone from "./FileDropzone";

type AddPodcastModalProps = {
  open: boolean;
  onClose: () => void;
  podcast?: Podcast | null;
};

const toDateInput = (value?: string) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
};

const AddPodcastModal = ({ open, onClose, podcast }: AddPodcastModalProps) => {
  const { fetchAdminPodcasts, fetchPodcasts, fetchStats } = useMusicStore();
  const editing = Boolean(podcast);

  const [title, setTitle] = useState("");
  const [showName, setShowName] = useState("");
  const [host, setHost] = useState("");
  const [category, setCategory] = useState("Talk");
  const [description, setDescription] = useState("");
  const [episodeNumber, setEpisodeNumber] = useState("0");
  const [season, setSeason] = useState("1");
  const [publishDate, setPublishDate] = useState(toDateInput());
  const [duration, setDuration] = useState(0);
  const [status, setStatus] = useState<"published" | "draft">("published");
  const [featured, setFeatured] = useState(false);
  const [isExplicit, setIsExplicit] = useState(false);

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(podcast?.title ?? "");
    setShowName(podcast?.showName ?? "");
    setHost(podcast?.host ?? "");
    setCategory(podcast?.category || "Talk");
    setDescription(podcast?.description ?? "");
    setEpisodeNumber(String(podcast?.episodeNumber ?? 0));
    setSeason(String(podcast?.season ?? 1));
    setPublishDate(toDateInput(podcast?.publishDate));
    setDuration(podcast?.duration ?? 0);
    setStatus(podcast?.status ?? "published");
    setFeatured(Boolean(podcast?.featured));
    setIsExplicit(Boolean(podcast?.isExplicit));

    setCoverFile(null);
    setAudioFile(null);
    setVideoFile(null);
    setThumbnailFile(null);
    setProgress(0);
    setError(null);
  }, [open, podcast]);

  const handleAudioSelect = async (file: File | null) => {
    setAudioFile(file);
    if (!file) return;
    const detected = await readMediaDuration(file);
    if (detected) setDuration(Math.round(detected));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!title.trim() || !showName.trim()) {
      setError("Episode title and show name are required.");
      return;
    }
    if (!editing && !audioFile) {
      setError("Please upload the podcast audio file.");
      return;
    }

    setLoading(true);
    setProgress(0);

    const data = new FormData();
    data.append("title", title.trim());
    data.append("showName", showName.trim());
    data.append("host", host.trim());
    data.append("category", category);
    data.append("description", description.trim());
    data.append("episodeNumber", String(Number(episodeNumber) || 0));
    data.append("season", String(Number(season) || 1));
    data.append("publishDate", `${publishDate}T12:00:00`);
    data.append("duration", String(Number(duration) || 0));
    data.append("status", status);
    data.append("featured", String(featured));
    data.append("isExplicit", String(isExplicit));

    if (coverFile) data.append("coverFile", coverFile);
    if (audioFile) data.append("audioFile", audioFile);
    if (videoFile) data.append("videoFile", videoFile);
    if (thumbnailFile) data.append("thumbnailFile", thumbnailFile);

    try {
      if (editing && podcast) {
        await axiosInstance.put(`/admin/podcasts/${podcast._id}`, data, {
          onUploadProgress: (event) => {
            if (event.total) setProgress(Math.round((event.loaded / event.total) * 100));
          },
        });
      } else {
        await axiosInstance.post("/admin/podcasts", data, {
          onUploadProgress: (event) => {
            if (event.total) setProgress(Math.round((event.loaded / event.total) * 100));
          },
        });
      }
      setProgress(100);
      await Promise.all([fetchAdminPodcasts(), fetchPodcasts(), fetchStats()]);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message ?? "Failed to save podcast");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit podcast episode" : "Upload podcast episode"}
      className="max-w-3xl border border-white/10 bg-[#161616]"
    >
      <form onSubmit={handleSubmit} className="max-h-[78vh] space-y-6 overflow-y-auto pr-1">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#1ed760]/10 via-[#181818] to-[#181818] p-4">
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#1ed760] text-black">
              <PodcastIcon className="size-5" />
            </div>
            <div>
              <p className="font-bold text-white">{editing ? "Update episode details" : "Publish a new episode"}</p>
              <p className="mt-0.5 text-xs text-zinc-400">
                Upload the audio, add cover artwork and optionally attach the video version.
              </p>
            </div>
          </div>
        </div>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
            <Sparkles className="size-3.5 text-[#1ed760]" /> Episode details
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className={`${labelClass} sm:col-span-2`}>
              Episode title <span className="text-[#1ed760]">*</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Building a creator business from scratch"
                className={fieldClass}
                required
              />
            </label>

            <label className={labelClass}>
              Show name <span className="text-[#1ed760]">*</span>
              <input
                value={showName}
                onChange={(event) => setShowName(event.target.value)}
                placeholder="e.g. The Creator Show"
                className={fieldClass}
                required
              />
            </label>

            <label className={labelClass}>
              Host
              <input value={host} onChange={(event) => setHost(event.target.value)} placeholder="Host name" className={fieldClass} />
            </label>

            <label className={labelClass}>
              Category
              <select value={category} onChange={(event) => setCategory(event.target.value)} className={fieldClass}>
                {PODCAST_CATEGORIES.map((item) => (
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
              Season
              <input
                type="number"
                min="0"
                value={season}
                onChange={(event) => setSeason(event.target.value)}
                className={fieldClass}
              />
            </label>

            <label className={labelClass}>
              Episode number
              <input
                type="number"
                min="0"
                value={episodeNumber}
                onChange={(event) => setEpisodeNumber(event.target.value)}
                className={fieldClass}
              />
            </label>

            <label className={labelClass}>
              Publish date
              <input
                type="date"
                value={publishDate}
                onChange={(event) => setPublishDate(event.target.value)}
                className={fieldClass}
              />
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
                {duration > 0 ? `Playback length: ${formatDuration(duration)}` : "Auto-detected when you choose an audio file"}
              </span>
            </label>

            <label className={`${labelClass} sm:col-span-2`}>
              Description
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What is this episode about?"
                rows={3}
                className={`${fieldClass} resize-none`}
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-[#202020] px-3.5 py-2 text-xs font-semibold text-zinc-300">
              <input
                type="checkbox"
                checked={featured}
                onChange={(event) => setFeatured(event.target.checked)}
                className="size-4 accent-[#1ed760]"
              />
              <Wand2 className="size-3.5 text-[#1ed760]" /> Feature this episode
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-[#202020] px-3.5 py-2 text-xs font-semibold text-zinc-300">
              <input
                type="checkbox"
                checked={isExplicit}
                onChange={(event) => setIsExplicit(event.target.checked)}
                className="size-4 accent-[#1ed760]"
              />
              Explicit content
            </label>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
            <Sparkles className="size-3.5 text-[#1ed760]" /> Media files
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FileDropzone
              label="Cover artwork"
              kind="image"
              file={coverFile}
              onChange={setCoverFile}
              existingUrl={podcast?.coverUrl}
              hint="Square artwork works best. Shown on the podcast card."
            />
            <FileDropzone
              label="Podcast audio"
              kind="audio"
              file={audioFile}
              onChange={handleAudioSelect}
              existingUrl={podcast?.audioUrl}
              required={!editing}
              hint={editing ? "Leave empty to keep the current audio." : "MP3 or WAV recommended."}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FileDropzone
              label="Video version (optional)"
              kind="video"
              file={videoFile}
              onChange={setVideoFile}
              existingUrl={podcast?.videoUrl}
              hint="Adds a video player and makes this a video episode."
            />
            <FileDropzone
              label="Video thumbnail (optional)"
              kind="image"
              file={thumbnailFile}
              onChange={setThumbnailFile}
              existingUrl={podcast?.videoThumbnailUrl}
              hint="Leave empty to use a poster frame from the video automatically."
            />
          </div>
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
          <button type="submit" className={primaryButtonClass} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <PodcastIcon className="size-4" />}
            {editing ? "Save changes" : "Publish episode"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddPodcastModal;
