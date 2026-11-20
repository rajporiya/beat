import { Heart } from "lucide-react";
import type { MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { isCatalogId } from "@/lib/music";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import { useLikedSongsStore } from "@/stores/useLikedSongsStore";
import type { Song } from "@/types";

interface LikeButtonProps {
  song: Song;
  className?: string;
}

const LikeButton = ({ song, className }: LikeButtonProps) => {
  const liked = useLikedSongsStore((state) => state.likedIds.has(song._id));
  const toggleLike = useLikedSongsStore((state) => state.toggleLike);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const catalog = isCatalogId(song._id);

  const label = !user
    ? "Log in to like songs"
    : !catalog
      ? "This track can't be liked"
      : liked
        ? "Remove from Liked Songs"
        : "Save to Liked Songs";

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!user) {
      navigate("/login");
      return;
    }
    void toggleLike(song);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={Boolean(user) && !catalog}
      aria-label={label}
      aria-pressed={liked}
      title={label}
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-full text-zinc-400 transition-colors hover:text-white disabled:opacity-40",
        liked && "text-[#1ed760] hover:text-[#1ed760]",
        className,
      )}
    >
      <Heart className={cn("size-4", liked && "fill-[#1ed760]")} />
    </button>
  );
};

export default LikeButton;
