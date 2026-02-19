import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/authContext.jsx";
import useUserRoles from "../../hooks/useUserRoles";
import useUserData from "../../hooks/useUserData";
import useNotifications from "../../hooks/useNotifications";
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
  const { notifications, recentNews, markAllAsRead, unreadCount } = useNotifications(user, userData);
  const { setOpenWithUid } = useOpenPrivateChat();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
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
            <h1 className="mobile-logo-text">Vayloria</h1>
          </div>
        </div>
      </header>

      {/* Mobile Main Content - TopBar not shown on mobile per design */}
      <main className="mobile-main">
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
          <Outlet />
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

      {/* Mobile Dashboard Button - Only when logged in, hide when chat is open */}
      {user && !showChat && (
        <div className="mobile-dashboard-button">
          <button
            className="mobile-dashboard-btn"
            onClick={() => setShowDashboard(true)}
          >
            <span className="mobile-dashboard-icon">☰</span>
            <span className="mobile-dashboard-label">Menu</span>
          </button>
        </div>
      )}

      {/* Mobile Floating Chat Button - Always visible */}
      {user && (
        <div className="mobile-floating-chat">
          <button
            className="mobile-chat-float-btn"
            onClick={() => openOverlay(setShowChat)}
            title="Chat"
          >
            💬
          </button>
        </div>
      )}

      {/* Archivist / Shadow Patrol modal (opened from menu) */}
      <SegmentSchedulePopup
        open={showSegmentSchedule}
        onOpenChange={setShowSegmentSchedule}
      />

      {/* Mobile Dashboard Overlay */}
      {showDashboard && (
        <div className="mobile-dashboard-overlay">
          <div className="mobile-dashboard-header">
            <h2>Navigation</h2>
            <div className="mobile-dashboard-header-actions">
              {user && (
                <div className="mobile-menu-notification-wrap" ref={notificationsPopupRef}>
                  <button
                    type="button"
                    className="mobile-menu-notification-bell"
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
                        {notifications.filter((n) => !n.read).length > 0 && (
                          <button
                            type="button"
                            className="mobile-menu-notification-mark-read"
                            onClick={() => markAllAsRead()}
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="mobile-menu-notification-popup-list">
                        {recentNews.length > 0 &&
                          recentNews.map((news) => (
                            <div
                              key={`news-${news.id}`}
                              className="mobile-menu-notification-item"
                              role="button"
                              tabIndex={0}
                              onClick={async () => {
                                const seenAt = news.createdAt?.toMillis?.() ?? news.createdAt ?? Date.now();
                                try {
                                  await updateDoc(doc(db, "users", user.uid), {
                                    lastSeenNewsAt: typeof seenAt === "number" ? seenAt : Date.now(),
                                  });
                                  cacheHelpers.clearUserCache(user.uid);
                                } catch (err) {}
                                setShowNotificationsPopup(false);
                                setShowDashboard(false);
                                navigate("/");
                              }}
                              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.click()}
                            >
                              <span className="mobile-menu-notification-icon">📰</span>
                              <span>New news: {news.title || "Untitled"}</span>
                            </div>
                          ))}
                        {notifications
                          .filter((n) => !n.read)
                          .slice(0, 15)
                          .map((n) => {
                            const isReply = n.type === "topic_reply" || n.type === "new_topic";
                            const label =
                              n.type === "private_chat"
                                ? `Message from ${n.fromName || "Someone"}`
                                : isReply
                                  ? n.message || n.title || "New forum activity"
                                  : n.message || n.title || "Notification";
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
                        {unreadCount === 0 && (
                          <p className="mobile-menu-notification-empty">No notifications</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <button
                className="mobile-dashboard-close"
                onClick={() => {
                  setShowDashboard(false);
                  setShowNotificationsPopup(false);
                  navigate("/");
                  setActiveTab("home");
                }}
              >
                ✕
              </button>
            </div>
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
                location.pathname === "/rules" || (location.pathname.includes("rules") && location.pathname !== "/library") ? "active" : ""
              }`}
              onClick={() => {
                setShowDashboard(false);
                navigate("/rules");
              }}
            >
              <span className="mobile-dashboard-item-icon">📋</span>
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
              <span className="mobile-dashboard-item-icon">📚</span>
              <span className="mobile-dashboard-item-label">Library (tips)</span>
            </button>

            {(userData?.roles || []).some((r) => ["archivist", "shadowpatrol"].includes(String(r).toLowerCase())) && (
              <button
                className="mobile-dashboard-item"
                onClick={() => {
                  setShowSegmentSchedule(true);
                }}
              >
                <span className="mobile-dashboard-item-icon">📋</span>
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
              className={`mobile-dashboard-item ${
                location.pathname === "/inventory" ? "active" : ""
              }`}
              onClick={() => {
                handleTabClick("inventory");
              }}
            >
              <span className="mobile-dashboard-item-icon">🎒</span>
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
              <span className="mobile-dashboard-item-icon">📰</span>
              <span className="mobile-dashboard-item-label">
                News & Announcements
              </span>
            </button>

            {/* Logout Button */}
            <button
              className="mobile-dashboard-item logout-btn"
              onClick={handleLogout}
            >
              <span className="mobile-dashboard-item-icon">🚪</span>
              <span className="mobile-dashboard-item-label">Log Out</span>
            </button>
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
              <button
                className="mobile-forum-selection-item"
                onClick={() => {
                  navigate("/forum/commons");
                  setShowForumSelection(false);
                }}
              >
                <span className="mobile-forum-selection-label">Commons</span>
              </button>

              <button
                className="mobile-forum-selection-item"
                onClick={() => {
                  navigate("/forum/ritualroom");
                  setShowForumSelection(false);
                }}
              >
                <span className="mobile-forum-selection-label">
                  Ritual Room
                </span>
              </button>

              <button
                className="mobile-forum-selection-item"
                onClick={() => {
                  navigate("/forum/moongarden");
                  setShowForumSelection(false);
                }}
              >
                <span className="mobile-forum-selection-label">
                  Moon Garden
                </span>
              </button>

              <button
                className="mobile-forum-selection-item"
                onClick={() => {
                  navigate("/forum/bloodbank");
                  setShowForumSelection(false);
                }}
              >
                <span className="mobile-forum-selection-label">Blood Bank</span>
              </button>

              <button
                className="mobile-forum-selection-item"
                onClick={() => {
                  navigate("/forum/nightlibrary");
                  setShowForumSelection(false);
                }}
              >
                <span className="mobile-forum-selection-label">
                  Night Library
                </span>
              </button>

              <button
                className="mobile-forum-selection-item"
                onClick={() => {
                  navigate("/forum/gymnasium");
                  setShowForumSelection(false);
                }}
              >
                <span className="mobile-forum-selection-label">
                  The Gymnasium
                </span>
              </button>

              <button
                className="mobile-forum-selection-item"
                onClick={() => {
                  navigate("/forum/infirmary");
                  setShowForumSelection(false);
                }}
              >
                <span className="mobile-forum-selection-label">Infirmary</span>
              </button>

              <button
                className="mobile-forum-selection-item"
                onClick={() => {
                  navigate("/forum/greenhouse");
                  setShowForumSelection(false);
                }}
              >
                <span className="mobile-forum-selection-label">
                  The Greenhouse
                </span>
              </button>

              <button
                className="mobile-forum-selection-item"
                onClick={() => {
                  navigate("/forum/artstudio");
                  setShowForumSelection(false);
                }}
              >
                <span className="mobile-forum-selection-label">
                  The Art Studio
                </span>
              </button>

              <button
                className="mobile-forum-selection-item"
                onClick={() => {
                  navigate("/forum/kitchen");
                  setShowForumSelection(false);
                }}
              >
                <span className="mobile-forum-selection-label">Kitchen</span>
              </button>

              <button
                className="mobile-forum-selection-item"
                onClick={() => {
                  navigate("/forum/detentionclassroom");
                  setShowForumSelection(false);
                }}
              >
                <span className="mobile-forum-selection-label">
                  Detention Classroom
                </span>
              </button>

              <button
                className="mobile-forum-selection-item"
                onClick={() => {
                  navigate("/forum/shortbutlong");
                  setShowForumSelection(false);
                }}
              >
                <span className="mobile-forum-selection-label">Short, but long</span>
              </button>

              <button
                className="mobile-forum-selection-item"
                onClick={() => {
                  navigate("/forum/18plus");
                  setShowForumSelection(false);
                }}
              >
                <span className="mobile-forum-selection-label">18+ Forum</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileLayout;
