// IMPORTS THE NECESSARY LIBRARIES AND COMPONENTS
import { useEffect } from "react";
import style from "./VerifyEmail.module.css";
import { sendEmailVerification } from "firebase/auth";
import Button from "../../Components/Button/Button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebaseConfig";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";

const VerifyEmail = () => {
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState(null);
  const [userDataSaved, setUserDataSaved] = useState(false);
  const navigate = useNavigate();

  // Get the current user from Firebase Auth
  useEffect(() => {
    // Check if user is logged in
    if (!auth.currentUser) {
      navigate("/sign-in");
      return;
    }

    const checkVerificationStatus = async () => {
      await auth.currentUser.reload();
      setEmailVerified(auth.currentUser.emailVerified);

      if (auth.currentUser.emailVerified) {
        // Save user data to Firestore when email is verified
        const tempUserData = localStorage.getItem("tempUserData");
        if (tempUserData && !userDataSaved) {
          try {
            const userData = JSON.parse(tempUserData);
            await setDoc(doc(db, "users", userData.uid), {
              ...userData,
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
              online: true,
            });
            // Clear temporary data
            localStorage.removeItem("tempUserData");
            setUserDataSaved(true);
          } catch (error) {
            console.error("Error saving user data:", error);
            setError(
              "Failed to complete registration. Please contact support."
            );
            return;
          }
        }
        // Navigate to main app after successful registration
        navigate("/main-page");
      }
    };

    const interval = setInterval(checkVerificationStatus, 5000);
    return () => clearInterval(interval);
  }, [userDataSaved, navigate]);

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
