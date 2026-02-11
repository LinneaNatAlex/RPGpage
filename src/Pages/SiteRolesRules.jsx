import React from "react";

const ROLES = [
  {
    name: "Headmaster",
    color: "#ffffff",
    colorLabel: "White",
    description:
      "Leads the magical school. Can edit class descriptions and class info in classrooms. Highest authority in the role hierarchy. Names appear in white on the site.",
  },
  {
    name: "Teacher",
    color: "gold",
    colorLabel: "Gold",
    description:
      "Runs classrooms, can delete messages in class chat, edit class info, and post news. Has access to the Teacher panel and classroom management. Names appear in gold.",
  },
  {
    name: "Admin",
    color: "#ff5e5e",
    colorLabel: "Red",
    description:
      "Full site management: Admin panel (users, shop products, announcements), age verification requests, and all teacher abilities. Names appear in red.",
  },
  {
    name: "Archivist",
    color: "#a084e8",
    colorLabel: "Purple",
    description:
      "Curates content: can post and delete news, access teacher-related areas, and test shop items (e.g. potions). Names appear in purple.",
  },
  {
    name: "Shadow Patrol",
    color: "#1ecb8c",
    colorLabel: "Mint green",
    description:
      "Moderation and safety: helps keep the community safe. Names appear in mint green in chat and user lists.",
  },
];

const SiteRolesRules = () => {
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;
  const containerStyle = {
    maxWidth: 900,
    margin: isMobile ? "20px auto" : "40px auto",
    background: "linear-gradient(135deg, #5D4E37 0%, #6B5B47 100%)",
    color: isMobile ? "#FFD700" : "#F5EFE0",
    borderRadius: 0,
    padding: isMobile ? 20 : 40,
    boxShadow: "0 12px 48px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.2)",
    border: "3px solid #7B6857",
    position: "relative",
    overflow: "hidden",
    zIndex: 1,
  };
  return (
    <div style={containerStyle}>
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
      <h1
        style={{
          textAlign: "center",
          color: isMobile ? "#FFD700" : "#F5EFE0",
          fontFamily: '"Cinzel", serif',
          fontSize: isMobile ? "2rem" : "2.5rem",
          fontWeight: 700,
          letterSpacing: "2px",
          textShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
          marginBottom: "0.5rem",
        }}
      >
        Roles on the Site
      </h1>
      <p
        style={{
          textAlign: "center",
          marginBottom: "2rem",
          fontSize: isMobile ? "0.95rem" : "1.05rem",
          opacity: 0.95,
        }}
      >
        Staff and special roles, their colors, and what they do.
      </p>

      <div
        style={{
          background: "rgba(245, 239, 224, 0.1)",
          borderRadius: 0,
          padding: 24,
          border: "2px solid rgba(255, 255, 255, 0.2)",
          boxShadow:
            "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
        }}
      >
        {ROLES.map((role) => (
          <div
            key={role.name}
            style={{
              marginBottom: 28,
              paddingBottom: 28,
              borderBottom:
                ROLES.indexOf(role) < ROLES.length - 1
                  ? "1px solid rgba(255, 255, 255, 0.15)"
                  : "none",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 10,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  backgroundColor: role.color,
                  border:
                    role.color === "#ffffff"
                      ? "2px solid rgba(255,255,255,0.6)"
                      : "none",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                }}
                aria-hidden
              />
              <h2
                style={{
                  margin: 0,
                  fontFamily: '"Cinzel", serif',
                  fontSize: isMobile ? "1.25rem" : "1.5rem",
                  color: isMobile ? "#FFD700" : "#F5EFE0",
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                }}
              >
                {role.name}
              </h2>
              <span
                style={{
                  fontSize: "0.9rem",
                  opacity: 0.85,
                }}
              >
                ({role.colorLabel})
              </span>
            </div>
            <p
              style={{
                margin: 0,
                lineHeight: 1.6,
                fontSize: isMobile ? "1rem" : "1.1rem",
                color: isMobile ? "#FFD700" : "#F5EFE0",
                textShadow: isMobile ? "0 1px 2px rgba(0, 0, 0, 0.5)" : "none",
              }}
            >
              {role.description}
            </p>
          </div>
        ))}
      </div>

      <p
        style={{
          marginTop: 24,
          textAlign: "center",
          fontSize: isMobile ? "0.9rem" : "1rem",
          opacity: 0.9,
        }}
      >
        These colors are used for names and badges across the site (forum, chat,
        news, profiles, user list) so you can quickly see who has which role.
      </p>
    </div>
  );
};

export default SiteRolesRules;
