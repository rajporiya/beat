import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock3, Heart, Pause, Play, Shuffle } from "lucide-react";
import SongRow from "@/components/music/SongRow";
import { ScrollArea } from "@/components/ui/scroll-area";
import { axiosInstance } from "@/lib/axios";
import { formatTotalDuration, songCountLabel } from "@/lib/music";
import { useAuthStore } from "@/stores/useAuthStore";
import { useLikedSongsStore } from "@/stores/useLikedSongsStore";
import { usePlayStore } from "@/stores/usePlayerStore";
import type { Song } from "@/types";

type HistoryEntry = { song: Song | null; playedAt: string };

const formatPlayedAt = (value: string) =>
  `Played ${new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;

export default function CollectionPage({ type }: { type: "liked" | "recent" }) {
  const liked = type === "liked";
  const { user } = useAuthStore();
  const likedSongs = useLikedSongsStore((state) => state.likedSongs);
  const [history, setHistory] = useState<Array<{ song: Song; playedAt: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const playerAlbum = usePlayStore((state) => state.playerAlbum);
  const currentSong = usePlayStore((state) => state.currentSong);
  const isPlaying = usePlayStore((state) => state.isPlaying);
  const togglePlay = usePlayStore((state) => state.togglePlay);
  const setShuffle = usePlayStore((state) => state.setShuffle);

  useEffect(() => {
    if (liked || !user) return;
    let cancelled = false;
    setIsLoading(true);
    axiosInstance
      .get("/v1/library/recently-played")
      .then((res) => {
        if (cancelled) return;
        const entries: HistoryEntry[] = Array.isArray(res.data?.data) ? res.data.data : [];
        setHistory(
          entries
            .filter((entry): entry is { song: Song; playedAt: string } => Boolean(entry.song))
            .map((entry) => ({ song: entry.song, playedAt: entry.playedAt })),
        );
      })
      .catch(() => {
        if (!cancelled) setHistory([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [liked, user]);

  const songs = liked ? likedSongs : history.map((entry) => entry.song);
  const isCurrentCollection = Boolean(currentSong && songs.some((song) => song._id === currentSong._id));
  const totalSeconds = songs.reduce((sum, song) => sum + (song.duration || 0), 0);
  const title = liked ? "Liked Songs" : "Recently Played";

  const handlePlay = () => {
    if (songs.length === 0) return;
    if (isCurrentCollection) {
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

  return (
    <ScrollArea className="h-full">
      <main className="min-h-full bg-gradient-to-b from-[#33205c] via-[#121212] to-[#121212] p-5 sm:p-8">
        <header className="flex flex-col items-start gap-5 pb-6 sm:flex-row sm:items-end">
          <div className="grid size-48 shrink-0 place-items-center rounded-md bg-gradient-to-br from-violet-500 to-blue-300 shadow-xl sm:size-56">
            {liked ? <Heart className="size-20 fill-white text-white" /> : <Clock3 className="size-20 text-white" />}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-300">Playlist</p>
            <h1 className="mt-2 text-4xl font-black sm:text-6xl">{title}</h1>
            <p className="mt-4 text-sm text-zinc-300">
              <span className="font-semibold text-white">{user?.fullName ?? "BeatMusic"}</span>
              {` • ${songCountLabel(songs.length)}`}
              {songs.length > 0 && ` • ${formatTotalDuration(totalSeconds)}`}
            </p>
          </div>
        </header>

        {!user ? (
          <div className="py-16 text-center">
            <p className="text-zinc-300">Log in to see your {title.toLowerCase()}.</p>
            <Link
              to="/login"
              className="mt-4 inline-block rounded-full bg-white px-5 py-2 text-sm font-bold text-black hover:scale-[1.02]"
            >
              Log in
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 pb-6">
              <button
                type="button"
                aria-label={isCurrentCollection && isPlaying ? "Pause" : "Play"}
                onClick={handlePlay}
                disabled={songs.length === 0}
                className="grid size-14 place-items-center rounded-full bg-[#1ed760] text-black shadow-xl transition-transform hover:scale-105 disabled:opacity-40"
              >
                {isCurrentCollection && isPlaying ? (
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
            </div>

            {isLoading && songs.length === 0 ? (
              <p className="py-16 text-center text-zinc-400">Loading...</p>
            ) : songs.length === 0 ? (
              <p className="py-16 text-center text-zinc-400">
                {liked ? "Songs you like will appear here." : "Songs you play will show up here."}
              </p>
            ) : (
              <div className="space-y-1">
                {songs.map((song, index) => (
                  <SongRow
                    key={song._id}
                    song={song}
                    index={index + 1}
                    secondary={liked ? undefined : formatPlayedAt(history[index].playedAt)}
                    onPlay={() => playerAlbum(songs, index)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </ScrollArea>
  );
}
