import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Disc3, ListMusic, Mic2, Plus } from "lucide-react";
import CreatePlaylistModal from "@/components/CreatePlaylistModal";
import CreateUserAlbumModal from "@/components/CreateUserAlbumModal";
import CollectionCard from "@/components/music/CollectionCard";
import SongRow from "@/components/music/SongRow";
import { ScrollArea } from "@/components/ui/scroll-area";
import { songCountLabel } from "@/lib/music";
import { SignedIn } from "@/providers/AuthProvider";
import { useAuthStore } from "@/stores/useAuthStore";
import { useFollowStore } from "@/stores/useFollowStore";
import { useLikedSongsStore } from "@/stores/useLikedSongsStore";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayStore } from "@/stores/usePlayerStore";
import { usePlaylistStore } from "@/stores/usePlaylistStore";

type Tab = "Playlists" | "Songs" | "Albums" | "Artists";
const TABS: Tab[] = ["Playlists", "Songs", "Albums", "Artists"];

const LoginPrompt = ({ text }: { text: string }) => (
  <div className="col-span-full py-14 text-center text-zinc-400">
    <p>{text}</p>
    <Link to="/login" className="mt-4 inline-block rounded-full bg-white px-5 py-2 text-sm font-bold text-black hover:scale-[1.02]">
      Log in
    </Link>
  </div>
);

export default function LibraryPage() {
  const [tab, setTab] = useState<Tab>("Playlists");
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const { user } = useAuthStore();
  const { albums, fetchAlbums } = useMusicStore();
  const { myPlaylists } = usePlaylistStore();
  const likedSongs = useLikedSongsStore((state) => state.likedSongs);
  const followedArtists = useFollowStore((state) => state.artists);
  const playerAlbum = usePlayStore((state) => state.playerAlbum);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  return (
    <ScrollArea className="h-full">
      <main className="min-h-full bg-[#121212] p-5 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">Your Library</h1>
          <SignedIn>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaylistModalOpen(true)}
                className="flex items-center gap-2 rounded-full bg-[#22c55e] px-4 py-2 text-sm font-bold text-black hover:bg-[#3be477]"
              >
                <Plus className="size-4" />
                Create playlist
              </button>
              <button
                onClick={() => setIsAlbumModalOpen(true)}
                className="flex items-center gap-2 rounded-full bg-[#242424] px-4 py-2 text-sm font-bold text-white hover:bg-[#333]"
              >
                Create album
              </button>
            </div>
          </SignedIn>
        </div>

        <div className="my-6 flex gap-2 overflow-x-auto">
          {TABS.map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`rounded-full px-4 py-2 text-sm ${tab === item ? "bg-white text-black" : "bg-[#242424] hover:bg-[#333]"}`}
            >
              {item}
            </button>
          ))}
        </div>

        {tab === "Playlists" && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {!user ? (
              <LoginPrompt text="Log in to see and create your playlists." />
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsPlaylistModalOpen(true)}
                  className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-600 p-3 text-zinc-300 transition-colors hover:border-white hover:text-white"
                >
                  <Plus className="size-8" />
                  <span className="text-sm font-bold">Create playlist</span>
                </button>
                {myPlaylists.map((playlist) => (
                  <CollectionCard
                    key={playlist._id}
                    to={`/playlist/${playlist._id}`}
                    title={playlist.name}
                    subtitle={`Playlist • ${songCountLabel(playlist.songs.length)}`}
                    imageUrl={playlist.coverImage || playlist.songs[0]?.imageUrl}
                    placeholder={<ListMusic className="size-12" />}
                  />
                ))}
              </>
            )}
          </div>
        )}

        {tab === "Songs" && (
          <>
            {!user ? (
              <div className="py-14 text-center text-zinc-400">
                <p>Log in to see the songs you like.</p>
                <Link to="/login" className="mt-4 inline-block rounded-full bg-white px-5 py-2 text-sm font-bold text-black hover:scale-[1.02]">
                  Log in
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="text-sm text-zinc-400">Liked Songs • {songCountLabel(likedSongs.length)}</p>
                  {likedSongs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => playerAlbum(likedSongs, 0)}
                      className="rounded-full bg-[#1ed760] px-4 py-1.5 text-sm font-bold text-black hover:bg-[#3be477]"
                    >
                      Play
                    </button>
                  )}
                </div>
                {likedSongs.length === 0 ? (
                  <p className="py-16 text-center text-zinc-400">Songs you like will appear here.</p>
                ) : (
                  <div className="space-y-1">
                    {likedSongs.map((song, index) => (
                      <SongRow
                        key={song._id}
                        song={song}
                        index={index + 1}
                        onPlay={() => playerAlbum(likedSongs, index)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {tab === "Albums" && (
          <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {albums.map((album) => (
              <CollectionCard
                key={album._id}
                to={`/album/${album._id}`}
                title={album.title}
                subtitle={`Album • ${album.artist}`}
                imageUrl={album.imageUrl}
                placeholder={<Disc3 className="size-12" />}
              />
            ))}
            {!albums.length && (
              <div className="col-span-full py-14 text-center text-zinc-400">
                No albums yet. Create your own album to start collecting your music.
              </div>
            )}
          </div>
        )}

        {tab === "Artists" && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {!user ? (
              <LoginPrompt text="Log in to see the artists you follow." />
            ) : followedArtists.length === 0 ? (
              <div className="col-span-full py-14 text-center text-zinc-400">
                Artists you follow will show up here.
              </div>
            ) : (
              followedArtists.map((name) => (
                <CollectionCard
                  key={name}
                  to={`/artist/${encodeURIComponent(name)}`}
                  title={name}
                  subtitle="Artist"
                  round
                  placeholder={<Mic2 className="size-12" />}
                />
              ))
            )}
          </div>
        )}
      </main>
      <CreatePlaylistModal open={isPlaylistModalOpen} onClose={() => setIsPlaylistModalOpen(false)} />
      <CreateUserAlbumModal open={isAlbumModalOpen} onClose={() => setIsAlbumModalOpen(false)} />
    </ScrollArea>
  );
}
