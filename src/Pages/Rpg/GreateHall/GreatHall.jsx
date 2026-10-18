// imports the necessary modules and components.
import { useState, useEffect, useRef } from "react";
import { db } from "../../../firebaseConfig";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { cacheHelpers } from "../../../utils/firebaseCache";
import styles from "./GreatHall.module.css";
import LiveRP from "../../../Components/LiveRP/LiveRP.jsx";
const DESCRIPTION_KEY = "starshadehall";

/** Parse YouTube URL: { videoId, playlistId? }. Single video = loop; playlist = play through. */
function parseYoutubeUrl(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  let videoId = null;
  let playlistId = null;
  const listMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (listMatch) playlistId = listMatch[1];
  const idMatch = trimmed.match(
    /(?:youtube\.com\/watch\?(?:[^#]*&)?v=|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/|music\.youtube\.com\/watch\?(?:[^#]*&)?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  if (idMatch) videoId = idMatch[1];
  else {
    const vParam = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (vParam) videoId = vParam[1];
  }
  if (videoId || playlistId) return { videoId, playlistId };
  return null;
}

function loadYoutubeIframeApi() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("no window"));
  }
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previous === "function") previous();
      if (window.YT) resolve(window.YT);
    };
    if (!document.querySelector("script[src*='youtube.com/iframe_api']")) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      document.head.appendChild(tag);
    }
    const tick = () => {
      if (window.YT && window.YT.Player) {
        resolve(window.YT);
        return;
      }
      if (Date.now() - started > 15000) {
        reject(new Error("YouTube API timeout"));
        return;
      }
      window.setTimeout(tick, 50);
    };
    tick();
  });
}

