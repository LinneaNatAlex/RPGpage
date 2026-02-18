import { useState, useEffect } from "react";
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
  const [title, setTitle] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  const selectedPage = RULES_PAGES.find((p) => p.slug === selectedSlug);

  useEffect(() => {
    if (!selectedSlug) {
      setTitle("");
      setItems([]);
      setStatus("");
      return;
    }
    setLoading(true);
    setStatus("");
    const ref = doc(db, "pageRules", selectedSlug);
    getDoc(ref)
      .then((snap) => {
        if (snap.exists()) {
          const d = snap.data();
          const hasItems = Array.isArray(d.items) && d.items.length > 0;
          if (hasItems) {
            setTitle(d.title || selectedPage?.label || "");
            setItems(d.items);
          } else {
            const defaults = getRulesDefaults(selectedSlug);
            setTitle(defaults?.title ?? d?.title ?? selectedPage?.label ?? "");
            setItems(Array.isArray(defaults?.items) ? defaults.items : []);
          }
        } else {
          const defaults = getRulesDefaults(selectedSlug);
          setTitle(defaults?.title ?? selectedPage?.label ?? "");
          setItems(Array.isArray(defaults?.items) ? defaults.items : []);
        }
      })
      .catch(() => {
        setStatus("Failed to load rules.");
        const defaults = getRulesDefaults(selectedSlug);
        setTitle(defaults?.title ?? selectedPage?.label ?? "");
        setItems(Array.isArray(defaults?.items) ? defaults.items : []);
      })
      .finally(() => setLoading(false));
  }, [selectedSlug, selectedPage?.label]);

  const handleSave = async () => {
    if (!selectedSlug) return;
    setSaving(true);
    setStatus("");
    try {
      const ref = doc(db, "pageRules", selectedSlug);
      await setDoc(ref, {
        title: title.trim() || selectedPage?.label,
        items: items.map((s) => String(s).trim()).filter(Boolean),
        updatedAt: new Date().toISOString(),
      });
      setStatus("Saved.");
      setTimeout(() => setStatus(""), 3000);
    } catch (err) {
      setStatus(err?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const addRule = () => setItems((prev) => [...prev, ""]);
  const removeRule = (index) => setItems((prev) => prev.filter((_, i) => i !== index));
  const setItem = (index, value) =>
    setItems((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });

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
        Select a rules page below, edit the title and rule items, then Save. Visitors will see the saved version; if
        none is saved, the default rules are shown.
      </p>

      <label style={{ display: "block", marginBottom: 6, fontWeight: 600, color: theme.text }}>
        Rules page
      </label>
      <select
        value={selectedSlug}
        onChange={(e) => setSelectedSlug(e.target.value)}
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
      >
        <option value="">— Select a page —</option>
        {RULES_PAGES.map((p) => (
          <option key={p.slug} value={p.slug}>
            {p.label}
          </option>
        ))}
      </select>

      {loading && <p style={{ color: theme.secondaryText }}>Loading…</p>}

      {selectedSlug && !loading && (
        <>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 600, color: theme.text }}>
            Page title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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
              onClick={addRule}
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
            {items.map((item, index) => (
              <div key={index} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ color: theme.secondaryText, flexShrink: 0, marginTop: 10 }}>{index + 1}.</span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => setItem(index, e.target.value)}
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
                  onClick={() => removeRule(index)}
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
          {status && (
            <span style={{ marginLeft: 12, color: status.startsWith("Failed") ? "#c62828" : theme.secondaryText }}>
              {status}
            </span>
          )}
        </>
      )}
    </div>
  );
}
