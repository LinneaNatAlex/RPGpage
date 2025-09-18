import { useState } from "react";

const rules = [
  {
    category: "General Forum Rules",
    items: [
      "Show respect to all users.",
      "Treat everyone equally regardless of nationality, gender, sexuality, religion, or background.",
      "No bullying, harassment, or discrimination of any kind.",
      "No hate speech, threats, or incitement to violence.",
      "No spam, self-promotion, or advertising without permission.",
      "Do not impersonate staff or other users.",
      "Do not post or share malware, viruses, or malicious links.",
      "Do not encourage or glorify self-harm, suicide, or eating disorders.",
      "Do not post graphic violence or gore.",
      "Respect all staff and their decisions.",
      "Follow global laws and Discord's guidelines.",
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
  {
    category: "Chat Rules",
    items: [
      "No offensive language, trolling, or personal attacks.",
      "Keep conversations civil, friendly, and inclusive.",
      "No excessive use of caps lock or flooding the chat.",
      "Respect others' opinions, even if you disagree.",
      "No doxxing or sharing of private conversations without consent.",
      "No chain messages, pyramid schemes, or scams.",
      "Do not mini-mod (act as a moderator if you are not one).",
    ],
  },
  {
    category: "Live Chat RPG Rules",
    items: [
      "No powergaming (forcing actions on others) or godmodding (making your character invincible).",
      "Respect others' boundaries, triggers, and play styles.",
      "Always get consent before including another character in major plot events.",
      "Do not metagame (using OOC knowledge in character).",
      "No auto-hitting or controlling another player's character.",
      "Keep OOC (out-of-character) chat to a minimum in IC (in-character) areas.",
      "Use appropriate content warnings for sensitive topics in roleplay.",
    ],
  },
  {
    category: "Character Rules",
    items: [
      "No illegal, offensive, or inappropriate characters.",
      "Characters must fit the forum's theme, lore, and rules.",
      "No overpowered or unrealistic characters.",
      "Respect character limits and creation guidelines.",
      "No duplicate or copycat characters.",
      "Do not use copyrighted names, images, or content for your character.",
      "Characters must have a completed profile before roleplaying.",
    ],
  },
  {
    category: "Profile Content Rules",
    items: [
      "No offensive, violent, or sexually explicit content.",
      "Profile pictures and descriptions must be appropriate for all ages and cultures.",
      "No links to illegal, pirated, or harmful content.",
      "Do not share personal information in your profile.",
      "No political, religious, or controversial statements in profiles.",
      "Do not use animated or flashing images that may trigger epilepsy.",
    ],
  },
  {
    category: "Sexual Content Rules (18+ Forum)",
    items: [
      "Only users who are 18+ and have been confirmed via Discord may write or read sexual content.",
      "Sexual content is only allowed in the 18+ forum and must not be posted anywhere else on the site.",
      "All sexual content must be consensual, legal, and respectful.",
      "Avoid excessive or unnecessarily detailed descriptions that may make others uncomfortable.",
      'Respect others\' boundaries and use "content warnings" where relevant.',
      "No sexual content involving minors, animals, non-consensual acts, or any other illegal/forbidden material.",
      "No sexual roleplay in public or non-18+ areas.",
      "No sexual solicitation, prostitution, or exchange of explicit material for favors.",
      "No sharing of real-life explicit images or videos.",
    ],
  },
  {
    category: "Dating & Relationship Rules",
    items: [
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
    ],
  },
  {
    category: "Special Rules for the 18+ Forum",
    items: [
      "All rules for respect, consent, and privacy apply especially strongly here.",
      "Breaking the rules may result in permanent exclusion from the 18+ forum and/or the entire site.",
      "Admins and moderators have the final say in all disputes.",
      "If you feel unsafe or uncomfortable, contact staff immediately.",
      "Do not pressure anyone into participating in sexual or mature roleplay.",
      "Report any suspicious or predatory behavior to staff immediately.",
      "No sharing of personal contact information in the 18+ forum.",
    ],
  },
];

export default function ForumRules() {
  const [selectedIdx, setSelectedIdx] = useState(0);

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "40px auto",
        background: "linear-gradient(135deg, #5D4E37 0%, #6B5B47 100%)",
        color: "#F5EFE0",
        borderRadius: 20,
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
          borderRadius: "20px 20px 0 0",
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
          borderRadius: 16,
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
          borderRadius: 8,
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
              borderRadius: 12,
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
          borderRadius: 16,
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
        borderRadius: 12,
        border: "1px solid rgba(212, 196, 168, 0.3)",
        textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)"
      }}>
        Breaking the rules may result in warnings, exclusion from the forum, or
        a ban from the entire site.
      </div>
    </div>
  );
}
