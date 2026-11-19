import { Loader2, ListMusic, Plus, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import Modal from "@/components/ui/modal";
import { axiosInstance } from "@/lib/axios";
import type { Song } from "@/types";

type AddToPlaylistModalProps = {
  song: Song | null;
  onClose: () => void;
};

type PlaylistSummary = {
  _id: string;
  name: string;
  owner?: { _id?: string; fullName?: string; imageUrl?: string } | string;
  songs?: unknown[];
};

/**
 * AddToPlaylistModal — lets the user pick one of their playlists to add a song to.
 * Uses the /api/v1 playlist endpoints (GET /playlists, POST /playlists/:id/songs).
 */
const AddToPlaylistModal = ({ song, onClose }: AddToPlaylistModalProps) => {
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    if (!song) return;
    let cancelled = false;
    setPlaylists([]);
    setAddedId(null);
    setError(null);
    setIsLoading(true);
    axiosInstance
      .get("/v1/playlists")
      .then((res) => {
        if (cancelled) return;
        // /v1 endpoints wrap responses as { success, message, data }
        const data = res.data?.data ?? res.data;
        setPlaylists(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err.response?.data?.message ??
            err.message ??
            "Failed to load playlists"
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [song]);

  if (!song) return null;

  const handleAdd = async (playlistId: string) => {
    setIsAdding(playlistId);
    setError(null);
    try {
      await axiosInstance.post(`/v1/playlists/${playlistId}/songs`, {
        songId: song._id,
      });
      setAddedId(playlistId);
      setTimeout(() => onClose(), 700);
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Failed to add song to playlist");
    } finally {
      setIsAdding(null);
    }
  };

  return (
    <Modal open={Boolean(song)} onClose={onClose} title="Add to playlist">
      <p className="mb-4 truncate text-sm text-zinc-400">
        Choose a playlist for{" "}
        <span className="font-semibold text-white">“{song.title}”</span>
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-zinc-400">
          <Loader2 className="size-4 animate-spin" /> Loading playlists...
        </div>
      ) : playlists.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <ListMusic className="size-8 text-zinc-500" />
          <p className="text-sm text-zinc-400">
            No playlists found. Create one first from the sidebar.
          </p>
        </div>
      ) : (
        <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
          {playlists.map((playlist) => {
            const isAdded = addedId === playlist._id;
            const isBusy = isAdding === playlist._id;
            return (
              <button
                key={playlist._id}
                type="button"
                onClick={() => handleAdd(playlist._id)}
                disabled={isBusy || Boolean(addedId)}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  isAdded
                    ? "bg-[#22c55e]/15 text-[#22c55e]"
                    : "text-zinc-200 hover:bg-white/10"
                } disabled:opacity-70`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <ListMusic className="size-4 shrink-0 text-zinc-400" />
                  <span className="truncate font-medium">{playlist.name}</span>
                </span>
                {isBusy ? (
                  <Loader2 className="size-4 shrink-0 animate-spin text-zinc-400" />
                ) : isAdded ? (
                  <span className="shrink-0 text-xs font-bold">Added ✓</span>
                ) : (
                  <Plus className="size-4 shrink-0 text-zinc-400" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      )}
    </Modal>
  );
};

export default AddToPlaylistModal;
