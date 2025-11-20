import React, { useState, useEffect } from "react";
import { getRPGCalendar, isBirthdayToday, getRPGMonthLength } from "../utils/rpgCalendar";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Link } from "react-router-dom";
import { getRaceColor } from "../utils/raceColors";

export default function RPGCalendarSidebar() {
  const today = new Date();
  const weekDays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  // RPG Time state
  const [rpgTime, setRpgTime] = useState({
    rpgDay: 1,
    rpgHour: 0,
    rpgMinute: 0,
    rpgYear: 1,
    rpgMonth: 1,
    dayRange: { start: 1, end: 7 }
  });

  // Birthday users state
  const [birthdayUsers, setBirthdayUsers] = useState([]);
  const [loadingBirthdays, setLoadingBirthdays] = useState(true);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);

  // Update RPG Time every second
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
      const timeIntoCurrentRPGDay = (realHour % hoursPerRPGDay) + (realMinute / 60) + (realSecond / 3600);
      const rpgHour = Math.floor(timeIntoCurrentRPGDay * 24 / hoursPerRPGDay);
      const rpgMinute = Math.floor(((timeIntoCurrentRPGDay * 24 / hoursPerRPGDay) % 1) * 60);
      
      setRpgTime({
        rpgDay,
        rpgHour: Math.min(rpgHour, 23),
        rpgMinute,
        rpgYear: calendar.rpgYear,
        rpgMonth: calendar.rpgMonth,
        dayRange: rpgRange
      });
    };

    // Update immediately
    updateRPGTime();
    
    // Update every second
    const interval = setInterval(updateRPGTime, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Fetch users with birthdays today
  useEffect(() => {
    const fetchBirthdayUsers = async () => {
      try {
        setLoadingBirthdays(true);
        const now = new Date();
        const snapshot = await getDocs(collection(db, "users"));
        const usersWithBirthday = [];
        
        snapshot.forEach((doc) => {
          const userData = doc.data();
          if (
            userData.birthdayMonth &&
            userData.birthdayDay &&
            isBirthdayToday(userData.birthdayMonth, userData.birthdayDay, now)
          ) {
            usersWithBirthday.push({
              uid: doc.id,
              displayName: userData.displayName || userData.email || "Unknown",
              profileImageUrl: userData.profileImageUrl,
              roles: userData.roles || [],
              race: userData.race,
            });
          }
        });

        setBirthdayUsers(usersWithBirthday);
      } catch (error) {
        console.error("Error fetching birthday users:", error);
      } finally {
        setLoadingBirthdays(false);
      }
    };

    fetchBirthdayUsers();
    
    // Refresh every hour to catch new birthdays
    const interval = setInterval(fetchBirthdayUsers, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch upcoming birthdays for next month
  useEffect(() => {
    const fetchUpcomingBirthdays = async () => {
      try {
        setLoadingUpcoming(true);
        const now = new Date();
        const calendar = getRPGCalendar(now);
        const { rpgMonth, rpgYear } = calendar;
        
        // Calculate next month (wraps around to month 1 if month 12)
        const nextMonth = rpgMonth === 12 ? 1 : rpgMonth + 1;
        const nextYear = rpgMonth === 12 ? rpgYear + 1 : rpgYear;
        
        const snapshot = await getDocs(collection(db, "users"));
        const upcoming = [];
        
        snapshot.forEach((doc) => {
          const userData = doc.data();
          if (
            userData.birthdayMonth &&
            userData.birthdayDay &&
            userData.birthdayMonth === nextMonth
          ) {
            upcoming.push({
              uid: doc.id,
              displayName: userData.displayName || userData.email || "Unknown",
              profileImageUrl: userData.profileImageUrl,
              birthdayDay: userData.birthdayDay,
              roles: userData.roles || [],
              race: userData.race,
            });
          }
        });

        // Sort by birthday day
        upcoming.sort((a, b) => a.birthdayDay - b.birthdayDay);
        setUpcomingBirthdays(upcoming);
      } catch (error) {
        console.error("Error fetching upcoming birthdays:", error);
      } finally {
        setLoadingUpcoming(false);
      }
    };

    fetchUpcomingBirthdays();
    
    // Refresh every hour
    const interval = setInterval(fetchUpcomingBirthdays, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (hour, minute) => {
    const displayHour = hour > 12 ? hour - 12 : hour;
    const ampm = hour < 12 ? 'AM' : 'PM';
    return `${displayHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${ampm}`;
  };

  const getDayName = (day) => {
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayOfWeek = new Date().getDay();
    return dayNames[dayOfWeek];
  };

  // Month names in English
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

  // Bruk fellesmodul for RPG-kalender
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

  // Returner JSX for kalenderen
  return (
    <aside
      style={{
        background: "#E8DDD4",
        color: "#2C2C2C",
        borderRadius: 12,
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
      }}
    >
      <h3
        style={{
          color: "#D4C4A8",
          marginBottom: 8,
          fontSize: 18,
          letterSpacing: 0.5,
          fontWeight: "bold",
        }}
      >
        School Calendar
      </h3>
      
      {/* RPG Time Display */}
      <div
        style={{
          background: "rgba(212, 196, 168, 0.2)",
          borderRadius: 8,
          padding: "12px",
          marginBottom: "16px",
          border: "1px solid #D4C4A8",
          textAlign: "center",
          width: "100%"
        }}
      >
        <div
          style={{
            color: "#D4C4A8",
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 4
          }}
        >
          RPG Time
        </div>
        <div
          style={{
            color: "#F5EFE0",
            fontSize: 20,
            fontWeight: 700,
            marginBottom: 4,
            textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)"
          }}
        >
          {formatTime(rpgTime.rpgHour, rpgTime.rpgMinute)}
        </div>
        <div
          style={{
            color: "#D4C4A8",
            fontSize: 12,
            marginBottom: 4
          }}
        >
          Day {rpgTime.rpgDay} of {rpgTime.rpgMonth}/{rpgTime.rpgYear}
        </div>
        <div
          style={{
            color: "#B8A082",
            fontSize: 10,
            borderTop: "1px solid rgba(212, 196, 168, 0.3)",
            paddingTop: 4
          }}
        >
          Real: {getDayName()} {rpgTime.dayRange.start}-{rpgTime.dayRange.end}
        </div>
      </div>
      <div style={{ fontSize: 14, marginBottom: 4, fontWeight: 600, color: "#D4C4A8" }}>
        {monthNames[(rpgMonth || 1) - 1]}, Year {rpgYear}
      </div>
      <div style={{ fontSize: 12, marginBottom: 12, color: "#B8A082" }}>
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
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 4,
          width: "100%",
          marginBottom: 8,
        }}
      >
        {weekDays.map((wd, i) => (
          <div
            key={wd}
            style={{
              textAlign: "center",
              fontWeight: 600,
              color: "#D4C4A8",
              fontSize: 11,
              letterSpacing: 0.5,
            }}
          >
            {wd.slice(0, 3)}
          </div>
        ))}
        {weekDates.map((date, i) => {
          const isToday = date.toDateString() === today.toDateString();
          const rpgRange = rpgDaysThisWeek[i];
          return (
            <div
              key={i}
              style={{
                textAlign: "center",
                padding: 5,
                borderRadius: 7,
                background: isToday ? "#2C2C2C" : "#E8DDD4",
                color: isToday ? "#F5EFE0" : "#D4C4A8",
                fontWeight: isToday ? 700 : 400,
                border: isToday ? "2px solid #D4C4A8" : "1px solid #E0D5C7",
                fontSize: 11,
                minWidth: 0,
                boxShadow: isToday ? "0 0 8px rgba(0, 0, 0, 0.2)" : undefined,
              }}
            >
              {date.getDate()}
              <br />
              <span
                style={{ fontSize: 10, color: isToday ? "#F5EFE0" : "#B8A082" }}
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
      <div style={{ fontSize: 10, color: "#B8A082", marginBottom: 8 }}>
        {weekDates[0].toLocaleDateString("en-US")} -{" "}
        {weekDates[6].toLocaleDateString("en-US")}
      </div>
      <div
        style={{
          marginTop: 8,
          fontSize: 10,
          color: "#D4C4A8",
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

      {/* Birthday Users List */}
      {birthdayUsers.length > 0 && (
        <div
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: "1px solid rgba(212, 196, 168, 0.3)",
            width: "100%",
          }}
        >
          <div
            style={{
              color: "#D4C4A8",
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
              let nameColor = "#F5EFE0"; // Default color
              if (user.roles?.some((r) => r.toLowerCase() === "headmaster")) {
                nameColor = "#fff";
              } else if (user.roles?.some((r) => r.toLowerCase() === "teacher")) {
                nameColor = "gold";
              } else if (user.roles?.some((r) => r.toLowerCase() === "shadowpatrol")) {
                nameColor = "#1ecb8c";
              } else if (user.roles?.some((r) => r.toLowerCase() === "admin")) {
                nameColor = "#ff5e5e";
              } else if (user.roles?.some((r) => r.toLowerCase() === "archivist")) {
                nameColor = "#a084e8";
              } else {
                // Use race color for students without roles
                nameColor = getRaceColor(user.race);
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
                    borderRadius: 6,
                    background: "rgba(212, 196, 168, 0.1)",
                    textDecoration: "none",
                    color: "#F5EFE0",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(212, 196, 168, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(212, 196, 168, 0.1)";
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
                      border: "1px solid rgba(212, 196, 168, 0.3)",
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

      {/* Upcoming Birthdays List */}
      {upcomingBirthdays.length > 0 && (
        <div
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: "1px solid rgba(212, 196, 168, 0.3)",
            width: "100%",
          }}
        >
          <div
            style={{
              color: "#D4C4A8",
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
              let nameColor = "#F5EFE0"; // Default color
              if (user.roles?.some((r) => r.toLowerCase() === "headmaster")) {
                nameColor = "#fff";
              } else if (user.roles?.some((r) => r.toLowerCase() === "teacher")) {
                nameColor = "gold";
              } else if (user.roles?.some((r) => r.toLowerCase() === "shadowpatrol")) {
                nameColor = "#1ecb8c";
              } else if (user.roles?.some((r) => r.toLowerCase() === "admin")) {
                nameColor = "#ff5e5e";
              } else if (user.roles?.some((r) => r.toLowerCase() === "archivist")) {
                nameColor = "#a084e8";
              } else {
                // Use race color for students without roles
                nameColor = getRaceColor(user.race);
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
                    borderRadius: 6,
                    background: "rgba(212, 196, 168, 0.1)",
                    textDecoration: "none",
                    color: "#F5EFE0",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(212, 196, 168, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(212, 196, 168, 0.1)";
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
                      border: "1px solid rgba(212, 196, 168, 0.3)",
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
                        color: "#B8A082",
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