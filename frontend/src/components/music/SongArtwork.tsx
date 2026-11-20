import { useEffect, useRef, useState, type ReactNode } from "react";
import { Video } from "lucide-react";
import { getFallbackArtwork } from "@/lib/songArtwork";
import type { Song } from "@/types";

type SongArtworkProps = {
  song: Song;
  className?: string;
  imageClassName?: string;
  children?: ReactNode;
};

/**
 * Song cover art that swaps to a muted looping video preview on hover when the
 * song has a `videoUrl`. Falls back to the cover image if the video can't load.
 */
export default function SongArtwork({
  song,
  className = "",
  imageClassName = "",
  children,
}: SongArtworkProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isHoveringRef = useRef(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  const hasVideo = Boolean(song.videoUrl) && !videoFailed;

  useEffect(() => {
    isHoveringRef.current = false;
    setIsPreviewing(false);
    setVideoFailed(false);
  }, [song.videoUrl]);

  useEffect(() => {
    return () => {
      videoRef.current?.pause();
    };
  }, []);

  const startPreview = () => {
    isHoveringRef.current = true;
    const video = videoRef.current;
    if (!video || !hasVideo) return;

    video.muted = true;
    if (video.readyState >= 1) video.currentTime = 0;

    void video
      .play()
      .then(() => {
        if (isHoveringRef.current) {
          setIsPreviewing(true);
        } else {
          video.pause();
        }
      })
      .catch(() => {
        setIsPreviewing(false);
      });
  };

  const stopPreview = () => {
    isHoveringRef.current = false;
    videoRef.current?.pause();
    setIsPreviewing(false);
  };

  return (
    <div
      className={`group/artwork relative ${className}`}
      onMouseEnter={startPreview}
      onMouseLeave={stopPreview}
    >
      <img
        src={song.imageUrl || getFallbackArtwork(song.title)}
        onError={(event) => {
          event.currentTarget.src = getFallbackArtwork(song.title);
        }}
        alt={`${song.title} cover`}
        className={imageClassName}
        loading="lazy"
      />

      {hasVideo && (
        <>
          <video
            ref={videoRef}
            src={song.videoUrl ?? undefined}
            poster={song.imageUrl}
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
            onPlaying={() => setIsPreviewing(true)}
            onError={() => {
              setVideoFailed(true);
              setIsPreviewing(false);
            }}
            className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
              isPreviewing ? "opacity-100" : "opacity-0"
            }`}
          />
          <span className="pointer-events-none absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-md">
            <Video className="size-2.5" />
            Video
          </span>
        </>
      )}

      {children}
    </div>
  );
}
