import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ListMusic, Pause, Pencil, Play, Shuffle, Trash2 } from "lucide-react";
import CreatePlaylistModal from "@/components/CreatePlaylistModal";
import SongRow from "@/components/music/SongRow";
import { ScrollArea } from "@/components/ui/scroll-area";
import { axiosInstance } from "@/lib/axios";
import { formatTotalDuration, songCountLabel } from "@/lib/music";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePlaylistStore } from "@/stores/usePlaylistStore";
import { usePlayStore } from "@/stores/usePlayerStore";
import type { PlaylistDetail } from "@/types";

export default function PlaylistPage() {
  const { playlistId } = useParams<{ playlistId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { fetchMyPlaylists, deletePlaylist } = usePlaylistStore();
  const playerAlbum = usePlayStore((state) => state.playerAlbum);
  const currentSong = usePlayStore((state) => state.currentSong);
  const isPlaying = usePlayStore((state) => state.isPlaying);
  const togglePlay = usePlayStore((state) => state.togglePlay);
  const setShuffle = usePlayStore((state) => state.setShuffle);
  const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null);
  const [isMissing, setIsMissing] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadPlaylist = async (id: string) => {
    try {
      const res = await axiosInstance.get(`/v1/playlists/${id}`);
      setPlaylist(res.data.data);
      setIsMissing(false);
    } catch {
      setPlaylist(null);
      setIsMissing(true);
    }
  };

  useEffect(() => {
    if (!playlistId) return;
    setPlaylist(null);
    setIsMissing(false);
    void loadPlaylist(playlistId);
  }, [playlistId]);

  if (!playlist) {
    return (
      <div className="grid h-full place-items-center p-6 text-center text-zinc-400">
        {isMissing ? "This playlist doesn't exist or is private." : "Loading playlist..."}
      </div>
    );
  }

  const songs = playlist.songs;
  const isOwner = Boolean(user && playlist.owner && playlist.owner._id === user._id);
  const isCurrentPlaylist = Boolean(currentSong && songs.some((song) => song._id === currentSong._id));
  const cover = playlist.coverImage || songs[0]?.imageUrl || "";
  const totalSeconds = songs.reduce((sum, song) => sum + (song.duration || 0), 0);

  const handlePlayAll = () => {
    if (songs.length === 0) return;
    if (isCurrentPlaylist) {
      togglePlay();
      return;
    }
    playerAlbum(songs, 0);
  };

  const handleShuffle = () => {
    if (songs.length === 0) return;
    setShuffle(true);
    playerAlbum(songs, Math.floor(Math.random() * songs.length));
  };

  const handleRemove = async (songId: string) => {
    setActionError(null);
    try {
      await axiosInstance.delete(`/v1/playlists/${playlist._id}/songs/${songId}`);
      setPlaylist({ ...playlist, songs: playlist.songs.filter((song) => song._id !== songId) });
      void fetchMyPlaylists();
    } catch {
      setActionError("Could not remove that song. Please try again.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${playlist.name}"? This can't be undone.`)) return;
    try {
      await deletePlaylist(playlist._id);
      navigate("/library");
    } catch {
      setActionError("Could not delete this playlist. Please try again.");
    }
  };

  return (
    <ScrollArea className="h-full">
      <main className="min-h-full bg-gradient-to-b from-[#2b3a4d] via-[#121212] to-[#121212] p-5 sm:p-8">
        <header className="flex flex-col items-start gap-5 pb-6 sm:flex-row sm:items-end">
          <div className="grid size-48 shrink-0 place-items-center overflow-hidden rounded-md bg-[#242424] shadow-2xl sm:size-56">
            {cover ? (
              <img
                src={cover}
                alt=""
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
                className="size-full object-cover"
              />
            ) : (
              <ListMusic className="size-16 text-zinc-500" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              {playlist.isPublic ? "Public playlist" : "Private playlist"}
            </p>
            <h1 className="mt-2 break-words text-4xl font-black sm:text-6xl">{playlist.name}</h1>
            {playlist.description && (
              <p className="mt-3 max-w-2xl text-sm text-zinc-300">{playlist.description}</p>
            )}
            <p className="mt-4 text-sm text-zinc-300">
              <span className="font-semibold text-white">{playlist.owner?.fullName ?? "BeatMusic"}</span>
              {` • ${songCountLabel(songs.length)}`}
              {songs.length > 0 && ` • ${formatTotalDuration(totalSeconds)}`}
            </p>
          </div>
        </header>

        <div className="flex items-center gap-4 pb-6">
          <button
            type="button"
            aria-label={isCurrentPlaylist && isPlaying ? "Pause playlist" : "Play playlist"}
            onClick={handlePlayAll}
            disabled={songs.length === 0}
            className="grid size-14 place-items-center rounded-full bg-[#1ed760] text-black shadow-xl transition-transform hover:scale-105 disabled:opacity-40"
          >
            {isCurrentPlaylist && isPlaying ? (
              <Pause className="size-6 fill-black" />
            ) : (
              <Play className="ml-1 size-6 fill-black" />
            )}
          </button>
          <button
            type="button"
            aria-label="Shuffle play"
            title="Shuffle play"
            onClick={handleShuffle}
            disabled={songs.length === 0}
            className="grid size-10 place-items-center rounded-full text-zinc-400 hover:text-white disabled:opacity-40"
          >
            <Shuffle className="size-6" />
          </button>
          {isOwner && (
            <>
              <button
                type="button"
                onClick={() => setIsEditOpen(true)}
                className="flex items-center gap-2 rounded-full border border-zinc-500 px-4 py-1.5 text-sm font-bold hover:border-white"
              >
                <Pencil className="size-4" />
                Edit details
              </button>
              <button
                type="button"
                aria-label="Delete playlist"
                title="Delete playlist"
                onClick={handleDelete}
                className="grid size-9 place-items-center rounded-full text-zinc-400 hover:text-red-400"
              >
                <Trash2 className="size-5" />
              </button>
            </>
          )}
        </div>

        {actionError && <p className="mb-4 text-sm text-red-400">{actionError}</p>}

        {songs.length === 0 ? (
          <p className="py-16 text-center text-zinc-400">
            This playlist is empty. Use “Add to playlist” on any song to start building it.
          </p>
        ) : (
          <div className="space-y-1">
            {songs.map((song, index) => (
              <SongRow
                key={song._id}
                song={song}
                index={index + 1}
                onPlay={() => playerAlbum(songs, index)}
                onRemove={isOwner ? () => handleRemove(song._id) : undefined}
              />
            ))}
          </div>
        )}
      </main>

      {isOwner && (
        <CreatePlaylistModal
          open={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          playlist={playlist}
          onSaved={() => {
            void loadPlaylist(playlist._id);
          }}
        />
      )}
    </ScrollArea>
  );
}
