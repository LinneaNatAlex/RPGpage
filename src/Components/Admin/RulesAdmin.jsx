import { useState, useCallback } from "react";
import { db } from "../../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { RULES_PAGES } from "../../data/rulesPages";
import { getRulesDefaults } from "../../data/rulesDefaults";

const theme = {
  background: "#F5EFE0",
  text: "#2C2C2C",
  secondaryText: "#7B6857",
  border: "#D4C4A8",
};

export default function RulesAdmin() {
  const [selectedSlug, setSelectedSlug] = useState("");
  const [openTabs, setOpenTabs] = useState([]);
  const [activeSlug, setActiveSlug] = useState("");
  const [edits, setEdits] = useState({});
  const [loadingSlug, setLoadingSlug] = useState(null);
  const [savingSlug, setSavingSlug] = useState(null);
  const [statusBySlug, setStatusBySlug] = useState({});

  const openPage = useCallback(async () => {
    if (!selectedSlug) return;
    if (openTabs.includes(selectedSlug)) {
      setActiveSlug(selectedSlug);
      return;
    }
    setLoadingSlug(selectedSlug);
    const ref = doc(db, "pageRules", selectedSlug);
    const selectedPage = RULES_PAGES.find((p) => p.slug === selectedSlug);
    try {
      const snap = await getDoc(ref);
      let title = selectedPage?.label ?? "";
      let items = [];
      if (snap.exists()) {
        const d = snap.data();
        const hasItems = Array.isArray(d.items) && d.items.length > 0;
        if (hasItems) {
          title = d.title || selectedPage?.label || "";
          items = d.items;
        } else {
          const defaults = getRulesDefaults(selectedSlug);
          title = defaults?.title ?? d?.title ?? selectedPage?.label ?? "";
          items = Array.isArray(defaults?.items) ? defaults.items : [];
        }
      } else {
        const defaults = getRulesDefaults(selectedSlug);
        title = defaults?.title ?? selectedPage?.label ?? "";
        items = Array.isArray(defaults?.items) ? defaults.items : [];
      }
      setEdits((prev) => ({ ...prev, [selectedSlug]: { title, items } }));
      setOpenTabs((prev) => (prev.includes(selectedSlug) ? prev : [...prev, selectedSlug]));
      setActiveSlug(selectedSlug);
    } catch {
      setStatusBySlug((prev) => ({ ...prev, [selectedSlug]: "Failed to load." }));
    } finally {
      setLoadingSlug(null);
    }
  }, [selectedSlug, openTabs]);

  const closeTab = (slug) => {
    setOpenTabs((prev) => prev.filter((s) => s !== slug));
    setEdits((prev) => {
      const next = { ...prev };
      delete next[slug];
      return next;
    });
    setStatusBySlug((prev) => {
      const next = { ...prev };
      delete next[slug];
      return next;
    });
    if (activeSlug === slug) {
      const remaining = openTabs.filter((s) => s !== slug);
      setActiveSlug(remaining[0] ?? "");
    }
  };

  const setEdit = (slug, field, value) => {
    if (field === "title") {
      setEdits((prev) => ({
        ...prev,
        [slug]: { ...prev[slug], title: value, items: prev[slug]?.items ?? [] },
      }));
    } else if (field === "items") {
      setEdits((prev) => ({
        ...prev,
        [slug]: { ...prev[slug], title: prev[slug]?.title ?? "", items: value },
      }));
    }
  };

  const handleSave = async () => {
    if (!activeSlug) return;
    const data = edits[activeSlug];
    if (!data) return;
    const selectedPage = RULES_PAGES.find((p) => p.slug === activeSlug);
    setSavingSlug(activeSlug);
    setStatusBySlug((prev) => ({ ...prev, [activeSlug]: "" }));
    try {
      const ref = doc(db, "pageRules", activeSlug);
      await setDoc(ref, {
        title: (data.title || "").trim() || getPageLabel(activeSlug),
        items: (data.items || []).map((s) => String(s).trim()).filter(Boolean),
        updatedAt: new Date().toISOString(),
      });
      setStatusBySlug((prev) => ({ ...prev, [activeSlug]: "Saved." }));
      setTimeout(() => setStatusBySlug((prev) => ({ ...prev, [activeSlug]: "" })), 3000);
    } catch (err) {
      setStatusBySlug((prev) => ({ ...prev, [activeSlug]: err?.message || "Failed to save." }));
    } finally {
      setSavingSlug(null);
    }
  };

  const addRule = (slug) =>
    setEdit(slug, "items", [...(edits[slug]?.items ?? []), ""]);
  const removeRule = (slug, index) =>
    setEdit(slug, "items", (edits[slug]?.items ?? []).filter((_, i) => i !== index));
  const setItem = (slug, index, value) => {
    const list = [...(edits[slug]?.items ?? [])];
    list[index] = value;
    setEdit(slug, "items", list);
  };

  const activeData = activeSlug ? edits[activeSlug] : null;
  const saving = savingSlug !== null;
  const getPageLabel = (slug) => RULES_PAGES.find((p) => p.slug === slug)?.label ?? slug;

  return (
    <div
      style={{
        marginBottom: 24,
        padding: 20,
        background: "rgba(123, 104, 87, 0.1)",
        border: `2px solid ${theme.border}`,
        borderRadius: 0,
      }}
    >
      <h3 style={{ color: theme.secondaryText, fontSize: "1.2rem", marginBottom: 12, fontFamily: '"Cinzel", serif' }}>
        Page Rules (edit rules for each rules page)
      </h3>
      <p style={{ fontSize: "0.9rem", color: theme.text, marginBottom: 16 }}>
        Open one or more rules pages below (each loads once). Edit and save per page. Visitors see saved rules after
        they reload the rules page; no live sync to limit reads/writes.
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <select
          value={selectedSlug}
          onChange={(e) => setSelectedSlug(e.target.value)}
          style={{
            width: "100%",
            maxWidth: 320,
            padding: "10px 12px",
            borderRadius: 0,
            border: `2px solid ${theme.border}`,
            background: theme.background,
            color: theme.text,
            fontSize: "1rem",
          }}
        >
          <option value="">— Select a page —</option>
          {RULES_PAGES.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={openPage}
          disabled={!selectedSlug || loadingSlug !== null}
          style={{
            background: selectedSlug && !loadingSlug ? "linear-gradient(135deg, #5D4E37 0%, #4a3d2a 100%)" : "#999",
            color: "#F5EFE0",
            border: `2px solid ${theme.border}`,
            borderRadius: 0,
            padding: "10px 16px",
            fontSize: "0.95rem",
            fontWeight: 600,
            cursor: selectedSlug && !loadingSlug ? "pointer" : "not-allowed",
          }}
        >
          {loadingSlug === selectedSlug ? "Loading…" : "Open page"}
        </button>
      </div>

      {openTabs.length > 0 && (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12, borderBottom: `2px solid ${theme.border}`, paddingBottom: 8 }}>
            {openTabs.map((slug) => {
              const page = RULES_PAGES.find((p) => p.slug === slug);
              const label = page?.label ?? slug;
              const isActive = slug === activeSlug;
              return (
                <div
                  key={slug}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveSlug(slug)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActiveSlug(slug);
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "6px 10px",
                    background: isActive ? theme.background : "rgba(123, 104, 87, 0.2)",
                    border: `2px solid ${isActive ? theme.secondaryText : theme.border}`,
                    borderRadius: 0,
                    cursor: "pointer",
                  }}
                >
                  <span style={{ color: theme.text, fontSize: "0.9rem", fontWeight: isActive ? 600 : 400 }}>
                    {label}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(slug);
                    }}
                    aria-label="Close tab"
                    style={{
                      background: "none",
                      border: "none",
                      padding: "0 4px",
                      cursor: "pointer",
                      color: theme.secondaryText,
                      fontSize: "1.1rem",
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>

          {activeSlug && activeData && (
            <>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, color: theme.text }}>
                Page title
              </label>
              <input
                type="text"
                value={activeData.title}
                onChange={(e) => setEdit(activeSlug, "title", e.target.value)}
                style={{
                  width: "100%",
                  maxWidth: 400,
                  padding: "10px 12px",
                  borderRadius: 0,
                  border: `2px solid ${theme.border}`,
                  background: theme.background,
                  color: theme.text,
                  fontSize: "1rem",
                  marginBottom: 16,
                }}
                placeholder="e.g. Race & School Rules"
              />

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                <label style={{ fontWeight: 600, color: theme.text }}>Rules (one per line/item)</label>
                <button
                  type="button"
                  onClick={() => addRule(activeSlug)}
                  style={{
                    background: "linear-gradient(135deg, #4caf50 0%, #45a049 100%)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 0,
                    padding: "8px 16px",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  + Add rule
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {(activeData.items || []).map((item, index) => (
                  <div key={index} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ color: theme.secondaryText, flexShrink: 0, marginTop: 10 }}>{index + 1}.</span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => setItem(activeSlug, index, e.target.value)}
                      style={{
                        flex: 1,
                        padding: "10px 12px",
                        borderRadius: 0,
                        border: `2px solid ${theme.border}`,
                        background: theme.background,
                        color: theme.text,
                        fontSize: "1rem",
                      }}
                      placeholder="Rule text"
                    />
                    <button
                      type="button"
                      onClick={() => removeRule(activeSlug, index)}
                      style={{
                        background: "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)",
                        color: "#fff",
                        border: "none",
                        borderRadius: 0,
                        padding: "8px 12px",
                        fontSize: "0.9rem",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                style={{
                  background: saving ? "#999" : "linear-gradient(135deg, #7B6857 0%, #6B5B47 100%)",
                  color: "#F5EFE0",
                  border: "2px solid #D4C4A8",
                  borderRadius: 0,
                  padding: "10px 24px",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: saving ? "not-allowed" : "pointer",
                  fontFamily: '"Cinzel", serif',
                }}
              >
                {saving ? "Saving…" : "Save rules for this page"}
              </button>
              {statusBySlug[activeSlug] && (
                <span style={{ marginLeft: 12, color: (statusBySlug[activeSlug] || "").startsWith("Failed") ? "#c62828" : theme.secondaryText }}>
                  {statusBySlug[activeSlug]}
                </span>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
