import React, { useEffect, useState } from "react";

const MOBILE_PORTRAIT_MAX_WIDTH = 768;
const STORAGE_KEY = "rotateDevicePopupSeen";

export default function RotateDevicePopup() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    function checkOrientation() {
      const alreadySeen = typeof sessionStorage !== "undefined" && sessionStorage.getItem(STORAGE_KEY);
      if (alreadySeen) {
        setShow(false);
        return;
      }
      const isMobile = window.innerWidth <= MOBILE_PORTRAIT_MAX_WIDTH;
      const isPortrait = window.matchMedia("(orientation: portrait)").matches;
      setShow(isMobile && isPortrait);
    }
    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);
    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  const handleClose = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch (_) {}
    setShow(false);
  };

  if (!show) return null;

  return (
    <div style={popupStyles.overlay}>
      <div style={popupStyles.popup}>
        <button
          style={popupStyles.closeBtn}
          onClick={handleClose}
          aria-label="Close"
        >
          ×
        </button>
        <div style={popupStyles.icon}>📱↔️</div>
        <div style={popupStyles.text}>
          For the best experience, please rotate your device to landscape mode.
        </div>
        <div style={popupStyles.hint}>You can close this and use the site in portrait if you prefer.</div>
      </div>
    </div>
  );
}

const popupStyles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(0,0,0,0.45)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  popup: {
    background: "#f5efe0",
    border: "2px solid #7b6857",
    borderRadius: 8,
    padding: "2rem 1.5rem 1.5rem 1.5rem",
    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
    maxWidth: 320,
    width: "90vw",
    textAlign: "center",
    position: "relative",
    fontFamily: "Cinzel, serif",
  },
  closeBtn: {
    position: "absolute",
    top: 8,
    right: 12,
    background: "none",
    border: "none",
    fontSize: 24,
    color: "#7b6857",
    cursor: "pointer",
    fontWeight: "bold",
  },
  icon: {
    fontSize: 40,
    marginBottom: 12,
  },
  text: {
    color: "#7b6857",
    fontSize: 18,
    fontWeight: 500,
    marginBottom: 8,
  },
  hint: {
    color: "#8b7a6b",
    fontSize: 13,
    fontWeight: 400,
    marginTop: 4,
  },
};
