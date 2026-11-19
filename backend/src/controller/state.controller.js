import { Song } from '../models/song.models.js'
import { Album } from '../models/album.models.js'
import { User } from '../models/user.models.js'
import { Podcast } from '../models/podcast.models.js'
import { Video } from '../models/video.models.js'

export const getStats = async (req,res,next)=>{
    try {
        const [
            totalSongs,
            totalUsers,
            totalAlbums,
            totalPodcasts,
            totalVideos,
            uniqueArtists,
            songPlays,
            podcastPlays,
            videoViews,
        ] = await Promise.all([
            Song.countDocuments(),
            User.countDocuments(),
            Album.countDocuments(),
            Podcast.countDocuments(),
            Video.countDocuments(),

            Song.aggregate([
                {
                    $unionWith: {
                        coll : "albums",
                        pipeline : []
                    }
                },
                {
                    $group : {
                        _id : "$artist",
                    }
                },
                {
                    $count : "count",
                }
            ]),
            Song.aggregate([{ $group: { _id: null, total: { $sum: "$plays" } } }]),
            Podcast.aggregate([{ $group: { _id: null, total: { $sum: "$plays" } } }]),
            Video.aggregate([{ $group: { _id: null, total: { $sum: "$views" } } }]),
        ]);

        const plays = songPlays[0]?.total || 0
        const podcastPlayCount = podcastPlays[0]?.total || 0
        const videoViewCount = videoViews[0]?.total || 0

        res.status(200).json({
            totalSongs,
            totalAlbums,
            totalUsers,
            totalPodcasts,
            totalVideos,
            totalArtists : uniqueArtists[0]?.count || 0,
            totalPlays: plays + podcastPlayCount + videoViewCount,
            songPlays: plays,
            podcastPlays: podcastPlayCount,
            videoViews: videoViewCount,
        })
    } catch (error) {
        next(error);
    }
}
