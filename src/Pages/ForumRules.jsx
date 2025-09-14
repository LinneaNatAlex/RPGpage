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
        maxWidth: 700,
        margin: "40px auto",
        background: "#23232b",
        color: "#fff",
        borderRadius: 12,
        padding: 32,
        boxShadow: "0 2px 16px #000",
      }}
    >
      <h1 style={{ textAlign: "center", color: "#ffd86b" }}>Forum Rules</h1>
      <div
        style={{
          background: "#2d2d3a",
          borderRadius: 8,
          padding: 18,
          marginBottom: 28,
          border: "1px solid #ffd86b",
        }}
      >
        <h2 style={{ color: "#ffd86b", fontSize: 20, marginBottom: 8 }}>
          RPG Guidelines
        </h2>
        <ul style={{ marginLeft: 18, marginBottom: 10 }}>
          <li>
            Always write in <b>third person</b> (he/she/they/name).
          </li>
          <li>
            All forum posts must be <b>at least 300 words</b>. A counter will
            appear as you write, and you cannot post until you reach 300 words.
          </li>
          <li>
            Stay true to your character's personality and the forum's theme.
          </li>
          <li>
            Respect others' boundaries and use content warnings where relevant.
          </li>
          <li>Read all forum rules before posting.</li>
        </ul>
        <div style={{ color: "#ffd86b", fontSize: 15 }}>
          <b>Tip:</b> Describe actions, feelings, and surroundings to make the
          roleplay vivid and engaging!
        </div>
      </div>
      <p style={{ textAlign: "center", marginBottom: 32 }}>
        Please read the forum rules carefully. Click a category to see the
        details.
      </p>
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 28,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {rules.map((rule, idx) => (
          <button
            key={rule.category}
            onClick={() => setSelectedIdx(idx)}
            style={{
              background: selectedIdx === idx ? "#ffd86b" : "#2d2d3a",
              color: selectedIdx === idx ? "#23232b" : "#ffd86b",
              border: "1.5px solid #ffd86b",
              borderRadius: 8,
              padding: "8px 18px",
              fontWeight: 700,
              fontSize: 16,
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: selectedIdx === idx ? "0 2px 8px #000" : "none",
              outline: "none",
              minWidth: 120,
            }}
          >
            {rule.category}
          </button>
        ))}
      </div>
      <div
        style={{
          margin: "0 auto",
          maxWidth: 600,
          background: "#28243a",
          borderRadius: 8,
          padding: 18,
          minHeight: 80,
          border: "1px solid #ffd86b",
        }}
      >
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {rules[selectedIdx].items.map((item, i) => (
            <li key={i} style={{ marginBottom: 8 }}>
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div style={{ marginTop: 32, fontSize: 15, color: "#ffd86b" }}>
        Breaking the rules may result in warnings, exclusion from the forum, or
        a ban from the entire site.
      </div>
    </div>
  );
}
