import { Loader2, ListMusic, Plus, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CreatePlaylistModal from "@/components/CreatePlaylistModal";
import Modal from "@/components/ui/modal";
import { axiosInstance } from "@/lib/axios";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePlaylistStore } from "@/stores/usePlaylistStore";
import type { Song } from "@/types";

type AddToPlaylistModalProps = {
  song: Song | null;
  onClose: () => void;
};

/**
 * AddToPlaylistModal lets the user pick one of their own playlists (or create a new one) for a song.
 * Uses the /api/v1 playlist endpoints (GET /playlists?mine=true, POST /playlists/:id/songs).
 */
const AddToPlaylistModal = ({ song, onClose }: AddToPlaylistModalProps) => {
  const { myPlaylists, fetchMyPlaylists } = usePlaylistStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    if (!song || !user) return;
    let cancelled = false;
    setAddedId(null);
    setError(null);
    setIsLoading(true);
    fetchMyPlaylists().finally(() => {
      if (!cancelled) setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [song, user, fetchMyPlaylists]);

  if (!song) return null;

  const addSongTo = async (playlistId: string) => {
    setIsAdding(playlistId);
    setError(null);
    try {
      await axiosInstance.post(`/v1/playlists/${playlistId}/songs`, { songId: song._id });
      setAddedId(playlistId);
      void fetchMyPlaylists();
      setTimeout(() => onClose(), 700);
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Failed to add song to playlist");
    } finally {
      setIsAdding(null);
    }
  };

  return (
    <>
      <Modal open={Boolean(song)} onClose={onClose} title="Add to playlist">
        <p className="mb-4 truncate text-sm text-zinc-400">
          Choose a playlist for <span className="font-semibold text-white">“{song.title}”</span>
        </p>

        {!user ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <ListMusic className="size-8 text-zinc-500" />
            <div>
              <p className="text-sm font-semibold text-white">Log in to save this song</p>
              <p className="mt-1 text-xs text-zinc-400">Create playlists and add songs from any page.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate("/login");
              }}
              className="rounded-full bg-white px-4 py-2 text-xs font-bold text-black hover:scale-[1.02]"
            >
              Log in
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="mb-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              <span className="grid size-8 place-items-center rounded bg-[#242424]">
                <Plus className="size-4" />
              </span>
              New playlist
            </button>

            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-zinc-400">
                <Loader2 className="size-4 animate-spin" /> Loading playlists...
              </div>
            ) : myPlaylists.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <ListMusic className="size-8 text-zinc-500" />
                <p className="text-sm text-zinc-400">You don&apos;t have any playlists yet. Create one above.</p>
              </div>
            ) : (
              <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                {myPlaylists.map((playlist) => {
                  const isAdded = addedId === playlist._id;
                  const isBusy = isAdding === playlist._id;
                  const alreadyIn = playlist.songs.some((item) => item._id === song._id);
                  return (
                    <button
                      key={playlist._id}
                      type="button"
                      onClick={() => addSongTo(playlist._id)}
                      disabled={isBusy || Boolean(addedId) || alreadyIn}
                      className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                        isAdded ? "bg-[#22c55e]/15 text-[#22c55e]" : "text-zinc-200 hover:bg-white/10"
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
                      ) : alreadyIn ? (
                        <span className="shrink-0 text-xs text-zinc-400">Already added</span>
                      ) : (
                        <Plus className="size-4 shrink-0 text-zinc-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            {error}
          </div>
        )}
      </Modal>

      {user && (
        <CreatePlaylistModal
          open={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSaved={(created) => {
            void addSongTo(created._id);
          }}
        />
      )}
    </>
  );
};

export default AddToPlaylistModal;
