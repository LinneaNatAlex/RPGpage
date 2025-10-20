import { useState, useEffect, useRef } from "react";
import { db } from "../../firebaseConfig";
import { doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp, collection, addDoc, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { useAuth } from "../../context/authContext";
import useUserRoles from "../../hooks/useUserRoles";
// getUserYear function will be defined locally
import { getRPGCalendar } from "../../utils/rpgCalendar";

// Helper: get year from user object (default 1)
function getUserYear(user) {
  return user?.year || 1;
}
import PotionList from "../PotionList/PotionList";
import PotionCrafting from "../PotionCrafting/PotionCrafting";
import QuizCreation from "./QuizCreation";
import QuizTaking from "./QuizTaking";
import QuizEditing from "./QuizEditing";
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

import { useParams, useNavigate } from "react-router-dom";
import { classesList } from "../../data/classesList";
import onlineUserStyles from "../OnlineUsers/OnlineUsers.module.css";
import useUsers from "../../hooks/useUser";
import useUserData from "../../hooks/useUserData";

const ClassroomSession = () => {
  const { user } = useAuth();
  const { roles } = useUserRoles();
  const { classId } = useParams();
  const navigate = useNavigate();
  const { users: allUsers = [] } = useUsers();
  const { wisdomUntil } = useUserData();
  const [students, setStudents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingDescription, setEditingDescription] = useState(false);
  const [customDescription, setCustomDescription] = useState("");
  const [editingClassInfo, setEditingClassInfo] = useState(false);
  const [customClassInfo, setCustomClassInfo] = useState({
    points: 10,
    requirements: "Class for all races and backgrounds",
    activities: "Roleplay, ask questions, or just hang out!",
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showQuizCreation, setShowQuizCreation] = useState(false);
  const [showQuizTaking, setShowQuizTaking] = useState(false);
  const [showQuizEditing, setShowQuizEditing] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [availableQuizzes, setAvailableQuizzes] = useState([]);
  const [takenQuizzes, setTakenQuizzes] = useState([]);
  const chatRef = useRef(null);

  // For teachers/admins: allow year selection
  const isTeacher =
    roles.includes("teacher") || roles.includes("admin");
  const [selectedYear, setSelectedYear] = useState(user?.year || 1);
  const userYear = isTeacher ? selectedYear : user?.year || 1;
  
  // Filter online users for this class/year
  const attendingUsers = allUsers.filter(
    (u) => u.online && (u.year === userYear || u.year === Number(userYear))
  );
  const classInfo = classesList.find((c) => c.id === classId);

  // Load custom class description and info if it exists
  useEffect(() => {
    const loadClassData = async () => {
      try {
        const ref = doc(db, "classDescriptions", classId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          if (data.description) {
            setCustomDescription(data.description);
          } else {
            setCustomDescription(classInfo?.description || "");
          }
          if (data.classInfo) {
            setCustomClassInfo(data.classInfo);
          } else {
            setCustomClassInfo({
              points: 2, // Base points for all classes
              requirements: "Class for all races and backgrounds",
              activities: "Roleplay, ask questions, or just hang out!",
            });
          }
          // Load available quizzes
          if (data.quizzes) {
            // Load full quiz data from quizzes collection
            const fullQuizzes = [];
            for (const quizInfo of data.quizzes) {
              try {
                const quizRef = doc(db, "quizzes", quizInfo.quizId);
                const quizSnap = await getDoc(quizRef);
                if (quizSnap.exists()) {
                  const quizData = quizSnap.data();
                  fullQuizzes.push({
                    ...quizInfo,
                    ...quizData
                  });
                }
              } catch (error) {
                console.error("Error loading quiz:", quizInfo.quizId, error);
              }
            }
            setAvailableQuizzes(fullQuizzes);
          } else {
            setAvailableQuizzes([]);
          }
        } else {
          setCustomDescription(classInfo?.description || "");
          setCustomClassInfo({
            points: 2, // Base points for all classes
            requirements: "Class for all races and backgrounds",
            activities: "Roleplay, ask questions, or just hang out!",
          });
        }
      } catch (error) {
        console.error("Error loading class data:", error);
        setCustomDescription(classInfo?.description || "");
        setCustomClassInfo({
          points: classInfo?.points || 10,
          requirements: "Class for all races and backgrounds",
          activities: "Roleplay, ask questions, or just hang out!",
        });
      }
    };
    if (classId && classInfo) {
      loadClassData();
    }
  }, [classId, classInfo]);

  // Load taken quizzes for user
  useEffect(() => {
    const loadTakenQuizzes = async () => {
      if (!user) return;
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setTakenQuizzes(userData.takenQuizzes || []);
        }
      } catch (error) {
        console.error("Error loading taken quizzes:", error);
      }
    };

    loadTakenQuizzes();
  }, [user]);

  // Save custom class description
  const saveClassDescription = async () => {
    setSuccessMessage("");
    setErrorMessage("");

    try {
      // Check if user is authenticated
      if (!user) {
        setErrorMessage("You must be logged in to save description");
        return;
      }

      // Check if user has permission
      const hasPermission =
        roles.includes("teacher") ||
        roles.includes("admin") ||
        roles.includes("headmaster");

      if (!hasPermission) {
        setErrorMessage(
          `You don't have permission to edit class description. Your roles: ${roles.join(
            ", "
          )}`
        );
        return;
      }

      const ref = doc(db, "classDescriptions", classId);
      await setDoc(ref, { description: customDescription }, { merge: true });

      setEditingDescription(false);
      setSuccessMessage("Class description saved successfully!");

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      console.error("Detailed error saving class description:", error);

      if (error.code === "permission-denied") {
        setErrorMessage(
          `Permission denied: Make sure you have teacher/admin role and Firebase rules are updated. Your roles: ${roles.join(
            ", "
          )}`
        );
      } else if (error.code === "unauthenticated") {
        setErrorMessage("Authentication error: Please log out and log back in");
      } else {
        setErrorMessage(`Failed to save description: ${error.message}`);
      }
    }
  };

  // Save custom class info
  const saveClassInfo = async () => {
    setSuccessMessage("");
    setErrorMessage("");

    try {
      // Check if user is authenticated
      if (!user) {
        setErrorMessage("You must be logged in to save class info");
        return;
      }

      // Check if user has permission - more lenient check
      const hasPermission =
        roles.includes("teacher") ||
        roles.includes("admin") ||
        roles.includes("headmaster");

      if (!hasPermission) {
        setErrorMessage(
          `You don't have permission to edit class info. Your roles: ${roles.join(
            ", "
          )}`
        );
        return;
      }

      const ref = doc(db, "classDescriptions", classId);
      await setDoc(ref, { classInfo: customClassInfo }, { merge: true });

      setEditingClassInfo(false);
      setSuccessMessage("Class info saved successfully!");

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      console.error("Error saving class info:", error);

      // Check for specific Firebase errors
      if (error.code === "permission-denied") {
        setErrorMessage(
          `Permission denied: Make sure you have teacher/admin role and Firebase rules are updated. Your roles: ${roles.join(
            ", "
          )}`
        );
      } else if (error.code === "unauthenticated") {
        setErrorMessage("Authentication error: Please log out and log back in");
      } else {
        setErrorMessage(`Failed to save class info: ${error.message}`);
      }
    }
  };

  // Quiz functions
  const hasTakenQuizForGrade = (gradeLevel) => {
    const rpgCalendar = getRPGCalendar();
    const currentMonth = `${rpgCalendar.rpgYear}-${rpgCalendar.rpgMonth.toString().padStart(2, '0')}`;
    return takenQuizzes.some(quiz => 
      quiz.gradeLevel === gradeLevel && 
      quiz.month === currentMonth &&
      quiz.classId === classId
    );
  };

  const handleQuizCreationComplete = async () => {
    setShowQuizCreation(false);
    // Reload class data to get updated quizzes
    try {
      const ref = doc(db, "classDescriptions", classId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        if (data.quizzes) {
          // Load full quiz data from quizzes collection
          const fullQuizzes = [];
          for (const quizInfo of data.quizzes) {
            try {
              const quizRef = doc(db, "quizzes", quizInfo.quizId);
              const quizSnap = await getDoc(quizRef);
              if (quizSnap.exists()) {
                const quizData = quizSnap.data();
                fullQuizzes.push({
                  ...quizInfo,
                  ...quizData
                });
              }
            } catch (error) {
              console.error("Error loading quiz:", quizInfo.quizId, error);
            }
          }
          setAvailableQuizzes(fullQuizzes);
        }
      }
    } catch (error) {
      console.error("Error reloading class data:", error);
    }
  };

  const handleStartQuiz = (quiz) => {
    setSelectedQuiz(quiz);
    setShowQuizTaking(true);
  };

  const handleQuizComplete = () => {
    setShowQuizTaking(false);
    setSelectedQuiz(null);
  };

  const handleEditQuiz = (quiz) => {
    setSelectedQuiz(quiz);
    setShowQuizEditing(true);
  };

  const handleQuizEditingComplete = async () => {
    setShowQuizEditing(false);
    setSelectedQuiz(null);
    // Reload class data to get updated quizzes
    try {
      const ref = doc(db, "classDescriptions", classId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        if (data.quizzes) {
          // Load full quiz data from quizzes collection
          const fullQuizzes = [];
          for (const quizInfo of data.quizzes) {
            try {
              const quizRef = doc(db, "quizzes", quizInfo.quizId);
              const quizSnap = await getDoc(quizRef);
              if (quizSnap.exists()) {
                const quizData = quizSnap.data();
                fullQuizzes.push({
                  ...quizInfo,
                  ...quizData
                });
              }
            } catch (error) {
              console.error("Error loading quiz:", quizInfo.quizId, error);
            }
          }
          setAvailableQuizzes(fullQuizzes);
        }
      }
    } catch (error) {
      console.error("Error reloading class data:", error);
    }
  };

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
              roles: Array.isArray(roles) ? roles : [],
            },
          ];
        }
      }
      setStudents(arr);
    });
    setLoading(false);
    return () => unsub();
  }, [classId, userYear, user, roles]);

  // For teachers/admins: ensure they are in the students list for selected year
  // Always ensure the current user is in the students list for this class/year
  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "classAttendance", `${classId}-year${userYear}`);
    const addSelf = async () => {
      const snap = await getDoc(ref);
      let studentsArr = snap.exists() ? snap.data().students || [] : [];
      const userRoles = Array.isArray(roles) ? roles : [];
      const userInfo = {
        uid: user.uid,
        displayName: user.displayName || user.email || "Unknown",
        house: user.house || user.race || "?",
        year: userYear,
        attendedAt: 0, // Not used for removal, but keep structure
        roles: userRoles,
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
  }, [user, classId, userYear, roles]);

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
      roles: roles,
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

  // Delete message (only for teachers/admins)
  async function handleDeleteMessage(idx) {
    const ref = doc(db, "classChats", `${classId}-year${userYear}`);
    const msgToDelete = messages[idx];
    // Only allow if user is admin/teacher
    const canDelete =
      roles.includes("admin") ||
      roles.includes("teacher");
    if (!canDelete) return;
    const newMessages = messages.filter((_, i) => i !== idx);
    await updateDoc(ref, { messages: newMessages });
  }

  // Leave class (remove from attendance)
  async function handleLeave() {
    try {
      if (!user) {
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
      navigate("/ClassRooms");
    } catch (err) {
      console.error("Error leaving class:", err);
    }
  }

  if (!classInfo) return <div>Class not found.</div>;

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "2rem auto",
        background: "linear-gradient(135deg, #5D4E37 0%, #6B5B47 100%)",
        color: "#F5EFE0",
        padding: 40,
        borderRadius: 20,
        boxShadow:
          "0 12px 48px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.2)",
        border: "3px solid #7B6857",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background:
            "linear-gradient(90deg, #D4C4A8 0%, #7B6857 50%, #D4C4A8 100%)",
          borderRadius: "20px 20px 0 0",
        }}
      />
      <h2
        style={{
          fontFamily: '"Cinzel", serif',
          fontSize: "2.2rem",
          fontWeight: 700,
          letterSpacing: "1.5px",
          textShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
          marginBottom: "1.5rem",
          textAlign: "center",
        }}
      >
        {classInfo.name} (Year {userYear})
      </h2>

      {/* Success and Error Messages */}
      {successMessage && (
        <div
          style={{
            background: "linear-gradient(135deg, #4CAF50 0%, #45a049 100%)",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: "12px",
            marginBottom: "20px",
            textAlign: "center",
            fontSize: "1.1rem",
            fontWeight: "600",
            boxShadow: "0 4px 16px rgba(76, 175, 80, 0.3)",
            border: "2px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          ✅ {successMessage}
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            background: "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: "12px",
            marginBottom: "20px",
            textAlign: "center",
            fontSize: "1.1rem",
            fontWeight: "600",
            boxShadow: "0 4px 16px rgba(244, 67, 54, 0.3)",
            border: "2px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          ❌ {errorMessage}
        </div>
      )}

      {isTeacher && (
        <div
          style={{
            marginBottom: 24,
            background: "rgba(245, 239, 224, 0.1)",
            padding: 16,
            borderRadius: 12,
            border: "2px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <label
            htmlFor="year-select"
            style={{
              color: "#D4C4A8",
              fontSize: "1.1rem",
              fontWeight: 600,
              fontFamily: '"Cinzel", serif',
            }}
          >
            Select year:
          </label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={{
              marginLeft: 12,
              padding: "8px 12px",
              borderRadius: 8,
              background: "#F5EFE0",
              color: "#2C2C2C",
              border: "2px solid #D4C4A8",
              fontSize: "1rem",
              fontWeight: 600,
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7].map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Class Description */}
      <div style={{ marginBottom: "2rem" }}>
        {editingDescription ? (
          <div>
            <textarea
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              style={{
                width: "100%",
                minHeight: "120px",
                padding: "16px",
                borderRadius: "12px",
                border: "2px solid #D4C4A8",
                background: "#F5EFE0",
                color: "#2C2C2C",
                fontSize: "1.1rem",
                fontFamily: '"Segoe UI", "Roboto", sans-serif',
                lineHeight: 1.5,
                resize: "vertical",
                outline: "none",
              }}
              placeholder="Enter class description..."
            />
            <div style={{ marginTop: "12px", display: "flex", gap: "12px" }}>
              <button
                onClick={saveClassDescription}
                style={{
                  background:
                    "linear-gradient(135deg, #4CAF50 0%, #45a049 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 20px",
                  fontSize: "1rem",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditingDescription(false);
                  setCustomDescription(classInfo?.description || "");
                }}
                style={{
                  background:
                    "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 20px",
                  fontSize: "1rem",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p
              style={{
                color: "#D4C4A8",
                fontSize: "1.2rem",
                textAlign: "center",
                fontStyle: "italic",
                marginBottom: isTeacher ? "1rem" : "2rem",
                lineHeight: 1.5,
              }}
            >
              {customDescription ||
                classInfo?.description ||
                "No description available."}
            </p>
            {isTeacher && (
              <div style={{ textAlign: "center" }}>
                <button
                  onClick={() => setEditingDescription(true)}
                  style={{
                    background:
                      "linear-gradient(135deg, #7B6857 0%, #6B5B47 100%)",
                    color: "#F5EFE0",
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    fontWeight: "600",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "none";
                  }}
                >
                  Edit Class Description
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Potion Crafting Section - Only show in Potions class */}
      {classId === "potions" && user && <PotionCrafting />}
      {/* Leave class button removed as requested */}
      {/* Teachers/Admins in this session */}
      {/* All users in this session */}

      <div style={{ marginBottom: 24 }}>
        <h3
          style={{
            color: "#D4C4A8",
            fontSize: "1.5rem",
            fontFamily: '"Cinzel", serif',
            fontWeight: 600,
            textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
            marginBottom: 16,
          }}
        >
          Class Chat
        </h3>
        <div
          ref={chatRef}
          style={{
            background: "rgba(245, 239, 224, 0.1)",
            minHeight: 300,
            maxHeight: 600,
            overflowY: "auto",
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            border: "2px solid rgba(255, 255, 255, 0.2)",
            boxShadow:
              "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
          }}
        >
          {messages.length === 0 && (
            <div
              style={{
                color: "#D4C4A8",
                fontSize: "1.1rem",
                textAlign: "center",
                fontStyle: "italic",
                padding: "20px",
              }}
            >
              No messages yet.
            </div>
          )}
          {messages.map((m, i) => {
            const canDelete =
              roles.includes("admin") ||
              roles.includes("teacher");
            return (
              <div
                key={i}
                style={{
                  marginBottom: 16,
                  padding: "16px 20px",
                  background: "rgba(245, 239, 224, 0.1)",
                  borderRadius: 12,
                  border: "2px solid rgba(255, 255, 255, 0.2)",
                  boxShadow:
                    "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  position: "relative",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <span
                    className={[
                      onlineUserStyles.userName,
                      m.roles?.some((r) => r.toLowerCase() === "headmaster")
                        ? onlineUserStyles.headmasterName
                        : m.roles?.some((r) => r.toLowerCase() === "teacher")
                        ? onlineUserStyles.teacherName
                        : m.roles?.some(
                            (r) => r.toLowerCase() === "shadowpatrol"
                          )
                        ? onlineUserStyles.shadowPatrolName
                        : m.roles?.some((r) => r.toLowerCase() === "admin")
                        ? onlineUserStyles.adminName
                        : m.roles?.some((r) => r.toLowerCase() === "archivist")
                        ? onlineUserStyles.archivistName
                        : "",
                    ].join(" ")}
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {m.displayName}
                    {m.roles && m.roles.length > 0 && (
                      <span
                        style={{
                          fontSize: "0.9rem",
                          color: "#D4C4A8",
                          fontStyle: "italic",
                          fontWeight: 400,
                        }}
                      >
                        ({m.roles.join(", ")})
                      </span>
                    )}
                  </span>
                  {canDelete && (
                    <button
                      onClick={() => handleDeleteMessage(i)}
                      style={{
                        background:
                          "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)",
                        color: "#F5EFE0",
                        border: "2px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: 8,
                        padding: "6px 12px",
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        fontWeight: 600,
                        transition: "all 0.3s ease",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                        textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = "translateY(-2px)";
                        e.target.style.boxShadow =
                          "0 4px 12px rgba(0, 0, 0, 0.3)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow =
                          "0 2px 8px rgba(0, 0, 0, 0.2)";
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
                <div
                  style={{
                    color: "#F5EFE0",
                    fontSize: "1rem",
                    lineHeight: 1.6,
                    wordWrap: "break-word",
                    overflowWrap: "break-word",
                    whiteSpace: "pre-wrap",
                    maxWidth: "100%",
                    padding: "8px 12px",
                    background: "rgba(245, 239, 224, 0.05)",
                    borderRadius: 8,
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  {m.text}
                </div>
              </div>
            );
          })}
        </div>
        <form
          onSubmit={handleSend}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{
              width: "100%",
              borderRadius: 12,
              border: "2px solid #D4C4A8",
              padding: "12px 16px",
              background: "#F5EFE0",
              color: "#2C2C2C",
              fontSize: "1rem",
              fontFamily: '"Segoe UI", "Roboto", "Arial", sans-serif',
              minHeight: "60px",
              maxHeight: "120px",
              resize: "vertical",
              lineHeight: 1.5,
              outline: "none",
              transition: "all 0.3s ease",
            }}
            placeholder="Type your message... (You can write long messages here)"
            maxLength={1000}
            onFocus={(e) => {
              e.target.style.borderColor = "#7B6857";
              e.target.style.boxShadow = "0 0 16px rgba(123, 104, 87, 0.4)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#D4C4A8";
              e.target.style.boxShadow = "none";
            }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              style={{
                background: "linear-gradient(135deg, #7B6857 0%, #8B7A6B 100%)",
                color: "#F5EFE0",
                border: "2px solid rgba(255, 255, 255, 0.2)",
                borderRadius: 12,
                padding: "12px 32px",
                fontWeight: 600,
                fontSize: "1rem",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow:
                  "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                fontFamily: '"Cinzel", serif',
                letterSpacing: "0.5px",
                minWidth: "120px",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow =
                  "0 6px 20px rgba(0, 0, 0, 0.3), inset 0 1px 3px rgba(255, 255, 255, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow =
                  "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)";
              }}
            >
              Send Message
            </button>
          </div>
        </form>
      </div>
      <div
        style={{
          background: "rgba(245, 239, 224, 0.1)",
          borderRadius: 16,
          padding: 20,
          marginTop: 32,
          border: "2px solid rgba(255, 255, 255, 0.2)",
          boxShadow:
            "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
        }}
      >
        <h3
          style={{
            color: "#D4C4A8",
            fontSize: "1.3rem",
            fontFamily: '"Cinzel", serif',
            fontWeight: 600,
            textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
            marginBottom: 16,
          }}
        >
          About this class:
        </h3>

        {editingClassInfo ? (
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  color: "#D4C4A8",
                  marginBottom: "8px",
                  fontWeight: "600",
                }}
              >
                Points for attending:
              </label>
              <input
                type="number"
                value={wisdomUntil && wisdomUntil > Date.now() ? 6 : 2}
                onChange={(e) =>
                  setCustomClassInfo({
                    ...customClassInfo,
                    points: parseInt(e.target.value) || 0,
                  })
                }
                style={{
                  width: "100px",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "2px solid #D4C4A8",
                  background: "#F5EFE0",
                  color: "#2C2C2C",
                  fontSize: "1rem",
                }}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  color: "#D4C4A8",
                  marginBottom: "8px",
                  fontWeight: "600",
                }}
              >
                Class requirements:
              </label>
              <input
                type="text"
                value={customClassInfo.requirements}
                onChange={(e) =>
                  setCustomClassInfo({
                    ...customClassInfo,
                    requirements: e.target.value,
                  })
                }
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "2px solid #D4C4A8",
                  background: "#F5EFE0",
                  color: "#2C2C2C",
                  fontSize: "1rem",
                }}
                placeholder="e.g., Class for all races and backgrounds"
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  color: "#D4C4A8",
                  marginBottom: "8px",
                  fontWeight: "600",
                }}
              >
                Class activities:
              </label>
              <input
                type="text"
                value={customClassInfo.activities}
                onChange={(e) =>
                  setCustomClassInfo({
                    ...customClassInfo,
                    activities: e.target.value,
                  })
                }
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "2px solid #D4C4A8",
                  background: "#F5EFE0",
                  color: "#2C2C2C",
                  fontSize: "1rem",
                }}
                placeholder="e.g., Roleplay, ask questions, or just hang out!"
              />
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={saveClassInfo}
                style={{
                  background:
                    "linear-gradient(135deg, #4CAF50 0%, #45a049 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 20px",
                  fontSize: "1rem",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Save
              </button>
              <button
                onClick={() => setEditingClassInfo(false)}
                style={{
                  background:
                    "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 20px",
                  fontSize: "1rem",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <ul
              style={{
                margin: 0,
                paddingLeft: 20,
                listStyle: "none",
                marginBottom: isTeacher ? "1rem" : "0",
              }}
            >
              <li
                style={{
                  marginBottom: 8,
                  padding: "8px 12px",
                  background: "rgba(245, 239, 224, 0.1)",
                  borderRadius: 8,
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#F5EFE0",
                  fontSize: "1rem",
                }}
              >
                Points for attending:{" "}
                <b style={{ color: "#D4C4A8" }}>
                  {wisdomUntil && wisdomUntil > Date.now() ? "6 (Wisdom Potion active!)" : "2"}
                </b>
              </li>
              <li
                style={{
                  marginBottom: 8,
                  padding: "8px 12px",
                  background: "rgba(245, 239, 224, 0.1)",
                  borderRadius: 8,
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#F5EFE0",
                  fontSize: "1rem",
                }}
              >
                {customClassInfo.requirements}
              </li>
              <li
                style={{
                  marginBottom: 8,
                  padding: "8px 12px",
                  background: "rgba(245, 239, 224, 0.1)",
                  borderRadius: 8,
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#F5EFE0",
                  fontSize: "1rem",
                }}
              >
                {customClassInfo.activities}
              </li>
            </ul>

            {isTeacher && (
              <div style={{ textAlign: "center" }}>
                <button
                  onClick={() => setEditingClassInfo(true)}
                  style={{
                    background:
                      "linear-gradient(135deg, #7B6857 0%, #6B5B47 100%)",
                    color: "#F5EFE0",
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    fontWeight: "600",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "none";
                  }}
                >
                  Edit Class Info
                </button>
              </div>
            )}
          </div>
        )}

        {/* Quiz Section */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h3
              style={{
                color: "#D4C4A8",
                fontSize: "1.5rem",
                fontFamily: '"Cinzel", serif',
                fontWeight: 600,
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                margin: 0,
              }}
            >
              Exams & Quizzes
            </h3>
            {isTeacher && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowQuizCreation(true);
                }}
                style={{
                  background: "linear-gradient(135deg, #4caf50 0%, #45a049 100%)",
                  color: "#fff",
                  border: "2px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  fontWeight: "600",
                  transition: "all 0.3s ease",
                  fontFamily: '"Cinzel", serif',
                  letterSpacing: "0.5px",
                  zIndex: 10,
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "none";
                }}
              >
                Create Quiz
              </button>
            )}
          </div>

          {availableQuizzes.length === 0 ? (
            <div
              style={{
                color: "#D4C4A8",
                fontSize: "1.1rem",
                textAlign: "center",
                fontStyle: "italic",
                padding: "20px",
                background: "rgba(245, 239, 224, 0.1)",
                borderRadius: "12px",
                border: "2px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              {isTeacher ? "No quizzes available. Create one to get started!" : "No quizzes available for this class."}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {availableQuizzes
                .filter(quiz => quiz.gradeLevel === userYear)
                .map((quiz, index) => (
                  <div
                    key={index}
                    style={{
                      background: "rgba(245, 239, 224, 0.1)",
                      borderRadius: "12px",
                      padding: "16px 20px",
                      border: "2px solid rgba(255, 255, 255, 0.2)",
                      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <h4
                        style={{
                          color: "#F5EFE0",
                          fontSize: "1.2rem",
                          fontFamily: '"Cinzel", serif',
                          fontWeight: 600,
                          margin: "0 0 8px 0",
                          textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                        }}
                      >
                        {quiz.title}
                      </h4>
                      <p
                        style={{
                          color: "#D4C4A8",
                          fontSize: "0.9rem",
                          margin: "0 0 4px 0",
                        }}
                      >
                        Grade {quiz.gradeLevel} • Created: {new Date(quiz.createdAt).toLocaleDateString()}
                      </p>
                      <p
                        style={{
                          color: "#D4C4A8",
                          fontSize: "0.85rem",
                          margin: 0,
                          fontStyle: "italic",
                        }}
                      >
                        Pass with E grade or better (5+ correct answers) to advance
                      </p>
                      {hasTakenQuizForGrade(quiz.gradeLevel) && (
                        <div
                          style={{
                            background: "rgba(76, 175, 80, 0.2)",
                            border: "1px solid #4caf50",
                            borderRadius: "6px",
                            padding: "8px 12px",
                            marginTop: "8px",
                            color: "#4caf50",
                            fontSize: "0.9rem",
                            fontWeight: "600",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          ✓ You have taken the exam for this year's class
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <button
                        onClick={() => handleStartQuiz(quiz)}
                        style={{
                          background: "linear-gradient(135deg, #7b6857 0%, #8b7a6b 100%)",
                          color: "#F5EFE0",
                          border: "2px solid rgba(255, 255, 255, 0.2)",
                          borderRadius: "8px",
                          padding: "10px 20px",
                          fontSize: "1rem",
                          cursor: "pointer",
                          fontWeight: "600",
                          transition: "all 0.3s ease",
                          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
                          fontFamily: '"Cinzel", serif',
                          letterSpacing: "0.5px",
                          textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = "translateY(-2px)";
                          e.target.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.3)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = "translateY(0)";
                          e.target.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.2)";
                        }}
                      >
                        Take Exam
                      </button>
                      {isTeacher && (
                        <button
                          onClick={() => handleEditQuiz(quiz)}
                          style={{
                            background: "linear-gradient(135deg, #ff9800 0%, #f57c00 100%)",
                            color: "#fff",
                            border: "2px solid rgba(255, 255, 255, 0.2)",
                            borderRadius: "8px",
                            padding: "10px 16px",
                            fontSize: "0.9rem",
                            cursor: "pointer",
                            fontWeight: "600",
                            transition: "all 0.3s ease",
                            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
                            fontFamily: '"Cinzel", serif',
                            letterSpacing: "0.5px",
                            textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = "translateY(-2px)";
                            e.target.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.3)";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = "translateY(0)";
                            e.target.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.2)";
                          }}
                        >
                          Edit Quiz
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              
              {availableQuizzes.filter(quiz => quiz.gradeLevel === userYear).length === 0 && availableQuizzes.length > 0 && (
                <div
                  style={{
                    color: "#D4C4A8",
                    fontSize: "1.1rem",
                    textAlign: "center",
                    fontStyle: "italic",
                    padding: "20px",
                    background: "rgba(245, 239, 224, 0.1)",
                    borderRadius: "12px",
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                  }}
                >
                  No quizzes available for Grade {userYear}. Check other grade levels or ask your teacher to create one.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quiz Creation Modal */}
        {showQuizCreation && (
          <QuizCreation
            classId={classId}
            onClose={() => setShowQuizCreation(false)}
            onComplete={handleQuizCreationComplete}
          />
        )}

        {/* Quiz Taking Modal */}
        {showQuizTaking && selectedQuiz && (
          <QuizTaking
            quizId={selectedQuiz.quizId}
            classId={classId}
            gradeLevel={selectedQuiz.gradeLevel}
            onClose={() => setShowQuizTaking(false)}
            onComplete={handleQuizComplete}
          />
        )}

        {/* Quiz Editing Modal */}
        {showQuizEditing && selectedQuiz && (
          <QuizEditing
            classId={classId}
            quiz={selectedQuiz}
            onClose={() => setShowQuizEditing(false)}
            onComplete={handleQuizEditingComplete}
          />
        )}
      </div>
    </div>
  );
}

export default ClassroomSession;
