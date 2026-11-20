import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";

interface FollowStore {
  artists: string[];
  isLoaded: boolean;
  fetchFollows: () => Promise<void>;
  toggleFollow: (artist: string) => Promise<void>;
  reset: () => void;
}

export const useFollowStore = create<FollowStore>((set, get) => ({
  artists: [],
  isLoaded: false,

  fetchFollows: async () => {
    try {
      const res = await axiosInstance.get("/v1/follows");
      const artists: string[] = Array.isArray(res.data?.data?.artists) ? res.data.data.artists : [];
      set({ artists, isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },

  toggleFollow: async (artist) => {
    const following = get().artists.includes(artist);

    set((state) => ({
      artists: following
        ? state.artists.filter((name) => name !== artist)
        : [artist, ...state.artists],
    }));

    try {
      const url = `/v1/follows/artists/${encodeURIComponent(artist)}`;
      if (following) await axiosInstance.delete(url);
      else await axiosInstance.put(url);
    } catch {
      await get().fetchFollows();
    }
  },

  reset: () => set({ artists: [], isLoaded: false }),
}));
