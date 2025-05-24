import styles from "./Button.module.css";

const Button = ({
  children = "Click",
  // This ^ shows the the "click" text if nothing else is spessified
  onClick,
  // function that is the function that is called when the button is clicked
  className,
  // this gives the oppertunety to add a className to the button
  disabled = false,
  // a bolean that determines if the button is disabled
  ariaLabel,
  // a string that gives information about the button for screen readers
}) => {
  return (
    <button
      className={`${className} ${styles.button}`}
      //  combinding the css clases with the className prop. Making sure it is possible to use the styles globaly
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
