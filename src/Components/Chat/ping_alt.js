// Enhanced ping system with sound and notifications
let lastPingAudio = null;
let lastPingTime = 0;

export const playPing = () => {
  const now = Date.now();

  // Prevent overlapping audio - stop previous audio if still playing
  if (lastPingAudio && !lastPingAudio.paused) {
    lastPingAudio.pause();
    lastPingAudio.currentTime = 0;
  }

  // Play sound with debouncing
  if (now - lastPingTime > 1000) {
    // Minimum 1 second between pings - RPG style sounds
    const soundUrls = [
      "https://actions.google.com/sounds/v1/cartoon/magic_wand_spell.ogg", // Magic wand sound
      "https://actions.google.com/sounds/v1/cartoon/siren_whistle.ogg", // Magical whistle
      "https://actions.google.com/sounds/v1/notification/notification_gentle.ogg" // Fallback
    ];
    
    const tryPlaySound = (urlIndex = 0) => {
      if (urlIndex >= soundUrls.length) return;
      
      lastPingAudio = new window.Audio(soundUrls[urlIndex]);
      lastPingAudio.volume = 0.6;
      lastPingAudio.play().catch((error) => {
        console.log(`Sound ${urlIndex} failed:`, error);
        tryPlaySound(urlIndex + 1);
      });
    };
    
    tryPlaySound();
    lastPingTime = now;
  }

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

// Test function to check if ping sound works
export const testPing = () => {
  console.log("Testing ping sound...");
  playPing();
};
