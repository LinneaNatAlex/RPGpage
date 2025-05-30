import styles from "./MainPage.module.css";
import { Link } from "react-router-dom";
import Chat from "../../Components/Chat/Chat";
import NewsFeed from "../../Components/NewsFeed/NewsFeed";
import OnlineUsers from "../../Components/OnlineUsers/OnlineUsers";
import { useAuth } from "../../context/authContext";
import Button from "../../Components/Button/Button";
import { useState, useEffect } from "react";

const MainPage = () => {
  const [activeTab, setActiveTab] = useState("newsFeed");
  const isMobile = window.innerWidth <= 768;
  const { user } = useAuth();
  const displayName = user?.displayName || user?.email;

  return (
    <section className={styles.introductionPage}>
      <header className={styles.introductionHeader}>
        <h1 className={styles.introductionTitle}>
          {" "}
          Welcome {displayName || "Witch/Wizard"}{" "}
        </h1>
        <p className={styles.introductionText}>
          Your magical journey continues. Check the notice board for updates,
          attend classes and quests, and keep an eye on your house points.
          Remember: magic is shaped by the choices you make.
          {!user && (
            <>
              Are you ready to begin your journey as a witch or wizard? Here you
              can be sorted into a house, attend magical classes like Potions
              and Defense Against the Dark Arts, and write your own Hogwarts
              story. Join a thriving community and experience the magic like
              never before.
            </>
          )}
        </p>

        {/* to make sure the only see the links if they are not logged in */}
        {!user && (
          <>
            <div className={styles.ctaBtnContainer}>
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
      <main className={styles.mainContentHome}>
        <div className={styles.onlineUsersContainer}>
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
    </section>
  );
};

export default MainPage;
