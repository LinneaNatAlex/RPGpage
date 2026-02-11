// Shared pling for main chat @mentions and private chat – soft, not too loud
let lastPingTime = 0;
let pingAudio = null;
const PING_VOLUME = 0.42; // soft, comfortable level for both

function getPingAudio() {
  if (pingAudio) return pingAudio;
  try {
    const sampleRate = 8000;
    const duration = 0.16; // short, soft
    const freq = 660; // lower = warmer/softer
    const numSamples = Math.floor(sampleRate * duration);
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const dataSize = numSamples * numChannels * (bitsPerSample / 8);
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    const writeStr = (offset, str) => {
      for (let i = 0; i < str.length; i++)
        view.setUint8(offset + i, str.charCodeAt(i));
    };
    writeStr(0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    writeStr(8, "WAVE");
    writeStr(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, numChannels * (bitsPerSample / 8), true);
    view.setUint16(34, bitsPerSample, true);
    writeStr(36, "data");
    view.setUint32(40, dataSize, true);
    const amp = 0.18 * 32767; // gentle amplitude
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      view.setInt16(
        44 + i * 2,
        Math.sin(2 * Math.PI * freq * t) * amp,
        true,
      );
    }
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++)
      binary += String.fromCharCode(bytes[i]);
    pingAudio = new Audio("data:audio/wav;base64," + btoa(binary));
    pingAudio.volume = PING_VOLUME;
  } catch (_) {}
  return pingAudio;
}

let pingSoundPrepared = false;
/** Call on first user interaction in chat (e.g. focus input) so browser allows sound. */
export const preparePingSound = () => {
  if (pingSoundPrepared) return;
  try {
    const audio = getPingAudio();
    if (!audio) return;
    pingSoundPrepared = true;
    const v = audio.volume;
    audio.volume = 0;
    audio.play().then(() => {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = v;
    }).catch(() => {});
  } catch (_) {}
};

export const playPing = () => {
  const now = Date.now();
  // Throttle: max one ping per 2 seconds
  if (now - lastPingTime < 2000) return;
  lastPingTime = now;

  if (document.hidden) {
    if (Notification.permission === "granted") {
      new Notification("Vayloria Chat", {
        body: "You were mentioned in chat!",
        icon: "/favicon.ico",
        tag: "chat-mention",
        requireInteraction: false,
        silent: false,
        vibrate: [200, 100, 200],
      });
    }
    return;
  }

  try {
    const audio = getPingAudio();
    if (audio) {
      audio.currentTime = 0;
      audio.volume = PING_VOLUME;
      audio.play().catch(() => {});
    }
  } catch (_) {}
};

/** Same soft pling as main chat – for new private message when chat is collapsed. */
export const playPrivateChatPling = () => {
  try {
    const audio = getPingAudio();
    if (audio) {
      audio.currentTime = 0;
      audio.volume = PING_VOLUME;
      audio.play().catch(() => {});
    }
  } catch (_) {}
};

/** Unlock sound for private chat – kjør stille avspilling ved brukerhandling så nettleseren tillater lyd. Kalles ved fokus/klikk i privat chat. */
export const preparePrivateChatSound = () => {
  try {
    const audio = getPingAudio();
    if (!audio) return;
    const v = audio.volume;
    audio.volume = 0;
    audio.play().then(() => {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = v;
    }).catch(() => {});
  } catch (_) {}
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
