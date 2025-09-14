import { useAuth } from "../../context/authContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

import { useEffect, useState } from "react";
import AgeVerificationRequest from "./AgeVerificationRequest";
import Forum18PlusDisclaimer from "./18PlusForumDisclaimer";

export default function AgeRestrictedForum({ children }) {
  const { user } = useAuth();
  const [allowed, setAllowed] = useState(null);
  const [disclaimerConfirmed, setDisclaimerConfirmed] = useState(false);

  useEffect(() => {
    if (!user) return setAllowed(false);
    getDoc(doc(db, "users", user.uid)).then((snap) => {
      setAllowed(!!snap.data()?.ageVerified);
    });
  }, [user]);

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
              borderRadius: 6,
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
