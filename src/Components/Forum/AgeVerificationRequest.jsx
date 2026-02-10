import { useState, useRef } from "react";
import { useAuth } from "../../context/authContext";
import { db, storage } from "../../firebaseConfig";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const buttonStyle = {
  marginTop: 12,
  background: "#a084e8",
  color: "#23232b",
  fontWeight: 700,
  border: 0,
  borderRadius: 0,
  padding: "10px 24px",
  cursor: "pointer",
};

const ACCEPT_IMAGE = "image/jpeg,image/png,image/webp,image/heic";

export default function AgeVerificationRequest() {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [tab, setTab] = useState("choose"); // "choose" | "discord" | "id_photo"
  const [idPhotoFile, setIdPhotoFile] = useState(null);
  const [idPhotoPreview, setIdPhotoPreview] = useState(null);
  const [submitStatus, setSubmitStatus] = useState(null); // "sending" | "sent" | "already" | "error"
  const [errorMessage, setErrorMessage] = useState("");

  const handleIdPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setIdPhotoFile(null);
      setIdPhotoPreview(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please choose an image file (e.g. JPEG, PNG).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("Image must be under 10 MB.");
      return;
    }
    setErrorMessage("");
    setIdPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setIdPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleIdPhotoSubmit = async () => {
    if (!user || !idPhotoFile) return;
    setSubmitStatus("sending");
    setErrorMessage("");
    try {
      const q = query(
        collection(db, "ageVerificationRequests"),
        where("uid", "==", user.uid),
        where("status", "==", "pending")
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setSubmitStatus("already");
        return;
      }
      const path = `ageVerification/${user.uid}/${Date.now()}_${idPhotoFile.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, idPhotoFile);
      const imageUrl = await getDownloadURL(storageRef);
      await addDoc(collection(db, "ageVerificationRequests"), {
        uid: user.uid,
        displayName: user.displayName || user.email || "Unknown",
        status: "pending",
        method: "id_photo",
        imageUrl,
        createdAt: serverTimestamp(),
      });
      setSubmitStatus("sent");
      setIdPhotoFile(null);
      setIdPhotoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setSubmitStatus("error");
      setErrorMessage(err?.message || "Upload failed.");
    }
  };

  if (tab === "choose") {
    return (
      <div
        style={{
          maxWidth: 500,
          margin: "2rem auto",
          background: "#23232b",
          padding: 32,
          borderRadius: 0,
          color: "#fff",
          textAlign: "center",
        }}
      >
        <h2 style={{ color: "#ffd86b", marginBottom: 16 }}>18+ Forum Access</h2>
        <p style={{ marginBottom: 24 }}>
          To access the <b>18+ forum</b>, you must be approved by an admin.
          <br />
          Choose how you want to request access:
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
          <button style={buttonStyle} onClick={() => setTab("discord")}>
            Request via Discord (join server, write in 18+ channel)
          </button>
          <button style={buttonStyle} onClick={() => setTab("id_photo")}>
            Submit photo of ID (admin will verify your age from the image)
          </button>
        </div>
      </div>
    );
  }

  if (tab === "id_photo") {
    return (
      <div
        style={{
          maxWidth: 500,
          margin: "2rem auto",
          background: "#23232b",
          padding: 32,
          borderRadius: 0,
          color: "#fff",
          textAlign: "left",
        }}
      >
        <h2 style={{ color: "#ffd86b", marginBottom: 16 }}>Submit photo of ID</h2>
        <p style={{ marginBottom: 16 }}>
          Upload a photo of your ID (e.g. driver&apos;s license, passport) showing your <b>date of birth</b> and
          <b> photo</b>. An admin will verify your age and approve access to the 18+ forum.
        </p>
        <div
          style={{
            background: "rgba(255, 193, 7, 0.15)",
            border: "1px solid #ffd86b",
            padding: 14,
            marginBottom: 16,
            borderRadius: 0,
            color: "#ffd86b",
            fontSize: "0.95rem",
          }}
        >
          <strong>For your security:</strong> Cover or strike through your <b>personal ID number</b>, <b>account numbers</b>,
          and any other sensitive details before taking the photo.           Only your <b>face/photo</b> and <b>date of birth</b> need
          to be visible.
        </div>
        <p style={{ marginBottom: 12, color: "#aaa", fontSize: "0.9rem" }}>
          The image is only used for age verification and handled according to our privacy policy.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_IMAGE}
          onChange={handleIdPhotoChange}
          style={{ display: "block", marginBottom: 12 }}
        />
        {idPhotoPreview && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ marginBottom: 8 }}>Preview:</p>
            <img
              src={idPhotoPreview}
              alt="ID preview"
              style={{
                maxWidth: "100%",
                maxHeight: 240,
                objectFit: "contain",
                border: "1px solid #555",
                borderRadius: 0,
              }}
            />
          </div>
        )}
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <button
            style={buttonStyle}
            onClick={handleIdPhotoSubmit}
            disabled={!idPhotoFile || submitStatus === "sending"}
          >
            {submitStatus === "sending" ? "Uploading…" : "Submit for review"}
          </button>
          <button
            style={{ ...buttonStyle, background: "#555" }}
            onClick={() => {
              setTab("choose");
              setSubmitStatus(null);
              setErrorMessage("");
              setIdPhotoFile(null);
              setIdPhotoPreview(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          >
            Back
          </button>
        </div>
        {submitStatus === "sent" && (
          <p style={{ marginTop: 16, color: "#8bc34a" }}>
            ID photo submitted. An admin will review it and you will get access once approved.
          </p>
        )}
        {submitStatus === "already" && (
          <p style={{ marginTop: 16, color: "#ffd86b" }}>
            You already have a pending request. Please wait for an admin to review it.
          </p>
        )}
        {submitStatus === "error" && (
          <p style={{ marginTop: 16, color: "#e53935" }}>{errorMessage || "Something went wrong."}</p>
        )}
      </div>
    );
  }

  // tab === "discord"
  return (
    <div
      style={{
        maxWidth: 500,
        margin: "2rem auto",
        background: "#23232b",
        padding: 32,
        borderRadius: 0,
        color: "#fff",
        textAlign: "center",
      }}
    >
      <h2 style={{ color: "#ffd86b", marginBottom: 16 }}>18+ Forum Access via Discord</h2>
      <p style={{ marginBottom: 24 }}>
        <b>Step 1:</b> Join our Discord server and enter the <b>18+</b> channel:
        <br />
        <a
          href="https://discord.gg/gAdpq5ZE6E"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#6bc1ff", fontWeight: 700 }}
        >
          https://discord.gg/gAdpq5ZE6E
        </a>
      </p>
      <p style={{ marginBottom: 24 }}>
        <b>Step 2:</b> Write a short message in the 18+ channel to request access. An admin will approve you after
        checking that you have access to the 18+ Discord channel. Once approved, you get access to the 18+ forum here.
      </p>
      <p style={{ marginBottom: 16 }}>
        <b>Note:</b> An admin may ask you to send a photo of your ID (e.g. in Discord) instead. If so, use the same
        security guidelines below.
      </p>
      <div
        style={{
          background: "rgba(255, 193, 7, 0.15)",
          border: "1px solid #ffd86b",
          padding: 14,
          marginBottom: 16,
          borderRadius: 0,
          color: "#ffd86b",
          fontSize: "0.95rem",
          textAlign: "left",
        }}
      >
        <strong>For your security (if you send ID):</strong> Cover or strike through your <b>personal ID number</b>,{" "}
        <b>account numbers</b>, and any other sensitive details before taking or sending the photo. Only your{" "}
        <b>face/photo</b> and <b>date of birth</b> need to be visible.
      </div>
      <div
        style={{
          background: "#333",
          padding: 16,
          borderRadius: 0,
          color: "#ffd86b",
          fontWeight: 500,
        }}
      >
        You do not have access to the 18+ forum yet. Please contact an admin on Discord to get approved.
      </div>
      <button style={{ ...buttonStyle, marginTop: 16 }} onClick={() => setTab("choose")}>
        Back to options
      </button>
    </div>
  );
}
