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
  race: "",
  class: "",
  profilePicture: null,
  previewUrl: "",
  termsAccepted: false,
};

const SignUp = () => {
  const navigate = useNavigate();
  const { validate, errors } = useSignUpValidation();
  const { uploadImage } = useImageUpload();
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSortingQuiz, setShowSortingQuiz] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [selectedRace, setSelectedRace] = useState(null);
  const fileInputRef = useRef(null);

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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ---------------------HANDLE CHECKBOX CHANGE---------------------
  // handling the changes in the checkbox fields.
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

      <div className={styles.signUpContent}>
        <div className={styles.signUpForm}>
          <h1>Create Your Character</h1>
          <form onSubmit={handleSignUp}>
            {/* ---------------------NAME FIELDSET--------------------- */}
            <fieldset className={styles.fieldset}>
              <legend>Character Name</legend>
              <div className={styles.nameFields}>
                <div className={styles.inputGroup}>
                  <label htmlFor="firstname">First Name</label>
                  <input
                    type="text"
                    id="firstname"
                    name="firstname"
                    value={formData.firstname}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.firstname && (
                    <ErrorMessage message={errors.firstname} />
                  )}
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="middlename">Middle Name</label>
                  <input
                    type="text"
                    id="middlename"
                    name="middlename"
                    value={formData.middlename}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.middlename && (
                    <ErrorMessage message={errors.middlename} />
                  )}
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="lastname">Last Name</label>
                  <input
                    type="text"
                    id="lastname"
                    name="lastname"
                    value={formData.lastname}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.lastname && (
                    <ErrorMessage message={errors.lastname} />
                  )}
                </div>
              </div>
            </fieldset>

            {/* ---------------------ACCOUNT FIELDSET--------------------- */}
            <fieldset className={styles.fieldset}>
              <legend>Account Information</legend>
              <div className={styles.inputGroup}>
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
                {errors.email && <ErrorMessage message={errors.email} />}
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                {errors.password && (
                  <ErrorMessage message={errors.password} />
                )}
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
                {errors.confirmPassword && (
                  <ErrorMessage message={errors.confirmPassword} />
                )}
              </div>
            </fieldset>

            {/* ---------------------CHARACTER FIELDSET--------------------- */}
            <fieldset className={styles.fieldset}>
              <legend>Character Details</legend>
              <div className={styles.inputGroup}>
                <label htmlFor="race">Race</label>
                <select
                  id="race"
                  name="race"
                  value={formData.race}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select your race</option>
                  <option value="Human">Human</option>
                  <option value="Elf">Elf</option>
                  <option value="Dwarf">Dwarf</option>
                  <option value="Orc">Orc</option>
                  <option value="Halfling">Halfling</option>
                  <option value="Gnome">Gnome</option>
                  <option value="Dragonborn">Dragonborn</option>
                  <option value="Tiefling">Tiefling</option>
                </select>
                {errors.race && <ErrorMessage message={errors.race} />}
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="class">Class</label>
                <select
                  id="class"
                  name="class"
                  value={formData.class}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select your class</option>
                  <option value="1st year">1st year</option>
                  <option value="2nd year">2nd year</option>
                  <option value="3rd year">3rd year</option>
                  <option value="4th year">4th year</option>
                  <option value="5th year">5th year</option>
                  <option value="6th year">6th year</option>
                  <option value="7th year">7th year</option>
                </select>
                {errors.class && <ErrorMessage message={errors.class} />}
              </div>
            </fieldset>

            {/* ---------------------PROFILE PICTURE FIELDSET--------------------- */}
            <fieldset className={styles.fieldset}>
              <legend>Profile Picture</legend>
              <div className={styles.inputGroup}>
                <label htmlFor="profilePicture">Upload Profile Picture</label>
                <input
                  type="file"
                  id="profilePicture"
                  name="profilePicture"
                  accept="image/*"
                  onChange={handleImageChange}
                  ref={fileInputRef}
                />
                {formData.previewUrl && (
                  <div className={styles.imagePreview}>
                    <img
                      src={formData.previewUrl}
                      alt="Profile preview"
                      className={styles.previewImage}
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className={styles.removeImageBtn}
                    >
                      Remove Image
                    </button>
                  </div>
                )}
              </div>
            </fieldset>

            {/* ---------------------TERMS FIELDSET--------------------- */}
            <fieldset className={styles.fieldset}>
              <legend>Terms and Conditions</legend>
              <div className={styles.inputGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="termsAccepted"
                    checked={formData.termsAccepted}
                    onChange={handleCheckboxChange}
                    required
                  />
                  I accept the{" "}
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className={styles.termsLink}
                  >
                    Terms and Conditions
                  </button>
                </label>
                {errors.termsAccepted && (
                  <ErrorMessage message={errors.termsAccepted} />
                )}
              </div>
            </fieldset>

            {/* ---------------------SUBMIT BUTTON--------------------- */}
            <div className={styles.submitContainer}>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating Account..." : "Create Account"}
              </Button>
            </div>

            {/* ---------------------ERROR MESSAGE--------------------- */}
            {error && <ErrorMessage message={error} />}

            {/* ---------------------LOGIN LINK--------------------- */}
            <div className={styles.loginLink}>
              <p>
                Already have an account?{" "}
                <NavLink to="/sign-in" className={styles.link}>
                  Sign In
                </NavLink>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* ---------------------TERMS MODAL--------------------- */}
      {showTermsModal && (
        <TermsModal onClose={() => setShowTermsModal(false)} />
      )}
    </div>
  );
};

export default SignUp;