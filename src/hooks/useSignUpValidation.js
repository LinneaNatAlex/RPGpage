import { useState } from "react";

const useSignUpValidation = () => {
  const [errors, setErrors] = useState({});
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.*\s).{8,}$/;

  const validate = (value) => {
    let newErrors = {};

    if (!value.firstname.trim()) {
      newErrors.firstname = "Character firstname is required";
    }
    if (!value.middlename.trim()) {
      newErrors.middlename = "Character middlename is required";
    }
    if (!value.lastname.trim()) {
      newErrors.lastname = "Character lastname is required";
    }
    if (!value.house.trim()) {
      newErrors.house = "Character house is required";
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
    return Object.keys(newErrors);
  };
  return { validate, errors };
};

export default useSignUpValidation;
