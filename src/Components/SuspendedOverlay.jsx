import React, { useEffect, useState } from "react";

// until: timestamp (ms), reason: string, description: string
export default function SuspendedOverlay({ until, reason, description }) {
  const [countdown, setCountdown] = useState(() => {
    if (!until) return 0;
    return Math.max(0, Math.floor((until - Date.now()) / 1000));
  });

  useEffect(() => {
    if (!until) return;
    const timer = setInterval(() => {
      setCountdown(Math.max(0, Math.floor((until - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(timer);
  }, [until]);

  function formatCountdown(secs) {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  // If suspension expired, render nothing (let app resume)
  if (until && countdown <= 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(30,30,40,0.97)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
      }}
    >
      <h1 style={{ color: "#ffd86b" }}>Account Suspended</h1>
      <p style={{ fontSize: 18, marginBottom: 16 }}>
        {reason ||
          "You are temporarily suspended and cannot interact with the site."}
      </p>
      <div style={{ fontSize: 15, color: "#ffd86b", marginBottom: 12 }}>
        {description || (
          <>
            Repeated rule violations, ignoring staff instructions, or lack of
            respect are the most common reasons for suspension.
          </>
        )}
      </div>
      {until && countdown > 0 && (
        <p style={{ fontSize: 16 }}>
          Suspension ends in: <b>{formatCountdown(countdown)}</b>
          <br />
          <span style={{ fontSize: 13, color: "#b0aac2" }}>
            ({new Date(until).toLocaleString()})
          </span>
        </p>
      )}
      <p style={{ marginTop: 32, color: "#b0aac2", fontSize: 14 }}>
        If you believe this is a mistake, please contact an administrator.
      </p>
    </div>
  );
}
