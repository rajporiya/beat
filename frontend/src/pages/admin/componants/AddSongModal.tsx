import { Loader2, Music, Sparkles, TriangleAlert, UploadCloud } from "lucide-react";
import { useEffect, useState } from "react";
import Modal from "@/components/ui/modal";
import { axiosInstance } from "@/lib/axios";
import { useMusicStore } from "@/stores/useMusicStore";
import type { Album } from "@/types";
import { formatDuration, readMediaDuration } from "@/lib/media";
import { ProgressBar, fieldClass, labelClass, primaryButtonClass, secondaryButtonClass } from "./AdminUI";
import FileDropzone from "./FileDropzone";

type AddSongModalProps = {
  open: boolean;
  onClose: () => void;
  albums: Album[];
  defaultAlbumId?: string;
};

const AddSongModal = ({ open, onClose, albums, defaultAlbumId }: AddSongModalProps) => {
  const { fetchSongs, fetchAlbums, fetchStats, fetchArtists, artists } = useMusicStore();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [artistChoice, setArtistChoice] = useState("");
  const [newArtist, setNewArtist] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [duration, setDuration] = useState(0);
  const [genre, setGenre] = useState("");

  const isNewArtist = artistChoice === "__new__";
  const artist = isNewArtist ? newArtist.trim() : artistChoice;

  useEffect(() => {
    if (!open) return;
    setError(null);
    setProgress(0);
    setArtistChoice("");
    setNewArtist("");
    setAudioFile(null);
    setImageFile(null);
    setVideoFile(null);
    setDuration(0);
    setGenre("");
  }, [open]);

  const handleAudioSelect = async (file: File | null) => {
    setAudioFile(file);
    if (!file) return;
    const detected = await readMediaDuration(file);
    if (detected) setDuration(Math.round(detected));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();

    if (!title || !artist) {
      setError("Title and artist are required.");
      return;
    }
    if (!audioFile || !imageFile) {
      setError("Please select both a song file and a cover image.");
      return;
    }

    setLoading(true);
    setProgress(0);

    const data = new FormData();
    data.append("title", title);
    data.append("artist", artist);
    data.append("duration", String(duration));
    data.append("albumId", String(formData.get("albumId") ?? ""));
    data.append("genre", genre.trim());
    data.append("isExplicit", String(formData.get("isExplicit") === "on"));
    data.append("audioFile", audioFile);
    data.append("imageFile", imageFile);
    if (videoFile) data.append("videoFile", videoFile);

    try {
      await axiosInstance.post("/admin/songs", data, {
        onUploadProgress: (event) => {
          if (event.total) setProgress(Math.round((event.loaded / event.total) * 100));
        },
      });
      setProgress(100);
      await Promise.all([fetchSongs(), fetchAlbums(), fetchStats(), fetchArtists()]);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message ?? "Failed to create song");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Upload a song" className="max-w-3xl border border-white/10 bg-[#161616]">
      <form onSubmit={handleSubmit} className="max-h-[78vh] space-y-6 overflow-y-auto pr-1">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/12 via-[#181818] to-[#181818] p-4">
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#1ed760] text-black">
              <Music className="size-5" />
            </div>
            <div>
              <p className="font-bold text-white">Add audio to the catalog</p>
              <p className="mt-0.5 text-xs text-zinc-400">
                Upload the track, cover art and an optional video preview for artwork hover.
              </p>
            </div>
          </div>
        </div>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
            <Sparkles className="size-3.5 text-[#1ed760]" /> Track details
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className={`${labelClass} sm:col-span-2`}>
              Song title <span className="text-[#1ed760]">*</span>
              <input name="title" placeholder="e.g. Midnight Drive" className={fieldClass} required />
            </label>

            <label className={labelClass}>
              Artist <span className="text-[#1ed760]">*</span>
              <select value={artistChoice} onChange={(event) => setArtistChoice(event.target.value)} className={fieldClass} required={!isNewArtist}>
                <option value="">Select artist</option>
                {artists.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
                <option value="__new__">+ New artist...</option>
              </select>
            </label>

            {isNewArtist && (
              <label className={labelClass}>
                New artist name <span className="text-[#1ed760]">*</span>
                <input
                  value={newArtist}
                  onChange={(event) => setNewArtist(event.target.value)}
                  placeholder="Artist name"
                  className={fieldClass}
                  required
                />
              </label>
            )}

            <label className={labelClass}>
              Album
              <select name="albumId" className={fieldClass} defaultValue={defaultAlbumId ?? ""}>
                <option value="">No album (single)</option>
                {albums.map((album) => (
                  <option key={album._id} value={album._id}>
                    {album.title}
                  </option>
                ))}
              </select>
            </label>

            <label className={labelClass}>
              Genre
              <input
                value={genre}
                onChange={(event) => setGenre(event.target.value)}
                placeholder="Pop, Hip-hop, Lo-fi..."
                className={fieldClass}
              />
            </label>

            <label className={labelClass}>
              Detected duration
              <input
                value={duration > 0 ? `${formatDuration(duration)} (${duration}s)` : "Waiting for audio file..."}
                readOnly
                className={`${fieldClass} cursor-default text-zinc-400`}
              />
            </label>
          </div>

          <label className="flex w-fit cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-[#202020] px-3.5 py-2 text-xs font-semibold text-zinc-300">
            <input type="checkbox" name="isExplicit" className="size-4 accent-[#1ed760]" />
            Explicit content
          </label>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
            <Sparkles className="size-3.5 text-[#1ed760]" /> Media files
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FileDropzone
              label="Cover artwork"
              kind="image"
              file={imageFile}
              onChange={setImageFile}
              required
              hint="Square cover art is used across the player and library."
            />
            <FileDropzone
              label="Song audio"
              kind="audio"
              file={audioFile}
              onChange={handleAudioSelect}
              required
              hint="Duration is detected automatically."
            />
          </div>

          <FileDropzone
            label="Preview video (optional)"
            kind="video"
            file={videoFile}
            onChange={setVideoFile}
            hint="Plays muted when someone hovers the song artwork."
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
          <button type="submit" className={primaryButtonClass} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
            Upload song
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddSongModal;
