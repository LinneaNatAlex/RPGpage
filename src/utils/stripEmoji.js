/**
 * Removes emoji and other extended pictographic characters from a string.
 * Used to block emoji input for non-VIP users (typing, Windows+., paste).
 */
export function stripEmoji(str) {
  if (typeof str !== "string") return str;
  // \p{Extended_Pictographic} matches emoji and pictographic symbols (ES2018+)
  return str.replace(/\p{Extended_Pictographic}/gu, "");
}
