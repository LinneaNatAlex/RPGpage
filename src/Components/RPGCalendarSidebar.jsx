import React from "react";
import { getRPGCalendar } from "../utils/rpgCalendar";

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

  // Månedsnavn på norsk/engelsk
  const monthNames = [
    "Januar",
    "Februar",
    "Mars",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Desember",
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
          color: "#8B4513",
          marginBottom: 8,
          fontSize: 18,
          letterSpacing: 0.5,
          fontWeight: "bold",
        }}
      >
        School Calendar
      </h3>
      <div style={{ fontSize: 14, marginBottom: 4, fontWeight: 600, color: "#2C2C2C" }}>
        {monthNames[(rpgMonth || 1) - 1]}, Year {rpgYear}
      </div>
      <div style={{ fontSize: 12, marginBottom: 12, color: "#7B6857" }}>
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
              color: "#8B4513",
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
                color: isToday ? "#F5EFE0" : "#2C2C2C",
                fontWeight: isToday ? 700 : 400,
                border: isToday ? "2px solid #8B4513" : "1px solid #E0D5C7",
                fontSize: 11,
                minWidth: 0,
                boxShadow: isToday ? "0 0 8px rgba(0, 0, 0, 0.2)" : undefined,
              }}
            >
              {date.getDate()}
              <br />
              <span
                style={{ fontSize: 10, color: isToday ? "#F5EFE0" : "#7B6857" }}
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
      <div style={{ fontSize: 10, color: "#7B6857", marginBottom: 8 }}>
        {weekDates[0].toLocaleDateString()} -{" "}
        {weekDates[6].toLocaleDateString()}
      </div>
      <div
        style={{
          marginTop: 8,
          fontSize: 10,
          color: "#2C2C2C",
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
    </aside>
  );
}