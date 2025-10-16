import { useAuth } from "../context/authContext";
import useUserRoles from "../hooks/useUserRoles";
import AdminPanel from "../Components/Admin/AdminPanel";

export default function Admin() {
  const { user } = useAuth();
  const { roles = [] } = useUserRoles();
  // Debug: show roles for troubleshooting
  if (!user) return <div>You must be logged in to view this page.</div>;
  if (!roles.includes("admin"))
    return <div>You do not have access to this page.</div>;
  return <AdminPanel />;
}
