import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useUserData from "../../hooks/useUserData";

/**
 * Shows a one-time popup to the user when they are put in detention (or when they load while in detention).
 */
const DetentionPopup = () => {
  const { userData } = useUserData();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const lastShownForRef = useRef(null);

  const detentionUntil = userData?.detentionUntil;
  const detentionReason = userData?.detentionReason;
  const now = Date.now();
  const isInDetention = detentionUntil && typeof detentionUntil === "number" && detentionUntil > now;

  useEffect(() => {
    if (!isInDetention) {
      lastShownForRef.current = null;
      return;
    }
    // Show popup once per detention period (when detentionUntil value is new)
    if (lastShownForRef.current !== detentionUntil) {
      setShow(true);
      lastShownForRef.current = detentionUntil;
    }
  }, [isInDetention, detentionUntil]);

  const handleClose = () => {
    setShow(false);
    navigate("/forum/detentionclassroom");
  };

  if (!show || !isInDetention) return null;

  const endTime = new Date(detentionUntil);
  const endStr = endTime.toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10001,
        padding: 20,
      }}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "linear-gradient(180deg, #2C2C2C 0%, #1a1a1a 100%)",
          border: "3px solid #ff6b6b",
          borderRadius: 0,
          maxWidth: 420,
          width: "100%",
          padding: 28,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 24px rgba(255,107,107,0.2)",
        }}
      >
        <h2
          style={{
            color: "#ff6b6b",
            fontSize: "1.4rem",
            fontFamily: '"Cinzel", serif',
            margin: "0 0 16px 0",
            textAlign: "center",
          }}
        >
          You have been sent to detention
        </h2>
        <p style={{ color: "#F5EFE0", fontSize: "1rem", lineHeight: 1.5, margin: "0 0 12px 0" }}>
          You can only access the <strong>Detention Classroom</strong> forum until your detention
          period ends.
        </p>
        <p style={{ color: "#D4C4A8", fontSize: "0.95rem", margin: "0 0 8px 0" }}>
          Ends: <strong style={{ color: "#F5EFE0" }}>{endStr}</strong>
        </p>
        {detentionReason && (
          <p style={{ color: "#D4C4A8", fontSize: "0.9rem", margin: "0 0 20px 0", fontStyle: "italic" }}>
            Reason: {detentionReason}
          </p>
        )}
        <button
          type="button"
          onClick={handleClose}
          style={{
            width: "100%",
            background: "linear-gradient(135deg, #7B6857 0%, #6B5B47 100%)",
            color: "#F5EFE0",
            border: "2px solid #D4C4A8",
            borderRadius: 0,
            padding: "12px 20px",
            fontSize: "1rem",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: '"Cinzel", serif',
          }}
        >
          Go to Detention Classroom
        </button>
      </div>
    </div>
  );
};

export default DetentionPopup;
