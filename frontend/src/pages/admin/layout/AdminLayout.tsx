import { X, Upload, Menu, Music, Disc3, Podcast, Clapperboard, ExternalLink, ChevronDown, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuthStro } from "@/stores/useAuthStro";
import { useMusicStore } from "@/stores/useMusicStore";
import AdminSidebar from "./AdminSidebar";
import { UserButton } from "@/providers/AuthProvider";
import { cn } from "@/lib/utils";

const pageTitles: Record<string, { title: string; section: string }> = {
  "/admin": { title: "Dashboard", section: "Overview" },
  "/admin/songs": { title: "Songs", section: "Content" },
  "/admin/albums": { title: "Albums", section: "Content" },
  "/admin/podcasts": { title: "Podcasts", section: "Content" },
  "/admin/videos": { title: "Videos", section: "Content" },
  "/admin/artists": { title: "Artists", section: "Content" },
  "/admin/users": { title: "Users", section: "Audience" },
};

const uploadLinks = [
  { to: "/admin/songs?new=1", label: "Upload a song", description: "Audio + cover artwork", icon: Music, accent: "text-emerald-400" },
  { to: "/admin/albums?new=1", label: "Create an album", description: "Group songs into a release", icon: Disc3, accent: "text-amber-400" },
  { to: "/admin/podcasts?new=1", label: "Upload a podcast", description: "Audio, artwork and video", icon: Podcast, accent: "text-[#1ed760]" },
  { to: "/admin/videos?new=1", label: "Upload a video", description: "Video with 16:9 thumbnail", icon: Clapperboard, accent: "text-violet-400" },
];

const AdminLayout = () => {
  const { isAdmin, isLoading } = useAuthStro();
  const { fetchAlbums, fetchSongs, fetchStats, fetchArtists, fetchUsers, fetchAdminPodcasts, fetchAdminVideos } = useMusicStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!isAdmin) return;
    fetchAlbums();
    fetchSongs();
    fetchStats();
    fetchArtists();
    fetchUsers();
    fetchAdminPodcasts();
    fetchAdminVideos();
  }, [isAdmin, fetchAlbums, fetchSongs, fetchStats, fetchArtists, fetchUsers, fetchAdminPodcasts, fetchAdminVideos]);

  useEffect(() => {
    setDrawerOpen(false);
    setUploadOpen(false);
  }, [location.pathname, location.search]);

  if (!isAdmin && !isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#0b0b0b] text-white">
        <div className="text-center">
          <p className="text-2xl font-bold">Unauthorized</p>
          <p className="mt-2 text-sm text-zinc-400">You don&apos;t have access to the admin panel.</p>
          <Link to="/home" className="mt-5 inline-flex rounded-full bg-[#1ed760] px-4 py-2 text-sm font-bold text-black">
            Back to music
          </Link>
        </div>
      </div>
    );
  }

  const page = pageTitles[location.pathname] ?? { title: "Admin", section: "Workspace" };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white">
      <div className="sticky top-0 hidden h-screen md:block">
        <AdminSidebar />
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 h-full shadow-2xl">
            <AdminSidebar onNavigate={() => setDrawerOpen(false)} />
          </div>
          <button
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-[#242424] text-white"
          >
            <X className="size-5" />
          </button>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] bg-[#0a0a0a]/90 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-zinc-200 hover:bg-white/10 md:hidden"
            >
              <Menu className="size-5" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600">
                <span className="text-[#1ed760]/80">Admin</span>
                <span>/</span>
                <span>{page.section}</span>
              </div>
              <h2 className="truncate text-base font-bold text-white">{page.title}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/home"
              className="hidden items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-400 transition-colors hover:border-white/20 hover:text-white lg:inline-flex"
            >
              <ExternalLink className="size-3.5" /> View site
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setUploadOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#1ed760] px-3 py-2 text-xs font-bold text-black transition-all hover:bg-[#3be477] sm:px-4"
              >
                <Upload className="size-3.5" /> <span className="hidden sm:inline">Upload</span>
                <ChevronDown className={cn("size-3.5 transition-transform", uploadOpen && "rotate-180")} />
              </button>

              {uploadOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUploadOpen(false)} />
                  <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-white/10 bg-[#1a1a1a] p-1.5 shadow-2xl">
                    <p className="px-3 pb-1.5 pt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Quick upload</p>
                    {uploadLinks.map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        onClick={() => setUploadOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.06]"
                      >
                        <div className={cn("grid size-9 shrink-0 place-items-center rounded-lg bg-white/[0.05]", link.accent)}>
                          <link.icon className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{link.label}</p>
                          <p className="truncate text-[11px] text-zinc-500">{link.description}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="pl-1">
              <UserButton />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] flex-1 p-4 sm:p-6 lg:p-8">
          {isLoading && !isAdmin ? (
            <div className="flex items-center justify-center py-20 text-zinc-500">
              <Loader2 className="mr-2 size-5 animate-spin text-[#1ed760]" /> Checking admin access...
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
