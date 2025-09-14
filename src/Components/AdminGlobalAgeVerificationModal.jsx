import { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { useAuth } from "../context/authContext";

export default function AdminGlobalAgeVerificationModal() {
  const { user } = useAuth();
  const [pending, setPending] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user || !(user.roles || []).includes("admin")) return;
    const unsub = onSnapshot(
      collection(db, "ageVerificationRequests"),
      (snap) => {
        const reqs = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((r) => r.status === "pending");
        if (reqs.length > 0) {
          setPending(reqs[0]);
          setOpen(true);
        } else {
          setPending(null);
          setOpen(false);
        }
      }
    );
    return () => unsub();
  }, [user]);

  if (!open || !pending) return null;

  const handle = async (accept) => {
    if (!pending) return;
    await updateDoc(doc(db, "ageVerificationRequests", pending.id), {
      status: accept ? "accepted" : "declined",
      reviewedAt: Date.now(),
      reviewedBy: user.uid,
    });
    if (accept) {
      await updateDoc(doc(db, "users", pending.uid), { ageVerified: true });
    }
    setOpen(false);
    setPending(null);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.7)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#23232b",
          padding: 32,
          borderRadius: 16,
          maxWidth: 400,
          color: "#fff",
          textAlign: "center",
        }}
      >
        <h2>Aldersverifisering</h2>
        <p>
          <b>{pending.displayName}</b> har sendt inn ID for godkjenning.
        </p>
        {pending.imageUrl && (
          <img
            src={pending.imageUrl}
            alt="ID"
            style={{
              maxWidth: 320,
              maxHeight: 240,
              margin: "1rem auto",
              display: "block",
              borderRadius: 8,
            }}
          />
        )}
        <div
          style={{
            marginTop: 24,
            display: "flex",
            gap: 16,
            justifyContent: "center",
          }}
        >
          <button
            onClick={() => handle(true)}
            style={{
              background: "#4caf50",
              color: "#fff",
              padding: "8px 20px",
              border: "none",
              borderRadius: 6,
              fontWeight: 700,
            }}
          >
            Accept
          </button>
          <button
            onClick={() => handle(false)}
            style={{
              background: "#e53935",
              color: "#fff",
              padding: "8px 20px",
              border: "none",
              borderRadius: 6,
              fontWeight: 700,
            }}
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
