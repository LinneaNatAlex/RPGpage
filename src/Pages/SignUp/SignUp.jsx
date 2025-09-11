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
import TermsModal from "../../Components/TermsModal/TermsModal";

// import  useAuth from '../../hooks/useAuth';
// ------------------------------------------ SIGN UP ----------------------------------------------------

// ---------------------SIGN UP STATE VARIABLES -----------------
import { useEffect } from "react";
const initialFormData = {
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
};
const SignUp = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem("signupFormData");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...initialFormData, ...parsed };
      } catch {
        return initialFormData;
      }
    }
    return initialFormData;
  });
  //input type file reference
  const fileInputRef = useRef(null);
  const { validate, errors } = useSignUpValidation();
  // This is the function that will be used to sign up the user. The the function for redirecting the user to their profile page after they have signed up.
  const navigate = useNavigate();
  const { uploadImage } = useImageUpload();
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedRace, setSelectedRace] = useState("");
  const [showTerms, setShowTerms] = useState(false);

  //error handling. If there is an error, it will show a message.
  const [error, setError] = useState(null);

  // Lagre formData til localStorage hver gang det endres
  useEffect(() => {
    const toSave = { ...formData };
    // Ikke lagre File-objektet (profilePicture) i localStorage
    if (toSave.profilePicture) delete toSave.profilePicture;
    localStorage.setItem("signupFormData", JSON.stringify(toSave));
  }, [formData]);

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
    if (isSubmitting) return;
    setIsSubmitting(true);
    const validationErrors = validate(formData);
    if (Object.keys(validationErrors).length > 0) {
      setError("Please check all fields and try again.");
      setIsSubmitting(false);
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;
      await sendEmailVerification(user);
      await updateProfile(user, {
        displayName: `${formData.firstname} ${formData.middlename} ${formData.lastname}`,
      });
      const uploadedImageUrl = formData.profilePicture
        ? await uploadImage(formData.profilePicture)
        : "";
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        displayName: `${formData.firstname} ${formData.middlename} ${formData.lastname}`,
        roles: ["user"],
        email: user.email,
        profileImageUrl: uploadedImageUrl,
        age: 11,
        race: formData.race,
        class: formData.class,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        online: true,
        currency: 1000, // Start with 1000 Nits
        inventory: [], // Legg til inventory-feltet fra start
      });
      await auth.currentUser.reload();
      navigate("/verify-email");
      setFormData(initialFormData);
      localStorage.removeItem("signupFormData");
    } catch (error) {
      setError("email already in use, please try again with another email.");
    } finally {
      setIsSubmitting(false);
    }
  };
  //-----------------------------------------------------------Form and Fieldsets------------------------------------------------------------------
  return (
    <div className={styles.signUpContainer}>
      {/* Bakgrunnsvideo fjernet, bruker kun vanlig bakgrunn */}
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
          {error && (
            <div
              style={{
                background: "#ff2a2a",
                color: "#fff",
                padding: "0.7rem 1.2rem",
                borderRadius: "8px",
                marginBottom: "1rem",
                fontWeight: "bold",
                textAlign: "center",
                boxShadow: "0 2px 8px rgba(255,42,42,0.15)",
              }}
            >
              {error}
            </div>
          )}
          {/* ----------------CARACTER INFORMATION--------------------- */}
          <fieldset className={styles.formGroup}>
            <legend className={styles.formGroupTitle}>
              Character Information
            </legend>
            <div className={styles.inputGroup}>
              <label htmlFor="caracter-firstname">Character First Name</label>
              <input
                type="text"
                id="firstname"
                name="firstname"
                placeholder="Your character's first name"
                maxLength={10}
                onChange={handleInputChange}
                value={formData.firstname}
              />
              {errors.firstname && <ErrorMessage message={errors.firstname} />}
            </div>
            {/* -----------------MIDDLE NAME-------------------- */}
            <div className={styles.inputGroup}>
              <label htmlFor="caracter-middlename">Character Middle Name</label>
              <input
                type="text"
                id="middlename"
                name="middlename"
                placeholder="Your character's middle name"
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
              <label htmlFor="caracter-lastname">Character Last Name</label>
              <input
                type="text"
                id="lastname"
                name="lastname"
                placeholder="Your character's last name"
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
                {!selectedRace && (
                  <Button
                    type="button"
                    className={styles.sortingQuizButton}
                    onClick={() => setShowQuiz(true)}
                  >
                    Reveal your magical race
                  </Button>
                )}
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
                placeholder="jon.w@example.com"
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
              <label htmlFor="terms">
                I agree to the
                <button
                  type="button"
                  className={styles.termsLink}
                  onClick={() => setShowTerms(true)}
                  tabIndex={0}
                >
                  terms and conditions
                </button>
              </label>
            </div>
            {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
            {/* Sends an error back if there is issues */}

            <Button
              type="submit"
              className={styles.signUpBtn}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing up..." : "Sign up"}
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
