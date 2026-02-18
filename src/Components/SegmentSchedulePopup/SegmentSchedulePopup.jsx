import { useState } from "react";
import useUserData from "../../hooks/useUserData";
import useSegmentSchedule from "../../hooks/useSegmentSchedule";
import styles from "./SegmentSchedulePopup.module.css";

const ROLE_LABELS = { archivist: "Archivist", shadowpatrol: "Shadow Patrol" };

export default function SegmentSchedulePopup() {
  const { userData } = useUserData();
  const [open, setOpen] = useState(false);

  const segmentRole = Array.isArray(userData?.roles)
    ? userData.roles.map((r) => String(r).toLowerCase()).find((r) => r === "archivist" || r === "shadowpatrol")
    : null;

  const { tasks, loading } = useSegmentSchedule(segmentRole || undefined);

  if (!segmentRole) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={styles.trigger}
        title={`${ROLE_LABELS[segmentRole]} – tasks and info`}
        aria-label={`Open ${ROLE_LABELS[segmentRole]} tasks`}
      >
        📋 {ROLE_LABELS[segmentRole]}
      </button>
      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)} aria-hidden="true">
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.header}>
              <h2 className={styles.title}>{ROLE_LABELS[segmentRole]} – tasks and info</h2>
              <button type="button" onClick={() => setOpen(false)} className={styles.close} aria-label="Close">
                ×
              </button>
            </div>
            <div className={styles.body}>
              {loading ? (
                <p className={styles.loading}>Loading…</p>
              ) : tasks.length === 0 ? (
                <p className={styles.empty}>No tasks or messages from your lead yet.</p>
              ) : (
                <ul className={styles.taskList}>
                  {tasks.map((t) => (
                    <li key={t.id} className={styles.taskItem}>
                      <div className={styles.taskTitle}>{t.title}</div>
                      {t.description && <div className={styles.taskDesc}>{t.description}</div>}
                      {t.deadline && (
                        <div className={styles.taskDeadline}>
                          Deadline: {new Date(t.deadline).toLocaleString()}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
