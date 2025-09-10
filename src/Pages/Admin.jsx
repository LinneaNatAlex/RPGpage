import { useAuth } from "../context/authContext";
import useUserRoles from "../hooks/useUserRoles";
import AdminPanel from "../Components/Admin/AdminPanel";

export default function Admin() {
  const { user } = useAuth();
  const { roles = [] } = useUserRoles();
  // Debug: show roles for troubleshooting
  if (!user) return <div>Du må være logget inn for å se denne siden.</div>;
  if (!roles.includes("admin"))
    return <div>Du har ikke tilgang til denne siden.</div>;
  return <AdminPanel />;
}
