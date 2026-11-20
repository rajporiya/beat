import { Disc3, Loader2, Sparkles, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import Modal from "@/components/ui/modal";
import { axiosInstance } from "@/lib/axios";
import { useMusicStore } from "@/stores/useMusicStore";
import { ProgressBar, fieldClass, labelClass, primaryButtonClass, secondaryButtonClass } from "./AdminUI";
import FileDropzone from "./FileDropzone";

type AddAlbumModalProps = {
  open: boolean;
  onClose: () => void;
};

const AddAlbumModal = ({ open, onClose }: AddAlbumModalProps) => {
  const { fetchAlbums, fetchStats, fetchArtists, artists } = useMusicStore();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setProgress(0);
    setCoverFile(null);
  }, [open]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const artist = String(formData.get("artist") ?? "").trim();
    const releaseYear = String(formData.get("releaseYear") ?? new Date().getFullYear());

    if (!title || !artist) {
      setError("Title and artist are required.");
      return;
    }

    setLoading(true);
    setProgress(0);

    const data = new FormData();
    data.append("title", title);
    data.append("artist", artist);
    data.append("releaseYear", releaseYear);
    if (coverFile) data.append("imageFile", coverFile);

    try {
      await axiosInstance.post("/admin/albums", data, {
        onUploadProgress: (event) => {
          if (event.total) setProgress(Math.round((event.loaded / event.total) * 100));
        },
      });
      setProgress(100);
      await Promise.all([fetchAlbums(), fetchStats(), fetchArtists()]);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message ?? "Failed to create album");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create an album" className="max-w-2xl border border-white/10 bg-[#161616]">
      <form onSubmit={handleSubmit} className="max-h-[78vh] space-y-6 overflow-y-auto pr-1">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-amber-400/12 via-[#181818] to-[#181818] p-4">
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-300 text-black">
              <Disc3 className="size-5" />
            </div>
            <div>
              <p className="font-bold text-white">Create a new release</p>
              <p className="mt-0.5 text-xs text-zinc-400">
                Add the album details, then attach songs from the album manager.
              </p>
            </div>
          </div>
        </div>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
            <Sparkles className="size-3.5 text-amber-300" /> Album details
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className={`${labelClass} sm:col-span-2`}>
              Album title <span className="text-amber-300">*</span>
              <input name="title" placeholder="Album title" className={fieldClass} required />
            </label>

            <label className={labelClass}>
              Artist <span className="text-amber-300">*</span>
              <input name="artist" list="album-artists" placeholder="Artist name" className={fieldClass} required />
              <datalist id="album-artists">
                {artists.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </label>

            <label className={labelClass}>
              Release year
              <input
                name="releaseYear"
                type="number"
                min="1900"
                max="2100"
                defaultValue={new Date().getFullYear()}
                className={fieldClass}
              />
            </label>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
            <Sparkles className="size-3.5 text-amber-300" /> Cover artwork
          </div>
          <FileDropzone label="Album cover" kind="image" file={coverFile} onChange={setCoverFile} hint="Square artwork works best." />
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
              <span>Uploading artwork...</span>
              <span>{progress}%</span>
            </div>
            <ProgressBar value={progress} />
          </div>
        )}

        <div className="sticky bottom-0 -mx-1 flex flex-col gap-2 border-t border-white/10 bg-[#161616]/95 px-1 pt-4 backdrop-blur sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className={secondaryButtonClass} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className={`${primaryButtonClass} bg-amber-300 hover:bg-amber-200`} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Disc3 className="size-4" />}
            Create album
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddAlbumModal;
