import React from "react";
import { useRulesFromFirestore } from "../hooks/useRulesFromFirestore";

const DEFAULT_TITLE = "Dating & Relationship Rules";
const DEFAULT_RULES = [
    "In-character dating is allowed, but must be realistic to the characters' ages and personalities.",
    "Younger characters (under 13) should focus on friendship, crushes, and innocent experimentation—avoid mature or intense romance.",
    "Romantic relationships for teens should reflect real-life development: more feelings and drama may develop with age, but always keep it age-appropriate.",
    "No romantic or sexual roleplay between adult and minor characters, or between users of significantly different real-life ages.",
    "All in-character relationships must be consensual and respectful.",
    "Do not pressure anyone into roleplaying romance or relationships they are uncomfortable with.",
    "Public displays of affection should be kept appropriate for the forum and character ages.",
    "If a relationship plot makes you or others uncomfortable, talk to staff or use content warnings.",
    "No forced relationships, stalking, or obsessive behavior in or out of character.",
    "Remember: IC (in-character) relationships are not the same as OOC (out-of-character) relationships—respect boundaries at all times.",
    "Romantic plots should develop naturally—avoid instant relationships or 'love at first sight' unless it fits the story.",
    "Breakups and heartbreak are part of realistic storytelling—handle them with care and respect for all players involved.",
    "No 'shipping wars' or harassment over character pairings.",
    "Do not use relationships as a way to exclude or target other players.",
    "If a player wishes to end a relationship plot, respect their decision immediately.",
    "Do not use in-character relationships to manipulate, control, or harass others out of character.",
    "Romantic triangles and drama are allowed, but must be agreed upon by all involved players.",
    "No explicit or suggestive content in dating plots outside the 18+ forum.",
    "All dating and relationship plots must comply with the forum's age, consent, and content rules.",
    "If you are unsure if a plot is appropriate, ask a moderator or admin before proceeding.",
];

const DatingRelationshipRules = () => {
  const { title: ft, items: fi, loading, hasData } = useRulesFromFirestore("datingrelationshiprules");
  const title = hasData && ft ? ft : DEFAULT_TITLE;
  const rules = hasData && Array.isArray(fi) && fi.length > 0 ? fi : DEFAULT_RULES;

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

export default DatingRelationshipRules;
