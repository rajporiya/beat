import { Headphones, Play, X } from "lucide-react";
import type { ReactNode } from "react";
import { getFallbackArtwork } from "@/lib/songArtwork";

type MediaPreviewModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  meta?: ReactNode;
};

const MediaPreviewModal = ({ open, onClose, title, subtitle, imageUrl, audioUrl, videoUrl, meta }: MediaPreviewModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#181818] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-[#141414] px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src={imageUrl || getFallbackArtwork(title)}
              onError={(event) => {
                event.currentTarget.src = getFallbackArtwork(title);
              }}
              alt={title}
              className="size-11 shrink-0 rounded-lg object-cover"
            />
            <div className="min-w-0">
              <p className="truncate font-bold text-white">{title}</p>
              {subtitle && <p className="truncate text-xs text-zinc-400">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="grid size-8 shrink-0 place-items-center rounded-full bg-white/[0.06] text-zinc-300 hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {videoUrl ? (
            <video src={videoUrl} controls autoPlay className="max-h-[52vh] w-full rounded-xl bg-black" />
          ) : (
            <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#242424] via-[#181818] to-[#0f0f0f]">
              <img
                src={imageUrl || getFallbackArtwork(title)}
                onError={(event) => {
                  event.currentTarget.src = getFallbackArtwork(title);
                }}
                alt={title}
                className="absolute inset-0 size-full object-cover opacity-30 blur-[1px]"
              />
              <div className="relative grid size-16 place-items-center rounded-full bg-[#1ed760] text-black shadow-2xl">
                <Headphones className="size-7" />
              </div>
            </div>
          )}

          {audioUrl && (
            <div className="rounded-xl border border-white/10 bg-[#202020] p-3">
              <div className="mb-2 flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wider text-zinc-400">
                <Play className="size-3.5 text-[#1ed760]" /> Audio preview
              </div>
              <audio src={audioUrl} controls autoPlay={!videoUrl} preload="metadata" className="w-full" />
            </div>
          )}

          {meta && <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-sm text-zinc-400">{meta}</div>}
        </div>
      </div>
    </div>
  );
};

export default MediaPreviewModal;
