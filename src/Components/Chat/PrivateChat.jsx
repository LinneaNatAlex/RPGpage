import { useState, useRef, useEffect, useCallback } from "react";
// Note: Ping functionality moved to global App.jsx
// MessageMenu component for edit/delete menu
// ...existing code...
// ...existing code...
function MessageMenu({ message, currentUser, selectedUser, db, onEdit }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef();
  useEffect(() => {
    if (!open) return;
    function handle(e) {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);
  return (
    <div className={styles.privateMessageMenu} ref={menuRef}>
      <button
        className={styles.privateMessageMenuBtn}
        aria-label="Meldingsmeny"
        onClick={(e) => {
          e.preventDefault();
          setOpen((v) => !v);
        }}
        tabIndex={0}
      >
        &#8230;
      </button>
      {open && (
        <div className={styles.privateMessageMenuDropdown}>
          <button
            className={styles.privateMessageMenuDropdownBtn}
            onClick={async (e) => {
              e.preventDefault();
              setOpen(false);

              try {
                const chatId = [currentUser.uid, selectedUser.uid]
                  .sort()
                  .join("_");
                const { deleteDoc, doc } = await import("firebase/firestore");

                // Use the message ID directly for deletion
                if (message.id) {
                  const messageRef = doc(
                    db,
                    "privateMessages",
                    chatId,
                    "messages",
                    message.id,
                  );
                  await deleteDoc(messageRef);
                } else {
                  console.error("Message ID not found, cannot delete");
                  alert("Could not delete message - missing ID.");
                }
              } catch (error) {
                console.error("Error deleting message:", error);
                alert("Could not delete message. Try again.");
              }
            }}
          >
            Delete
          </button>
          <button
            className={styles.privateMessageMenuDropdownBtn}
            onClick={(e) => {
              e.preventDefault();
              setOpen(false);
              onEdit(message);
            }}
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
}
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import styles from "./Chat.module.css";
import { FaPlus } from "react-icons/fa";
import { auth, db } from "../../firebaseConfig";
import {
  query,
  collection,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  where,
  limit,
  deleteDoc,
  writeBatch,
  arrayRemove,
} from "firebase/firestore";
import useUsers from "../../hooks/useUser";
import useOnlineUsers from "../../hooks/useOnlineUsers";
import { playPrivateChatPling, preparePrivateChatSound } from "./ping_alt";
import { useOpenPrivateChat } from "../../context/openPrivateChatContext";
import { useNavigate, Link } from "react-router-dom";

const PrivateChat = ({ fullPage = false }) => {
  const navigate = useNavigate();
  // Mute state for varsler
  const [muted, setMuted] = useState(() => {
    const stored = localStorage.getItem("privateChatMuted");
    return stored === "true";
  });
  const mutedRef = useRef(muted);
  useEffect(() => {
    localStorage.setItem("privateChatMuted", muted);
    mutedRef.current = muted;
  }, [muted]);
  const [editingMessage, setEditingMessage] = useState(null);
  const [selectedMessages, setSelectedMessages] = useState([]);
  // Husk om chatten var lukket eller åpen (default: lukket)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const stored = localStorage.getItem("privateChatCollapsed");
    return stored === null ? true : stored === "true";
  });
  const isCollapsedRef = useRef(isCollapsed);
  useEffect(() => {
    isCollapsedRef.current = isCollapsed;
  }, [isCollapsed]);
  const [search, setSearch] = useState("");
  const [activeChats, setActiveChats] = useState([]); // [{user, messages: []}]
  const [selectedGroup, setSelectedGroup] = useState(null); // groupId
  const [groupChats, setGroupChats] = useState([]); // [{ id, name, members }]
  const [groupMessages, setGroupMessages] = useState([]);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [newGroupSelectedUids, setNewGroupSelectedUids] = useState([]);
  const [newGroupName, setNewGroupName] = useState("");

  // Potion effect states
  const [hairColorUntil, setHairColorUntil] = useState(null);
  const [rainbowUntil, setRainbowUntil] = useState(null);
  const [glowUntil, setGlowUntil] = useState(null);
  const [translationUntil, setTranslationUntil] = useState(null);
  const [echoUntil, setEchoUntil] = useState(null);
  const [whisperUntil, setWhisperUntil] = useState(null);
  const [shoutUntil, setShoutUntil] = useState(null);
  const [mysteryUntil, setMysteryUntil] = useState(null);
  const [charmUntil, setCharmUntil] = useState(null);
  const [inLoveUntil, setInLoveUntil] = useState(null);
  const [rainbowColor, setRainbowColor] = useState("#ff6b6b");

  // Helper functions for potion effects
  const getRandomColor = () => {
    const colors = [
      "#ff6b6b",
      "#4ecdc4",
      "#45b7d1",
      "#96ceb4",
      "#feca57",
      "#ff9ff3",
      "#54a0ff",
      "#5f27cd",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const translateText = (text) => {
    const translations = {
      hello: "hola",
      hi: "ciao",
      goodbye: "adios",
      thanks: "gracias",
      yes: "si",
      no: "nein",
      maybe: "peut-être",
      love: "amour",
      friend: "ami",
      magic: "magie",
      potion: "poción",
      wizard: "mago",
    };
    return text
      .split(" ")
      .map((word) => {
        const lower = word.toLowerCase().replace(/[^\w]/g, "");
        return translations[lower] || word;
      })
      .join(" ");
  };

  // Load user's potion effects - fetch once instead of listening
  useEffect(() => {
    if (!auth.currentUser) return;
    const fetchPotionEffects = async () => {
      try {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setHairColorUntil(
            data.hairColorUntil && data.hairColorUntil > Date.now()
              ? data.hairColorUntil
              : null,
          );
          setRainbowUntil(
            data.rainbowUntil && data.rainbowUntil > Date.now()
              ? data.rainbowUntil
              : null,
          );
          setGlowUntil(
            data.glowUntil && data.glowUntil > Date.now()
              ? data.glowUntil
              : null,
          );
          setTranslationUntil(
            data.translationUntil && data.translationUntil > Date.now()
              ? data.translationUntil
              : null,
          );
          setEchoUntil(
            data.echoUntil && data.echoUntil > Date.now()
              ? data.echoUntil
              : null,
          );
          setWhisperUntil(
            data.whisperUntil && data.whisperUntil > Date.now()
              ? data.whisperUntil
              : null,
          );
          setShoutUntil(
            data.shoutUntil && data.shoutUntil > Date.now()
              ? data.shoutUntil
              : null,
          );
          setMysteryUntil(
            data.mysteryUntil && data.mysteryUntil > Date.now()
              ? data.mysteryUntil
              : null,
          );
          setCharmUntil(
            data.charmUntil && data.charmUntil > Date.now()
              ? data.charmUntil
              : null,
          );
          setInLoveUntil(
            data.inLoveUntil && data.inLoveUntil > Date.now()
              ? data.inLoveUntil
              : null,
          );
        }
      } catch (error) {
        console.error("Error fetching potion effects:", error);
      }
    };
    fetchPotionEffects();
    // Refresh every 5 minutes instead of real-time listening
    const interval = setInterval(fetchPotionEffects, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Rainbow Potion effect - change color every 10 seconds
  useEffect(() => {
    if (!rainbowUntil || rainbowUntil <= Date.now()) return;

    const interval = setInterval(() => {
      setRainbowColor(getRandomColor());
    }, 10000); // Change every 10 seconds

    return () => clearInterval(interval);
  }, [rainbowUntil]);

  // Skjulte brukere (uid-array), lagres i localStorage
  const [hiddenChats, setHiddenChats] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("hiddenPrivateChats") || "[]");
    } catch {
      return [];
    }
  });
  // Only one chat window
  const [chatLoaded, setChatLoaded] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const selectedUserRef = useRef(selectedUser);
  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const chatBoxRef = useRef(null);
  const lastMessageRef = useRef(null);
  const currentUser = auth.currentUser;
  const { users, loading } = useUsers();
  const onlineUsersList = useOnlineUsers();
  const onlineUids = new Set(onlineUsersList.map((u) => u.id));
  const { openWithUid, setOpenWithUid, openWithGroupId, setOpenWithGroupId } = useOpenPrivateChat();

  // Load active chats from Firestore on mount
  useEffect(() => {
    if (!currentUser || !users) return;
    const fetchChats = async () => {
      const userChatsRef = doc(db, "userChats", currentUser.uid);
      const userChatsSnap = await getDoc(userChatsRef);
      let chatList = [];
      if (userChatsSnap.exists()) {
        const chatUids = userChatsSnap.data().chats || [];
        chatList = chatUids
          .map((uid) => users.find((u) => u.uid === uid))
          .filter(Boolean)
          .map((user) => ({ user, messages: [] }));
      }
      setActiveChats(chatList);
      setChatLoaded(true);
    };
    fetchChats();
  }, [currentUser, users]);

  // When chat is collapsed: listen for new private_chat notifications → same soft pling as main chat
  const lastSeenPrivateNotifIdRef = useRef(null);
  useEffect(() => {
    if (!currentUser || !isCollapsed) return;
    const q = query(
      collection(db, "notifications"),
      where("to", "==", currentUser.uid),
      where("type", "==", "private_chat"),
      orderBy("created", "desc"),
      limit(1),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const doc = snap.docs[0];
        if (!doc) return;
        const data = doc.data();
        const fromUid = data.fromUid || data.from;
        const isFromOther = fromUid && fromUid !== currentUser.uid;
        if (
          lastSeenPrivateNotifIdRef.current !== null &&
          lastSeenPrivateNotifIdRef.current !== doc.id &&
          isFromOther &&
          !mutedRef.current
        ) {
          playPrivateChatPling();
        }
        lastSeenPrivateNotifIdRef.current = doc.id;
      },
      () => {},
    );
    return () => unsub();
  }, [currentUser, isCollapsed]);

  // Optimized: Only listen for messages from the currently selected chat
  // Remove the multiple listeners for all active chats to reduce Firebase quota usage

  // Max 20 messages in private chat (like main chat limit)
  const MAX_PRIVATE_CHAT_MESSAGES = 20;
  const MAX_PRIVATE_MESSAGE_WORDS = 200;
  const getWordCount = (text) =>
    (text || "").trim() ? (text || "").trim().split(/\s+/).length : 0;

  // Only listen for messages for the selected user when chat is open (last 20 only)
  // On mobile / full-page the panel is always visible, so subscribe whenever selectedUser is set (ignore isCollapsed)
  const isPcForSubscription =
    typeof window !== "undefined" && window.innerWidth > 768;
  useEffect(() => {
    if (!currentUser || !selectedUser) {
      setSelectedMessages([]);
      return;
    }
    if (isPcForSubscription && isCollapsed && !fullPage) {
      setSelectedMessages([]);
      return;
    }
    const chatId = [currentUser.uid, selectedUser.uid].sort().join("_");
    const q = query(
      collection(db, "privateMessages", chatId, "messages"),
      orderBy("timestamp", "desc"),
      limit(MAX_PRIVATE_CHAT_MESSAGES),
    );
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .reverse(); // show oldest first
      setSelectedMessages(messages);
    });
  }, [currentUser, selectedUser, isCollapsed, isPcForSubscription, fullPage]);

  // Load group chats where current user is member
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "groupChats"),
      where("members", "array-contains", currentUser.uid),
    );
    return onSnapshot(q, (snapshot) => {
      setGroupChats(
        snapshot.docs.map((d) => ({ id: d.id, ...d.data() })),
      );
    });
  }, [currentUser]);

  // Subscribe to selected group messages
  useEffect(() => {
    if (!currentUser || !selectedGroup) {
      setGroupMessages([]);
      return;
    }
    const q = query(
      collection(db, "groupChats", selectedGroup, "messages"),
      orderBy("timestamp", "desc"),
      limit(MAX_PRIVATE_CHAT_MESSAGES),
    );
    return onSnapshot(q, (snapshot) => {
      setGroupMessages(
        snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .reverse(),
      );
    });
  }, [currentUser, selectedGroup]);

  // Alltid scroll til siste melding (bruk scrollTop så det alltid er på bunnen)
  const scrollToLatest = useCallback(() => {
    const el = chatBoxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    if (selectedMessages.length === 0 && groupMessages.length === 0) return;
    const id = setTimeout(scrollToLatest, 50);
    return () => clearTimeout(id);
  }, [selectedMessages, groupMessages, scrollToLatest]);

  // Når brukeren kommer tilbake til fanen: scroll til siste melding
  useEffect(() => {
    const onVisibility = () => {
      if (
        document.visibilityState === "visible" &&
        selectedMessages.length > 0
      ) {
        setTimeout(scrollToLatest, 100);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [selectedMessages.length, scrollToLatest]);

  // When notification click asks to open private chat with a user (must be before any conditional return)
  useEffect(() => {
    if (!openWithUid || !currentUser) return;
    const applyUser = (userObj) => {
      setActiveChats((prev) =>
        prev.some((c) => c.user.uid === userObj.uid)
          ? prev
          : [...prev, { user: userObj, messages: [] }],
      );
      setSelectedUser(userObj);
      setSearch("");
      setIsCollapsed(false);
      const userChatsRef = doc(db, "userChats", currentUser.uid);
      getDoc(userChatsRef).then((snap) => {
        const chatUids = snap.exists() ? snap.data().chats || [] : [];
        if (!chatUids.includes(userObj.uid)) {
          setDoc(userChatsRef, { chats: [...chatUids, userObj.uid] }, { merge: true }).catch(() => {});
        }
      });
    };
    const user = users?.find((u) => u.uid === openWithUid);
    if (user) {
      applyUser(user);
      setOpenWithUid(null);
    } else {
      getDoc(doc(db, "users", openWithUid))
        .then((snap) => {
          if (snap.exists()) {
            const data = snap.data();
            applyUser({
              uid: openWithUid,
              displayName: data.displayName || data.name || data.email || "Unknown",
              email: data.email,
              profileImageUrl: data.profileImageUrl,
            });
          }
        })
        .catch(() => {})
        .finally(() => setOpenWithUid(null));
    }
  }, [openWithUid, currentUser, users]);

  // When notification click asks to open a group chat
  useEffect(() => {
    if (!openWithGroupId) return;
    setSelectedGroup(openWithGroupId);
    setSelectedUser(null);
    setOpenWithGroupId(null);
  }, [openWithGroupId, setOpenWithGroupId]);

  // NOW conditional returns after ALL hooks
  if (!currentUser) return null;
  if (loading) return <div>Loading...</div>;

  // Find the current user's full data from users array
  const currentUserData = users
    ? users.find((u) => u.uid === currentUser.uid)
    : null;

  // Filter users for search: kun aktive (online) brukere, ekskluder self og allerede synlige chats
  const filteredUsers =
    search && users
      ? users.filter(
          (u) =>
            u.uid !== currentUser.uid &&
            onlineUids.has(u.uid) &&
            (u.displayName || u.name || u.uid)
              .toLowerCase()
              .includes(search.toLowerCase()) &&
            !activeChats.some(
              (c) => c.user.uid === u.uid && !hiddenChats.includes(u.uid),
            ),
        )
      : [];

  // Trim private chat to max N messages (delete oldest). Runs after send.
  const trimPrivateChatToLimit = async (chatId, maxCount = MAX_PRIVATE_CHAT_MESSAGES) => {
    try {
      while (true) {
        const q = query(
          collection(db, "privateMessages", chatId, "messages"),
          orderBy("timestamp", "asc"),
          limit(100),
        );
        const snap = await getDocs(q);
        if (snap.size <= maxCount) break;
        const toDelete = snap.docs.slice(0, snap.size - maxCount);
        for (const d of toDelete) {
          await deleteDoc(d.ref);
        }
      }
    } catch (err) {
      // Non-blocking; ignore trim errors
    }
  };

  // Add new private chat
  const addChat = async (user) => {
    // Add to Firestore userChats
    const userChatsRef = doc(db, "userChats", currentUser.uid);
    const userChatsSnap = await getDoc(userChatsRef);
    let chatUids = [];
    if (userChatsSnap.exists()) {
      chatUids = userChatsSnap.data().chats || [];
    }
    if (!chatUids.includes(user.uid)) {
      chatUids.push(user.uid);
      await setDoc(userChatsRef, { chats: chatUids }, { merge: true });
    }
    setActiveChats((prev) =>
      prev.some((c) => c.user.uid === user.uid)
        ? prev
        : [...prev, { user, messages: [] }],
    );
    setSelectedUser(user);
    setSearch("");
    setIsCollapsed(false); // Åpne chatten når ny chat startes
  };

  // Send or edit message in active chat (Firestore)
  const sendMessage = async (e) => {
    e.preventDefault();
    preparePrivateChatSound();
    if (!message.trim() || !selectedUser || !currentUser) return;
    if (editingMessage) {
      // Edit existing message
      const chatId = [currentUser.uid, selectedUser.uid].sort().join("_");
      const { updateDoc, doc } = await import("firebase/firestore");

      if (editingMessage.id) {
        const messageRef = doc(
          db,
          "privateMessages",
          chatId,
          "messages",
          editingMessage.id,
        );
        await updateDoc(messageRef, { text: message });
      } else {
        console.error("Editing message ID not found");
        alert("Could not edit message - missing ID.");
      }
      setEditingMessage(null);
      setMessage("");
      return;
    }
    setMessage(""); // Tøm input umiddelbart
    const chatId = [currentUser.uid, selectedUser.uid].sort().join("_");
    try {
      // Prepare potion effects for this message
      const potionEffects = {};
      if (hairColorUntil && hairColorUntil > Date.now()) {
        potionEffects.hairColor = getRandomColor();
      }
      if (rainbowUntil && rainbowUntil > Date.now()) {
        potionEffects.rainbow = true;
        potionEffects.rainbowColor = rainbowColor;
      }
      if (shoutUntil && shoutUntil > Date.now()) {
        potionEffects.shout = true;
      }
      if (translationUntil && translationUntil > Date.now()) {
        potionEffects.translation = true;
      }
      if (mysteryUntil && mysteryUntil > Date.now()) {
        potionEffects.mystery = true;
      }
      if (glowUntil && glowUntil > Date.now()) {
        potionEffects.glow = true;
      }
      if (charmUntil && charmUntil > Date.now()) {
        potionEffects.charm = true;
      }
      if (inLoveUntil && inLoveUntil > Date.now()) {
        potionEffects.love = true;
      }

      await addDoc(collection(db, "privateMessages", chatId, "messages"), {
        text: message,
        from: currentUser.uid,
        to: selectedUser.uid,
        timestamp: serverTimestamp(),
        potionEffects:
          Object.keys(potionEffects).length > 0 ? potionEffects : null,
      });

      // Keep only last 20 messages in this chat
      trimPrivateChatToLimit(chatId).catch(() => {});

      // Notify recipient
      const fromDisplayName =
        currentUser.displayName?.trim() || currentUser.email || "Someone";
      try {
        await addDoc(collection(db, "notifications"), {
          to: selectedUser.uid,
          type: "private_chat",
          from: currentUser.uid,
          fromUid: currentUser.uid,
          fromName: fromDisplayName,
          read: false,
          created: Date.now(),
          textPreview: message.slice(0, 80),
        });
      } catch (_) {}

      // Add each other in userChats for both sender and receiver
      const senderChatsRef = doc(db, "userChats", currentUser.uid);
      const receiverChatsRef = doc(db, "userChats", selectedUser.uid);
      const [senderSnap, receiverSnap] = await Promise.all([
        getDoc(senderChatsRef),
        getDoc(receiverChatsRef),
      ]);
      let senderChats = [];
      let receiverChats = [];
      if (senderSnap.exists()) senderChats = senderSnap.data().chats || [];
      if (receiverSnap.exists())
        receiverChats = receiverSnap.data().chats || [];
      // Update if necessary
      if (!senderChats.includes(selectedUser.uid)) {
        await setDoc(
          senderChatsRef,
          { chats: [...senderChats, selectedUser.uid] },
          { merge: true },
        );
      }
      if (!receiverChats.includes(currentUser.uid)) {
        await setDoc(
          receiverChatsRef,
          { chats: [...receiverChats, currentUser.uid] },
          { merge: true },
        );
      }
    } catch (err) {
      // evt. vis feilmelding
    }
  };

  const createGroup = async () => {
    if (!currentUser || newGroupSelectedUids.length === 0) return;
    const members = [currentUser.uid, ...newGroupSelectedUids];
    try {
      const ref = await addDoc(collection(db, "groupChats"), {
        name: (newGroupName || "").trim() || "Group",
        members,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
      });
      setSelectedGroup(ref.id);
      setSelectedUser(null);
      setShowNewGroupModal(false);
      setNewGroupSelectedUids([]);
      setNewGroupName("");
    } catch (err) {
      console.error("Create group failed:", err);
      alert(err?.message || "Kunne ikke opprette gruppe. Sjekk at Firestore-regler er deployet (firebase deploy --only firestore:rules).");
    }
  };

  const sendGroupMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedGroup || !currentUser) return;
    const text = message;
    setMessage("");
    try {
      await addDoc(collection(db, "groupChats", selectedGroup, "messages"), {
        text,
        from: currentUser.uid,
        timestamp: serverTimestamp(),
      });
      const group = groupChats.find((g) => g.id === selectedGroup);
      const otherMembers = (group?.members || []).filter((uid) => uid !== currentUser.uid);
      const fromName = currentUser.displayName?.trim() || currentUser.email || "Someone";
      for (const toUid of otherMembers) {
        try {
          await addDoc(collection(db, "notifications"), {
            to: toUid,
            type: "group_chat",
            from: currentUser.uid,
            fromName,
            groupId: selectedGroup,
            groupName: group?.name || "Group",
            textPreview: text.slice(0, 80),
            read: false,
            created: Date.now(),
          });
        } catch (_) {}
      }
    } catch (err) {}
  };

  const leaveGroup = async () => {
    if (!currentUser || !selectedGroup) return;
    if (!window.confirm("Leave this group? You will no longer see it or its messages.")) return;
    try {
      const groupRef = doc(db, "groupChats", selectedGroup);
      await updateDoc(groupRef, { members: arrayRemove(currentUser.uid) });
      setSelectedGroup(null);
    } catch (err) {
      console.error("Leave group failed:", err);
      alert(err?.message || "Kunne ikke forlate gruppen.");
    }
  };

  // Calculate per-chat unread messages for the current user
  // Badge skal kun vises for mottaker, ikke for meldinger man selv har sendt
  const getUnreadCount = (chat) => {
    if (!chat.messages) return 0;
    // Kun meldinger som er sendt TIL innlogget bruker og ikke lest
    return chat.messages.filter(
      (m) => m.to === currentUser.uid && m.from !== currentUser.uid && !m.read,
    ).length;
  };

  // Any chat has unread? (etter at meldinger er lest forsvinner badge umiddelbart)
  const hasUnread = activeChats.some((c) => getUnreadCount(c) > 0);

  const isPc = typeof window !== "undefined" && window.innerWidth > 768;

  if (fullPage) {
    const selectUserAndMarkRead = (c) => {
      setSelectedGroup(null);
      setSelectedUser(c.user);
      setActiveChats((prev) => [...prev]);
      const chatId = [currentUser.uid, c.user.uid].sort().join("_");
      const msgsRef = collection(db, "privateMessages", chatId, "messages");
      if (getUnreadCount(c) > 0) {
        getDocs(msgsRef).then((docsSnap) => {
          const batch = writeBatch(db);
          docsSnap.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.to === currentUser.uid && !data.read) batch.update(docSnap.ref, { read: true });
          });
          batch.commit();
        });
      }
    };
    return (
      <div className={styles.messagesFullPage}>
        <aside className={styles.messagesFullPageSidebar}>
          <h3 className={styles.messagesFullPageSidebarTitle}>Conversations</h3>
          {activeChats.filter((c) => !hiddenChats.includes(c.user.uid)).map((c) => (
            <button
              key={c.user.uid}
              type="button"
              className={`${styles.messagesFullPageSidebarItem} ${styles.messagesFullPageSidebarItemWithAvatar} ${selectedUser?.uid === c.user.uid ? styles.selected : ""} ${getUnreadCount(c) > 0 ? styles.unread : ""}`}
              onClick={() => selectUserAndMarkRead(c)}
            >
              <span className={styles.messagesFullPageSidebarAvatarWrap}>
                <img src={c.user.profileImageUrl || "/icons/avatar.svg"} alt="" className={styles.messagesFullPageSidebarAvatar} />
                {onlineUids.has(c.user.uid) && <span className={styles.messagesFullPageOnlineDot} aria-hidden />}
              </span>
              <span className={styles.messagesFullPageSidebarItemText}>
                {c.user.displayName || c.user.name || c.user.uid}
                {getUnreadCount(c) > 0 ? ` (${getUnreadCount(c)})` : ""}
              </span>
            </button>
          ))}
          <h3 className={styles.messagesFullPageSidebarTitle}>New conversation</h3>
          <input
            type="text"
            placeholder="Search user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.messagesFullPageSidebarSearch}
          />
          {search.trim() ? (
            <div className={styles.messagesFullPageSidebarUserList}>
              {filteredUsers.map((u) => (
                <button
                  key={u.uid}
                  type="button"
                  className={`${styles.messagesFullPageSidebarItem} ${styles.messagesFullPageSidebarItemWithAvatar}`}
                  onClick={() => {
                    setHiddenChats((prev) => {
                      if (!prev.includes(u.uid)) return prev;
                      const updated = prev.filter((id) => id !== u.uid);
                      localStorage.setItem("hiddenPrivateChats", JSON.stringify(updated));
                      return updated;
                    });
                    const existing = activeChats.find((c) => c.user.uid === u.uid);
                    if (existing) setSelectedUser(existing.user);
                    else addChat(u);
                    setSearch("");
                  }}
                >
                  <span className={styles.messagesFullPageSidebarAvatarWrap}>
                    <img src={u.profileImageUrl || "/icons/avatar.svg"} alt="" className={styles.messagesFullPageSidebarAvatar} />
                    {onlineUids.has(u.uid) && <span className={styles.messagesFullPageOnlineDot} aria-hidden />}
                  </span>
                  <span className={styles.messagesFullPageSidebarItemText}>{u.displayName || u.name || u.uid}</span>
                </button>
              ))}
              {filteredUsers.length === 0 && <span className={styles.messagesFullPageSidebarHint}>No users found</span>}
            </div>
          ) : (
            <p className={styles.messagesFullPageSidebarHint}>Type to search for an online user</p>
          )}
          <h3 className={styles.messagesFullPageSidebarTitle}>Group chats</h3>
          <button type="button" className={styles.messagesFullPageSidebarItem} onClick={() => setShowNewGroupModal(true)} style={{ justifyContent: "center", fontWeight: 600 }}>
            + New group
          </button>
          {groupChats.map((g) => (
            <button
              key={g.id}
              type="button"
              className={`${styles.messagesFullPageSidebarItem} ${selectedGroup === g.id ? styles.selected : ""}`}
              onClick={() => { setSelectedUser(null); setSelectedGroup(g.id); }}
            >
              <span className={styles.messagesFullPageSidebarItemText}>{g.name || "Group"}</span>
            </button>
          ))}
        </aside>
        <div className={styles.messagesFullPageMain}>
          <header className={styles.messagesFullPagePageHeader}>
            <Link to="/" className={styles.messagesFullPageBackLink}>← Back</Link>
            <h1 className={styles.messagesFullPagePageTitle}>Private messages</h1>
          </header>
          {selectedGroup ? (
            (() => {
              const group = groupChats.find((g) => g.id === selectedGroup);
              return (
                <>
                  <div className={styles.messagesFullPageHeader} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                    <span style={{ flex: "1 1 auto", minWidth: 0 }}>
                      <span>{group?.name || "Group"}</span>
                      {group?.members?.length > 0 && (
                        <span className={styles.messagesFullPageGroupMembers}>
                          {group.members.map((uid) => uid === currentUser.uid ? "You" : (users?.find((x) => x.uid === uid)?.displayName || users?.find((x) => x.uid === uid)?.name || uid)).join(", ")}
                        </span>
                      )}
                    </span>
                    <button type="button" className={styles.messagesFullPageLeaveGroup} onClick={leaveGroup} title="Leave group">Leave group</button>
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, width: "100%" }}>
                    <div className={styles.chatMessages} ref={chatBoxRef} style={{ flex: 1, minHeight: 0 }}>
                      {groupMessages.map((m, i) => {
                        const isLast = i === groupMessages.length - 1;
                        const sender = users?.find((u) => u.uid === m.from);
                        const isMe = m.from === currentUser?.uid;
                        return (
                          <div key={m.id || i} ref={isLast ? lastMessageRef : undefined} className={styles.privateMessageRow + (isMe ? " " + styles.me : "")}>
                            <div className={styles.privateMessageBubble}>
                              <img src={isMe ? (currentUserData?.profileImageUrl || "/icons/avatar.svg") : (sender?.profileImageUrl || "/icons/avatar.svg")} alt="" className={styles.privateMessageProfilePic} />
                              <div className={styles.privateMessageContent}>
                                <div className={styles.privateMessageSender}>{isMe ? "You" : (sender?.displayName || sender?.name || m.from)}</div>
                                <span style={{ display: "block", wordBreak: "break-word" }}>{m.text}</span>
                                <div className={styles.privateMessageTimestamp}>
                                  {m.timestamp?.seconds ? new Date(m.timestamp.seconds * 1000).toLocaleString("no-NO", { hour: "2-digit", minute: "2-digit" }) : ""}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <form className={`${styles.chatForm} ${styles.privateChatForm}`} onSubmit={sendGroupMessage} style={{ width: "100%", boxSizing: "border-box", flexShrink: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1, minWidth: 0, width: "100%" }}>
                        <input value={message} onChange={(e) => setMessage(e.target.value)} type="text" placeholder="Message group..." maxLength={1500} className={styles.chatInput} style={{ flex: 1, minWidth: 0 }} />
                        <button type="submit" className={styles.chatBtn}>Send</button>
                      </div>
                    </form>
                  </div>
                </>
              );
            })()
          ) : !selectedUser ? (
            <div className={styles.messagesFullPageEmpty}>
              <p>Select a conversation or group, or search for an online user to start a new chat.</p>
              <Link to="/" className={styles.messagesFullPageEmptyLink}>← Back to home</Link>
            </div>
          ) : (
            <>
              <div className={styles.messagesFullPageHeader}>
                <span>{selectedUser.displayName || selectedUser.name || selectedUser.uid}</span>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, width: "100%" }}>
                <div className={styles.chatMessages} ref={chatBoxRef} style={{ flex: 1, minHeight: 0 }}>
                  {selectedMessages.map((m, i) => {
                    const isLast = i === selectedMessages.length - 1;
                    return (
                      <div key={m.id || i} ref={isLast ? lastMessageRef : undefined} className={styles.privateMessageRow + (m.from === currentUser?.uid ? " " + styles.me : "")}>
                        <div className={styles.privateMessageBubble}>
                          <img src={m.from === currentUser?.uid ? (currentUserData?.profileImageUrl || "/icons/avatar.svg") : (selectedUser.profileImageUrl || "/icons/avatar.svg")} alt="Profile" className={styles.privateMessageProfilePic} />
                          <div className={styles.privateMessageContent}>
                            <div className={styles.privateMessageSender} style={{ ...(m.potionEffects && m.potionEffects.glow ? { textShadow: "0 0 10px #ffd700, 0 0 20px #ffd700, 0 0 30px #ffd700", color: "#ffd700" } : {}), ...(m.potionEffects && m.potionEffects.charm ? { textShadow: "0 0 8px #ff69b4, 0 0 16px #ff1493, 0 0 24px #ff69b4", color: "#ff69b4" } : {}) }}>
                              {m.from === currentUser?.uid ? (m.potionEffects?.mystery ? "???" : "You") : (selectedUser.displayName || selectedUser.name || selectedUser.uid)}
                              {m.potionEffects && m.potionEffects.charm && " 💕"}
                              {m.potionEffects && m.potionEffects.love && " 💖"}
                            </div>
                            <div style={{ position: "relative" }}>
                              {m.from === currentUser?.uid && (
                                <div style={{ position: "absolute", top: -28, right: -10, zIndex: 3 }}>
                                  <MessageMenu message={m} currentUser={currentUser} selectedUser={selectedUser} db={db} onEdit={(msg) => { setEditingMessage(msg); setMessage(msg.text); }} />
                                </div>
                              )}
                              <span style={{ display: "block", wordBreak: "break-word", whiteSpace: "normal", overflowWrap: "break-word", ...(m.potionEffects ? { ...(m.potionEffects.hairColor ? { color: m.potionEffects.hairColor } : {}), ...(m.potionEffects.rainbow ? { color: m.potionEffects.rainbowColor } : {}), ...(m.potionEffects.shout ? { textTransform: "uppercase", fontWeight: "bold" } : {}) } : {}) }}>
                                {m.potionEffects?.translation ? translateText(m.text) : m.text}
                              </span>
                            </div>
                            <div className={styles.privateMessageTimestamp}>
                              {m.timestamp?.seconds ? new Date(m.timestamp.seconds * 1000).toLocaleString("no-NO", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "2-digit" }) : ""}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <form className={`${styles.chatForm} ${styles.privateChatForm}`} onSubmit={sendMessage} style={{ width: "100%", boxSizing: "border-box", flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1, minWidth: 0, width: "100%" }}>
                    <input id="private-chat-message-fullpage" value={message} onChange={(e) => { setMessage(e.target.value); setMessageError(""); }} type="text" placeholder={editingMessage ? "Edit message..." : `Message ${selectedUser.displayName || selectedUser.name || selectedUser.uid}...`} maxLength={1500} className={styles.chatInput} style={{ flex: 1, minWidth: 0 }} />
                    <button type="submit" className={styles.chatBtn}>{editingMessage ? "Save" : "Send"}</button>
                  </div>
                  <div className={styles.messagesFullPageFormHint}>{messageError || (message.trim() ? `${getWordCount(message)} / ${MAX_PRIVATE_MESSAGE_WORDS} ord` : "")}</div>
                </form>
              </div>
            </>
          )}
        </div>
        {showNewGroupModal && (
          <div className={styles.messagesFullPageModalOverlay} onClick={() => setShowNewGroupModal(false)}>
            <div className={styles.messagesFullPageModal} onClick={(e) => e.stopPropagation()}>
              <h3 className={styles.messagesFullPageSidebarTitle}>New group</h3>
              <p className={styles.messagesFullPageSidebarHint}>Add people one by one from the dropdown. At least one required.</p>
              <input type="text" placeholder="Group name (optional)" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} className={styles.messagesFullPageSidebarSearch} />
              <label className={styles.messagesFullPageGroupDropdownLabel}>
                Add person
              </label>
              <select
                className={styles.messagesFullPageGroupDropdown}
                value=""
                onChange={(e) => {
                  const uid = e.target.value;
                  if (uid && !newGroupSelectedUids.includes(uid)) {
                    setNewGroupSelectedUids((prev) => [...prev, uid]);
                  }
                  e.target.value = "";
                }}
              >
                <option value="">— Choose someone —</option>
                {onlineUsersList
                  .filter((u) => u.id !== currentUser.uid && !newGroupSelectedUids.includes(u.id))
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.displayName || u.name || u.id}
                    </option>
                  ))}
              </select>
              {onlineUsersList.filter((u) => u.id !== currentUser.uid).length === 0 && (
                <p className={styles.messagesFullPageSidebarHint}>No other users online right now.</p>
              )}
              <div className={styles.messagesFullPageGroupTags}>
                {newGroupSelectedUids.map((uid) => {
                  const u = onlineUsersList.find((o) => o.id === uid) || users?.find((o) => o.uid === uid);
                  const name = u?.displayName || u?.name || uid;
                  return (
                    <span key={uid} className={styles.messagesFullPageGroupTag}>
                      {name}
                      <button type="button" className={styles.messagesFullPageGroupTagRemove} onClick={() => setNewGroupSelectedUids((prev) => prev.filter((id) => id !== uid))} aria-label="Remove">×</button>
                    </span>
                  );
                })}
              </div>
              <div className={styles.messagesFullPageModalActions}>
                <button type="button" className={styles.chatBtn} onClick={() => { setShowNewGroupModal(false); setNewGroupSelectedUids([]); setNewGroupName(""); }}>Cancel</button>
                <button type="button" className={styles.chatBtn} onClick={() => { if (newGroupSelectedUids.length > 0) createGroup(); }} disabled={newGroupSelectedUids.length === 0}>Create group</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={
        isPc && !isCollapsed
          ? styles.chatPanelSticky
          : !isPc
            ? "private-chat-mobile"
            : undefined
      }
      style={{
        position: isPc ? "fixed" : "relative",
        top: isPc && !isCollapsed ? 0 : "auto",
        bottom: isPc ? 0 : "auto",
        right: isPc ? 370 : "auto",
        width: isPc ? 350 : "100%",
        maxWidth: isPc ? undefined : "100%",
        height: isPc && !isCollapsed ? "100vh" : isPc ? "auto" : "100%",
        flex: isPc ? undefined : 1,
        minWidth: isPc ? undefined : 0,
        minHeight: isPc ? undefined : 0,
        zIndex: isPc ? 10005 : 1,
        display: "flex",
        flexDirection: isPc
          ? isCollapsed
            ? "column-reverse"
            : "column"
          : "column",
      }}
    >
      {isPc && (
        <div
          style={{
            flexShrink: 0,
            background: "#5D4E37",
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            padding: "0.5rem 1rem",
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            border: "1px solid #7B6857",
            borderBottom: isCollapsed ? "1px solid #7B6857" : "none",
          }}
          onClick={() => {
            preparePrivateChatSound();
            setIsCollapsed((prev) => !prev);
          }}
        >
          <span
            style={{
              flex: 1,
              color: "#F5EFE0",
              fontWeight: 600,
              position: "relative",
            }}
          >
            Private Chat
            {hasUnread && (
              <span
                style={{
                  position: "absolute",
                  top: -6,
                  right: -18,
                  background: "#ff4d4f",
                  color: "#fff",
                  borderRadius: "50%",
                  width: 18,
                  height: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 700,
                  boxShadow: "0 0 2px #000",
                }}
              >
                !
              </span>
            )}
          </span>
          {/* Mute/unmute icon button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMuted((m) => !m);
            }}
            style={{
              background: "none",
              border: "none",
              marginLeft: 8,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              padding: 0,
              outline: "none",
            }}
            title={muted ? "Turn on notifications" : "Turn off notifications"}
          >
            {muted ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="#7B6857"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: "drop-shadow(0 0 2px #7B6857)" }}
              >
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                <line
                  x1="1"
                  y1="1"
                  x2="23"
                  y2="23"
                  stroke="#7B6857"
                  strokeWidth="2"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="#7B6857"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: "drop-shadow(0 0 2px #7B6857)" }}
              >
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            )}
          </button>
          <button
            type="button"
            style={{
              background: "none",
              border: "none",
              color: "#F5EFE0",
              fontSize: 18,
              cursor: "pointer",
            }}
            onClick={(e) => {
              e.stopPropagation();
              preparePrivateChatSound();
              setIsCollapsed((prev) => !prev);
            }}
          >
            {isCollapsed ? "▲" : "▼"}
          </button>
          <button
            type="button"
            style={{
              background: "none",
              border: "none",
              color: "#F5EFE0",
              fontSize: 18,
              marginLeft: 8,
              cursor: "pointer",
            }}
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(false);
              setSearch("");
            }}
          >
            <FaPlus />
          </button>
        </div>
      )}
      {(isPc ? !isCollapsed : true) && (
        <div
          className={`${styles.chatContainer} ${
            isPc ? styles.chatContainerPc : ""
          }`}
          style={{
            borderTopLeftRadius: !isPc ? 12 : 0,
            borderTopRightRadius: !isPc ? 12 : 0,
            borderTop: !isPc ? "1px solid #7B6857" : "none",
            ...(!isPc && {
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }),
          }}
        >
          {!isPc && (
            <div
              style={{
                background: "#5D4E37",
                padding: "0.8rem 1rem",
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                borderBottom: "1px solid #7B6857",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h3
                style={{
                  color: "#F5EFE0",
                  fontSize: "1.2rem",
                  fontWeight: 600,
                  margin: 0,
                  fontFamily: '"Cinzel", serif',
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                }}
              >
                Private Chat
              </h3>
            </div>
          )}
          <div
            style={{
              padding: "0.75rem 1rem",
              width: "100%",
              boxSizing: "border-box",
              textAlign: "left",
              borderBottom: "1px solid rgba(123, 104, 87, 0.3)",
              ...(!isPc && { flexShrink: 0 }),
            }}
          >
            <input
              id="private-chat-search-user"
              name="privateChatSearchUser"
              type="text"
              placeholder="Search user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px 12px",
                borderRadius: 0,
                border: "1px solid #7B6857",
                marginBottom: 10,
                background: "#6B5B47",
                color: "#F5EFE0",
                outline: "none",
                transition: "border-color 0.2s ease",
                fontSize: "1rem",
              }}
            />
            {filteredUsers.length > 0 && (
              <div
                style={{
                  background: "rgba(93, 78, 55, 0.4)",
                  border: "1px solid #7B6857",
                  borderRadius: 0,
                  maxHeight: 140,
                  overflowY: "auto",
                }}
              >
                {filteredUsers.map((u) => (
                  <div
                    key={u.uid}
                    style={{ padding: 8, cursor: "pointer", color: "#F5EFE0" }}
                    onClick={() => {
                      // Hvis brukeren er skjult, fjern fra hiddenChats og vis igjen
                      setHiddenChats((prev) => {
                        if (prev.includes(u.uid)) {
                          const updated = prev.filter((id) => id !== u.uid);
                          localStorage.setItem(
                            "hiddenPrivateChats",
                            JSON.stringify(updated),
                          );
                          return updated;
                        }
                        return prev;
                      });
                      // Alltid set selected user og åpne chat
                      const existing = activeChats.find(
                        (c) => c.user.uid === u.uid,
                      );
                      if (existing) {
                        setSelectedUser(existing.user);
                        setSearch("");
                        setIsCollapsed(false);
                      } else {
                        addChat(u);
                      }
                    }}
                  >
                    {u.displayName || u.name || u.uid}
                  </div>
                ))}
              </div>
            )}
            {activeChats.length > 0 && (
              <div className={styles.activeChatsRow}>
                {activeChats
                  .filter((c) => !hiddenChats.includes(c.user.uid))
                  .map((c) => {
                    const unread = getUnreadCount(c);
                    const isSelected = selectedUser?.uid === c.user.uid;
                    return (
                      <span
                        key={c.user.uid}
                        style={{
                          position: "relative",
                          display: "inline-flex",
                          alignItems: "center",
                        }}
                      >
                        <button
                          style={{
                            background: isSelected
                              ? "#7B6857"
                              : unread > 0
                                ? "#6B5B47"
                                : "#5D4E37",
                            color: isSelected
                              ? "#F5EFE0"
                              : unread > 0
                                ? "#ff4d4f"
                                : "#F5EFE0",
                            border: "1px solid #7B6857",
                            borderRadius: 0,
                            padding: "4px 10px",
                            cursor: "pointer",
                            position: "relative",
                            fontWeight: unread > 0 ? 700 : 400,
                          }}
                          onClick={async () => {
                            preparePrivateChatSound();
                            setSelectedUser(c.user);
                            setActiveChats((prev) => [...prev]);
                            const chatId = [currentUser.uid, c.user.uid]
                              .sort()
                              .join("_");
                            const msgsRef = collection(
                              db,
                              "privateMessages",
                              chatId,
                              "messages",
                            );
                            if (unread > 0) {
                              const { getDocs, writeBatch } =
                                await import("firebase/firestore");
                              const docsSnap = await getDocs(msgsRef);
                              const batch = writeBatch(db);
                              docsSnap.forEach((docSnap) => {
                                const data = docSnap.data();
                                if (data.to === currentUser.uid && !data.read) {
                                  batch.update(docSnap.ref, { read: true });
                                }
                              });
                              await batch.commit();
                            }
                          }}
                        >
                          {onlineUids.has(c.user.uid) && <span className={styles.privateChatOnlineDot} aria-hidden />}
                          {
                            (
                              c.user.displayName ||
                              c.user.name ||
                              c.user.uid
                            ).split(" ")[0]
                          }
                          {unread > 0 && (
                            <span
                              style={{
                                position: "absolute",
                                top: -6,
                                right: -6,
                                background: "#ff4d4f",
                                color: "#fff",
                                borderRadius: "50%",
                                width: 18,
                                height: 18,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 12,
                                fontWeight: 700,
                                boxShadow: "0 0 2px #000",
                              }}
                            >
                              {unread}
                            </span>
                          )}
                        </button>
                        <button
                          aria-label="Skjul chat"
                          style={{
                            background: "none",
                            border: "none",
                            color: "#ff4d4f",
                            fontWeight: 700,
                            fontSize: 16,
                            marginLeft: 2,
                            cursor: "pointer",
                            lineHeight: 1,
                          }}
                          onClick={() => {
                            setHiddenChats((prev) => {
                              const updated = [...prev, c.user.uid];
                              localStorage.setItem(
                                "hiddenPrivateChats",
                                JSON.stringify(updated),
                              );
                              // Hvis du skjuler en aktiv chat, fjern valgt bruker
                              if (selectedUser?.uid === c.user.uid)
                                setSelectedUser(null);
                              return updated;
                            });
                          }}
                          title="Skjul chat"
                        >
                          ✕
                        </button>
                      </span>
                    );
                  })}
              </div>
            )}
          </div>
          {selectedUser && (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                width: "100%",
              }}
            >
              <div
                className={styles.chatMessages}
                ref={chatBoxRef}
                style={{ flex: 1, minHeight: 0 }}
              >
                {selectedMessages.map((m, i) => {
                  const isLast = i === selectedMessages.length - 1;
                  return (
                    <div
                      key={i}
                      ref={isLast ? lastMessageRef : undefined}
                      className={
                        styles.privateMessageRow +
                        (m.from === currentUser?.uid ? " " + styles.me : "")
                      }
                    >
                      <div className={styles.privateMessageBubble}>
                        <img
                          src={
                            m.from === currentUser?.uid
                              ? currentUserData?.profileImageUrl ||
                                "/icons/avatar.svg"
                              : selectedUser.profileImageUrl ||
                                "/icons/avatar.svg"
                          }
                          alt="Profile"
                          className={styles.privateMessageProfilePic}
                        />
                        <div className={styles.privateMessageContent}>
                          <div
                            className={styles.privateMessageSender}
                            style={{
                              ...(m.potionEffects && m.potionEffects.glow
                                ? {
                                    textShadow:
                                      "0 0 10px #ffd700, 0 0 20px #ffd700, 0 0 30px #ffd700",
                                    color: "#ffd700",
                                  }
                                : {}),
                              ...(m.potionEffects && m.potionEffects.charm
                                ? {
                                    textShadow:
                                      "0 0 8px #ff69b4, 0 0 16px #ff1493, 0 0 24px #ff69b4",
                                    color: "#ff69b4",
                                  }
                                : {}),
                            }}
                          >
                            {m.from === currentUser?.uid
                              ? m.potionEffects && m.potionEffects.mystery
                                ? "???"
                                : "You"
                              : selectedUser.displayName ||
                                selectedUser.name ||
                                selectedUser.uid}
                            {m.potionEffects && m.potionEffects.charm && " 💕"}
                            {m.potionEffects && m.potionEffects.love && " 💖"}
                          </div>
                          <div style={{ position: "relative" }}>
                            {m.from === currentUser?.uid && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: -28,
                                  right: -10,
                                  zIndex: 3,
                                }}
                              >
                                <MessageMenu
                                  message={m}
                                  currentUser={currentUser}
                                  selectedUser={selectedUser}
                                  db={db}
                                  onEdit={(msg) => {
                                    setEditingMessage(msg);
                                    setMessage(msg.text);
                                  }}
                                />
                              </div>
                            )}
                            <span
                              style={{
                                display: "block",
                                wordBreak: "break-word",
                                whiteSpace: "normal",
                                overflowWrap: "break-word",
                                ...(m.potionEffects
                                  ? {
                                      ...(m.potionEffects.hairColor
                                        ? { color: m.potionEffects.hairColor }
                                        : {}),
                                      ...(m.potionEffects.rainbow
                                        ? {
                                            color: m.potionEffects.rainbowColor,
                                          }
                                        : {}),
                                      ...(m.potionEffects.shout
                                        ? {
                                            textTransform: "uppercase",
                                            fontWeight: "bold",
                                          }
                                        : {}),
                                    }
                                  : {}),
                              }}
                            >
                              {m.potionEffects && m.potionEffects.translation
                                ? translateText(m.text)
                                : m.text}
                            </span>
                          </div>
                          <div className={styles.privateMessageTimestamp}>
                            {m.timestamp && m.timestamp.seconds
                              ? new Date(
                                  m.timestamp.seconds * 1000,
                                ).toLocaleString("no-NO", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "2-digit",
                                })
                              : ""}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form
                className={`${styles.chatForm} ${styles.privateChatForm}${
                  !isPc ? " private-chat-form-mobile" : ""
                }`}
                onSubmit={sendMessage}
                style={{
                  width: "100%",
                  justifyContent: "flex-start",
                  boxSizing: "border-box",
                  ...(!isPc && {
                    flexShrink: 0,
                    paddingLeft: "env(safe-area-inset-left, 0.75rem)",
                    paddingRight: "env(safe-area-inset-right, 0.75rem)",
                  }),
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    flex: 1,
                    minWidth: 0,
                    width: "100%",
                  }}
                >
                  <input
                    id="private-chat-message"
                    name="privateChatMessage"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onFocus={preparePrivateChatSound}
                    type="text"
                    placeholder={
                      editingMessage
                        ? "Edit message..."
                        : `Message ${
                            selectedUser.displayName ||
                            selectedUser.name ||
                            selectedUser.uid
                          }...`
                    }
                    maxLength={200}
                    className={styles.chatInput}
                    style={{ flex: 1, minWidth: 0, width: 0 }}
                  />
                  <button
                    type="button"
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: 22,
                      cursor: "pointer",
                      color: "#F5EFE0",
                    }}
                    onClick={() => {
                      preparePrivateChatSound();
                      setShowEmoji((v) => !v);
                    }}
                    aria-label="Add emoji"
                  >
                    😊
                  </button>
                  {showEmoji && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 60,
                        right: 0,
                        zIndex: 9999,
                      }}
                    >
                      <Picker
                        data={data}
                        onEmojiSelect={(emoji) => {
                          setMessage(
                            (prev) =>
                              prev + (emoji.native || emoji.colons || ""),
                          );
                          setShowEmoji(false);
                        }}
                        theme="dark"
                      />
                    </div>
                  )}
                  {editingMessage && (
                    <button
                      type="button"
                      className={styles.chatBtn}
                      style={{ background: "#ff4d4f", marginLeft: 4 }}
                      onClick={() => {
                        setEditingMessage(null);
                        setMessage("");
                      }}
                    >
                      Cancel
                    </button>
                  )}
                  <button type="submit" className={styles.chatBtn}>
                    {editingMessage ? "Save" : "Send"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PrivateChat;
