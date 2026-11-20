import { Loader2, Music2, Pencil, Sparkles, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import Modal from "@/components/ui/modal";
import { axiosInstance } from "@/lib/axios";
import { useMusicStore } from "@/stores/useMusicStore";
import type { Song } from "@/types";
import { formatDuration, readMediaDuration } from "@/lib/media";
import { ProgressBar, fieldClass, labelClass, primaryButtonClass, secondaryButtonClass } from "./AdminUI";
import FileDropzone from "./FileDropzone";

type EditSongModalProps = {
  open: boolean;
  onClose: () => void;
  song: Song | null;
};

const EditSongModal = ({ open, onClose, song }: EditSongModalProps) => {
  const { albums, artists, fetchSongs, fetchAlbums, fetchStats, fetchArtists } = useMusicStore();

  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [albumId, setAlbumId] = useState("");
  const [genre, setGenre] = useState("");
  const [duration, setDuration] = useState(0);
  const [isExplicit, setIsExplicit] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !song) return;
    setTitle(song.title);
    setArtist(song.artist);
    setAlbumId(song.albumId ?? "");
    setGenre(song.genre ?? "");
    setDuration(song.duration || 0);
    setIsExplicit(Boolean(song.isExplicit));
    setAudioFile(null);
    setImageFile(null);
    setVideoFile(null);
    setLoading(false);
    setProgress(0);
    setError(null);
  }, [open, song]);

  const handleAudioSelect = async (file: File | null) => {
    setAudioFile(file);
    if (!file) return;
    const detected = await readMediaDuration(file);
    if (detected) setDuration(Math.round(detected));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!song) return;
    if (!title.trim() || !artist.trim()) {
      setError("Title and artist are required.");
      return;
    }

    setLoading(true);
    setProgress(0);
    setError(null);

    const data = new FormData();
    data.append("title", title.trim());
    data.append("artist", artist.trim());
    data.append("albumId", albumId);
    data.append("genre", genre.trim());
    data.append("duration", String(Number(duration) || 0));
    data.append("isExplicit", String(isExplicit));
    if (audioFile) data.append("audioFile", audioFile);
    if (imageFile) data.append("imageFile", imageFile);
    if (videoFile) data.append("videoFile", videoFile);

    try {
      await axiosInstance.put(`/admin/songs/${song._id}`, data, {
        onUploadProgress: (event) => {
          if (event.total) setProgress(Math.round((event.loaded / event.total) * 100));
        },
      });
      setProgress(100);
      await Promise.all([fetchSongs(), fetchAlbums(), fetchStats(), fetchArtists()]);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message ?? "Failed to update song");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit song" className="max-w-2xl border border-white/10 bg-[#161616]">
      <form onSubmit={handleSubmit} className="max-h-[78vh] space-y-5 overflow-y-auto pr-1">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <img
            src={song?.imageUrl}
            alt={title}
            className="size-12 rounded-lg object-cover"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">{title || "Untitled track"}</p>
            <p className="truncate text-xs text-zinc-500">
              {artist || "Unknown artist"} • {formatDuration(duration)}
            </p>
          </div>
          <Pencil className="ml-auto size-4 shrink-0 text-zinc-500" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className={`${labelClass} sm:col-span-2`}>
            Song title
            <input value={title} onChange={(event) => setTitle(event.target.value)} className={fieldClass} required />
          </label>

          <label className={labelClass}>
            Artist
            <input value={artist} onChange={(event) => setArtist(event.target.value)} list="edit-song-artists" className={fieldClass} required />
            <datalist id="edit-song-artists">
              {artists.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </label>

          <label className={labelClass}>
            Album
            <select value={albumId} onChange={(event) => setAlbumId(event.target.value)} className={fieldClass}>
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
            <input value={genre} onChange={(event) => setGenre(event.target.value)} placeholder="Pop, Hip-hop..." className={fieldClass} />
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
            <span className="mt-1 block text-[11px] font-normal text-zinc-500">Playback length: {formatDuration(duration)}</span>
          </label>
        </div>

        <label className="flex w-fit cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-[#202020] px-3.5 py-2 text-xs font-semibold text-zinc-300">
          <input type="checkbox" checked={isExplicit} onChange={(event) => setIsExplicit(event.target.checked)} className="size-4 accent-[#1ed760]" />
          Explicit content
        </label>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
            <Sparkles className="size-3.5 text-[#1ed760]" /> Replace media (optional)
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FileDropzone label="Cover artwork" kind="image" file={imageFile} onChange={setImageFile} existingUrl={song?.imageUrl} />
            <FileDropzone label="Audio file" kind="audio" file={audioFile} onChange={handleAudioSelect} existingUrl={song?.audioUrl} />
          </div>
          <FileDropzone label="Preview video" kind="video" file={videoFile} onChange={setVideoFile} existingUrl={song?.videoUrl ?? undefined} />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            {error}
          </div>
        )}

        {loading && (
          <div className="space-y-2 rounded-xl border border-white/10 bg-[#202020] p-3">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
              <span>Saving changes...</span>
              <span>{progress}%</span>
            </div>
            <ProgressBar value={progress} />
          </div>
        )}

        <div className="flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className={secondaryButtonClass} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className={primaryButtonClass} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Music2 className="size-4" />}
            Save changes
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditSongModal;
