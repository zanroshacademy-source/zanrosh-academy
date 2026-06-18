'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface VideoPlayerProps {
  src: string
  fallbackSrc?: string
  rawSrc?: string
  isCloudinary: boolean
  title: string
  userEmail?: string
}

export default function VideoPlayer({
  src,
  fallbackSrc,
  rawSrc,
  isCloudinary,
  title,
  userEmail = 'student',
}: VideoPlayerProps) {
  const videoRef      = useRef<HTMLVideoElement>(null)
  const containerRef  = useRef<HTMLDivElement>(null)
  const progressRef   = useRef<HTMLDivElement>(null)
  const hlsRef        = useRef<any>(null)
  const hideTimer        = useRef<ReturnType<typeof setTimeout> | null>(null)
  const playingRef       = useRef(false) // always-current ref for closures
  const bufferTimer      = useRef<ReturnType<typeof setTimeout> | null>(null) // debounce spinner

  const [playing, setPlaying]         = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration]       = useState(0)
  const [volume, setVolume]           = useState(1)
  const [muted, setMuted]             = useState(false)
  const [fullscreen, setFullscreen]   = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isHidden, setIsHidden]       = useState(false)
  const [buffered, setBuffered]       = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false) // spinner only on mid-play buffering
  const [hasError, setHasError]       = useState(false)

  const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2]

  // ─── Security ──────────────────────────────────────────────────────────────
  useEffect(() => {
    import('disable-devtool').then(m => m.default()).catch(() => {})

    const blockCtx  = (e: MouseEvent)    => e.preventDefault()
    const blockKeys = (e: KeyboardEvent) => {
      if (
        e.key === 'PrintScreen' ||
        (e.ctrlKey  && ['c','s','p','u','a'].includes(e.key.toLowerCase())) ||
        (e.metaKey  && ['c','s','p','u','a'].includes(e.key.toLowerCase()))
      ) { e.preventDefault(); e.stopPropagation() }
    }
    const blockVis = () => {
      if (document.hidden) {
        setIsHidden(true)
        videoRef.current?.pause()
        setPlaying(false)
        playingRef.current = false
      } else {
        setIsHidden(false)
      }
    }

    document.body.style.userSelect = 'none'
    ;(document.body.style as any).webkitUserSelect = 'none'
    document.addEventListener('contextmenu', blockCtx, true)
    document.addEventListener('visibilitychange', blockVis)
    window.addEventListener('keydown', blockKeys, true)

    return () => {
      document.body.style.userSelect = ''
      ;(document.body.style as any).webkitUserSelect = ''
      document.removeEventListener('contextmenu', blockCtx, true)
      document.removeEventListener('visibilitychange', blockVis)
      window.removeEventListener('keydown', blockKeys, true)
    }
  }, [])

  // ─── Video Source Setup ─────────────────────────────────────────────────────
  // Rules:
  //  • If src ends in .m3u8  → use HLS.js (or native Safari HLS)
  //  • Otherwise              → set src directly on <video> (works for signed mp4)
  //  • Never transform a signed URL — signatures encode every path segment
  useEffect(() => {
    if (!videoRef.current || !src) return
    const video = videoRef.current

    setHasError(false)
    setIsBuffering(false)

    // Destroy any previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    // Build the fallback chain: fallbackSrc → rawSrc → give up
    const tryFallbackChain = (alreadyTriedFallback = false) => {
      const next = !alreadyTriedFallback && fallbackSrc ? fallbackSrc : rawSrc
      if (next && video.src !== next) {
        video.src = next
        video.load()
        // One more attempt with next URL
        video.addEventListener('error', () => {
          if (!alreadyTriedFallback && rawSrc && video.src !== rawSrc) {
            video.src = rawSrc
            video.load()
            video.addEventListener('error', () => { setHasError(true) }, { once: true })
          } else {
            setHasError(true)
          }
        }, { once: true })
      } else {
        setHasError(true)
      }
    }

    if (src.endsWith('.m3u8') || src.includes('.m3u8?')) {
      // ── HLS path ──────────────────────────────────────────────────────────
      import('hls.js').then(({ default: Hls }) => {
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker:      true,
            lowLatencyMode:    false,
            maxMaxBufferLength: 60,
            // Short manifest load timeout so we fall back quickly if HLS isn't ready
            manifestLoadingTimeOut: 8000,
            manifestLoadingMaxRetry: 1,
          })
          hlsRef.current = hls

          hls.on(Hls.Events.ERROR, (_: any, data: any) => {
            if (data.fatal) {
              console.warn('[VideoPlayer] HLS fatal error, falling back to mp4:', data.type)
              hls.destroy()
              hlsRef.current = null
              tryFallbackChain()
            }
          })

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setIsBuffering(false)
          })

          hls.loadSource(src)
          hls.attachMedia(video)
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Safari — native HLS
          video.src = src
          video.addEventListener('error', () => tryFallbackChain(), { once: true })
        } else {
          // No HLS support at all
          tryFallbackChain()
        }
      }).catch(() => tryFallbackChain())
    } else {
      // ── Direct video (signed mp4 or any other format) ─────────────────────
      video.src = src
      video.load()
      video.addEventListener('error', () => tryFallbackChain(), { once: true })
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [src, fallbackSrc, rawSrc]) // ← playing NOT in deps

  // ─── Video Event Listeners ──────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onTimeUpdate    = () => setCurrentTime(video.currentTime)
    const onLoadedMeta    = () => { setDuration(video.duration); setIsBuffering(false) }
    const onCanPlay       = () => { if (bufferTimer.current) clearTimeout(bufferTimer.current); setIsBuffering(false) }
    const onSeeked        = () => { if (bufferTimer.current) clearTimeout(bufferTimer.current); setIsBuffering(false) }
    const onWaiting       = () => {
      // Only show spinner after 300ms so quick seeks into buffered regions don't flash it
      if (!playingRef.current) return
      if (bufferTimer.current) clearTimeout(bufferTimer.current)
      bufferTimer.current = setTimeout(() => setIsBuffering(true), 300)
    }
    const onPlaying       = () => { setIsBuffering(false); setPlaying(true);  playingRef.current = true  }
    const onPlay          = () => { setPlaying(true);  playingRef.current = true  }
    const onPause         = () => { setPlaying(false); playingRef.current = false; if (bufferTimer.current) clearTimeout(bufferTimer.current); setIsBuffering(false) }
    const onProgress      = () => {
      if (video.buffered.length > 0)
        setBuffered(video.buffered.end(video.buffered.length - 1))
    }
    const onEnded         = () => { setPlaying(false); playingRef.current = false; setIsBuffering(false) }
    const onError         = () => { if (bufferTimer.current) clearTimeout(bufferTimer.current); setIsBuffering(false); setHasError(true) }

    video.addEventListener('timeupdate',    onTimeUpdate)
    video.addEventListener('loadedmetadata', onLoadedMeta)
    video.addEventListener('canplay',       onCanPlay)
    video.addEventListener('seeked',        onSeeked)
    video.addEventListener('waiting',       onWaiting)
    video.addEventListener('playing',       onPlaying)
    video.addEventListener('play',          onPlay)
    video.addEventListener('pause',         onPause)
    video.addEventListener('progress',      onProgress)
    video.addEventListener('ended',         onEnded)
    video.addEventListener('error',         onError)

    return () => {
      if (bufferTimer.current) clearTimeout(bufferTimer.current)
      video.removeEventListener('timeupdate',    onTimeUpdate)
      video.removeEventListener('loadedmetadata', onLoadedMeta)
      video.removeEventListener('canplay',       onCanPlay)
      video.removeEventListener('seeked',        onSeeked)
      video.removeEventListener('waiting',       onWaiting)
      video.removeEventListener('playing',       onPlaying)
      video.removeEventListener('play',          onPlay)
      video.removeEventListener('pause',         onPause)
      video.removeEventListener('progress',      onProgress)
      video.removeEventListener('ended',         onEnded)
      video.removeEventListener('error',         onError)
    }
  }, [])

  // ─── Auto-hide controls ─────────────────────────────────────────────────────
  const resetHideTimer = useCallback(() => {
    setShowControls(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      if (playingRef.current) setShowControls(false)
    }, 3000)
  }, [])

  // ─── Control Actions ────────────────────────────────────────────────────────
  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play().catch(() => {}) }
    else          { v.pause() }
    resetHideTimer()
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current
    if (!v || !progressRef.current || !duration) return
    const rect  = progressRef.current.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    v.currentTime = Math.max(0, Math.min(ratio * duration, duration))
    resetHideTimer()
  }

  const changeVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    if (videoRef.current) videoRef.current.volume = val
    setVolume(val)
    setMuted(val === 0)
  }

  const toggleMute = () => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }

  const toggleFullscreen = () => {
    const el = containerRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setFullscreen(false)).catch(() => {})
    }
  }

  const setSpeed = (s: number) => {
    if (videoRef.current) videoRef.current.playbackRate = s
    setPlaybackRate(s)
    setShowSpeedMenu(false)
  }

  const fmt = (s: number) => {
    if (!s || isNaN(s)) return '0:00'
    const m   = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black overflow-hidden rounded-2xl select-none group"
      onMouseMove={resetHideTimer}
      onMouseLeave={() => playingRef.current && setShowControls(false)}
      onContextMenu={e => e.preventDefault()}
      onDragStart={e => e.preventDefault()}
    >
      {/* ── Video Element ──────────────────────────────────────────────────── */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        preload="auto"
        disablePictureInPicture
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        onContextMenu={e => e.preventDefault()}
      />

      {/* ── Dynamic Forensic Watermark ─────────────────────────────────────── */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden select-none" aria-hidden="true">
        <style>{`
          @keyframes watermark-slide-right {
            0% { left: -50%; }
            100% { left: 100%; }
          }
          @keyframes watermark-slide-left {
            0% { left: 100%; }
            100% { left: -50%; }
          }
          .watermark-top {
            animation: watermark-slide-right 30s linear infinite;
          }
          .watermark-bottom {
            animation: watermark-slide-left 30s linear infinite;
            /* start halfway through its cycle so it crosses over nicely */
            animation-delay: -15s; 
          }
        `}</style>
        
        <div className="watermark-top absolute top-[15%] whitespace-nowrap text-white/15 font-bold font-mono text-xl tracking-[0.2em] mix-blend-overlay">
          {userEmail} • CONFIDENTIAL
        </div>

        <div className="watermark-bottom absolute bottom-[20%] whitespace-nowrap text-white/15 font-bold font-mono text-xl tracking-[0.2em] mix-blend-overlay">
          {userEmail} • DO NOT SHARE
        </div>
      </div>

      {/* ── Buffering Spinner (only during mid-playback buffering) ──────────── */}
      {isBuffering && !isHidden && (
        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-[#4fc3f7] animate-spin" />
        </div>
      )}

      {/* ── Error State ─────────────────────────────────────────────────────── */}
      {hasError && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/90 text-white gap-3">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-400">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p className="font-bold text-lg">Failed to load video</p>
          <p className="text-white/50 text-sm">Please refresh the page and try again.</p>
        </div>
      )}

      {/* ── Context-menu blocker ────────────────────────────────────────────── */}
      <div className="absolute inset-0 z-10" onContextMenu={e => e.preventDefault()} style={{ pointerEvents: 'none' }} />

      {/* ── Tab-switch Black Screen ─────────────────────────────────────────── */}
      {isHidden && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center text-center p-8 pointer-events-none">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h3 className="text-3xl font-black text-white mb-3">Playback Paused</h3>
          <p className="text-white/50 text-sm font-medium max-w-xs">
            Video paused because you switched tabs.<br/>Return to this tab to continue watching.
          </p>
        </div>
      )}

      {/* ── Custom Controls Bar ─────────────────────────────────────────────── */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-30 transition-opacity duration-300 ${showControls || !playing ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)' }}
        onContextMenu={e => e.preventDefault()}
      >
        {/* Progress Bar */}
        <div
          ref={progressRef}
          className="relative mx-4 mb-3 h-1.5 bg-white/20 rounded-full cursor-pointer group/bar hover:h-2.5 transition-all"
          onClick={seek}
        >
          <div className="absolute top-0 left-0 h-full bg-white/30 rounded-full" style={{ width: duration ? `${(buffered / duration) * 100}%` : '0%' }} />
          <div className="absolute top-0 left-0 h-full bg-[#4fc3f7] rounded-full"  style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }} />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-[#4fc3f7] rounded-full shadow-lg opacity-0 group-hover/bar:opacity-100 transition-opacity -mt-px"
            style={{ left: duration ? `calc(${(currentTime / duration) * 100}% - 7px)` : '0px' }}
          />
        </div>

        {/* Controls Row */}
        <div className="flex items-center gap-3 px-4 pb-4" onContextMenu={e => e.preventDefault()}>
          {/* Play/Pause */}
          <button onClick={togglePlay} className="text-white hover:text-[#4fc3f7] transition-colors" title={playing ? 'Pause' : 'Play'}>
            {playing ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
            )}
          </button>

          {/* Volume */}
          <button onClick={toggleMute} className="text-white hover:text-[#4fc3f7] transition-colors">
            {muted || volume === 0 ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
            )}
          </button>
          <input
            type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
            onChange={changeVolume}
            className="w-20 accent-[#4fc3f7] cursor-pointer"
          />

          {/* Time */}
          <span className="text-white/80 text-xs font-mono ml-1 select-none">{fmt(currentTime)} / {fmt(duration)}</span>

          <div className="flex-1" />

          {/* Playback Speed */}
          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu(p => !p)}
              className="text-white/80 hover:text-white text-xs font-bold bg-white/10 hover:bg-white/20 rounded px-2 py-1 transition-colors"
            >
              {playbackRate}x
            </button>
            {showSpeedMenu && (
              <div className="absolute bottom-9 right-0 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                {SPEEDS.map(s => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`block w-full text-left px-4 py-2 text-sm font-bold transition-colors ${playbackRate === s ? 'text-[#4fc3f7] bg-white/10' : 'text-white hover:bg-white/10'}`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fullscreen */}
          <button onClick={toggleFullscreen} className="text-white hover:text-[#4fc3f7] transition-colors">
            {fullscreen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Click-to-play centre overlay ─────────────────────────────────────── */}
      {!playing && !isHidden && !hasError && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer"
          onClick={togglePlay}
        >
          <div className="w-20 h-20 rounded-full bg-black/50 border-2 border-white/40 flex items-center justify-center backdrop-blur-sm hover:scale-110 transition-transform">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
          </div>
        </div>
      )}
    </div>
  )
}
