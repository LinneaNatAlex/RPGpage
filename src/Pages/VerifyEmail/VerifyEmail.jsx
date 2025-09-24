// IMPORTS THE NECESSARY LIBRARIES AND COMPONENTS
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
    <div className={style.verifyEmailContainer}>
      <div className={style.verifyEmailContent}>
        <h1>Verify Your Email</h1>
        <p>
          We've sent a verification email to{" "}
          <strong>{auth.currentUser?.email}</strong>
        </p>
        <p>Please check your inbox and click the verification link.</p>

        {emailVerified ? (
          <div className={style.successMessage}>
            <p>Email verified successfully! Redirecting...</p>
          </div>
        ) : (
          <div className={style.verificationActions}>
            <Button onClick={handleResendVerification} disabled={emailSent}>
              {emailSent ? "Verification Email Sent" : "Resend Verification Email"}
            </Button>
            {error && <p className={style.errorMessage}>{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;