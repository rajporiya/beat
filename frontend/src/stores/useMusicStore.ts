import { axiosInstance } from "@/lib/axios";
import type { Album, Podcast, Song, Stats, User, VideoMedia } from "@/types";
import { create } from "zustand";

interface MusicStore {
    songs : Song[],
    albums : Album[]
    artists : string[]
    users : User[]
    podcasts : Podcast[]
    videos : VideoMedia[]
    adminPodcasts : Podcast[]
    adminVideos : VideoMedia[]
    isLoading: boolean;
    err: string | null;
    curruntAlbum : Album | null;

    fetchAlbums: () => Promise<void>;
    fetchAlbumId : (id :string) => Promise<void>
    fetchFeatureSong :  () => Promise<void>
    fetchMadeForYouSong :  () => Promise<void>
    fetchTrendingSong :  () => Promise<void>
    fetchSongs :  () => Promise<void>
    fetchStats : () =>  Promise<void>
    fetchArtists : () =>  Promise<void>
    fetchUsers : () =>  Promise<void>
    fetchPodcasts : () => Promise<void>
    fetchVideos : () => Promise<void>
    fetchAdminPodcasts : () => Promise<void>
    fetchAdminVideos : () => Promise<void>
    updateUserPlan : (id : string, plan : string) => Promise<boolean>


    madeForYouSongs : Song[];
    featureSong : Song[];
    trendingSong : Song[];
    stats  : Stats

    
}

export const useMusicStore = create<MusicStore>((set)=>({
    albums : [],
    songs : [],
    artists : [],
    users : [],
    podcasts : [],
    videos : [],
    adminPodcasts : [],
    adminVideos : [],
    isLoading : false,
    err : null,
    curruntAlbum : null,
    madeForYouSongs : [],
    featureSong : [],
    trendingSong : [],
    stats :{
        totalSongs : 0,
        totalAlbums : 0,
        totalUsers : 0,
        totalArtists : 0,
        totalPodcasts : 0,
        totalVideos : 0,
        totalPlays : 0,
        songPlays : 0,
        podcastPlays : 0,
        videoViews : 0,
    },
    // isSongsLoading : false ,
    // isStatsLoading : false ,

    fetchAlbums : async ()=>{
        // data fetching
        set({ isLoading : true, err: null })
        try {
            const res = await axiosInstance.get("/album")
            set({ albums : res.data})
        } catch (error : any) {
            set({ err: error.response?.data?.message ?? "Failed to fetch albums" })
        }finally{
            set({ isLoading : false})
        }
    },
    
    fetchAlbumId :async (id : string ) => {
        set ( { isLoading : true, err : null, curruntAlbum: null })
        try {
            const responce = await axiosInstance.get(`/album/${id}`);
            set({curruntAlbum: responce.data})
        } catch (error : any) {
            set({
                err: error.response?.data?.message ?? "Failed to fetch album",
                curruntAlbum: null })
        }
        finally{
            set({isLoading : false})
        }
    },

    fetchFeatureSong : async () => {
        set({isLoading : true, err : null})
        try {
            const responce  = await axiosInstance.get("/song/featured")
            set({ featureSong : responce.data})
        } catch (error : any) {
            set({
                err: error.response?.data?.message ?? "Failed to fetch feature song",
                curruntAlbum: null })
        }finally{
            set({isLoading : false})
        }
    },
    
    fetchTrendingSong : async () => {
        set({isLoading : true, err : null})
        try {
            const responce  = await axiosInstance.get("/song/trending")
            set({ trendingSong : responce.data})
        } catch (error : any) {
            set({
                err: error.response?.data?.message ?? "Failed to fetch trending songs",
                curruntAlbum: null })
        }finally{
            set({isLoading : false})
        }
    },

    fetchMadeForYouSong : async () => {
        set({isLoading : true, err : null})
        try {
            const responce  = await axiosInstance.get("/song/made-for-you")
            set({ madeForYouSongs : responce.data})
        } catch (error : any) {
            set({
                err: error.response?.data?.message ?? "Failed to fetch made-for-you songs",
                curruntAlbum: null })
        }finally{
            set({isLoading : false})
        }
    },
    fetchSongs : async ()=>{
        set({ isLoading : true, err : null})
        try {
            const responce  = await axiosInstance.get("/song")
            set({ songs : responce.data})
        } catch (error : any) {
            set({ err: error.message })
        }finally{
            set({isLoading : false})
        }
    },
fetchStats : async ()=>{
        set({ isLoading : true, err : null})
        try {
            const responce  = await axiosInstance.get("/stats")
             set({ stats : responce.data})
        } catch (error : any) {
            set({ err: error.message })
        }finally{
            set({isLoading : false})
        }
    },
    fetchArtists : async ()=>{
        try {
            const responce  = await axiosInstance.get("/admin/artists")
            set({ artists : responce.data })
        } catch (error : any) {
            console.error("Failed to fetch artists:", error.response?.data?.message ?? error.message)
        }
    },
    fetchUsers : async ()=>{
        try {
            const responce  = await axiosInstance.get("/admin/users")
            set({ users : responce.data })
        } catch (error : any) {
            console.error("Failed to fetch users:", error.response?.data?.message ?? error.message)
        }
    },
    fetchPodcasts : async ()=>{
        try {
            const responce  = await axiosInstance.get("/podcast")
            set({ podcasts : Array.isArray(responce.data) ? responce.data : [] })
        } catch (error : any) {
            console.error("Failed to fetch podcasts:", error.response?.data?.message ?? error.message)
        }
    },
    fetchVideos : async ()=>{
        try {
            const responce  = await axiosInstance.get("/video")
            set({ videos : Array.isArray(responce.data) ? responce.data : [] })
        } catch (error : any) {
            console.error("Failed to fetch videos:", error.response?.data?.message ?? error.message)
        }
    },
    fetchAdminPodcasts : async ()=>{
        try {
            const responce  = await axiosInstance.get("/admin/podcasts")
            set({ adminPodcasts : Array.isArray(responce.data) ? responce.data : [] })
        } catch (error : any) {
            console.error("Failed to fetch admin podcasts:", error.response?.data?.message ?? error.message)
        }
    },
    fetchAdminVideos : async ()=>{
        try {
            const responce  = await axiosInstance.get("/admin/videos")
            set({ adminVideos : Array.isArray(responce.data) ? responce.data : [] })
        } catch (error : any) {
            console.error("Failed to fetch admin videos:", error.response?.data?.message ?? error.message)
        }
    },
    updateUserPlan : async (id, plan) => {
        try {
            const response = await axiosInstance.patch(`/admin/users/${id}/plan`, { plan })
            set((state) => ({
                users: state.users.map((user) => user._id === id ? { ...user, ...response.data } : user)
            }))
            return true
        } catch (error : any) {
            console.error("Failed to update plan:", error.response?.data?.message ?? error.message)
            return false
        }
    }
}))
