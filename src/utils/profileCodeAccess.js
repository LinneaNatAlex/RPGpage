/**
 * Profile HTML/CSS ({{code}}) is only allowed for VIP.
 * When displaying a profile, we need to check if the profile OWNER is VIP.
 * If not, we do NOT run their custom HTML/CSS at all – show a placeholder only.
 */

/** Returns true if the given user document has active VIP (vipExpiresAt in the future). */
export function isProfileOwnerVip(userData) {
  if (!userData) return false;
  const v = userData.vipExpiresAt;
  if (v == null || v === undefined) return false;
  let ms = null;
  if (typeof v === "number") ms = v;
  else if (typeof v?.toMillis === "function") ms = v.toMillis();
  else if (typeof v?.toDate === "function") ms = v.toDate().getTime();
  else if (typeof v?.seconds === "number") ms = v.seconds * 1000 + ((v.nanoseconds || 0) / 1e6);
  else if (v instanceof Date) ms = v.getTime();
  return ms != null && !Number.isNaN(ms) && ms > Date.now();
}

/**
 * Removes <style> and <script> blocks from HTML (fallback when not using placeholder).
 */
export function stripProfileHtmlCss(html) {
  if (typeof html !== "string") return "";
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
}

/** Whether the profile text is using the {{code}} HTML/CSS block. */
export function profileUsesCodeBlock(profileText) {
  return (
    typeof profileText === "string" &&
    /^\s*\{\{code\}\}/i.test(profileText.trim())
  );
}

/**
 * Get body content for profile iframe.
 * - If profile uses {{code}} and owner is NOT VIP: return placeholder HTML only (no custom code runs).
 * - If profile uses {{code}} and owner is VIP: return raw body.
 * - Otherwise: return profile text as-is (rich/BB content).
 */
export function getProfileDisplayBody(profileText, ownerIsVip) {
  if (!profileText || typeof profileText !== "string") return "";
  const isCodeBlock = profileUsesCodeBlock(profileText);
  if (isCodeBlock && !ownerIsVip) {
    return '<p style="margin:1rem 0;color:inherit;opacity:0.9;">Custom HTML/CSS is only available for VIP members.</p>';
  }
  const raw = profileText
    .replace(/\{\{code\}\}/i, "")
    .replace(/\{\{\/code\}\}/i, "")
    .trim();
  return ownerIsVip ? raw : stripProfileHtmlCss(raw);
}
