// import the nessesary modules
import { Outlet } from "react-router-dom";
import { useAuth } from "./context/authContext.jsx";
import styles from "./App.module.css";
import { useState, useEffect, startTransition } from "react";
import {
  doc,
  onSnapshot,
  collection,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import {
  playPing,
  requestNotificationPermission,
} from "./Components/Chat/ping_alt";
// import useVipThemes from "./hooks/useVipThemes"; // TEMPORARILY DISABLED

import Navbar from "./Navbar/Navbar";
import PrivateChat from "./Components/Chat/PrivateChat";
import Chat from "./Components/Chat/Chat";
import TopBar from "./Components/TopBar/TopBar";
import AdminGlobalAgeVerificationModal from "./Components/AdminGlobalAgeVerificationModal";
import MobileLayout from "./Components/MobileLayout/MobileLayout";
import "./utils/dailyPetDiscoveryScheduler"; // Daily pet discovery system
import PetDiscoveryPopupOnly from "./Components/PetDiscovery/PetDiscoveryPopupOnly";
import useLocationTracker from "./hooks/useLocationTracker";
import "./App.mobile.css";

function App() {
  const { user, loading } = useAuth();

  // Track user location for Surveillance Potion
  useLocationTracker();


  // Safe theme CSS with error handling - TEMPORARILY DISABLED
  let vipThemeCSS = "";
  // DISABLED: This may be causing import issues
  // try {
  //   const { getThemeCSS } = useVipThemes();
  //   vipThemeCSS = getThemeCSS() || "";
  // } catch (error) {
  //   console.error("Error loading VIP themes:", error);
  //   vipThemeCSS = "";
  // }

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Global potion effect states
  const [darkModeUntil, setDarkModeUntil] = useState(null);
  const [retroUntil, setRetroUntil] = useState(null);
  const [mirrorUntil, setMirrorUntil] = useState(null);
  const [speedUntil, setSpeedUntil] = useState(null);
  const [slowMotionUntil, setSlowMotionUntil] = useState(null);
  const [surveillanceUntil, setSurveillanceUntil] = useState(null);
  const [sparkleUntil, setSparkleUntil] = useState(null);
  const [lastMessageId, setLastMessageId] = useState(null);
  const [lastPrivateMessageId, setLastPrivateMessageId] = useState(null);
  const [lastPingTime, setLastPingTime] = useState(0);

  // Request notification permission on app load
  useEffect(() => {
    const requestPermission = async () => {
      await requestNotificationPermission();
    };
    requestPermission();
  }, []);

  // Global mention detection - Moved to Chat component for better real-time detection
  // useEffect(() => {
  //   if (!user) return;
  //   
  //   const messagesRef = collection(db, "messages");
  //   const q = query(messagesRef, orderBy("timestamp", "desc"), limit(1));
  //   
  //   const unsubscribe = onSnapshot(q, (snapshot) => {
  //     if (!snapshot.empty) {
  //       const latestMessage = snapshot.docs[0].data();
  //       const messageText = latestMessage.text || "";
  //       const userName = user.displayName || "";
  //       
  //       // Check if user is mentioned in the latest message
  //       if (messageText.toLowerCase().includes(`@${userName.toLowerCase()}`) || 
  //           messageText.toLowerCase().includes("@all")) {
  //         playPing();
  //       }
  //     }
  //   });
  //   
  //   return () => unsubscribe();
  // }, [user]);

  // Global private chat mention detection - TEMPORARILY DISABLED to prevent quota issues
  useEffect(() => {
    // DISABLED: This creates excessive Firebase reads and can cause permission errors
    // if (!user) return;

    // TODO: Implement more efficient private chat notifications
    // Consider using Firebase Cloud Messaging instead of realtime listeners
  }, [user, lastPrivateMessageId, lastPingTime]);

  // Load user's potion effects
  useEffect(() => {
    if (!user || !user.uid) return;

    const userRef = doc(db, "users", user.uid);
    const unsub = onSnapshot(
      userRef,
      (userDoc) => {
        if (userDoc.exists()) {
          const data = userDoc.data();
          startTransition(() => {
            setDarkModeUntil(
              data.darkModeUntil && data.darkModeUntil > Date.now()
                ? data.darkModeUntil
                : null
            );
            setRetroUntil(
              data.retroUntil && data.retroUntil > Date.now()
                ? data.retroUntil
                : null
            );
            setMirrorUntil(
              data.mirrorUntil && data.mirrorUntil > Date.now()
                ? data.mirrorUntil
                : null
            );
            setSpeedUntil(
              data.speedUntil && data.speedUntil > Date.now()
                ? data.speedUntil
                : null
            );
            setSlowMotionUntil(
              data.slowMotionUntil && data.slowMotionUntil > Date.now()
                ? data.slowMotionUntil
                : null
            );
            setSurveillanceUntil(
              data.surveillanceUntil && data.surveillanceUntil > Date.now()
                ? data.surveillanceUntil
                : null
            );
            setSparkleUntil(
              data.sparkleUntil && data.sparkleUntil > Date.now()
                ? data.sparkleUntil
                : null
            );
          });
        }
      },
      (error) => {
        console.warn("Error loading potion effects:", error);
        // Don't fail the app if potion effects can't be loaded
      }
    );
    return () => unsub();
  }, [user]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "linear-gradient(135deg, #5D4E37 0%, #8B7A6B 100%)",
          color: "#F5EFE0",
          fontSize: "1.2rem",
          fontFamily: "serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "50px",
              height: "50px",
              border: "3px solid #F5EFE0",
              borderTop: "3px solid transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 20px",
            }}
          ></div>
          <div>Loading Vayloria...</div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }
  // the main app that renders navbar and the main contents
  return (
    <>
      {/* Global Potion Effects CSS */}
      <style>{`
        /* VIP Themes */
        ${vipThemeCSS}
        
        /* Dark Mode Potion */
        ${
          darkModeUntil && darkModeUntil > Date.now()
            ? `
          html, body, div, span, p, h1, h2, h3, h4, h5, h6, a, button, input, textarea, select, label, li, ul, ol, td, th, table, tr, thead, tbody, tfoot, caption, strong, em, b, i, u, small, big, code, pre, blockquote, cite, time, mark, del, ins, sub, sup, dfn, abbr, acronym, address, q, samp, kbd, var, output, progress, meter, details, summary, dialog, menu, menuitem, nav, header, footer, main, section, article, aside, figure, figcaption {
            background: #1a1a1a !important;
            color: #e0e0e0 !important;
          }
          .navbar, .topbar, .inventory, .chat, .sidebar, .main-content, .container, .wrapper {
            background: #2a2a2a !important;
            border-color: #444 !important;
          }
          /* ReactQuill Dark Mode */
          .ql-editor, .ql-container, .ql-toolbar {
            background: #2a2a2a !important;
            color: #e0e0e0 !important;
            border-color: #444 !important;
          }
          .ql-editor {
            background: #1a1a1a !important;
          }
          .ql-toolbar {
            background: #2a2a2a !important;
            border-bottom: 1px solid #444 !important;
          }
          .ql-toolbar .ql-stroke {
            stroke: #e0e0e0 !important;
          }
          .ql-toolbar .ql-fill {
            fill: #e0e0e0 !important;
          }
          .ql-toolbar button {
            color: #e0e0e0 !important;
          }
          .ql-toolbar button:hover {
            background: #444 !important;
          }
          .ql-toolbar button.ql-active {
            background: #555 !important;
          }
          .ql-toolbar .ql-picker-label {
            color: #e0e0e0 !important;
          }
          .ql-toolbar .ql-picker-options {
            background: #2a2a2a !important;
            border: 1px solid #444 !important;
          }
          .ql-toolbar .ql-picker-item {
            color: #e0e0e0 !important;
          }
          .ql-toolbar .ql-picker-item:hover {
            background: #444 !important;
          }
        `
            : ""
        }
        
        /* Retro Potion */
        ${
          retroUntil && retroUntil > Date.now()
            ? `
          html, body, div, span, p, h1, h2, h3, h4, h5, h6, a, button, input, textarea, select, label, li, ul, ol, td, th, table, tr, thead, tbody, tfoot, caption, strong, em, b, i, u, small, big, code, pre, blockquote, cite, time, mark, del, ins, sub, sup, dfn, abbr, acronym, address, q, samp, kbd, var, output, progress, meter, details, summary, dialog, menu, menuitem, nav, header, footer, main, section, article, aside, figure, figcaption {
            font-family: 'Courier New', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
            text-shadow: 1px 1px 0px #000 !important;
            letter-spacing: 0.5px !important;
          }
        `
            : ""
        }
        
        /* Mirror Potion */
        ${
          mirrorUntil && mirrorUntil > Date.now()
            ? `
          body {
            transform: scaleX(-1) !important;
          }
        `
            : ""
        }
        
        /* Speed Potion */
        ${
          speedUntil && speedUntil > Date.now()
            ? `
          *, *::before, *::after {
            animation-duration: 0.5s !important;
            transition-duration: 0.1s !important;
          }
        `
            : ""
        }
        
        /* Slow Motion Potion */
        ${
          slowMotionUntil && slowMotionUntil > Date.now()
            ? `
          *, *::before, *::after {
            animation-duration: 90s !important;
            transition-duration: 1s !important;
          }
          /* Make banner animations extremely slow with slow motion potion */
          .bannerWrapper, .bannerWrapper *, .bannerContent, .bannerContent *,
          .marquee, .marquee *, .marquee span, .marquee span *,
          .announcement, .announcement *, .news-banner, .news-banner *, 
          .popup, .popup *, .notification, .notification *, 
          .toast, .toast *, .banner, .banner * {
            animation-duration: 60s !important;
            transition-duration: 4s !important;
          }
          /* Specifically target the marquee animation */
          .marquee span {
            animation: marquee 60s linear infinite !important;
          }
        `
            : ""
        }
        
        /* Sparkle Potion - floating sparkles around avatar */
        ${
          sparkleUntil && sparkleUntil > Date.now()
            ? `
          .sparkle-effect::before {
            content: '✨';
            position: absolute;
            animation: sparkleFloat 2s infinite;
            pointer-events: none;
            z-index: 1000;
          }
          .sparkle-effect::after {
            content: '⭐';
            position: absolute;
            animation: sparkleFloat 2s infinite 0.5s;
            pointer-events: none;
            z-index: 1000;
          }
          @keyframes sparkleFloat {
            0% { transform: translateY(0px) rotate(0deg); opacity: 1; }
            50% { transform: translateY(-20px) rotate(180deg); opacity: 0.7; }
            100% { transform: translateY(-40px) rotate(360deg); opacity: 0; }
          }
        `
            : ""
        }
      `}</style>

      <MobileLayout>
        <div className={styles.rootContainer}>
          {/* Navbar and TopBar always visible */}
          <header className={styles.header}>
            <Navbar />
          </header>
          {/* Global admin popup for age verification requests (only for logged-in users) */}
          {user && <AdminGlobalAgeVerificationModal />}
          <main className={styles.main}>
            {/* TopBar for logged-in users */}
            {user && <TopBar />}
            <Outlet />
          </main>
          {/* Main chat and PrivateChat only for logged-in users */}
          {user && <Chat />}
          {user && <PrivateChat />}
          {/* Pet Discovery Popup Only for logged-in users */}
          {user && <PetDiscoveryPopupOnly />}
        </div>
      </MobileLayout>
    </>
  );
}

export default App;
