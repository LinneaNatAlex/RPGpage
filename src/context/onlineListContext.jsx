import React, { createContext, useState, useContext, useMemo } from "react";

const OnlineListContext = createContext(null);

/** Kun hent online-liste når noen faktisk ser på den (forside-panel åpent eller chat åpen). */
export function OnlineListProvider({ children }) {
  const [sources, setSources] = useState({ main: false, chat: false, private: false, topbar: false });
  const enabled = sources.main || sources.chat || sources.private || sources.topbar;
  const requestOpen = (source, open) => {
    setSources((prev) => ({ ...prev, [source]: !!open }));
  };
  const value = useMemo(() => ({ enabled, requestOpen }), [enabled]);
  return (
    <OnlineListContext.Provider value={value}>
      {children}
    </OnlineListContext.Provider>
  );
}

export function useOnlineListContext() {
  const ctx = useContext(OnlineListContext);
  if (!ctx) {
    return { enabled: false, requestOpen: () => {} };
  }
  return ctx;
}
