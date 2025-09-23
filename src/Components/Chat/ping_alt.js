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
  if (now - lastPingTime > 1000) { // Minimum 1 second between pings
    lastPingAudio = new window.Audio(
      "https://actions.google.com/sounds/v1/alarms/beep_short.ogg" // Google public beep
    );
    lastPingAudio.volume = 0.7; // Reduced volume to be less jarring
    lastPingAudio.play().catch(() => {});
    lastPingTime = now;
  }
  
  // Show browser notification if permission granted and tab is not focused
  if (document.hidden && Notification.permission === 'granted') {
    new Notification('Vayloria Chat', {
      body: 'You were mentioned in chat!',
      icon: '/favicon.ico',
      tag: 'chat-mention',
      requireInteraction: false,
      silent: false,
      vibrate: [200, 100, 200] // Vibration pattern for mobile devices
    });
  }
};

// Request notification permission
export const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return Notification.permission === 'granted';
};
