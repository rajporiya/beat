import {Song} from '../models/song.models.js'
import { Album } from '../models/album.models.js'
import { User } from '../models/user.models.js'
import { Subscription } from '../models/subscription.models.js'
import { PLAN_CATALOG } from '../config/plans.js'
import { parseBoolean, removeTempFiles, uploadToCloudinary as uploadFile } from '../lib/upload.js'

const uploadToCloudinary = async (file, folder = "beat-music") => {
    try {
        const result = await uploadFile(file, { folder })
        return result.url
    } catch (error) {
        console.log("Error in uploadCloudinary ", error);
        throw new Error(`uploadCloudinary: ${error.message}`)
    }
}

export const createSong = async (req,res, next) => {
   try {
    if (!req.files || !req.files.audioFile || !req.files.imageFile){
        return res.status(400).json({
            message : "Please upload both an audio file and an image file"
        })
    }
    const { title, artist, albumId, duration, videoUrl, genre, isExplicit }= req.body
    if(!title || !artist){
        return res.status(400).json({message : "Title and artist are required"})
    }
    const audioUrl = await uploadToCloudinary(req.files.audioFile, "beat-music/songs/audio")
    const imageUrl = await uploadToCloudinary(req.files.imageFile, "beat-music/songs/covers")
    let previewVideoUrl = typeof videoUrl === "string" ? videoUrl.trim() : ""
    if (req.files.videoFile) {
        previewVideoUrl = await uploadToCloudinary(req.files.videoFile, "beat-music/songs/video")
    }
    const song = new Song({
        title: String(title).trim(),
        artist: String(artist).trim(),
        imageUrl,
        audioUrl,
        videoUrl: previewVideoUrl,
        duration: Number(duration) || 0,
        albumId: albumId || null,
        genre: typeof genre === "string" ? genre.trim() : "",
        isExplicit: parseBoolean(isExplicit),
    })

    await song.save()
    if(albumId){
        await Album.findByIdAndUpdate(albumId,{
            $push : { songs : song._id},
        })
    }
    res.status(201).json(song)
   } catch (error) {
    await removeTempFiles(req.files)
    console.log("error createSong", error.message);
    res.status(500).json({message: "Failed to create song", error: error?.message})
   }
}

export const updateSong = async (req, res, next) => {
    try {
        const { id } = req.params
        const song = await Song.findById(id)
        if (!song) {
            return res.status(404).json({ message: "Song not found" })
        }

        const { title, artist, albumId, duration, genre, isExplicit } = req.body || {}
        const previousAlbumId = song.albumId ? String(song.albumId) : ""

        if (typeof title === "string" && title.trim()) song.title = title.trim()
        if (typeof artist === "string" && artist.trim()) song.artist = artist.trim()
        if (duration !== undefined) song.duration = Number(duration) || song.duration
        if (typeof genre === "string") song.genre = genre.trim()
        if (isExplicit !== undefined) song.isExplicit = parseBoolean(isExplicit)

        if (req.files?.audioFile) {
            song.audioUrl = await uploadToCloudinary(req.files.audioFile, "beat-music/songs/audio")
        }
        if (req.files?.imageFile) {
            song.imageUrl = await uploadToCloudinary(req.files.imageFile, "beat-music/songs/covers")
        }
        if (req.files?.videoFile) {
            song.videoUrl = await uploadToCloudinary(req.files.videoFile, "beat-music/songs/video")
        }

        if (albumId !== undefined) {
            const nextAlbumId = typeof albumId === "string" && albumId.trim() ? albumId.trim() : null
            song.albumId = nextAlbumId

            if (previousAlbumId && previousAlbumId !== nextAlbumId) {
                await Album.findByIdAndUpdate(previousAlbumId, { $pull: { songs: song._id } })
            }
            if (nextAlbumId && nextAlbumId !== previousAlbumId) {
                await Album.findByIdAndUpdate(nextAlbumId, { $addToSet: { songs: song._id } })
            }
        }

        await song.save()
        res.status(200).json(song)
    } catch (error) {
        await removeTempFiles(req.files)
        console.log("error update song", error.message)
        res.status(500).json({ message: "Failed to update song", error: error?.message })
    }
}

export const deleteSong = async (req,res, next) => {
    try {
        const { id } = req.params

        const song = await Song.findById(id)
        if(!song){
            return res.status(404).json({message : "Song not found"})
        }

        // if  song from album
        if(song.albumId){
            await Album.findByIdAndUpdate(song.albumId, {
                $pull : { songs : song._id},
            })
        }
        await Song.findByIdAndDelete(id)
        res.status(200).json({message : "Song deleted successfully"})
    } catch (error) {
        console.log("error from delete song", error);
        
        next(error)
    }
}

export const createAlbum  = async (req,res, next) => {
    try {
        const { title, artist, releaseYear }= req.body 
        if(!title || !artist){
            return res.status(400).json({message : "Title and artist are required"})
        }
        let imageUrl = ""
        if (req.files?.imageFile){
            imageUrl = await uploadToCloudinary(req.files.imageFile, "beat-music/albums/covers")
        }
        const album = new Album({
            title,
            artist,
            imageUrl,
            releaseYear: Number(releaseYear) || new Date().getFullYear()
        })

        await album.save()
        res.status(201).json(album)
    } catch (error) {
        await removeTempFiles(req.files)
        console.log("error from create album", error.message);
        res.status(500).json({message: "Failed to create album", error: error?.message})
    }
}

