import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Headphones, Pencil, PlayCircle, Podcast as PodcastIcon, Plus, Radio, Trash2 } from "lucide-react";
import { useMusicStore } from "@/stores/useMusicStore";
import { axiosInstance } from "@/lib/axios";
import { getFallbackArtwork } from "@/lib/songArtwork";
import type { Podcast } from "@/types";
import { formatDuration, formatNumber, formatRelativeDate } from "@/lib/media";
import AddPodcastModal from "./AddPodcastModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import MediaPreviewModal from "./MediaPreviewModal";
import { AdminSearch, EmptyState, PageIntro, StatusPill, Tag, primaryButtonClass } from "./AdminUI";

const PodcastsTabContent = () => {
  const { adminPodcasts, fetchAdminPodcasts, fetchPodcasts, fetchStats } = useMusicStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Podcast | null>(null);
  const [previewing, setPreviewing] = useState<Podcast | null>(null);
  const [podcastToDelete, setPodcastToDelete] = useState<Podcast | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    setEditing(null);
    setIsModalOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete("new");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return adminPodcasts.filter((podcast) => {
      if (statusFilter !== "all" && podcast.status !== statusFilter) return false;
      if (!query) return true;
      return [podcast.title, podcast.showName, podcast.host, podcast.category]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [adminPodcasts, search, statusFilter]);

  const stats = useMemo(() => {
    const published = adminPodcasts.filter((podcast) => podcast.status === "published").length;
    const videoEpisodes = adminPodcasts.filter((podcast) => podcast.videoUrl).length;
    const totalPlays = adminPodcasts.reduce((sum, podcast) => sum + (podcast.plays || 0), 0);
    return { published, videoEpisodes, totalPlays };
  }, [adminPodcasts]);

  const openCreate = () => {
    setEditing(null);
    setIsModalOpen(true);
  };

  const openEdit = (podcast: Podcast) => {
    setEditing(podcast);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
  };

  const confirmDelete = async () => {
    if (!podcastToDelete) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(`/admin/podcasts/${podcastToDelete._id}`);
      await Promise.all([fetchAdminPodcasts(), fetchPodcasts(), fetchStats()]);
      setPodcastToDelete(null);
    } catch (error) {
      console.error("Failed to delete podcast:", error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Podcast studio"
        title="Podcast episodes"
        description="Upload audio episodes, attach video versions and publish to the listener home feed."
        icon={PodcastIcon}
        actions={
          <button type="button" onClick={openCreate} className={primaryButtonClass}>
            <Plus className="size-4" /> Upload episode
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "All episodes", value: adminPodcasts.length, icon: PodcastIcon, accent: "text-[#1ed760]" },
          { label: "Published", value: stats.published, icon: Radio, accent: "text-emerald-400" },
          { label: "Video episodes", value: stats.videoEpisodes, icon: PlayCircle, accent: "text-violet-400" },
          { label: "Total plays", value: formatNumber(stats.totalPlays), icon: Headphones, accent: "text-blue-400" },
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
          <AdminSearch value={search} onChange={setSearch} placeholder="Search episodes, shows or hosts..." />
          <div className="flex items-center gap-2">
            {(["all", "published", "draft"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
                className={
                  statusFilter === value
                    ? "rounded-full bg-[#1ed760] px-3.5 py-1.5 text-xs font-bold text-black"
                    : "rounded-full bg-white/[0.06] px-3.5 py-1.5 text-xs font-bold text-zinc-400 hover:bg-white/10 hover:text-white"
                }
              >
                {value === "all" ? "All" : value === "published" ? "Published" : "Drafts"}
              </button>
            ))}
          </div>
        </div>

        {filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.07] text-[11px] uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-3 font-semibold">Episode</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Duration</th>
                  <th className="px-4 py-3 font-semibold">Plays</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Published</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((podcast) => (
                  <tr key={podcast._id} className="group border-b border-white/[0.04] transition-colors last:border-0 hover:bg-white/[0.025]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-[#242424]">
                          <img
                            src={podcast.coverUrl || podcast.videoThumbnailUrl || getFallbackArtwork(podcast.title)}
                            onError={(event) => {
                              event.currentTarget.src = getFallbackArtwork(podcast.title);
                            }}
                            alt={podcast.title}
                            className="size-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="max-w-[280px] truncate font-semibold text-white">{podcast.title}</p>
                          <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-zinc-500">
                            {podcast.showName}
                            {podcast.featured && <Tag tone="green">Featured</Tag>}
                            {podcast.videoUrl && <Tag tone="violet">Video</Tag>}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{podcast.category || "Talk"}</td>
                    <td className="px-4 py-3 text-zinc-400">{formatDuration(podcast.duration)}</td>
                    <td className="px-4 py-3 text-zinc-400">{formatNumber(podcast.plays)}</td>
                    <td className="px-4 py-3">
                      <StatusPill status={podcast.status} />
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{formatRelativeDate(podcast.publishDate || podcast.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setPreviewing(podcast)}
                          aria-label={`Preview ${podcast.title}`}
                          className="grid size-8 place-items-center rounded-full text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          <PlayCircle className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(podcast)}
                          aria-label={`Edit ${podcast.title}`}
                          className="grid size-8 place-items-center rounded-full text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPodcastToDelete(podcast)}
                          aria-label={`Delete ${podcast.title}`}
                          className="grid size-8 place-items-center rounded-full text-zinc-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-5">
            <EmptyState
              icon={PodcastIcon}
              title={adminPodcasts.length ? "No episodes match your filters" : "No podcast episodes yet"}
              description={
                adminPodcasts.length
                  ? "Try a different search term or switch the status filter."
                  : "Upload your first episode with audio, artwork and an optional video version."
              }
              action={
                <button type="button" onClick={openCreate} className={primaryButtonClass}>
                  <Plus className="size-4" /> Upload episode
                </button>
              }
            />
          </div>
        )}
      </section>

      <AddPodcastModal open={isModalOpen} onClose={closeModal} podcast={editing} />
      <MediaPreviewModal
        open={previewing !== null}
        onClose={() => setPreviewing(null)}
        title={previewing?.title ?? ""}
        subtitle={previewing ? `${previewing.showName} • ${previewing.category}` : ""}
        imageUrl={previewing?.coverUrl || previewing?.videoThumbnailUrl}
        audioUrl={previewing?.audioUrl}
        videoUrl={previewing?.videoUrl}
        meta={
          previewing && (
            <div className="flex flex-wrap items-center gap-2">
              <Tag tone="green">{previewing.status}</Tag>
              <span>{formatDuration(previewing.duration)}</span>
              <span>•</span>
              <span>{formatNumber(previewing.plays)} plays</span>
              {previewing.isExplicit && <Tag tone="zinc">Explicit</Tag>}
            </div>
          )
        }
      />
      <ConfirmDeleteModal
        open={podcastToDelete !== null}
        title={`Delete "${podcastToDelete?.title}"?`}
        message="This permanently removes the episode from the podcast library and listener feed."
        loading={deleting}
        onCancel={() => setPodcastToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default PodcastsTabContent;
