import React from "react";
import { Link } from "react-router-dom";
import styles from "./RulesList.module.css";

const RULES_LINKS = [
  { path: "/generalrules", label: "General Rules" },
  { path: "/siterolesrules", label: "Roles on the Site (Staff & Colours)" },
  { path: "/aiusagerules", label: "AI Usage Rules" },
  { path: "/contentmediarules", label: "Content & Media Rules" },
  { path: "/privacysafetyrules", label: "Privacy & Safety Rules" },
  { path: "/accountidentityrules", label: "Account & Identity Rules" },
  { path: "/communitybehaviorrules", label: "Community & Behavior Rules" },
  { path: "/technicalsiterules", label: "Technical & Site Rules" },
  { path: "/forumrules", label: "Forum Rules" },
  { path: "/chatrules", label: "Chat Rules" },
  { path: "/profilecontentrules", label: "Profile Content Rules" },
  { path: "/roleplaycharacterrules", label: "Roleplay & Character Rules" },
  { path: "/rpgrules", label: "RPG Rules" },
  { path: "/livechatrpgrules", label: "Live Chat RPG Rules" },
  { path: "/magicspellrules", label: "Magic & Spell Rules" },
  { path: "/raceschoolrules", label: "Race & School Rules" },
  { path: "/datingrelationshiprules", label: "Dating & Relationship Rules" },
  { path: "/18forumrules", label: "18+ Forum Rules" },
];

export default function RulesList() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Page Rules</h1>
      <p className={styles.intro}>
        Choose a category to read the full rules.
      </p>
      <ul className={styles.list}>
        {RULES_LINKS.map(({ path, label }) => (
          <li key={path} className={styles.item}>
            <Link to={path} className={styles.link}>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
