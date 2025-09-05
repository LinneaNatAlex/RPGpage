import { useState } from "react";

// costum hook calidate signup form input.
const useSignUpValidation = () => {
  const [errors, setErrors] = useState({});
  // Expressions to regulate and to validate how standard email should look
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // Regex strengthen the pasword (min 8 caracters, 1upper and lover case atleast and one special symbol/char)
  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.*\s).{8,}$/;

  // returning the errors in the validation form fields.
  const validate = (value) => {
    let newErrors = {};
    // if else to check the imput fields, if and if not '!' then they will display the different errors.
    if (!value.firstname.trim()) {
      newErrors.firstname = "Character firstname is required";
    }
    if (!value.middlename.trim()) {
      newErrors.middlename = "Character middlename is required";
    }
    if (!value.lastname.trim()) {
      newErrors.lastname = "Character lastname is required";
    }
    if (!value.race?.trim()) {
      newErrors.race = "Character race is required";
    }
    if (!value.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(value.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!value.password.trim()) {
      newErrors.password = "Password is required";
    } else if (value.password.trim().length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    } else if (!passwordRegex.test(value.password.trim())) {
      newErrors.password =
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character";
    }

    setErrors(newErrors);
    return newErrors; // Return objekt med feilmeldinger
  };
  //returns and validate functions and the errors
  return { validate, errors };
};

export default useSignUpValidation;
