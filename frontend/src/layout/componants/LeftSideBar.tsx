import PlaylistSkeleton from '@/components/skeleton/PlaylistSkeleton'
import { buttonVariants } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { songCountLabel } from '@/lib/music'
import { useMusicStore } from '@/stores/useMusicStore'
import { usePlaylistStore } from '@/stores/usePlaylistStore'
import { useSubscriptionStore } from '@/stores/useSubscriptionStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { PlanBadge } from '@/components/PlanBadge'
import { PLAN_META, isPlanId } from '@/lib/plans'
import { SignedIn } from '@/providers/AuthProvider'
import { Clock3, Disc3, Heart, HomeIcon, Library, ListMusic, MessageCircle, Plus, Search, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CreatePlaylistModal from '@/components/CreatePlaylistModal'

const LeftSideBar = () => {
    const { albums, fetchAlbums, isLoading} = useMusicStore();
    const { myPlaylists } = usePlaylistStore();
    const { user } = useAuthStore();
    const { plan } = useSubscriptionStore();
    const activePlan = isPlanId(plan) ? plan : isPlanId(user?.plan) ? user.plan : 'free';
    const planMeta = PLAN_META[activePlan];
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const navigate = useNavigate();
    // const isLoading = false;
    useEffect(()=>{
        fetchAlbums()
    }, [fetchAlbums])
return (
    <>
    <div className='h-full flex flex-col gap-2 min-h-0'>
        {/* navigation */}
        <div className='rounded-lg bg-[#121212] p-3'>
            <div className='space-y-2'>
                <Link to={"/"} className={cn(buttonVariants(
                    {
                        variant:"ghost", className: "w-full justify-start rounded-md text-zinc-300 hover:bg-zinc-800 hover:text-white"
                    }
                ))}>

                <HomeIcon  className='mr-2 size-5'/><span className='hidden md:block'>Home</span></Link>
                <Link to={"/search"} className={cn(buttonVariants({ variant:"ghost", className: "w-full justify-start rounded-md text-zinc-300 hover:bg-zinc-800 hover:text-white" }))}><Search className='mr-2 size-5'/><span className='hidden md:block'>Search</span></Link>
                <Link to={"/library"} className={cn(buttonVariants({ variant:"ghost", className: "w-full justify-start rounded-md text-zinc-300 hover:bg-zinc-800 hover:text-white" }))}><Library className='mr-2 size-5'/><span className='hidden md:block'>Your Library</span></Link>
                <Link to={"/plans"} className={cn(buttonVariants({ variant:"ghost", className: "w-full justify-start rounded-md text-zinc-300 hover:bg-zinc-800 hover:text-white" }))}><Sparkles className='mr-2 size-5'/><span className='hidden md:block'>Plans</span></Link>
                <SignedIn>
                    <Link to={"/chat"} className={cn(buttonVariants(
                    {
                        variant:"ghost", className: "w-full justify-start rounded-md text-zinc-300 hover:bg-zinc-800 hover:text-white"
                    }
                ))}>

                <MessageCircle  className='mr-2 size-5'/><span className='hidden md:block'>Message</span></Link>
                </SignedIn>
            </div>
            <div className='mt-3 space-y-1 border-t border-white/10 pt-3 hidden md:block'><Link to="/liked" className='flex items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white'><Heart className='size-4'/>Liked Songs</Link><Link to="/recently-played" className='flex items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white'><Clock3 className='size-4'/>Recently Played</Link></div>
        </div>

        {/* Plan identity card */}
        <div className={cn('hidden md:block rounded-lg border bg-gradient-to-br p-3', planMeta.borderClass, planMeta.gradientClass)}>
            <div className='flex items-center justify-between gap-2'>
                <span className='text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400'>{user ? 'Your plan' : 'Plan'}</span>
                <PlanBadge plan={activePlan} size="xs" />
            </div>
            <p className='mt-2 text-sm font-bold text-white'>
                {activePlan === 'free' ? 'Listening with ads' : activePlan === 'basic' ? 'Ad-free music' : activePlan === 'premium' ? 'Downloads unlocked' : 'Everything unlocked'}
            </p>
            <p className='mt-0.5 text-[11px] leading-relaxed text-zinc-400'>
                {activePlan === 'free'
                    ? 'Upgrade to remove ads and unlock more.'
                    : activePlan === 'basic'
                        ? 'Add MP3 downloads with Premium.'
                        : activePlan === 'premium'
                            ? 'Add podcast & video downloads with Pro.'
                            : 'You have every BeatMusic feature.'}
            </p>
            <Link
                to='/plans'
                className={cn(
                    'mt-3 inline-flex w-full items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-bold transition-transform hover:scale-[1.02]',
                    activePlan === 'pro' ? 'bg-gradient-to-r from-amber-300 to-orange-400 text-black' : 'bg-white text-black',
                )}
            >
                {activePlan === 'free' || activePlan === 'basic' ? 'Upgrade plan' : activePlan === 'premium' ? 'Go Pro' : 'Manage plan'}
            </Link>
        </div>

        {/* Library */}
        <div className='rounded-lg bg-[#121212] p-3 flex-1 flex flex-col overflow-hidden min-h-0'>
            <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center text-white px-2'>
                    <Library className='size-5 mr-2'/> 
                    <span className='hidden md:inline font-semibold'>Your Library</span>
                </div>
                <div className='hidden md:flex items-center gap-1 text-zinc-400'>
                    <button type='button' title='Create playlist' aria-label='Create playlist' onClick={() => (user ? setIsCreateModalOpen(true) : navigate('/login'))} className='hover:text-white'>
                        <Plus className='size-5' />
                    </button>
                    <Search className='size-4 hover:text-white cursor-pointer' onClick={() => navigate('/search')} />
                </div>
            </div>
            <ScrollArea className='flex-1 min-h-0'>
                <div className='space-y-3'>
                    {myPlaylists.length === 0 && (
                        <section className='hidden md:block rounded-lg bg-[#242424] p-4'>
                            <h3 className='font-bold'>Create your first playlist</h3>
                            <p className='mt-2 text-sm text-zinc-300'>It&apos;s easy, we&apos;ll help you.</p>
                            <button onClick={() => (user ? setIsCreateModalOpen(true) : navigate('/login'))} className='mt-5 rounded-full bg-white px-4 py-2 text-sm font-bold text-black hover:scale-[1.02]'>Create playlist</button>
                        </section>
                    )}
                    <section className='hidden md:block rounded-lg bg-[#242424] p-4'>
                        <h3 className='font-bold'>Let&apos;s find some podcasts to follow</h3>
                        <p className='mt-2 text-sm text-zinc-300'>We&apos;ll keep you updated on new episodes.</p>
                        <button onClick={() => navigate('/library')} className='mt-5 rounded-full bg-white px-4 py-2 text-sm font-bold text-black hover:scale-[1.02]'>Browse podcasts</button>
                    </section>
                    {myPlaylists.map((playlist) => {
                        const cover = playlist.coverImage || playlist.songs[0]?.imageUrl || '';
                        return (
                        <Link to={`/playlist/${playlist._id}`} key={playlist._id} className='p-2 hover:bg-zinc-800 rounded-md flex items-center gap-3 group cursor-pointer'>
                        {cover ? (
                          <img
                            src={cover}
                            onError={(event) => { event.currentTarget.src = `https://placehold.co/600x600/27272a/f5d0fe?text=${encodeURIComponent(playlist.name)}` }}
                            alt=''
                            className='size-12 rounded-md flex shrink-0 object-cover'
                          />
                        ) : (
                          <div className='grid size-12 shrink-0 place-items-center rounded-md bg-[#242424]'>
                            <ListMusic className='size-5 text-zinc-500' />
                          </div>
                        )}
                        <div className='flex-1 min-w-0 hidden md:block'>
                            <p className='font-medium truncate'>{playlist.name}</p>
                            <p className='text-sm text-zinc-400 truncate'>Playlist • {songCountLabel(playlist.songs.length)}</p>
                        </div>
                        </Link>
                        );
                    })}
                    {isLoading ?(
                        <PlaylistSkeleton />
                    ) : (
                        albums.map((album: any) => (
                        <Link to={`/album/${album._id}`} key={album._id} className='p-2 hover:bg-zinc-800 rounded-md flex items-center gap-3 group cursor-pointer'>
                        {album.imageUrl ? (
                        <img
                          src={album.imageUrl}
                          onError={(event) => { event.currentTarget.src = `https://placehold.co/600x600/27272a/f5d0fe?text=${encodeURIComponent(album.title)}` }}
                          alt=""
                          className='size-12 rounded-md flex shrink-0 object-cover'
                        />
                      ) : (
                        <div className='grid size-12 shrink-0 place-items-center rounded-md bg-[#242424]'>
                          <Disc3 className='size-5 text-zinc-500' />
                        </div>
                      )}
                        <div className='flex-1 min-w-0 hidden md:block'>
                            <p className='font-medium truncate'>{album.title}</p>
                            <p className='text-sm text-zinc-400 truncate'>Album • {album.artist}</p>
                            </div>
                        </Link>
                        ))
                    )}
                    <footer className='hidden md:flex flex-wrap gap-x-4 gap-y-2 px-1 pt-8 text-[11px] text-zinc-400'>
                        <Link to="/info/legal" className="hover:text-white hover:underline transition-colors">Legal</Link>
                        <Link to="/info/safety" className="hover:text-white hover:underline transition-colors">Safety &amp; Privacy Center</Link>
                        <Link to="/info/privacy" className="hover:text-white hover:underline transition-colors">Privacy Policy</Link>
                        <Link to="/info/cookies" className="hover:text-white hover:underline transition-colors">Cookies</Link>
                        <Link to="/info/ads" className="hover:text-white hover:underline transition-colors">About Ads</Link>
                        <Link to="/info/accessibility" className="hover:text-white hover:underline transition-colors">Accessibility</Link>
                    </footer>
                </div>
            </ScrollArea>
        </div>
    </div>
    <CreatePlaylistModal open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </>
  )
}

export default LeftSideBar
