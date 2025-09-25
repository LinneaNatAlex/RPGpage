import { signInWithEmailAndPassword } from "firebase/auth";
import styles from "./SignIn.module.css";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { auth } from "../../firebaseConfig";
import Train from "../../assets/VideoBackgrounds/Train.mp4";
import ErrorMessage from "../../Components/ErrorMessage/ErrorMessage";

const SignIn = () => {
  //declare the state variables.
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // retrive form data
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
  // --------------FORM VALIDATION, MAKING SURE USER FILLS AND WRITES CORRECT E-MAIL AND PASSWORD---------------------------
  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields.");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return false;
    }
    return true;
  };
  // -----------------------------SIGN IN HANDLER-----------------------------
  // Signing users in

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError(null);
    if (!validateForm()) return;

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      //  Check if the user's email is verified BEFORE allowing them to navigate to the home page.
      await user.reload();
      console.log(user.emailVerified);

      if (!user.emailVerified) {
        setError(
          "Please verify your email before signing in. Check your inbox for the verification email."
        );
        // Optionally redirect to verify email page
        navigate("/verify-email");
        return;
      }

      // Wait a moment for auth state to update
      await new Promise((resolve) => setTimeout(resolve, 500));

      // navigate to the main page after successful sign-in
      navigate("/main-page");
    } catch (error) {
      console.error("Sign in error:", error);

      // More specific error messages
      if (error.code === "auth/user-not-found") {
        setError("No account found with this email address.");
      } else if (error.code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.");
      } else if (error.code === "auth/invalid-email") {
        setError("Invalid email address format.");
      } else if (error.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please try again later.");
      } else if (error.code === "auth/network-request-failed") {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError("Witch and Wizard, something went wrong! Please try again.");
      }
    }
  };

  return (
    // -----------------------------SIGN IN PAGE-----------------------------
    <div className={styles.signUpContainer}>
      <form className={styles.signInForm}>
        <h2 className={styles.formGroupTitle}>
          Sign in to your magical account
        </h2>
        <div className={styles.inputGroup}>
          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="email" onChange={handleChange} />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            onChange={handleChange}
          />
        </div>
        <button className={styles.signUpBtn} onClick={handleSignIn}>
          Sign in
        </button>
        {error && <ErrorMessage message={error} />}
        <p>
          Don't have an account? Create one{" "}
          <NavLink to="/sign-up" className={styles.signInLink}>
            here
          </NavLink>
        </p>
      </form>
    </div>
  );
};

export default SignIn;
