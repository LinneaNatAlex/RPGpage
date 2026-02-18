import { useAuth } from "../context/authContext";
import useUserRoles from "../hooks/useUserRoles";
import TeacherPanel from "../Components/Teacher/TeacherPanel";

export default function TeacherPage() {
  const { user } = useAuth();
  const { roles = [], rolesLoading } = useUserRoles();
  if (!user) return <div>You must be logged in to view this page.</div>;
  if (rolesLoading) return <div>Loading roles...</div>;
  if (!(roles.includes("teacher") || roles.includes("admin") || roles.includes("archivist") || roles.includes("headmaster")))
    return <div>You do not have access to this page.</div>;
  return <TeacherPanel />;
}
