import {
  Album,
  ArrowUpRight,
  Clapperboard,
  Disc3,
  Eye,
  Headphones,
  ListMusic,
  Mic2,
  Music,
  Play,
  Podcast as PodcastIcon,
  Plus,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useMusicStore } from "@/stores/useMusicStore";
import { useUser } from "@/providers/AuthProvider";
import { getFallbackArtwork } from "@/lib/songArtwork";
import { formatDuration, formatNumber, formatRelativeDate } from "@/lib/media";
import { Tag } from "./componants/AdminUI";

const AdminDashboard = () => {
  const { stats, songs, albums, adminPodcasts, adminVideos } = useMusicStore();
  const { user } = useUser();

  const firstName = user?.fullName?.split(" ")[0] || "Admin";

  const statCards = [
    { to: "/admin/songs", icon: Music, label: "Songs", value: stats.totalSongs, accent: "text-emerald-400", glow: "from-emerald-500/20" },
    { to: "/admin/podcasts", icon: PodcastIcon, label: "Podcasts", value: stats.totalPodcasts ?? adminPodcasts.length, accent: "text-[#1ed760]", glow: "from-[#1ed760]/20" },
    { to: "/admin/videos", icon: Clapperboard, label: "Videos", value: stats.totalVideos ?? adminVideos.length, accent: "text-violet-400", glow: "from-violet-500/20" },
    { to: "/admin/albums", icon: Disc3, label: "Albums", value: stats.totalAlbums, accent: "text-amber-300", glow: "from-amber-500/20" },
    { to: "/admin/artists", icon: Mic2, label: "Artists", value: stats.totalArtists, accent: "text-orange-400", glow: "from-orange-500/20" },
    { to: "/admin/users", icon: Users, label: "Users", value: stats.totalUsers, accent: "text-blue-400", glow: "from-blue-500/20" },
  ];

  const contentTotal = songs.length + adminPodcasts.length + adminVideos.length;
  const mix = [
    { label: "Songs", count: songs.length, color: "bg-emerald-400" },
    { label: "Podcasts", count: adminPodcasts.length, color: "bg-[#1ed760]" },
    { label: "Videos", count: adminVideos.length, color: "bg-violet-400" },
  ];

  const recentUploads = useMemo(() => {
    const items = [
      ...songs.map((song) => ({
        id: `song-${song._id}`,
        title: song.title,
        subtitle: song.artist,
        image: song.imageUrl,
        type: "Song" as const,
        to: "/admin/songs",
        createdAt: song.createdAt,
        meta: formatDuration(song.duration),
      })),
      ...adminPodcasts.map((podcast) => ({
        id: `podcast-${podcast._id}`,
        title: podcast.title,
        subtitle: podcast.showName,
        image: podcast.coverUrl || podcast.videoThumbnailUrl || "",
        type: "Podcast" as const,
        to: "/admin/podcasts",
        createdAt: podcast.createdAt,
        meta: formatDuration(podcast.duration),
      })),
      ...adminVideos.map((video) => ({
        id: `video-${video._id}`,
        title: video.title,
        subtitle: video.creator,
        image: video.thumbnailUrl || "",
        type: "Video" as const,
        to: "/admin/videos",
        createdAt: video.createdAt,
        meta: formatDuration(video.duration),
      })),
    ];
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6);
  }, [songs, adminPodcasts, adminVideos]);

  const topSongs = useMemo(
    () => [...songs].sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, 5),
    [songs],
  );

  const typeStyles = {
    Song: { icon: Music, className: "bg-emerald-500/15 text-emerald-300" },
    Podcast: { icon: PodcastIcon, className: "bg-[#1ed760]/15 text-[#1ed760]" },
    Video: { icon: Clapperboard, className: "bg-violet-500/15 text-violet-300" },
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#153b26] via-[#101f17] to-[#0c0c0c] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 size-72 rounded-full bg-[#1ed760]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 size-64 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#1ed760]">
              <Sparkles className="size-3.5" /> Beat Studio
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Welcome back, {firstName}</h1>
            <p className="mt-2 max-w-xl text-sm text-zinc-400">
              You have <span className="font-semibold text-white">{formatNumber(contentTotal)}</span> pieces of content across songs, podcasts and videos.
              Keep the feed fresh with a new upload.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link to="/admin/songs?new=1" className="inline-flex items-center gap-2 rounded-full bg-[#1ed760] px-4 py-2.5 text-sm font-bold text-black transition-transform hover:scale-[1.02]">
                <Music className="size-4" /> Upload song
              </Link>
              <Link to="/admin/podcasts?new=1" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/10">
                <PodcastIcon className="size-4 text-[#1ed760]" /> Upload podcast
              </Link>
              <Link to="/admin/videos?new=1" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/10">
                <Clapperboard className="size-4 text-violet-300" /> Upload video
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
            {mix.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-black/20 px-3.5 py-3 backdrop-blur">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  <span className={`size-1.5 rounded-full ${item.color}`} /> {item.label}
                </p>
                <p className="mt-1 text-xl font-bold text-white">{formatNumber(item.count)}</p>
              </div>
            ))}
            <div className="rounded-2xl border border-white/10 bg-black/20 px-3.5 py-3 backdrop-blur">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                <Headphones className="size-3 text-[#1ed760]" /> Plays
              </p>
              <p className="mt-1 text-xl font-bold text-white">{formatNumber(stats.totalPlays)}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            to={stat.to}
            className={`group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br ${stat.glow} via-[#181818] to-[#181818] p-4 transition-all hover:-translate-y-0.5 hover:border-white/20`}
          >
            <div className="flex items-center justify-between">
              <div className="grid size-9 place-items-center rounded-xl bg-black/30">
                <stat.icon className={`size-[18px] ${stat.accent}`} />
              </div>
              <ArrowUpRight className="size-4 text-zinc-600 transition-colors group-hover:text-white" />
            </div>
            <p className="mt-3 text-2xl font-bold text-white">{formatNumber(stat.value)}</p>
            <p className="text-xs font-semibold text-zinc-500">{stat.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#181818] lg:col-span-2">
          <div className="flex items-center justify-between border-b border-white/[0.06] p-4 sm:px-5">
            <div>
              <h2 className="flex items-center gap-2 font-bold text-white">
                <TrendingUp className="size-4 text-[#1ed760]" /> Recent uploads
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">The latest content added by the admin team.</p>
            </div>
            <Link to="/admin/songs" className="text-xs font-bold text-zinc-400 hover:text-white">
              View all
            </Link>
          </div>

          {recentUploads.length ? (
            <ul className="divide-y divide-white/[0.05]">
              {recentUploads.map((item) => {
                const style = typeStyles[item.type];
                return (
                  <li key={item.id}>
                    <Link to={item.to} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03] sm:px-5">
                      <img
                        src={item.image || getFallbackArtwork(item.title)}
                        onError={(event) => {
                          event.currentTarget.src = getFallbackArtwork(item.title);
                        }}
                        alt={item.title}
                        className={`size-10 shrink-0 object-cover ${item.type === "Podcast" ? "rounded-lg" : "rounded-md"}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                        <p className="truncate text-xs text-zinc-500">{item.subtitle}</p>
                      </div>
                      <span className="hidden text-xs text-zinc-500 sm:block">{item.meta}</span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${style.className}`}>
                        <style.icon className="size-3" /> {item.type}
                      </span>
                      <span className="hidden w-16 text-right text-[11px] text-zinc-600 md:block">{formatRelativeDate(item.createdAt)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-5 py-14 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-white/[0.05] text-zinc-500">
                <ListMusic className="size-5" />
              </div>
              <p className="mt-3 text-sm font-semibold text-zinc-300">Nothing uploaded yet</p>
              <p className="mt-1 text-xs text-zinc-500">Use the upload menu above to add your first song, podcast or video.</p>
            </div>
          )}
        </section>

        <div className="space-y-5">
          <section className="rounded-2xl border border-white/[0.07] bg-[#181818] p-5">
            <h2 className="flex items-center gap-2 font-bold text-white">
              <Sparkles className="size-4 text-[#1ed760]" /> Quick actions
            </h2>
            <div className="mt-4 space-y-1.5">
              {[
                { to: "/admin/songs?new=1", label: "Upload a song", icon: Music, accent: "text-emerald-400" },
                { to: "/admin/podcasts?new=1", label: "Upload a podcast episode", icon: PodcastIcon, accent: "text-[#1ed760]" },
                { to: "/admin/videos?new=1", label: "Upload a video", icon: Clapperboard, accent: "text-violet-300" },
                { to: "/admin/albums?new=1", label: "Create an album", icon: Album, accent: "text-amber-300" },
              ].map((action) => (
                <Link
                  key={action.to}
                  to={action.to}
                  className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.05] hover:text-white"
                >
                  <div className="grid size-8 place-items-center rounded-lg bg-white/[0.05]">
                    <action.icon className={`size-4 ${action.accent}`} />
                  </div>
                  {action.label}
                  <Plus className="ml-auto size-3.5 text-zinc-600" />
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/[0.07] bg-[#181818] p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-bold text-white">
                <Play className="size-4 text-[#1ed760]" /> Top songs
              </h2>
              <Link to="/admin/songs" className="text-[11px] font-bold text-zinc-500 hover:text-white">
                See all
              </Link>
            </div>
            {topSongs.length ? (
              <ul className="mt-3 space-y-1">
                {topSongs.map((song, index) => (
                  <li key={song._id} className="flex items-center gap-3 rounded-lg px-1 py-1.5">
                    <span className="w-3 text-center text-xs font-bold text-zinc-600">{index + 1}</span>
                    <img
                      src={song.imageUrl || getFallbackArtwork(song.title)}
                      onError={(event) => {
                        event.currentTarget.src = getFallbackArtwork(song.title);
                      }}
                      alt={song.title}
                      className="size-9 rounded object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-white">{song.title}</p>
                      <p className="truncate text-[11px] text-zinc-500">{song.artist}</p>
                    </div>
                    <span className="text-[11px] font-medium text-zinc-500">{formatNumber(song.plays)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-8 text-center text-xs text-zinc-500">Song plays will show up here.</p>
            )}
          </section>

          <section className="rounded-2xl border border-white/[0.07] bg-[#181818] p-5">
            <h2 className="flex items-center gap-2 font-bold text-white">
              <Eye className="size-4 text-blue-400" /> Play breakdown
            </h2>
            <div className="mt-4 space-y-3">
              {[
                { label: "Song plays", value: stats.songPlays ?? 0, color: "bg-emerald-400" },
                { label: "Podcast plays", value: stats.podcastPlays ?? 0, color: "bg-[#1ed760]" },
                { label: "Video views", value: stats.videoViews ?? 0, color: "bg-violet-400" },
              ].map((row) => {
                const max = Math.max(stats.songPlays ?? 0, stats.podcastPlays ?? 0, stats.videoViews ?? 0, 1);
                return (
                  <div key={row.label}>
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <span className="text-zinc-400">{row.label}</span>
                      <span className="font-semibold text-white">{formatNumber(row.value)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <div className={`h-full rounded-full ${row.color}`} style={{ width: `${Math.max((row.value / max) * 100, row.value > 0 ? 4 : 0)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      <section className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-white/[0.07] bg-[#181818] p-5 sm:flex-row sm:items-center">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-white">
            <Disc3 className="size-4 text-amber-300" /> {albums.length} albums published
          </p>
          <p className="mt-1 text-xs text-zinc-500">Organize releases and manage track lists from the album library.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tag tone="green">{formatNumber(songs.length)} songs</Tag>
          <Tag tone="violet">{formatNumber(adminVideos.length)} videos</Tag>
          <Tag tone="blue">{formatNumber(adminPodcasts.length)} episodes</Tag>
        </div>
        <Link to="/admin/albums" className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-black transition-transform hover:scale-[1.02]">
          Manage albums <ArrowUpRight className="size-3.5" />
        </Link>
      </section>
    </div>
  );
};

export default AdminDashboard;
