"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronUp, ChevronDown, Play, Pause, SkipForward, Clock, Music, Share, Volume2 } from "lucide-react"



// Declare YT variable
const REFRESH_INTERVAL_MS=10000
declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

interface Song {
  id: string
  title: string
  thumbnail: string
  url: string
  votes: number
  addedAt: Date
  duration: string // Keeping this for queue display, but current song will use player's duration
  channel: string
  youtubeId: string
}


export default function dashboard() {
  const [inputUrl, setInputUrl] = useState("")
  const [previewData, setPreviewData] = useState<Song | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0) // This will hold the actual numeric duration from YouTube player
  const playerRef = useRef<any>(null)
  const [errorMessage, setErrorMessage] = useState("")
// ----Streams
  

  // Fixed useEffect for refreshing streams
  async function refreshStreams() {
    const res = await fetch(`/api/streams/my`, {
      credentials: "include"
    })
  }
 useEffect(() => {
   refreshStreams();
    // Set up interval
    const interval = setInterval(() => {
      
    }, REFRESH_INTERVAL_MS);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);


  const [currentSong, setCurrentSong] = useState<Song>({
    id: "current",
    title: "Bohemian Rhapsody - Queen",
    thumbnail: "/placeholder.svg?height=320&width=480",
    url: "https://youtube.com/watch?v=fJ9rUzIMcZQ",
    votes: 0,
    addedAt: new Date(),
    duration: "5:55", // This will be overridden by actual player duration for display
    channel: "Queen Official",
    youtubeId: "fJ9rUzIMcZQ",
  })

  const [queue, setQueue] = useState<Song[]>([
    {
      id: "1",
      title: "Stairway to Heaven - Led Zeppelin",
      thumbnail: "/placeholder.svg?height=180&width=320",
      url: "https://youtube.com/watch?v=QkF3oxziUI4",
      votes: 15,
      addedAt: new Date(Date.now() - 300000),
      duration: "8:02",
      channel: "Led Zeppelin",
      youtubeId: "QkF3oxziUI4",
    },
    {
      id: "2",
      title: "Hotel California - Eagles",
      thumbnail: "/placeholder.svg?height=180&width=320",
      url: "https://youtube.com/watch?v=09839DpTctU",
      votes: 12,
      addedAt: new Date(Date.now() - 600000),
      duration: "6:30",
      channel: "Eagles",
      youtubeId: "09839DpTctU",
    },
    {
      id: "3",
      title: "Sweet Child O' Mine - Guns N' Roses",
      thumbnail: "/placeholder.svg?height=180&width=320",
      url: "https://youtube.com/watch?v=1w7OgIMMRc4",
      votes: 8,
      addedAt: new Date(Date.now() - 900000),
      duration: "5:03",
      channel: "Guns N' Roses",
      youtubeId: "1w7OgIMMRc4",
    },
    {
      id: "4",
      title: "Imagine - John Lennon",
      thumbnail: "/placeholder.svg?height=180&width=320",
      url: "https://youtube.com/watch?v=YkgkThdzX-8",
      votes: 8,
      addedAt: new Date(Date.now() - 1200000),
      duration: "3:07",
      channel: "John Lennon",
      youtubeId: "YkgkThdzX-8",
    },
  ])

  // Sort queue by votes (desc) then by time added (asc)
  const sortedQueue = [...queue].sort((a, b) => {
    if (a.votes !== b.votes) {
      return b.votes - a.votes
    }
    return a.addedAt.getTime() - b.addedAt.getTime()
  })

  // Extract YouTube ID from URL
  const extractYouTubeId = (url: string): string => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : ""
  }

  // Load YouTube API
  useEffect(() => {
    const tag = document.createElement("script")
    tag.src = "https://www.youtube.com/iframe_api"
    const firstScriptTag = document.getElementsByTagName("script")[0]
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player("youtube-player", {
        height: "100%",
        width: "100%",
        videoId: currentSong.youtubeId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: (event: any) => {
            setDuration(event.target.getDuration()) // Set actual duration from player
          },
          onStateChange: (event: any) => {
            const PlayerState = window.YT?.PlayerState || {}
            if (event.data === PlayerState.PLAYING) {
              setIsPlaying(true)
            } else if (event.data === PlayerState.PAUSED) {
              setIsPlaying(false)
            } else if (event.data === PlayerState.ENDED) {
              playNext()
            }
          },
        },
      })
    }

    // Update current time
    const interval = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        setCurrentTime(playerRef.current.getCurrentTime())
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleUrlSubmit = () => {
    if (!inputUrl.trim()) {
      setErrorMessage("Please enter a YouTube URL")
      return
    }

    const youtubeId = extractYouTubeId(inputUrl)
    if (!youtubeId) {
      setErrorMessage("Please enter a valid YouTube URL")
      return
    }

    // Check for duplicates before creating preview
    if (youtubeId === currentSong.youtubeId) {
      setErrorMessage("This song is currently playing!")
      return
    }

    const isDuplicate = queue.some((song) => song.youtubeId === youtubeId)
    if (isDuplicate) {
      setErrorMessage("This song is already in the queue!")
      return
    }

    // Clear any previous errors
    setErrorMessage("")

    // Simulate YouTube API preview (duration here is still a placeholder)
    const newSong: Song = {
      id: Date.now().toString(),
      title: "New Song Title",
      thumbnail: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
      url: inputUrl,
      votes: 0,
      addedAt: new Date(),
      duration: "0:00", // Placeholder, actual duration will be set when played
      channel: "Artist Name",
      youtubeId,
    }

    setPreviewData(newSong)
  }

  const addToQueue = () => {
    if (previewData) {
      // Check if song is currently playing
      if (previewData.youtubeId === currentSong.youtubeId) {
        setErrorMessage("This song is currently playing!")
        return
      }

      // Check if song is already in queue
      const isDuplicate = queue.some((song) => song.youtubeId === previewData.youtubeId)
      if (isDuplicate) {
        setErrorMessage("This song is already in the queue!")
        return
      }

      // Clear any previous errors
      setErrorMessage("")

      setQueue((prev) => [...prev, previewData])
      setPreviewData(null)
      setInputUrl("")
    }
  }

  const vote = (songId: string, increment: number) => {
    setQueue((prev) =>
      prev.map((song) => (song.id === songId ? { ...song, votes: Math.max(0, song.votes + increment) } : song)),
    )
  }

  const formatTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "0:00" // Handle invalid seconds
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handlePlayPause = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo()
      } else {
        playerRef.current.playVideo()
      }
    }
  }

  const playNext = () => {
    if (sortedQueue.length > 0) {
      const nextSong = sortedQueue[0]
      setCurrentSong(nextSong)
      setQueue((prev) => prev.filter((song) => song.id !== nextSong.id))

      if (playerRef.current) {
        playerRef.current.loadVideoById(nextSong.youtubeId)
        playerRef.current.playVideo()
      }
    }
  }

  const handleShare = async () => {
    const shareData = {
      title: `🎵 Now Playing: ${currentSong.title}`,
      text: `Check out what's currently playing on the stream! ${currentSong.title} by ${currentSong.channel}`,
      url: window.location.href,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(
          `🎵 Now Playing: ${currentSong.title} by ${currentSong.channel}\nJoin the stream: ${window.location.href}`,
        )
        alert("Link copied to clipboard!")
      }
    } catch (error) {
      console.error("Error sharing:", error)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="text-center py-6">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Music className="w-8 h-8 text-purple-400" />
            Stream Queue
          </h1>
          <p className="text-purple-200">Vote for the next song to play on the stream</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Add Song */}
          <div className="space-y-6">
            <Card className="bg-gray-800/50 border-purple-500/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Play className="w-5 h-5 text-purple-400" />
                  Add Song
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Paste YouTube URL here..."
                    value={inputUrl}
                    onChange={(e) => {
                      setInputUrl(e.target.value)
                      if (errorMessage) setErrorMessage("") // Clear error when user types
                    }}
                    className="bg-gray-700/50 border-purple-500/30 text-white placeholder:text-gray-400"
                    onKeyPress={(e) => e.key === "Enter" && handleUrlSubmit()}
                  />
                  <Button onClick={handleUrlSubmit} className="bg-purple-600 hover:bg-purple-700">
                    Preview
                  </Button>
                </div>

                {errorMessage && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <p className="text-red-400 text-sm font-medium">{errorMessage}</p>
                    </div>
                  </div>
                )}

                {previewData && (
                  <div className="space-y-3">
                    <img
                      src={previewData.thumbnail || "/placeholder.svg"}
                      alt={previewData.title}
                      className="w-full rounded-lg"
                    />
                    <div>
                      <h3 className="text-white font-medium">{previewData.title}</h3>
                      <p className="text-gray-400 text-sm">
                        {previewData.channel} • {previewData.duration}
                      </p>
                    </div>
                    <Button onClick={addToQueue} className="w-full bg-green-600 hover:bg-green-700">
                      Add to Queue
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className="bg-gray-800/50 border-purple-500/20 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-purple-400">{queue.length}</div>
                    <div className="text-gray-400 text-sm">Songs in Queue</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-400">
                      {queue.reduce((sum, song) => sum + song.votes, 0)}
                    </div>
                    <div className="text-gray-400 text-sm">Total Votes</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - Now Playing */}
          <div>
            <Card className="bg-gray-800/50 border-purple-500/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-green-400" />
                  Now Playing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Video Preview - Hidden YouTube Player */}
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                    {/* Hidden YouTube Player */}
                    <div
                      id="youtube-player"
                      className="absolute -top-96 left-0 w-1 h-1 opacity-0 pointer-events-none"
                    ></div>

                    {/* Video Thumbnail Display */}
                    <div className="relative w-full h-full">
                      <img
                        src={`https://img.youtube.com/vi/${currentSong.youtubeId}/maxresdefault.jpg`}
                        alt={currentSong.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = currentSong.thumbnail || "/placeholder.svg?height=320&width=480"
                        }}
                      />

                      {/* Overlay with play state */}
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        {!isPlaying && (
                          <div className="bg-black/50 rounded-full p-4">
                            <Play className="w-12 h-12 text-white" />
                          </div>
                        )}
                        {isPlaying && (
                          <div className="absolute bottom-4 right-4">
                            <div className="flex items-center gap-2 bg-black/70 rounded-full px-3 py-1">
                              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                              <span className="text-white text-xs font-medium">PLAYING</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <Badge className="absolute top-2 left-2 bg-red-600 animate-pulse">LIVE</Badge>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">{currentSong.title}</h2>
                    <p className="text-gray-400">
                      {currentSong.channel} • {formatTime(duration)}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Media Controls */}
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      onClick={handlePlayPause}
                      size="lg"
                      className="bg-purple-600 hover:bg-purple-700 rounded-full w-12 h-12 p-0"
                    >
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    </Button>
                    <Button
                      onClick={playNext}
                      disabled={sortedQueue.length === 0}
                      className="bg-gray-600 hover:bg-gray-700 rounded-full w-10 h-10 p-0"
                    >
                      <SkipForward className="w-5 h-5" />
                    </Button>
                  </div>

                  <Button
                    onClick={handleShare}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium"
                  >
                    <Share className="w-4 h-4 mr-2" />
                    Share Current Song
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Queue */}
          <div>
            <Card className="bg-gray-800/50 border-purple-500/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-400" />
                  Up Next ({queue.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {sortedQueue.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Music className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No songs in queue</p>
                      <p className="text-sm">Add some songs to get started!</p>
                    </div>
                  ) : (
                    sortedQueue.map((song, index) => (
                      <div key={song.id} className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg">
                        <div className="text-purple-400 font-bold text-sm w-6">#{index + 1}</div>
                        <img
                          src={song.thumbnail || "/placeholder.svg"}
                          alt={song.title}
                          className="w-16 h-12 rounded object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white text-sm font-medium truncate">{song.title}</h3>
                          <p className="text-gray-400 text-xs">{song.channel}</p>
                          <p className="text-gray-500 text-xs">{formatTimeAgo(song.addedAt)}</p>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => vote(song.id, 1)}
                            className="h-6 w-6 p-0 text-green-400 hover:text-green-300 hover:bg-green-400/10"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </Button>
                          <span className="text-white text-sm font-bold">{song.votes}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => vote(song.id, -1)}
                            className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
