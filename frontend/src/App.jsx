import React, { useState, useEffect, useRef } from "react";

const API_BASE = window.location.origin + "/api";

const styles = {
  app: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: "#121212",
    color: "#fff",
    minHeight: "100vh",
    padding: 0,
    margin: 0,
  },
  header: {
    background: "#1DB954",
    padding: "16px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    fontSize: "20px",
    fontWeight: 700,
    color: "#fff",
    margin: 0,
  },
  badge: {
    fontSize: "11px",
    background: "rgba(0,0,0,0.3)",
    padding: "4px 10px",
    borderRadius: "12px",
    color: "#fff",
  },
  searchBar: {
    padding: "16px 24px",
    background: "#181818",
  },
  input: {
    width: "100%",
    maxWidth: "480px",
    padding: "10px 16px",
    borderRadius: "24px",
    border: "none",
    background: "#282828",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  },
  songList: {
    padding: "8px 24px",
  },
  songRow: {
    display: "flex",
    alignItems: "center",
    padding: "10px 16px",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "background 0.15s",
    gap: "16px",
  },
  songIndex: {
    width: "24px",
    textAlign: "right",
    color: "#b3b3b3",
    fontSize: "14px",
    flexShrink: 0,
  },
  songInfo: {
    flex: 1,
    minWidth: 0,
  },
  songTitle: {
    fontSize: "15px",
    fontWeight: 500,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  songArtist: {
    fontSize: "13px",
    color: "#b3b3b3",
    marginTop: "2px",
  },
  songDuration: {
    color: "#b3b3b3",
    fontSize: "13px",
    flexShrink: 0,
  },
  player: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    background: "#282828",
    borderTop: "1px solid #333",
    padding: "12px 24px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  playerInfo: {
    flex: 1,
    minWidth: 0,
  },
  playerTitle: {
    fontSize: "14px",
    fontWeight: 500,
  },
  playerArtist: {
    fontSize: "12px",
    color: "#b3b3b3",
  },
  playBtn: {
    background: "#1DB954",
    border: "none",
    borderRadius: "50%",
    width: "36px",
    height: "36px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontSize: "16px",
    color: "#fff",
  },
  status: {
    fontSize: "12px",
    color: "#b3b3b3",
    padding: "8px 24px",
  },
};

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function App() {
  const [songs, setSongs] = useState([]);
  const [query, setQuery] = useState("");
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [health, setHealth] = useState(null);
  const audioRef = useRef(new Audio());

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth({ status: "unreachable" }));
    loadSongs();
  }, []);

  async function loadSongs() {
    try {
      const res = await fetch(`${API_BASE}/songs?limit=50`);
      const data = await res.json();
      setSongs(data.songs || []);
    } catch (err) {
      console.error("Failed to load songs:", err);
    }
  }

  async function search(q) {
    setQuery(q);
    if (!q.trim()) return loadSongs();
    try {
      const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}&type=song`);
      const data = await res.json();
      setSongs(data.songs || []);
    } catch (err) {
      console.error("Search failed:", err);
    }
  }

  async function playSong(song) {
    try {
      const res = await fetch(`${API_BASE}/songs/${song.song_id}`);
      const data = await res.json();

      audioRef.current.pause();
      audioRef.current.src = data.stream_url;
      audioRef.current.play().catch(() => {});
      setCurrentSong(data);
      setIsPlaying(true);

      audioRef.current.onended = () => setIsPlaying(false);
    } catch (err) {
      console.error("Play failed:", err);
    }
  }

  function togglePlay() {
    if (!currentSong) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1 style={styles.logo}>Spotify AWS</h1>
        <span style={styles.badge}>
          {health?.status === "healthy" ? "API Connected" : "API Offline"}
        </span>
      </header>

      <div style={styles.searchBar}>
        <input
          style={styles.input}
          type="text"
          placeholder="Search songs or artists..."
          value={query}
          onChange={(e) => search(e.target.value)}
        />
      </div>

      <div style={styles.status}>
        {songs.length} songs {query && `matching "${query}"`}
      </div>

      <div style={styles.songList}>
        {songs.map((song, i) => (
          <div
            key={song.song_id}
            style={{
              ...styles.songRow,
              background:
                currentSong?.song_id === song.song_id
                  ? "rgba(29,185,84,0.15)"
                  : "transparent",
            }}
            onClick={() => playSong(song)}
            onMouseEnter={(e) => {
              if (currentSong?.song_id !== song.song_id)
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
            }}
            onMouseLeave={(e) => {
              if (currentSong?.song_id !== song.song_id)
                e.currentTarget.style.background = "transparent";
            }}
          >
            <span style={styles.songIndex}>{i + 1}</span>
            <div style={styles.songInfo}>
              <div
                style={{
                  ...styles.songTitle,
                  color:
                    currentSong?.song_id === song.song_id ? "#1DB954" : "#fff",
                }}
              >
                {song.title}
              </div>
              <div style={styles.songArtist}>{song.artist_name}</div>
            </div>
            <span style={styles.songDuration}>
              {formatDuration(song.duration)}
            </span>
          </div>
        ))}
      </div>

      {currentSong && (
        <div style={styles.player}>
          <button style={styles.playBtn} onClick={togglePlay}>
            {isPlaying ? "\u275A\u275A" : "\u25B6"}
          </button>
          <div style={styles.playerInfo}>
            <div style={styles.playerTitle}>{currentSong.title}</div>
            <div style={styles.playerArtist}>{currentSong.artist?.name}</div>
          </div>
          <span style={{ fontSize: "12px", color: "#b3b3b3" }}>
            {formatDuration(currentSong.duration)}
          </span>
        </div>
      )}
    </div>
  );
}
