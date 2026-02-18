import { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

const SEGMENT_IDS = ["archivist", "shadowpatrol"];

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
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.exists() ? snap.data() : {};
        setTasks(Array.isArray(data.tasks) ? data.tasks : []);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setTasks([]);
      }
    );
    setLoading(false);
    return () => unsub();
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
    const nextTasks = [...tasks, newTask];
    setTasks(nextTasks);
    try {
      await setDoc(ref, { tasks: nextTasks }, { merge: true });
    } catch (err) {
      setTasks(tasks);
      setError(err.message);
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
