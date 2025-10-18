import { useState, useEffect } from "react";
import { useAuth } from "../../context/authContext.jsx";
import useUserRoles from "../../hooks/useUserRoles";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import React, { Suspense } from "react";
const Chat = React.lazy(() => import("../Chat/Chat"));
const PrivateChat = React.lazy(() => import("../Chat/PrivateChat"));
const TopBar = React.lazy(() => import("../TopBar/TopBar"));
const RPGClock = React.lazy(() => import("../RPGClock/RPGClock"));
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [showChat, setShowChat] = useState(false);
  const [showPrivateChat, setShowPrivateChat] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showForumSelection, setShowForumSelection] = useState(false);

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
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Don't render mobile layout on desktop
  if (!isMobile) {
    return children;
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
            <div className="mobile-logo-icon">⚡</div>
            <h1 className="mobile-logo-text">Vayloria</h1>
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
                location.pathname.includes("rules") ? "active" : ""
              }`}
              onClick={() => {
                setShowDashboard(false);
                navigate("/generalrules");
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
        <div className="mobile-forum-selection-overlay">
          <div className="mobile-forum-selection-content">
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
                  navigate("/forum/commonroom");
                  setShowForumSelection(false);
                }}
              >
                <span className="mobile-forum-selection-label">Commonroom</span>
              </button>
              
              <button
                className="mobile-forum-selection-item"
                onClick={() => {
                  navigate("/forum/ritualroom");
                  setShowForumSelection(false);
                }}
              >
                <span className="mobile-forum-selection-label">Ritual Room</span>
              </button>
              
              <button
                className="mobile-forum-selection-item"
                onClick={() => {
                  navigate("/forum/moongarden");
                  setShowForumSelection(false);
                }}
              >
                <span className="mobile-forum-selection-label">Moon Garden</span>
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
                <span className="mobile-forum-selection-label">Night Library</span>
              </button>
              
              <button
                className="mobile-forum-selection-item"
                onClick={() => {
                  navigate("/forum/gymnasium");
                  setShowForumSelection(false);
                }}
              >
                <span className="mobile-forum-selection-label">The Gymnasium</span>
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
                <span className="mobile-forum-selection-label">The Greenhouse</span>
              </button>
              
              <button
                className="mobile-forum-selection-item"
                onClick={() => {
                  navigate("/forum/artstudio");
                  setShowForumSelection(false);
                }}
              >
                <span className="mobile-forum-selection-label">The Art Studio</span>
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
                <span className="mobile-forum-selection-label">Detention Classroom</span>
              </button>
              
              <button
                className="mobile-forum-selection-item"
                onClick={() => {
                  navigate("/forum/16plus");
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
