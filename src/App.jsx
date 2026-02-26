// import the nessesary modules
import { Outlet, useLocation } from "react-router-dom";
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
import { OpenPrivateChatProvider } from "./context/openPrivateChatContext";
import AdminGlobalAgeVerificationModal from "./Components/AdminGlobalAgeVerificationModal";
import MobileLayout from "./Components/MobileLayout/MobileLayout";
import DetentionPopup from "./Components/DetentionPopup/DetentionPopup";
import useLocationTracker from "./hooks/useLocationTracker";
import useUserData from "./hooks/useUserData";
import RotateDevicePopup from "./Components/RotateDevicePopup";
import "./App.mobile.css";

function App() {
  const { user, loading } = useAuth();
  const { userData } = useUserData();
  const location = useLocation();

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
  // Global site dark mode (admin-toggle, gjelder alle brukere)
  const [globalDarkMode, setGlobalDarkMode] = useState(false);
  // Global site pink mode (Valentine's – admin-toggle)
  const [globalPinkMode, setGlobalPinkMode] = useState(false);
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

  // Sync data-theme to <html> so IE/Edge/all browsers get same dark/pink styles (og lagre for reload)
  const isDark = globalDarkMode || (darkModeUntil && typeof darkModeUntil === "number" && darkModeUntil > Date.now());
  useEffect(() => {
    const html = document.documentElement;
    if (globalPinkMode) {
      html.setAttribute("data-theme", "pink");
      try { localStorage.setItem("vayloria-theme", "pink"); } catch (_) {}
    } else if (isDark) {
      html.setAttribute("data-theme", "dark");
      try { localStorage.setItem("vayloria-theme", "dark"); } catch (_) {}
    } else {
      html.removeAttribute("data-theme");
      try { localStorage.setItem("vayloria-theme", "light"); } catch (_) {}
    }
  }, [isDark, globalPinkMode]);

  // Load global site config (dark mode, pink mode – leses for alle så tema lastes med en gang)
  useEffect(() => {
    const configRef = doc(db, "config", "site");
    const unsub = onSnapshot(
      configRef,
      (snap) => {
        const data = snap.exists() ? snap.data() : {};
        setGlobalDarkMode(data.globalDarkMode === true);
        setGlobalPinkMode(data.globalPinkMode === true);
      },
      (err) => {
        console.warn("Config/site kunne ikke lastes:", err?.message);
        setGlobalDarkMode(false);
        setGlobalPinkMode(false);
      }
    );
    return () => unsub();
  }, []);

  // Potion effects fra useUserData (én onSnapshot i stedet for to – sparer Firestore reads)
  useEffect(() => {
    if (!userData) return;
    const now = Date.now();
    startTransition(() => {
      setDarkModeUntil(
        userData.darkModeUntil && typeof userData.darkModeUntil === "number" && userData.darkModeUntil > now
          ? userData.darkModeUntil
          : null,
      );
      setRetroUntil(
        userData.retroUntil && typeof userData.retroUntil === "number" && userData.retroUntil > now
          ? userData.retroUntil
          : null,
      );
      setMirrorUntil(
        userData.mirrorUntil && typeof userData.mirrorUntil === "number" && userData.mirrorUntil > now
          ? userData.mirrorUntil
          : null,
      );
      setSpeedUntil(
        userData.speedUntil && typeof userData.speedUntil === "number" && userData.speedUntil > now
          ? userData.speedUntil
          : null,
      );
      setSlowMotionUntil(
        userData.slowMotionUntil && typeof userData.slowMotionUntil === "number" && userData.slowMotionUntil > now
          ? userData.slowMotionUntil
          : null,
      );
      setSurveillanceUntil(
        userData.surveillanceUntil && typeof userData.surveillanceUntil === "number" && userData.surveillanceUntil > now
          ? userData.surveillanceUntil
          : null,
      );
      setSparkleUntil(
        userData.sparkleUntil && typeof userData.sparkleUntil === "number" && userData.sparkleUntil > now
          ? userData.sparkleUntil
          : null,
      );
    });
  }, [userData]);

  // Ved reload: vis kun spinner til auth er klar (inline + global keyframes så det fungerer likt på localhost og produksjon)
  if (loading) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#E8DDD4",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 99999,
        }}
        aria-busy="true"
        aria-label="Loading"
      >
        <style>{`@keyframes appAuthSpin{to{transform:rotate(360deg);}}`}</style>
        <div
          style={{
            width: 48,
            height: 48,
            border: "4px solid rgba(123,104,87,0.3)",
            borderTopColor: "#7B6857",
            borderRadius: "50%",
            animation: "appAuthSpin 0.9s linear infinite",
          }}
        />
      </div>
    );
  }

  return (
    <>
      {/* Global Potion Effects CSS */}
      <style>{`
        /* VIP Themes */
        ${vipThemeCSS}
        
        /* Dark Mode: samme palett som Chrome i alle browsere (IE, Edge, Safari, etc.) */
        ${
          globalDarkMode ||
          (darkModeUntil &&
            typeof darkModeUntil === "number" &&
            darkModeUntil > Date.now())
            ? `
          /* Samme mørke gråtoner – sidens bakgrunn litt lysere så det ikke blir «svart vs grått» */
          html[data-theme="dark"], [data-theme="dark"] { background: #252525 !important; }
          html[data-theme="dark"], html[data-theme="dark"] body,
          html[data-theme="dark"] div, html[data-theme="dark"] span, html[data-theme="dark"] p,
          html[data-theme="dark"] h1, html[data-theme="dark"] h2, html[data-theme="dark"] h3,
          html[data-theme="dark"] h4, html[data-theme="dark"] h5, html[data-theme="dark"] h6,
          html[data-theme="dark"] a, html[data-theme="dark"] button, html[data-theme="dark"] label,
          html[data-theme="dark"] li, html[data-theme="dark"] ul, html[data-theme="dark"] ol,
          html[data-theme="dark"] td, html[data-theme="dark"] th, html[data-theme="dark"] table,
          html[data-theme="dark"] tr, html[data-theme="dark"] thead, html[data-theme="dark"] tbody,
          html[data-theme="dark"] strong, html[data-theme="dark"] em,
          html[data-theme="dark"] nav, html[data-theme="dark"] header, html[data-theme="dark"] footer,
          html[data-theme="dark"] main, html[data-theme="dark"] section, html[data-theme="dark"] article {
            background: #252525 !important;
            color: #f5f5f5 !important;
          }
          html[data-theme="dark"] .navbar, html[data-theme="dark"] .topbar,
          html[data-theme="dark"] .inventory, html[data-theme="dark"] .chat,
          html[data-theme="dark"] .sidebar {
            background: #2e2e2e !important;
            border-color: #444 !important;
          }
          /* Innholdsområde uten egen bakgrunn – samme som side */
          html[data-theme="dark"] .main-content,
          html[data-theme="dark"] .container,
          html[data-theme="dark"] .wrapper {
            background: transparent !important;
            border-color: transparent !important;
          }
          html[data-theme="dark"] .ql-editor, html[data-theme="dark"] .ql-container,
          html[data-theme="dark"] .ql-toolbar {
            background: #2e2e2e !important;
            color: #f5f5f5 !important;
            border-color: #444 !important;
          }
          html[data-theme="dark"] .ql-editor { background: #252525 !important; }
          html[data-theme="dark"] .ql-toolbar {
            background: #2e2e2e !important;
            border-bottom: 1px solid #a88800 !important;
          }
          html[data-theme="dark"] .ql-toolbar .ql-stroke { stroke: #f5f5f5 !important; }
          html[data-theme="dark"] .ql-toolbar .ql-fill { fill: #f5f5f5 !important; }
          html[data-theme="dark"] .ql-toolbar button { color: #f5f5f5 !important; }
          html[data-theme="dark"] .ql-toolbar button:hover { background: #383838 !important; }
          html[data-theme="dark"] .ql-toolbar button.ql-active { background: #a88800 !important; }
          html[data-theme="dark"] .ql-toolbar .ql-picker-label { color: #f5f5f5 !important; }
          html[data-theme="dark"] .ql-toolbar .ql-picker-options {
            background: #2e2e2e !important;
            border: 1px solid #a88800 !important;
          }
          html[data-theme="dark"] .ql-toolbar .ql-picker-item { color: #f5f5f5 !important; }
          html[data-theme="dark"] .ql-toolbar .ql-picker-item:hover { background: #383838 !important; }
          html[data-theme="dark"] input, html[data-theme="dark"] textarea, html[data-theme="dark"] select {
            background-color: #383838 !important;
            color: #f5f5f5 !important;
            border: 1px solid #555 !important;
          }
          html[data-theme="dark"] input::placeholder,
          html[data-theme="dark"] textarea::placeholder { color: #e0e0e0 !important; }
          html[data-theme="dark"] input:-webkit-autofill,
          html[data-theme="dark"] input:-webkit-autofill:hover,
          html[data-theme="dark"] input:-webkit-autofill:focus {
            -webkit-text-fill-color: #f5f5f5 !important;
            -webkit-box-shadow: 0 0 0 30px #383838 inset !important;
            box-shadow: 0 0 0 30px #383838 inset !important;
            background-color: #383838 !important;
          }
          /* Ekstra: fang opp alle mørke tekster (News, Welcome, seksjoner) */
          html[data-theme="dark"] main,
          html[data-theme="dark"] main *,
          html[data-theme="dark"] [class*="introduction"],
          html[data-theme="dark"] [class*="newsFeed"],
          html[data-theme="dark"] [class*="newsContainer"],
          html[data-theme="dark"] [class*="newsAdmin"],
          html[data-theme="dark"] [class*="welcome"],
          html[data-theme="dark"] [class*="section-card"] {
            color: #f5f5f5 !important;
          }
          html[data-theme="dark"] main [class*="Wrapper"],
          html[data-theme="dark"] main [class*="Container"] {
            background: transparent !important;
            border-color: transparent !important;
          }
          /* Popup rundt news/library-iframe: ingen ekstra lag – kun iframe-innholdet har bakgrunn */
          html[data-theme="dark"] [class*="popupContent"],
          html[data-theme="dark"] [class*="popupContainer"] {
            background: transparent !important;
            border-color: transparent !important;
          }
        `
            : ""
        }

        /* Pink mode (Valentine's) – global site theme */
        ${
          globalPinkMode
            ? `
          [data-theme="pink"] {
            background: #fff0f5 !important;
          }
          [data-theme="pink"] html, [data-theme="pink"] body,
          [data-theme="pink"] div, [data-theme="pink"] span, [data-theme="pink"] p,
          [data-theme="pink"] h1, [data-theme="pink"] h2, [data-theme="pink"] h3,
          [data-theme="pink"] h4, [data-theme="pink"] h5, [data-theme="pink"] h6,
          [data-theme="pink"] a, [data-theme="pink"] button, [data-theme="pink"] input,
          [data-theme="pink"] textarea, [data-theme="pink"] select, [data-theme="pink"] label,
          [data-theme="pink"] li, [data-theme="pink"] ul, [data-theme="pink"] ol,
          [data-theme="pink"] td, [data-theme="pink"] th, [data-theme="pink"] table,
          [data-theme="pink"] tr, [data-theme="pink"] thead, [data-theme="pink"] tbody,
          [data-theme="pink"] main, [data-theme="pink"] section, [data-theme="pink"] article,
          [data-theme="pink"] nav, [data-theme="pink"] header, [data-theme="pink"] footer,
          [data-theme="pink"] strong, [data-theme="pink"] em {
            background: #fff0f5 !important;
            color: #5a2c3a !important;
          }
          [data-theme="pink"] a {
            color: #b84d6d !important;
          }
          [data-theme="pink"] a:hover {
            color: #c75d7a !important;
          }
          [data-theme="pink"] .navbar, [data-theme="pink"] .topbar,
          [data-theme="pink"] .inventory, [data-theme="pink"] .chat,
          [data-theme="pink"] .sidebar, [data-theme="pink"] .main-content,
          [data-theme="pink"] .container, [data-theme="pink"] .wrapper,
          [data-theme="pink"] header, [data-theme="pink"] [class*="rootContainer"],
          [data-theme="pink"] [class*="header"], [data-theme="pink"] [class*="main"] {
            background: #ffe4ec !important;
            border-color: #e8a0b0 !important;
          }
          [data-theme="pink"] input, [data-theme="pink"] textarea, [data-theme="pink"] select {
            background-color: #fff5f8 !important;
            color: #5a2c3a !important;
            border-color: #e8a0b0 !important;
          }
          [data-theme="pink"] input::placeholder, [data-theme="pink"] textarea::placeholder {
            color: #b08090 !important;
          }
          [data-theme="pink"] input:-webkit-autofill,
          [data-theme="pink"] input:-webkit-autofill:hover,
          [data-theme="pink"] input:-webkit-autofill:focus {
            -webkit-text-fill-color: #5a2c3a !important;
            -webkit-box-shadow: 0 0 0 30px #fff5f8 inset !important;
            box-shadow: 0 0 0 30px #fff5f8 inset !important;
            background-color: #fff5f8 !important;
          }
          [data-theme="pink"] .ql-editor, [data-theme="pink"] .ql-container, [data-theme="pink"] .ql-toolbar {
            background: #fff5f8 !important;
            color: #5a2c3a !important;
            border-color: #e8a0b0 !important;
          }
          [data-theme="pink"] .ql-toolbar .ql-stroke { stroke: #c75d7a !important; }
          [data-theme="pink"] .ql-toolbar .ql-fill { fill: #c75d7a !important; }
          [data-theme="pink"] .ql-toolbar button { color: #5a2c3a !important; }
          [data-theme="pink"] .ql-toolbar button:hover { background: #ffe4ec !important; }
          [data-theme="pink"] ::-webkit-scrollbar-thumb { background: #e8a0b0 !important; }
          [data-theme="pink"] * { scrollbar-color: #e8a0b0 #fff0f5 !important; }
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

      <RotateDevicePopup />
      <OpenPrivateChatProvider>
      <MobileLayout>
        <div
          className={styles.rootContainer}
          data-theme={
            globalPinkMode
              ? "pink"
              : globalDarkMode ||
                (darkModeUntil &&
                  typeof darkModeUntil === "number" &&
                  darkModeUntil > Date.now())
              ? "dark"
              : undefined
          }
        >
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
          {user && location.pathname !== "/messages" && <PrivateChat />}
          {/* Pet Discovery Popup Only for logged-in users */}
          {user && <DetentionPopup />}
        </div>
      </MobileLayout>
      </OpenPrivateChatProvider>
    </>
  );
}

export default App;
