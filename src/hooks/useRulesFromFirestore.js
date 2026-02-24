import { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { cacheHelpers } from "../utils/firebaseCache";

/**
 * Fetches rules for a rules page from Firestore (pageRules/{slug}).
 * Returns { title, items, loading, hasData }. Uses 10 min cache to reduce reads.
 */
export function useRulesFromFirestore(slug) {
  const [data, setData] = useState({ title: null, items: null, loading: true, hasData: false });

  useEffect(() => {
    if (!slug) {
      setData({ title: null, items: null, loading: false, hasData: false });
      return;
    }
    const cached = cacheHelpers.getPageRules(slug);
    if (cached) {
      const items = Array.isArray(cached.items) ? cached.items : [];
      setData({
        title: cached.title ?? null,
        items,
        loading: false,
        hasData: items.length > 0,
      });
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
          cacheHelpers.setPageRules(slug, { title: d.title, items });
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
