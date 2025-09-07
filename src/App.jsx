// import the nessesary modules
import { Outlet } from "react-router-dom";
import { useAuth } from "./context/authContext.jsx";
import styles from "./App.module.css";
import Navbar from "./Navbar/Navbar";
import PrivateChat from "./Components/Chat/PrivateChat";
import Chat from "./Components/Chat/Chat";

function App() {
  const { user, loading } = useAuth();
  if (loading) {
    return <div>Loading...</div>; // Show a loading state while auth is being checked
  }
  // the main app that renders navbar and the main contents
  return (
    <>
      <div className={styles.rootContainer}>
        {/* Shows only nav to users logged in */}
        <header className={styles.header}>{user && <Navbar />}</header>
        <main className={styles.main}>
          <Outlet />
        </main>
        {/* Main chat and PrivateChat are now global for all logged-in users */}
        {user && <Chat />}
        {user && <PrivateChat />}
      </div>
    </>
  );
}

export default App;
