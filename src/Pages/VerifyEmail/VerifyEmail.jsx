import { useEffect } from "react";
import style from "./VerifyEmail.module.css";
import { sendEmailVerification } from "firebase/auth";
import Button from "../../Components/Button/Button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebaseConfig";

const VerifyEmail = () => {
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Get the current user from Firebase Auth
  useEffect(() => {
    const checkVerificationStatus = async () => {
      await auth.currentUser.reload();
      setEmailVerified(auth.currentUser.emailVerified);

      if (auth.currentUser.emailVerified) {
        // Issues SENDING USER BACK TO THE HOME PAGE!!!!!!!!!!
        navigate("/");
      }
    };

    const interval = setInterval(checkVerificationStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleResendVerification = async () => {
    setError(null);
    try {
      await sendEmailVerification(auth.currentUser);
      setEmailSent(true);
    } catch (error) {
      setError("Failed to send verification email. Please try again.");
    }
  };

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
