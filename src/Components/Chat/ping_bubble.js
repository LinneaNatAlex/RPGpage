// Boble-lyd for varsling
export const playPing = () => {
  const audio = new window.Audio(
    "https://cdn.pixabay.com/audio/2022/03/15/audio_115b9b7bfa.mp3" // Boble-lyd
  );
  audio.volume = 0.7;
  audio.play().catch(() => {});
};
