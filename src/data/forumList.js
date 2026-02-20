/** Forum id → display name (for dropdowns and display). Used by Forum.jsx and Teacher Panel. */
export const forumNames = {
  commons: "Commons",
  ritualroom: "Ritual Room",
  moongarden: "Moon Garden",
  bloodbank: "Blood Bank",
  nightlibrary: "Night Library",
  gymnasium: "The Gymnasium",
  infirmary: "The Infirmary",
  greenhouse: "The Greenhouse",
  artstudio: "The Art Studio",
  kitchen: "Kitchen",
  detentionclassroom: "Detention Classroom",
  "18plus": "18+ Forum",
  shortbutlong: "Short, but long",
  starshadehall: "Starshade Hall (live RP)",
};

/** List of { id, name } for dropdowns (teachers pick forum to edit description). */
export const forumList = Object.entries(forumNames).map(([id, name]) => ({ id, name }));

/** Firestore path for the document that stores forum descriptions. */
export const FORUM_DESCRIPTIONS_DOC = "config/forumDescriptions";
