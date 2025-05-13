import styles from './Button.module.css';

const Button = ({
    children = 'Click',
    onClick,
    className,
    disabled = false,
    ariaLabel,
}) => {
    return (
        <button
            className={`${className} ${styles.button}`}
            onClick={onClick}
            disabled={disabled}
            aria-label={ariaLabel}
        >
            {children}
        </button>
    );
}

export default Button;