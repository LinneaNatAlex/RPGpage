import { useState, useEffect } from "react";
import { useAuth } from "../../context/authContext";
import useUserRoles from "../../hooks/useUserRoles";
import { db } from "../../firebaseConfig";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
  collection,
  getDocs,
  writeBatch,
  onSnapshot,
  deleteField,
  query,
  orderBy,
  limit,
  startAfter,
} from "firebase/firestore";
import useUsers from "../../hooks/useUser";
import * as usersListStore from "../../utils/usersListStore";
import firebase from "firebase/compat/app";
import AgeVerificationAdmin from "../Forum/AgeVerificationAdmin";
import ShopProductAdmin from "./ShopProductAdmin";
import RulesAdmin from "./RulesAdmin";

export default function AdminPanel() {
  const { users } = useUsers();
  const { user } = useAuth();
  const { roles = [] } = useUserRoles();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState(0);
  const [status, setStatus] = useState("");

  // Force light theme to match the beige page theme
  const isDarkMode = false; // Always use light theme for admin panel

  // Light theme colors to match the beige page design
  const theme = {
    background: "#F5EFE0",
    text: "#2C2C2C",
    secondaryText: "#7B6857",
    border: "#D4C4A8",
    accent: "#ffd86b",
  };

  // Section cards: one per block, stacked vertically
  const sectionBox = {
    marginTop: 24,
    padding: 24,
    background: "#fff",
    borderRadius: 10,
    border: `1px solid ${theme.border}`,
    boxShadow: "0 2px 8px rgba(123, 104, 87, 0.12)",
  };
  const sectionTitle = (title, subtitle) => (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ color: theme.secondaryText, fontSize: "1.25rem", fontFamily: '"Cinzel", serif', fontWeight: 600, margin: 0 }}>
        {title}
      </h3>
      {subtitle && <p style={{ margin: "6px 0 0", fontSize: "0.9rem", color: theme.secondaryText, opacity: 0.95 }}>{subtitle}</p>}
    </div>
  );
  const subHeading = (text) => (
    <h4 style={{ color: theme.text, fontSize: "1rem", fontWeight: 600, margin: "20px 0 10px", borderBottom: `1px solid ${theme.border}`, paddingBottom: 6 }}>
      {text}
    </h4>
  );
  // Users section: inner card and form controls
  const userCard = { padding: 16, background: "rgba(123, 104, 87, 0.06)", borderRadius: 8, border: `1px solid ${theme.border}`, marginBottom: 16 };
  const inputStyle = { width: "100%", padding: "10px 12px", border: `1px solid ${theme.border}`, borderRadius: 8, background: "#fff", color: theme.text, fontSize: "0.95rem" };
  const labelStyle = { display: "block", marginBottom: 6, fontWeight: 600, color: theme.text, fontSize: "0.9rem" };
  const btnPrimary = { padding: "10px 18px", borderRadius: 8, fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", border: "none", background: "linear-gradient(135deg, #7B6857 0%, #8B7A6B 100%)", color: "#F5EFE0", fontFamily: '"Cinzel", serif' };
  const btnDanger = { ...btnPrimary, background: "linear-gradient(135deg, #c62828 0%, #b71c1c 100%)", color: "#fff" };
  const btnSuccess = { ...btnPrimary, background: "linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)", color: "#fff" };
  const btnWarning = { ...btnPrimary, background: "linear-gradient(135deg, #ed6c02 0%, #e65100 100%)", color: "#fff" };

  // Suspension/ban/IP-ban state
  const [suspendHours, setSuspendHours] = useState(0);
  const [suspendMinutes, setSuspendMinutes] = useState(0);
  const [banStatus, setBanStatus] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [ipBanStatus, setIpBanStatus] = useState("");
  const [showBanned, setShowBanned] = useState(false);

  // Detention state
  const [detentionStatus, setDetentionStatus] = useState("");

  const [pointsUser, setPointsUser] = useState("");
  const [pointsAmount, setPointsAmount] = useState("");
  const [pointsMessage, setPointsMessage] = useState("");
  const [unfaintStatus, setUnfaintStatus] = useState("");
  const [potionClearStatus, setPotionClearStatus] = useState("");
  const [chatClearStatus, setChatClearStatus] = useState("");
  const [backfillChatSenderUidStatus, setBackfillChatSenderUidStatus] = useState("");
  const [assignOldName, setAssignOldName] = useState("");
  const [assignOldNameToUid, setAssignOldNameToUid] = useState("");
  const [assignOldNameStatus, setAssignOldNameStatus] = useState("");
  const [privateChatClearStatus, setPrivateChatClearStatus] = useState("");
  const [vipStatus, setVipStatus] = useState("");
  const [giveAllVipStatus, setGiveAllVipStatus] = useState("");

  // Rediger bruker: navn, klassetrinn, rase, roller
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editClass, setEditClass] = useState("1st year");
  const [editRace, setEditRace] = useState("");
  const [editRoles, setEditRoles] = useState([]);
  const [editLeadForRole, setEditLeadForRole] = useState("");
  const [editUserStatus, setEditUserStatus] = useState("");
  const [roleToRemove, setRoleToRemove] = useState("");
  const AVAILABLE_ROLES = ["user", "admin", "professor", "headmaster", "shadowpatrol", "archivist"];
  const REMOVABLE_ROLES = ["admin", "professor", "headmaster", "shadowpatrol", "archivist"];
  const LEADABLE_ROLES = [
    { value: "archivist", label: "Archivist" },
    { value: "shadowpatrol", label: "Shadow Patrol" },
  ];
  const CLASS_OPTIONS = ["1st year", "2nd year", "3rd year", "4th year", "5th year", "6th year", "7th year", "graduated"];
  const RACE_OPTIONS = ["Witch", "Wizard", "Vampire", "Werewolf", "Elf"];

  // Global site dark mode (gjelder alle brukere – samme tema som dark mode-potion)
  const [globalDarkMode, setGlobalDarkMode] = useState(false);
  const [globalDarkModeStatus, setGlobalDarkModeStatus] = useState("");
  // Global site pink mode (Valentine's – admin-toggle)
  const [globalPinkMode, setGlobalPinkMode] = useState(false);
  const [globalPinkModeStatus, setGlobalPinkModeStatus] = useState("");
  const [starshadeMusicUrl, setStarshadeMusicUrl] = useState("");
  const [starshadeMusicStatus, setStarshadeMusicStatus] = useState("");
  useEffect(() => {
    if (!roles.includes("admin")) return;
    const configRef = doc(db, "config", "site");
    const unsub = onSnapshot(configRef, (snap) => {
      const data = snap.exists() ? snap.data() : {};
      setGlobalDarkMode(data.globalDarkMode === true);
      setGlobalPinkMode(data.globalPinkMode === true);
    }, () => {
      setGlobalDarkMode(false);
      setGlobalPinkMode(false);
    });
    return () => unsub();
  }, [roles]);

  async function handleToggleGlobalDarkMode(on) {
    if (!roles.includes("admin")) return;
    setGlobalDarkModeStatus("Saving...");
    try {
      await setDoc(doc(db, "config", "site"), { globalDarkMode: on }, { merge: true });
      setGlobalDarkModeStatus(on ? "Dark mode is on for the entire site." : "Dark mode is off for the entire site.");
      setTimeout(() => setGlobalDarkModeStatus(""), 3000);
    } catch (err) {
      setGlobalDarkModeStatus(`Error: ${err.message}`);
    }
  }

  async function handleToggleGlobalPinkMode(on) {
    if (!roles.includes("admin")) return;
    setGlobalPinkModeStatus("Saving...");
    try {
      await setDoc(doc(db, "config", "site"), { globalPinkMode: on }, { merge: true });
      setGlobalPinkModeStatus(on ? "Pink mode (Valentine's) is on for the entire site." : "Pink mode is off.");
      setTimeout(() => setGlobalPinkModeStatus(""), 3000);
    } catch (err) {
      setGlobalPinkModeStatus(`Error: ${err.message}`);
    }
  }

  useEffect(() => {
    if (!roles.includes("admin")) return;
    getDoc(doc(db, "config", "starshadeHall"))
      .then((snap) => {
        const data = snap.exists() ? snap.data() : {};
        setStarshadeMusicUrl(data.dailyMusicUrl || "");
      })
      .catch(() => setStarshadeMusicUrl(""));
  }, [roles]);

  async function handleSaveStarshadeMusic() {
    if (!roles.includes("admin")) return;
    setStarshadeMusicStatus("Saving...");
    try {
      await setDoc(doc(db, "config", "starshadeHall"), { dailyMusicUrl: starshadeMusicUrl.trim() || null }, { merge: true });
      setStarshadeMusicStatus("Saved. Music will play on the Starshade Hall page.");
      setTimeout(() => setStarshadeMusicStatus(""), 3000);
    } catch (err) {
      setStarshadeMusicStatus(`Error: ${err.message}`);
    }
  }

  const filtered = users.filter(
    (u) =>
      (u.displayName || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  // Synk rediger-feltene når valgt bruker endres
  useEffect(() => {
    if (selected) {
      setEditDisplayName(selected.displayName || "");
      setEditClass(
        selected.graduate || (selected.class && /^graduated?$/i.test(String(selected.class)))
          ? "graduated"
          : (selected.class || "1st year")
      );
      setEditRace(selected.race || "");
      setEditRoles(
        Array.isArray(selected.roles)
          ? Array.from(new Set([...selected.roles.map((r) => { const lower = String(r).toLowerCase(); return lower === "teacher" ? "professor" : lower; }), "user"]))
          : ["user"]
      );
      setEditLeadForRole(selected.leadForRole || "");
    }
  }, [selected]);

  // Banned users/IPs
  const bannedUsers = users.filter((u) => u.banned || u.bannedIp);

  async function handleNitsChange(delta) {
    if (!selected) return;
    if (!roles.includes("admin")) {
      setStatus("Only admin can change Nits.");
      return;
    }
    setStatus("Working...");
    const ref = doc(db, "users", selected.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return setStatus("User not found");
    const data = snap.data();
    const newNits = (data.currency || 0) + delta;
    await updateDoc(ref, { currency: newNits });
    setStatus(`Nits updated: ${newNits}`);
  }

  /** Give nits to all users (or subtract). Uses increment so no read needed per user. */
  async function handleNitsChangeAll(delta) {
    if (!roles.includes("admin")) {
      setStatus("Only admin can change Nits.");
      return;
    }
    if (users.length === 0) {
      setStatus("No users to update.");
      return;
    }
    setStatus("Working... (updating all users)");
    let done = 0;
    for (const u of users) {
      const ref = doc(db, "users", u.uid);
      await updateDoc(ref, { currency: increment(delta) });
      done++;
    }
    setStatus(
      `Nits updated for all ${done} users (${
        delta >= 0 ? "+" : ""
      }${delta} each).`
    );
  }

  // Pause user for X days
  async function handleSuspendUser() {
    if (!selected) return;
    if (!roles.includes("admin")) {
      setStatus("Only admin can suspend users.");
      return;
    }
    setStatus("Working...");
    const ref = doc(db, "users", selected.uid);
    const totalMs =
      (Number(suspendHours) * 60 + Number(suspendMinutes)) * 60 * 1000;
    const until = totalMs > 0 ? Date.now() + totalMs : null;
    // Hent eksisterende antall suspensjoner
    let suspCount = selected.suspensionCount || 0;
    if (until) suspCount++;
    await updateDoc(ref, {
      pausedUntil: until,
      suspendReason: suspendReason || null,
      suspensionCount: suspCount,
    });
    setStatus(
      `User suspended until ${
        until ? new Date(until).toLocaleString() : "cleared"
      }`
    );
  }

  // Ban user
  async function handleBanUser() {
    if (!selected) return;
    if (!roles.includes("admin")) {
      setBanStatus("Only admin can ban users.");
      return;
    }
    setBanStatus("Working...");
    const ref = doc(db, "users", selected.uid);
    await updateDoc(ref, { banned: true });
    setBanStatus("User banned.");
  }

  // Unban user
  async function handleUnbanUser() {
    if (!selected) return;
    if (!roles.includes("admin")) {
      setBanStatus("Bare admin kan oppheve ban.");
      return;
    }
    setBanStatus("Working...");
    const ref = doc(db, "users", selected.uid);
    await updateDoc(ref, { banned: false });
    setBanStatus("User unbanned.");
  }

  /** Get VIP expiry in ms from user doc (supports number or Firestore Timestamp). */
  function getVipExpiresAtMs(u) {
    const v = u?.vipExpiresAt;
    if (v == null) return null;
    return typeof v === "number" ? v : v?.toMillis?.() ?? null;
  }

  /** List of users with active VIP (expiry in the future). */
  const vipUsers = (users || []).filter(
    (u) => getVipExpiresAtMs(u) != null && getVipExpiresAtMs(u) > Date.now()
  );

  /** Remove VIP from a user (admin only). Pass user or use selected. */
  async function handleRemoveVip(userToUpdate) {
    const target = userToUpdate || selected;
    if (!target) return;
    if (!roles.includes("admin")) {
      setVipStatus("Only admin can remove VIP.");
      return;
    }
    setVipStatus("Working...");
    try {
      const ref = doc(db, "users", target.uid);
      await updateDoc(ref, { vipExpiresAt: deleteField() });
      setVipStatus(
        `VIP removed for ${target.displayName || target.email || target.uid}.`
      );
      usersListStore.invalidateAndRefetch();
      setTimeout(() => setVipStatus(""), 5000);
    } catch (err) {
      setVipStatus("Error: " + (err?.message || "Could not update."));
    }
  }

  /** Give all users VIP for 1 month (admin only). Uses batched writes. */
  async function handleGiveAllVipOneMonth() {
    if (!roles.includes("admin")) {
      setGiveAllVipStatus("Only admin can do this.");
      return;
    }
    if (
      !window.confirm(
        "Give ALL users VIP for 1 month? This will update every user in the database."
      )
    ) {
      return;
    }
    setGiveAllVipStatus("Working...");
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const oneMonthMs = 30 * 24 * 60 * 60 * 1000;
      const newExpiresAt = Date.now() + oneMonthMs;
      const BATCH_SIZE = 500;
      let committed = 0;
      let batch = writeBatch(db);
      let ops = 0;
      for (const d of snapshot.docs) {
        batch.update(doc(db, "users", d.id), { vipExpiresAt: newExpiresAt });
        ops++;
        if (ops >= BATCH_SIZE) {
          await batch.commit();
          committed += ops;
          ops = 0;
          batch = writeBatch(db);
        }
      }
      if (ops > 0) {
        await batch.commit();
        committed += ops;
      }
      setGiveAllVipStatus(`VIP for 1 month granted to all ${committed} users.`);
      usersListStore.invalidateAndRefetch();
      setTimeout(() => setGiveAllVipStatus(""), 8000);
    } catch (err) {
      setGiveAllVipStatus("Error: " + (err?.message || "Could not update."));
    }
  }

  /** Grant VIP for 1 month (admin only). Extends from now or from current expiry if still active. */
  async function handleGrantVipOneMonth() {
    if (!selected) return;
    if (!roles.includes("admin")) {
      setVipStatus("Kun admin kan gi VIP.");
      return;
    }
    setVipStatus("Working...");
    try {
      const ref = doc(db, "users", selected.uid);
      const snap = await getDoc(ref);
      const data = snap.exists() ? snap.data() : {};
      const now = Date.now();
      const current = data.vipExpiresAt;
      const currentMs =
        current == null
          ? null
          : typeof current === "number"
            ? current
            : current?.toMillis?.() ?? null;
      const base = currentMs != null && currentMs > now ? currentMs : now;
      const oneMonthMs = 30 * 24 * 60 * 60 * 1000;
      const newExpiresAt = base + oneMonthMs;
      await updateDoc(ref, { vipExpiresAt: newExpiresAt });
      setVipStatus(
        `VIP gitt til ${selected.displayName || selected.email || selected.uid} til ${new Date(newExpiresAt).toLocaleDateString()}.`
      );
      usersListStore.invalidateAndRefetch();
      setTimeout(() => setVipStatus(""), 5000);
    } catch (err) {
      setVipStatus("Feil: " + (err?.message || "Kunne ikke oppdatere."));
    }
  }

  // Detention functions
  async function handleDetentionUser() {
    if (!selected) return;
    if (
      !roles.includes("admin") &&
      !(roles.includes("professor") || roles.includes("teacher")) &&
      !roles.includes("shadowpatrol") &&
      !roles.includes("headmaster")
    ) {
      setDetentionStatus(
        "Only admin, professor, shadow patrol, or headmaster can assign detention."
      );
      return;
    }
    setDetentionStatus("Working...");
    try {
      const ref = doc(db, "users", selected.uid);
      const detentionUntil = Date.now() + 60 * 60 * 1000; // 1 hour from now
      await updateDoc(ref, {
        detentionUntil: detentionUntil,
        detentionReason: "Curfew violation or rule breaking",
      });
      setDetentionStatus(
        `User sent to detention until ${new Date(
          detentionUntil
        ).toLocaleString()}`
      );
    } catch (err) {
      console.error("Detention assign error:", err);
      setDetentionStatus(err?.message || "Failed to assign detention.");
    }
  }

  async function handleClearDetention() {
    if (!selected) return;
    if (
      !roles.includes("admin") &&
      !(roles.includes("professor") || roles.includes("teacher")) &&
      !roles.includes("shadowpatrol") &&
      !roles.includes("headmaster")
    ) {
      setDetentionStatus(
        "Only admin, professor, shadow patrol, or headmaster can clear detention."
      );
      return;
    }
    setDetentionStatus("Working...");
    try {
      const ref = doc(db, "users", selected.uid);
      await updateDoc(ref, {
        detentionUntil: deleteField(),
        detentionReason: deleteField(),
      });
      setDetentionStatus("Detention cleared.");
    } catch (err) {
      console.error("Clear detention error:", err);
      setDetentionStatus(err?.message || "Failed to clear detention.");
    }
  }

  // Ban IP
  async function handleBanIp(ip) {
    if (!ip) return;
    setIpBanStatus("Working...");
    // Ban all users with this IP
    const affected = users.filter((u) => u.ipAddress === ip);
    for (const u of affected) {
      await updateDoc(doc(db, "users", u.uid), { bannedIp: true });
    }
    setIpBanStatus(`IP ${ip} banned for all users.`);
  }

  // Unban IP
  async function handleUnbanIp(ip) {
    if (!ip) return;
    setIpBanStatus("Working...");
    const affected = users.filter((u) => u.ipAddress === ip);
    for (const u of affected) {
      await updateDoc(doc(db, "users", u.uid), { bannedIp: false });
    }
    setIpBanStatus(`IP ${ip} unbanned for all users.`);
  }

  const handleUnfaintUser = async () => {
    if (!selected) return;
    if (!roles.includes("admin")) {
      setUnfaintStatus("Only admin can unfaint users.");
      return;
    }
    setUnfaintStatus("Working...");
    try {
      const ref = doc(db, "users", selected.uid);
      await updateDoc(ref, {
        health: 100,
        infirmaryEnd: null,
      });
      setUnfaintStatus(
        `${
          selected.displayName || selected.email || selected.uid
        } has been recovered from the infirmary.`
      );
      setTimeout(() => setUnfaintStatus(""), 5000);
    } catch (err) {
      setUnfaintStatus("Error: " + err.message);
    }
  };

  /** Remove all potion effects from the selected user (admin only). */
  const handleRemovePotionEffects = async () => {
    if (!selected) return;
    if (!roles.includes("admin")) {
      setPotionClearStatus("Only admin can remove potion effects.");
      return;
    }
    setPotionClearStatus("Working...");
    try {
      const ref = doc(db, "users", selected.uid);
      await updateDoc(ref, {
        inLoveUntil: null,
        inLoveWith: null,
        hairColorUntil: null,
        rainbowUntil: null,
        glowUntil: null,
        sparkleUntil: null,
        translationUntil: null,
        echoUntil: null,
        whisperUntil: null,
        shoutUntil: null,
        darkModeUntil: null,
        retroUntil: null,
        mirrorUntil: null,
        speedUntil: null,
        slowMotionUntil: null,
        surveillanceUntil: null,
        luckyUntil: null,
        wisdomUntil: null,
        charmUntil: null,
        mysteryUntil: null,
        invisibleUntil: null,
      });
      const name = selected.displayName || selected.email || selected.uid;
      setPotionClearStatus(`All potion effects removed for ${name}.`);
      setTimeout(() => setPotionClearStatus(""), 5000);
    } catch (err) {
      setPotionClearStatus("Error: " + err.message);
    }
  };

  const handlePointsUpdate = async () => {
    setPointsMessage("");
    if (!pointsUser || !pointsAmount) {
      setPointsMessage("Please enter username and points");
      return;
    }
    try {
      // Finn bruker i users-arrayen
      const user = users.find(
        (u) =>
          (u.displayName &&
            u.displayName.toLowerCase() === pointsUser.toLowerCase()) ||
          (u.email && u.email.toLowerCase() === pointsUser.toLowerCase())
      );
      if (!user) {
        setPointsMessage("User not found");
        return;
      }
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        points: increment(Number(pointsAmount)),
      });
      setPointsMessage("Points updated!");
      // Tøm feltene etter vellykket oppdatering
      setPointsUser("");
      setPointsAmount("");
    } catch (err) {
      setPointsMessage("Error: " + err.message);
    }
  };

  async function handleSaveUserEdit() {
    if (!selected || !roles.includes("admin")) return;
    setEditUserStatus("Saving...");
    try {
      const ref = doc(db, "users", selected.uid);
      const classVal = String(editClass || "").trim().toLowerCase();
      const isGraduated = classVal === "graduated";
      const yearNum = isGraduated ? 7 : parseInt(editClass, 10) || 1;
      const newName = (editDisplayName || "").trim() || selected.displayName;
      const isProfessor = editRoles.includes("professor") || editRoles.includes("teacher");
      const update = {
        displayName: newName,
        class: isGraduated ? "Graduated" : editClass,
        graduate: isGraduated,
        year: yearNum,
        race: editRace || selected.race,
        roles: Array.from(new Set([...editRoles, "user"])),
        leadForRole: isProfessor && editLeadForRole ? editLeadForRole : null,
      };
      await updateDoc(ref, update);
      setSelected({ ...selected, ...update });
      setEditUserStatus("Saved. Changes are in Firestore.");
      setTimeout(() => setEditUserStatus(""), 4000);
      // Oppdater brukerlisten så Graduated vises riktig (ikke cache med gammel «7th year»)
      usersListStore.invalidateAndRefetch();
    } catch (err) {
      setEditUserStatus(`Error: ${err.message}`);
    }
  }

  function toggleEditRole(role) {
    if (role === "user") return;
    setEditRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  }
  function removeSelectedRole(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!roleToRemove) return;
    setEditRoles((prev) => prev.filter((r) => r !== roleToRemove));
    setRoleToRemove("");
  }

  async function clearAllGeneralChatMessages() {
    if (!roles.includes("admin")) {
      setChatClearStatus("Only admin can clear chat.");
      return;
    }
    setChatClearStatus("Clearing…");
    try {
      const messagesRef = collection(db, "messages");
      const BATCH_SIZE = 500;
      let totalDeleted = 0;
      while (true) {
        const snap = await getDocs(messagesRef);
        if (snap.empty) break;
        const batch = writeBatch(db);
        const toDelete = snap.docs.slice(0, BATCH_SIZE);
        toDelete.forEach((d) => batch.delete(d.ref));
        await batch.commit();
        totalDeleted += toDelete.length;
        if (toDelete.length < BATCH_SIZE) break;
      }
      setChatClearStatus(
        totalDeleted > 0
          ? `Done. Deleted ${totalDeleted} message(s) from general chat.`
          : "General chat was already empty."
      );
    } catch (error) {
      setChatClearStatus(`Error: ${error.message}`);
    }
  }

  /** Fill senderUid on old general-chat messages so chat shows current display name. */
  async function backfillChatSenderUid() {
    if (!roles.includes("admin")) {
      setBackfillChatSenderUidStatus("Only admin can run this.");
      return;
    }
    setBackfillChatSenderUidStatus("Running…");
    try {
      const messagesSnap = await getDocs(collection(db, "messages"));
      const usersSnap = await getDocs(collection(db, "users"));
      const usersList = usersSnap.docs.map((d) => ({ uid: d.id, ...d.data() }));
      const byDisplayName = new Map();
      usersList.forEach((u) => {
        const name = (u.displayName || "").trim().toLowerCase();
        if (!name) return;
        if (!byDisplayName.has(name)) byDisplayName.set(name, []);
        byDisplayName.get(name).push(u.uid);
      });
      let updated = 0;
      const BATCH_SIZE = 500;
      let batch = writeBatch(db);
      let ops = 0;
      for (const docSnap of messagesSnap.docs) {
        const data = docSnap.data();
        if (data.senderUid != null && data.senderUid !== "") continue;
        if (data.type === "notification") continue;
        const sender = (data.sender || "").trim();
        if (!sender) continue;
        const uids = byDisplayName.get(sender.toLowerCase());
        if (!uids || uids.length !== 1) continue;
        const messageRef = doc(db, "messages", docSnap.id);
        batch.update(messageRef, { senderUid: uids[0] });
        ops++;
        updated++;
        if (ops >= BATCH_SIZE) {
          await batch.commit();
          batch = writeBatch(db);
          ops = 0;
        }
      }
      if (ops > 0) await batch.commit();
      if (updated > 0) usersListStore.invalidateAndRefetch();
      setBackfillChatSenderUidStatus(
        updated > 0
          ? `Done. Set senderUid on ${updated} message(s). Refresh the chat page to see current names.`
          : "No messages needed updating (all have senderUid, or sender name did not match exactly one user). If you already renamed someone, use “Assign old sender name” below."
      );
    } catch (error) {
      setBackfillChatSenderUidStatus(`Error: ${error.message}`);
    }
  }

  /** Normalize sender name for comparison: collapse whitespace, trim, lowercase. */
  function normalizeSenderName(str) {
    return (str || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  /** Assign all messages with a given sender name (old name) to a selected user so chat shows their current name. */
  async function assignOldSenderNameToUser() {
    if (!roles.includes("admin")) {
      setAssignOldNameStatus("Only admin can run this.");
      return;
    }
    const name = (assignOldName || "").trim();
    if (!name) {
      setAssignOldNameStatus("Enter the old name that still appears in chat.");
      return;
    }
    if (!assignOldNameToUid) {
      setAssignOldNameStatus("Select the user those messages belong to.");
      return;
    }
    setAssignOldNameStatus("Running…");
    try {
      const key = normalizeSenderName(name);
      let updated = 0;
      const BATCH_SIZE = 500;
      const READ_BATCH = 500;
      let batch = writeBatch(db);
      let ops = 0;
      const messagesRef = collection(db, "messages");
      let lastDoc = null;
      let hasMore = true;
      while (hasMore) {
        const q = lastDoc
          ? query(
              messagesRef,
              orderBy("timestamp", "desc"),
              limit(READ_BATCH),
              startAfter(lastDoc),
            )
          : query(
              messagesRef,
              orderBy("timestamp", "desc"),
              limit(READ_BATCH),
            );
        const messagesSnap = await getDocs(q);
        if (messagesSnap.empty) break;
        for (const docSnap of messagesSnap.docs) {
          const data = docSnap.data();
          if (data.type === "notification") continue;
          const sender = normalizeSenderName(data.sender);
          if (sender !== key) continue;
          const messageRef = doc(db, "messages", docSnap.id);
          batch.update(messageRef, { senderUid: assignOldNameToUid });
          ops++;
          updated++;
          if (ops >= BATCH_SIZE) {
            await batch.commit();
            batch = writeBatch(db);
            ops = 0;
          }
        }
        lastDoc = messagesSnap.docs[messagesSnap.docs.length - 1];
        hasMore = messagesSnap.docs.length === READ_BATCH;
      }
      if (ops > 0) await batch.commit();
      if (updated > 0) usersListStore.invalidateAndRefetch();
      setAssignOldNameStatus(
        updated > 0
          ? `Done. Assigned ${updated} message(s) to the selected user. Refresh the chat page to see the new name.`
          : `No messages found with sender "${name}". Try normalizing spaces, or the name may be stored differently in the database.`
      );
    } catch (error) {
      setAssignOldNameStatus(`Error: ${error.message}`);
    }
  }

  async function clearAllPrivateChatMessages() {
    if (!roles.includes("admin")) {
      setPrivateChatClearStatus("Only admin can clear private chats.");
      return;
    }
    setPrivateChatClearStatus("Clearing…");
    try {
      const privateChatsRef = collection(db, "privateMessages");
      const chatsSnap = await getDocs(privateChatsRef);
      let totalDeleted = 0;
      const BATCH_SIZE = 500;
      for (const chatDoc of chatsSnap.docs) {
        const chatId = chatDoc.id;
        const messagesRef = collection(db, "privateMessages", chatId, "messages");
        while (true) {
          const snap = await getDocs(messagesRef);
          if (snap.empty) break;
          const batch = writeBatch(db);
          const toDelete = snap.docs.slice(0, BATCH_SIZE);
          toDelete.forEach((d) => batch.delete(d.ref));
          await batch.commit();
          totalDeleted += toDelete.length;
          if (toDelete.length < BATCH_SIZE) break;
        }
      }
      setPrivateChatClearStatus(
        totalDeleted > 0
          ? `Done. Deleted ${totalDeleted} private chat message(s).`
          : "No private chat messages found."
      );
    } catch (error) {
      setPrivateChatClearStatus(`Error: ${error.message}`);
    }
  }

  return (
    <div
      style={{
        maxWidth: 920,
        margin: "2rem auto",
        background: isDarkMode
          ? "linear-gradient(135deg, #5D4E37 0%, #6B5B47 100%)"
          : "linear-gradient(135deg, #F5EFE0 0%, #E8DDD4 100%)",
        color: theme.text,
        padding: 40,
        borderRadius: 12,
        boxShadow: isDarkMode
          ? "0 12px 48px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.2)"
          : "0 12px 48px rgba(139, 69, 19, 0.12), 0 4px 16px rgba(139, 69, 19, 0.08)",
        border: `2px solid ${theme.border}`,
        position: "relative",
        overflow: "visible",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: "linear-gradient(90deg, #D4C4A8 0%, #7B6857 50%, #D4C4A8 100%)",
          borderRadius: "12px 12px 0 0",
        }}
      />
      <h2
        style={{
          fontFamily: '"Cinzel", serif',
          fontSize: "2rem",
          fontWeight: 700,
          letterSpacing: "1px",
          marginBottom: 8,
          textAlign: "center",
          color: theme.text,
        }}
      >
        Admin Panel
      </h2>
      <p style={{ textAlign: "center", fontSize: "0.95rem", color: theme.secondaryText, marginBottom: 28 }}>
        Manage site settings, users, moderation, and chat below.
      </p>

      {/* 1. Site theme */}
      {roles.includes("admin") && (
        <div style={sectionBox}>
          {sectionTitle("Site theme", "Turn dark or pink mode on or off for the entire site.")}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                type="button"
                onClick={() => handleToggleGlobalDarkMode(!globalDarkMode)}
                style={{
                  background: "linear-gradient(135deg, #7B6857 0%, #8B7A6B 100%)",
                  color: "#F5EFE0",
                  border: "2px solid #D4C4A8",
                  borderRadius: 4,
                  padding: "10px 20px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: '"Cinzel", serif',
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
              >
                {globalDarkMode ? "✓ Dark On" : "Dark Off"}
              </button>
              <span style={{ color: theme.secondaryText, fontSize: "0.9rem" }}>
                {globalDarkMode ? "Light" : "Dark"} available
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                type="button"
                onClick={() => handleToggleGlobalPinkMode(!globalPinkMode)}
                style={{
                  background: globalPinkMode ? "linear-gradient(135deg, #c75d7a 0%, #d48494 100%)" : "linear-gradient(135deg, #e8a0b0 0%, #f0b0c0 100%)",
                  color: "#fff",
                  border: "2px solid #d48494",
                  borderRadius: 4,
                  padding: "10px 20px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: '"Cinzel", serif',
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              >
                {globalPinkMode ? "✓ Pink On" : "Pink Off"}
              </button>
              <span style={{ color: theme.secondaryText, fontSize: "0.9rem" }}>
                Valentine's theme
              </span>
            </div>
          </div>
          {(globalDarkModeStatus || globalPinkModeStatus) && (
            <div style={{ marginTop: 10, fontSize: "0.9rem", color: theme.secondaryText }}>
              {globalDarkModeStatus || globalPinkModeStatus}
            </div>
          )}
        </div>
      )}

      {/* Starshade Hall – background music */}
      {roles.includes("admin") && (
        <div style={sectionBox}>
          {sectionTitle("Starshade Hall – background music", "Set a YouTube link that plays as background music when users enter Starshade Hall. Only the audio is played; the video is not shown. Users can stop or start the music on the page.")}
          <label style={labelStyle}>YouTube link (e.g. watch or youtu.be)</label>
          <input
            type="url"
            value={starshadeMusicUrl}
            onChange={(e) => setStarshadeMusicUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
            style={{ ...inputStyle, maxWidth: 480 }}
          />
          <button
            type="button"
            onClick={handleSaveStarshadeMusic}
            style={{
              marginTop: 10,
              padding: "10px 20px",
              background: "linear-gradient(135deg, #7B6857 0%, #8B7A6B 100%)",
              color: "#F5EFE0",
              border: `2px solid ${theme.border}`,
              borderRadius: 8,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Save music link
          </button>
          {starshadeMusicStatus && (
            <div style={{ marginTop: 8, fontSize: "0.9rem", color: theme.secondaryText }}>{starshadeMusicStatus}</div>
          )}
        </div>
      )}

      {/* 2. Rules & shop */}
      {roles.includes("admin") && (
        <div style={sectionBox}>
          {sectionTitle("Rules & shop", "Edit site rules and manage shop items or books.")}
          <RulesAdmin />
        </div>
      )}

      {(roles.includes("admin") ||
        (roles.includes("professor") || roles.includes("teacher")) ||
        roles.includes("archivist")) && (
        <div style={sectionBox}>
          {sectionTitle("Shop & books", "Products and library.")}
          <ShopProductAdmin
            restrictToBooksOnly={
              roles.includes("archivist") &&
              !roles.includes("admin") &&
              !(roles.includes("professor") || roles.includes("teacher"))
            }
          />
        </div>
      )}

      {/* 3. Moderation: banned users & VIP */}
      {roles.includes("admin") && (
        <div style={sectionBox}>
          {sectionTitle("Moderation", "Banned users, IP bans, and VIP status.")}
          <button
            onClick={() => setShowBanned((v) => !v)}
            style={{
              background: "linear-gradient(135deg, #7B6857 0%, #8B7A6B 100%)",
              color: "#F5EFE0",
              border: `2px solid ${theme.border}`,
              borderRadius: 8,
              padding: "10px 20px",
              fontWeight: 600,
              fontSize: "0.95rem",
              cursor: "pointer",
              fontFamily: '"Cinzel", serif',
            }}
          >
            {showBanned ? "Hide banned users & IPs" : "Show banned users & IPs"}
          </button>
          {showBanned && (
            <div style={{ marginTop: 16, padding: 16, background: "rgba(0,0,0,0.05)", borderRadius: 8, border: `1px solid ${theme.border}` }}>
              <h4 style={{ margin: "0 0 12px", fontSize: "1rem", fontWeight: 600, color: theme.text }}>Banned users & IPs</h4>
          <ul style={{ maxHeight: 100, overflowY: "auto" }}>
            {bannedUsers.length === 0 && <li>No banned users/IPs.</li>}
            {bannedUsers.map((u) => (
              <li key={u.uid}>
                {u.displayName || u.email || u.uid} {u.banned && "(banned)"}{" "}
                {u.bannedIp && "(IP banned)"}
                <br />
                IP: {u.ipAddress || "unknown"}
                {u.ipAddress && (
                  <>
                    {!u.bannedIp ? (
                      <button
                        style={{ marginLeft: 8 }}
                        onClick={() => handleBanIp(u.ipAddress)}
                      >
                        Ban IP
                      </button>
                    ) : (
                      <button
                        style={{ marginLeft: 8 }}
                        onClick={() => handleUnbanIp(u.ipAddress)}
                      >
                        Unban IP
                      </button>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
          {ipBanStatus && <div style={{ color: "#ffd86b" }}>{ipBanStatus}</div>}
            </div>
          )}
          {subHeading(`VIP users (${vipUsers.length})`)}
          <ul style={{ maxHeight: 200, overflowY: "auto", margin: "0 0 16px", paddingLeft: 20 }}>
            {vipUsers.length === 0 && (
              <li style={{ color: theme.secondaryText }}>No users with active VIP.</li>
            )}
            {vipUsers.map((u) => {
              const expiresMs = getVipExpiresAtMs(u);
              const expiresStr =
                expiresMs != null
                  ? new Date(expiresMs).toLocaleString()
                  : "";
              return (
                <li
                  key={u.uid}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 8,
                    marginBottom: 8,
                    padding: "8px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <span style={{ color: theme.text }}>
                    {u.displayName || u.email || u.uid}
                    {expiresStr && (
                      <span style={{ color: theme.secondaryText, fontSize: "0.9rem", marginLeft: 8 }}>
                        – expires {expiresStr}
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveVip(u)}
                    style={{
                      background: "linear-gradient(135deg, #c62828 0%, #b71c1c 100%)",
                      color: "#F5EFE0",
                      border: "2px solid rgba(255, 255, 255, 0.2)",
                      borderRadius: 0,
                      padding: "6px 12px",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    Remove VIP
                  </button>
                </li>
              );
            })}
          </ul>
          <div style={{ marginTop: 16 }}>
            <button
              type="button"
              onClick={handleGiveAllVipOneMonth}
              style={{
                background: "linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)",
                color: "#F5EFE0",
                border: "2px solid rgba(255, 255, 255, 0.2)",
                borderRadius: 0,
                padding: "10px 20px",
                fontWeight: 600,
                fontSize: "0.95rem",
                cursor: "pointer",
              }}
            >
              Give all users VIP for 1 month
            </button>
            {giveAllVipStatus && (
              <div style={{ color: "#ffd86b", marginTop: 8 }}>{giveAllVipStatus}</div>
            )}
          </div>
        </div>
      )}

      {/* 4. Users: search, select, edit */}
      <div style={sectionBox}>
        {sectionTitle("Users", "Search for a user, then edit profile, roles, currency, or moderation.")}
        <label htmlFor="admin-user-search" style={labelStyle}>Search by name or email</label>
        <input
          id="admin-user-search"
          name="adminUserSearch"
          type="search"
          autoComplete="off"
          placeholder="Type to search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={inputStyle}
        />
      <p style={{ margin: "4px 0 12px", fontSize: "0.85rem", color: theme.secondaryText }}>
        {filtered.length} user{filtered.length !== 1 ? "s" : ""} found · showing up to 20
      </p>

      <ul
        style={{
          maxHeight: 220,
          overflowY: "auto",
          marginBottom: 16,
          padding: "8px 0",
          listStyle: "none",
          border: `1px solid ${theme.border}`,
          borderRadius: 8,
          background: "rgba(123, 104, 87, 0.04)",
        }}
      >
        {filtered.slice(0, 20).map(
          (
            u // Show max 20 in DOM but limit visible to ~5 with scroll
          ) => (
            <li
              key={u.uid}
              style={{
                cursor: "pointer",
                background:
                  selected?.uid === u.uid
                    ? isDarkMode
                      ? "linear-gradient(135deg, #7B6857 0%, #8B7A6B 100%)"
                      : "linear-gradient(135deg, #D4C4A8 0%, #C4B49A 100%)"
                    : isDarkMode
                    ? "rgba(245, 239, 224, 0.1)"
                    : "rgba(123, 104, 87, 0.1)",
                color: theme.text,
                padding: "10px 14px",
                margin: "0 8px 4px",
                borderRadius: 8,
                background: selected?.uid === u.uid ? "rgba(123, 104, 87, 0.2)" : "transparent",
                border: selected?.uid === u.uid ? `2px solid ${theme.secondaryText}` : "1px solid transparent",
                fontWeight: selected?.uid === u.uid ? 600 : 400,
              }}
              onClick={() => {
                setSelected(u);
                setPointsUser(u.displayName || u.email || "");
              }}
              onMouseEnter={(e) => {
                if (selected?.uid !== u.uid) {
                  e.target.style.background = "rgba(245, 239, 224, 0.2)";
                  e.target.style.transform = "translateY(-1px)";
                  e.target.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.2)";
                }
              }}
              onMouseLeave={(e) => {
                if (selected?.uid !== u.uid) {
                  e.target.style.background = "rgba(245, 239, 224, 0.1)";
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "none";
                }
              }}
            >
              {u.displayName || u.email || u.uid} <span style={{ color: theme.secondaryText, fontSize: "0.9rem" }}>({u.currency ?? 0} nits)</span>
            </li>
          )
        )}
        {filtered.length === 0 && (
          <li
            style={{
              color: theme.secondaryText,
              fontStyle: "italic",
              textAlign: "center",
              padding: "20px",
            }}
          >
            No users found matching "{search}"
          </li>
        )}
      </ul>
      {selected && roles.includes("admin") && (
        <div style={{ borderTop: `2px solid ${theme.border}`, paddingTop: 20 }}>
          <h3 style={{ color: theme.secondaryText, fontSize: "1.1rem", fontFamily: '"Cinzel", serif', marginBottom: 16 }}>
            Editing: {selected.displayName || selected.email || selected.uid}
          </h3>
          <div style={userCard}>
            <h4 style={{ margin: "0 0 12px", fontSize: "1rem", fontWeight: 600, color: theme.text }}>Profile</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Name</label>
                <input type="text" value={editDisplayName} onChange={(e) => setEditDisplayName(e.target.value)} style={inputStyle} placeholder="Display name" />
              </div>
              <div>
                <label style={labelStyle}>Class year</label>
                <select value={editClass} onChange={(e) => setEditClass(e.target.value)} style={inputStyle}>
                  {CLASS_OPTIONS.map((c) => <option key={c} value={c}>{c === "graduated" ? "Graduated" : c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Race</label>
              <select value={editRace} onChange={(e) => setEditRace(e.target.value)} style={inputStyle}>
                <option value="">— Select race —</option>
                {RACE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
              <div>
                <div style={{ marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, color: theme.text }}>Roles</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {AVAILABLE_ROLES.map((role) => (
                    <label
                      key={role}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        cursor: role === "user" ? "default" : "pointer",
                        opacity: role === "user" ? 0.85 : 1,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={editRoles.includes(role)}
                        onChange={() => toggleEditRole(role)}
                        disabled={role === "user"}
                      />
                      <span style={{ color: theme.text }}>
                        {role === "user" ? "user (always kept)" : role}
                      </span>
                    </label>
                  ))}
                </div>
                <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.9rem", color: theme.secondaryText }}>Remove one role:</span>
                  <select
                    value={roleToRemove}
                    onChange={(e) => setRoleToRemove(e.target.value)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 0,
                      background: theme.background,
                      color: theme.text,
                      border: "2px solid " + theme.border,
                      fontSize: "0.9rem",
                      minWidth: 140,
                    }}
                  >
                    <option value="">— Select role —</option>
                    {REMOVABLE_ROLES.filter((r) => editRoles.includes(r)).map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeSelectedRole(e); }}
                    disabled={!roleToRemove}
                    style={{
                      padding: "6px 12px",
                      fontSize: "0.9rem",
                      background: roleToRemove ? "rgba(139, 0, 0, 0.25)" : theme.background,
                      color: theme.text,
                      border: "1px solid " + theme.border,
                      borderRadius: 4,
                      cursor: roleToRemove ? "pointer" : "not-allowed",
                    }}
                  >
                    Remove
                  </button>
                </div>
                <p style={{ fontSize: "0.8rem", color: theme.secondaryText, marginTop: 6 }}>
                  The &quot;user&quot; role is always kept. Use the dropdown to remove a single role.
                </p>
              </div>
              {(editRoles.includes("professor") || editRoles.includes("teacher")) && (
                <div>
                  <div style={{ marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, color: theme.text }}>Lead for segment</span>
                  </div>
                  <select
                    value={editLeadForRole}
                    onChange={(e) => setEditLeadForRole(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 0,
                      background: theme.background,
                      color: theme.text,
                      border: "2px solid " + theme.border,
                      fontSize: "1rem",
                      minWidth: 200,
                    }}
                  >
                    <option value="">None</option>
                    {LEADABLE_ROLES.filter(({ value }) => {
                      const alreadyLead = users.find((u) => u.uid !== selected?.uid && u.leadForRole === value);
                      return !alreadyLead || selected?.leadForRole === value;
                    }).map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <p style={{ fontSize: "0.8rem", color: theme.secondaryText, marginTop: 4 }}>
                    Only one professor can be lead per segment. Gives access to segment overview and tasks in Professor Panel.
                  </p>
                </div>
              )}
              <button type="button" onClick={handleSaveUserEdit} style={btnPrimary}>
                Save profile
              </button>
              {editUserStatus && (
                <div style={{ color: theme.secondaryText, fontSize: "0.9rem" }}>{editUserStatus}</div>
              )}
          </div>

          <div style={userCard}>
            <h4 style={{ margin: "0 0 8px", fontSize: "1rem", fontWeight: 600, color: theme.text }}>Infirmary</h4>
            <p style={{ fontSize: "0.9rem", color: theme.secondaryText, marginBottom: 10 }}>
              Release selected user from infirmary (health 100, no wait).
            </p>
            <button onClick={handleUnfaintUser} style={{ ...btnPrimary, background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)" }}>
              Unfaint user
            </button>
            {unfaintStatus && (
              <div
                style={{
                  marginTop: 10,
                  padding: "8px 12px",
                  background: "rgba(33, 150, 243, 0.15)",
                  borderRadius: 0,
                  border: "1px solid rgba(33, 150, 243, 0.3)",
                  fontSize: "0.9rem",
                  color: theme.text,
                }}
              >
                {unfaintStatus}
              </div>
            )}
          </div>

          <div style={userCard}>
            <h4 style={{ margin: "0 0 8px", fontSize: "1rem", fontWeight: 600, color: theme.text }}>Potion effects</h4>
            <p style={{ fontSize: "0.9rem", color: theme.secondaryText, marginBottom: 10 }}>
              Remove all active potion effects (dark mode, love, sparkle, etc.) from selected user.
            </p>
            <button onClick={handleRemovePotionEffects} style={{ ...btnPrimary, background: "linear-gradient(135deg, #7b1fa2 0%, #6a1b9a 100%)" }}>
              Remove potion effects
            </button>
            {potionClearStatus && (
              <div
                style={{
                  marginTop: 10,
                  padding: "8px 12px",
                  background: "rgba(156, 39, 176, 0.15)",
                  borderRadius: 0,
                  border: "1px solid rgba(156, 39, 176, 0.3)",
                  fontSize: "0.9rem",
                  color: theme.text,
                }}
              >
                {potionClearStatus}
              </div>
            )}
          </div>

          <div style={userCard}>
            <h4 style={{ margin: "0 0 12px", fontSize: "1rem", fontWeight: 600, color: theme.text }}>Currency (nits)</h4>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
              <label htmlFor="admin-nits-amount" style={{ fontWeight: 600, color: theme.text }}>Amount</label>
              <input
                id="admin-nits-amount"
                name="nitsAmount"
                type="number"
                autoComplete="off"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                style={{ ...inputStyle, width: 90 }}
              />
            <button
              onClick={() => handleNitsChange(amount)}
              style={{
                background: "linear-gradient(135deg, #4caf50 0%, #388e3c 100%)",
                color: "#F5EFE0",
                border: "2px solid rgba(255, 255, 255, 0.2)",
                borderRadius: 0,
                padding: "8px 16px",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow:
                  "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                fontFamily: '"Cinzel", serif',
                letterSpacing: "0.5px",
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
              + Nits
            </button>
            <button
              onClick={() => handleNitsChange(-amount)}
              style={{
                background: "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)",
                color: "#F5EFE0",
                border: "2px solid rgba(255, 255, 255, 0.2)",
                borderRadius: 0,
                padding: "8px 16px",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow:
                  "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                fontFamily: '"Cinzel", serif',
                letterSpacing: "0.5px",
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
              - Nits
            </button>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: 8,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                color: theme.secondaryText,
                fontSize: "0.9rem",
                marginRight: 4,
              }}
            >
              Give to all users ({users.length}):
            </span>
            <button
              onClick={() => handleNitsChangeAll(amount)}
              style={{
                background: "linear-gradient(135deg, #2196F3 0%, #1976D2 100%)",
                color: "#F5EFE0",
                border: "2px solid rgba(255, 255, 255, 0.2)",
                borderRadius: 0,
                padding: "8px 16px",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow:
                  "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                fontFamily: '"Cinzel", serif',
                letterSpacing: "0.5px",
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
              + Nits to all
            </button>
            <button
              onClick={() => handleNitsChangeAll(-amount)}
              style={{
                background: "linear-gradient(135deg, #ff9800 0%, #e65100 100%)",
                color: "#F5EFE0",
                border: "2px solid rgba(255, 255, 255, 0.2)",
                borderRadius: 0,
                padding: "8px 16px",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow:
                  "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                fontFamily: '"Cinzel", serif',
                letterSpacing: "0.5px",
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
              - Nits to all
            </button>
          </div>
          </div>
          <div style={userCard}>
            <h4 style={{ margin: "0 0 12px", fontSize: "1rem", fontWeight: 600, color: theme.text }}>Suspend / ban</h4>
            <label htmlFor="admin-suspend-hours" style={{ display: "block", marginBottom: 4, fontSize: "0.9rem", color: theme.text }}>
              Suspension (hours):
              <input
                id="admin-suspend-hours"
                name="suspendHours"
                type="number"
                autoComplete="off"
                min={0}
                value={suspendHours}
                onChange={(e) => setSuspendHours(Number(e.target.value))}
                style={{ width: 50, marginLeft: 4 }}
              />
            </label>
            <label htmlFor="admin-suspend-minutes" style={{ marginLeft: 8 }}>
              Minutes:
              <input
                id="admin-suspend-minutes"
                name="suspendMinutes"
                type="number"
                autoComplete="off"
                min={0}
                max={59}
                value={suspendMinutes}
                onChange={(e) => setSuspendMinutes(Number(e.target.value))}
                style={{ width: 50, marginLeft: 4 }}
              />
            </label>
            <label
              htmlFor="admin-suspend-reason"
              style={{ display: "block", marginTop: 8 }}
            >
              Reason (optional):
            </label>
            <input
              id="admin-suspend-reason"
              name="suspendReason"
              type="text"
              autoComplete="off"
              placeholder="Reason for suspension (optional)"
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              style={{
                width: "100%",
                margin: "8px 0",
                padding: 4,
                borderRadius: 0,
              }}
            />
            <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
              <button
                onClick={handleSuspendUser}
                style={{
                  background:
                    "linear-gradient(135deg, #ff9800 0%, #f57c00 100%)",
                  color: "#F5EFE0",
                  border: "2px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: 0,
                  padding: "8px 16px",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow:
                    "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                  fontFamily: '"Cinzel", serif',
                  letterSpacing: "0.5px",
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
                Set suspension
              </button>
              <button
                onClick={() => {
                  setSuspendHours(0);
                  setSuspendMinutes(0);
                  setSuspendReason("");
                  handleSuspendUser();
                }}
                style={{
                  background:
                    "linear-gradient(135deg, #D4C4A8 0%, #B8A082 100%)",
                  color: "#2C2C2C",
                  border: "2px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: 0,
                  padding: "8px 16px",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow:
                    "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                  fontFamily: '"Cinzel", serif',
                  letterSpacing: "0.5px",
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
                Clear suspension
              </button>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
              <button
                onClick={handleBanUser}
                style={{
                  background:
                    "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)",
                  color: "#F5EFE0",
                  border: "2px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: 0,
                  padding: "8px 16px",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow:
                    "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                  fontFamily: '"Cinzel", serif',
                  letterSpacing: "0.5px",
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
                Ban user
              </button>
              <button
                onClick={handleUnbanUser}
                style={{
                  background:
                    "linear-gradient(135deg, #4caf50 0%, #388e3c 100%)",
                  color: "#F5EFE0",
                  border: "2px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: 0,
                  padding: "8px 16px",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow:
                    "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                  fontFamily: '"Cinzel", serif',
                  letterSpacing: "0.5px",
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
                Unban user
              </button>
            </div>
            {banStatus && <div style={{ color: "#ffd86b" }}>{banStatus}</div>}
            {selected.pausedUntil && selected.pausedUntil > Date.now() && (
              <div style={{ color: "#ffd86b" }}>
                Suspended until:{" "}
                {new Date(selected.pausedUntil).toLocaleString()}
              </div>
            )}
            {typeof selected.suspensionCount === "number" && (
              <div style={{ color: "#ffd86b", marginTop: 4 }}>
                Suspensions: <b>{selected.suspensionCount}</b>
              </div>
            )}
            {selected.banned && (
              <div style={{ color: "#ffd86b" }}>User is banned</div>
            )}
            {selected.bannedIp && (
              <div style={{ color: "#ffd86b" }}>User's IP is banned</div>
            )}

            {/* VIP – admin can grant 1 month */}
            {roles.includes("admin") && (
              <div
                style={{
                  marginTop: 20,
                  paddingTop: 20,
                  borderTop: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                <h4>VIP</h4>
                {selected.vipExpiresAt != null && (
                  <div style={{ color: "#ffd86b", marginBottom: 8 }}>
                    VIP utløper:{" "}
                    {new Date(
                      typeof selected.vipExpiresAt === "number"
                        ? selected.vipExpiresAt
                        : selected.vipExpiresAt?.toMillis?.() ?? 0
                    ).toLocaleString()}
                  </div>
                )}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                  <button
                    onClick={handleGrantVipOneMonth}
                    style={{
                      background:
                        "linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)",
                      color: "#F5EFE0",
                      border: "2px solid rgba(255, 255, 255, 0.2)",
                      borderRadius: 0,
                      padding: "8px 16px",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      boxShadow:
                        "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
                      textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                      fontFamily: '"Cinzel", serif',
                      letterSpacing: "0.5px",
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
                    Gi VIP i 1 måned
                  </button>
                  <button
                    onClick={() => handleRemoveVip()}
                    style={{
                      background: "linear-gradient(135deg, #c62828 0%, #b71c1c 100%)",
                      color: "#F5EFE0",
                      border: "2px solid rgba(255, 255, 255, 0.2)",
                      borderRadius: 0,
                      padding: "8px 16px",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      cursor: "pointer",
                    }}
                  >
                    Remove VIP
                  </button>
                </div>
                {vipStatus && (
                  <div style={{ color: "#ffd86b", marginTop: 8 }}>{vipStatus}</div>
                )}
              </div>
            )}

            {/* Detention Controls - only admin, professor, shadow patrol, headmaster (not archivist) */}
            {(roles.includes("admin") || roles.includes("professor") || roles.includes("teacher") || roles.includes("shadowpatrol") || roles.includes("headmaster")) && (
            <div
              style={{
                marginTop: 20,
                paddingTop: 20,
                borderTop: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <h4>Detention Controls</h4>
              <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                <button
                  onClick={handleDetentionUser}
                  style={{
                    background:
                      "linear-gradient(135deg, #ff5722 0%, #d84315 100%)",
                    color: "#F5EFE0",
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: 0,
                    padding: "8px 16px",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow:
                      "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
                    textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                    fontFamily: '"Cinzel", serif',
                    letterSpacing: "0.5px",
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
                  Send to Detention
                </button>
                <button
                  onClick={handleClearDetention}
                  style={{
                    background:
                      "linear-gradient(135deg, #4caf50 0%, #388e3c 100%)",
                    color: "#F5EFE0",
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: 0,
                    padding: "8px 16px",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow:
                      "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
                    textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                    fontFamily: '"Cinzel", serif',
                    letterSpacing: "0.5px",
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
                  Clear Detention
                </button>
              </div>
              {detentionStatus && (
                <div style={{ color: "#ffd86b", marginTop: 8 }}>
                  {detentionStatus}
                </div>
              )}
              {selected.detentionUntil &&
                selected.detentionUntil > Date.now() && (
                  <div style={{ color: "#ffd86b", marginTop: 8 }}>
                    In detention until:{" "}
                    {new Date(selected.detentionUntil).toLocaleString()}
                  </div>
                )}
            </div>
            )}
          </div>
        </div>
      )}
      {status && <div style={{ color: "#ff0", marginTop: 8 }}>{status}</div>}

      {/* Points – admin and professor only */}
      {(roles.includes("admin") || roles.includes("professor") || roles.includes("teacher")) && (
        <>
          {subHeading("Add / subtract points")}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label
              htmlFor="admin-points-username"
              style={{ fontWeight: 600, color: "#D4C4A8" }}
            >
              Username or email
            </label>
            <input
              id="admin-points-username"
              name="pointsUser"
              type="text"
              autoComplete="username"
              placeholder="Username or email"
              value={pointsUser}
              onChange={(e) => setPointsUser(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 0,
                border: "2px solid #D4C4A8",
                background: "#F5EFE0",
                color: "#2C2C2C",
                fontSize: "1rem",
                fontFamily: '"Segoe UI", "Roboto", "Arial", sans-serif',
                outline: "none",
                transition: "all 0.3s ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#7B6857";
                e.target.style.boxShadow = "0 0 16px rgba(123, 104, 87, 0.4)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#D4C4A8";
                e.target.style.boxShadow = "none";
              }}
            />
            <label
              htmlFor="admin-points-amount"
              style={{ fontWeight: 600, color: "#D4C4A8" }}
            >
              Number of points (+/-)
            </label>
            <input
              id="admin-points-amount"
              name="pointsAmount"
              type="number"
              autoComplete="off"
              placeholder="Number of points (+/-)"
              value={pointsAmount}
              onChange={(e) => setPointsAmount(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 0,
                border: "2px solid #D4C4A8",
                background: "#F5EFE0",
                color: "#2C2C2C",
                fontSize: "1rem",
                fontFamily: '"Segoe UI", "Roboto", "Arial", sans-serif',
                outline: "none",
                transition: "all 0.3s ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#7B6857";
                e.target.style.boxShadow = "0 0 16px rgba(123, 104, 87, 0.4)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#D4C4A8";
                e.target.style.boxShadow = "none";
              }}
            />
            <button
              onClick={handlePointsUpdate}
              style={{
                background: "linear-gradient(135deg, #7B6857 0%, #8B7A6B 100%)",
                color: "#F5EFE0",
                border: "2px solid rgba(255, 255, 255, 0.2)",
                borderRadius: 0,
                padding: "12px 24px",
                fontWeight: 600,
                fontSize: "1rem",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow:
                  "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                fontFamily: '"Cinzel", serif',
                letterSpacing: "0.5px",
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
              Update points
            </button>
            {pointsMessage && (
              <div
                style={{
                  color: "#ffd86b",
                  marginTop: 8,
                  padding: "8px 12px",
                  background: "rgba(255, 216, 107, 0.1)",
                  borderRadius: 8,
                  border: "1px solid rgba(255, 216, 107, 0.3)",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                }}
              >
                {pointsMessage}
              </div>
            )}
          </div>
        </>
      )}
      </div>

      {/* 5. General chat (admin only) */}
      {roles.includes("admin") && (
        <div style={sectionBox}>
          {sectionTitle("General chat", "Fix display names on old messages or clear all messages.")}
          {subHeading("Display names")}
          <p style={{ marginBottom: 12, color: theme.secondaryText, fontSize: "0.9rem" }}>
            Fill in senderUid on old messages so chat shows current names. Run before renaming users for best results.
          </p>
          <button
            type="button"
            onClick={backfillChatSenderUid}
            style={{
              padding: "10px 20px",
              marginRight: 10,
              background: theme.accent,
              color: theme.text,
              border: "none",
              borderRadius: 0,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Fill senderUid on old messages
          </button>
          {backfillChatSenderUidStatus && (
            <div style={{ marginTop: 12, fontSize: "0.9rem", color: theme.secondaryText }}>
              {backfillChatSenderUidStatus}
            </div>
          )}
          <p style={{ marginTop: 20, marginBottom: 8, color: theme.secondaryText, fontSize: "0.95rem" }}>
            Already renamed someone? Enter the <strong>old full name</strong> and assign those messages to the correct user:
          </p>
          <p style={{ marginBottom: 8, color: theme.secondaryText, fontSize: "0.85rem", opacity: 0.9 }}>
            Chat shows first + last name only; the database stores the full name (including middle name). Use the full name here.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <input
              type="text"
              placeholder="Old full name (e.g. with middle name)"
              value={assignOldName}
              onChange={(e) => setAssignOldName(e.target.value)}
              style={{ padding: "8px 12px", minWidth: 180, border: `1px solid ${theme.border}` }}
            />
            <select
              value={assignOldNameToUid}
              onChange={(e) => setAssignOldNameToUid(e.target.value)}
              style={{ padding: "8px 12px", minWidth: 160, border: `1px solid ${theme.border}` }}
            >
              <option value="">Select user</option>
              {(users || []).map((u) => (
                <option key={u.uid || u.id} value={u.uid || u.id}>
                  {u.displayName || u.uid || "—"}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={assignOldSenderNameToUser}
              style={{
                padding: "8px 16px",
                background: theme.accent,
                color: theme.text,
                border: "none",
                borderRadius: 0,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Assign old sender name to user
            </button>
          </div>
          {assignOldNameStatus && (
            <div style={{ marginBottom: 12, fontSize: "0.9rem", color: theme.secondaryText }}>
              {assignOldNameStatus}
            </div>
          )}
          {subHeading("Clear messages")}
          <p style={{ marginBottom: 12, color: theme.secondaryText, fontSize: "0.9rem" }}>
            Remove all messages from the main chat. Cannot be undone.
          </p>
          <button
            type="button"
            onClick={clearAllGeneralChatMessages}
            style={{
              padding: "10px 20px",
              background: "#c62828",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Clear all general chat messages
          </button>
          {chatClearStatus && (
            <div style={{ marginTop: 12, fontSize: "0.9rem", color: theme.secondaryText }}>
              {chatClearStatus}
            </div>
          )}
        </div>
      )}

      {/* 6. Private chat (admin only) */}
      {roles.includes("admin") && (
        <div style={sectionBox}>
          {sectionTitle("Private chat", "Clear all private conversations. Cannot be undone.")}
          <button
            type="button"
            onClick={clearAllPrivateChatMessages}
            style={{
              padding: "10px 20px",
              background: "#c62828",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Clear all private chat messages
          </button>
          {privateChatClearStatus && (
            <div style={{ marginTop: 12, fontSize: "0.9rem", color: theme.secondaryText }}>
              {privateChatClearStatus}
            </div>
          )}
        </div>
      )}

      {/* 7. Age verification */}
      <div style={sectionBox}>
        {sectionTitle("Age verification", "Approve or reject 18+ forum access requests.")}
        <AgeVerificationAdmin />
      </div>
    </div>
  );
}
