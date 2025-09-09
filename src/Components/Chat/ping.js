// Simple ping sound for notifications
export const playPing = () => {
  const audio = new window.Audio(
    "https://cdn.pixabay.com/audio/2022/07/26/audio_124bfa1c7b.mp3" // Free ping sound
  );
  audio.volume = 0.5;
  audio.play();
};
