import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import { isCatalogId } from "@/lib/music";
import type { Song } from "@/types";

interface LikedSongsStore {
  likedSongs: Song[];
  likedIds: Set<string>;
  isLoaded: boolean;
  fetchLikedSongs: () => Promise<void>;
  toggleLike: (song: Song) => Promise<void>;
  reset: () => void;
}

export const useLikedSongsStore = create<LikedSongsStore>((set, get) => ({
  likedSongs: [],
  likedIds: new Set(),
  isLoaded: false,

  fetchLikedSongs: async () => {
    try {
      const res = await axiosInstance.get("/v1/library/liked");
      const songs: Song[] = Array.isArray(res.data?.data) ? res.data.data : [];
      set({ likedSongs: songs, likedIds: new Set(songs.map((song) => song._id)), isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },

  toggleLike: async (song) => {
    if (!isCatalogId(song._id)) return;
    const wasLiked = get().likedIds.has(song._id);

    set((state) => {
      const likedIds = new Set(state.likedIds);
      if (wasLiked) likedIds.delete(song._id);
      else likedIds.add(song._id);
      return {
        likedIds,
        likedSongs: wasLiked
          ? state.likedSongs.filter((item) => item._id !== song._id)
          : [song, ...state.likedSongs],
      };
    });

    try {
      if (wasLiked) await axiosInstance.delete(`/v1/songs/${song._id}/like`);
      else await axiosInstance.post(`/v1/songs/${song._id}/like`);
    } catch {
      await get().fetchLikedSongs();
    }
  },

  reset: () => set({ likedSongs: [], likedIds: new Set(), isLoaded: false }),
}));
