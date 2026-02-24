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
  if (allowed === null) return <div>Checking access...</div>;
  if (!allowed)
    return (
      <div style={{ marginTop: 32 }}>
        <div>You must be age verified to access the 18+ forum.</div>
        {!showRequest ? (
          <button
            style={{
              marginTop: 18,
              background: "#a084e8",
              color: "#23232b",
              fontWeight: 700,
              border: 0,
              borderRadius: 0,
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
