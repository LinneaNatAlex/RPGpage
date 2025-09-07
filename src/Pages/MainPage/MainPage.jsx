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

// state variables to handle the components that are shown in the main page
const MainPage = () => {
  const [activeTab, setActiveTab] = useState("newsFeed");
  const isMobile = window.innerWidth <= 768;
  const { user } = useAuth();
  const displayName = user?.displayName || user?.email;
  // --------------------------------RETURNING HEADER TEXT----------------------------
  // simple returning of HTML showing the introduction page
  return (
    <section className={styles.introductionPage}>
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
              Are you ready to begin your journey as a werewolf, witch, vampire,
              or fairy? Here you can discover your magical race, attend mystical
              classes like Alchemy and Enchantments, and write your own Veyloria
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
          </>
        )}
      </header>
      {/* ----------------------------MOBILE CONTENT RESPONSIVNES------------------------- */}
      <main className={styles.mainContentHome}>
        <div className={styles.onlineUsersContainer}>
          {/* Makes a mobile menu for users online to guid through the page on the mainpage */}
          {user &&
            (isMobile ? (
              activeTab === "users" && <OnlineUsers />
            ) : (
              <OnlineUsers />
            ))}
        </div>
        <div className={styles.newsFeedContainer}>
          {user &&
            (isMobile ? (
              activeTab === "newsFeed" && <NewsFeed />
            ) : (
              <NewsFeed />
            ))}
        </div>
        <div className={styles.chatContainer}>
          {user && (isMobile ? activeTab === "chat" && <Chat /> : <Chat />)}
        </div>
      </main>
      {/* Responsive navigation for the MainPage */}
      {user && (
        <nav className={styles.mobileNavigation}>
          <Button onClick={() => setActiveTab("newsFeed")}>News</Button>
          <Button onClick={() => setActiveTab("chat")}>Chat</Button>
          <Button onClick={() => setActiveTab("users")}>Online</Button>
        </nav>
      )}
      {/* Private chat floating window */}
      <PrivateChat />
    </section>
  );
};

export default MainPage;
