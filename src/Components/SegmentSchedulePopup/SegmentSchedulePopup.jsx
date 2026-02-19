import { useState, useRef, useEffect } from "react";
import useUserData from "../../hooks/useUserData";
import useSegmentSchedule from "../../hooks/useSegmentSchedule";
import styles from "./SegmentSchedulePopup.module.css";

const ROLE_LABELS = { archivist: "Archivist", shadowpatrol: "Shadow Patrol" };

export default function SegmentSchedulePopup({ open: controlledOpen, onOpenChange, renderTrigger }) {
  const { userData } = useUserData();
  const [internalOpen, setInternalOpen] = useState(false);
  const roleWhenOpenedRef = useRef(null);

  const isControlled = controlledOpen !== undefined && typeof onOpenChange === "function";
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;

  const segmentRole = Array.isArray(userData?.roles)
    ? userData.roles.map((r) => String(r).toLowerCase()).find((r) => r === "archivist" || r === "shadowpatrol")
    : null;

  if (segmentRole) roleWhenOpenedRef.current = segmentRole;
  const effectiveRole = open ? (segmentRole || roleWhenOpenedRef.current) : segmentRole;
  const { tasks, loading } = useSegmentSchedule(effectiveRole || undefined);

  useEffect(() => {
    if (!open) roleWhenOpenedRef.current = segmentRole || null;
  }, [open, segmentRole]);

  if (!effectiveRole && !open) return null;

  const trigger =
    renderTrigger
      ? renderTrigger({ open: () => setOpen(true), label: ROLE_LABELS[effectiveRole] })
      : !isControlled && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={styles.trigger}
            title={`${ROLE_LABELS[effectiveRole]} – tasks and info`}
            aria-label={`Open ${ROLE_LABELS[effectiveRole]} tasks`}
          >
            📋 {ROLE_LABELS[effectiveRole]}
          </button>
        );

  return (
    <>
      {trigger}
      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)} aria-hidden="true">
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.header}>
              <h2 className={styles.title}>{ROLE_LABELS[effectiveRole]} – tasks and info</h2>
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
