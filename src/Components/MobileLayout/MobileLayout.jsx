import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/authContext.jsx";
import useUserRoles from "../../hooks/useUserRoles";
import useUserData from "../../hooks/useUserData";
import { useNotificationsContext } from "../../context/notificationsContext.jsx";
import { useOpenPrivateChat } from "../../context/openPrivateChatContext";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import React, { Suspense } from "react";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { cacheHelpers } from "../../utils/firebaseCache";
const Chat = React.lazy(() => import("../Chat/Chat"));
const PrivateChat = React.lazy(() => import("../Chat/PrivateChat"));
const RPGClock = React.lazy(() => import("../RPGClock/RPGClock"));
import SegmentSchedulePopup from "../SegmentSchedulePopup/SegmentSchedulePopup";

const PROTECTED_PATHS = [
  "/Profile",
  "/userMap",
  "/ClassRooms",
  "/Rpg",
  "/shop",
  "/admin",
  "/professor",
  "/housepoints",
  "/inventory",
];
const isProtectedPath = (pathname) => {
  if (PROTECTED_PATHS.some((p) => pathname === p || pathname === p + "/"))
    return true;
  if (
    pathname.startsWith("/forum") ||
    pathname.startsWith("/user/") ||
    pathname.startsWith("/classrooms/") ||
    pathname.startsWith("/Rpg/")
  )
    return true;
  return false;
};

const RULES_PATHS = [
  "/generalrules",
  "/siterolesrules",
  "/forumrules",
  "/aiusagerules",
  "/contentmediarules",
  "/privacysafetyrules",
  "/accountidentityrules",
  "/communitybehaviorrules",
  "/technicalsiterules",
  "/chatrules",
  "/rpgrules",
  "/profilecontentrules",
  "/roleplaycharacterrules",
  "/livechatrpgrules",
  "/magicspellrules",
  "/raceschoolrules",
  "/datingrelationshiprules",
  "/18forumrules",
];
const isRulesPage = (pathname) =>
  RULES_PATHS.some((p) => pathname === p || pathname === p + "/");
const isRulesOrLibraryPage = (pathname) =>
  pathname === "/rules" ||
  pathname === "/library" ||
  pathname === "/rules/" ||
  pathname === "/library/" ||
  isRulesPage(pathname);

import "./MobileLayout.css";
import { forumList } from "../../data/forumList";
import DetentionPopup from "../DetentionPopup/DetentionPopup";
import AdminGlobalAgeVerificationModal from "../AdminGlobalAgeVerificationModal";

function screenTitle(pathname) {
  if (pathname === "/" || pathname === "") return "Home";
  if (pathname.startsWith("/forum")) return "Forum";
  if (pathname === "/starshade-hall" || pathname.startsWith("/Rpg")) return "Hall";
  if (pathname === "/ClassRooms" || pathname.startsWith("/classrooms")) return "Classes";
  if (pathname === "/Profile") return "Profile";
  if (pathname === "/shop") return "Shop";
  if (pathname === "/userMap") return "Map";
  if (pathname === "/inventory") return "Inventory";
  if (pathname === "/library") return "Library";
  if (pathname === "/admin") return "Admin";
  if (pathname === "/professor") return "Teacher";
  if (pathname.includes("rules")) return "Rules";
  if (pathname === "/messages") return "Messages";
  return "Vayloria";
}

const MENU_ICON = {
  home: "\u2302",
  forum: "\u2630",
  adult: "18+",
  classes: "\u2726",
  rules: "\u00A7",
  library: "\u2767",
  tasks: "\u2611",
  shop: "\u2696",
  profile: "\u263A",
  map: "\u2295",
  inventory: "\u25A3",
  news: "\u270E",
  admin: "\u2699",
  teacher: "\u269C",
  logout: "\u23FB",
};

