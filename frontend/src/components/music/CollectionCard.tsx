import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { getFallbackArtwork } from "@/lib/songArtwork";
import { cn } from "@/lib/utils";

interface CollectionCardProps {
  to: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  round?: boolean;
  placeholder?: ReactNode;
}

const CollectionCard = ({ to, title, subtitle, imageUrl, round = false, placeholder }: CollectionCardProps) => (
  <Link
    to={to}
    className="group relative block rounded-lg bg-[#181818] p-3 transition-colors hover:bg-[#282828] sm:p-4"
  >
    <div
      className={cn(
        "aspect-square w-full overflow-hidden bg-[#242424] shadow-lg",
        round ? "rounded-full" : "rounded-md",
      )}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          onError={(event) => {
            event.currentTarget.src = getFallbackArtwork(title);
          }}
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="grid size-full place-items-center text-zinc-500">{placeholder}</div>
      )}
    </div>
    <p className={cn("mt-3 truncate font-bold", round && "text-center")}>{title}</p>
    {subtitle && (
      <p className={cn("mt-1 truncate text-sm text-zinc-400", round && "text-center")}>{subtitle}</p>
    )}
  </Link>
);

export default CollectionCard;
