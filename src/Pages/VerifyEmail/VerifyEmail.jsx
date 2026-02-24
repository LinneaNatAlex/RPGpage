// IMPORTS THE NECESSARY LIBRARIES AND COMPONENTS
import { useEffect } from "react";
import style from "./VerifyEmail.module.css";
import { sendEmailVerification } from "firebase/auth";
import Button from "../../Components/Button/Button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebaseConfig";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../context/authContext";

const VerifyEmail = () => {
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState(null);
  const [userDataSaved, setUserDataSaved] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const navigate = useNavigate();
  const { refreshAuthState } = useAuth();

  // Check verification and send user to main page when verified
  useEffect(() => {
    if (!auth.currentUser) {
      const tempUserData = localStorage.getItem("tempUserData");
      if (tempUserData) setError("Please sign in again to complete your registration.");
      navigate("/sign-in");
      return;
    }

    const checkVerificationStatus = async () => {
      await auth.currentUser.reload();
      const verified = auth.currentUser.emailVerified;
      setEmailVerified(verified);

      if (verified && !redirecting) {
        setRedirecting(true);
        const currentUid = auth.currentUser.uid;
        const tempUserData = localStorage.getItem("tempUserData");
        if (tempUserData && !userDataSaved) {
          try {
            const userData = JSON.parse(tempUserData);
            if (userData.uid !== currentUid) {
              localStorage.removeItem("tempUserData");
            } else {
              await setDoc(doc(db, "users", currentUid), {
                ...userData,
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
                online: true,
              });
              localStorage.removeItem("tempUserData");
              setUserDataSaved(true);
            }
          } catch (err) {
            console.error("Error saving user data:", err);
            setError("Failed to complete registration. Please contact support.");
            setRedirecting(false);
            return;
          }
        }
        // Update auth context so main page shows logged-in state, then go to front page
        await refreshAuthState();
        navigate("/", { replace: true });
      }
    };

    checkVerificationStatus();
    const interval = setInterval(checkVerificationStatus, 2000);
    return () => clearInterval(interval);
  }, [userDataSaved, redirecting, navigate, refreshAuthState]);

  const handleResendVerification = async () => {
    setError(null);
    try {
      await sendEmailVerification(auth.currentUser);
      setEmailSent(true);
    } catch (error) {
      setError("Failed to send verification email. Please try again.");
    }
  };
  // ---------------------------VERIFY CONTAINER--------------------------
  return (
    <div className={style.verifyWrapper}>
      {emailVerified ? (
        <h1>Email verified! Redirecting to the main page...</h1>
      ) : (
        <h1>Email not verified. Please check your inbox.</h1>
      )}
      <p>
        Havent gotten the verification email? Click the link below to request
        another one.
      </p>
      <Button className={style.verifyBtn} onClick={handleResendVerification}>
        Resend Verification Email
      </Button>
      {emailSent && (
        <p className={style.successMessage}>Verification email sent!</p>
      )}
      {error && <p className={style.errorMessage}>{error}</p>}
    </div>
  );
};

export default VerifyEmail;
