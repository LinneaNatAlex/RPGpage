/**
 * Character status (in-world) per race. "Regular" = default; admin can grant other statuses.
 * Stored in user doc: characterStatus (string, optional). If missing, use default for race.
 * Config in Firestore: config/characterStatuses { vampire: ["Nightwalker", "Vampire"], werewolf: ["Werewolf", "Full Shapeshifter"], ... }
 */

const RACE_LOWER = (r) => (r || "").toLowerCase();

/** Default status when user has no characterStatus set (the "regular" for that race). */
export const DEFAULT_STATUS_BY_RACE = {
  vampire: "Nightwalker",
  vampyr: "Nightwalker",
  werewolf: "Werewolf",
  varulv: "Werewolf",
  elf: "Elf",
  alv: "Elf",
  wizard: "Wizard",
  trollmann: "Wizard",
  witch: "Witch",
  heks: "Witch",
  human: "Human",
  menneske: "Human",
};

/** Built-in status options per race (always shown in admin dropdown; admin can add more via config). */
export const DEFAULT_STATUS_OPTIONS_BY_RACE = {
  vampire: ["Nightwalker", "Incubus", "Succubus"],
  werewolf: ["Werewolf", "Full Shapeshifter"],
  elf: ["Elf", "Dark Elf", "High Elf"],
  wizard: ["Wizard", "Archmage"],
  witch: ["Witch", "Coven Elder"],
  human: ["Human"],
};

/** Race key for config (single canonical key per race family). */
function getRaceKey(race) {
  const r = RACE_LOWER(race);
  if (r.includes("vampire") || r.includes("vampyr")) return "vampire";
  if (r.includes("werewolf") || r.includes("varulv")) return "werewolf";
  if (r.includes("elf") || r.includes("alv")) return "elf";
  if (r.includes("wizard") || r.includes("trollmann")) return "wizard";
  if (r.includes("witch") || r.includes("heks")) return "witch";
  if (r.includes("human") || r.includes("menneske")) return "human";
  return null;
}

/** Get default character status label for a race. */
export function getDefaultCharacterStatus(race) {
  if (!race) return "Regular User";
  const r = RACE_LOWER(race);
  for (const [key, label] of Object.entries(DEFAULT_STATUS_BY_RACE)) {
    if (r.includes(key)) return label;
  }
  return "Regular User";
}

const GENDER_LABELS = new Set(["male", "female", "other", "m", "f"]);

/** Options for admin dropdown: built-in options + config for this race. Excludes gender words. */
export function getStatusOptionsForRace(race, config = {}) {
  const key = getRaceKey(race);
  const builtIn = (key && DEFAULT_STATUS_OPTIONS_BY_RACE[key]) ? DEFAULT_STATUS_OPTIONS_BY_RACE[key] : [];
  const fromConfig = (key && config[key]) ? config[key] : [];
  const defaultLabel = getDefaultCharacterStatus(race);
  const combined = Array.from(
    new Set([defaultLabel, ...builtIn, ...fromConfig].filter(Boolean))
  ).filter((s) => !GENDER_LABELS.has((s || "").toLowerCase()));
  return combined.sort((a, b) => a.localeCompare(b));
}

/**
 * Resolve display label for character status.
 * Special: Vampire + status "Vampire" (or "Incubus"/"Succubus") + gender → show Incubus or Succubus.
 * userData: { race, characterStatus?, characterGender? }
 */
export function getCharacterStatusDisplay(userData) {
  const race = userData?.race || "";
  const status = (userData?.characterStatus || "").trim();
  const gender = (userData?.characterGender || userData?.gender || "").toString().toLowerCase();
  const raceLower = RACE_LOWER(race);

  const isVampire = raceLower.includes("vampire") || raceLower.includes("vampyr");
  const statusLower = status.toLowerCase();

  if (isVampire && (statusLower === "vampire" || statusLower === "incubus" || statusLower === "succubus")) {
    if (statusLower === "incubus") return "Incubus";
    if (statusLower === "succubus") return "Succubus";
    if (gender === "male" || gender === "m") return "Incubus";
    if (gender === "female" || gender === "f") return "Succubus";
    return "Vampire";
  }

  if (status) return status;
  return getDefaultCharacterStatus(race);
}
