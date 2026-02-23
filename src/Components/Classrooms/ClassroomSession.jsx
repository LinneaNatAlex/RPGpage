import { useState, useEffect, useRef } from "react";
import { db } from "../../firebaseConfig";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { useAuth } from "../../context/authContext";
import useUserRoles from "../../hooks/useUserRoles";
// getUserYear function will be defined locally
import { getRPGCalendar, isExamPeriod } from "../../utils/rpgCalendar";

// Helper: get year from user object (default 1)
function getUserYear(user) {
  if (
    user?.graduate ||
    (user?.class && /^graduated?$/i.test(String(user.class)))
  ) {
    return "graduate";
  }
  // Extract year from class field (e.g., "2nd year" -> 2)
  if (user?.class) {
    const match = user.class.match(/(\d+)/);
    return match ? parseInt(match[1]) : 1;
  }
  return user?.year || 1;
}
import PotionList from "../PotionList/PotionList";
import PotionCrafting from "../PotionCrafting/PotionCrafting";
import QuizCreation from "./QuizCreation";
import QuizTaking from "./QuizTaking";
import QuizEditing from "./QuizEditing";
import styles from "./ClassroomSession.module.css";
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
import useAllUsers from "../../hooks/useAllUsers";
import useUserData from "../../hooks/useUserData";

