import { usePlayStore } from '@/stores/usePlayerStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { axiosInstance } from '@/lib/axios'
import { isCatalogId } from '@/lib/music'
import { playPreviousOrRestart, seekBy } from '@/lib/playerControls'
import { useEffect, useRef } from 'react'

const AudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const prevSongRef = useRef<string | null>(null)
  const recordedSongRef = useRef<string | null>(null)
  const { currentSong, isPlaying } = usePlayStore()

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (!currentSong) {
      audio.pause()
      audio.removeAttribute('src')
      prevSongRef.current = null
      return
    }

    const songChanged = prevSongRef.current !== currentSong._id

    if (songChanged) {
      audio.src = currentSong.audioUrl
      audio.currentTime = 0
      prevSongRef.current = currentSong._id
    }

    if (isPlaying) {
      audio.play().catch((error) => {
        console.error('Failed to play audio:', error)
      })
    } else {
      audio.pause()
    }
  }, [currentSong, isPlaying])

  // Record a listen once a catalog track actually starts playing
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handlePlaying = () => {
      const song = usePlayStore.getState().currentSong
      if (!song || !isCatalogId(song._id) || !useAuthStore.getState().user) return
      if (recordedSongRef.current === song._id) return
      recordedSongRef.current = song._id
      axiosInstance.post(`/v1/songs/${song._id}/play`).catch(() => {})
    }

    audio.addEventListener('playing', handlePlaying)
    return () => audio.removeEventListener('playing', handlePlaying)
  }, [])

  // song end: repeat one replays the track, otherwise move to the next one
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleEnded = () => {
      const { repeat, playNext } = usePlayStore.getState()
      if (repeat === 'one') {
        recordedSongRef.current = null
        audio.currentTime = 0
        audio.play().catch((error) => {
          console.error('Failed to replay audio:', error)
        })
        return
      }
      playNext()
    }

    audio.addEventListener('ended', handleEnded)
    return () => audio.removeEventListener('ended', handleEnded)
  }, [])

  // OS media keys and lock screen controls
  useEffect(() => {
    if (!('mediaSession' in navigator)) return

    const session = navigator.mediaSession
    const handlers: Array<[MediaSessionAction, MediaSessionActionHandler]> = [
      ['play', () => usePlayStore.setState({ isPlaying: true })],
      ['pause', () => usePlayStore.setState({ isPlaying: false })],
      ['previoustrack', playPreviousOrRestart],
      ['nexttrack', () => usePlayStore.getState().playNext()],
      ['seekbackward', () => seekBy(-10)],
      ['seekforward', () => seekBy(10)],
    ]

    handlers.forEach(([action, handler]) => {
      try {
        session.setActionHandler(action, handler)
      } catch {
        // this browser does not support the action
      }
    })

    return () => {
      handlers.forEach(([action]) => {
        try {
          session.setActionHandler(action, null)
        } catch {
          // nothing to clean up for unsupported actions
        }
      })
    }
  }, [])

  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentSong) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentSong.title,
      artist: currentSong.artist,
      artwork: [{ src: currentSong.imageUrl, sizes: '512x512' }],
    })
  }, [currentSong])

  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.playbackState = isPlaying && currentSong ? 'playing' : 'paused'
  }, [isPlaying, currentSong])

  // Keyboard shortcuts: Space play/pause, Ctrl/Cmd + arrows previous/next
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey) return

      const target = event.target instanceof HTMLElement ? event.target : null
      if (target?.closest('input, textarea, select, [contenteditable="true"], [role="slider"], button, a')) return

      const { currentSong, togglePlay, playNext } = usePlayStore.getState()
      const modifier = event.ctrlKey || event.metaKey

      if (event.code === 'Space' && !modifier && !event.shiftKey) {
        if (!currentSong) return
        event.preventDefault()
        togglePlay()
        return
      }

      if (modifier && event.key === 'ArrowRight') {
        event.preventDefault()
        playNext()
      } else if (modifier && event.key === 'ArrowLeft') {
        event.preventDefault()
        playPreviousOrRestart()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <audio ref={audioRef} preload="auto" />
  )
}

export default AudioPlayer
