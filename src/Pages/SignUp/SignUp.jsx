import styles from "./SignUp.module.css";
import { useRef, useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { updateProfile } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { NavLink } from "react-router-dom";
import Button from "../../Components/Button/Button";
import useSignUpValidation from "../../hooks/useSignUpValidation";
import { db } from "../../firebaseConfig";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import Train from "../../assets/VideoBackgrounds/Train.mp4";
import VerifyEmail from "../VerifyEmail/VerifyEmail";
// import  useAuth from '../../hooks/useAuth';

const SignUp = () => {
  const [formData, setFormData] = useState({
    firstname: "",
    middlename: "",
    lastname: "",
    email: "",
    password: "",
    confirmPassword: "",
    profilePicture: null,
    previewUrl: "",
    terms: false,
    house: "Gryffindor",
    class: "1st year",
  });

  //input type file
  const fileInputRef = useRef(null);

  // vakudate functions
  const { validate, errors } = useSignUpValidation();

  // this is the function that will be used to sign up the user.
  // const {signUp, signUpError, user} = useAuth();

  // This is the function for redirecting the user to their profile page after they have signed up.
  const navigate = useNavigate();

  //error handling. If there is an error, it will show a message.

  const [error, setError] = useState(null);

  // handeling the changes in the input fields.
  const handleInputChange = (e) => {
    if (e.target.type === "file") return;
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const previewUrl = URL.createObjectURL(file);
      setFormData((prevData) => ({
        ...prevData,
        profilePicture: file,
        previewUrl: previewUrl,
      }));
      console.log("file selected:", file);
    } else {
      setFormData((prevData) => ({
        ...prevData,
        profilePicture: null,
        previewUrl: "",
      }));
    }
  };

  // remove the image preview when the user clicks the remove button.
  const handleRemoveImage = () => {
    setFormData((prevData) => ({
      ...prevData,
      profilePicture: null,
      previewUrl: "",
    }));
    // resets name of the file input field.
    fileInputRef.current.value = null;
  };

  // Handeling the checkbox changes. If the user checks the box it wil turn true, and the opposite if the user unchecks it.
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: checked,
    }));
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    // this resets the error message if they try to sign up again.
    if (!validate(formData)) {
      console.log("form not valid");
      return;
    }

    // try {
    //     const userCredential = await signUp(signUpFormData.email, signUpFormData.password);
    //     log(userCredential.user, 'has been signed up!');
    // } catch (error) {
    //     console.error('Error signing up:', error);
    // }

    // ------------------------------------------------

    // this checks if the password and confirm password are the same.
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;
      await sendEmailVerification(user);
      console.log("Verification email sent to:", user.email);

      // -------------------------------------------------
      // function to update display information

      await updateProfile(user, {
        displayName: `${formData.firstname} ${formData.middlename} ${formData.lastname}`,
      });

      // Adding datat to the firestore this is what will be displayed in firestore.
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        displayName: `${formData.firstname} ${formData.middlename} ${formData.lastname}`,
        // Nb; user can also get admin role, therfor it is placed in an array. Is directly in the database.
        roles: ["user"],
        email: user.email,
        profileImageUrl: "" || null,
        age: 11,
        house: formData.house,
        class: formData.class,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });

      await auth.currentUser.reload();
      const updatedUser = auth.currentUser;
      console.log(updatedUser.displayName, "has been updated!");

      console.log("navigate now");
      navigate("/verify-email");

      setFormData({
        firstname: "",
        middlename: "",
        lastname: "",
        email: "",
        password: "",
        confirmPassword: "",
        terms: false,
      });
    } catch (error) {
      setError(error.message);
      console.error(
        "The owl couldnt deliver your hogwart letter, try again!:",
        error
      );
    }
  };

  return (
    <div className={styles.signUpContainer}>
      <video autoPlay loop muted className={styles.backgroundVideo}>
        <source src={Train} type="video/mp4" />
      </video>

      <form className={styles.signUpForm} onSubmit={handleSignUp}>
        <h1>Sign up</h1>
        {/* ------------------------------------- */}
        <fieldset className={styles.formGroup}>
          <legend className={styles.formGroupTitle}>
            Caracter information
          </legend>

          <div className={styles.inputGroup}>
            <label htmlFor="caracter-firstname">Caracter First name</label>
            <input
              type="text"
              id="firstname"
              name="firstname"
              placeholder="Your caracter firstname"
              maxLength={10}
              onChange={handleInputChange}
              value={formData.firstname}
              required
            />
          </div>
          {/* ------------------------------------- */}
          <div className={styles.inputGroup}>
            <label htmlFor="caracter-middlename">Caracter Middle name</label>
            <input
              type="text"
              id="middlename"
              name="middlename"
              placeholder="Your caracter middlename"
              maxLength={10}
              onChange={handleInputChange}
              value={formData.middlename}
            />
          </div>
          {/* ------------------------------------- */}
          <div className={styles.inputGroup}>
            <label htmlFor="caracter-lastname">Caracter Last name</label>
            <input
              type="text"
              id="lastname"
              name="lastname"
              placeholder="Your caracter lastname"
              maxLength={10}
              onChange={handleInputChange}
              value={formData.lastname}
              required
            />
          </div>
          {/* ------------------------------------- */}
          <div className={styles.inputGroup}>
            <label htmlFor="profilePicture">Profile Picture</label>
            <input
              type="file"
              id="profilePicture"
              name="profilePicture"
              accept=".jpg, .jpg, .png"
              onChange={handleImageChange}
              ref={fileInputRef}
              value={formData.ImageChange}
            />

            {/* showing preview url, so you can display it before submitting */}
            {formData.previewUrl && (
              <div className={styles.imagePreview}>
                <img
                  src={formData.previewUrl}
                  alt="Preview"
                  className={styles.styleImagePreview}
                />
                <button
                  type="button"
                  className={styles.removeImageBtn}
                  onClick={handleRemoveImage}
                >
                  Remove Image
                </button>
              </div>
            )}
          </div>
        </fieldset>
        {/* INFORMATION THAT IS NOT DISPLAYED */}

        <fieldset className={styles.formGroup}>
          <legend className={styles.formGroupTitle}>Login Information</legend>

          {/* ------------------------------------- */}
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Jon.w@exemple.com"
              maxLength={50}
              minLength={8}
              onChange={handleInputChange}
              value={formData.email}
              required
            />
          </div>
          {/* ------------------------------------- */}
          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              onChange={handleInputChange}
              value={formData.password}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="password">Confirm Password</label>
            <input
              type="password"
              id="confirm-password"
              name="confirmPassword"
              onChange={handleInputChange}
              value={formData.confirmPassword}
              required
            />
          </div>
          {/* ------------------------------------- */}
          <div className={styles.terms}>
            <input
              type="checkbox"
              id="terms"
              name="terms"
              onChange={handleCheckboxChange}
              checked={formData.terms}
              required
            />
            <label htmlFor="terms">Agree with terms and conditions</label>
          </div>
          {/* Sends an error back if there is issues */}
          {error && <p> {error} </p>}

          <Button className={styles.signUpBtn}>Sign up</Button>

          <p>
            Already have an account? Log in {""}
            <NavLink to="/sign-in" className={styles.signInLink}>
              here
            </NavLink>
          </p>
        </fieldset>
        {/* ------------------------------------- */}
      </form>
    </div>
  );
};

export default SignUp;
