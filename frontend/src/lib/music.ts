const CATALOG_ID = /^[a-f0-9]{24}$/i;

export const isCatalogId = (id: string | null | undefined) => Boolean(id && CATALOG_ID.test(id));

export const formatClock = (seconds: number) => {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const minutes = Math.floor(safe / 60);
  const remainder = Math.floor(safe % 60);
  return `${minutes.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
};

export const formatTotalDuration = (seconds: number) => {
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours} hr ${minutes} min` : `${minutes} min`;
};

export const songCountLabel = (count: number) => `${count} ${count === 1 ? "song" : "songs"}`;
