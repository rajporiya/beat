import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Mic2, Pause, Play } from "lucide-react";
import SongRow from "@/components/music/SongRow";
import { ScrollArea } from "@/components/ui/scroll-area";
import { axiosInstance } from "@/lib/axios";
import { formatTotalDuration, songCountLabel } from "@/lib/music";
import { useAuthStore } from "@/stores/useAuthStore";
import { useFollowStore } from "@/stores/useFollowStore";
import { usePlayStore } from "@/stores/usePlayerStore";
import type { Song } from "@/types";

export default function ArtistPage() {
  const { artistId } = useParams<{ artistId: string }>();
  const name = artistId ?? "";
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isFollowing = useFollowStore((state) => state.artists.includes(name));
  const toggleFollow = useFollowStore((state) => state.toggleFollow);
  const playerAlbum = usePlayStore((state) => state.playerAlbum);
  const currentSong = usePlayStore((state) => state.currentSong);
  const isPlaying = usePlayStore((state) => state.isPlaying);
  const togglePlay = usePlayStore((state) => state.togglePlay);
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!name) return;
    let cancelled = false;
    setIsLoading(true);
    axiosInstance
      .get("/v1/songs", { params: { artist: name, limit: 100 } })
      .then((res) => {
        if (cancelled) return;
        const items: Song[] = Array.isArray(res.data?.data) ? res.data.data : [];
        setSongs([...items].sort((a, b) => (b.plays ?? 0) - (a.plays ?? 0)));
      })
      .catch(() => {
        if (!cancelled) setSongs([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [name]);

  const isCurrentArtist = Boolean(currentSong && songs.some((song) => song._id === currentSong._id));
  const totalSeconds = songs.reduce((sum, song) => sum + (song.duration || 0), 0);
  const avatar = songs[0]?.imageUrl;

  const handlePlay = () => {
    if (songs.length === 0) return;
    if (isCurrentArtist) {
      togglePlay();
      return;
    }
    playerAlbum(songs, 0);
  };

  const handleFollow = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    void toggleFollow(name);
  };

  return (
    <ScrollArea className="h-full">
      <main className="min-h-full bg-gradient-to-b from-[#35566b] via-[#121212] to-[#121212]">
        <header className="flex min-h-72 flex-col items-start gap-6 p-6 sm:flex-row sm:items-end sm:p-9">
          {avatar ? (
            <img src={avatar} alt="" className="size-40 rounded-full object-cover shadow-2xl sm:size-52" />
          ) : (
            <div className="grid size-40 place-items-center rounded-full bg-[#242424] text-zinc-500 shadow-2xl sm:size-52">
              <Mic2 className="size-16" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-bold">Artist</p>
            <h1 className="mt-3 break-words text-5xl font-black sm:text-7xl">{name}</h1>
            <p className="mt-4 text-sm font-semibold text-zinc-200">
              {songCountLabel(songs.length)}
              {songs.length > 0 && ` • ${formatTotalDuration(totalSeconds)}`}
            </p>
          </div>
        </header>

        <div className="p-6 sm:p-8">
          <div className="mb-8 flex items-center gap-5">
            <button
              type="button"
              aria-label={isCurrentArtist && isPlaying ? "Pause artist" : "Play artist"}
              onClick={handlePlay}
              disabled={songs.length === 0}
              className="grid size-14 place-items-center rounded-full bg-[#1ed760] text-black shadow-xl transition-transform hover:scale-105 disabled:opacity-40"
            >
              {isCurrentArtist && isPlaying ? (
                <Pause className="size-6 fill-black" />
              ) : (
                <Play className="ml-1 size-6 fill-black" />
              )}
            </button>
            <button
              type="button"
              onClick={handleFollow}
              aria-pressed={isFollowing}
              className={`rounded-full border px-4 py-1.5 text-sm font-bold transition-colors ${
                isFollowing
                  ? "border-zinc-500 text-zinc-300 hover:border-white hover:text-white"
                  : "border-zinc-500 hover:border-white"
              }`}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          </div>

          <h2 className="mb-4 text-2xl font-bold">Popular</h2>
          {isLoading && songs.length === 0 ? (
            <p className="py-16 text-center text-zinc-400">Loading songs...</p>
          ) : songs.length === 0 ? (
            <p className="py-16 text-center text-zinc-400">No songs by this artist are on BeatMusic yet.</p>
          ) : (
            <div className="space-y-1">
              {songs.map((song, index) => (
                <SongRow key={song._id} song={song} index={index + 1} onPlay={() => playerAlbum(songs, index)} />
              ))}
            </div>
          )}
        </div>
      </main>
    </ScrollArea>
  );
}
