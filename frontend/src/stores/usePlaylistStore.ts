import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import type { PlaylistSummary } from "@/types";

export interface PlaylistInput {
  name: string;
  description?: string;
  isPublic?: boolean;
}

interface PlaylistStore {
  myPlaylists: PlaylistSummary[];
  isLoaded: boolean;
  fetchMyPlaylists: () => Promise<void>;
  createPlaylist: (input: PlaylistInput) => Promise<{ _id: string; name: string }>;
  updatePlaylist: (id: string, input: Partial<PlaylistInput>) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  reset: () => void;
}

export const usePlaylistStore = create<PlaylistStore>((set, get) => ({
  myPlaylists: [],
  isLoaded: false,

  fetchMyPlaylists: async () => {
    try {
      const res = await axiosInstance.get("/v1/playlists", { params: { mine: true } });
      set({ myPlaylists: Array.isArray(res.data?.data) ? res.data.data : [], isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },

  createPlaylist: async (input) => {
    const res = await axiosInstance.post("/v1/playlists", input);
    await get().fetchMyPlaylists();
    return { _id: res.data.data._id, name: res.data.data.name };
  },

  updatePlaylist: async (id, input) => {
    await axiosInstance.patch(`/v1/playlists/${id}`, input);
    await get().fetchMyPlaylists();
  },

  deletePlaylist: async (id) => {
    await axiosInstance.delete(`/v1/playlists/${id}`);
    await get().fetchMyPlaylists();
  },

  reset: () => set({ myPlaylists: [], isLoaded: false }),
}));
