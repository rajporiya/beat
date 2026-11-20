import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Clapperboard, Eye, Pencil, PlayCircle, Plus, Sparkles, Trash2 } from "lucide-react";
import { useMusicStore } from "@/stores/useMusicStore";
import { axiosInstance } from "@/lib/axios";
import { getFallbackArtwork } from "@/lib/songArtwork";
import type { VideoMedia } from "@/types";
import { formatDuration, formatNumber, formatRelativeDate } from "@/lib/media";
import AddVideoModal from "./AddVideoModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import MediaPreviewModal from "./MediaPreviewModal";
import { AdminSearch, EmptyState, PageIntro, StatusPill, Tag, primaryButtonClass } from "./AdminUI";

const VideosTabContent = () => {
  const { adminVideos, fetchAdminVideos, fetchVideos, fetchStats } = useMusicStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<VideoMedia | null>(null);
  const [previewing, setPreviewing] = useState<VideoMedia | null>(null);
  const [videoToDelete, setVideoToDelete] = useState<VideoMedia | null>(null);
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
    return adminVideos.filter((video) => {
      if (statusFilter !== "all" && video.status !== statusFilter) return false;
      if (!query) return true;
      return [video.title, video.creator, video.category, ...(video.tags ?? [])]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [adminVideos, search, statusFilter]);

  const stats = useMemo(() => {
    const published = adminVideos.filter((video) => video.status === "published").length;
    const featured = adminVideos.filter((video) => video.featured).length;
    const views = adminVideos.reduce((sum, video) => sum + (video.views || 0), 0);
    return { published, featured, views };
  }, [adminVideos]);

  const openCreate = () => {
    setEditing(null);
    setIsModalOpen(true);
  };

  const openEdit = (video: VideoMedia) => {
    setEditing(video);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
  };

  const confirmDelete = async () => {
    if (!videoToDelete) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(`/admin/videos/${videoToDelete._id}`);
      await Promise.all([fetchAdminVideos(), fetchVideos(), fetchStats()]);
      setVideoToDelete(null);
    } catch (error) {
      console.error("Failed to delete video:", error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Video library"
        title="Videos"
        description="Upload performance clips, interviews and visual episodes for the listener video feed."
        icon={Clapperboard}
        accent="text-violet-400"
        actions={
          <button type="button" onClick={openCreate} className={`${primaryButtonClass} bg-violet-400 hover:bg-violet-300`}>
            <Plus className="size-4" /> Upload video
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "All videos", value: adminVideos.length, icon: Clapperboard, accent: "text-violet-400" },
          { label: "Published", value: stats.published, icon: Sparkles, accent: "text-emerald-400" },
          { label: "Featured", value: stats.featured, icon: PlayCircle, accent: "text-amber-400" },
          { label: "Total views", value: formatNumber(stats.views), icon: Eye, accent: "text-blue-400" },
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

      <section className="rounded-2xl border border-white/[0.07] bg-[#181818] p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <AdminSearch value={search} onChange={setSearch} placeholder="Search videos, creators or tags..." />
          <div className="flex items-center gap-2">
            {(["all", "published", "draft"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
                className={
                  statusFilter === value
                    ? "rounded-full bg-violet-400 px-3.5 py-1.5 text-xs font-bold text-black"
                    : "rounded-full bg-white/[0.06] px-3.5 py-1.5 text-xs font-bold text-zinc-400 hover:bg-white/10 hover:text-white"
                }
              >
                {value === "all" ? "All" : value === "published" ? "Published" : "Drafts"}
              </button>
            ))}
          </div>
        </div>

        {filtered.length ? (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((video) => (
              <article
                key={video._id}
                className="group overflow-hidden rounded-2xl border border-white/[0.07] bg-[#1e1e1e] transition-all hover:border-violet-400/30 hover:bg-[#222]"
              >
                <div className="relative aspect-video overflow-hidden bg-black">
                  <img
                    src={video.thumbnailUrl || getFallbackArtwork(video.title)}
                    onError={(event) => {
                      event.currentTarget.src = getFallbackArtwork(video.title);
                    }}
                    alt={video.title}
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

                  <button
                    type="button"
                    onClick={() => setPreviewing(video)}
                    aria-label={`Play ${video.title}`}
                    className="absolute inset-0 grid place-items-center"
                  >
                    <span className="grid size-12 place-items-center rounded-full bg-white/90 text-black opacity-90 shadow-xl transition-all duration-200 group-hover:scale-110 group-hover:bg-violet-400">
                      <PlayCircle className="size-6" />
                    </span>
                  </button>

                  <div className="absolute left-3 top-3">
                    <StatusPill status={video.status} />
                  </div>
                  <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => openEdit(video)}
                      aria-label={`Edit ${video.title}`}
                      className="grid size-8 place-items-center rounded-full bg-black/70 text-zinc-200 backdrop-blur hover:bg-white hover:text-black"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoToDelete(video)}
                      aria-label={`Delete ${video.title}`}
                      className="grid size-8 place-items-center rounded-full bg-black/70 text-zinc-200 backdrop-blur hover:bg-red-500 hover:text-white"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                  <span className="absolute bottom-3 right-3 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-bold text-white">
                    {formatDuration(video.duration)}
                  </span>
                  {video.featured && (
                    <span className="absolute bottom-3 left-3">
                      <Tag tone="violet">Featured</Tag>
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <p className="line-clamp-1 font-bold text-white">{video.title}</p>
                  <p className="mt-1 line-clamp-1 text-sm text-zinc-400">{video.creator}</p>
                  <div className="mt-3 flex items-center justify-between text-[11px] font-medium text-zinc-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Eye className="size-3.5" /> {formatNumber(video.views)} views
                    </span>
                    <span>{formatRelativeDate(video.publishedAt || video.createdAt)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5">
            <EmptyState
              icon={Clapperboard}
              title={adminVideos.length ? "No videos match your filters" : "No videos uploaded yet"}
              description={
                adminVideos.length
                  ? "Try a different search term or switch the status filter."
                  : "Upload your first video with a thumbnail and publish it to the video feed."
              }
              action={
                <button type="button" onClick={openCreate} className={`${primaryButtonClass} bg-violet-400 hover:bg-violet-300`}>
                  <Plus className="size-4" /> Upload video
                </button>
              }
            />
          </div>
        )}
      </section>

      <AddVideoModal open={isModalOpen} onClose={closeModal} video={editing} />
      <MediaPreviewModal
        open={previewing !== null}
        onClose={() => setPreviewing(null)}
        title={previewing?.title ?? ""}
        subtitle={previewing ? `${previewing.creator} • ${previewing.category}` : ""}
        imageUrl={previewing?.thumbnailUrl}
        videoUrl={previewing?.videoUrl}
        meta={
          previewing && (
            <div className="flex flex-wrap items-center gap-2">
              <Tag tone="violet">{previewing.status}</Tag>
              <span>{formatDuration(previewing.duration)}</span>
              <span>•</span>
              <span>{formatNumber(previewing.views)} views</span>
              {previewing.featured && <Tag tone="green">Featured</Tag>}
            </div>
          )
        }
      />
      <ConfirmDeleteModal
        open={videoToDelete !== null}
        title={`Delete "${videoToDelete?.title}"?`}
        message="This permanently removes the video from the library and video feed."
        loading={deleting}
        onCancel={() => setVideoToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default VideosTabContent;
