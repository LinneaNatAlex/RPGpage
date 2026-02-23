/**
 * RPG Calendar Sidebar
 * Viser skolekalender med RPG-tid, ukevisning (Mon–Sun), og bursdager.
 * Bruker getRPGCalendar() fra utils/rpgCalendar for å mappe virkelige dager til RPG-dager.
 */
import React, { useState, useEffect } from "react";
import {
  getRPGCalendar,
  isBirthdayToday,
  getRPGMonthLength,
} from "../utils/rpgCalendar";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Link } from "react-router-dom";

export default function RPGCalendarSidebar() {
  const today = new Date();

  // ---------- Ukedager (brukes i kalender-header og grid) ----------
  const weekDays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  // ---------- State: RPG-tid (oppdateres hvert sekund) ----------
  const [rpgTime, setRpgTime] = useState({
    rpgDay: 1,
    rpgHour: 0,
    rpgMinute: 0,
    rpgYear: 1,
    rpgMonth: 1,
    dayRange: { start: 1, end: 7 },
  });

  // ---------- State: Bursdager (i dag + neste måned) ----------
  const [birthdayUsers, setBirthdayUsers] = useState([]);
  const [loadingBirthdays, setLoadingBirthdays] = useState(true);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);

  // ---------- Effect: Oppdater RPG-tid hvert sekund (klokke + hvilken RPG-dag) ----------
  useEffect(() => {
    const updateRPGTime = () => {
      const now = new Date();
      const calendar = getRPGCalendar(now);

      // Find which day of the IRL week it is (0 = Monday, 6 = Sunday)
      const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
      const rpgRange = calendar.rpgDaysThisWeek[dayOfWeek];

      const realHour = now.getHours();
      const realMinute = now.getMinutes();
      const realSecond = now.getSeconds();

      // Calculate how many RPG days this IRL day covers
      const rpgDaysInThisRealDay = rpgRange.end - rpgRange.start + 1;

      // Divide 24 hours by number of RPG days to get hours per RPG day
      const hoursPerRPGDay = 24 / rpgDaysInThisRealDay;

      // Calculate which RPG day it is based on IRL time
      const rpgDayIndex = Math.floor(realHour / hoursPerRPGDay);
      const rpgDay = Math.min(rpgRange.start + rpgDayIndex, rpgRange.end);

      // Calculate RPG hour based on how far we are into this RPG day
      const timeIntoCurrentRPGDay =
        (realHour % hoursPerRPGDay) + realMinute / 60 + realSecond / 3600;
      const rpgHour = Math.floor((timeIntoCurrentRPGDay * 24) / hoursPerRPGDay);
      const rpgMinute = Math.floor(
        (((timeIntoCurrentRPGDay * 24) / hoursPerRPGDay) % 1) * 60,
      );

      setRpgTime({
        rpgDay,
        rpgHour: Math.min(rpgHour, 23),
        rpgMinute,
        rpgYear: calendar.rpgYear,
        rpgMonth: calendar.rpgMonth,
        dayRange: rpgRange,
      });
    };

    // Update immediately
    updateRPGTime();

    // Update every second
    const interval = setInterval(updateRPGTime, 1000);

    return () => clearInterval(interval);
  }, []);

  // ---------- Effect: Hent bursdager i dag + neste måned med ÉN getDocs (sparer Firestore reads) ----------
  useEffect(() => {
    const fetchBirthdays = async () => {
      try {
        setLoadingBirthdays(true);
        setLoadingUpcoming(true);
        const now = new Date();
        const calendar = getRPGCalendar(now);
        const nextMonth = calendar.rpgMonth === 12 ? 1 : calendar.rpgMonth + 1;

        const snapshot = await getDocs(collection(db, "users"));
        const usersWithBirthday = [];
        const upcoming = [];

        snapshot.forEach((docSnap) => {
          const userData = docSnap.data();
          if (!userData.birthdayMonth || userData.birthdayDay == null) return;

          if (
            isBirthdayToday(
              userData.birthdayMonth,
              userData.birthdayDay,
              now,
            )
          ) {
            usersWithBirthday.push({
              uid: docSnap.id,
              displayName:
                userData.displayName || userData.email || "Unknown",
              profileImageUrl: userData.profileImageUrl,
              roles: userData.roles || [],
              race: userData.race,
            });
          }

          if (Number(userData.birthdayMonth) === nextMonth) {
            upcoming.push({
              uid: docSnap.id,
              displayName:
                userData.displayName || userData.email || "Unknown",
              profileImageUrl: userData.profileImageUrl,
              birthdayDay: userData.birthdayDay,
              roles: userData.roles || [],
              race: userData.race,
            });
          }
        });

        upcoming.sort((a, b) => a.birthdayDay - b.birthdayDay);
        setBirthdayUsers(usersWithBirthday);
        setUpcomingBirthdays(upcoming);
      } catch (error) {
        console.error("Error fetching birthday users:", error);
      } finally {
        setLoadingBirthdays(false);
        setLoadingUpcoming(false);
      }
    };

    fetchBirthdays();
    const interval = setInterval(fetchBirthdays, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // ---------- Hjelpefunksjoner: tid og dag ----------
  const formatTime = (hour, minute) => {
    const displayHour = hour > 12 ? hour - 12 : hour;
    const ampm = hour < 12 ? "AM" : "PM";
    return `${displayHour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")} ${ampm}`;
  };

  const getDayName = (day) => {
    const dayNames = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    const dayOfWeek = new Date().getDay();
    return dayNames[dayOfWeek];
  };

  // ---------- Månedsnavn (engelsk) ----------
  const monthNames = [
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
  ];

  // ---------- Hent ukedatoer og RPG-dagsintervall fra utils/rpgCalendar ----------
  const {
    rpgYear,
    rpgMonth,
    rpgWeek,
    rpgDayOfWeek,
    rpgDayNum,
    dayOfYear,
    weekDates,
    rpgDaysThisWeek,
  } = getRPGCalendar(today);

  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.getAttribute("data-theme") === "dark";

  const asideStyle = isDark
    ? {
        background: "#252525",
        color: "#f5f5f5",
        borderRadius: 0,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
        border: "1px solid #444",
        padding: "1.5rem",
        margin: 0,
        minWidth: 280,
        maxWidth: 320,
        fontFamily: "inherit",
        fontSize: 16,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }
    : {
        background: "#E8DDD4",
        color: "#2C2C2C",
        borderRadius: 0,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        border: "1px solid #D4C4A8",
        padding: "1.5rem",
        margin: 0,
        minWidth: 280,
        maxWidth: 320,
        fontFamily: "inherit",
        fontSize: 16,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      };

  const titleColor = isDark ? "#f5f5f5" : "#D4C4A8";
  const mutedColor = isDark ? "#d0d0d0" : "#D4C4A8";
  const subColor = isDark ? "#b0b0b0" : "#B8A082";
  const boxBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(212, 196, 168, 0.2)";
  const boxBorder = isDark ? "#444" : "#D4C4A8";
  const cellBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(212, 196, 168, 0.15)";
  const todayBg = isDark ? "rgba(255,255,255,0.15)" : "rgba(212, 196, 168, 0.35)";
  const linkBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(212, 196, 168, 0.1)";
  const linkBgHover = isDark ? "rgba(255,255,255,0.12)" : "rgba(212, 196, 168, 0.2)";
  const borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(212, 196, 168, 0.3)";

  // ========== RENDERING: Sidebar-container ==========
  return (
    <aside style={asideStyle}>
      {/* ----- Tittel ----- */}
      <h3
        style={{
          color: titleColor,
          marginBottom: 8,
          fontSize: 18,
          letterSpacing: 0.5,
          fontWeight: "bold",
        }}
      >
        School Calendar
      </h3>

      {/* ----- RPG-tid: klokke + dag/måned/år + "Real: Mon X–Y" ----- */}
      <div
        style={{
          background: boxBg,
          borderRadius: 0,
          padding: "12px",
          marginBottom: "16px",
          border: `1px solid ${boxBorder}`,
          textAlign: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            color: mutedColor,
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 4,
          }}
        >
          RPG Time
        </div>
        <div
          style={{
            color: isDark ? "#f5f5f5" : "#F5EFE0",
            fontSize: 20,
            fontWeight: 700,
            marginBottom: 4,
            textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
          }}
        >
          {formatTime(rpgTime.rpgHour, rpgTime.rpgMinute)}
        </div>
        <div
          style={{
            color: mutedColor,
            fontSize: 12,
            marginBottom: 4,
          }}
        >
          Day {rpgTime.rpgDay} of {rpgTime.rpgMonth}/{rpgTime.rpgYear}
        </div>
        <div
          style={{
            color: subColor,
            fontSize: 10,
            borderTop: `1px solid ${borderColor}`,
            paddingTop: 4,
          }}
        >
          Real: {getDayName()} {rpgTime.dayRange.start}-{rpgTime.dayRange.end}
        </div>
      </div>

      {/* ----- Måned/år + nedtelling til ukeslutt ----- */}
      <div
        style={{
          fontSize: 14,
          marginBottom: 4,
          fontWeight: 600,
          color: mutedColor,
        }}
      >
        {monthNames[(rpgMonth || 1) - 1]}, Year {rpgYear}
      </div>
      <div style={{ fontSize: 12, marginBottom: 12, color: subColor }}>
        Days left in this week:{" "}
        {(() => {
          // Countdown to end of current IRL week (Sunday 23:59:59)
          const now = new Date();
          const daysUntilSunday =
            6 - (now.getDay() === 0 ? 6 : now.getDay() - 1);
          const weekEnd = new Date(now);
          weekEnd.setDate(now.getDate() + daysUntilSunday);
          weekEnd.setHours(23, 59, 59, 999);
          const msToWeekEnd = weekEnd - now;
          const d = Math.floor(msToWeekEnd / (1000 * 60 * 60 * 24));
          const h = Math.floor((msToWeekEnd / (1000 * 60 * 60)) % 24);
          const m = Math.floor((msToWeekEnd / (1000 * 60)) % 60);
          const s = Math.floor((msToWeekEnd / 1000) % 60);
          return `${d}d ${h}h ${m}m ${s}s`;
        })()}
      </div>

      {/* ----- Ukevisning: Mon–Sun + 7 dag-celler (dato + "Days X–Y") ----- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 4,
          width: "100%",
          marginBottom: 8,
        }}
      >
        {/* Ukedags-header (Mon, Tue, …) */}
        {weekDays.map((wd, i) => (
          <div
            key={wd}
            style={{
              textAlign: "center",
              fontWeight: 600,
              color: mutedColor,
              fontSize: 11,
              letterSpacing: 0.5,
            }}
          >
            {wd.slice(0, 3)}
          </div>
        ))}
        {/* Dag-celler: virkelig dato + RPG-dagsintervall; dagens dato highlightes */}
        {weekDates.map((date, i) => {
          const isToday = date.toDateString() === today.toDateString();
          const rpgRange = rpgDaysThisWeek[i];
          return (
            <div
              key={i}
              style={{
                textAlign: "center",
                padding: 5,
                borderRadius: 0,
                background: isToday ? todayBg : cellBg,
                color: isToday ? (isDark ? "#f5f5f5" : "#F5EFE0") : mutedColor,
                fontWeight: isToday ? 700 : 400,
                border: isToday ? `2px solid ${boxBorder}` : `1px solid ${isDark ? "#555" : "#E0D5C7"}`,
                fontSize: 10,
                minWidth: 0,
                boxShadow: isToday ? "0 0 8px rgba(0, 0, 0, 0.2)" : undefined,
              }}
            >
              {date.getDate()}
              <br />
              <span
                style={{ fontSize: 8, color: isToday ? (isDark ? "#f5f5f5" : "#F5EFE0") : subColor }}
              >
                Days {rpgRange.start}
                {rpgRange.start !== rpgRange.end ? `–${rpgRange.end}` : ""}
                {rpgDayNum >= rpgRange.start && rpgDayNum <= rpgRange.end && (
                  <b> ←</b>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {/* ----- Uke-datointervall (f.eks. 2/9/2026 - 2/15/2026) ----- */}
      <div style={{ fontSize: 10, color: subColor, marginBottom: 8 }}>
        {weekDates[0].toLocaleDateString("en-US")} -{" "}
        {weekDates[6].toLocaleDateString("en-US")}
      </div>

      {/* ----- Forklaringstekst under kalenderen ----- */}
      <div
        style={{
          marginTop: 8,
          fontSize: 10,
          color: mutedColor,
          textAlign: "center",
          lineHeight: 1.4,
        }}
      >
        Each RPG month has 30 or 31 days, distributed evenly across the real
        week.
        <br />
        The calendar always starts at Year 1, Month 1, Day 1.
        <br />
        The highlighted day shows today. The numbers below each day show which
        RPG days are covered by that real day.
      </div>

      {/* ----- Bursdager i dag (liste med lenker til brukerprofiler) ----- */}
      {birthdayUsers.length > 0 && (
        <div
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: `1px solid ${borderColor}`,
            width: "100%",
          }}
        >
          <div
            style={{
              color: mutedColor,
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            Birthdays Today
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              maxHeight: 200,
              overflowY: "auto",
            }}
          >
            {birthdayUsers.map((user) => {
              // Determine name color based on role or race
              let nameColor = isDark ? "#f5f5f5" : "#F5EFE0"; // Default color
              if (user.roles?.some((r) => r.toLowerCase() === "headmaster")) {
                nameColor = "#fff";
              } else if (
                user.roles?.some((r) => (r || "").toLowerCase() === "professor" || (r || "").toLowerCase() === "teacher")
              ) {
                nameColor = "gold";
              } else if (
                user.roles?.some((r) => r.toLowerCase() === "shadowpatrol")
              ) {
                nameColor = "#1ecb8c";
              } else if (user.roles?.some((r) => r.toLowerCase() === "admin")) {
                nameColor = "#ff5e5e";
              } else if (
                user.roles?.some((r) => r.toLowerCase() === "archivist")
              ) {
                nameColor = "#a084e8";
              } else {
                // Users without staff role: only default (reddish) color on names
                nameColor = "#B85C4A";
              }

              return (
                <Link
                  key={user.uid}
                  to={`/user/${user.uid}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: 6,
                    borderRadius: 0,
                    background: linkBg,
                    textDecoration: "none",
                    color: isDark ? "#f5f5f5" : "#F5EFE0",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = linkBgHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = linkBg;
                  }}
                >
                  <img
                    src={user.profileImageUrl || "/icons/avatar.svg"}
                    alt={user.displayName}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: `1px solid ${borderColor}`,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      flex: 1,
                      color: nameColor,
                      textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)",
                    }}
                  >
                    {user.displayName}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ----- Bursdager neste måned (liste med Day X) ----- */}
      {upcomingBirthdays.length > 0 && (
        <div
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: `1px solid ${borderColor}`,
            width: "100%",
          }}
        >
          <div
            style={{
              color: mutedColor,
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            Upcoming Birthdays Next Month
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              maxHeight: 250,
              overflowY: "auto",
            }}
          >
            {upcomingBirthdays.map((user) => {
              // Determine name color based on role or race
              let nameColor = isDark ? "#f5f5f5" : "#F5EFE0"; // Default color
              if (user.roles?.some((r) => r.toLowerCase() === "headmaster")) {
                nameColor = "#fff";
              } else if (
                user.roles?.some((r) => (r || "").toLowerCase() === "professor" || (r || "").toLowerCase() === "teacher")
              ) {
                nameColor = "gold";
              } else if (
                user.roles?.some((r) => r.toLowerCase() === "shadowpatrol")
              ) {
                nameColor = "#1ecb8c";
              } else if (user.roles?.some((r) => r.toLowerCase() === "admin")) {
                nameColor = "#ff5e5e";
              } else if (
                user.roles?.some((r) => r.toLowerCase() === "archivist")
              ) {
                nameColor = "#a084e8";
              } else {
                // Users without staff role: only default (reddish) color on names
                nameColor = "#B85C4A";
              }

              return (
                <Link
                  key={user.uid}
                  to={`/user/${user.uid}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: 6,
                    borderRadius: 0,
                    background: linkBg,
                    textDecoration: "none",
                    color: isDark ? "#f5f5f5" : "#F5EFE0",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = linkBgHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = linkBg;
                  }}
                >
                  <img
                    src={user.profileImageUrl || "/icons/avatar.svg"}
                    alt={user.displayName}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: `1px solid ${borderColor}`,
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        color: nameColor,
                        textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)",
                      }}
                    >
                      {user.displayName}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        color: subColor,
                      }}
                    >
                      Day {user.birthdayDay}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
