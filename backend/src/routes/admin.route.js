import { Router } from "express";
import { protectRoute, requireAdmin } from "../middleware/auth.middleware.js";
import {
    checkAdmin,
    createAlbum,
    createSong,
    deleteAlbum,
    deleteSong,
    updateSong,
    updateAlbum,
    addSongsToAlbum,
    removeSongFromAlbum,
    getArtists,
    getUsers,
    deleteArtist,
    updateUserPlan,
} from "../controller/admin.controller.js";
import {
    createPodcast,
    createVideo,
    deletePodcast,
    deleteVideo,
    getMediaLibrary,
    listPodcasts,
    listVideos,
    updatePodcast,
    updateVideo,
} from "../controller/media.controller.js";

const router = Router()
router.use(protectRoute, requireAdmin)
router.get("/check", checkAdmin)
router.get("/artists", getArtists)
router.get("/users", getUsers)
router.patch("/users/:id/plan", updateUserPlan)
router.get("/overview", getMediaLibrary)

router.post('/songs' , createSong)
router.put('/songs/:id' , updateSong)
router.delete('/songs/:id' , deleteSong)

router.post('/albums' , createAlbum)
router.put('/albums/:id' , updateAlbum)
router.delete('/albums/:id' , deleteAlbum)
router.post('/albums/:id/songs' , addSongsToAlbum)
router.delete('/albums/:id/songs/:songId' , removeSongFromAlbum)
router.delete('/artists/:name' , deleteArtist)

router.get('/podcasts', listPodcasts)
router.post('/podcasts', createPodcast)
router.put('/podcasts/:id', updatePodcast)
router.delete('/podcasts/:id', deletePodcast)

router.get('/videos', listVideos)
router.post('/videos', createVideo)
router.put('/videos/:id', updateVideo)
router.delete('/videos/:id', deleteVideo)

export default router
