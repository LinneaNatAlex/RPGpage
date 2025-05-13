

const Button =({
    children = "Click",
    onClick,
    className,
    disable = false,
    ariaLablelm
})=>{
    return(
        <button
            className={`${styles.button} ${className}`}
            disabled={disable}
            onClick={onClick}
            aria-label={ariaLablelm}
            >
                {children}
            </button>
    );
};

export default Button;
