import React from "react";
import { useRulesFromFirestore } from "../hooks/useRulesFromFirestore";

const DEFAULT_TITLE = "18+ Forum Rules";
const DEFAULT_RULES = [
  "Only users who are 18+ and have been confirmed via Discord may write or read sexual content.",
    "Sexual content is only allowed in the 18+ forum and must not be posted anywhere else on the site.",
    "All sexual content must be consensual, legal, and respectful.",
    "Avoid excessive or unnecessarily detailed descriptions that may make others uncomfortable.",
    'Respect others\' boundaries and use "content warnings" where relevant.',
    "No sexual content involving minors, animals, non-consensual acts, or any other illegal/forbidden material.",
    "No sexual roleplay in public or non-18+ areas.",
    "No sexual solicitation, prostitution, or exchange of explicit material for favors.",
    "No sharing of real-life explicit images or videos.",
    "All rules for respect, consent, and privacy apply especially strongly here.",
    "Breaking the rules may result in permanent exclusion from the 18+ forum and/or the entire site.",
    "Admins and moderators have the final say in all disputes.",
    "If you feel unsafe or uncomfortable, contact staff immediately.",
    "Do not pressure anyone into participating in sexual or mature roleplay.",
    "Report any suspicious or predatory behavior to staff immediately.",
    "No sharing of personal contact information in the 18+ forum.",
];

const Forum18Rules = () => {
  const { title: firestoreTitle, items: firestoreItems, loading, hasData } = useRulesFromFirestore("18forumrules");
  const title = hasData && firestoreTitle ? firestoreTitle : DEFAULT_TITLE;
  const rules = hasData && Array.isArray(firestoreItems) && firestoreItems.length > 0 ? firestoreItems : DEFAULT_RULES;

  if (loading) {
    return (
      <div style={{ maxWidth: 900, margin: "40px auto", padding: 40, textAlign: "center", color: "#F5EFE0" }}>
        Loading rules…
      </div>
    );
  }

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
      }}>{title}</h1>
      
      <div
        style={{
          background: "rgba(245, 239, 224, 0.1)",
          borderRadius: 0,
          padding: 24,
          border: "2px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
        }}
      >
        <ul style={{ 
          marginLeft: 20, 
          lineHeight: 1.6,
          fontSize: "1.1rem"
        }}>
          {rules.map((rule, index) => (
            <li key={index} style={{ marginBottom: 12, color: "#F5EFE0" }}>
              {rule}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Forum18Rules;
