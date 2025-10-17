import React, { useState, useEffect } from "react";
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

  // RPG Time state
  const [rpgTime, setRpgTime] = useState({
    rpgDay: 1,
    rpgHour: 0,
    rpgMinute: 0,
    rpgYear: 1,
    rpgMonth: 1,
    dayRange: { start: 1, end: 7 }
  });

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
        {weekDates[0].toLocaleDateString("no-NO")} -{" "}
        {weekDates[6].toLocaleDateString("no-NO")}
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
      
    </aside>
  );
}