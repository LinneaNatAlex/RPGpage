// Simple notification sound for mentions
const playMentionSound = () => {
  const audio = new window.Audio(
    "https://cdn.pixabay.com/audio/2022/03/15/audio_115b9b2e6b.mp3"
  );
  audio.volume = 0.5;
  audio.play();
};

export default playMentionSound;
