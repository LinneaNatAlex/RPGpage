import React from "react";
import useLibrary from "../hooks/useLibrary";
import { Link } from "react-router-dom";
import styles from "./LibraryPage.module.css";

/** Process {{code}}...{{/code}} like Profile/News: render inner content as HTML */
function processCodeBlocks(html) {
  if (!html || typeof html !== "string") return "";
  return html.replace(/\{\{code\}\}([\s\S]*?)\{\{\/code\}\}/gi, (_, inner) => inner || "");
}

export default function LibraryPage() {
  const { items, loading } = useLibrary();

  if (loading) {
    return (
      <div className={styles.container}>
        <p className={styles.loading}>Loading library…</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Library – tips you should know</h1>
        <p className={styles.intro}>
          Important information about the site: races, how things work, and tips from staff. Free to read.
        </p>
        {items.length === 0 ? (
          <p className={styles.empty}>No library entries yet. Check back later.</p>
        ) : (
          <div className={styles.sections}>
            {items.map((item) => (
              <section key={item.id} className={styles.section}>
                <h2 className={styles.sectionTitle}>{item.title}</h2>
                <div
                  className={styles.sectionContent}
                  dangerouslySetInnerHTML={{ __html: processCodeBlocks(item.content || "") }}
                />
              </section>
            ))}
          </div>
        )}
        <p className={styles.back}>
          <Link to="/rules">← Back to Rules overview</Link>
        </p>
      </div>
    </div>
  );
}
