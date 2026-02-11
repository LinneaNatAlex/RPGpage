// Shared users list with cache + polling to reduce Firestore reads (was: real-time onSnapshot on full collection).
import { useState, useEffect } from "react";
import { useAuth } from "../context/authContext";
import * as usersListStore from "../utils/usersListStore";

const useUsers = () => {
  const [users, setUsers] = useState(usersListStore.getUsers());
  const [loading, setLoading] = useState(usersListStore.getLoading());
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      usersListStore.clear();
      setUsers([]);
      setLoading(false);
      return;
    }

    const unsubscribe = usersListStore.subscribe((u, l) => {
      setUsers(u);
      setLoading(l);
    });
    usersListStore.fetchIfNeeded();

    return unsubscribe;
  }, [user, authLoading]);

  return { users, loading };
};

export default useUsers;
