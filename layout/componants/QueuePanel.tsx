import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { ListMusic, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getFallbackArtwork } from "@/lib/songArtwork";
import { cn } from "@/lib/utils";
import { selectUpcomingIndices, usePlayStore } from "@/stores/usePlayerStore";
import type { Song } from "@/types";

interface QueuePanelProps {
  onClose: () => void;
}

const QueueRow = ({
  song,
  active = false,
  isPlaying = false,
  onPlay,
  onRemove,
}: {
  song: Song;
  active?: boolean;
  isPlaying?: boolean;
  onPlay?: () => void;
  onRemove?: () => void;
}) => (
  <div
    onClick={onPlay}
    className={cn("group flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-white/10", onPlay && "cursor-pointer")}
  >
    <img
      src={song.imageUrl}
      alt=""
      onError={(event) => {
        event.currentTarget.src = getFallbackArtwork(song.title);
      }}
      className="size-10 shrink-0 rounded object-cover"
    />
    <div className="min-w-0 flex-1">
      <p className={cn("truncate text-sm font-medium", active ? "text-[#1ed760]" : "text-white")}>{song.title}</p>
      <p className="truncate text-xs text-zinc-400">{song.artist}</p>
    </div>
    {active && isPlaying && <span className="text-[10px] font-bold uppercase text-[#1ed760]">Playing</span>}
    {onRemove && (
      <button
        type="button"
        aria-label={`Remove ${song.title} from queue`}
        onClick={(event) => {
          event.stopPropagation();
          onRemove();
        }}
        className="grid size-7 place-items-center rounded-full text-zinc-400 opacity-100 transition-opacity hover:text-white md:opacity-0 md:group-hover:opacity-100"
      >
        <X className="size-4" />
      </button>
    )}
  </div>
);

const Section = ({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) => (
  <section>
    <div className="mb-2 flex items-center justify-between px-1">
      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">{title}</h3>
      {action}
    </div>
    <div className="space-y-1">{children}</div>
  </section>
);

const Empty = ({ text }: { text: string }) => <p className="px-1 py-2 text-xs text-zinc-500">{text}</p>;

const QueuePanel = ({ onClose }: QueuePanelProps) => {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const state = usePlayStore();
  const upcoming = selectUpcomingIndices(state).map((index) => ({ index, song: state.queue[index] }));

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target instanceof Node ? event.target : null;
      if (!target || panelRef.current?.contains(target)) return;
      if (target instanceof Element && target.closest("[data-queue-toggle]")) return;
      onClose();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Queue"
      className="absolute bottom-full right-3 z-50 mb-3 flex max-h-[60vh] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-white/10 bg-[#181818] shadow-2xl"
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <ListMusic className="size-4 text-zinc-400" />
          <h2 className="text-sm font-bold text-white">Queue</h2>
        </div>
        <button
          type="button"
          aria-label="Close queue"
          onClick={onClose}
          className="grid size-7 place-items-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white"
        >
          <X className="size-4" />
        </button>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-5 p-3">
          {state.currentSong && (
            <Section title="Now playing">
              <QueueRow song={state.currentSong} active isPlaying={state.isPlaying} />
            </Section>
          )}

          <Section
            title="Next in queue"
            action={
              state.userQueue.length > 0 ? (
                <button
                  type="button"
                  onClick={() => state.clearUserQueue()}
                  className="text-[11px] font-semibold text-zinc-400 hover:text-white hover:underline"
                >
                  Clear
                </button>
              ) : null
            }
          >
            {state.userQueue.length === 0 ? (
              <Empty text="Songs you add with the queue button show up here." />
            ) : (
              state.userQueue.map((song, index) => (
                <QueueRow
                  key={`${song._id}-${index}`}
                  song={song}
                  onPlay={() => state.playUserQueueItem(index)}
                  onRemove={() => state.removeFromUserQueue(index)}
                />
              ))
            )}
          </Section>

          <Section title="Next from playlist or album">
            {upcoming.length === 0 ? (
              <Empty text="Nothing else is queued from this list." />
            ) : (
              upcoming.map(({ index, song }) => (
                <QueueRow key={`${song._id}-${index}`} song={song} onPlay={() => state.playQueueIndex(index)} />
              ))
            )}
          </Section>
        </div>
      </ScrollArea>
    </div>
  );
};

export default QueuePanel;