const GreatHall = () => {
  const [forumDescription, setForumDescription] = useState("");
  const [musicSource, setMusicSource] = useState(null); // { videoId, playlistId? }
  const [musicPlaying, setMusicPlaying] = useState(false);
  const playerHostRef = useRef(null);
  const playerRef = useRef(null);
  const hallPageRef = useRef(null);
  const wantPlayRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const cached = cacheHelpers.getForumDescriptions();
    if (cached?.descriptions?.[DESCRIPTION_KEY] !== undefined) {
      setForumDescription(cached.descriptions[DESCRIPTION_KEY] || "");
      return;
    }
    getDoc(doc(db, "config", "forumDescriptions"))
      .then((snap) => {
        if (cancelled) return;
        const data = snap.exists() ? snap.data() : {};
        const descriptions = data.descriptions || {};
        cacheHelpers.setForumDescriptions({ descriptions });
        setForumDescription(descriptions[DESCRIPTION_KEY] || "");
      })
      .catch(() => { if (!cancelled) setForumDescription(""); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const cached = cacheHelpers.getConfigStarshadeHall();
    if (cached && typeof cached.dailyMusicUrl !== "undefined") {
      setMusicSource(parseYoutubeUrl(cached.dailyMusicUrl || ""));
    }
    const unsub = onSnapshot(
      doc(db, "config", "starshadeHall"),
      (snap) => {
        const data = snap.exists() ? snap.data() : {};
        cacheHelpers.setConfigStarshadeHall(data);
        setMusicSource(parseYoutubeUrl(data.dailyMusicUrl || ""));
      },
      () => setMusicSource(null),
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!musicSource?.videoId && !musicSource?.playlistId) {
      try {
        playerRef.current?.destroy?.();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
      setMusicPlaying(false);
      return;
    }

    let cancelled = false;
    loadYoutubeIframeApi()
      .then((YT) => {
        if (cancelled || !playerHostRef.current || !YT?.Player) return;
        try {
          playerRef.current?.destroy?.();
        } catch {
          /* ignore */
        }
        playerHostRef.current.innerHTML = "";
        const mount = document.createElement("div");
        playerHostRef.current.appendChild(mount);
        const playerVars = {
          autoplay: 1,
          mute: 1,
          controls: 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
        };
        if (musicSource.playlistId) {
          playerVars.listType = "playlist";
          playerVars.list = musicSource.playlistId;
        } else if (musicSource.videoId) {
          playerVars.loop = 1;
          playerVars.playlist = musicSource.videoId;
        }
        const startPlayer = (target) => {
          if (!target) return;
          try {
            target.setVolume?.(80);
            if (wantPlayRef.current) {
              target.unMute?.();
              target.playVideo?.();
            } else {
              target.mute?.();
              target.playVideo?.();
            }
          } catch {
            setMusicPlaying(false);
          }
        };
        playerRef.current = new YT.Player(mount, {
          width: 160,
          height: 90,
          videoId: musicSource.videoId || undefined,
          playerVars,
          events: {
            onReady: (e) => {
              if (cancelled) return;
              playerRef.current = e.target;
              startPlayer(e.target);
            },
            onStateChange: (e) => {
              if (cancelled) return;
              const playing = e.data === 1;
              let muted = false;
              try {
                muted = !!e.target.isMuted?.();
              } catch {
                muted = false;
              }
              setMusicPlaying(playing && !muted);
              if (playing && wantPlayRef.current) {
                try {
                  e.target.unMute?.();
                  e.target.setVolume?.(80);
                } catch {
                  /* ignore */
                }
                wantPlayRef.current = false;
              }
            },
            onError: () => {
              if (!cancelled) setMusicPlaying(false);
            },
          },
        });
      })
      .catch(() => {
        if (!cancelled) setMusicPlaying(false);
      });

    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy?.();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
    };
  }, [musicSource?.videoId, musicSource?.playlistId]);

  useEffect(() => {
    if (!musicSource?.videoId && !musicSource?.playlistId) return;
    const hallEl = hallPageRef.current;
    if (!hallEl) return;
    const startFromGesture = () => {
      const player = playerRef.current;
      if (!player?.playVideo) return;
      try {
        player.unMute?.();
        player.playVideo();
      } catch {
        /* ignore */
      }
    };
    hallEl.addEventListener("pointerdown", startFromGesture, { once: true });
    return () => hallEl.removeEventListener("pointerdown", startFromGesture);
  }, [musicSource?.videoId, musicSource?.playlistId]);

  const handlePlayPause = () => {
    const player = playerRef.current;
    if (!player?.playVideo) {
      wantPlayRef.current = true;
      return;
    }
    try {
      const state = player.getPlayerState?.();
      const muted = !!player.isMuted?.();
      if (state === 1 && !muted) {
        wantPlayRef.current = false;
        player.pauseVideo();
        setMusicPlaying(false);
        return;
      }
      wantPlayRef.current = true;
      player.unMute?.();
      player.setVolume?.(80);
      player.playVideo();
    } catch {
      wantPlayRef.current = true;
    }
  };

  const hasMusic = Boolean(musicSource?.videoId || musicSource?.playlistId);

  return (
    <div className={styles.hallPage} ref={hallPageRef}>
      <header className={styles.hallHeader}>
        <div>
          <p className={styles.hallKicker}>Live roleplay</p>
          <h1 className={styles.title}>Starshade Hall</h1>
        </div>
        {hasMusic ? (
          <div className={styles.musicWidget}>
            <div className={styles.musicWidgetBar}>
              <span className={styles.musicWidgetLabel}>Music</span>
              <button type="button" className={styles.musicWidgetBtn} onClick={handlePlayPause}>
                {musicPlaying ? "Stop" : "Play"}
              </button>
            </div>
            <div className={styles.musicPlayerHost} aria-hidden>
              <div ref={playerHostRef} />
            </div>
          </div>
        ) : null}
      </header>
      <div className={styles.hallStage}>
        <LiveRP descriptionText={forumDescription} />
      </div>
    </div>
  );
};

export default GreatHall;
