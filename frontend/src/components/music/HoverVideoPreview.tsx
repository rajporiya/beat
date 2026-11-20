import { useCallback, useEffect, useRef, useState } from "react";

interface HoverVideoPreviewProps {
  src?: string | null;
  poster?: string;
  /** Play the preview while true (typically while the parent card is hovered). */
  active: boolean;
  /** Called when the preview actually starts or stops playing. */
  onPreviewChange?: (playing: boolean) => void;
  className?: string;
}

/**
 * Muted, looping video preview used by podcast/video cards on hover.
 * Keeps the card artwork visible until the video actually has frames.
 */
export default function HoverVideoPreview({
  src,
  poster,
  active,
  onPreviewChange,
  className = "",
}: HoverVideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const onPreviewChangeRef = useRef(onPreviewChange);
  const [isPlaying, setIsPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    onPreviewChangeRef.current = onPreviewChange;
  }, [onPreviewChange]);

  const updatePreview = useCallback((playing: boolean) => {
    setIsPlaying(playing);
    onPreviewChangeRef.current?.(playing);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    video?.pause();
    updatePreview(false);
    setFailed(false);
  }, [src, updatePreview]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src || failed) return;

    if (!active) {
      video.pause();
      updatePreview(false);
      return;
    }

    video.muted = true;
    try {
      video.currentTime = 0;
    } catch {
      // The media may not be seekable until its metadata is available.
    }

    void video
      .play()
      .then(() => updatePreview(true))
      .catch(() => updatePreview(false));
  }, [active, src, failed, updatePreview]);

  useEffect(
    () => () => {
      videoRef.current?.pause();
    },
    [],
  );

  if (!src || failed) return null;

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      onPlaying={() => updatePreview(true)}
      onError={() => {
        setFailed(true);
        updatePreview(false);
      }}
      className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
        active && isPlaying ? "opacity-100" : "opacity-0"
      } ${className}`}
    />
  );
}
