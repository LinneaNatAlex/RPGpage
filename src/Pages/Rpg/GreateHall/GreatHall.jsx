// imports the necessary modules and components.
import { useState, useEffect } from "react";
import { db } from "../../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
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
  const watchMatch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (watchMatch) videoId = watchMatch[1];
  else {
    const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) videoId = shortMatch[1];
  }
  return videoId ? { videoId, playlistId } : null;
}

const GreatHall = () => {
  const [forumDescription, setForumDescription] = useState("");
  const [musicSource, setMusicSource] = useState(null); // { videoId, playlistId? }
  const [musicPlaying, setMusicPlaying] = useState(true);

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
    let cancelled = false;
    const cached = cacheHelpers.getConfigStarshadeHall();
    if (cached && typeof cached.dailyMusicUrl !== "undefined") {
      setMusicSource(parseYoutubeUrl(cached.dailyMusicUrl || ""));
      return;
    }
    getDoc(doc(db, "config", "starshadeHall"))
      .then((snap) => {
        if (cancelled) return;
        const data = snap.exists() ? snap.data() : {};
        cacheHelpers.setConfigStarshadeHall(data);
        setMusicSource(parseYoutubeUrl(data.dailyMusicUrl || ""));
      })
      .catch(() => { if (!cancelled) setMusicSource(null); });
    return () => { cancelled = true; };
  }, []);

  const handlePlayPause = () => setMusicPlaying((p) => !p);

  const iframeSrc = (() => {
    if (!musicSource?.videoId) return null;
    const { videoId, playlistId } = musicSource;
    if (playlistId) {
      return `https://www.youtube.com/embed/videoseries?list=${playlistId}&autoplay=1`;
    }
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}`;
  })();

  return (
    <div className={styles.GreatHallClass}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Starshade Hall</h1>
      </div>
      <LiveRP
        descriptionText={forumDescription}
        slotAboveDescription={
          musicSource ? (
            <div className={styles.musicWidget}>
              <div className={styles.musicWidgetBar}>
                <span className={styles.musicWidgetLabel}>Background music</span>
                <button type="button" className={styles.musicWidgetBtn} onClick={handlePlayPause}>
                  {musicPlaying ? "Stop" : "Play"}
                </button>
              </div>
              {musicPlaying && iframeSrc && (
                <iframe
                  title="Background music"
                  src={iframeSrc}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                  allowFullScreen
                  className={styles.musicIframeHidden}
                />
              )}
            </div>
          ) : null
        }
      />
    </div>
  );
};

export default GreatHall;
