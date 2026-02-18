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
    </div>
  );
}
