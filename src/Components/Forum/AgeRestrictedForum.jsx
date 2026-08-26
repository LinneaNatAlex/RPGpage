import { useAuth } from "../../context/authContext";
import useUserData from "../../hooks/useUserData";
import { useState } from "react";
import AgeVerificationRequest from "./AgeVerificationRequest";
import Forum18PlusDisclaimer from "./18PlusForumDisclaimer";

export default function AgeRestrictedForum({ children }) {
  const { user } = useAuth();
  const { userData, loading } = useUserData();
  const [disclaimerConfirmed, setDisclaimerConfirmed] = useState(false);

  const allowed = user ? (loading ? null : !!userData?.ageVerified) : false;

  const [showRequest, setShowRequest] = useState(false);
  if (allowed === null)
    return (
      <div
        style={{
          margin: "12px 0",
          padding: "1.25rem 1.1rem",
          background: "#f3eadc",
          color: "#1a1410",
          borderRadius: 12,
          border: "1px solid rgba(201, 168, 108, 0.35)",
        }}
      >
        Checking 18+ access…
      </div>
    );
  if (!allowed)
    return (
      <div
        style={{
          margin: "12px 0",
          padding: "1.25rem 1.1rem",
          background: "#f3eadc",
          color: "#1a1410",
          borderRadius: 12,
          border: "1px solid rgba(201, 168, 108, 0.35)",
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 8 }}>18+ Forum</div>
        <div>You must be age verified to access the 18+ forum.</div>
        {!showRequest ? (
          <button
            style={{
              marginTop: 18,
              background: "#a084e8",
              color: "#2c241c",
              fontWeight: 700,
              border: 0,
              borderRadius: 12,
              padding: "10px 24px",
              cursor: "pointer",
            }}
            onClick={() => setShowRequest(true)}
          >
            How to get 18+ forum access
          </button>
        ) : (
          <div style={{ marginTop: 24 }}>
            <AgeVerificationRequest />
          </div>
        )}
      </div>
    );
  if (!disclaimerConfirmed) {
    return (
      <Forum18PlusDisclaimer onConfirm={() => setDisclaimerConfirmed(true)} />
    );
  }
  return children;
}
