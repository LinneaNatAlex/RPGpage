import React from "react";
import { Link } from "react-router-dom";
import styles from "./RulesList.module.css";
import { RULES_PAGES } from "../data/rulesPages";

const RULES_LINKS = RULES_PAGES.map((p) => ({ path: `/${p.slug}`, label: p.label }));

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

      <section className={styles.aboutSection} aria-labelledby="about-heading">
        <h2 id="about-heading" className={styles.aboutTitle}>
          About this page & creator
        </h2>
        <div className={styles.aboutBlock}>
          <p>
            <strong>Get in touch:</strong> If you want to get in contact, you can send a message directly on the site to the{" "}
            <strong>Headmaster</strong> — use the main chat and mention @Headmaster, or start a private conversation via the online users list.
          </p>
        </div>
        <div className={styles.aboutBlock}>
          <p>
            <strong>About the site:</strong> This site is built and run mainly by hand: the layout, features, story, and most of the content are created and maintained by the creator. Some of the written text (for example certain descriptions or early drafts of rules) has been generated or assisted by AI and is there as a temporary placeholder — it will be replaced bit by bit with human-written content as the site is used and grows. Think of it as a work in progress.
          </p>
        </div>
        <div className={styles.disclaimerBlock}>
          <h3 className={styles.disclaimerTitle}>Disclaimer</h3>
          <p>
            This site and its creator disclaim any liability for how the site is used, for user-generated content, or for any loss or harm arising from use of the site. You use the site at your own risk. Content, rules, and features may change without notice. The site is provided &quot;as is&quot; without warranty of any kind. By using the site you agree to follow the rules and accept these terms.
          </p>
        </div>
      </section>
    </div>
  );
}
