// imports the necessesary components and hooks
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
// import VerifyEmail from "../VerifyEmail/VerifyEmail";
import { useImageUpload } from "../../hooks/useImageUpload";
import ErrorMessage from "../../Components/ErrorMessage/ErrorMessage";
import SortingQuiz from "../../Components/SortingQuiz/SortingQuiz";

// import  useAuth from '../../hooks/useAuth';
// ------------------------------------------ SIGN UP ----------------------------------------------------

// ---------------------SIGN UP STATE VARIABLES -----------------
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
    race: "",
    class: "1st year",
  });
  //input type file reference
  const fileInputRef = useRef(null);
  const { validate, errors } = useSignUpValidation();
  // This is the function that will be used to sign up the user. The the function for redirecting the user to their profile page after they have signed up.
  const navigate = useNavigate();
  const { uploadImage } = useImageUpload();
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedRace, setSelectedRace] = useState("");

  //error handling. If there is an error, it will show a message.
  const [error, setError] = useState(null);

  // ---------------------INPUT CHANGE HANDLER---------------------
  // handeling the changes in the input fields.
  const handleInputChange = (e) => {
    if (e.target.type === "file") return;
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // ----------------------HANDEL IMAGE CHANGE----------------------
  // To change the image preview when, after user clicks on the file
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
  // -------------------HANDLE REMOVE IMAGE------------------------------
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
  // --------------------HANDLE CHECKBOX CHANGE-------------------
  // Handeling the checkbox changes. If the user checks the box it wil turn true, and the opposite if the user unchecks it.
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: checked,
    }));
  };

  // ---------------------HANDLE SIGN UP---------------------
  const handleSignUp = async (e) => {
    e.preventDefault();
    // this resets the error message if they try to sign up again.
    const validationErrors = validate(formData);
    if (validationErrors.length > 0) {
      setError("Pleace try againg, check all fields and try again.");
      return;
    }
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
      // function to update display information

      await updateProfile(user, {
        displayName: `${formData.firstname} ${formData.middlename} ${formData.lastname}`,
      });

      //making sure image is uploaded to cloudinary
      const uploadedImageUrl = formData.profilePicture
        ? await uploadImage(formData.profilePicture)
        : "";

      // Adding datat to the firestore this is what will be displayed in firestore.
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        displayName: `${formData.firstname} ${formData.middlename} ${formData.lastname}`,
        // Nb; user can also get admin role, therfor it is placed in an array. Is directly in the database.
        roles: ["user"],
        email: user.email,
        profileImageUrl: uploadedImageUrl,
        age: 11,
        race: formData.race,
        class: formData.class,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        online: true, // shows if the user is online and active
      });

      await auth.currentUser.reload();
      const updatedUser = auth.currentUser;

      // console.log("navigate now");
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
      setError("email already in use, please try again with another email.");
    }
  };
  //-----------------------------------------------------------Form and Fieldsets------------------------------------------------------------------
  return (
    <div className={styles.signUpContainer}>
      <video autoPlay loop muted className={styles.backgroundVideo}>
        <source src={Train} type="video/mp4" />
      </video>
      <div className={styles.raceSorting}>
        {showQuiz && (
          <SortingQuiz
            required
            onClose={() => setShowQuiz(false)}
            onResult={(house) => {
              setSelectedRace(house);
              setFormData((prevData) => ({
                ...prevData,
                race: house,
              }));
            }}
          />
        )}
        <form className={styles.signUpForm} onSubmit={handleSignUp}>
          <h1>Sign up</h1>
          {/* ----------------CARACTER INFORMATION--------------------- */}
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
              />
              {errors.firstname && <ErrorMessage message={errors.firstname} />}
            </div>
            {/* -----------------MIDDLE NAME-------------------- */}
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
              {errors.middlename && (
                <ErrorMessage message={errors.middlename} />
              )}
            </div>
            {/* -------------------LAST NAME------------------ */}
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
              {errors.lastname && <ErrorMessage message={errors.lastname} />}
            </div>
            {/* -------------------PROFILE PICTURE------------------ */}
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

              {/* -------------------HOUSE------------------ */}
              <div className={styles.raceSelection}>
                <Button
                  type="button"
                  className={styles.sortingQuizButton}
                  onClick={() => setShowQuiz(true)}
                >
                  Take the sorting quiz
                </Button>
                {selectedRace && (
                  <p className={styles.selectedRace}>
                    Your magical race is: {selectedRace}
                  </p>
                )}
              </div>
              {errors.house && <ErrorMessage message={errors.house} />}
              {/* showing preview url, so you can display it before submitting */}
              {formData.previewUrl && (
                <div className={styles.imagePreview}>
                  <img
                    src={formData.previewUrl}
                    alt="Preview"
                    className={styles.styleImagePreview}
                  />
                  <Button
                    type="button"
                    className={styles.removeImageBtn}
                    onClick={handleRemoveImage}
                  >
                    Remove Image
                  </Button>
                </div>
              )}
            </div>
          </fieldset>
          {/* INFORMATION THAT IS NOT DISPLAYED */}

          <fieldset className={styles.formGroup}>
            <legend className={styles.formGroupTitle}>Login Information</legend>
            {/* ----------------CARACTER INFORMATION--------------------- */}

            {/* -------------------EMAIL------------------ */}
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
              {errors.email && <ErrorMessage message={errors.email} />}
            </div>
            {/* -------------------PASSWORD--------------------- */}
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
              {errors.password && <ErrorMessage message={errors.password} />}
            </div>
            {/* -----------------CONFIRM PASSWORD-------------------- */}
            <div className={styles.inputGroup}>
              <label htmlFor="confirm-password">Confirm Password</label>
              <input
                type="password"
                id="confirm-password"
                name="confirmPassword"
                onChange={handleInputChange}
                value={formData.confirmPassword}
                required
              />
              {errors.confirmPassword && (
                <ErrorMessage message={errors.confirmPassword} />
              )}
            </div>
            {/* -----------------TERMS AND CONDITIONS-------------------- */}
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

            <Button type="submit" className={styles.signUpBtn}>
              Sign up
            </Button>
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
    </div>
  );
};

export default SignUp;
