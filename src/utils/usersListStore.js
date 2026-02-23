// Single shared fetch for users list – avoids N×onSnapshot reads (one per component).
// Uses cache + polling so we get one getDocs per 5 min instead of real-time per mount.
import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { cacheHelpers } from "./firebaseCache";

const VALID_RACES = [
  "Wizard", "wizard", "Vampire", "vampire",
  "Werewolf", "werewolf", "Elf", "elf",
];

let users = [];
let loading = true;
let subscribers = [];
let pollTimer = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

function processSnapshot(snapshot) {
  const updatedUsers = [];
  snapshot.forEach((doc) => {
    const userData = doc.data();
    if (userData.race && VALID_RACES.includes(userData.race)) {
      updatedUsers.push({ uid: doc.id, ...userData });
    }
  });
  updatedUsers.sort((a, b) => (b.points || 0) - (a.points || 0));
  return updatedUsers;
}

function notify() {
  subscribers.forEach((cb) => cb(users, loading));
}

export function getUsers() {
  return users;
}

export function getLoading() {
  return loading;
}

export function subscribe(callback) {
  subscribers.push(callback);
  callback(users, loading);

  if (subscribers.length === 1) {
    pollTimer = setInterval(() => fetchIfNeeded(), CACHE_TTL_MS);
  }

  return () => {
    subscribers = subscribers.filter((cb) => cb !== callback);
    if (subscribers.length === 0 && pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  };
}

export function clear() {
  users = [];
  loading = false;
  notify();
}

/** Clear cache and refetch users list (e.g. after admin edits a user). */
export function invalidateAndRefetch() {
  cacheHelpers.clearUsersList();
  return fetchIfNeeded();
}

export function fetchIfNeeded() {
  const cached = cacheHelpers.getUsersList();
  if (cached && cached.length >= 0) {
    users = cached;
    loading = false;
    notify();
    return Promise.resolve();
  }

  loading = true;
  notify();

  const usersRef = collection(db, "users");
  return getDocs(usersRef)
    .then((snapshot) => {
      users = processSnapshot(snapshot);
      loading = false;
      cacheHelpers.setUsersList(users);
      notify();
    })
    .catch((error) => {
      if (error?.code === "permission-denied") {
        users = [];
        loading = false;
        import("../firebaseConfig").then(({ getUserTerms }) => {
          getUserTerms()
            .then((fallbackUsers) => {
              users = processSnapshot({
                forEach: (fn) => fallbackUsers.forEach((u) => {
                  const { uid: _uid, ...rest } = u;
                  fn({ id: u.uid, data: () => rest });
                }),
              });
              loading = false;
              cacheHelpers.setUsersList(users);
              notify();
            })
            .catch(() => {
              users = [];
              loading = false;
              notify();
            });
        });
        return;
      }
      loading = false;
      notify();
    });
}
