import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Disc3, ListMusic, Mic2, Play, Search, X } from "lucide-react";
import AdBanner from "@/components/AdBanner";
import CollectionCard from "@/components/music/CollectionCard";
import SongRow from "@/components/music/SongRow";
import { ScrollArea } from "@/components/ui/scroll-area";
import { axiosInstance } from "@/lib/axios";
import { songCountLabel } from "@/lib/music";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayStore } from "@/stores/usePlayerStore";
import type { Album, PlaylistSummary, Song } from "@/types";

type Filter = "All" | "Songs" | "Albums" | "Artists" | "Playlists";
const FILTERS: Filter[] = ["All", "Songs", "Albums", "Artists", "Playlists"];

type ArtistResult = { name: string; imageUrl?: string; songCount: number };
type SearchResults = {
  songs: Song[];
  albums: Array<Pick<Album, "_id" | "title" | "artist" | "imageUrl" | "releaseYear">>;
  artists: ArtistResult[];
  playlists: PlaylistSummary[];
};

const EMPTY_RESULTS: SearchResults = { songs: [], albums: [], artists: [], playlists: [] };

const BROWSE_COLORS = [
  "bg-gradient-to-br from-fuchsia-600 to-violet-900",
  "bg-gradient-to-br from-emerald-600 to-teal-900",
  "bg-gradient-to-br from-sky-600 to-indigo-900",
  "bg-gradient-to-br from-amber-500 to-rose-700",
  "bg-gradient-to-br from-rose-600 to-purple-900",
  "bg-gradient-to-br from-lime-600 to-emerald-900",
  "bg-gradient-to-br from-cyan-600 to-blue-900",
  "bg-gradient-to-br from-orange-500 to-red-800",
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);
  const [filter, setFilter] = useState<Filter>("All");
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
  const [isSearching, setIsSearching] = useState(false);
  const [genres, setGenres] = useState<string[]>([]);
  const lastSyncedRef = useRef(urlQuery.trim());
  const { albums, fetchAlbums } = useMusicStore();
  const playerAlbum = usePlayStore((state) => state.playerAlbum);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  useEffect(() => {
    axiosInstance
      .get("/v1/genres")
      .then((res) => setGenres(Array.isArray(res.data?.data) ? res.data.data : []))
      .catch(() => setGenres([]));
  }, []);

  useEffect(() => {
    const term = urlQuery.trim();
    if (term === lastSyncedRef.current) return;
    lastSyncedRef.current = term;
    setQuery(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    const term = query.trim();
    const timer = window.setTimeout(() => {
      if (term === lastSyncedRef.current) return;
      lastSyncedRef.current = term;
      setSearchParams(term ? { q: term } : {}, { replace: true });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query, setSearchParams]);

  useEffect(() => {
    const term = urlQuery.trim();
    if (!term) {
      setResults(EMPTY_RESULTS);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);
    axiosInstance
      .get("/v1/search", { params: { q: term.slice(0, 100), limit: 30 } })
      .then((res) => {
        if (!cancelled) setResults({ ...EMPTY_RESULTS, ...(res.data?.data ?? {}) });
      })
      .catch(() => {
        if (!cancelled) setResults(EMPTY_RESULTS);
      })
      .finally(() => {
        if (!cancelled) setIsSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [urlQuery]);

  const submitQuery = (value: string) => {
    const term = value.trim();
    setQuery(value);
    lastSyncedRef.current = term;
    setSearchParams(term ? { q: term } : {});
  };

  const term = urlQuery.trim();
  const hasQuery = term.length > 0;
  const noResults =
    !results.songs.length && !results.artists.length && !results.albums.length && !results.playlists.length;
  const topArtist = results.artists.find((artist) => artist.name.toLowerCase() === term.toLowerCase());
  const topSong = results.songs[0];
  const shows = (kind: Exclude<Filter, "All">) => filter === "All" || filter === kind;

  return (
    <ScrollArea className="h-full">
      <main className="min-h-full bg-[#121212] p-5 sm:p-8">
        <h1 className="mb-6 text-3xl font-bold">Search</h1>

        <form
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            submitQuery(query);
          }}
          className="flex max-w-xl items-center gap-3 rounded-full bg-white px-4 py-3 text-black shadow-lg"
        >
          <Search className="size-5 shrink-0" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="What do you want to play?"
            aria-label="Search songs, artists, albums and playlists"
            className="w-full bg-transparent text-sm font-medium outline-none"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => submitQuery("")}
              className="text-zinc-500 hover:text-black"
            >
              <X className="size-4" />
            </button>
          )}
        </form>

        <div className="mb-6 mt-6">
          <AdBanner />
        </div>

        {hasQuery && (
          <div className="my-7 flex gap-2 overflow-x-auto">
            {FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${filter === item ? "bg-white text-black" : "bg-[#242424] text-white hover:bg-[#333]"}`}
              >
                {item}
              </button>
            ))}
          </div>
        )}

        {!hasQuery ? (
          <section>
            <h2 className="mb-4 text-2xl font-bold">Browse all</h2>
            {genres.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {genres.map((genre, index) => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => submitQuery(genre)}
                    className={`relative aspect-[1.6/1] overflow-hidden rounded-lg p-4 text-left text-xl font-bold shadow-lg transition-transform hover:scale-[1.02] ${BROWSE_COLORS[index % BROWSE_COLORS.length]}`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {albums.slice(0, 8).map((album, index) => (
                  <Link
                    key={album._id}
                    to={`/album/${album._id}`}
                    className={`relative aspect-square overflow-hidden rounded-lg p-4 text-xl font-bold shadow-lg ${BROWSE_COLORS[index % BROWSE_COLORS.length]}`}
                  >
                    {album.title}
                    {album.imageUrl && (
                      <img src={album.imageUrl} alt="" className="absolute -bottom-4 -right-4 size-28 rotate-24 rounded-md object-cover shadow-xl" />
                    )}
                  </Link>
                ))}
              </div>
            )}
          </section>
        ) : (
          <div className="space-y-10">
            {isSearching && <p className="text-sm text-zinc-400">Searching...</p>}
            {!isSearching && noResults && (
              <p className="py-16 text-center text-zinc-400">No results for “{term}”. Try another search.</p>
            )}

            {filter === "All" && (topArtist || topSong) && (
              <section>
                <h2 className="mb-4 text-2xl font-bold">Top result</h2>
                {topArtist ? (
                  <Link
                    to={`/artist/${encodeURIComponent(topArtist.name)}`}
                    className="flex w-full max-w-md items-center gap-5 rounded-lg bg-[#181818] p-5 transition-colors hover:bg-[#282828]"
                  >
                    {topArtist.imageUrl ? (
                      <img src={topArtist.imageUrl} alt="" className="size-24 rounded-full object-cover shadow-xl" />
                    ) : (
                      <div className="grid size-24 place-items-center rounded-full bg-[#242424] text-zinc-500">
                        <Mic2 className="size-10" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-3xl font-black">{topArtist.name}</p>
                      <p className="mt-1 text-sm text-zinc-400">Artist • {songCountLabel(topArtist.songCount)}</p>
                    </div>
                  </Link>
                ) : (
                  topSong && (
                    <div className="flex w-full max-w-md items-center gap-5 rounded-lg bg-[#181818] p-5 transition-colors hover:bg-[#282828]">
                      <img src={topSong.imageUrl} alt="" className="size-24 rounded-md object-cover shadow-xl" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-3xl font-black">{topSong.title}</p>
                        <p className="mt-1 truncate text-sm text-zinc-400">Song • {topSong.artist}</p>
                      </div>
                      <button
                        type="button"
                        aria-label={`Play ${topSong.title}`}
                        onClick={() => playerAlbum(results.songs, 0)}
                        className="grid size-12 shrink-0 place-items-center rounded-full bg-[#1ed760] text-black shadow-xl hover:scale-105"
                      >
                        <Play className="ml-0.5 size-5 fill-black" />
                      </button>
                    </div>
                  )
                )}
              </section>
            )}

            {shows("Songs") && results.songs.length > 0 && (
              <section>
                <h2 className="mb-3 text-2xl font-bold">Songs</h2>
                <div className="space-y-1">
                  {(filter === "All" ? results.songs.slice(0, 5) : results.songs).map((song, index) => (
                    <SongRow
                      key={song._id}
                      song={song}
                      index={index + 1}
                      onPlay={() => playerAlbum(results.songs, index)}
                    />
                  ))}
                </div>
              </section>
            )}

            {shows("Artists") && results.artists.length > 0 && (
              <section>
                <h2 className="mb-4 text-2xl font-bold">Artists</h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  {(filter === "All" ? results.artists.slice(0, 5) : results.artists).map((artist) => (
                    <CollectionCard
                      key={artist.name}
                      to={`/artist/${encodeURIComponent(artist.name)}`}
                      title={artist.name}
                      subtitle="Artist"
                      imageUrl={artist.imageUrl}
                      round
                      placeholder={<Mic2 className="size-12" />}
                    />
                  ))}
                </div>
              </section>
            )}

            {shows("Albums") && results.albums.length > 0 && (
              <section>
                <h2 className="mb-4 text-2xl font-bold">Albums</h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  {(filter === "All" ? results.albums.slice(0, 5) : results.albums).map((album) => (
                    <CollectionCard
                      key={album._id}
                      to={`/album/${album._id}`}
                      title={album.title}
                      subtitle={`Album • ${album.artist}`}
                      imageUrl={album.imageUrl}
                      placeholder={<Disc3 className="size-12" />}
                    />
                  ))}
                </div>
              </section>
            )}

            {shows("Playlists") && results.playlists.length > 0 && (
              <section>
                <h2 className="mb-4 text-2xl font-bold">Playlists</h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  {(filter === "All" ? results.playlists.slice(0, 5) : results.playlists).map((playlist) => (
                    <CollectionCard
                      key={playlist._id}
                      to={`/playlist/${playlist._id}`}
                      title={playlist.name}
                      subtitle={`Playlist • ${playlist.owner?.fullName ?? "BeatMusic"}`}
                      imageUrl={playlist.coverImage || playlist.songs[0]?.imageUrl}
                      placeholder={<ListMusic className="size-12" />}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </ScrollArea>
  );
}
