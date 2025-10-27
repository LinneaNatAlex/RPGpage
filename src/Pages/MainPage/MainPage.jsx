// imports the nessecary components
import styles from "./MainPage.module.css";
import { Link } from "react-router-dom";
import NewsFeed from "../../Components/NewsFeed/NewsFeed";
import OnlineUsers from "../../Components/OnlineUsers/OnlineUsers";
import { useAuth } from "../../context/authContext";
import RPGCalendarSidebar from "../../Components/RPGCalendarSidebar";
import AnnouncementBanner from "../../Components/AnnouncementBanner/AnnouncementBanner";
import AnnouncementAdmin from "../../Components/AnnouncementBanner/AnnouncementAdmin";
import {
  subscribeToStats,
  getCurrentStats,
  refreshStats,
} from "../../utils/userStatsCache";
import { useState, useEffect } from "react";

const MainPage = () => {
  const { user } = useAuth();
  const displayName = user?.displayName || user?.email;

  const [stats, setStats] = useState(getCurrentStats());
  const [loading, setLoading] = useState(true);

  // Test function to force stats update
  const testStatsUpdate = () => {
    refreshStats();
  };

  useEffect(() => {
    const unsubscribe = subscribeToStats((newStats) => {
      setStats(newStats);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // --------------------------------RETURNING HEADER TEXT----------------------------
  // simple returning of HTML showing the introduction page
  // Tilbake til enkel desktop/mobil logikk uten modal eller floating button

  // Common header content component
  const HeaderContent = () => (
    <>
      <h1 className={styles.introductionTitle}>
        {" "}
        Welcome {displayName || "Werewolf/Witch/Vampire/Fairy"}{" "}
      </h1>
      <p className={styles.introductionText}>
        Your mystical journey continues. Check the notice board for updates,
        attend classes and quests, and keep an eye on your magical race points.
        Remember: magic is shaped by the choices you make.
        {/* if not user the text below wil show */}
        {!user && (
          <>
            Are you ready to begin your journey as a werewolf, witch, vampire,
            or fairy? Here you can discover your magical race, attend mystical
            classes like Alchemy and Enchantments, and write your own Vayloria
            Arcane School story. Join a thriving community and experience the
            magic like never before.
          </>
        )}
      </p>
      {/* -------------------------IF NOT USER!------------------------------------- */}
      {/* to make sure the only see the links if they are not logged in */}
      {!user && (
        <>
          <div className={styles.ctaBtnContainer}>
            {/* if not user then links below wil display, giving user choice to register or log in */}
            <Link to="/sign-in" className={styles.ctaBtn}>
              Enter the Castle
            </Link>
            <Link to="/sign-up" className={styles.ctaBtn}>
              Create an Account
            </Link>
          </div>

          {/* User Statistics */}
          <div className={styles.userStats}>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>
                {loading ? "..." : stats.onlineUsers}
              </span>
              <span className={styles.statLabel}>Online Now</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>
                {loading ? "..." : stats.dailyActiveUsers}
              </span>
              <span className={styles.statLabel}>Active Today</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>
                {loading ? "..." : stats.totalUsers}
              </span>
              <span className={styles.statLabel}>Total Students</span>
            </div>
          </div>
        </>
      )}
    </>
  );

  return (
    <section className={styles.introductionPage}>
      <AnnouncementBanner user={user} />
      {user?.roles?.includes("admin") ||
      user?.roles?.includes("teacher") ||
      user?.roles?.includes("archivist") ? (
        <AnnouncementAdmin user={user} />
      ) : null}
      <header className={styles.introductionHeader}>
        <HeaderContent />
      </header>
      <main className={styles.mainContentHome}>
        <div className={styles.onlineUsersContainer}>
          {user && <OnlineUsers />}
        </div>
        <div className={styles.newsFeedContainer}>{user && <NewsFeed />}</div>
        {/* RPG calendar */}
        {user && (
          <div className={styles.rpgCalendarSidebarContainer}>
            <RPGCalendarSidebar />
          </div>
        )}
      </main>
    </section>
  );
};

export default MainPage;
