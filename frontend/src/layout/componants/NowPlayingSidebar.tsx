import { useState, useMemo } from "react";
import {
  ChevronLeft,
  MoreHorizontal,
  Check,
  Play,
  ListMusic,
  Sparkles,
  X,
  Lock,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import SongArtwork from "@/components/music/SongArtwork";
import { selectNextSong, usePlayStore } from "@/stores/usePlayerStore";
import { useFollowStore } from "@/stores/useFollowStore";
import { useAuthStore } from "@/stores/useAuthStore";
import LikeButton from "@/components/LikeButton";
import { useNavigate } from "react-router-dom";
import { useSubscriptionStore } from "@/stores/useSubscriptionStore";
import { useUpgradeStore } from "@/stores/useUpgradeStore";
import AdBanner from "@/components/AdBanner";
import DownloadButton from "@/components/DownloadButton";
import { getFallbackArtwork } from "@/lib/songArtwork";
import {
  getArtistDetailsForSong,
  getLyricsForSong,
  getCreditsForSong,
} from "@/data/nowPlayingData";
import { SPOTIFY_POPULAR_ALBUMS } from "@/data/spotifyHomeData";
import type { Song } from "@/types";

interface NowPlayingSidebarProps {
  onCollapse?: () => void;
}

const DEFAULT_PREVIEW_SONG: Song = SPOTIFY_POPULAR_ALBUMS.find(
  (s) => s.title.toLowerCase().includes("kabir") || s.title.toLowerCase().includes("tera")
) ||
  SPOTIFY_POPULAR_ALBUMS[2] || {
    _id: "default-preview",
    title: "Tera Ban Jaunga",
    artist: "Mithoon, Akhil Sachdeva, Tulsi Kumar",
    albumId: "kabir-singh",
    imageUrl: "/cover-images/kabir_singh.jpg",
    audioUrl: "/songs/kabir_singh.wav",
    duration: 18,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

const NowPlayingSidebar = ({ onCollapse }: NowPlayingSidebarProps) => {
  const { currentSong, playNext } = usePlayStore();
  const nextSong = usePlayStore(selectNextSong);
  const { entitlements } = useSubscriptionStore();
  const openUpgrade = useUpgradeStore((state) => state.open);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const followedArtists = useFollowStore((state) => state.artists);
  const toggleFollow = useFollowStore((state) => state.toggleFollow);

  const [expandedLyrics, setExpandedLyrics] = useState(false);
  const canViewLyrics = entitlements.lyrics;

  // Active song to display (defaults to preview song if player hasn't started yet)
  const activeSong: Song = currentSong || DEFAULT_PREVIEW_SONG;

  const artistDetails = useMemo(
    () => getArtistDetailsForSong(activeSong.artist),
    [activeSong.artist]
  );

  const lyrics = useMemo(
    () => getLyricsForSong(activeSong.title),
    [activeSong.title]
  );

  const credits = useMemo(
    () => getCreditsForSong(activeSong.title, activeSong.artist),
    [activeSong.title, activeSong.artist]
  );

  const isFollowing = followedArtists.includes(activeSong.artist);

  return (
    <aside
      className="h-full relative w-[275px] bg-[#121212] rounded-lg overflow-hidden flex flex-col shrink-0 select-none border border-zinc-900/80"
      aria-label="Now Playing Sidebar"
    >
      {/* Middle collapse chevron button on left edge (matching photo `<`) */}
      <button
        type="button"
        onClick={onCollapse}
        title="Collapse Now Playing"
        aria-label="Collapse Now Playing"
        className="absolute left-1.5 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center size-6 bg-[#181818]/90 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-full transition-all shadow-xl cursor-pointer border border-zinc-700/60 group/btn"
      >
        <ChevronLeft className="size-4 group-hover/btn:-translate-x-0.5 transition-transform" />
      </button>

      {/* Top Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-zinc-800/60 shrink-0 bg-[#121212]/95 backdrop-blur-sm z-10">
        <div className="flex items-center gap-1.5 min-w-0 pr-2">
          <Sparkles className="size-3.5 text-[#1ed760] shrink-0" />
          <h2
            className="text-xs font-bold uppercase tracking-wider text-zinc-300 truncate cursor-default"
            title={activeSong.title}
          >
            #NOW_PLAYING
          </h2>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
            title="More options"
          >
            <MoreHorizontal className="size-4" />
          </button>
          {onCollapse && (
            <button
              type="button"
              onClick={onCollapse}
              className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
              title="Close panel"
              aria-label="Close panel"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Now Playing Content */}
      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Main Album Artwork */}
          <SongArtwork
            song={activeSong}
            className="aspect-square w-full rounded-lg overflow-hidden bg-zinc-900 shadow-2xl border border-zinc-800/50"
            imageClassName="size-full object-cover"
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
          </SongArtwork>

          {/* Song Title, Artist & Like Action */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3
                className="text-lg font-bold text-white truncate hover:underline cursor-pointer leading-tight"
                title={activeSong.title}
              >
                {activeSong.title}
              </h3>
              <p
                className="text-xs text-zinc-400 font-medium truncate hover:text-white hover:underline cursor-pointer mt-1"
                title={activeSong.artist}
              >
                {activeSong.artist}
              </p>
            </div>

            <LikeButton song={activeSong} className="shrink-0" />

            <DownloadButton
              kind="song"
              title={activeSong.title}
              mediaUrl={activeSong.audioUrl}
              className="shrink-0"
            />
          </div>

          {/* Lyrics Card (matching photo layout) */}
          <div
            onClick={() => {
              if (!canViewLyrics) {
                openUpgrade("basic", "Full lyrics");
                return;
              }
              setExpandedLyrics((prev) => !prev);
            }}
            className="group/lyrics relative overflow-hidden rounded-xl bg-gradient-to-b from-[#2a1720] via-[#201319] to-[#150e12] border border-pink-950/40 p-4 cursor-pointer hover:border-pink-900/60 transition-all shadow-md"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-pink-200">
                Lyrics
              </span>
              {canViewLyrics ? (
                <span className="text-[11px] text-zinc-400 group-hover/lyrics:text-white transition-colors font-medium">
                  {expandedLyrics ? "Show less" : "Show more"}
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-full border border-pink-400/25 bg-pink-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-pink-200">
                  <Lock className="size-2.5" />
                  Basic
                </span>
              )}
            </div>

            {canViewLyrics ? (
              <div className="space-y-1.5 transition-all">
                {(expandedLyrics ? lyrics : lyrics.slice(0, 4)).map((line, idx) => (
                  <p
                    key={idx}
                    className={`font-semibold text-base leading-snug tracking-tight transition-colors ${
                      idx === 0
                        ? "text-white"
                        : idx === 1
                        ? "text-zinc-200"
                        : "text-zinc-400"
                    }`}
                  >
                    {line}
                  </p>
                ))}
              </div>
            ) : (
              <div className="relative">
                <div className="space-y-1.5 opacity-50 blur-[3px] select-none pointer-events-none">
                  {lyrics.slice(0, 4).map((line, idx) => (
                    <p
                      key={idx}
                      className={`font-semibold text-base leading-snug tracking-tight ${
                        idx === 0 ? "text-white" : "text-zinc-400"
                      }`}
                    >
                      {line}
                    </p>
                  ))}
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-lg bg-black/25">
                  <Lock className="size-4 text-pink-200" />
                  <p className="text-xs font-bold text-white">Lyrics with Basic</p>
                  <p className="text-[10px] text-zinc-400">Upgrade to reveal full lyrics</p>
                </div>
              </div>
            )}

            {/* Subtle ambient glow */}
            <div className="absolute -right-8 -bottom-8 size-24 bg-pink-600/10 rounded-full blur-2xl pointer-events-none" />
          </div>

          {/* Credits Card (matching photo with Pritam & Arijit Singh) */}
          <div className="rounded-xl bg-[#181818] border border-zinc-800/60 p-3.5 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Credits
              </span>
              <button
                type="button"
                className="text-[11px] font-semibold text-zinc-400 hover:text-white hover:underline cursor-pointer"
              >
                Show all
              </button>
            </div>

            <div className="space-y-2.5">
              {credits.map((c, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate hover:underline cursor-pointer">
                      {c.name}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {c.role}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-zinc-600 text-zinc-300 hover:border-white hover:text-white transition-colors"
                  >
                    Follow
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* About the Artist Card (matching photo layout) */}
          <div className="rounded-xl bg-[#1e1e1e] hover:bg-[#222222] border border-zinc-800/60 overflow-hidden transition-colors shadow-md">
            {/* Artist Cover / Header */}
            <div className="relative h-24 w-full bg-zinc-800 overflow-hidden">
              <img
                src={artistDetails.avatarUrl}
                alt={artistDetails.name}
                className="size-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/cover-images/kabir_singh.jpg";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1e1e1e] via-[#1e1e1e]/40 to-transparent" />
              <div className="absolute top-2.5 left-3">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-200 drop-shadow-md">
                  About the artist
                </span>
              </div>
            </div>

            {/* Artist Information */}
            <div className="p-3.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white truncate hover:underline cursor-pointer">
                    {artistDetails.name}
                  </h4>
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                    {artistDetails.monthlyListeners}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!user) {
                      navigate("/login");
                      return;
                    }
                    void toggleFollow(activeSong.artist);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                    isFollowing
                      ? "border-zinc-500 text-zinc-300 hover:border-white hover:text-white"
                      : "border-zinc-400 text-white hover:border-white"
                  }`}
                >
                  {isFollowing ? (
                    <span className="flex items-center gap-1">
                      <Check className="size-3 text-[#1ed760]" />
                      Following
                    </span>
                  ) : (
                    "Follow"
                  )}
                </button>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">
                {artistDetails.bio}
              </p>
            </div>
          </div>

          {/* Next in Queue Card (bonus Spotify feature) */}
          {nextSong && (
            <div className="rounded-xl bg-[#181818] border border-zinc-800/60 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400">
                  <ListMusic className="size-3.5" />
                  <span>Next in queue</span>
                </div>
                <button
                  type="button"
                  onClick={() => playNext()}
                  className="text-[11px] font-semibold text-[#1ed760] hover:underline cursor-pointer"
                >
                  Play next
                </button>
              </div>

              <div
                onClick={() => playNext()}
                className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-zinc-800/60 transition-colors cursor-pointer group/next"
              >
                <div className="relative size-10 rounded-md overflow-hidden bg-zinc-800 shrink-0">
                  <img
                    src={nextSong.imageUrl || getFallbackArtwork(nextSong.title)}
                    alt={nextSong.title}
                    className="size-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = getFallbackArtwork(nextSong.title);
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/next:opacity-100 transition-opacity">
                    <Play className="size-4 text-white fill-white" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate group-hover/next:text-[#1ed760] transition-colors">
                    {nextSong.title}
                  </p>
                  <p className="text-[11px] text-zinc-400 truncate">
                    {nextSong.artist}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Ad for the ad-supported Normal plan */}
          <AdBanner compact />
        </div>
      </ScrollArea>
    </aside>
  );
};

export default NowPlayingSidebar;
