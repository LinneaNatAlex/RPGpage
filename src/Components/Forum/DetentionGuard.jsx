import { useAuth } from "../../context/authContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function DetentionGuard({ children }) {
  const { user } = useAuth();
  const { forumId } = useParams();
  const [detentionStatus, setDetentionStatus] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!user) return setDetentionStatus(false);
    
    getDoc(doc(db, "users", user.uid)).then((snap) => {
      const userData = snap.data();
      const detentionUntil = userData?.detentionUntil;
      
      if (!detentionUntil) {
        setDetentionStatus(false);
        return;
      }
      
      const now = Date.now();
      if (detentionUntil > now) {
        setDetentionStatus(true);
        setTimeLeft(detentionUntil - now);
        
        // Update countdown every second
        const interval = setInterval(() => {
          const newTimeLeft = detentionUntil - Date.now();
          if (newTimeLeft <= 0) {
            setDetentionStatus(false);
            clearInterval(interval);
          } else {
            setTimeLeft(newTimeLeft);
          }
        }, 1000);
        
        return () => clearInterval(interval);
      } else {
        setDetentionStatus(false);
      }
    });
  }, [user]);

  // If user is in detention, only allow access to detention classroom
  if (detentionStatus === null) return <div>Checking detention status...</div>;
  
  if (detentionStatus && forumId !== "detentionclassroom") {
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
    return (
      <div style={{ 
        marginTop: 32, 
        textAlign: "center",
        background: "linear-gradient(135deg, #5D4E37 0%, #6B5B47 100%)",
        color: "#F5EFE0",
        borderRadius: 0,
        padding: 40,
        boxShadow: "0 12px 48px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.2)",
        border: "3px solid #7B6857",
        maxWidth: 600,
        margin: "40px auto"
      }}>
        <h2 style={{ 
          color: "#ff6b6b", 
          fontFamily: '"Cinzel", serif',
          fontSize: "2rem",
          marginBottom: "1rem"
        }}>
          ⏰ You are in Detention
        </h2>
        
        <p style={{ fontSize: "1.1rem", marginBottom: "1.5rem" }}>
          You have been caught breaking curfew or school rules. 
          You are restricted to the Detention Classroom only.
        </p>
        
        <div style={{ 
          background: "rgba(255, 255, 255, 0.1)",
          borderRadius: 0,
          padding: 20,
          marginBottom: "1.5rem"
        }}>
          <h3 style={{ color: "#ffd86b", marginBottom: "1rem" }}>Time Remaining:</h3>
          <div style={{ 
            fontSize: "2rem", 
            fontWeight: "bold",
            color: "#ff6b6b",
            fontFamily: "monospace"
          }}>
            {hours.toString().padStart(2, '0')}:
            {minutes.toString().padStart(2, '0')}:
            {seconds.toString().padStart(2, '0')}
          </div>
        </div>
        
        <p style={{ fontSize: "0.9rem", color: "#D4C4A8" }}>
          You can only access the Detention Classroom forum until your detention period ends.
        </p>
        
        <button
          style={{
            marginTop: 20,
            background: "linear-gradient(135deg, #ff5722 0%, #d84315 100%)",
            color: "#F5EFE0",
            fontWeight: 700,
            border: "2px solid rgba(255, 255, 255, 0.2)",
            borderRadius: 0,
            padding: "12px 24px",
            cursor: "pointer",
            fontSize: "1rem",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
            transition: "all 0.3s ease"
          }}
          onClick={() => window.location.href = "/forum/detentionclassroom"}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.2)";
          }}
        >
          Go to Detention Classroom
        </button>
      </div>
    );
  }
  
  return children;
}
