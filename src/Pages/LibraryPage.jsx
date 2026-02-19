import React, { useState, useEffect } from "react";
import useLibrary from "../hooks/useLibrary";
import { Link } from "react-router-dom";
import styles from "./LibraryPage.module.css";

/** Decode HTML entities – Quill stores < > as &lt; &gt;, so we must decode for iframe to render HTML/CSS */
function decodeHtmlEntities(str) {
  if (!str) return "";
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

/** Same as News: strip {{code}}/{{/code}}, decode so HTML/CSS rendres (tables, background-image, etc.) */
function buildLibraryPopupDoc(content) {
  let raw = (content || "")
    .replace("{{code}}", "")
    .replace("{{/code}}", "");
  raw = raw.replace(/(\s(?:src|href)\s*=\s*["'])http:\/\//gi, "$1https://");
  raw = decodeHtmlEntities(raw);
  raw = raw.replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
  const isDark =
    typeof document !== "undefined" &&
    !!document.querySelector('[data-theme="dark"]');
  const bg = isDark ? "#1a1a1a" : "#e8ddd4";
  const fg = isDark ? "#e0e0e0" : "#2c2c2c";
  return `<!DOCTYPE html>
<html style="background:${bg}">
<head><meta charset="utf-8"/>
<style>html,body{margin:0;padding:1rem;background:${bg}!important;color:${fg};box-sizing:border-box;}*{box-sizing:inherit;}</style>
</head>
<body>${raw}</body>
</html>`;
}

export default function LibraryPage() {
  const { items, loading } = useLibrary();
  const [popupItem, setPopupItem] = useState(null);
  const [openCategories, setOpenCategories] = useState(() => new Set());
  const toggleCategory = (name) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  useEffect(() => {
    if (!popupItem) return;
    const onEscape = (e) => { if (e.key === "Escape") setPopupItem(null); };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [popupItem]);

  const byCategory = React.useMemo(() => {
    const map = new Map();
    const sorted = [...items].sort((a, b) => {
      const catA = (a.category || "").trim() || "\uFFFF";
      const catB = (b.category || "").trim() || "\uFFFF";
      if (catA !== catB) return catA.localeCompare(catB);
      return (a.order ?? 999) - (b.order ?? 999);
    });
    for (const item of sorted) {
      const cat = (item.category || "").trim() || null;
      const key = cat || "Annet";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    }
    return Array.from(map.entries());
  }, [items]);

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
          <div className={styles.sectionsByCategory}>
            {byCategory.map(([categoryName, categoryItems]) => {
              const isOpen = openCategories.has(categoryName);
              const categoryId = `library-cat-${categoryName.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "") || "cat"}`;
              return (
                <section key={categoryName} className={styles.categorySection}>
                  <button
                    type="button"
                    className={styles.categoryToggle}
                    onClick={() => toggleCategory(categoryName)}
                    aria-expanded={isOpen}
                    aria-controls={categoryId}
                  >
                    <span className={styles.categoryToggleIcon} aria-hidden>
                      {isOpen ? "▼" : "▶"}
                    </span>
                    <span className={styles.categoryToggleLabel}>{categoryName}</span>
                    <span className={styles.categoryToggleCount}>({categoryItems.length})</span>
                  </button>
                  <div
                    id={categoryId}
                    className={styles.categoryDropdown}
                    hidden={!isOpen}
                  >
                    <div className={styles.buttonList}>
                      {categoryItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={styles.titleButton}
                          onClick={() => setPopupItem(item)}
                        >
                          {item.title || "Untitled"}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        )}
        <p className={styles.back}>
          <Link to="/rules">← Back to Rules overview</Link>
        </p>
      </div>

      {/* Same popup pattern as NewsFeed: overlay, close button, container, iframe */}
      {popupItem && (
        <div
          className={styles.popupOverlay}
          onClick={() => setPopupItem(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Library content"
        >
          <button
            type="button"
            className={styles.closePopupButton}
            onClick={() => setPopupItem(null)}
            aria-label="Close"
          >
            ×
          </button>
          <div
            className={styles.popupContainer}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={styles.popupBackButton}
              onClick={() => setPopupItem(null)}
            >
              ← Tilbake til listen
            </button>
            <div className={styles.popupContent}>
              <iframe
                title="Library content"
                className={styles.popupIframe}
                srcDoc={buildLibraryPopupDoc(popupItem.content || "")}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
