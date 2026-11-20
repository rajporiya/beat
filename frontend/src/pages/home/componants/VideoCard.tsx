import { useState } from "react";
import { Eye, Play } from "lucide-react";
import type { VideoMedia } from "@/types";
import HoverVideoPreview from "@/components/music/HoverVideoPreview";
import { getFallbackArtwork } from "@/lib/songArtwork";
import { formatDuration, formatNumber, formatRelativeDate } from "@/lib/media";

interface VideoCardProps {
  video: VideoMedia;
  onPlay: (video: VideoMedia) => void;
}

const VideoCard = ({ video, onPlay }: VideoCardProps) => {
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const thumbnail = video.thumbnailUrl || getFallbackArtwork(video.title);

  return (
    <button
      type="button"
      onClick={() => {
        setIsPreviewing(false);
        setIsPreviewPlaying(false);
        onPlay(video);
      }}
      onMouseEnter={() => setIsPreviewing(true)}
      onMouseLeave={() => setIsPreviewing(false)}
      onFocus={() => setIsPreviewing(true)}
      onBlur={() => setIsPreviewing(false)}
      className="group overflow-hidden rounded-2xl border border-white/[0.07] bg-[#181818] text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-400/30 hover:bg-[#202020]"
    >
      <div className="relative aspect-video overflow-hidden bg-black">
        <img
          src={thumbnail}
          onError={(event) => {
            event.currentTarget.src = getFallbackArtwork(video.title);
          }}
          alt={video.title}
          className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          loading="lazy"
        />

        <HoverVideoPreview
          src={video.videoUrl}
          poster={thumbnail}
          active={isPreviewing}
          onPreviewChange={setIsPreviewPlaying}
          className="group-hover:scale-[1.04]"
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="grid size-12 place-items-center rounded-full bg-black/70 text-white shadow-xl transition-all duration-200 group-hover:scale-110 group-hover:bg-violet-400 group-hover:text-black">
            <Play className="ml-0.5 size-5 fill-current" />
          </span>
        </div>
        <span className="pointer-events-none absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
          {formatDuration(video.duration)}
        </span>
        <span className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-violet-500/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
          {isPreviewPlaying && <span className="size-1 animate-pulse rounded-full bg-white" />}
          {isPreviewPlaying ? "Preview" : "Video"}
        </span>
      </div>
      <div className="p-3.5">
        <p className="line-clamp-2 text-sm font-bold leading-snug text-white">{video.title}</p>
        <p className="mt-1 line-clamp-1 text-xs text-zinc-400">{video.creator}</p>
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-500">
          <Eye className="size-3.5" /> {formatNumber(video.views)} views
          <span>•</span>
          {formatRelativeDate(video.publishedAt || video.createdAt)}
        </p>
      </div>
    </button>
  );
};

export default VideoCard;
