/**
 * Fjerner feltet "age" og "lastBirthdayYear" fra alle brukere i Firestore.
 * Bruk dette scriptet hvis Admin-panel-knappen ikke får fjernet dem (f.eks. pga. regler).
 *
 * Kjør: node scripts/removeAgeFields.js
 * Krever: Firebase Admin SDK og en service account key.
 *
 * 1. Last ned service account key fra Firebase Console → Prosjektinnstillinger → Tjenestekontoer
 * 2. Lagre JSON-filen (f.eks. som serviceAccountKey.json i prosjektroten – legg den IKKE i git)
 * 3. Sett miljøvariabel: set GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json  (Windows)
 *    eller: export GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json  (Mac/Linux)
 * 4. Kjør: node scripts/removeAgeFields.js
 */

import admin from "firebase-admin";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

function getCredentials() {
  const envKey = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (envKey && existsSync(envKey)) return envKey;
  const defaultPath = join(projectRoot, "serviceAccountKey.json");
  if (existsSync(defaultPath)) return defaultPath;
  throw new Error(
    "Mangler service account key. Sett GOOGLE_APPLICATION_CREDENTIALS eller legg serviceAccountKey.json i prosjektroten."
  );
}

async function main() {
  const keyPath = getCredentials();
  const key = JSON.parse(readFileSync(keyPath, "utf8"));

  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(key) });
  }
  const db = admin.firestore();

  const usersRef = db.collection("users");
  const snapshot = await usersRef.get();
  let updated = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    if ("age" in data || "lastBirthdayYear" in data) {
      const updates = {};
      if ("age" in data) updates.age = admin.firestore.FieldValue.delete();
      if ("lastBirthdayYear" in data)
        updates.lastBirthdayYear = admin.firestore.FieldValue.delete();
      await doc.ref.update(updates);
      updated++;
      console.log(`Oppdatert: ${doc.id}`);
    }
  }

  console.log(
    updated > 0
      ? `Ferdig. Fjernet age/lastBirthdayYear fra ${updated} brukere.`
      : "Ingen brukere hadde age eller lastBirthdayYear."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
