import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Disc3, Loader2, Mic2, Music2, Sparkles, Trash2 } from 'lucide-react'
import { getFallbackArtwork } from '@/lib/songArtwork'
import { axiosInstance } from '@/lib/axios'
import { useMusicStore } from '@/stores/useMusicStore'
import { formatNumber } from '@/lib/media'
import ConfirmDeleteModal from './ConfirmDeleteModal'
import { AdminSearch, EmptyState, PageIntro } from './AdminUI'

const ArtistsTabContent = () => {
  const { artists, songs, albums, fetchArtists, fetchSongs, fetchAlbums, fetchStats } = useMusicStore()
  const songList = Array.isArray(songs) ? songs : []
  const [artistToDelete, setArtistToDelete] = useState<string | null>(null)
  const [deletingName, setDeletingName] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return artists
    return artists.filter((name) => name.toLowerCase().includes(query))
  }, [artists, search])

  const summary = useMemo(() => {
    const albumCounts = new Map<string, number>()
    albums.forEach((album) => albumCounts.set(album.artist, (albumCounts.get(album.artist) ?? 0) + 1))
    const mostSongs = artists.reduce(
      (best, name) => {
        const count = songList.filter((song) => song.artist === name).length
        return count > best.count ? { name, count } : best
      },
      { name: '—', count: 0 },
    )
    return {
      totalSongs: songList.length,
      totalAlbums: albums.length,
      mostSongs,
      albumCounts,
    }
  }, [artists, albums, songList])

  const confirmDelete = async () => {
    if (!artistToDelete) return
    setDeletingName(artistToDelete)
    try {
      await axiosInstance.delete(`/admin/artists/${encodeURIComponent(artistToDelete)}`)
      await Promise.all([fetchArtists(), fetchSongs(), fetchAlbums(), fetchStats()])
      setArtistToDelete(null)
    } catch (error) {
      console.error("Failed to delete artist:", error)
    } finally {
      setDeletingName(null)
    }
  }

  return (
    <div className='space-y-6'>
      <PageIntro
        eyebrow='Artist directory'
        title='Artists'
        description='Every artist credited across songs and albums. Deleting an artist removes their entire catalog.'
        icon={Mic2}
        accent='text-orange-400'
      />

      <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
        {[
          { label: 'Total artists', value: formatNumber(artists.length), icon: Mic2, accent: 'text-orange-400' },
          { label: 'Songs', value: formatNumber(summary.totalSongs), icon: Music2, accent: 'text-[#1ed760]' },
          { label: 'Albums', value: formatNumber(summary.totalAlbums), icon: Disc3, accent: 'text-amber-300' },
          { label: 'Most tracks', value: summary.mostSongs.count ? `${summary.mostSongs.name}` : '—', icon: Sparkles, accent: 'text-violet-400' },
        ].map((item) => (
          <div key={item.label} className='rounded-2xl border border-white/[0.07] bg-[#181818] p-4'>
            <div className='flex items-center justify-between'>
              <p className='text-xs font-semibold text-zinc-500'>{item.label}</p>
              <item.icon className={`size-4 ${item.accent}`} />
            </div>
            <p className={`mt-2 text-2xl font-bold text-white ${item.label === 'Most tracks' ? 'truncate text-lg' : ''}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <section className='rounded-2xl border border-white/[0.07] bg-[#181818] p-4 sm:p-5'>
        <div className='mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h2 className='font-bold text-white'>Artist library</h2>
            <p className='mt-0.5 text-xs text-zinc-500'>Open an artist profile or remove their catalog.</p>
          </div>
          <AdminSearch value={search} onChange={setSearch} placeholder='Search artists...' />
        </div>

        {filtered.length ? (
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
            {filtered.map((name) => {
              const count = songList.filter((song) => song.artist === name).length
              const albumCount = summary.albumCounts.get(name) ?? 0
              return (
                <div key={name} className='group relative rounded-xl border border-transparent p-2.5 text-center transition-all hover:border-white/[0.08] hover:bg-white/[0.03]'>
                  <Link to={`/artist/${name.toLowerCase().replaceAll(" ", "-")}`} className='block'>
                    <div className='mx-auto overflow-hidden rounded-full shadow-lg ring-2 ring-transparent transition-all group-hover:ring-[#1ed760]/30'>
                      <img
                        src={getFallbackArtwork(name)}
                        alt={name}
                        className='aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]'
                      />
                    </div>
                    <p className='mt-3 truncate text-sm font-bold text-white'>{name}</p>
                    <p className='mt-0.5 text-xs text-zinc-500'>
                      {count} {count === 1 ? 'song' : 'songs'} • {albumCount} {albumCount === 1 ? 'album' : 'albums'}
                    </p>
                  </Link>
                  <button
                    type='button'
                    aria-label={`Delete artist ${name}`}
                    onClick={() => setArtistToDelete(name)}
                    className='absolute right-4 top-4 grid size-8 place-items-center rounded-full bg-black/70 text-zinc-300 opacity-0 backdrop-blur transition-opacity hover:text-red-400 group-hover:opacity-100 disabled:opacity-50'
                    disabled={deletingName === name}
                  >
                    {deletingName === name ? <Loader2 className='size-4 animate-spin' /> : <Trash2 className='size-4' />}
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          <EmptyState
            icon={Mic2}
            title={artists.length ? 'No artists match your search' : 'No artists have been added yet'}
            description={artists.length ? 'Try another artist name.' : 'Artists appear automatically when you upload songs or albums.'}
          />
        )}
      </section>

      <ConfirmDeleteModal
        open={artistToDelete !== null}
        title={`Delete artist "${artistToDelete}"?`}
        message="This will permanently delete all songs and albums by this artist."
        loading={deletingName !== null}
        onCancel={() => setArtistToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

export default ArtistsTabContent
