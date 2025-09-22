import { useAuth } from "../context/authContext";
import useUserRoles from "../hooks/useUserRoles";
import TeacherPanel from "../Components/Teacher/TeacherPanel";

export default function TeacherPage() {
  const { user } = useAuth();
  const { roles = [], rolesLoading } = useUserRoles();
  if (!user) return <div>Du må være logget inn for å se denne siden.</div>;
  if (rolesLoading) return <div>Laster roller...</div>;
  if (!(roles.includes("teacher") || roles.includes("admin") || roles.includes("archivist")))
    return <div>Du har ikke tilgang til denne siden.</div>;
  return <TeacherPanel />;
}
