// Alternativ ping-lyd for testing
export const playPing = () => {
  const audio = new window.Audio(
    "https://actions.google.com/sounds/v1/alarms/beep_short.ogg" // Google public beep
  );
  audio.volume = 1.0;
  audio.play().catch((e) => {
    // Fanger feil hvis nettleseren blokkerer lyd
    alert(
      "Kunne ikke spille av lyd. Prøv å klikke et annet sted på siden først!"
    );
  });
};
