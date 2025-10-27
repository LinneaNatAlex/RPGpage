// Import necessary libraries and styles
import styles from "./Button.module.css";

const Button = ({
  type = "button",
  children = "Click",
  // This ^ shows the "click" text if nothing else is specified
  onClick,
  // function that is called when the button is clicked
  className,
  disabled = false,
  ariaLabel,
  // a string that gives information about the button for screen readers
}) => {
  return (
    <button
      type={type}
      className={`${className} ${styles.button}`}
      // combining the css classes with the className prop. Making sure it is possible to use the styles globally
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
};

export default Button;
// exporting the Button component to another file so it can be used in different places
