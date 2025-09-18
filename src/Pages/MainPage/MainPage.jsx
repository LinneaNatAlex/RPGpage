// imports the nessecary components
import styles from "./MainPage.module.css";
import { Link } from "react-router-dom";
import Chat from "../../Components/Chat/Chat";
import NewsFeed from "../../Components/NewsFeed/NewsFeed";
import OnlineUsers from "../../Components/OnlineUsers/OnlineUsers";
import { useAuth } from "../../context/authContext";
import Button from "../../Components/Button/Button";
import { useState, useEffect } from "react";
import PrivateChat from "../../Components/Chat/PrivateChat";
import RPGCalendarSidebar from "../../Components/RPGCalendarSidebar";
import AnnouncementBanner from "../../Components/AnnouncementBanner/AnnouncementBanner";
import AnnouncementAdmin from "../../Components/AnnouncementBanner/AnnouncementAdmin";
import TopBar from "../../Components/TopBar/TopBar";

// state variables to handle the components that are shown in the main page
const MainPage = () => {
  const [activeTab, setActiveTab] = useState("newsFeed");
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatActiveTab, setChatActiveTab] = useState("mainChat");
  const isMobile = window.innerWidth <= 768;
  const { user } = useAuth();
  const displayName = user?.displayName || user?.email;
  // --------------------------------RETURNING HEADER TEXT----------------------------
  // simple returning of HTML showing the introduction page
  // Tilbake til enkel desktop/mobil logikk uten modal eller floating button

  return (
    <section className={styles.introductionPage}>
      {user && <TopBar />}
      <AnnouncementBanner user={user} />
      {user?.roles?.includes("admin") || user?.roles?.includes("teacher") ? (
        <AnnouncementAdmin user={user} />
      ) : null}
      {user?.roles?.includes("admin") ? (
        <header className={styles.introductionHeader}>
          <h1 className={styles.introductionTitle}>
            {" "}
            Welcome {displayName || "Werewolf/Witch/Vampire/Fairy"}{" "}
          </h1>
          <p className={styles.introductionText}>
            Your mystical journey continues. Check the notice board for updates,
            attend classes and quests, and keep an eye on your magical race
            points. Remember: magic is shaped by the choices you make.
            {/* if not user the text below wil show */}
            {!user && (
              <>
                Are you ready to begin your journey as a werewolf, witch,
                vampire, or fairy? Here you can discover your magical race,
                attend mystical classes like Alchemy and Enchantments, and write
                your own Veyloria Arcane School story. Join a thriving community
                and experience the magic like never before.
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
            </>
          )}
        </header>
      ) : (
        <header className={styles.introductionHeader}>
          <h1 className={styles.introductionTitle}>
            {" "}
            Welcome {displayName || "Werewolf/Witch/Vampire/Fairy"}{" "}
          </h1>
          <p className={styles.introductionText}>
            Your mystical journey continues. Check the notice board for updates,
            attend classes and quests, and keep an eye on your magical race
            points. Remember: magic is shaped by the choices you make.
            {/* if not user the text below wil show */}
            {!user && (
              <>
                Are you ready to begin your journey as a werewolf, witch,
                vampire, or fairy? Here you can discover your magical race,
                attend mystical classes like Alchemy and Enchantments, and write
                your own Veyloria Arcane School story. Join a thriving community
                and experience the magic like never before.
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
            </>
          )}
        </header>
      )}
      <main className={styles.mainContentHome}>
        <div className={styles.onlineUsersContainer}>
          {user && <OnlineUsers />}
        </div>
        <div className={styles.newsFeedContainer}>{user && <NewsFeed />}</div>
        {/* Right sidebar for RPG calendar, only show on desktop */}
        {user && (
          <div className={styles.rpgCalendarSidebarContainer}>
            <RPGCalendarSidebar />
          </div>
        )}
      </main>
      
      {/* Chat Modal for Mobile */}
      {user && isMobile && (
        <>
          {/* Floating Action Button */}
          <button
            className={styles.fabChatBtn}
            onClick={() => setShowChatModal(true)}
            aria-label="Open Chat"
          >
            💬
          </button>
          
          {/* Chat Modal */}
          {showChatModal && (
            <div className={styles.chatModalOverlay}>
              <div className={styles.chatModal}>
                <div className={styles.chatModalTabs}>
                  <button
                    className={chatActiveTab === "mainChat" ? styles.activeTab : ""}
                    onClick={() => setChatActiveTab("mainChat")}
                  >
                    Main Chat
                  </button>
                  <button
                    className={chatActiveTab === "privateChat" ? styles.activeTab : ""}
                    onClick={() => setChatActiveTab("privateChat")}
                  >
                    Private Chat
                  </button>
                  <button
                    className={styles.closeModalBtn}
                    onClick={() => setShowChatModal(false)}
                  >
                    ✕
                  </button>
                </div>
                <div className={styles.chatModalContent}>
                  {chatActiveTab === "mainChat" && <Chat />}
                  {chatActiveTab === "privateChat" && <PrivateChat />}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default MainPage;
