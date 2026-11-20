import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Disc3, Loader2, Music2, Plus, Sparkles, Trash2, Users } from 'lucide-react'
import { useMusicStore } from '@/stores/useMusicStore'
import { axiosInstance } from '@/lib/axios'
import { getFallbackArtwork } from '@/lib/songArtwork'
import { formatNumber } from '@/lib/media'
import AddAlbumModal from './AddAlbumModal'
import ConfirmDeleteModal from './ConfirmDeleteModal'
import AlbumDetailModal from './AlbumDetailModal'
import { AdminSearch, EmptyState, PageIntro, primaryButtonClass } from './AdminUI'
import type { Album } from '@/types'

const AlbumsTabContent = () => {
  const { albums, fetchAlbums, fetchSongs, fetchStats } = useMusicStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [albumToDelete, setAlbumToDelete] = useState<Album | null>(null)
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null)

  useEffect(() => {
    if (searchParams.get('new') !== '1') return
    setIsModalOpen(true)
    const next = new URLSearchParams(searchParams)
    next.delete('new')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return albums
    return albums.filter((album) =>
      [album.title, album.artist, String(album.releaseYear)]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query)),
    )
  }, [albums, search])

  const summary = useMemo(() => {
    const songsInAlbums = albums.reduce((sum, album) => sum + (album.songs?.length ?? 0), 0)
    const artists = new Set(albums.map((album) => album.artist).filter(Boolean)).size
    const latestYear = albums.reduce((max, album) => Math.max(max, album.releaseYear || 0), 0)
    return { songsInAlbums, artists, latestYear }
  }, [albums])

  const confirmDelete = async () => {
    if (!albumToDelete) return
    setDeletingId(albumToDelete._id)
    try {
      await axiosInstance.delete(`/admin/albums/${albumToDelete._id}`)
      await Promise.all([fetchAlbums(), fetchSongs(), fetchStats()])
      if (selectedAlbum?._id === albumToDelete._id) setSelectedAlbum(null)
      setAlbumToDelete(null)
    } catch (error) {
      console.error("Failed to delete album:", error)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className='space-y-6'>
      <PageIntro
        eyebrow='Release library'
        title='Albums'
        description='Organize singles and albums, manage track lists and keep cover artwork up to date.'
        icon={Disc3}
        accent='text-amber-300'
        actions={
          <button type='button' onClick={() => setIsModalOpen(true)} className={`${primaryButtonClass} bg-amber-300 hover:bg-amber-200`}>
            <Plus className='size-4' /> Create album
          </button>
        }
      />

      <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
        {[
          { label: 'Total albums', value: formatNumber(albums.length), icon: Disc3, accent: 'text-amber-300' },
          { label: 'Songs in albums', value: formatNumber(summary.songsInAlbums), icon: Music2, accent: 'text-[#1ed760]' },
          { label: 'Artists', value: formatNumber(summary.artists), icon: Users, accent: 'text-blue-400' },
          { label: 'Latest release', value: summary.latestYear ? String(summary.latestYear) : '—', icon: Sparkles, accent: 'text-violet-400' },
        ].map((item) => (
          <div key={item.label} className='rounded-2xl border border-white/[0.07] bg-[#181818] p-4'>
            <div className='flex items-center justify-between'>
              <p className='text-xs font-semibold text-zinc-500'>{item.label}</p>
              <item.icon className={`size-4 ${item.accent}`} />
            </div>
            <p className='mt-2 text-2xl font-bold text-white'>{item.value}</p>
          </div>
        ))}
      </div>

      <section className='rounded-2xl border border-white/[0.07] bg-[#181818] p-4 sm:p-5'>
        <div className='mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h2 className='font-bold text-white'>Album library</h2>
            <p className='mt-0.5 text-xs text-zinc-500'>Click any cover to edit details and manage its songs.</p>
          </div>
          <AdminSearch value={search} onChange={setSearch} placeholder='Search albums or artists...' />
        </div>

        {filtered.length ? (
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
            {filtered.map((album) => (
              <div key={album._id} className='group relative rounded-xl border border-transparent p-2.5 transition-all hover:border-white/[0.08] hover:bg-white/[0.03]'>
                <button type='button' onClick={() => setSelectedAlbum(album)} className='block w-full text-left'>
                  <div className='relative overflow-hidden rounded-xl shadow-lg'>
                    {album.imageUrl ? (
                      <img
                        src={album.imageUrl}
                        onError={(event) => { event.currentTarget.src = getFallbackArtwork(album.title) }}
                        alt={album.title}
                        className='aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]'
                      />
                    ) : (
                      <div className='grid aspect-square w-full place-items-center bg-gradient-to-br from-[#2a2a2a] to-[#181818]'>
                        <Disc3 className='size-12 text-zinc-600' />
                      </div>
                    )}
                    <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100' />
                    <span className='absolute bottom-2.5 right-2.5 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-black opacity-0 transition-opacity group-hover:opacity-100'>
                      Manage
                    </span>
                  </div>
                  <p className='mt-3 truncate text-sm font-bold text-white'>{album.title}</p>
                  <p className='mt-0.5 truncate text-xs text-zinc-500'>
                    {album.artist} • {album.releaseYear}
                  </p>
                  <p className='mt-1 text-[11px] font-medium text-zinc-600'>{album.songs?.length ?? 0} tracks</p>
                </button>
                <button
                  type='button'
                  aria-label={`Delete ${album.title}`}
                  onClick={() => setAlbumToDelete(album)}
                  className='absolute right-4 top-4 grid size-8 place-items-center rounded-full bg-black/70 text-zinc-300 opacity-0 backdrop-blur transition-opacity hover:text-red-400 group-hover:opacity-100 disabled:opacity-50'
                  disabled={deletingId === album._id}
                >
                  {deletingId === album._id ? <Loader2 className='size-4 animate-spin' /> : <Trash2 className='size-4' />}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Disc3}
            title={albums.length ? 'No albums match your search' : 'No albums have been added yet'}
            description={albums.length ? 'Try another album or artist name.' : 'Create your first album and attach songs from the catalog.'}
            action={
              <button type='button' onClick={() => setIsModalOpen(true)} className={`${primaryButtonClass} bg-amber-300 hover:bg-amber-200`}>
                <Plus className='size-4' /> Create album
              </button>
            }
          />
        )}
      </section>

      <AddAlbumModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <ConfirmDeleteModal
        open={albumToDelete !== null}
        title={`Delete "${albumToDelete?.title}"?`}
        message="This will permanently remove the album and its songs from your library."
        loading={deletingId !== null}
        onCancel={() => setAlbumToDelete(null)}
        onConfirm={confirmDelete}
      />
      <AlbumDetailModal
        open={selectedAlbum !== null}
        album={selectedAlbum}
        onClose={() => setSelectedAlbum(null)}
      />
    </div>
  )
}

export default AlbumsTabContent
