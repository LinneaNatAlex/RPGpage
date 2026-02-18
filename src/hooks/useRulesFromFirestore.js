import { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

/**
 * Fetches rules for a rules page from Firestore (pageRules/{slug}).
 * Returns { title, items, loading, hasData }.
 * If no document or empty items, hasData is false so the page can use its default rules.
 */
export function useRulesFromFirestore(slug) {
  const [data, setData] = useState({ title: null, items: null, loading: true, hasData: false });

  useEffect(() => {
    if (!slug) {
      setData({ title: null, items: null, loading: false, hasData: false });
      return;
    }
    let cancelled = false;
    const ref = doc(db, "pageRules", slug);
    getDoc(ref)
      .then((snap) => {
        if (cancelled) return;
        if (snap.exists()) {
          const d = snap.data();
          const items = Array.isArray(d.items) ? d.items : [];
          setData({
            title: d.title || null,
            items,
            loading: false,
            hasData: items.length > 0,
          });
        } else {
          setData({ title: null, items: null, loading: false, hasData: false });
        }
      })
      .catch(() => {
        if (!cancelled) setData({ title: null, items: null, loading: false, hasData: false });
      });
    return () => { cancelled = true; };
  }, [slug]);

  return data;
}
