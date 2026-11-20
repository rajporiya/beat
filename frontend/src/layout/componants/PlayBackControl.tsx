import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import AddToPlaylistModal from "@/components/AddToPlaylistModal";
import DownloadButton from "@/components/DownloadButton";
import LikeButton from "@/components/LikeButton";
import QueuePanel from "@/layout/componants/QueuePanel";
import Modal from "@/components/ui/modal";
import { getLyricsForSong } from "@/data/nowPlayingData";
import { formatClock, isCatalogId } from "@/lib/music";
import { playPreviousOrRestart } from "@/lib/playerControls";
import { usePlayStore } from "@/stores/usePlayerStore";
import { useSubscriptionStore } from "@/stores/useSubscriptionStore";
import { useUpgradeStore } from "@/stores/useUpgradeStore";
import { PLAN_META, isPlanId } from "@/lib/plans";
import {
  Laptop2,
  ListMusic,
  Mic2,
  Pause,
  Play,
  Plus,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/stores/useAuthStore";

const iconButtonClass =
  "size-8 text-zinc-400 hover:bg-transparent hover:text-white disabled:opacity-35";
const activeIconClass = "text-[#1ed760] hover:text-[#1ed760]";

const PlayBackControl = () => {
  const {
    currentSong,
    togglePlay,
    isPlaying,
    playNext,
    shuffle,
    repeat,
    toggleShuffle,
    cycleRepeat,
  } = usePlayStore();
  const { entitlements, plan } = useSubscriptionStore();
  const { user } = useAuthStore();
  const openUpgrade = useUpgradeStore((state) => state.open);
  const activePlan = isPlanId(plan) ? plan : isPlanId(user?.plan) ? user.plan : "free";
  const planMeta = PLAN_META[activePlan];
  const [volume, setVolume] = useState(75);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const durationSongRef = useRef<string | null>(null);

  useEffect(() => {
    const audio = document.querySelector("audio");
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime || 0);
    const updateDuration = () =>
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const resetTime = () => {
      setCurrentTime(0);
      setDuration(0);
    };

    const songId = currentSong?._id ?? null;
    const songChanged = durationSongRef.current !== songId;

    audio.volume = volume / 100;
    audio.muted = isMuted;
    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("durationchange", updateDuration);
    audio.addEventListener("playing", updateDuration);
    audio.addEventListener("emptied", resetTime);

    if (songChanged) {
      durationSongRef.current = songId;
      setCurrentTime(0);
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    }

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("durationchange", updateDuration);
      audio.removeEventListener("playing", updateDuration);
      audio.removeEventListener("emptied", resetTime);
    };
  }, [currentSong, volume, isMuted]);

  const handleSeek = ([nextTime]: number[]) => {
    const audio = document.querySelector("audio");
    if (audio && Number.isFinite(nextTime)) {
      audio.currentTime = nextTime;
      setCurrentTime(nextTime);
    }
  };

  const handleVolume = ([nextVolume]: number[]) => {
    const audio = document.querySelector("audio");
    setVolume(nextVolume);
    if (nextVolume > 0) setIsMuted(false);
    if (audio) audio.volume = nextVolume / 100;
  };

  const hasSong = Boolean(currentSong);
  const canAddToPlaylist = Boolean(currentSong && isCatalogId(currentSong._id));
  const lyrics = currentSong ? getLyricsForSong(currentSong.title) : [];
  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;
  const RepeatIcon = repeat === "one" ? Repeat1 : Repeat;
  const repeatLabel =
    repeat === "off" ? "Repeat: off" : repeat === "all" ? "Repeat: all" : "Repeat: one";

  return (
    <footer className="relative mb-16 h-20 shrink-0 border-t border-white/10 bg-zinc-950 px-3 sm:h-24 sm:px-4 md:mb-0">
      {isQueueOpen && <QueuePanel onClose={() => setIsQueueOpen(false)} />}

      <div className="mx-auto grid h-full max-w-[1800px] grid-cols-[minmax(120px,1fr)_minmax(0,2fr)_minmax(120px,1fr)] items-center gap-2 sm:grid-cols-[minmax(180px,1fr)_minmax(280px,560px)_minmax(180px,1fr)] sm:gap-6">
        <div className="flex min-w-0 items-center gap-3">
          {currentSong ? (
            <>
              <img
                src={currentSong.imageUrl}
                onError={(event) => {
                  if (!event.currentTarget.src.startsWith("https://placehold.co")) {
                    event.currentTarget.src = `https://placehold.co/600x600/27272a/f5d0fe?text=${encodeURIComponent(currentSong.title)}`;
                  }
                }}
                alt={currentSong.title}
                className="size-12 shrink-0 rounded object-cover sm:size-14"
              />
              <div className="min-w-0 leading-tight">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-medium text-white hover:underline">{currentSong.title}</p>
                  <LikeButton song={currentSong} className="size-6" />
                  <button
                    type="button"
                    title={canAddToPlaylist ? "Add to playlist" : "Demo tracks can't be added to playlists"}
                    aria-label={canAddToPlaylist ? `Add ${currentSong.title} to playlist` : "Demo track cannot be added to a playlist"}
                    disabled={!canAddToPlaylist}
                    onClick={() => setIsPlaylistModalOpen(true)}
                    className="grid size-6 shrink-0 place-items-center rounded-full text-zinc-400 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
                <p className="mt-1 hidden truncate text-xs text-zinc-400 hover:text-white hover:underline sm:block">{currentSong.artist}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className={`rounded-sm border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${planMeta.borderClass} ${planMeta.textClass} bg-black/20`}>
                    {entitlements.audioQuality}
                  </span>
                  {!entitlements.adsFree && (
                    <span className="rounded-sm border border-fuchsia-400/30 bg-fuchsia-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-fuchsia-300">
                      Ads
                    </span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <p className="text-xs text-zinc-500">Choose a song to start listening</p>
          )}
        </div>

        <div className="flex min-w-0 flex-col items-center gap-2">
          <div className="flex h-8 items-center justify-center gap-2 sm:gap-3">
            <Button
              title={shuffle ? "Shuffle: on" : "Shuffle: off"}
              aria-label="Shuffle"
              aria-pressed={shuffle}
              size="icon"
              variant="ghost"
              className={`${iconButtonClass} hidden sm:inline-flex ${shuffle ? activeIconClass : ""}`}
              onClick={toggleShuffle}
            >
              <Shuffle className="size-4" />
            </Button>
            <Button title="Previous" aria-label="Previous track" size="icon" variant="ghost" className={iconButtonClass} onClick={playPreviousOrRestart} disabled={!hasSong}><SkipBack className="size-4" fill="currentColor" /></Button>
            <Button title={isPlaying ? "Pause" : "Play"} aria-label={isPlaying ? "Pause" : "Play"} size="icon" className="size-8 rounded-full bg-[#1ed760] text-black hover:scale-105 hover:bg-[#3be477] disabled:bg-zinc-700 disabled:text-zinc-400" onClick={togglePlay} disabled={!hasSong}>
              {isPlaying ? <Pause className="size-4" fill="currentColor" /> : <Play className="ml-0.5 size-4" fill="currentColor" />}
            </Button>
            <Button title="Next" aria-label="Next track" size="icon" variant="ghost" className={iconButtonClass} onClick={playNext} disabled={!hasSong}><SkipForward className="size-4" fill="currentColor" /></Button>
            <Button
              title={repeatLabel}
              aria-label={repeatLabel}
              aria-pressed={repeat !== "off"}
              size="icon"
              variant="ghost"
              className={`${iconButtonClass} hidden sm:inline-flex ${repeat !== "off" ? activeIconClass : ""}`}
              onClick={cycleRepeat}
            >
              <RepeatIcon className="size-4" />
            </Button>
          </div>

          <div className="flex w-full items-center gap-2 text-[11px] tabular-nums text-zinc-400">
            <span className="w-12 text-right">{formatClock(currentTime)}</span>
            <Slider aria-label="Playback progress" value={[Math.min(currentTime, duration || 0)]} max={duration || 1} step={1} className="[&_[data-slot=slider-track]]:h-1 [&_[data-slot=slider-track]]:bg-zinc-700 [&_[data-slot=slider-range]]:bg-zinc-300 [&_[data-slot=slider-thumb]]:size-3 [&_[data-slot=slider-thumb]]:border-0 [&_[data-slot=slider-thumb]]:opacity-0 hover:[&_[data-slot=slider-thumb]]:opacity-100" onValueChange={handleSeek} disabled={!hasSong || !duration} />
            <span className="w-12">{formatClock(duration)}</span>
          </div>
        </div>

        <div className="hidden items-center justify-end gap-1 sm:flex">
          {currentSong && (
            <DownloadButton
              kind="song"
              title={currentSong.title}
              mediaUrl={currentSong.audioUrl}
            />
          )}
          <Button
            title={entitlements.lyrics ? "Lyrics" : "Lyrics require Basic"}
            aria-label={entitlements.lyrics ? "Lyrics" : "Lyrics require Basic"}
            size="icon"
            variant="ghost"
            className={iconButtonClass}
            onClick={() => {
              if (!entitlements.lyrics) {
                openUpgrade("basic", "Full lyrics");
                return;
              }
              setIsLyricsOpen(true);
            }}
          >
            <Mic2 className="size-4" />
          </Button>
          <Button
            title="Queue"
            aria-label="Queue"
            aria-pressed={isQueueOpen}
            data-queue-toggle=""
            size="icon"
            variant="ghost"
            className={`${iconButtonClass} ${isQueueOpen ? activeIconClass : ""}`}
            onClick={() => setIsQueueOpen((open) => !open)}
          >
            <ListMusic className="size-4" />
          </Button>
          <Button title="Connect to a device" aria-label="Connect to a device" size="icon" variant="ghost" className={iconButtonClass}><Laptop2 className="size-4" /></Button>
          <div className="ml-1 flex items-center gap-1">
            <Button
              title={isMuted ? "Unmute" : "Mute"}
              aria-label={isMuted ? "Unmute" : "Mute"}
              size="icon"
              variant="ghost"
              className={iconButtonClass}
              onClick={() => setIsMuted((muted) => !muted)}
            >
              <VolumeIcon className="size-4" />
            </Button>
            <Slider aria-label="Volume" value={[isMuted ? 0 : volume]} max={100} step={1} className="w-24 [&_[data-slot=slider-track]]:h-1 [&_[data-slot=slider-track]]:bg-zinc-700 [&_[data-slot=slider-range]]:bg-zinc-300 [&_[data-slot=slider-thumb]]:size-3 [&_[data-slot=slider-thumb]]:border-0 [&_[data-slot=slider-thumb]]:opacity-0 hover:[&_[data-slot=slider-thumb]]:opacity-100" onValueChange={handleVolume} />
          </div>
        </div>
      </div>

      {/* Add-to-playlist modal for the song currently playing */}
      <AddToPlaylistModal
        song={isPlaylistModalOpen ? currentSong : null}
        onClose={() => setIsPlaylistModalOpen(false)}
      />

      <Modal
        open={isLyricsOpen && Boolean(currentSong)}
        onClose={() => setIsLyricsOpen(false)}
        title="Lyrics"
      >
        {currentSong && (
          <>
            <p className="mb-4 truncate text-sm text-zinc-400">
              <span className="font-semibold text-white">{currentSong.title}</span>
              {` • ${currentSong.artist}`}
            </p>
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {lyrics.map((line, index) => (
                <p
                  key={`${line}-${index}`}
                  className={index === 0 ? "text-base font-semibold text-white" : "text-sm text-zinc-300"}
                >
                  {line}
                </p>
              ))}
              {lyrics.length === 0 && (
                <p className="py-6 text-center text-sm text-zinc-500">
                  Lyrics are not available for this track yet.
                </p>
              )}
            </div>
          </>
        )}
      </Modal>
    </footer>
  );
};

export default PlayBackControl;
