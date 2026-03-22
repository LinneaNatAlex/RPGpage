import { sendPasswordResetEmail } from "firebase/auth";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { auth } from "../../firebaseConfig";
import ErrorMessage from "../../Components/ErrorMessage/ErrorMessage";
import styles from "../SignIn/SignIn.module.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const validateEmail = () => {
    if (!email.trim()) {
      setError("Please enter your email address.");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!validateEmail()) return;

    setSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, email.trim(), {
        url: `${window.location.origin}/sign-in`,
        handleCodeInApp: false,
      });
      setSent(true);
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email address.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address format.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many requests. Please try again later.");
      } else if (err.code === "auth/network-request-failed") {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.signUpContainer}>
      <form className={styles.signInForm} onSubmit={handleSubmit}>
        <h2 className={styles.formGroupTitle}>Reset your password</h2>
        {sent ? (
          <>
            <p style={{ margin: 0, lineHeight: 1.5 }}>
              We&apos;ve sent a link to reset your password. Check your inbox (and
              spam folder), then use the link to choose a new password.
            </p>
            <NavLink to="/sign-in" className={styles.signInLink}>
              Back to sign in
            </NavLink>
          </>
        ) : (
          <>
            <p style={{ margin: 0, lineHeight: 1.5 }}>
              Enter the email for your account. We&apos;ll send you a link to choose a
              new password.
            </p>
            <div className={styles.inputGroup}>
              <label htmlFor="reset-email">Email</label>
              <input
                type="email"
                id="reset-email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
              />
            </div>
            <button
              type="submit"
              className={styles.signUpBtn}
              disabled={submitting}
            >
              {submitting ? "Sending…" : "Send reset link"}
            </button>
            {error && <ErrorMessage message={error} />}
            <p>
              Remember your password?{" "}
              <NavLink to="/sign-in" className={styles.signInLink}>
                Sign in
              </NavLink>
            </p>
          </>
        )}
      </form>
    </div>
  );
};

export default ForgotPassword;
