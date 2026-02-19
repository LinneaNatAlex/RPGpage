import React, { createContext, useState, useContext } from "react";

const OpenPrivateChatContext = createContext(null);

export function OpenPrivateChatProvider({ children }) {
  const [openWithUid, setOpenWithUid] = useState(null);
  const [openWithGroupId, setOpenWithGroupId] = useState(null);
  return (
    <OpenPrivateChatContext.Provider value={{ openWithUid, setOpenWithUid, openWithGroupId, setOpenWithGroupId }}>
      {children}
    </OpenPrivateChatContext.Provider>
  );
}

export function useOpenPrivateChat() {
  const ctx = useContext(OpenPrivateChatContext);
  if (!ctx) {
    return { openWithUid: null, setOpenWithUid: () => {}, openWithGroupId: null, setOpenWithGroupId: () => {} };
  }
  return ctx;
}
