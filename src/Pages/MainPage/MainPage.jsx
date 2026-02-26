// imports the nessecary components
import styles from "./MainPage.module.css";
import { Link } from "react-router-dom";
import NewsFeed from "../../Components/NewsFeed/NewsFeed";
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
        {user ? (
          <>Welcome {displayName || "Werewolf/Witch/Vampire/Elf"}</>
        ) : (
          <>Welcome to Vayloria Arcane School</>
        )}
      </h1>
      <p className={styles.introductionText}>
        {user ? (
          <>
            Your mystical journey continues. Check the notice board for updates,
            attend classes and quests, and keep an eye on your magical race points.
            Remember: magic is shaped by the choices you make.
          </>
        ) : (
          <>
            Step into a world where magic flows through every word you write. 
            Vayloria Arcane School is a text-based roleplaying community where 
            writers become students of the mystical arts. Create your character, 
            discover your magical race, and weave your story alongside fellow 
            werewolves, witches, vampires, and elves.
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

          {/* Features Section */}
          <div className={styles.featuresSection}>
            <h2 className={styles.featuresTitle}>Discover Your Magical Path</h2>
            <div className={styles.featuresGrid}>
              <div className={styles.featureCard}>
                <h3 className={styles.featureCardTitle}>Roleplay & Storytelling</h3>
                <p className={styles.featureCardText}>
                  Enter Starshade Hall, our live roleplay chat where your character 
                  comes to life. Write, interact, and create stories in real-time 
                  with other students. Every message is part of your character's 
                  journey through Vayloria.
                </p>
              </div>
              <div className={styles.featureCard}>
                <h3 className={styles.featureCardTitle}>Mystical Classes</h3>
                <p className={styles.featureCardText}>
                  Attend classes like Alchemy, Potions, Astronomy, Ancient Languages & World Culture, 
                  and more. Each class offers unique knowledge and rewards. Learn the 
                  arts that shape the magical world and earn points for your house.
                </p>
              </div>
              <div className={styles.featureCard}>
                <h3 className={styles.featureCardTitle}>Discover Your Race</h3>
                <p className={styles.featureCardText}>
                  Through our sorting quiz, discover whether you are a Werewolf, 
                  Witch, Vampire, or Elf. Each race has its own unique traits, 
                  history, and magical abilities. Your race shapes your journey.
                </p>
              </div>
              <div className={styles.featureCard}>
                <h3 className={styles.featureCardTitle}>Write Your Story</h3>
                <p className={styles.featureCardText}>
                  Create detailed character profiles, write backstories, and 
                  craft your own Vayloria Arcane School narrative. Share your 
                  character's journey and explore others' stories in the forums.
                </p>
              </div>
              <div className={styles.featureCard}>
                <h3 className={styles.featureCardTitle}>Community Forums</h3>
                <p className={styles.featureCardText}>
                  Join discussions, share ideas, and connect with fellow writers. 
                  Our forums are spaces for both in-character roleplay and 
                  out-of-character community building.
                </p>
              </div>
              <div className={styles.featureCard}>
                <h3 className={styles.featureCardTitle}>Live Chat & Events</h3>
                <p className={styles.featureCardText}>
                  Chat with other students in real-time, participate in school 
                  events, and stay updated with the latest news from Vayloria. 
                  The magical world is always alive and evolving.
                </p>
              </div>
            </div>
          </div>

          {/* How It Works Section */}
          <div className={styles.howItWorksSection}>
            <h2 className={styles.howItWorksTitle}>How Vayloria Works</h2>
            <div className={styles.howItWorksSteps}>
              <div className={styles.stepCard}>
                <div className={styles.stepNumber}>1</div>
                <h3 className={styles.stepTitle}>Create Your Character</h3>
                <p className={styles.stepText}>
                  Sign up and create your student character. Choose a name, 
                  design your profile, and prepare to discover your magical race.
                </p>
              </div>
              <div className={styles.stepCard}>
                <div className={styles.stepNumber}>2</div>
                <h3 className={styles.stepTitle}>Take the Sorting Quiz</h3>
                <p className={styles.stepText}>
                  Complete our sorting quiz to discover whether you're a Werewolf, 
                  Witch, Vampire, or Elf. Your race determines your magical path.
                </p>
              </div>
              <div className={styles.stepCard}>
                <div className={styles.stepNumber}>3</div>
                <h3 className={styles.stepTitle}>Enter Starshade Hall</h3>
                <p className={styles.stepText}>
                  Join the live roleplay chat and start interacting with other 
                  students. Write as your character and watch your story unfold.
                </p>
              </div>
              <div className={styles.stepCard}>
                <div className={styles.stepNumber}>4</div>
                <h3 className={styles.stepTitle}>Attend Classes & Explore</h3>
                <p className={styles.stepText}>
                  Enroll in mystical classes, participate in forums, write stories, 
                  and build relationships with other characters. The school is yours to explore.
                </p>
              </div>
            </div>
          </div>

          {/* User-Generated World Section */}
          <div className={styles.userGeneratedSection}>
            <h2 className={styles.userGeneratedTitle}>A World Built by You</h2>
            <p className={styles.userGeneratedText}>
              Vayloria Arcane School is not a fandom or a pre-written universe. 
              It's a fantasy world that grows and evolves with every story you write, 
              every character you create, and every interaction you have. The more 
              content you and other students contribute, the more of the world 
              unfolds and develops. You're not just playing in someone else's 
              universe—you're actively building and shaping Vayloria as you go. 
              Every post, every class, every roleplay session adds to the living, 
              breathing world that we create together.
            </p>
          </div>

          {/* Promotional Section */}
          <div className={styles.promotionalSection}>
            <h2 className={styles.promotionalTitle}>A World of Magic Awaits</h2>
            <p className={styles.promotionalText}>
              Vayloria Arcane School is more than a roleplaying game—it's a 
              community of writers, storytellers, and magical beings. Whether 
              you're crafting epic adventures, attending classes, or simply 
              chatting with fellow students, every moment is part of your 
              character's unique journey. Join us and become part of a thriving 
              magical community where your words create the magic.
            </p>
            <div className={styles.promotionalHighlights}>
              <div className={styles.highlightItem}>
                <span className={styles.highlightText}>Text-Based Roleplay</span>
              </div>
              <div className={styles.highlightItem}>
                <span className={styles.highlightText}>Character Creation</span>
              </div>
              <div className={styles.highlightItem}>
                <span className={styles.highlightText}>Magical Classes</span>
              </div>
              <div className={styles.highlightItem}>
                <span className={styles.highlightText}>Four Magical Races</span>
              </div>
              <div className={styles.highlightItem}>
                <span className={styles.highlightText}>Rewards & Points</span>
              </div>
              <div className={styles.highlightItem}>
                <span className={styles.highlightText}>Active Community</span>
              </div>
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
      (user?.roles?.includes("professor") || user?.roles?.includes("teacher")) ||
      user?.roles?.includes("archivist") ? (
        <AnnouncementAdmin user={user} />
      ) : null}
      <header className={styles.introductionHeader}>
        <HeaderContent />
      </header>
      <main className={styles.mainContentHome}>
        <div className={styles.newsFeedContainer}>{user && <NewsFeed />}</div>
        {user && (
          <div className={styles.rpgCalendarSidebarContainer}>
            <RPGCalendarSidebar />
            <div id="news-pagination-portal" className={styles.newsPaginationSlot} />
          </div>
        )}
      </main>
    </section>
  );
};

export default MainPage;
