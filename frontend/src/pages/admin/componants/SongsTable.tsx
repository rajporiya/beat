import { useMemo, useState } from "react";
import { Eye, Loader2, Pencil, PlayCircle, Trash2 } from "lucide-react";
import { useMusicStore } from "@/stores/useMusicStore";
import { axiosInstance } from "@/lib/axios";
import { formatDuration, formatNumber, formatRelativeDate } from "@/lib/media";
import type { Song } from "@/types";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import EditSongModal from "./EditSongModal";
import MediaPreviewModal from "./MediaPreviewModal";
import { EmptyState, Tag } from "./AdminUI";

type SongsTableProps = {
  songs: Song[];
  isFiltered?: boolean;
};

const SongsTable = ({ songs, isFiltered = false }: SongsTableProps) => {
  const { albums, fetchSongs, fetchAlbums, fetchStats, fetchArtists } = useMusicStore();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [songToDelete, setSongToDelete] = useState<Song | null>(null);
  const [songToEdit, setSongToEdit] = useState<Song | null>(null);
  const [songToPreview, setSongToPreview] = useState<Song | null>(null);

  const albumNames = useMemo(() => {
    const map = new Map<string, string>();
    albums.forEach((album) => map.set(album._id, album.title));
    return map;
  }, [albums]);

  const confirmDelete = async () => {
    if (!songToDelete) return;
    setDeletingId(songToDelete._id);
    try {
      await axiosInstance.delete(`/admin/songs/${songToDelete._id}`);
      await Promise.all([fetchSongs(), fetchAlbums(), fetchStats(), fetchArtists()]);
      setSongToDelete(null);
    } catch (error) {
      console.error("Failed to delete song:", error);
    } finally {
      setDeletingId(null);
    }
  };

  if (!songs.length) {
    return (
      <EmptyState
        title={isFiltered ? "No songs match your filters" : "No songs have been added yet"}
        description={
          isFiltered
            ? "Try another search term or clear the artist filter."
            : "Upload audio with cover artwork to start building your catalog."
        }
      />
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.07] text-[11px] uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3 font-semibold">Track</th>
              <th className="px-4 py-3 font-semibold">Album</th>
              <th className="px-4 py-3 font-semibold">Genre</th>
              <th className="px-4 py-3 font-semibold">Duration</th>
              <th className="px-4 py-3 font-semibold">Plays</th>
              <th className="px-4 py-3 font-semibold">Added</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {songs.map((song) => (
              <tr key={song._id} className="group border-b border-white/[0.04] transition-colors last:border-0 hover:bg-white/[0.025]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-[#242424]">
                      {song.imageUrl ? (
                        <img src={song.imageUrl} alt={song.title} className="size-full object-cover" />
                      ) : (
                        <div className="grid size-full place-items-center text-zinc-600">
                          <PlayCircle className="size-5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="max-w-[240px] truncate font-semibold text-white">{song.title}</p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <p className="max-w-[180px] truncate text-xs text-zinc-500">{song.artist || "Unknown artist"}</p>
                        {song.isExplicit && <Tag tone="zinc">E</Tag>}
                        {song.videoUrl && <Tag tone="violet">Video</Tag>}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {song.albumId ? albumNames.get(song.albumId) ?? "Album" : <span className="text-zinc-600">Single</span>}
                </td>
                <td className="px-4 py-3 text-zinc-400">{song.genre || <span className="text-zinc-600">—</span>}</td>
                <td className="px-4 py-3 text-zinc-400">{formatDuration(song.duration)}</td>
                <td className="px-4 py-3 text-zinc-400">{formatNumber(song.plays)}</td>
                <td className="px-4 py-3 text-zinc-500">{formatRelativeDate(song.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setSongToPreview(song)}
                      aria-label={`Preview ${song.title}`}
                      className="grid size-8 place-items-center rounded-full text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <Eye className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSongToEdit(song)}
                      aria-label={`Edit ${song.title}`}
                      className="grid size-8 place-items-center rounded-full text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSongToDelete(song)}
                      aria-label={`Delete ${song.title}`}
                      className="grid size-8 place-items-center rounded-full text-zinc-400 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                      disabled={deletingId === song._id}
                    >
                      {deletingId === song._id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EditSongModal open={songToEdit !== null} onClose={() => setSongToEdit(null)} song={songToEdit} />
      <MediaPreviewModal
        open={songToPreview !== null}
        onClose={() => setSongToPreview(null)}
        title={songToPreview?.title ?? ""}
        subtitle={songToPreview ? `${songToPreview.artist}${songToPreview.albumId ? ` • ${albumNames.get(songToPreview.albumId) ?? "Album"}` : ""}` : ""}
        imageUrl={songToPreview?.imageUrl}
        audioUrl={songToPreview?.audioUrl}
        videoUrl={songToPreview?.videoUrl ?? undefined}
        meta={
          songToPreview && (
            <div className="flex flex-wrap items-center gap-2">
              <Tag tone="green">Song</Tag>
              <span>{formatDuration(songToPreview.duration)}</span>
              <span>•</span>
              <span>{formatNumber(songToPreview.plays)} plays</span>
              {songToPreview.genre && <Tag tone="zinc">{songToPreview.genre}</Tag>}
            </div>
          )
        }
      />
      <ConfirmDeleteModal
        open={songToDelete !== null}
        title={`Delete "${songToDelete?.title}"?`}
        message="This permanently removes the song from the catalog and any album it belongs to."
        loading={deletingId !== null}
        onCancel={() => setSongToDelete(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
};

export default SongsTable;
