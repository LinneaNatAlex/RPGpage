// import the nessesary modules
import { Outlet } from "react-router-dom";
import { useAuth } from "./context/authContext.jsx";
import styles from "./App.module.css";
import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebaseConfig";

import Navbar from "./Navbar/Navbar";
import PrivateChat from "./Components/Chat/PrivateChat";
import Chat from "./Components/Chat/Chat";
import TopBar from "./Components/TopBar/TopBar";
import AdminGlobalAgeVerificationModal from "./Components/AdminGlobalAgeVerificationModal";

function App() {
  const { user, loading } = useAuth();
  
  // Global potion effect states
  const [darkModeUntil, setDarkModeUntil] = useState(null);
  const [retroUntil, setRetroUntil] = useState(null);
  const [mirrorUntil, setMirrorUntil] = useState(null);
  const [speedUntil, setSpeedUntil] = useState(null);
  const [slowMotionUntil, setSlowMotionUntil] = useState(null);
  const [sparkleUntil, setSparkleUntil] = useState(null);
  
  // Load user's potion effects
  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const unsub = onSnapshot(userRef, (userDoc) => {
      if (userDoc.exists()) {
        const data = userDoc.data();
        setDarkModeUntil(data.darkModeUntil && data.darkModeUntil > Date.now() ? data.darkModeUntil : null);
        setRetroUntil(data.retroUntil && data.retroUntil > Date.now() ? data.retroUntil : null);
        setMirrorUntil(data.mirrorUntil && data.mirrorUntil > Date.now() ? data.mirrorUntil : null);
        setSpeedUntil(data.speedUntil && data.speedUntil > Date.now() ? data.speedUntil : null);
        setSlowMotionUntil(data.slowMotionUntil && data.slowMotionUntil > Date.now() ? data.slowMotionUntil : null);
        setSparkleUntil(data.sparkleUntil && data.sparkleUntil > Date.now() ? data.sparkleUntil : null);
      }
    });
    return () => unsub();
  }, [user]);
  
  if (loading) {
    return <div>Loading...</div>; // Show a loading state while auth is being checked
  }
  // the main app that renders navbar and the main contents
  return (
    <>
      {/* Global Potion Effects CSS */}
      <style>{`
        /* Dark Mode Potion */
        ${darkModeUntil && darkModeUntil > Date.now() ? `
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
        ` : ''}
        
        /* Retro Potion */
        ${retroUntil && retroUntil > Date.now() ? `
          html, body, div, span, p, h1, h2, h3, h4, h5, h6, a, button, input, textarea, select, label, li, ul, ol, td, th, table, tr, thead, tbody, tfoot, caption, strong, em, b, i, u, small, big, code, pre, blockquote, cite, time, mark, del, ins, sub, sup, dfn, abbr, acronym, address, q, samp, kbd, var, output, progress, meter, details, summary, dialog, menu, menuitem, nav, header, footer, main, section, article, aside, figure, figcaption {
            font-family: 'Courier New', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
            text-shadow: 1px 1px 0px #000 !important;
            letter-spacing: 0.5px !important;
          }
        ` : ''}
        
        /* Mirror Potion */
        ${mirrorUntil && mirrorUntil > Date.now() ? `
          body {
            transform: scaleX(-1) !important;
          }
        ` : ''}
        
        /* Speed Potion */
        ${speedUntil && speedUntil > Date.now() ? `
          *, *::before, *::after {
            animation-duration: 0.5s !important;
            transition-duration: 0.1s !important;
          }
        ` : ''}
        
        /* Slow Motion Potion */
        ${slowMotionUntil && slowMotionUntil > Date.now() ? `
          *, *::before, *::after {
            animation-duration: 2s !important;
            transition-duration: 1s !important;
          }
        ` : ''}
        
        /* Sparkle Potion - floating sparkles around avatar */
        ${sparkleUntil && sparkleUntil > Date.now() ? `
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
        ` : ''}
      `}</style>
      
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
      </div>
    </>
  );
}

export default App;