const ClassroomSession = () => {
  const { user } = useAuth();
  const { roles } = useUserRoles();
  const { classId } = useParams();
  const navigate = useNavigate();
  const { users: allUsers = [] } = useUsers();
  const { users: allUsersList = [] } = useAllUsers();
  const { wisdomUntil } = useUserData();
  // Users who can be assigned as professor for this class (professor, teacher, admin, headmaster)
  const teachersList = (allUsersList || []).filter((u) =>
    (u.roles || []).some((r) =>
      ["professor", "teacher", "admin", "headmaster"].includes(
        (r || "").toLowerCase(),
      ),
    ),
  );
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
    teacherIds: [],
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showQuizCreation, setShowQuizCreation] = useState(false);
  const [showQuizTaking, setShowQuizTaking] = useState(false);
  const [showQuizEditing, setShowQuizEditing] = useState(false);
  const [showAllExamsView, setShowAllExamsView] = useState(false);
  const [allExamsList, setAllExamsList] = useState([]);
  const [loadingAllExams, setLoadingAllExams] = useState(false);
  const [selectedExamDetails, setSelectedExamDetails] = useState(null);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [loadingExamDetails, setLoadingExamDetails] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [availableQuizzes, setAvailableQuizzes] = useState([]);
  const [takenQuizzes, setTakenQuizzes] = useState([]);
  const chatRef = useRef(null);

  // For teachers/admins: allow year selection
  const isTeacher =
    roles.includes("professor") ||
    roles.includes("teacher") ||
    roles.includes("admin");
  const [selectedYear, setSelectedYear] = useState(getUserYear(user));

  // Allow year selection for teachers OR users who are above year 1
  const userCurrentYear = getUserYear(user);
  const canSelectYear = isTeacher || userCurrentYear > 1;
  const userYear = canSelectYear ? selectedYear : userCurrentYear;

  // Filter online users for this class/year
  const attendingUsers = allUsers.filter(
    (u) => u.online && (u.year === userYear || u.year === Number(userYear)),
  );
  const classInfo = classesList.find((c) => c.id === classId);

  // Check if user meets minimum year requirement for this class
  useEffect(() => {
    if (!classInfo || !user) return;
    if (classInfo.minYear && userCurrentYear !== "graduate") {
      const yearNum =
        typeof userCurrentYear === "number"
          ? userCurrentYear
          : parseInt(userCurrentYear) || 1;
      if (yearNum < classInfo.minYear) {
        setErrorMessage(
          `This class is only available from year ${classInfo.minYear} onwards.`,
        );
        setTimeout(() => {
          navigate("/classrooms");
        }, 2000);
      }
    }
  }, [classInfo, userCurrentYear, user, navigate]);

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
            setCustomClassInfo({
              points: data.classInfo.points ?? 2,
              requirements:
                data.classInfo.requirements ??
                "Class for all races and backgrounds",
              activities:
                data.classInfo.activities ??
                "Roleplay, ask questions, or just hang out!",
              teacherIds: Array.isArray(data.classInfo.teacherIds)
                ? data.classInfo.teacherIds
                : [],
            });
          } else {
            setCustomClassInfo({
              points: 2,
              requirements: "Class for all races and backgrounds",
              activities: "Roleplay, ask questions, or just hang out!",
              teacherIds: [],
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
                    ...quizData,
                  });
                }
              } catch (error) {}
            }
            setAvailableQuizzes(fullQuizzes);
          } else {
            setAvailableQuizzes([]);
          }
        } else {
          setCustomDescription(classInfo?.description || "");
          setCustomClassInfo({
            points: 2,
            requirements: "Class for all races and backgrounds",
            activities: "Roleplay, ask questions, or just hang out!",
            teacherIds: [],
          });
        }
      } catch (error) {
        setCustomDescription(classInfo?.description || "");
        setCustomClassInfo({
          points: classInfo?.points || 10,
          requirements: "Class for all races and backgrounds",
          activities: "Roleplay, ask questions, or just hang out!",
          teacherIds: [],
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
      } catch (error) {}
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
        roles.includes("professor") ||
        roles.includes("teacher") ||
        roles.includes("admin") ||
        roles.includes("headmaster");

      if (!hasPermission) {
        setErrorMessage(
          `You don't have permission to edit class description. Your roles: ${roles.join(
            ", ",
          )}`,
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
      if (error.code === "permission-denied") {
        setErrorMessage(
          `Permission denied: Make sure you have teacher/admin role and Firebase rules are updated. Your roles: ${roles.join(
            ", ",
          )}`,
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
        roles.includes("professor") ||
        roles.includes("teacher") ||
        roles.includes("admin") ||
        roles.includes("headmaster");

      if (!hasPermission) {
        setErrorMessage(
          `You don't have permission to edit class info. Your roles: ${roles.join(
            ", ",
          )}`,
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
      // Check for specific Firebase errors
      if (error.code === "permission-denied") {
        setErrorMessage(
          `Permission denied: Make sure you have teacher/admin role and Firebase rules are updated. Your roles: ${roles.join(
            ", ",
          )}`,
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
    const currentMonth = `${rpgCalendar.rpgYear}-${rpgCalendar.rpgMonth
      .toString()
      .padStart(2, "0")}`;
    return takenQuizzes.some(
      (quiz) =>
        quiz.gradeLevel === gradeLevel &&
        quiz.month === currentMonth &&
        quiz.classId === classId,
    );
  };

  // Check if user is eligible for graduate exam (7th year, passed all 7 subjects)
  const isEligibleForGraduateExam = () => {
    if (userYear !== 7) return false;
    if (!takenQuizzes || takenQuizzes.length === 0) return false;

    const rpgCalendar = getRPGCalendar();
    const currentMonth = `${rpgCalendar.rpgYear}-${rpgCalendar.rpgMonth
      .toString()
      .padStart(2, "0")}`;

    // Count passed subjects (grade E and above) for current month
    const passedSubjects = takenQuizzes.filter(
      (quiz) =>
        quiz.month === currentMonth &&
        quiz.gradeLevel === 7 &&
        quiz.grade &&
        ["A", "B", "C", "D", "E"].includes(quiz.grade),
    );

    return passedSubjects.length >= 7; // Need to pass 7 out of 7 subjects
  };

  // Handle graduate exam completion
  const handleGraduateExamComplete = async (result) => {
    if (result.passed) {
      // Mark user as graduate
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        graduate: true,
        class: "Graduated",
        graduateDate: new Date().toISOString(),
        graduateExamResult: result,
      });

      // Clear cache to refresh user data
      const { cacheHelpers } = await import("../../utils/firebaseCache");
      cacheHelpers.clearUserCache(user.uid);

      alert("Congratulations! You have graduated from Vayloria Arcane School!");
    }
  };

  // Fetch all exams (for teachers/admins overview)
  const fetchAllExams = async () => {
    setLoadingAllExams(true);
    try {
      const snap = await getDocs(collection(db, "quizzes"));
      const list = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          classId: data.classId || "",
          title: data.title || "Untitled",
          gradeLevel: data.gradeLevel ?? 0,
          createdAt: data.createdAt || null,
          createdByName: data.createdByName || "",
          isActive: data.isActive !== false,
        };
      });
      list.sort(
        (a, b) => (b.createdAt || "").localeCompare(a.createdAt || "") || 0,
      );
      setAllExamsList(list);
    } catch (err) {
      setAllExamsList([]);
    } finally {
      setLoadingAllExams(false);
    }
  };

  // Fetch full exam details (questions, answers, etc.)
  const fetchExamDetails = async (examId) => {
    setSelectedExamId(examId);
    setLoadingExamDetails(true);
    setSelectedExamDetails(null);
    try {
      const quizRef = doc(db, "quizzes", examId);
      const quizSnap = await getDoc(quizRef);
      if (quizSnap.exists()) {
        setSelectedExamDetails(quizSnap.data());
      }
    } catch (err) {
      console.error("Error loading exam details:", err);
    } finally {
      setLoadingExamDetails(false);
    }
  };

  const openEditExamFromDetails = () => {
    if (!selectedExamDetails || !selectedExamId) return;
    setSelectedQuiz({
      quizId: selectedExamId,
      classId: selectedExamDetails.classId || classId,
      gradeLevel: selectedExamDetails.gradeLevel ?? 1,
      title: selectedExamDetails.title || "",
    });
    setSelectedExamDetails(null);
    setSelectedExamId(null);
    setShowAllExamsView(false);
    setShowQuizEditing(true);
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
                  ...quizData,
                });
              }
            } catch (error) {
              console.error("Error loading quiz:", quizInfo.quizId, error);
            }
          }
          setAvailableQuizzes(fullQuizzes);
        }
      }
    } catch (error) {}
  };

  const handleStartQuiz = (quiz) => {
    setSelectedQuiz(quiz);
    setShowQuizTaking(true);
  };

  const handleQuizComplete = async (result) => {
    setShowQuizTaking(false);
    setSelectedQuiz(null);

    // Check if this was a graduate exam
    if (result && result.gradeLevel === "graduate") {
      await handleGraduateExamComplete(result);
    }
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
                  ...quizData,
                });
              }
            } catch (error) {
              console.error("Error loading quiz:", quizInfo.quizId, error);
            }
          }
          setAvailableQuizzes(fullQuizzes);
        }
      }
    } catch (error) {}
  };

  // Load students list once (no snapshot – list updates after reload)
  useEffect(() => {
    const ref = doc(db, "classAttendance", `${classId}-year${userYear}`);
    getDoc(ref).then((snap) => {
      let arr = snap.exists() ? snap.data().students || [] : [];
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
      setLoading(false);
    });
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
            { merge: true },
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
      roles.includes("professor") ||
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
    } catch (err) {}
  }

  if (!classInfo) return <div>Class not found.</div>;

  return (
    <div
      style={{
        maxWidth: window.innerWidth <= 768 ? "95%" : 900,
        margin: window.innerWidth <= 768 ? "1rem auto" : "2rem auto",
        background: "linear-gradient(135deg, #5D4E37 0%, #6B5B47 100%)",
        color: "#F5EFE0",
        padding: window.innerWidth <= 768 ? 20 : 40,
        borderRadius: 0,
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
          borderRadius: 0,
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
        {classInfo.name} (
        {userYear === "graduate" ? "Graduated" : `Year ${userYear}`})
      </h2>

      {/* Success and Error Messages */}
      {successMessage && (
        <div
          style={{
            background: "linear-gradient(135deg, #4CAF50 0%, #45a049 100%)",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: 0,
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
            borderRadius: 0,
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

      {canSelectYear && (
        <div
          style={{
            marginBottom: 24,
            background: "rgba(245, 239, 224, 0.1)",
            padding: 16,
            borderRadius: 0,
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
              borderRadius: 0,
              background: "#F5EFE0",
              color: "#2C2C2C",
              border: "2px solid #D4C4A8",
              fontSize: "1rem",
              fontWeight: 600,
            }}
          >
            {(() => {
              const availableYears = isTeacher
                ? [1, 2, 3, 4, 5, 6, 7] // Teachers can see all years
                : Array.from({ length: userCurrentYear }, (_, i) => i + 1); // Users can only see years they've achieved

              return availableYears.map((y) => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ));
            })()}
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
                borderRadius: 0,
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
                  borderRadius: 0,
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
                  borderRadius: 0,
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
                    borderRadius: 0,
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
      {classId === "potions" && user && <PotionCrafting userYear={userYear} />}
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
          className="classroom-messages-container"
          style={{
            background: "rgba(245, 239, 224, 0.1)",
            minHeight: 300,
            maxHeight: 600,
            overflowY: "auto",
            overflowX: "hidden",
            borderRadius: 0,
            padding: window.innerWidth <= 768 ? 12 : 16,
            marginBottom: 16,
            border: "2px solid rgba(255, 255, 255, 0.2)",
            boxShadow:
              "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
            width: "100%",
            boxSizing: "border-box",
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
              roles.includes("professor") ||
              roles.includes("teacher");
            return (
              <div
                key={i}
                style={{
                  marginBottom: 16,
                  padding: "16px 20px",
                  background: "rgba(245, 239, 224, 0.1)",
                  borderRadius: 0,
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
                        : m.roles?.some(
                              (r) =>
                                (r || "").toLowerCase() === "professor" ||
                                (r || "").toLowerCase() === "teacher",
                            )
                          ? onlineUserStyles.professorName
                          : m.roles?.some(
                                (r) => r.toLowerCase() === "shadowpatrol",
                              )
                            ? onlineUserStyles.shadowPatrolName
                            : m.roles?.some((r) => r.toLowerCase() === "admin")
                              ? onlineUserStyles.adminName
                              : m.roles?.some(
                                    (r) => r.toLowerCase() === "archivist",
                                  )
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
                        borderRadius: 0,
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
                    borderRadius: 0,
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
            className="classroom-textarea"
            style={{
              width: "100%",
              boxSizing: "border-box",
              borderRadius: 0,
              border: "2px solid #D4C4A8",
              padding: window.innerWidth <= 768 ? "14px 18px" : "12px 16px",
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
                borderRadius: 0,
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
          borderRadius: 0,
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
                id="classroom-custom-points"
                name="customClassPoints"
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
                  borderRadius: 0,
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
                id="classroom-custom-requirements"
                name="customClassRequirements"
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
                  borderRadius: 0,
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
                id="classroom-custom-activities"
                name="customClassActivities"
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
                  borderRadius: 0,
                  border: "2px solid #D4C4A8",
                  background: "#F5EFE0",
                  color: "#2C2C2C",
                  fontSize: "1rem",
                }}
                placeholder="e.g., Roleplay, ask questions, or just hang out!"
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
                Teacher(s):
              </label>
              <select
                id="classroom-teachers"
                multiple
                size={Math.min(6, Math.max(3, teachersList.length + 1))}
                value={(customClassInfo.teacherIds || []).slice()}
                onChange={(e) => {
                  const selected = Array.from(
                    e.target.selectedOptions,
                    (o) => o.value,
                  );
                  setCustomClassInfo({
                    ...customClassInfo,
                    teacherIds: selected,
                  });
                }}
                style={{
                  width: "100%",
                  maxWidth: "400px",
                  padding: "8px 12px",
                  borderRadius: 0,
                  border: "2px solid #D4C4A8",
                  background: "#F5EFE0",
                  color: "#2C2C2C",
                  fontSize: "1rem",
                }}
              >
                {teachersList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.displayName || t.email || t.id}
                  </option>
                ))}
              </select>
              <p
                style={{
                  color: "#D4C4A8",
                  fontSize: "0.85rem",
                  marginTop: "4px",
                }}
              >
                Hold Ctrl (Windows) or Cmd (Mac) to select multiple teachers.
              </p>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={saveClassInfo}
                style={{
                  background:
                    "linear-gradient(135deg, #4CAF50 0%, #45a049 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 0,
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
                  borderRadius: 0,
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
                  borderRadius: 0,
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#F5EFE0",
                  fontSize: "1rem",
                }}
              >
                Points for attending:{" "}
                <b style={{ color: "#D4C4A8" }}>
                  {wisdomUntil && wisdomUntil > Date.now()
                    ? "6 (Wisdom Potion active!)"
                    : "2"}
                </b>
              </li>
              <li
                style={{
                  marginBottom: 8,
                  padding: "8px 12px",
                  background: "rgba(245, 239, 224, 0.1)",
                  borderRadius: 0,
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
                  borderRadius: 0,
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#F5EFE0",
                  fontSize: "1rem",
                }}
              >
                {customClassInfo.activities}
              </li>
              <li
                style={{
                  marginBottom: 8,
                  padding: "8px 12px",
                  background: "rgba(245, 239, 224, 0.1)",
                  borderRadius: 0,
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#F5EFE0",
                  fontSize: "1rem",
                }}
              >
                Teacher(s):{" "}
                {(customClassInfo.teacherIds || []).length > 0
                  ? (customClassInfo.teacherIds || [])
                      .map(
                        (id) =>
                          allUsersList.find((u) => u.id === id)?.displayName ||
                          allUsersList.find((u) => u.uid === id)?.displayName ||
                          id,
                      )
                      .filter(Boolean)
                      .join(", ")
                  : "—"}
              </li>
            </ul>

            {isTeacher && (
              <div className={styles.editClassInfoWrap}>
                <button
                  onClick={() => setEditingClassInfo(true)}
                  style={{
                    background:
                      "linear-gradient(135deg, #7B6857 0%, #6B5B47 100%)",
                    color: "#F5EFE0",
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: 0,
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
          <div className={styles.quizSectionHeader}>
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
              <div className={styles.quizSectionButtons}>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowAllExamsView(true);
                    fetchAllExams();
                  }}
                  style={{
                    background:
                      "linear-gradient(135deg, #7B6857 0%, #6B5B47 100%)",
                    color: "#F5EFE0",
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: 0,
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
                  View all exams
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowQuizCreation(true);
                  }}
                  style={{
                    background:
                      "linear-gradient(135deg, #4caf50 0%, #45a049 100%)",
                    color: "#fff",
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: 0,
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
              </div>
            )}
          </div>

          {/* Modal: All exams (teachers/admins) */}
          {isTeacher && showAllExamsView && (
            <div
              onClick={() => setShowAllExamsView(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
                padding: 16,
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  background:
                    "linear-gradient(180deg, #2C2C2C 0%, #1a1a1a 100%)",
                  border: "2px solid #D4C4A8",
                  borderRadius: 0,
                  maxWidth: "90vw",
                  width: 700,
                  maxHeight: "85vh",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                }}
              >
                <div
                  style={{
                    padding: "16px 20px",
                    borderBottom: "2px solid #D4C4A8",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h3
                    style={{
                      color: "#F5EFE0",
                      fontSize: "1.25rem",
                      fontFamily: '"Cinzel", serif',
                      margin: 0,
                    }}
                  >
                    All exams
                  </h3>
                  <button
                    onClick={() => setShowAllExamsView(false)}
                    style={{
                      background: "transparent",
                      color: "#F5EFE0",
                      border: "2px solid #D4C4A8",
                      borderRadius: 0,
                      padding: "6px 14px",
                      fontSize: "1rem",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    × Close
                  </button>
                </div>
                <div style={{ padding: 16, overflowY: "auto", flex: 1 }}>
                  {loadingAllExams ? (
                    <p style={{ color: "#F5EFE0", textAlign: "center" }}>
                      Loading…
                    </p>
                  ) : allExamsList.length === 0 ? (
                    <p
                      style={{
                        color: "#F5EFE0",
                        textAlign: "center",
                        fontStyle: "italic",
                      }}
                    >
                      No exams created yet.
                    </p>
                  ) : (
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: "0.95rem",
                      }}
                    >
                      <thead>
                        <tr style={{ borderBottom: "2px solid #E8DCC8" }}>
                          <th
                            style={{
                              textAlign: "left",
                              padding: "10px 8px",
                              color: "#F5EFE0",
                              fontWeight: 600,
                            }}
                          >
                            Class
                          </th>
                          <th
                            style={{
                              textAlign: "left",
                              padding: "10px 8px",
                              color: "#F5EFE0",
                              fontWeight: 600,
                            }}
                          >
                            Title
                          </th>
                          <th
                            style={{
                              textAlign: "left",
                              padding: "10px 8px",
                              color: "#F5EFE0",
                              fontWeight: 600,
                            }}
                          >
                            Grade
                          </th>
                          <th
                            style={{
                              textAlign: "left",
                              padding: "10px 8px",
                              color: "#F5EFE0",
                              fontWeight: 600,
                            }}
                          >
                            Created
                          </th>
                          <th
                            style={{
                              textAlign: "left",
                              padding: "10px 8px",
                              color: "#F5EFE0",
                              fontWeight: 600,
                            }}
                          >
                            Created by
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {allExamsList.map((exam) => (
                          <tr
                            key={exam.id}
                            onClick={() => fetchExamDetails(exam.id)}
                            style={{
                              borderBottom:
                                "1px solid rgba(232, 220, 200, 0.4)",
                              cursor: "pointer",
                              transition: "background 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background =
                                "rgba(212, 196, 168, 0.15)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                            }}
                          >
                            <td
                              style={{ padding: "10px 8px", color: "#F5EFE0" }}
                            >
                              {exam.classId || "—"}
                            </td>
                            <td
                              style={{ padding: "10px 8px", color: "#F5EFE0" }}
                            >
                              {exam.title}
                            </td>
                            <td
                              style={{ padding: "10px 8px", color: "#F5EFE0" }}
                            >
                              {exam.gradeLevel}
                            </td>
                            <td
                              style={{ padding: "10px 8px", color: "#F5EFE0" }}
                            >
                              {exam.createdAt
                                ? new Date(exam.createdAt).toLocaleDateString(
                                    undefined,
                                    {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    },
                                  )
                                : "—"}
                            </td>
                            <td
                              style={{ padding: "10px 8px", color: "#F5EFE0" }}
                            >
                              {exam.createdByName || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Modal: Exam details (questions, answers) */}
          {isTeacher && selectedExamDetails && (
            <div
              onClick={() => setSelectedExamDetails(null)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10000,
                padding: 16,
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  background:
                    "linear-gradient(180deg, #2C2C2C 0%, #1a1a1a 100%)",
                  border: "2px solid #D4C4A8",
                  borderRadius: 0,
                  maxWidth: "90vw",
                  width: 800,
                  maxHeight: "90vh",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                }}
              >
                <div
                  style={{
                    padding: "16px 20px",
                    borderBottom: "2px solid #D4C4A8",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div>
                    <h3
                      style={{
                        color: "#F5EFE0",
                        fontSize: "1.25rem",
                        fontFamily: '"Cinzel", serif',
                        margin: "0 0 4px 0",
                      }}
                    >
                      {selectedExamDetails.title || "Exam Details"}
                    </h3>
                    <p
                      style={{
                        color: "#E8DCC8",
                        fontSize: "0.9rem",
                        margin: 0,
                      }}
                    >
                      {selectedExamDetails.classId} • Grade{" "}
                      {selectedExamDetails.gradeLevel}
                      {selectedExamDetails.description &&
                        ` • ${selectedExamDetails.description}`}
                    </p>
                  </div>
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditExamFromDetails();
                      }}
                      style={{
                        background:
                          "linear-gradient(135deg, #4caf50 0%, #45a049 100%)",
                        color: "#fff",
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderRadius: 0,
                        padding: "8px 16px",
                        fontSize: "0.95rem",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      Edit exam
                    </button>
                    <button
                      onClick={() => setSelectedExamDetails(null)}
                      style={{
                        background: "transparent",
                        color: "#F5EFE0",
                        border: "2px solid #D4C4A8",
                        borderRadius: 0,
                        padding: "6px 14px",
                        fontSize: "1rem",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      × Close
                    </button>
                  </div>
                </div>
                <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>
                  {loadingExamDetails ? (
                    <p style={{ color: "#F5EFE0", textAlign: "center" }}>
                      Loading exam details…
                    </p>
                  ) : selectedExamDetails.questions &&
                    selectedExamDetails.questions.length > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 20,
                      }}
                    >
                      {selectedExamDetails.questions.map((q, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: "rgba(245, 239, 224, 0.08)",
                            border: "1px solid rgba(232, 220, 200, 0.5)",
                            borderRadius: 0,
                            padding: 16,
                          }}
                        >
                          <h4
                            style={{
                              color: "#F5EFE0",
                              fontSize: "1.1rem",
                              fontFamily: '"Cinzel", serif',
                              margin: "0 0 12px 0",
                            }}
                          >
                            Question {idx + 1}: {q.question}
                          </h4>
                          <div style={{ marginLeft: 16 }}>
                            {q.options && q.options.length > 0 ? (
                              <ul
                                style={{
                                  listStyle: "none",
                                  padding: 0,
                                  margin: "8px 0",
                                }}
                              >
                                {q.options.map((opt, optIdx) => (
                                  <li
                                    key={optIdx}
                                    style={{
                                      padding: "6px 0",
                                      color:
                                        optIdx === q.correctAnswer
                                          ? "#6bcf7a"
                                          : "#F5EFE0",
                                      fontWeight:
                                        optIdx === q.correctAnswer ? 600 : 400,
                                    }}
                                  >
                                    {optIdx === q.correctAnswer && "✓ "}
                                    {String.fromCharCode(65 + optIdx)}. {opt}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p
                                style={{
                                  color: "#E8DCC8",
                                  fontStyle: "italic",
                                }}
                              >
                                No options available
                              </p>
                            )}
                            <p
                              style={{
                                color: "#E8DCC8",
                                fontSize: "0.85rem",
                                marginTop: 8,
                                fontStyle: "italic",
                              }}
                            >
                              Correct answer:{" "}
                              {String.fromCharCode(65 + (q.correctAnswer ?? 0))}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p
                      style={{
                        color: "#F5EFE0",
                        textAlign: "center",
                        fontStyle: "italic",
                      }}
                    >
                      No questions found in this exam.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Check if it's exam period */}
          {!isExamPeriod() ? (
            <div
              style={{
                color: "#D4C4A8",
                fontSize: "1.1rem",
                textAlign: "center",
                fontStyle: "italic",
                padding: "20px",
                background: "rgba(245, 239, 224, 0.1)",
                borderRadius: 0,
                border: "2px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              📚 Exams are only available during exam period (July & August).
              <br />
              Current RPG month: {getRPGCalendar().rpgMonth} -{" "}
              {
                [
                  "January",
                  "February",
                  "March",
                  "April",
                  "May",
                  "June",
                  "July",
                  "August",
                  "September",
                  "October",
                  "November",
                  "December",
                ][getRPGCalendar().rpgMonth - 1]
              }
            </div>
          ) : (
            <>
              {availableQuizzes.length === 0 ? (
                <div
                  style={{
                    color: "#D4C4A8",
                    fontSize: "1.1rem",
                    textAlign: "center",
                    fontStyle: "italic",
                    padding: "20px",
                    background: "rgba(245, 239, 224, 0.1)",
                    borderRadius: 0,
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                  }}
                >
                  {isTeacher
                    ? "No quizzes available. Create one to get started!"
                    : "No quizzes available for this class."}
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {availableQuizzes
                    .filter((quiz) => quiz.gradeLevel === userYear)
                    .map((quiz, index) => (
                      <div
                        key={index}
                        style={{
                          background: "rgba(245, 239, 224, 0.1)",
                          borderRadius: 0,
                          padding: "16px 20px",
                          border: "2px solid rgba(255, 255, 255, 0.2)",
                          boxShadow:
                            "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
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
                            Grade {quiz.gradeLevel} • Created:{" "}
                            {new Date(quiz.createdAt).toLocaleDateString()}
                          </p>
                          <p
                            style={{
                              color: "#D4C4A8",
                              fontSize: "0.85rem",
                              margin: 0,
                              fontStyle: "italic",
                            }}
                          >
                            Pass with E grade or better (5+ correct answers) to
                            advance
                          </p>
                          {hasTakenQuizForGrade(quiz.gradeLevel) && (
                            <div
                              style={{
                                background: "rgba(76, 175, 80, 0.2)",
                                border: "1px solid #4caf50",
                                borderRadius: 0,
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
                        <div
                          style={{
                            display: "flex",
                            gap: "12px",
                            alignItems: "center",
                          }}
                        >
                          <button
                            onClick={() => handleStartQuiz(quiz)}
                            style={{
                              background:
                                "linear-gradient(135deg, #7b6857 0%, #8b7a6b 100%)",
                              color: "#F5EFE0",
                              border: "2px solid rgba(255, 255, 255, 0.2)",
                              borderRadius: 0,
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
                              e.target.style.boxShadow =
                                "0 6px 20px rgba(0, 0, 0, 0.3)";
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = "translateY(0)";
                              e.target.style.boxShadow =
                                "0 4px 16px rgba(0, 0, 0, 0.2)";
                            }}
                          >
                            Take Exam
                          </button>
                          {isTeacher && (
                            <button
                              onClick={() => handleEditQuiz(quiz)}
                              style={{
                                background:
                                  "linear-gradient(135deg, #ff9800 0%, #f57c00 100%)",
                                color: "#fff",
                                border: "2px solid rgba(255, 255, 255, 0.2)",
                                borderRadius: 0,
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
                                e.target.style.boxShadow =
                                  "0 6px 20px rgba(0, 0, 0, 0.3)";
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = "translateY(0)";
                                e.target.style.boxShadow =
                                  "0 4px 16px rgba(0, 0, 0, 0.2)";
                              }}
                            >
                              Edit Quiz
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                  {availableQuizzes.filter(
                    (quiz) => quiz.gradeLevel === userYear,
                  ).length === 0 &&
                    availableQuizzes.length > 0 && (
                      <div
                        style={{
                          color: "#D4C4A8",
                          fontSize: "1.1rem",
                          textAlign: "center",
                          fontStyle: "italic",
                          padding: "20px",
                          background: "rgba(245, 239, 224, 0.1)",
                          borderRadius: 0,
                          border: "2px solid rgba(255, 255, 255, 0.2)",
                        }}
                      >
                        No quizzes available for Grade {userYear}. Check other
                        grade levels or ask your teacher to create one.
                      </div>
                    )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Graduate Exam Section - Only for 7th year students */}
        {userYear === 7 && isExamPeriod() && (
          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
                padding: "16px",
                background: "rgba(245, 239, 224, 0.1)",
                borderRadius: 0,
                border: "2px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              <h3
                style={{
                  color: "#D4C4A8",
                  fontSize: "1.3rem",
                  fontWeight: 600,
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                  margin: 0,
                }}
              >
                🎓 Graduate Exam
              </h3>
            </div>

            {isEligibleForGraduateExam() ? (
              <div
                style={{
                  background: "rgba(76, 175, 80, 0.1)",
                  border: "2px solid #4CAF50",
                  borderRadius: 0,
                  padding: "20px",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    color: "#4CAF50",
                    fontSize: "1.1rem",
                    margin: "0 0 16px 0",
                  }}
                >
                  🎉 Congratulations! You have passed all 7 subjects and are
                  eligible for the Graduate Exam!
                </p>
                <button
                  onClick={() => {
                    // Create a special graduate exam quiz
                    const graduateQuiz = {
                      quizId: "graduate-exam",
                      title: "Graduate Exam",
                      gradeLevel: "graduate",
                      description:
                        "Final examination to graduate from Vayloria Arcane School",
                    };
                    setSelectedQuiz(graduateQuiz);
                    setShowQuizTaking(true);
                  }}
                  style={{
                    background:
                      "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
                    color: "#000",
                    border: "2px solid #FFD700",
                    borderRadius: 0,
                    padding: "12px 24px",
                    fontSize: "1rem",
                    cursor: "pointer",
                    fontWeight: "600",
                    transition: "all 0.3s ease",
                    fontFamily: '"Cinzel", serif',
                    letterSpacing: "0.5px",
                    textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                  }}
                >
                  🎓 Take Graduate Exam
                </button>
              </div>
            ) : (
              <div
                style={{
                  background: "rgba(255, 193, 7, 0.1)",
                  border: "2px solid #FFC107",
                  borderRadius: 0,
                  padding: "20px",
                  textAlign: "center",
                }}
              >
                <p style={{ color: "#FFC107", fontSize: "1.1rem", margin: 0 }}>
                  📚 You need to pass all 7 subjects in Year 7 to be eligible
                  for the Graduate Exam.
                </p>
              </div>
            )}
          </div>
        )}

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
            classId={selectedQuiz.classId || classId}
            quiz={selectedQuiz}
            onClose={() => setShowQuizEditing(false)}
            onComplete={handleQuizEditingComplete}
          />
        )}
      </div>
    </div>
  );
};

export default ClassroomSession;
