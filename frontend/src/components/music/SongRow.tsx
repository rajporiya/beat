import { useState } from "react";
import type { MouseEvent } from "react";
import { ListPlus, Plus, Play, X } from "lucide-react";
import AddToPlaylistModal from "@/components/AddToPlaylistModal";
import LikeButton from "@/components/LikeButton";
import { formatClock } from "@/lib/music";
import { getFallbackArtwork } from "@/lib/songArtwork";
import { cn } from "@/lib/utils";
import { usePlayStore } from "@/stores/usePlayerStore";
import type { Song } from "@/types";

interface SongRowProps {
  song: Song;
  index: number;
  secondary?: string;
  onPlay: () => void;
  onRemove?: () => void;
}

const actionButtonClass =
  "grid size-8 place-items-center rounded-full text-zinc-400 opacity-100 transition-opacity hover:text-white md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100";

const SongRow = ({ song, index, secondary, onPlay, onRemove }: SongRowProps) => {
  const isActive = usePlayStore((state) => state.currentSong?._id === song._id);
  const isPlaying = usePlayStore((state) => state.isPlaying);
  const addToQueue = usePlayStore((state) => state.addToQueue);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);

  const stop = (event: MouseEvent<HTMLButtonElement>) => event.stopPropagation();

  return (
    <>
      <div
        onClick={onPlay}
        className="group flex cursor-pointer items-center gap-4 rounded-md px-3 py-2 text-sm transition-colors hover:bg-white/10"
      >
        <div className="grid w-6 shrink-0 place-items-center text-zinc-400">
          {isActive && isPlaying ? (
            <span className="flex h-4 items-end gap-0.5" aria-label="Now playing">
              <span className="h-2 w-0.5 animate-pulse rounded-full bg-[#1ed760]" />
              <span className="h-4 w-0.5 animate-pulse rounded-full bg-[#1ed760] [animation-delay:-0.3s]" />
              <span className="h-3 w-0.5 animate-pulse rounded-full bg-[#1ed760] [animation-delay:-0.6s]" />
            </span>
          ) : (
            <>
              <span className="group-hover:hidden">{index}</span>
              <Play className="hidden size-4 fill-white text-white group-hover:block" />
            </>
          )}
        </div>

        <img
          src={song.imageUrl}
          onError={(event) => {
            event.currentTarget.src = getFallbackArtwork(song.title);
          }}
          alt=""
          className="size-10 shrink-0 rounded object-cover"
        />

        <div className="min-w-0 flex-1">
          <p className={cn("truncate font-medium", isActive ? "text-[#1ed760]" : "text-white")}>
            {song.title}
          </p>
          <p className="truncate text-xs text-zinc-400">{song.artist}</p>
        </div>

        {secondary && (
          <p className="hidden w-1/4 min-w-0 truncate text-zinc-400 md:block">{secondary}</p>
        )}

        <div className="flex shrink-0 items-center gap-1">
          <LikeButton song={song} />
          <button
            type="button"
            title="Add to queue"
            aria-label={`Add ${song.title} to queue`}
            onClick={(event) => {
              stop(event);
              addToQueue(song);
            }}
            className={actionButtonClass}
          >
            <ListPlus className="size-4" />
          </button>
          <button
            type="button"
            title="Add to playlist"
            aria-label={`Add ${song.title} to playlist`}
            onClick={(event) => {
              stop(event);
              setIsPlaylistOpen(true);
            }}
            className={actionButtonClass}
          >
            <Plus className="size-4" />
          </button>
          {onRemove && (
            <button
              type="button"
              title="Remove from playlist"
              aria-label={`Remove ${song.title} from playlist`}
              onClick={(event) => {
                stop(event);
                onRemove();
              }}
              className={actionButtonClass}
            >
              <X className="size-4" />
            </button>
          )}
          <span className="w-12 text-right tabular-nums text-zinc-400">{formatClock(song.duration)}</span>
        </div>
      </div>

      <AddToPlaylistModal song={isPlaylistOpen ? song : null} onClose={() => setIsPlaylistOpen(false)} />
    </>
  );
};

export default SongRow;