export const updateAlbum = async (req,res, next) => {
    try {
        const { id } = req.params
        const { title, artist, releaseYear } = req.body

        const album = await Album.findById(id)
        if(!album){
            return res.status(404).json({ message : "Album not found" })
        }
        if (title?.trim()) album.title = title.trim()
        if (artist?.trim()) album.artist = artist.trim()
        if (releaseYear) album.releaseYear = Number(releaseYear) || album.releaseYear
        if (req.files?.imageFile){
            album.imageUrl = await uploadToCloudinary(req.files.imageFile, "beat-music/albums/covers")
        }
        await album.save()

        const populated = await Album.findById(id).populate("songs")
        res.status(200).json(populated)
    } catch (error) {
        await removeTempFiles(req.files)
        console.log("error from update album", error.message);
        res.status(500).json({ message: "Failed to update album", error: error?.message })
    }
}

export const addSongsToAlbum = async (req,res, next) => {
    try {
        const { id } = req.params
        const { songIds } = req.body

        const album = await Album.findById(id)
        if(!album){
            return res.status(404).json({ message : "Album not found" })
        }
        const ids = Array.isArray(songIds) ? songIds : []
        if(!ids.length){
            return res.status(400).json({ message : "songIds array is required" })
        }

        await Song.updateMany(
            { _id: { $in: ids } },
            { $set: { albumId: id } }
        )
        await Album.findByIdAndUpdate(id, { $addToSet: { songs: { $each: ids } } })

        const populated = await Album.findById(id).populate("songs")
        res.status(200).json(populated)
    } catch (error) {
        console.log("error add songs to album", error.message);
        res.status(500).json({ message: "Failed to add songs to album", error: error?.message })
    }
}

export const removeSongFromAlbum = async (req,res, next) => {
    try {
        const { id, songId } = req.params

        const album = await Album.findById(id)
        if(!album){
            return res.status(404).json({ message : "Album not found" })
        }
        await Album.findByIdAndUpdate(id, { $pull: { songs: songId } })
        await Song.findByIdAndUpdate(songId, { $set: { albumId: null } })

        const populated = await Album.findById(id).populate("songs")
        res.status(200).json(populated)
    } catch (error) {
        console.log("error remove song from album", error.message);
        res.status(500).json({ message: "Failed to remove song from album", error: error?.message })
    }
}

export const deleteAlbum = async (req,res, next) => {
    try {
        const { id } = req.params
        await Song.deleteMany({ albumId : id})
        await Album.findByIdAndDelete(id)

        res.status(200).json({message : "Album deleted successfully"})
    } catch (error) {
        console.log("error from album song", error.message);
        next(error);
    }
}

export const getArtists = async (req,res, next) => {
    try {
        const artists = await Song.aggregate([
            {
                $unionWith: {
                    coll : "albums",
                    pipeline : [],
                }
            },
            {
                $match: {
                    artist: { $type: "string", $ne: "" },
                }
            },
            {
                $group: {
                    _id: "$artist",
                }
            },
            {
                $sort: { _id: 1 }
            }
        ])
        res.status(200).json(artists.map((item) => item._id))
    } catch (error) {
        console.log("error from get artists", error.message);
        next(error)
    }
}

export const getUsers = async (req,res, next) => {
    try {
        const users = await User.find().select("-password").sort({ createdAt: -1 })
        res.status(200).json(users)
    } catch (error) {
        console.log("error from get users", error.message);
        next(error)
    }
}

export const updateUserPlan = async (req,res, next) => {
    try {
        const { plan } = req.body ?? {}
        if (!PLAN_CATALOG[plan]) {
            return res.status(400).json({ message: "Plan must be free, basic, premium or pro" })
        }

        const now = new Date()
        const updates = {
            plan,
            planBillingCycle: "monthly",
            planStartedAt: plan === "free" ? null : now,
            planExpiresAt: null,
            planCanceledAt: plan === "free" ? now : null,
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true, runValidators: true },
        ).select("-password")

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        // Admin plan changes are complimentary — end any paid auto-renewing
        // subscription so billing and the visible plan stay in sync.
        await Subscription.updateMany(
            { user: user._id, status: "active" },
            { $set: { status: "canceled", canceledAt: now, autoRenew: false } },
        )

        res.status(200).json(user)
    } catch (error) {
        console.log("error update user plan", error.message);
        next(error)
    }
}

export const deleteArtist = async (req,res, next) => {
    try {
        const { name } = req.params
        const artistName = decodeURIComponent(name)

        const songs = await Song.find({ artist: artistName })
        const songIds = songs.map((song) => song._id)

        await Promise.all([
            Album.updateMany({ songs: { $in: songIds } }, { $pull: { songs: { $in: songIds } } }),
            Song.deleteMany({ artist: artistName }),
            Album.deleteMany({ artist: artistName }),
        ])

        res.status(200).json({ message: "Artist deleted successfully" })
    } catch (error) {
        console.log("error from delete artist", error.message);
        next(error)
    }
}

export const checkAdmin = async (req,res,next) =>{
    res.status(200).json({admin:true})
}