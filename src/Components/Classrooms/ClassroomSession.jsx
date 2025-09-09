import { useState } from "react";
import PotionList from "../PotionList/PotionList";
import PotionCrafting from "./PotionCrafting";
// Potions data (move to a shared file if needed)
const potions = [
  {
    id: 1,
    name: "Love Potion",
    image: "/images/lovepotion.png",
    effect: "Induces strong feelings of love in the drinker.",
    ingredients: [
      "Rose petals",
      "unicorn hair",
      "sugar",
      "raspberries",
      "magical water",
    ],
    howToMake:
      "Boil magical water, add rose petals and raspberries. Stir in sugar and unicorn hair, let it infuse under a full moon.",
    usage: "Drink to fall in love.",
    siteEffect:
      "(On the website: When you drink this, hearts will rain on your profile for 10 minutes, your profile turns pink, and it shows who you are in love with.)",
  },
  {
    id: 2,
    name: "Invisibility Potion",
    image: "/images/invisibilitypotion.png",
    effect: "Makes the user invisible to others for a limited time.",
    ingredients: [
      "Hidden mushrooms",
      "dragon blood",
      "stardust",
      "shadow leaf",
    ],
    howToMake:
      "Mix stardust and dragon blood, add shadow leaf and hidden mushrooms. Leave in darkness for 2 hours.",
    usage: "Drink to become invisible.",
    siteEffect:
      "(On the website: Your profile becomes invisible to others for 5 minutes, and you disappear from the online list.)",
  },
  {
    id: 3,
    name: "Energy Elixir",
    image: "/images/energyelixir.png",
    effect: "Gives the user extra energy and endurance.",
    ingredients: ["Blackcurrant", "phoenix feather", "honey", "magical herb"],
    howToMake:
      "Crush blackcurrant and magical herb, mix with honey and phoenix feather. Shake well.",
    usage: "Drink to gain energy and strength.",
    siteEffect:
      "(On the website: You get a glowing aura around your avatar for 10 minutes and can send extra messages in the chat.)",
  },
  {
    id: 4,
    name: "Truth Serum",
    image: "/images/truthserum.png",
    effect: "Forces the user to speak the truth for a period of time.",
    ingredients: ["Silver leaf", "amber", "troll berries", "magical salt"],
    howToMake:
      "Mix all ingredients in a silver cauldron, boil and let cool under starlight.",
    usage: "Drink to reveal the truth.",
    siteEffect:
      "(On the website: You can only send truthful messages for 5 minutes, and your chat bubble gets a blue glow.)",
  },
];
import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../firebaseConfig";
import {
  doc,
  onSnapshot,
  updateDoc,
  arrayRemove,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { useAuth } from "../../context/authContext";
import { classesList } from "../../data/classesList";
import useUserRoles from "../../hooks/useUserRoles";
import useUsers from "../../hooks/useUser";

export default function ClassroomSession() {
  const { users: allUsers = [] } = useUsers();
  const { classId } = useParams();
  const { user } = useAuth();
  const { roles: userRoles = [] } = useUserRoles();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const chatRef = useRef(null);
  // For teachers/admins: allow year selection
  const isTeacher =
    userRoles.includes("teacher") || userRoles.includes("admin");
  const [selectedYear, setSelectedYear] = useState(user?.year || 1);
  const userYear = isTeacher ? selectedYear : user?.year || 1;
  // Filter online users for this class/year
  const attendingUsers = allUsers.filter(
    (u) => u.online && (u.year === userYear || u.year === Number(userYear))
  );
  const classInfo = classesList.find((c) => c.id === classId);

  // Listen for students in this class/year
  useEffect(() => {
    const ref = doc(db, "classAttendance", `${classId}-year${userYear}`);
    const unsub = onSnapshot(ref, (snap) => {
      let arr = snap.exists() ? snap.data().students || [] : [];
      // Always show current user in list if attending
      if (user) {
        const exists = arr.some((s) => s.uid === user.uid);
        if (!exists) {
          arr = [
            ...arr,
            {
              uid: user.uid,
              displayName: user.displayName || user.email || "Unknown",
              house: user.house || user.race || "?",
              year: userYear,
              attendedAt: Date.now(),
              roles: Array.isArray(userRoles) ? userRoles : [],
            },
          ];
        }
      }
      setStudents(arr);
    });
    setLoading(false);
    return () => unsub();
  }, [classId, userYear, user, userRoles]);

  // For teachers/admins: ensure they are in the students list for selected year
  // Always ensure the current user is in the students list for this class/year
  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "classAttendance", `${classId}-year${userYear}`);
    const addSelf = async () => {
      const snap = await getDoc(ref);
      let studentsArr = snap.exists() ? snap.data().students || [] : [];
      const roles = Array.isArray(userRoles) ? userRoles : [];
      const userInfo = {
        uid: user.uid,
        displayName: user.displayName || user.email || "Unknown",
        house: user.house || user.race || "?",
        year: userYear,
        attendedAt: 0, // Not used for removal, but keep structure
        roles: roles,
      };
      if (!studentsArr.some((s) => s.uid === user.uid)) {
        await updateDoc(ref, {
          students: [...studentsArr, { ...userInfo, attendedAt: Date.now() }],
        }).catch(async () => {
          // If doc doesn't exist, create it
          await setDoc(
            ref,
            { students: [{ ...userInfo, attendedAt: Date.now() }] },
            { merge: true }
          );
        });
      }
    };
    addSelf();
  }, [user, classId, userYear, userRoles]);

  // Listen for chat messages
  useEffect(() => {
    const ref = doc(db, "classChats", `${classId}-year${userYear}`);
    const unsub = onSnapshot(ref, (snap) => {
      setMessages(snap.exists() ? snap.data().messages || [] : []);
      setTimeout(() => {
        if (chatRef.current)
          chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }, 100);
    });
    return () => unsub();
  }, [classId, userYear]);

  // Send message
  async function handleSend(e) {
    e.preventDefault();
    if (!message.trim()) return;
    const ref = doc(db, "classChats", `${classId}-year${userYear}`);
    const newMsg = {
      uid: user.uid,
      displayName: user.displayName || user.email || "Unknown",
      roles: userRoles,
      text: message,
      sentAt: Date.now(),
    };
    if (messages.length === 0) {
      // Create doc if it doesn't exist
      await setDoc(ref, { messages: [newMsg] }, { merge: true });
    } else {
      await updateDoc(ref, { messages: [...messages, newMsg] });
    }
    setMessage("");
  }

  // Delete message (only for teachers/admins or sender)
  async function handleDeleteMessage(idx) {
    const ref = doc(db, "classChats", `${classId}-year${userYear}`);
    const msgToDelete = messages[idx];
    // Only allow if user is admin/teacher or sender
    const canDelete =
      userRoles.includes("admin") ||
      userRoles.includes("teacher") ||
      msgToDelete.uid === user.uid;
    if (!canDelete) return;
    const newMessages = messages.filter((_, i) => i !== idx);
    await updateDoc(ref, { messages: newMessages });
  }

  // Leave class (remove from attendance)
  async function handleLeave() {
    console.log("Leave clicked");
    try {
      if (!user) {
        console.log("No user");
        return;
      }
      const ref = doc(db, "classAttendance", `${classId}-year${userYear}`);
      // Fetch current students array using correct Firestore API
      const snap = await getDoc(ref);
      let studentsArr = [];
      if (snap.exists()) {
        studentsArr = snap.data().students || [];
      }
      // Remove user by uid
      const newStudents = studentsArr.filter((s) => s.uid !== user.uid);
      await updateDoc(ref, { students: newStudents });
      console.log("Left class, navigating");
      navigate("/ClassRooms");
    } catch (err) {
      console.error("Error leaving class:", err);
    }
  }

  if (!classInfo) return <div>Class not found.</div>;

  return (
    <div
      style={{
        maxWidth: 700,
        margin: "2rem auto",
        background: "#23232b",
        color: "#fff",
        padding: 24,
        borderRadius: 12,
      }}
    >
      <h2>
        {classInfo.name} (Year {userYear})
      </h2>
      {isTeacher && (
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="year-select">
            <b>Select year: </b>
          </label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={{ marginLeft: 8, padding: 4, borderRadius: 4 }}
          >
            {[1, 2, 3, 4, 5, 6, 7].map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>
        </div>
      )}
      <p style={{ color: "#b3b3b3" }}>{classInfo.description}</p>
      {/* Potion Crafting Section - Only show in Potions class */}
      {classId === "potions" && user && <PotionCrafting user={user} />}
      {/* Leave class button removed as requested */}
      {/* Teachers/Admins in this session */}
      {/* All users in this session */}

      <div style={{ marginBottom: 16 }}>
        <b>Class Chat</b>
        <div
          ref={chatRef}
          style={{
            background: "#222",
            minHeight: 120,
            maxHeight: 300,
            overflowY: "auto",
            borderRadius: 6,
            padding: 8,
            marginBottom: 8,
          }}
        >
          {messages.length === 0 && (
            <div style={{ color: "#888" }}>No messages yet.</div>
          )}
          {messages.map((m, i) => {
            const isAdmin = m.roles?.includes("admin");
            const isTeacher = m.roles?.includes("teacher");
            const canDelete =
              userRoles.includes("admin") ||
              userRoles.includes("teacher") ||
              m.uid === user?.uid;
            return (
              <div
                key={i}
                style={{
                  marginBottom: 4,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    color: isAdmin
                      ? "#ffb347"
                      : isTeacher
                      ? "#4fc3f7"
                      : "#a084e8",
                    fontWeight: isAdmin || isTeacher ? "bold" : "normal",
                  }}
                >
                  {m.displayName}
                  {m.roles && m.roles.length > 0 && (
                    <span
                      style={{ fontSize: 12, color: "#aaa", marginLeft: 4 }}
                    >
                      ({m.roles.join(", ")})
                    </span>
                  )}
                  :
                </span>
                <span style={{ marginLeft: 4, flex: 1 }}>{m.text}</span>
                {canDelete && (
                  <button
                    onClick={() => handleDeleteMessage(i)}
                    style={{
                      marginLeft: 8,
                      background: "#ff6b6b",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      padding: "2px 8px",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <form onSubmit={handleSend} style={{ display: "flex", gap: 8 }}>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{ flex: 1, borderRadius: 4, border: "none", padding: 6 }}
            placeholder="Type your message..."
            maxLength={300}
          />
          <button
            type="submit"
            style={{
              background: "#4fc3f7",
              color: "#23232b",
              border: "none",
              borderRadius: 4,
              padding: "6px 16px",
            }}
          >
            Send
          </button>
        </form>
      </div>
      <div
        style={{
          background: "#232340",
          borderRadius: 6,
          padding: 12,
          marginTop: 24,
        }}
      >
        <b>About this class:</b>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>
            Points for attending: <b>{classInfo.points}</b>
          </li>
          <li>Class for all races and backgrounds</li>
          <li>Roleplay, ask questions, or just hang out!</li>
        </ul>
      </div>
    </div>
  );
}
