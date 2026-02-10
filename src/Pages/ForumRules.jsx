import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const rules = [
  {
    category: "Forum Rules",
    items: [
      "Stay on topic for each forum and thread.",
      "Use clear, descriptive tags and titles for your posts.",
      "Do not derail discussions or intentionally go off-topic.",
      "Avoid duplicate topics—search before posting.",
      "Do not bump threads unnecessarily.",
      "Mark spoilers clearly and use spoiler tags where possible.",
      "Do not post unfinished or placeholder topics.",
      "All forum posts must be at least 300 words.",
      "Always write in third person (he/she/they/name).",
    ],
  },
  {
    category: "Topic Rules",
    items: [
      "Stay on topic for each forum and thread.",
      "Use clear, descriptive tags and titles for your posts.",
      "Do not derail discussions or intentionally go off-topic.",
      "Avoid duplicate topics—search before posting.",
      "Do not bump threads unnecessarily.",
      "Mark spoilers clearly and use spoiler tags where possible.",
      "Do not post unfinished or placeholder topics.",
    ],
  },
];

export default function ForumRules() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();

  // Handle URL parameters to navigate to specific rule categories
  useEffect(() => {
    const category = searchParams.get('category');
    if (category) {
      const categoryIndex = rules.findIndex(rule => 
        rule.category.toLowerCase().replace(/[^a-z0-9]/g, '') === 
        category.toLowerCase().replace(/[^a-z0-9]/g, '')
      );
      if (categoryIndex !== -1) {
        setSelectedIdx(categoryIndex);
      }
    }
  }, [searchParams]);

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "40px auto",
        background: "linear-gradient(135deg, #5D4E37 0%, #6B5B47 100%)",
        color: "#F5EFE0",
        borderRadius: 0,
        padding: 40,
        boxShadow: "0 12px 48px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.2)",
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
          background: "linear-gradient(90deg, #D4C4A8 0%, #7B6857 50%, #D4C4A8 100%)",
          borderRadius: 0,
        }}
      />
      <h1 style={{ 
        textAlign: "center", 
        color: "#F5EFE0", 
        fontFamily: '"Cinzel", serif',
        fontSize: "2.5rem",
        fontWeight: 700,
        letterSpacing: "2px",
        textShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
        marginBottom: "2rem"
      }}>Forum Rules</h1>
      <div
        style={{
          background: "rgba(245, 239, 224, 0.1)",
          borderRadius: 0,
          padding: 24,
          marginBottom: 32,
          border: "2px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
        }}
      >
        <h2 style={{ 
          color: "#D4C4A8", 
          fontSize: "1.5rem", 
          marginBottom: 16,
          fontFamily: '"Cinzel", serif',
          fontWeight: 600,
          textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)"
        }}>
          RPG Guidelines
        </h2>
        <ul style={{ 
          marginLeft: 20, 
          marginBottom: 16,
          lineHeight: 1.6,
          fontSize: "1.1rem"
        }}>
          <li style={{ marginBottom: 8 }}>
            Always write in <b style={{ color: "#D4C4A8" }}>third person</b> (he/she/they/name).
          </li>
          <li style={{ marginBottom: 8 }}>
            All forum posts must be <b style={{ color: "#D4C4A8" }}>at least 300 words</b>. A counter will
            appear as you write, and you cannot post until you reach 300 words.
          </li>
          <li style={{ marginBottom: 8 }}>
            Stay true to your character's personality and the forum's theme.
          </li>
          <li style={{ marginBottom: 8 }}>
            Respect others' boundaries and use content warnings where relevant.
          </li>
          <li style={{ marginBottom: 8 }}>Read all forum rules before posting.</li>
        </ul>
        <div style={{ 
          color: "#D4C4A8", 
          fontSize: "1.1rem",
          background: "rgba(212, 196, 168, 0.1)",
          padding: 12,
          borderRadius: 0,
          border: "1px solid rgba(212, 196, 168, 0.3)"
        }}>
          <b>Tip:</b> Describe actions, feelings, and surroundings to make the
          roleplay vivid and engaging!
        </div>
      </div>
      <p style={{ 
        textAlign: "center", 
        marginBottom: 32,
        fontSize: "1.2rem",
        color: "#D4C4A8",
        fontStyle: "italic"
      }}>
        Please read the forum rules carefully. Click a category to see the
        details.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 32,
          maxWidth: 900,
          margin: "0 auto 32px auto",
        }}
      >
        {rules.map((rule, idx) => (
          <button
            key={rule.category}
            onClick={() => setSelectedIdx(idx)}
            style={{
              background: selectedIdx === idx 
                ? "linear-gradient(135deg, #D4C4A8 0%, #7B6857 100%)" 
                : "rgba(245, 239, 224, 0.1)",
              color: selectedIdx === idx ? "#2C2C2C" : "#D4C4A8",
              border: selectedIdx === idx 
                ? "2px solid #7B6857" 
                : "2px solid rgba(255, 255, 255, 0.2)",
              borderRadius: 0,
              padding: "16px 20px",
              fontWeight: 600,
              fontSize: "0.9rem",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: selectedIdx === idx 
                ? "0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 3px rgba(255, 255, 255, 0.2)" 
                : "0 2px 8px rgba(0, 0, 0, 0.1)",
              outline: "none",
              minHeight: 60,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              fontFamily: '"Cinzel", serif',
              letterSpacing: "0.5px",
              textShadow: selectedIdx === idx ? "none" : "0 1px 2px rgba(0, 0, 0, 0.3)",
              lineHeight: 1.3,
            }}
            onMouseEnter={(e) => {
              if (selectedIdx !== idx) {
                e.target.style.background = "rgba(245, 239, 224, 0.2)";
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)";
              }
            }}
            onMouseLeave={(e) => {
              if (selectedIdx !== idx) {
                e.target.style.background = "rgba(245, 239, 224, 0.1)";
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
              }
            }}
          >
            {rule.category}
          </button>
        ))}
      </div>
      <div
        style={{
          margin: "0 auto",
          maxWidth: 800,
          background: "rgba(245, 239, 224, 0.1)",
          borderRadius: 0,
          padding: 24,
          minHeight: 120,
          border: "2px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
        }}
      >
        <h3 style={{
          color: "#D4C4A8",
          fontSize: "1.3rem",
          marginBottom: 16,
          fontFamily: '"Cinzel", serif',
          fontWeight: 600,
          textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
          textAlign: "center"
        }}>
          {rules[selectedIdx].category}
        </h3>
        <ul style={{ 
          margin: 0, 
          paddingLeft: 20,
          lineHeight: 1.7,
          fontSize: "1.1rem"
        }}>
          {rules[selectedIdx].items.map((item, i) => (
            <li key={i} style={{ 
              marginBottom: 12,
              color: "#F5EFE0",
              textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)"
            }}>
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div style={{ 
        marginTop: 32, 
        fontSize: "1.1rem", 
        color: "#D4C4A8",
        textAlign: "center",
        fontStyle: "italic",
        background: "rgba(212, 196, 168, 0.1)",
        padding: 16,
        borderRadius: 0,
        border: "1px solid rgba(212, 196, 168, 0.3)",
        textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)"
      }}>
        Breaking the rules may result in warnings, exclusion from the forum, or
        a ban from the entire site.
      </div>
    </div>
  );
}
