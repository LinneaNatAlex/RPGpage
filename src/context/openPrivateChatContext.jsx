import React, { createContext, useState, useContext } from "react";

const OpenPrivateChatContext = createContext(null);

export function OpenPrivateChatProvider({ children }) {
  const [openWithUid, setOpenWithUid] = useState(null);
  return (
    <OpenPrivateChatContext.Provider value={{ openWithUid, setOpenWithUid }}>
      {children}
    </OpenPrivateChatContext.Provider>
  );
}

export function useOpenPrivateChat() {
  const ctx = useContext(OpenPrivateChatContext);
  if (!ctx) {
    return { openWithUid: null, setOpenWithUid: () => {} };
  }
  return ctx;
}
