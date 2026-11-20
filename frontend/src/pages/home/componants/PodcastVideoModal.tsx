import { useEffect, useRef } from "react";
import { Pause, Play, Volume2, X } from "lucide-react";
import type { PodcastEpisode } from "@/data/spotifyBrowseData";
import { usePlayStore } from "@/stores/usePlayerStore";
import DownloadButton from "@/components/DownloadButton";
import type { Song } from "@/types";

interface PodcastVideoModalProps {
  episode: PodcastEpisode | null;
  onClose: () => void;
}

export default function PodcastVideoModal({ episode, onClose }: PodcastVideoModalProps) {
  const { isPlaying, togglePlay, setCurrentSong, currentSong } = usePlayStore();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!episode) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [episode]);

  if (!episode) return null;

  const isCurrentEpisode = currentSong
    ? currentSong._id === episode.id ||
      currentSong.title.toLowerCase() === episode.title.toLowerCase()
    : false;
  const isEpisodePlaying = isCurrentEpisode && isPlaying;

  const handlePlayToggle = () => {
    if (isCurrentEpisode) {
      togglePlay();
      return;
    }

    const episodeSong: Song = {
      _id: episode.id,
      title: episode.title,
      artist: episode.showName,
      albumId: null,
      imageUrl: episode.showAvatarUrl,
      audioUrl: episode.audioUrl,
      duration: 18,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCurrentSong(episodeSong);
  };

  return (
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-xl animate-in fade-in duration-200"
    >
      <div className="flex min-h-full items-center justify-center p-3 sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="podcast-video-modal-title"
          onClick={(event) => event.stopPropagation()}
          className="relative flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0d] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.95)] animate-in zoom-in-95 slide-in-from-bottom-2 duration-300 sm:rounded-3xl"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-[#1ed760]/60 to-transparent" />

          {/* Header */}
          <header className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3.5 sm:px-5">
            <img
              src={episode.showAvatarUrl}
              alt={episode.showName}
              className="size-10 shrink-0 rounded-xl object-cover ring-1 ring-white/10 sm:size-11"
            />

            <div className="min-w-0 flex-1">
              <h2
                id="podcast-video-modal-title"
                title={episode.title}
                className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight text-white sm:line-clamp-1 sm:text-[15px]"
              >
                {episode.title}
              </h2>
              <div className="mt-1 flex items-center gap-2 text-[11px] font-medium text-zinc-400">
                <span className="truncate" title={episode.showName}>{episode.showName}</span>
                <span className="inline-flex shrink-0 items-center gap-1.5 text-[#1ed760]">
                  <span className="size-1 rounded-full bg-[#1ed760]" />
                  Video episode
                </span>
              </div>
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid size-8 shrink-0 place-items-center rounded-full bg-white/[0.06] text-zinc-400 ring-1 ring-inset ring-white/10 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <X className="size-4" />
            </button>
          </header>

          {/* Video */}
          {episode.videoUrl ? (
            <div className="relative aspect-video w-full bg-black">
              <video
                key={episode.videoUrl}
                src={episode.videoUrl}
                poster={episode.videoThumbnailUrl}
                controls
                preload="metadata"
                className="h-full w-full bg-black object-contain"
              />
            </div>
          ) : (
            <div className="group/video relative aspect-video w-full overflow-hidden bg-black">
              <img
                src={episode.videoThumbnailUrl}
                alt={episode.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover/video:scale-[1.02]"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/40" />

              <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3 sm:p-4">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/90 backdrop-blur-md">
                  <span className="size-1.5 rounded-full bg-[#1ed760]" />
                  Video
                </span>

                {isCurrentEpisode && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1ed760]/25 bg-black/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1ed760] backdrop-blur-md">
                    <span className="relative flex size-1.5">
                      {isEpisodePlaying && (
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1ed760] opacity-75" />
                      )}
                      <span className="relative inline-flex size-1.5 rounded-full bg-[#1ed760]" />
                    </span>
                    {isEpisodePlaying ? "Playing" : "Paused"}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handlePlayToggle}
                aria-label={isEpisodePlaying ? "Pause episode" : "Play episode"}
                className="group/play absolute left-1/2 top-1/2 grid size-[72px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-4 focus-visible:ring-offset-black sm:size-20"
              >
                <span className="absolute inset-0 rounded-full bg-[#1ed760]/40 opacity-70 blur-xl transition-opacity duration-300 group-hover/play:opacity-100" />
                <span className="relative grid size-full place-items-center rounded-full bg-[#1ed760] text-black shadow-[0_12px_40px_rgba(0,0,0,0.55)] ring-1 ring-white/30 transition-all duration-200 group-hover/play:scale-105 group-hover/play:bg-[#1fdf64] group-active/play:scale-95">
                  {isEpisodePlaying ? (
                    <Pause className="size-7 fill-current sm:size-8" />
                  ) : (
                    <Play className="ml-1 size-7 fill-current sm:size-8" />
                  )}
                </span>
              </button>

              <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-[11px] backdrop-blur-xl sm:px-4 sm:text-xs">
                  <div className="flex items-center gap-2 font-medium text-zinc-300">
                    <span>{episode.publishDate}</span>
                    <span className="text-zinc-600">•</span>
                    <span>{episode.duration}</span>
                  </div>

                  <div className="flex items-center gap-1.5 font-medium text-[#1ed760]">
                    <Volume2 className="size-3.5" />
                    <span>Enhanced Audio</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Episode notes */}
          <footer className="bg-gradient-to-b from-[#121212] to-[#0d0d0d] px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                <span className="h-3 w-0.5 rounded-full bg-[#1ed760]" />
                Episode notes
              </h3>

              <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
                {episode.audioUrl && (
                  <DownloadButton
                    kind="podcast"
                    title={episode.title}
                    mediaUrl={episode.audioUrl}
                    label="Download audio"
                    compactLabel="Audio"
                    variant="pill"
                  />
                )}
                {episode.videoUrl && (
                  <DownloadButton
                    kind="video"
                    title={episode.title}
                    mediaUrl={episode.videoUrl}
                    label="Download video"
                    compactLabel="Video"
                    variant="pill"
                  />
                )}
              </div>
            </div>

            <p className="mt-2.5 max-w-3xl text-[13px] leading-relaxed text-zinc-300 sm:text-sm">
              {episode.description}
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
