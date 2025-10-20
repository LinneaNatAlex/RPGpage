// Enhanced ping system with notifications only (no sound)
let lastPingTime = 0;

export const playPing = () => {
  const now = Date.now();

  // Show browser notification if permission granted and tab is not focused
  if (document.hidden && Notification.permission === "granted") {
    new Notification("Vayloria Chat", {
      body: "You were mentioned in chat!",
      icon: "/favicon.ico",
      tag: "chat-mention",
      requireInteraction: false,
      silent: false,
      vibrate: [200, 100, 200], // Vibration pattern for mobile devices
    });
  }
};

// Request notification permission
export const requestNotificationPermission = async () => {
  if ("Notification" in window && Notification.permission === "default") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }
  return Notification.permission === "granted";
};

// Test function to check if ping works
export const testPing = () => {
  playPing();
};
