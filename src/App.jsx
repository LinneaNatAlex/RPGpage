// import the nessesary modules
import { Outlet } from "react-router-dom";
import { useAuth } from "./context/authContext.jsx";
import styles from "./App.module.css";

import Navbar from "./Navbar/Navbar";
import PrivateChat from "./Components/Chat/PrivateChat";
import Chat from "./Components/Chat/Chat";
import TopBar from "./Components/TopBar/TopBar";
import AdminGlobalAgeVerificationModal from "./Components/AdminGlobalAgeVerificationModal";

function App() {
  const { user, loading } = useAuth();
  if (loading) {
    return <div>Loading...</div>; // Show a loading state while auth is being checked
  }
  // the main app that renders navbar and the main contents
  return (
    <>
      <div className={styles.rootContainer}>
        {/* Navbar and TopBar always visible */}
        <header className={styles.header}>
          <Navbar />
        </header>
        {/* Global admin popup for age verification requests (only for logged-in users) */}
        {user && <AdminGlobalAgeVerificationModal />}
        <main className={styles.main}>
          <Outlet />
        </main>
        {/* Main chat and PrivateChat only for logged-in users */}
        {user && <Chat />}
        {user && <PrivateChat />}
      </div>
    </>
  );
}

export default App;
