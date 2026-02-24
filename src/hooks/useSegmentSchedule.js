import { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

const SEGMENT_IDS = ["archivist", "shadowpatrol"];
const POLL_MS = 90 * 1000;

const getDocId = (segmentId) =>
  segmentId === "shadowpatrol" ? "segmentShadowpatrol" : "segmentArchivist";

/**
 * @param {"archivist"|"shadowpatrol"} segmentId
 * @returns { tasks, loading, addTask, removeTask, error }
 */
export function useSegmentSchedule(segmentId) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!segmentId || !SEGMENT_IDS.includes(segmentId)) {
      setTasks([]);
      setLoading(false);
      return;
    }
    const ref = doc(db, "config", getDocId(segmentId));
    setLoading(true);
    const fetchTasks = () => {
      getDoc(ref)
        .then((snap) => {
          const data = snap.exists() ? snap.data() : {};
          setTasks(Array.isArray(data.tasks) ? data.tasks : []);
          setError(null);
        })
        .catch((err) => {
          setError(err.message);
          setTasks([]);
        })
        .finally(() => setLoading(false));
    };
    fetchTasks();
    const interval = setInterval(fetchTasks, POLL_MS);
    return () => clearInterval(interval);
  }, [segmentId]);

  const addTask = async (title, description, deadline, createdBy) => {
    if (!segmentId || !SEGMENT_IDS.includes(segmentId)) return;
    const ref = doc(db, "config", getDocId(segmentId));
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    const now = Date.now();
    const newTask = {
      id,
      title: title || "Task",
      description: description || "",
      deadline: deadline || null,
      createdBy: createdBy || "",
      createdAt: now,
    };
    const snap = await getDoc(ref);
    const currentTasks = (snap.exists() && Array.isArray(snap.data().tasks)) ? snap.data().tasks : [];
    const nextTasks = [...currentTasks, newTask];
    setTasks(nextTasks);
    try {
      await setDoc(ref, { tasks: nextTasks }, { merge: true });
    } catch (err) {
      setError(err.message);
      setTasks(currentTasks);
      throw err;
    }
  };

  const removeTask = async (taskId) => {
    if (!segmentId) return;
    const ref = doc(db, "config", getDocId(segmentId));
    const nextTasks = tasks.filter((t) => t.id !== taskId);
    setTasks(nextTasks);
    try {
      await setDoc(ref, { tasks: nextTasks }, { merge: true });
    } catch (err) {
      setTasks(tasks);
      setError(err.message);
    }
  };

  return { tasks, loading, error, addTask, removeTask };
}

export default useSegmentSchedule;
