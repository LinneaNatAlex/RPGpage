import { useEffect, useRef, useState } from "react";
import style from "./VerifyEmail.module.css";
import Button from "../../Components/Button/Button";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebaseConfig";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../context/authContext";
import {
  consumeEmailVerificationLink,
  refreshAuthUser,
  sendVerificationEmail,
} from "../../utils/emailVerification";

const VerifyEmail = () => {
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState(null);
  const completingRef = useRef(false);
  const navigate = useNavigate();
  const { loading, refreshAuthState } = useAuth();

  useEffect(() => {
    if (loading) return;

    const finishVerifiedLogin = async () => {
      const current = auth.currentUser;
      if (!current?.emailVerified || completingRef.current) return;
      completingRef.current = true;
      setEmailVerified(true);

      const currentUid = current.uid;
      const tempUserData = localStorage.getItem("tempUserData");
      if (tempUserData) {
        try {
          const userData = JSON.parse(tempUserData);
          if (userData.uid !== currentUid) {
            localStorage.removeItem("tempUserData");
          } else {
            await setDoc(
              doc(db, "users", currentUid),
              {
                ...userData,
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
                online: true,
              },
              { merge: true },
            );
            localStorage.removeItem("tempUserData");
          }
        } catch (err) {
          console.error("Error saving user data:", err);
          setError("Failed to complete registration. Please contact support.");
          completingRef.current = false;
          return;
        }
      }

      await refreshAuthState();
      navigate("/", { replace: true });
    };

    const checkVerificationStatus = async () => {
      try {
        await consumeEmailVerificationLink();
      } catch {
        /* already used / expired — still try reload */
      }

      if (!auth.currentUser) {
        if (localStorage.getItem("tempUserData")) {
          setError("Please sign in again to complete your registration.");
        }
        navigate("/sign-in", { replace: true });
        return;
      }

      const current = await refreshAuthUser();
      const verified = !!current?.emailVerified;
      setEmailVerified(verified);
      if (verified) await finishVerifiedLogin();
    };

    checkVerificationStatus();
    const interval = setInterval(checkVerificationStatus, 2000);
    const onVisible = () => {
      if (document.visibilityState === "visible") checkVerificationStatus();
    };
    window.addEventListener("focus", checkVerificationStatus);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", checkVerificationStatus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loading, navigate, refreshAuthState]);

  const handleResendVerification = async () => {
    setError(null);
    try {
      await sendVerificationEmail(auth.currentUser);
      setEmailSent(true);
    } catch (err) {
      setError("Failed to send verification email. Please try again.");
    }
  };

  return (
    <div className={style.verifyWrapper}>
      {emailVerified ? (
        <h1>Email verified! Signing you in...</h1>
      ) : (
        <h1>Email not verified. Please check your inbox.</h1>
      )}
      <p>
        Open the link in the email — you will be signed in automatically. If you
        have not received it, request another one below.
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
