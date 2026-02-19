import React from "react";
import { useRulesFromFirestore } from "../hooks/useRulesFromFirestore";

const DEFAULT_TITLE = "Race & School Rules";
const DEFAULT_RULES = [
    "Respect your race and its traditions (Werewolf, Vampire, Witch, Elf).",
    "No race discrimination or favoritism.",
    "Follow school rules and regulations.",
    "Respect professors, Shadow Patrol, and school staff.",
    "Curfew is strictly enforced at 22:00 (10 PM). Students caught after curfew will face detention.",
    "Shadow Patrol monitors the school grounds after hours. Being caught results in immediate detention.",
    "How detention works: Detention lasts 1 hour from when it is assigned. While in detention, you can only access the Detention Classroom forum; all other forums are blocked until the period ends. You can read and post in the Detention Classroom as normal. A countdown of your remaining time is shown in the top bar.",
    "Admin, professors, Shadow Patrol, and the Headmaster can assign or clear detention for rule violations (e.g. curfew).",
    "Keep dormitories and commons clean and respectful.",
    "No unauthorized use of school facilities or equipment.",
];

const RaceSchoolRules = () => {
  const { title: firestoreTitle, items: firestoreItems, loading, hasData } = useRulesFromFirestore("raceschoolrules");
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
          marginLeft: 0, 
          paddingLeft: 0,
          listStyle: "none",
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

export default RaceSchoolRules;
