import { createContext, useContext } from "react";
import { useAuth } from "./authContext.jsx";
import useUserData from "../hooks/useUserData";
import useNotifications from "../hooks/useNotifications";

const NotificationsContext = createContext(null);

/** Én onSnapshot på notifications + news – unngå duplikat lyttere (TopBar + MobileLayout). */
export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const { userData } = useUserData();
  const value = useNotifications(user, userData);
  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotificationsContext() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error(
      "useNotificationsContext must be used within NotificationsProvider",
    );
  }
  return ctx;
}
