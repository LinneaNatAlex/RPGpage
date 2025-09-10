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
  // Bruk fellesmodul for RPG-kalender
  const {
    rpgYear,
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
        background: "#23232b",
        color: "#fff",
        borderRadius: 16,
        boxShadow: "0 2px 12px rgba(124,94,191,0.10)",
        padding: 24,
        margin: 16,
        minWidth: 260,
        maxWidth: 340,
        fontFamily: "inherit",
        fontSize: 18,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <h3
        style={{
          color: "#a084e8",
          marginBottom: 4,
          fontSize: 19,
          letterSpacing: 0.5,
        }}
      >
        School Calendar
      </h3>
      <div style={{ fontSize: 14, marginBottom: 2, fontWeight: 600 }}>
        Year 1, Week 1
      </div>
      <div style={{ fontSize: 12, marginBottom: 8, color: "#ffe084" }}>
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
              color: "#a084e8",
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
                background: isToday ? "#a084e8" : "#23232b",
                color: isToday ? "#23232b" : "#fff",
                fontWeight: isToday ? 700 : 400,
                border: isToday ? "2px solid #fff" : "1px solid #393959",
                fontSize: 11,
                minWidth: 0,
                boxShadow: isToday ? "0 0 8px #a084e8" : undefined,
              }}
            >
              {date.getDate()}
              <br />
              <span
                style={{ fontSize: 10, color: isToday ? "#23232b" : "#b0aac2" }}
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
      <div style={{ fontSize: 10, color: "#b0aac2", marginBottom: 4 }}>
        {weekDates[0].toLocaleDateString()} -{" "}
        {weekDates[6].toLocaleDateString()}
      </div>
      <div
        style={{
          marginTop: 4,
          fontSize: 10,
          color: "#e0e0e0",
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
