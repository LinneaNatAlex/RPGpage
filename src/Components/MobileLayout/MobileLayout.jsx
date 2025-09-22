import { useState, useEffect } from "react";
import { useAuth } from "../../context/authContext.jsx";
import useUserRoles from "../../hooks/useUserRoles";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import React, { Suspense } from "react";
const Chat = React.lazy(() => import("../Chat/Chat"));
const PrivateChat = React.lazy(() => import("../Chat/PrivateChat"));
const OnlineUsers = React.lazy(() => import("../OnlineUsers/OnlineUsers"));
const TopBar = React.lazy(() => import("../TopBar/TopBar"));
const Navbar = React.lazy(() => import("../../Navbar/Navbar"));
const NewsFeed = React.lazy(() => import("../NewsFeed/NewsFeed"));
const RPGCalendarSidebar = React.lazy(() => import("../RPGCalendarSidebar"));
const RPGClock = React.lazy(() => import("../RPGClock/RPGClock"));
const InventoryModal = React.lazy(() =>
  import("../InventoryModal/InventoryModal")
);
import "./MobileLayout.css";

const MobileLayout = ({ children }) => {
  const { roles, rolesLoading } = useUserRoles();
  // Helper to close all overlays (mobil-optimalisert)
  const closeAllOverlays = () => {
    setShowChat(false);
    setShowPrivateChat(false);
    setShowForumList(false);
    setShowNewsFeed(false);
    setShowRPGCalendar(false);
    setShowOnlineUsers(false);
    setShowInventory(false);
    setShowPageRules(false);
    setShowDashboard(false);
  };

  // Kun én overlay åpen om gangen på mobil
  const openOverlay = (overlaySetter) => {
    closeAllOverlays();
    overlaySetter(true);
  };
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [showChat, setShowChat] = useState(false);
  const [showPrivateChat, setShowPrivateChat] = useState(false);
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);
  const [showNewsFeed, setShowNewsFeed] = useState(false);
  const [showRPGCalendar, setShowRPGCalendar] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showForumList, setShowForumList] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showPageRules, setShowPageRules] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Update active tab based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path === "/") {
      setActiveTab("home");
    } else if (path.startsWith("/forum")) {
      setActiveTab("forum");
    } else if (path === "/ClassRooms") {
      setActiveTab("classes");
    } else if (path === "/rpg") {
      setActiveTab("rpg");
    } else if (path === "/Profile") {
      setActiveTab("profile");
    } else if (path === "/userMap") {
      setActiveTab("map");
    } else if (path === "/shop") {
      setActiveTab("shop");
    }
  }, [location.pathname]);

  const handleTabClick = (tab) => {
    closeAllOverlays();
    setActiveTab(tab);
    switch (tab) {
      case "home":
        navigate("/");
        break;
      case "forum":
        openOverlay(setShowForumList);
        break;
      case "classes":
        navigate("/ClassRooms");
        break;
      case "rpg":
        navigate("/rpg");
        break;
      case "profile":
        navigate("/Profile");
        break;
      case "map":
        navigate("/userMap");
        break;
      case "shop":
        navigate("/shop");
        break;
      case "chat":
        openOverlay(setShowChat);
        break;
      case "online":
        setShowChat(false);
        break;
      default:
        break;
    }
  };

  // Don't render mobile layout on desktop
  if (!isMobile) {
    return children;
  }

  // Show warning modal for non-admins on mobile
  const isAdmin = Array.isArray(roles) && roles.includes("admin");
  if (!rolesLoading && !isAdmin) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(30,30,40,0.97)",
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
        }}
      >
        <h1 style={{ color: "#ffd86b", fontSize: "2rem" }}>
          Mobiltilgang midlertidig deaktivert
        </h1>
        <p style={{ fontSize: 18, marginBottom: 16 }}>
          På grunn av tekniske problemer er mobilversjonen midlertidig
          utilgjengelig.
          <br />
          Vennligst bruk PC for å få full tilgang til siden.
          <br />
          <br />
          (Admin-brukere har fortsatt tilgang på mobil)
        </p>
      </div>
    );
  }

  return (
    <div className="mobile-app">
      {/* Mobile Status Bar */}
      <div className="mobile-status-bar">
        <div className="mobile-status-left">
          <span className="mobile-time">12:34</span>
        </div>
        <div className="mobile-status-right">
          <RPGClock isMobile={true} />
        </div>
      </div>

      {/* Mobile Header */}
      <header className="mobile-header">
        <div className="mobile-header-content">
          <div className="mobile-logo-section">
            <div className="mobile-logo-icon">⚡</div>
            <h1 className="mobile-logo-text">Veyloria</h1>
          </div>
        </div>
      </header>

      {/* Mobile Main Content */}
      <main className="mobile-main">
        {/* Mobile TopBar - Always visible */}
        <div className="mobile-topbar-container">
          <Suspense fallback={null}>
            <TopBar />
          </Suspense>
        </div>

        {/* Render actual page content based on route */}
        <div className="mobile-page-content">
          <Outlet />
        </div>

        {/* Mobile Home Page - Welcome message only */}
        {activeTab === "home" && (
          <div className="mobile-home-sections">
            <div className="mobile-welcome-card">
              <div className="mobile-welcome-icon">🏰</div>
              <div className="mobile-welcome-content">
                <h3>Welcome to Veyloria</h3>
                <p>
                  Your magical journey awaits! Use the menu to explore all
                  features.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* News Feed Overlay */}
        {showNewsFeed && (
          <Suspense fallback={null}>
            <div className="mobile-overlay">
              <div className="mobile-overlay-header">
                <h2>News & Announcements</h2>
                <button
                  className="mobile-overlay-close"
                  onClick={() => {
                    setShowNewsFeed(false);
                    navigate("/");
                    setActiveTab("home");
                  }}
                >
                  ✕
                </button>
              </div>
              <div className="mobile-overlay-content">
                <NewsFeed />
              </div>
            </div>
          </Suspense>
        )}

        {/* Online Users Overlay */}
        {showOnlineUsers && (
          <Suspense fallback={null}>
            <div className="mobile-overlay">
              <div className="mobile-overlay-header">
                <h2>Online Students</h2>
                <button
                  className="mobile-overlay-close"
                  onClick={() => {
                    setShowOnlineUsers(false);
                    navigate("/");
                    setActiveTab("home");
                  }}
                >
                  ✕
                </button>
              </div>
              <div className="mobile-overlay-content">
                <OnlineUsers />
              </div>
            </div>
          </Suspense>
        )}

        {/* Page Rules Overlay */}
        {showPageRules && (
          <div className="mobile-overlay">
            <div className="mobile-overlay-header">
              <h2>Page Rules</h2>
              <button
                className="mobile-overlay-close"
                onClick={() => {
                  setShowPageRules(false);
                  navigate("/");
                  setActiveTab("home");
                }}
              >
                ✕
              </button>
            </div>
            <div className="mobile-overlay-content">
              <div className="mobile-rules-list">
                <div className="mobile-rules-category">
                  <h3>Website Rules</h3>
                  <div className="mobile-rules-grid">
                    <button
                      className="mobile-rules-item"
                      onClick={() => {
                        navigate("/generalrules");
                        setShowPageRules(false);
                      }}
                    >
                      <span className="mobile-rules-icon">📜</span>
                      <span className="mobile-rules-name">General Rules</span>
                    </button>
                    <button
                      className="mobile-rules-item"
                      onClick={() => {
                        navigate("/aiusagerules");
                        setShowPageRules(false);
                      }}
                    >
                      <span className="mobile-rules-icon">🤖</span>
                      <span className="mobile-rules-name">AI Usage Rules</span>
                    </button>
                    <button
                      className="mobile-rules-item"
                      onClick={() => {
                        navigate("/contentmediarules");
                        setShowPageRules(false);
                      }}
                    >
                      <span className="mobile-rules-icon">📷</span>
                      <span className="mobile-rules-name">
                        Content & Media Rules
                      </span>
                    </button>
                    <button
                      className="mobile-rules-item"
                      onClick={() => {
                        navigate("/privacysafetyrules");
                        setShowPageRules(false);
                      }}
                    >
                      <span className="mobile-rules-icon">🔒</span>
                      <span className="mobile-rules-name">
                        Privacy & Safety Rules
                      </span>
                    </button>
                    <button
                      className="mobile-rules-item"
                      onClick={() => {
                        navigate("/accountidentityrules");
                        setShowPageRules(false);
                      }}
                    >
                      <span className="mobile-rules-icon">👤</span>
                      <span className="mobile-rules-name">
                        Account & Identity Rules
                      </span>
                    </button>
                    <button
                      className="mobile-rules-item"
                      onClick={() => {
                        navigate("/communitybehaviorrules");
                        setShowPageRules(false);
                      }}
                    >
                      <span className="mobile-rules-icon">🤝</span>
                      <span className="mobile-rules-name">
                        Community & Behavior Rules
                      </span>
                    </button>
                    <button
                      className="mobile-rules-item"
                      onClick={() => {
                        navigate("/technicalsiterules");
                        setShowPageRules(false);
                      }}
                    >
                      <span className="mobile-rules-icon">⚙️</span>
                      <span className="mobile-rules-name">
                        Technical & Site Rules
                      </span>
                    </button>
                  </div>
                </div>

                <div className="mobile-rules-category">
                  <h3>Communication Rules</h3>
                  <div className="mobile-rules-grid">
                    <button
                      className="mobile-rules-item"
                      onClick={() => {
                        navigate("/forumrules");
                        setShowPageRules(false);
                      }}
                    >
                      <span className="mobile-rules-icon">📖</span>
                      <span className="mobile-rules-name">Forum Rules</span>
                    </button>
                    <button
                      className="mobile-rules-item"
                      onClick={() => {
                        navigate("/chatrules");
                        setShowPageRules(false);
                      }}
                    >
                      <span className="mobile-rules-icon">💬</span>
                      <span className="mobile-rules-name">Chat Rules</span>
                    </button>
                    <button
                      className="mobile-rules-item"
                      onClick={() => {
                        navigate("/profilecontentrules");
                        setShowPageRules(false);
                      }}
                    >
                      <span className="mobile-rules-icon">📝</span>
                      <span className="mobile-rules-name">
                        Profile Content Rules
                      </span>
                    </button>
                  </div>
                </div>

                <div className="mobile-rules-category">
                  <h3>Roleplay & Game Rules</h3>
                  <div className="mobile-rules-grid">
                    <button
                      className="mobile-rules-item"
                      onClick={() => {
                        navigate("/roleplaycharacterrules");
                        setShowPageRules(false);
                      }}
                    >
                      <span className="mobile-rules-icon">🎭</span>
                      <span className="mobile-rules-name">
                        Roleplay & Character Rules
                      </span>
                    </button>
                    <button
                      className="mobile-rules-item"
                      onClick={() => {
                        navigate("/rpgrules");
                        setShowPageRules(false);
                      }}
                    >
                      <span className="mobile-rules-icon">⚔️</span>
                      <span className="mobile-rules-name">RPG Rules</span>
                    </button>
                    <button
                      className="mobile-rules-item"
                      onClick={() => {
                        navigate("/livechatrpgrules");
                        setShowPageRules(false);
                      }}
                    >
                      <span className="mobile-rules-icon">💬</span>
                      <span className="mobile-rules-name">
                        Live Chat RPG Rules
                      </span>
                    </button>
                    <button
                      className="mobile-rules-item"
                      onClick={() => {
                        navigate("/magicspellrules");
                        setShowPageRules(false);
                      }}
                    >
                      <span className="mobile-rules-icon">✨</span>
                      <span className="mobile-rules-name">
                        Magic & Spell Rules
                      </span>
                    </button>
                    <button
                      className="mobile-rules-item"
                      onClick={() => {
                        navigate("/raceschoolrules");
                        setShowPageRules(false);
                      }}
                    >
                      <span className="mobile-rules-icon">🏫</span>
                      <span className="mobile-rules-name">
                        Race & School Rules
                      </span>
                    </button>
                    <button
                      className="mobile-rules-item"
                      onClick={() => {
                        navigate("/datingrelationshiprules");
                        setShowPageRules(false);
                      }}
                    >
                      <span className="mobile-rules-icon">💕</span>
                      <span className="mobile-rules-name">
                        Dating & Relationship Rules
                      </span>
                    </button>
                    <button
                      className="mobile-rules-item special"
                      onClick={() => {
                        navigate("/18forumrules");
                        setShowPageRules(false);
                      }}
                    >
                      <span className="mobile-rules-icon">🔞</span>
                      <span className="mobile-rules-name">18+ Forum Rules</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RPG Calendar Overlay */}
        {showRPGCalendar && (
          <div className="mobile-overlay">
            <div className="mobile-overlay-header">
              <h2>RPG Calendar</h2>
              <button
                className="mobile-overlay-close"
                onClick={() => {
                  setShowRPGCalendar(false);
                  navigate("/");
                  setActiveTab("home");
                }}
              >
                ✕
              </button>
            </div>
            <div className="mobile-overlay-content">
              <RPGCalendarSidebar />
            </div>
          </div>
        )}

        {/* Forum List Overlay */}
        {showForumList && (
          <div className="mobile-overlay">
            <div className="mobile-overlay-header">
              <h2>Forums</h2>
              <button
                className="mobile-overlay-close"
                onClick={() => {
                  setShowForumList(false);
                  navigate("/");
                  setActiveTab("home");
                }}
              >
                ✕
              </button>
            </div>
            <div className="mobile-overlay-content">
              <div className="mobile-forum-list">
                <div className="mobile-forum-category">
                  <h3>Main Forums</h3>
                  <div className="mobile-forum-grid">
                    <button
                      className="mobile-forum-item"
                      onClick={() => {
                        navigate("/forum/commonroom");
                        setShowForumList(false);
                      }}
                    >
                      <span className="mobile-forum-icon">🏠</span>
                      <span className="mobile-forum-name">Commonroom</span>
                    </button>
                    <button
                      className="mobile-forum-item"
                      onClick={() => {
                        navigate("/forum/ritualroom");
                        setShowForumList(false);
                      }}
                    >
                      <span className="mobile-forum-icon">🕯️</span>
                      <span className="mobile-forum-name">Ritual Room</span>
                    </button>
                    <button
                      className="mobile-forum-item"
                      onClick={() => {
                        navigate("/forum/moongarden");
                        setShowForumList(false);
                      }}
                    >
                      <span className="mobile-forum-icon">🌙</span>
                      <span className="mobile-forum-name">Moon Garden</span>
                    </button>
                    <button
                      className="mobile-forum-item"
                      onClick={() => {
                        navigate("/forum/bloodbank");
                        setShowForumList(false);
                      }}
                    >
                      <span className="mobile-forum-icon">🩸</span>
                      <span className="mobile-forum-name">Blood Bank</span>
                    </button>
                    <button
                      className="mobile-forum-item"
                      onClick={() => {
                        navigate("/forum/nightlibrary");
                        setShowForumList(false);
                      }}
                    >
                      <span className="mobile-forum-icon">📚</span>
                      <span className="mobile-forum-name">Night Library</span>
                    </button>
                    <button
                      className="mobile-forum-item"
                      onClick={() => {
                        navigate("/forum/gymnasium");
                        setShowForumList(false);
                      }}
                    >
                      <span className="mobile-forum-icon">💪</span>
                      <span className="mobile-forum-name">The Gymnasium</span>
                    </button>
                    <button
                      className="mobile-forum-item"
                      onClick={() => {
                        navigate("/forum/infirmary");
                        setShowForumList(false);
                      }}
                    >
                      <span className="mobile-forum-icon">🏥</span>
                      <span className="mobile-forum-name">The Infirmary</span>
                    </button>
                    <button
                      className="mobile-forum-item"
                      onClick={() => {
                        navigate("/forum/greenhouse");
                        setShowForumList(false);
                      }}
                    >
                      <span className="mobile-forum-icon">🌱</span>
                      <span className="mobile-forum-name">The Greenhouse</span>
                    </button>
                    <button
                      className="mobile-forum-item"
                      onClick={() => {
                        navigate("/forum/artstudio");
                        setShowForumList(false);
                      }}
                    >
                      <span className="mobile-forum-icon">🎨</span>
                      <span className="mobile-forum-name">The Art Studio</span>
                    </button>
                    <button
                      className="mobile-forum-item"
                      onClick={() => {
                        navigate("/forum/kitchen");
                        setShowForumList(false);
                      }}
                    >
                      <span className="mobile-forum-icon">🍳</span>
                      <span className="mobile-forum-name">Kitchen</span>
                    </button>
                    <button
                      className="mobile-forum-item"
                      onClick={() => {
                        navigate("/forum/detentionclassroom");
                        setShowForumList(false);
                      }}
                    >
                      <span className="mobile-forum-icon">⏰</span>
                      <span className="mobile-forum-name">
                        Detention Classroom
                      </span>
                    </button>
                  </div>
                </div>

                <div className="mobile-forum-category">
                  <h3>Special Forums</h3>
                  <div className="mobile-forum-grid">
                    <button
                      className="mobile-forum-item special"
                      onClick={() => {
                        navigate("/forum/16plus");
                        setShowForumList(false);
                      }}
                    >
                      <span className="mobile-forum-icon">🔞</span>
                      <span className="mobile-forum-name">18+ Forum</span>
                    </button>
                    <button
                      className="mobile-forum-item"
                      onClick={() => {
                        navigate("/forumrules");
                        setShowForumList(false);
                      }}
                    >
                      <span className="mobile-forum-icon">📋</span>
                      <span className="mobile-forum-name">Forum Rules</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inventory Overlay */}
        {showInventory && (
          <Suspense fallback={null}>
            <div className="mobile-overlay">
              <div className="mobile-overlay-header">
                <h2>Inventory</h2>
                <button
                  className="mobile-overlay-close"
                  onClick={() => {
                    setShowInventory(false);
                    navigate("/");
                    setActiveTab("home");
                  }}
                >
                  ✕
                </button>
              </div>
              <div className="mobile-overlay-content">
                <InventoryModal
                  open={true}
                  onClose={() => setShowInventory(false)}
                />
              </div>
            </div>
          </Suspense>
        )}

        {/* Chat overlay when chat tab is active */}
        {showChat && (
          <Suspense fallback={null}>
            <div className="mobile-chat-overlay">
              <div className="mobile-chat-header">
                <h2>Chat</h2>
                <button
                  className="mobile-chat-switch"
                  onClick={() => setShowPrivateChat(!showPrivateChat)}
                >
                  {showPrivateChat ? "Global" : "Private"}
                </button>
                <button
                  className="mobile-chat-close"
                  onClick={() => {
                    setShowChat(false);
                    navigate("/");
                    setActiveTab("home");
                  }}
                >
                  ✕
                </button>
              </div>

              {showPrivateChat ? (
                <div className="mobile-private-chat-container">
                  <PrivateChat />
                </div>
              ) : (
                <div className="mobile-global-chat-container">
                  <Chat />
                </div>
              )}
            </div>
          </Suspense>
        )}
      </main>

      {/* Mobile Dashboard Button - Always visible on mobile */}
      <div className="mobile-dashboard-button">
        <button
          className="mobile-dashboard-btn"
          onClick={() => setShowDashboard(true)}
        >
          <span className="mobile-dashboard-icon">☰</span>
          <span className="mobile-dashboard-label">Menu</span>
        </button>
      </div>

      {/* Mobile Dashboard Overlay */}
      {showDashboard && (
        <div className="mobile-dashboard-overlay">
          <div className="mobile-dashboard-header">
            <h2>Navigation</h2>
            <button
              className="mobile-dashboard-close"
              onClick={() => {
                setShowDashboard(false);
                navigate("/");
                setActiveTab("home");
              }}
            >
              ✕
            </button>
          </div>
          <div className="mobile-dashboard-grid">
            <button
              className={`mobile-dashboard-item ${
                activeTab === "home" ? "active" : ""
              }`}
              onClick={() => {
                handleTabClick("home");
                setShowDashboard(false);
              }}
            >
              <span className="mobile-dashboard-item-icon">🏠</span>
              <span className="mobile-dashboard-item-label">Home</span>
            </button>

            <button
              className={`mobile-dashboard-item ${
                activeTab === "forum" ? "active" : ""
              }`}
              onClick={() => {
                handleTabClick("forum");
                setShowDashboard(false);
              }}
            >
              <span className="mobile-dashboard-item-icon">📖</span>
              <span className="mobile-dashboard-item-label">Forum</span>
            </button>

            <button
              className={`mobile-dashboard-item ${
                activeTab === "classes" ? "active" : ""
              }`}
              onClick={() => {
                handleTabClick("classes");
                setShowDashboard(false);
              }}
            >
              <span className="mobile-dashboard-item-icon">📚</span>
              <span className="mobile-dashboard-item-label">Classes</span>
            </button>

            <button
              className={`mobile-dashboard-item ${
                showPageRules ? "active" : ""
              }`}
              onClick={() => {
                closeAllOverlays();
                setShowPageRules(true);
              }}
            >
              <span className="mobile-dashboard-item-icon">📋</span>
              <span className="mobile-dashboard-item-label">Page Rules</span>
            </button>

            <button
              className={`mobile-dashboard-item ${
                activeTab === "shop" ? "active" : ""
              }`}
              onClick={() => {
                handleTabClick("shop");
                setShowDashboard(false);
              }}
            >
              <span className="mobile-dashboard-item-icon">🏪</span>
              <span className="mobile-dashboard-item-label">Shop</span>
            </button>

            <button
              className={`mobile-dashboard-item ${
                activeTab === "profile" ? "active" : ""
              }`}
              onClick={() => {
                handleTabClick("profile");
                setShowDashboard(false);
              }}
            >
              <span className="mobile-dashboard-item-icon">👤</span>
              <span className="mobile-dashboard-item-label">Profile</span>
            </button>

            <button
              className={`mobile-dashboard-item ${
                activeTab === "map" ? "active" : ""
              }`}
              onClick={() => {
                handleTabClick("map");
                setShowDashboard(false);
              }}
            >
              <span className="mobile-dashboard-item-icon">🗺️</span>
              <span className="mobile-dashboard-item-label">Map</span>
            </button>

            <button
              className={`mobile-dashboard-item ${showChat ? "active" : ""}`}
              onClick={() => {
                handleTabClick("chat");
                setShowDashboard(false);
              }}
            >
              <span className="mobile-dashboard-item-icon">💬</span>
              <span className="mobile-dashboard-item-label">Chat</span>
            </button>

            <button
              className={`mobile-dashboard-item ${
                showInventory ? "active" : ""
              }`}
              onClick={() => {
                // Close all other overlays first
                setShowChat(false);
                setShowPrivateChat(false);
                setShowForumList(false);
                setShowNewsFeed(false);
                setShowRPGCalendar(false);
                setShowOnlineUsers(false);
                setShowInventory(true);
                setShowDashboard(false);
              }}
            >
              <span className="mobile-dashboard-item-icon">🎒</span>
              <span className="mobile-dashboard-item-label">Inventory</span>
            </button>

            <button
              className={`mobile-dashboard-item ${
                showNewsFeed ? "active" : ""
              }`}
              onClick={() => {
                // Close all other overlays first
                setShowChat(false);
                setShowPrivateChat(false);
                setShowForumList(false);
                setShowNewsFeed(true);
                setShowRPGCalendar(false);
                setShowOnlineUsers(false);
                setShowInventory(false);
                setShowPageRules(false);
                setShowDashboard(false);
              }}
            >
              <span className="mobile-dashboard-item-icon">📰</span>
              <span className="mobile-dashboard-item-label">
                News & Announcements
              </span>
            </button>

            <button
              className={`mobile-dashboard-item ${
                showRPGCalendar ? "active" : ""
              }`}
              onClick={() => {
                // Close all other overlays first
                setShowChat(false);
                setShowPrivateChat(false);
                setShowForumList(false);
                setShowNewsFeed(false);
                setShowRPGCalendar(true);
                setShowOnlineUsers(false);
                setShowInventory(false);
                setShowPageRules(false);
                setShowDashboard(false);
              }}
            >
              <span className="mobile-dashboard-item-icon">📅</span>
              <span className="mobile-dashboard-item-label">RPG Calendar</span>
            </button>

            <button
              className={`mobile-dashboard-item ${
                showOnlineUsers ? "active" : ""
              }`}
              onClick={() => {
                // Close all other overlays first
                setShowChat(false);
                setShowPrivateChat(false);
                setShowForumList(false);
                setShowNewsFeed(false);
                setShowRPGCalendar(false);
                setShowOnlineUsers(true);
                setShowInventory(false);
                setShowDashboard(false);
              }}
            >
              <span className="mobile-dashboard-item-icon">👥</span>
              <span className="mobile-dashboard-item-label">
                Online Students
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileLayout;
