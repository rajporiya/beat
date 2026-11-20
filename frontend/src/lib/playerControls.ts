import { usePlayStore } from "@/stores/usePlayerStore";

const RESTART_AFTER_SECONDS = 3;

export const getAudioElement = () => document.querySelector("audio");

export const playPreviousOrRestart = () => {
  const audio = getAudioElement();
  if (audio && audio.currentTime > RESTART_AFTER_SECONDS) {
    audio.currentTime = 0;
    return;
  }
  if (!usePlayStore.getState().playPrevious() && audio) {
    audio.currentTime = 0;
  }
};

export const seekBy = (seconds: number) => {
  const audio = getAudioElement();
  if (!audio || !Number.isFinite(audio.duration)) return;
  audio.currentTime = Math.min(Math.max(audio.currentTime + seconds, 0), audio.duration);
};
