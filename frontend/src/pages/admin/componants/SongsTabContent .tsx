import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Disc3, Music, PlayCircle, Plus, Sparkles } from "lucide-react";
import { useMusicStore } from "@/stores/useMusicStore";
import { formatDurationLong, formatNumber } from "@/lib/media";
import AddSongModal from "./AddSongModal";
import SongsTable from "./SongsTable";
import { AdminSearch, PageIntro, primaryButtonClass } from "./AdminUI";

const SongsTabContent = () => {
  const { songs, albums, stats } = useMusicStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [artistFilter, setArtistFilter] = useState("all");

  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    setIsModalOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete("new");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const artistOptions = useMemo(
    () => Array.from(new Set(songs.map((song) => song.artist).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [songs],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return songs.filter((song) => {
      if (artistFilter !== "all" && song.artist !== artistFilter) return false;
      if (!query) return true;
      return [song.title, song.artist, song.genre]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [songs, search, artistFilter]);

  const summary = useMemo(() => {
    const totalSeconds = songs.reduce((sum, song) => sum + (song.duration || 0), 0);
    const videos = songs.filter((song) => song.videoUrl).length;
    const withAlbum = new Set(songs.map((song) => song.albumId).filter(Boolean)).size;
    return { totalSeconds, videos, withAlbum };
  }, [songs]);

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Music library"
        title="Songs"
        description={`${songs.length} tracks • ${formatDurationLong(summary.totalSeconds)} of audio in your catalog.`}
        icon={Music}
        actions={
          <button type="button" onClick={() => setIsModalOpen(true)} className={primaryButtonClass}>
            <Plus className="size-4" /> Upload song
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total tracks", value: formatNumber(songs.length), icon: Music, accent: "text-[#1ed760]" },
          { label: "Total plays", value: formatNumber(stats.songPlays ?? songs.reduce((sum, song) => sum + (song.plays || 0), 0)), icon: PlayCircle, accent: "text-blue-400" },
          { label: "Albums covered", value: formatNumber(summary.withAlbum), icon: Disc3, accent: "text-amber-400" },
          { label: "Video previews", value: formatNumber(summary.videos), icon: Sparkles, accent: "text-violet-400" },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-white/[0.07] bg-[#181818] p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-zinc-500">{item.label}</p>
              <item.icon className={`size-4 ${item.accent}`} />
            </div>
            <p className="mt-2 text-2xl font-bold text-white">{item.value}</p>
          </div>
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#181818]">
        <div className="flex flex-col gap-3 border-b border-white/[0.07] p-4 sm:flex-row sm:items-center sm:justify-between">
          <AdminSearch value={search} onChange={setSearch} placeholder="Search songs, artists or genre..." />
          <select
            value={artistFilter}
            onChange={(event) => setArtistFilter(event.target.value)}
            aria-label="Filter by artist"
            className="h-10 rounded-full border border-white/10 bg-[#202020] px-3.5 text-xs font-semibold text-zinc-300 outline-none focus:border-[#1ed760]/60"
          >
            <option value="all">All artists</option>
            {artistOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <SongsTable songs={filtered} isFiltered={Boolean(search.trim()) || artistFilter !== "all"} />
      </section>

      <AddSongModal open={isModalOpen} onClose={() => setIsModalOpen(false)} albums={albums} />
    </div>
  );
};

export default SongsTabContent;
