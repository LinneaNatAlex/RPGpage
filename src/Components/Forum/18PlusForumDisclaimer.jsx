import { useState, useEffect } from "react";

export default function Forum18PlusDisclaimer({ onConfirm }) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setOpen(true);
  }, []);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.85)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#23232b",
          color: "#fff",
          padding: 32,
          borderRadius: 0,
          maxWidth: 480,
          textAlign: "center",
          boxShadow: "0 2px 16px #000",
        }}
      >
        <h2 style={{ color: "#ffd86b", marginBottom: 16 }}>
          18+ Forum Disclaimer
        </h2>
        <p style={{ marginBottom: 18 }}>
          The 18+ forum may contain content that is violent, triggering, or
          sexual in nature.
          <br />
          By entering, you acknowledge that you are 18 years or older and accept
          full responsibility for the content you may see.
          <br />
          If you are sensitive to such material, please do not proceed.
        </p>
        <button
          style={{
            background: "#a084e8",
            color: "#23232b",
            fontWeight: 700,
            border: 0,
            borderRadius: 0,
            padding: "10px 32px",
            fontSize: 18,
            cursor: "pointer",
          }}
          onClick={() => {
            setOpen(false);
            if (onConfirm) onConfirm();
          }}
        >
          I understand and wish to proceed
        </button>
      </div>
    </div>
  );
}
