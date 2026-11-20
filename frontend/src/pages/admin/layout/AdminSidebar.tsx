import {
  Album,
  ArrowLeft,
  BarChart3,
  Clapperboard,
  LayoutDashboard,
  ListMusic,
  Mic2,
  Podcast,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useMusicStore } from "@/stores/useMusicStore";

type MenuItem = {
  to: string;
  label: string;
  icon: typeof ListMusic;
  end?: boolean;
  badge?: number;
};

type MenuGroup = {
  label: string;
  items: MenuItem[];
};

const AdminSidebar = ({ onNavigate }: { onNavigate?: () => void }) => {
  const { stats } = useMusicStore();

  const groups: MenuGroup[] = [
    {
      label: "Overview",
      items: [{ to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true }],
    },
    {
      label: "Content",
      items: [
        { to: "/admin/songs", label: "Songs", icon: ListMusic, badge: stats.totalSongs },
        { to: "/admin/albums", label: "Albums", icon: Album, badge: stats.totalAlbums },
        { to: "/admin/podcasts", label: "Podcasts", icon: Podcast, badge: stats.totalPodcasts },
        { to: "/admin/videos", label: "Videos", icon: Clapperboard, badge: stats.totalVideos },
        { to: "/admin/artists", label: "Artists", icon: Mic2, badge: stats.totalArtists },
      ],
    },
    {
      label: "Audience",
      items: [{ to: "/admin/users", label: "Users", icon: Users, badge: stats.totalUsers }],
    },
  ];

  return (
    <div className="flex h-full w-64 shrink-0 flex-col border-r border-white/[0.06] bg-[#0b0b0b]">
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-5">
        <div className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-[#1ed760] to-emerald-300 shadow-[0_0_24px_rgba(30,215,96,0.25)]">
          <ShieldCheck className="size-5 text-black" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">Beat Studio</p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Admin panel</p>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto p-3">
        {groups.map((group) => (
          <div key={group.label} className="space-y-1">
            <p className="px-3 pb-1 pt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600">{group.label}</p>
            {group.items.map((menu) => (
              <NavLink
                key={menu.to}
                to={menu.to}
                end={menu.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
                    isActive
                      ? "bg-[#1ed760]/12 text-[#1ed760] ring-1 ring-inset ring-[#1ed760]/20"
                      : "text-zinc-400 hover:bg-white/[0.04] hover:text-white",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <menu.icon className={cn("size-[18px] shrink-0", isActive ? "text-[#1ed760]" : "text-zinc-500 group-hover:text-zinc-300")} />
                    <span className="flex-1">{menu.label}</span>
                    {menu.badge != null && menu.badge > 0 && (
                      <span
                        className={cn(
                          "min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold",
                          isActive ? "bg-[#1ed760]/20 text-[#1ed760]" : "bg-white/[0.06] text-zinc-500",
                        )}
                      >
                        {menu.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}

        <div className="rounded-2xl border border-[#1ed760]/20 bg-gradient-to-br from-[#1ed760]/15 via-[#1ed760]/5 to-transparent p-3.5">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Sparkles className="size-4 text-[#1ed760]" />
            Creator tools
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
            Publish songs, podcast episodes and videos to the listener feed.
          </p>
          <Link
            to="/admin/podcasts?new=1"
            onClick={onNavigate}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#1ed760] px-3 py-1.5 text-[11px] font-bold text-black transition-transform hover:scale-[1.02]"
          >
            Upload now
          </Link>
        </div>
      </nav>

      <div className="space-y-1 border-t border-white/[0.06] p-3">
        <Link
          to="/home"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-white"
        >
          <ArrowLeft className="size-[18px]" />
          Back to music
        </Link>
        <Link
          to="/profile"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-white"
        >
          <BarChart3 className="size-[18px]" />
          My profile
        </Link>
      </div>
    </div>
  );
};

export default AdminSidebar;
