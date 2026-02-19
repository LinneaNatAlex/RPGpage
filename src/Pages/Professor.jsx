import { useAuth } from "../context/authContext";
import useUserRoles from "../hooks/useUserRoles";
import ProfessorPanel from "../Components/Professor/ProfessorPanel";

export default function ProfessorPage() {
  const { user } = useAuth();
  const { roles = [], rolesLoading } = useUserRoles();
  if (!user) return <div>You must be logged in to view this page.</div>;
  if (rolesLoading) return <div>Loading roles...</div>;
  if (!(roles.includes("professor") || roles.includes("teacher") || roles.includes("admin") || roles.includes("archivist") || roles.includes("headmaster")))
    return <div>You do not have access to this page.</div>;
  return <ProfessorPanel />;
}
