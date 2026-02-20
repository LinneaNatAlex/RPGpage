const STORAGE_KEY = "privateChatMessagesSentToday";

export const MAX_PRIVATE_MESSAGES_PER_DAY = 30;

/** Local date string YYYY-MM-DD (user's midnight = new day). */
function getTodayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** How many private messages the user has sent today (local date). Resets at midnight. */
export function getPrivateMessagesSentToday() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const { date, count } = JSON.parse(raw);
    return date === getTodayLocal() ? count : 0;
  } catch {
    return 0;
  }
}

/** Increment today's sent count (call after a successful send). */
export function incrementPrivateMessagesSentToday() {
  const today = getTodayLocal();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let data = { date: today, count: 0 };
    if (raw) {
      data = JSON.parse(raw);
      if (data.date !== today) data = { date: today, count: 0 };
    }
    data.count += 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (_) {}
}