function TabIcon({ name }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };
  if (name === "home") {
    return (
      <svg {...common}>
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z" />
      </svg>
    );
  }
  if (name === "forum") {
    return (
      <svg {...common}>
        <path d="M5 5h14v14H5z" />
        <path d="M8 9h8M8 12h8M8 15h5" />
      </svg>
    );
  }
  if (name === "hall") {
    return (
      <svg {...common}>
        <path d="M4 20V10l8-6 8 6v10" />
        <path d="M9 20v-6h6v6" />
      </svg>
    );
  }
  if (name === "chat") {
    return (
      <svg {...common}>
        <path d="M5 18 4 21l4-2h9a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3h1z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="6" cy="7" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="7" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="18" cy="7" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="6" cy="13" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="13" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="18" cy="13" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="6" cy="19" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="19" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="18" cy="19" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

const MobileLayout = ({ children }) => {
  const { roles, rolesLoading } = useUserRoles();
  // Helper to close all overlays (mobil-optimalisert)
  const closeAllOverlays = () => {
    setShowChat(false);
    setShowPrivateChat(false);
    setShowDashboard(false);
  };

  // Kun én overlay åpen om gangen på mobil
  const openOverlay = (overlaySetter) => {
    closeAllOverlays();
    overlaySetter(true);
  };
  const { user, loading: authLoading } = useAuth();
  const { userData } = useUserData();
  const {
    notifications,
    recentNews,
    clearAllNotifications,
    unreadCount,
  } = useNotificationsContext();
  const { setOpenWithUid } = useOpenPrivateChat();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= 768,
  );
  const [activeTab, setActiveTab] = useState("home");
  const [showChat, setShowChat] = useState(false);
  const [showPrivateChat, setShowPrivateChat] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showForumSelection, setShowForumSelection] = useState(false);
  const [showSegmentSchedule, setShowSegmentSchedule] = useState(false);
  const [showNotificationsPopup, setShowNotificationsPopup] = useState(false);
  const notificationsPopupRef = useRef(null);

  useEffect(() => {
    if (!showNotificationsPopup) return;
    const handleClick = (e) => {
      if (notificationsPopupRef.current && !notificationsPopupRef.current.contains(e.target)) {
        setShowNotificationsPopup(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [showNotificationsPopup]);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    if (isMobile) {
      document.body.classList.add("mobile-app-shell");
      html.style.colorScheme = "dark";
      html.style.backgroundColor = "#221a16";
    } else {
      document.body.classList.remove("mobile-app-shell");
      html.style.colorScheme = "";
      html.style.backgroundColor = "";
    }
    return () => {
      document.body.classList.remove("mobile-app-shell");
      html.style.colorScheme = "";
      html.style.backgroundColor = "";
    };
  }, [isMobile]);

  // Update active tab based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path === "/") {
      setActiveTab("home");
    } else if (path.startsWith("/forum")) {
      setActiveTab("forum");
    } else if (path === "/ClassRooms" || path.startsWith("/classrooms")) {
      setActiveTab("classes");
    } else if (path === "/starshade-hall" || path.startsWith("/Rpg")) {
      setActiveTab("hall");
    } else if (path === "/Profile") {
      setActiveTab("profile");
    } else if (path === "/userMap") {
      setActiveTab("map");
    } else if (path === "/shop") {
      setActiveTab("shop");
    } else if (path === "/inventory") {
      setActiveTab("inventory");
    }
  }, [location.pathname]);

  const handleTabClick = (tab) => {
    closeAllOverlays();
    setActiveTab(tab);
    setShowDashboard(false); // Close menu after navigation
    switch (tab) {
      case "home":
        navigate("/");
        break;
      case "forum":
        // Show forum selection modal instead of navigating directly
        setShowForumSelection(true);
        break;
      case "classes":
        navigate("/ClassRooms");
        break;
      case "hall":
        navigate("/starshade-hall");
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
      case "inventory":
        navigate("/inventory");
        break;
      case "chat":
        openOverlay(setShowChat); // Keep chat as overlay since it's meant to be accessible everywhere
        break;
      default:
        break;
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowDashboard(false);
      navigate("/");
    } catch (error) {}
  };

  // Redirect to sign-in if accessing protected route while not logged in
  useEffect(() => {
    if (!isMobile || authLoading) return;
    if (!user && isProtectedPath(location.pathname)) {
      navigate("/sign-in", { replace: true });
    }
  }, [isMobile, user, authLoading, location.pathname, navigate]);

  // Don't render mobile layout on desktop
  if (!isMobile) {
    return children;
  }

  // Show nothing (or loading) while redirecting unauthenticated user from protected route
  if (!authLoading && !user && isProtectedPath(location.pathname)) {
    return null;
  }

  return (
    <div className={user ? "mobile-app" : "mobile-app-light"}>
      <div className="app-topbar" role="banner">
        <div className="app-topbar-titles">
          <p className="app-kicker">Vayloria</p>
          <h1 className="app-title">{screenTitle(location.pathname)}</h1>
        </div>
        <div className="app-topbar-actions">
          <Suspense fallback={null}>
            <RPGClock isMobile={true} />
          </Suspense>
          {user && (
            <div className="mobile-menu-notification-wrap" ref={notificationsPopupRef}>
              <button
                type="button"
                className="app-icon-btn"
                onClick={() => setShowNotificationsPopup((v) => !v)}
                title="Notifications"
                aria-label="Notifications"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                </svg>
                {unreadCount > 0 && (
                  <span className="mobile-menu-notification-badge">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
              {showNotificationsPopup && (
                <div className="mobile-menu-notification-popup">
                  <div className="mobile-menu-notification-popup-header">
                    <span>Notifications</span>
                    {(notifications.length > 0 || recentNews.length > 0) && (
                      <button
                        type="button"
                        className="mobile-menu-notification-mark-read"
                        onClick={() => clearAllNotifications()}
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="mobile-menu-notification-popup-list">
                    {recentNews.length > 0 &&
                      recentNews.map((news) => (
                        <div
                          key={`news-${news.id}`}
                          className="mobile-menu-notification-item"
                        >
                          <span className="mobile-menu-notification-icon">📰</span>
                          <span>{news.title || "News"}</span>
                        </div>
                      ))}
                    {notifications.slice(0, 12).map((n) => {
                      const isReply = n.type === "forum_reply" || n.type === "reply";
                      const label = n.text || n.message || n.type || "Notification";
                      return (
                        <div
                          key={n.id}
                          className="mobile-menu-notification-item"
                          role="button"
                          tabIndex={0}
                          onClick={async () => {
                            try {
                              await updateDoc(doc(db, "notifications", n.id), { read: true });
                            } catch (err) {}
                            setShowNotificationsPopup(false);
                            setShowDashboard(false);
                            if (isReply && n.topicId) navigate(`/forum/commons?topic=${n.topicId}`);
                            else if (n.type === "private_chat") {
                              const fromUid = n.fromUid || n.from;
                              if (fromUid) {
                                setOpenWithUid(fromUid);
                                setShowChat(true);
                                setShowPrivateChat(true);
                              }
                            }
                          }}
                          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.click()}
                        >
                          <span className="mobile-menu-notification-icon">
                            {n.type === "private_chat" ? "💬" : isReply ? "📌" : "🎁"}
                          </span>
                          <span>{label}</span>
                        </div>
                      );
                    })}
                    {notifications.length === 0 && recentNews.length === 0 && (
                      <p className="mobile-menu-notification-empty">No notifications</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={`mobile-main${showChat ? " mobile-main-chat-open" : ""}`} role="main">
        {/* Back to rules list when viewing a rule page or Library */}
        {isRulesOrLibraryPage(location.pathname) && location.pathname !== "/rules" && location.pathname !== "/rules/" && (
          <div className="mobile-rules-back-bar">
            <button
              type="button"
              className="mobile-rules-back-btn"
              onClick={() => navigate("/rules")}
            >
              ← {location.pathname === "/library" || location.pathname === "/library/" ? "Back to Rules & Library" : "Choose another rule"}
            </button>
          </div>
        )}
        {/* Render actual page content - let React Router handle all routing */}
        <div className="mobile-page-content">
          <Outlet key={location.pathname} />
        </div>

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
                  onClick={() => setShowChat(false)}
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
      </div>

      {user && !showChat && (
        <nav className="app-tabbar" aria-label="Main">
          <button
            type="button"
            className={`app-tab${activeTab === "home" ? " active" : ""}`}
            onClick={() => handleTabClick("home")}
          >
            <TabIcon name="home" />
            <span>Home</span>
          </button>
          <button
            type="button"
            className={`app-tab${activeTab === "forum" ? " active" : ""}`}
            onClick={() => handleTabClick("forum")}
          >
            <TabIcon name="forum" />
            <span>Forum</span>
          </button>
          <button
            type="button"
            className={`app-tab${activeTab === "hall" ? " active" : ""}`}
            onClick={() => handleTabClick("hall")}
          >
            <TabIcon name="hall" />
            <span>Hall</span>
          </button>
          <button
            type="button"
            className={`app-tab${showChat ? " active" : ""}`}
            onClick={() => handleTabClick("chat")}
          >
            <TabIcon name="chat" />
            <span>Chat</span>
          </button>
          <button
            type="button"
            className={`app-tab${showDashboard ? " active" : ""}`}
            onClick={() => setShowDashboard(true)}
          >
            <TabIcon name="more" />
            <span>More</span>
          </button>
        </nav>
      )}

      {/* Archivist / Shadow Patrol modal (opened from menu) */}
      <SegmentSchedulePopup
        open={showSegmentSchedule}
        onOpenChange={setShowSegmentSchedule}
      />

      {/* Mobile Dashboard Overlay */}
      {showDashboard && (
        <div className="mobile-dashboard-overlay" onClick={() => setShowDashboard(false)}>
          <div className="mobile-dashboard-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="mobile-dashboard-header">
            <h2>More</h2>
            <button
              className="mobile-dashboard-close"
              onClick={() => {
                setShowDashboard(false);
                setShowNotificationsPopup(false);
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
              <span className="mobile-dashboard-item-icon">{MENU_ICON.home}</span>
              <span className="mobile-dashboard-item-label">Home</span>
            </button>

            <button
              className={`mobile-dashboard-item ${
                activeTab === "forum" ? "active" : ""
              }`}
              onClick={() => {
                handleTabClick("forum");
              }}
            >
              <span className="mobile-dashboard-item-icon">{MENU_ICON.forum}</span>
              <span className="mobile-dashboard-item-label">Forum</span>
            </button>

            <button
              className="mobile-dashboard-item"
              onClick={() => {
                setShowDashboard(false);
                navigate("/forum/18plus");
              }}
            >
              <span className="mobile-dashboard-item-icon">{MENU_ICON.adult}</span>
              <span className="mobile-dashboard-item-label">18+ Forum</span>
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
              <span className="mobile-dashboard-item-icon">{MENU_ICON.classes}</span>
              <span className="mobile-dashboard-item-label">Classes</span>
            </button>

            <button
              className={`mobile-dashboard-item ${
                location.pathname === "/rules" || (location.pathname.includes("rules") && location.pathname !== "/library") ? "active" : ""
              }`}
              onClick={() => {
                setShowDashboard(false);
                navigate("/rules");
              }}
            >
              <span className="mobile-dashboard-item-icon">{MENU_ICON.rules}</span>
              <span className="mobile-dashboard-item-label">Page Rules</span>
            </button>

            <button
              className={`mobile-dashboard-item ${
                location.pathname === "/library" ? "active" : ""
              }`}
              onClick={() => {
                setShowDashboard(false);
                navigate("/library");
              }}
            >
              <span className="mobile-dashboard-item-icon">{MENU_ICON.library}</span>
              <span className="mobile-dashboard-item-label">Library (tips)</span>
            </button>

            {(userData?.roles || []).some((r) => ["archivist", "shadowpatrol"].includes(String(r).toLowerCase())) && (
              <button
                className="mobile-dashboard-item"
                onClick={() => {
                  setShowSegmentSchedule(true);
                }}
              >
                <span className="mobile-dashboard-item-icon">{MENU_ICON.tasks}</span>
                <span className="mobile-dashboard-item-label">
                  {userData?.roles?.some((r) => String(r).toLowerCase() === "archivist")
                    ? "Archivist tasks"
                    : "Shadow Patrol tasks"}
                </span>
              </button>
            )}

            <button
              className={`mobile-dashboard-item ${
                activeTab === "shop" ? "active" : ""
              }`}
              onClick={() => {
                handleTabClick("shop");
                setShowDashboard(false);
              }}
            >
              <span className="mobile-dashboard-item-icon">{MENU_ICON.shop}</span>
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
              <span className="mobile-dashboard-item-icon">{MENU_ICON.profile}</span>
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
              <span className="mobile-dashboard-item-icon">{MENU_ICON.map}</span>
              <span className="mobile-dashboard-item-label">Map</span>
            </button>

            <button
              className={`mobile-dashboard-item ${
                location.pathname === "/inventory" ? "active" : ""
              }`}
              onClick={() => {
                handleTabClick("inventory");
              }}
            >
              <span className="mobile-dashboard-item-icon">{MENU_ICON.inventory}</span>
              <span className="mobile-dashboard-item-label">Inventory</span>
            </button>

            <button
              className={`mobile-dashboard-item ${
                location.pathname === "/news" ? "active" : ""
              }`}
              onClick={() => {
                setShowDashboard(false);
                navigate("/");
              }}
            >
              <span className="mobile-dashboard-item-icon">{MENU_ICON.news}</span>
              <span className="mobile-dashboard-item-label">
                News & Announcements
              </span>
            </button>

            {roles.some((r) => String(r).toLowerCase() === "admin") && (
              <button
                className="mobile-dashboard-item"
                onClick={() => {
                  setShowDashboard(false);
                  navigate("/admin");
                }}
              >
                <span className="mobile-dashboard-item-icon">{MENU_ICON.admin}</span>
                <span className="mobile-dashboard-item-label">Admin</span>
              </button>
            )}
            {roles.some((r) =>
              ["professor", "teacher"].includes(String(r).toLowerCase()),
            ) && (
              <button
                className="mobile-dashboard-item"
                onClick={() => {
                  setShowDashboard(false);
                  navigate("/professor");
                }}
              >
                <span className="mobile-dashboard-item-icon">{MENU_ICON.teacher}</span>
                <span className="mobile-dashboard-item-label">Teacher</span>
              </button>
            )}

            {/* Logout Button */}
            <button
              className="mobile-dashboard-item logout-btn"
              onClick={handleLogout}
            >
              <span className="mobile-dashboard-item-icon">{MENU_ICON.logout}</span>
              <span className="mobile-dashboard-item-label">Log Out</span>
            </button>
          </div>
          </div>
        </div>
      )}

      {/* Forum Selection Modal */}
      {showForumSelection && (
        <div
          className="mobile-forum-selection-overlay"
          onClick={() => setShowForumSelection(false)}
        >
          <div
            className="mobile-forum-selection-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-forum-selection-header">
              <h2>Choose Forum</h2>
              <button
                className="mobile-forum-selection-close"
                onClick={() => setShowForumSelection(false)}
              >
                ✕
              </button>
            </div>
            <div className="mobile-forum-selection-list">
              {forumList
                .filter((f) => f.id !== "starshadehall")
                .slice()
                .sort((a, b) => {
                  if (a.id === "18plus") return -1;
                  if (b.id === "18plus") return 1;
                  if (a.id === "commons") return -1;
                  if (b.id === "commons") return 1;
                  return 0;
                })
                .map((f) => (
                  <button
                    key={f.id}
                    className={`mobile-forum-selection-item${f.id === "18plus" ? " mobile-forum-18plus" : ""}`}
                    onClick={() => {
                      navigate(`/forum/${f.id}`);
                      setShowForumSelection(false);
                    }}
                  >
                    <span className="mobile-forum-selection-label">{f.name}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
      {user && <AdminGlobalAgeVerificationModal />}
      {user && <DetentionPopup />}
    </div>
  );
};

export default MobileLayout;
