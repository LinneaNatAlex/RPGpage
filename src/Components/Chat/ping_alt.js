// Alternativ ping-lyd for testing
export const playPing = () => {
  const audio = new window.Audio(
    "https://actions.google.com/sounds/v1/alarms/beep_short.ogg" // Google public beep
  );
  audio.volume = 1.0;
  audio.play().catch(() => {});
};
