import styles from './SignUp.module.css'
import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebaseConfig'; 
import { useNavigate } from 'react-router-dom';
import { NavLink } from 'react-router-dom';

        //function to handle the input values in the form, and is uppdated whenever the user types in to the input fields.

const SignUp = () => {
    const [formData, setFormData] = useState({
        firstname: '',
        lastname: '',
        middlename: '',
        email: '',
        password: '',
        confirmPassword: '',
        terms: false,
    });

    // This is the function for redirecting the user to their profile page after they have signed up.
    const navigate = useNavigate();
    
    
    //error handling. If there is an error, it will show a message.
    
        const [error, setError] = useState(null);

        // handeling the changes in the input fields.
        const handleInputChange = (e) => {
            const { name, value } = e.target;
            setFormData((prevData) => ({
                ...prevData,
                [name]: value,
            }));
        }
        // Handelig the checkbox changes. If the user checks the box it wil turn ture, and the opposite if the user unchecks it.
        const handleCheckboxChange = (e) => {
            const { name, checked } = e.target;
            setFormData((prevData) => ({
                ...prevData,
                [name]: checked,
            }));
        }
        

        const handleSignUp = async (e, email, password) => {
            // prevent the page from reloading.
            e.preventDefault();
            // this resets the error message if they try to sign up again.
            setError(null);  
            if (formData.password !== formData.confirmPassword) {
                setError('Not the same passord, try again!');
                return;
            }

            // Needs coments
            try {
                const userCredential = await createUserWithEmailAndPassword(
                    auth,
                    email, 
                    password
                    
                );

                const user = userCredential.user;
                navigate("/");   
                console.log(user, 'has been enrolled to Hogwarts! WHOO!');
                setFormData({
                    firstname: '',
                    lastname: '',
                    middlename: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    terms: false,
                });
            } catch (error) {
                setError(error.message);
                console.error('The owl couldnt deliver your hogwart letter, try again!:', error);
            }

        }

    return (

        <div className={styles.signUpContainer}>
            <form className={styles.signUpForm} onSubmit={(e) => handleSignUp(e, formData.email, formData.password)}>
                <h1>Sign up</h1>
            {/* ------------------------------------- */}
            <div className={styles.inputGroup}>
                <label htmlFor='caracter-firstname'>Caracter First name</label>
                <input type='text' id='firstname' name='firstname' placeholder='Your caracter firstname' onChange={handleInputChange} value={formData.firstname} required />
            </div>
            {/* ------------------------------------- */}
            <div className={styles.inputGroup}>
                <label htmlFor='caracter-lastname'>Caracter Last name</label>
                <input type='text' id='lastname' name='lastname' placeholder='Your caracter lastname' onChange={handleInputChange} value={formData.lastname} required />
            </div>
            {/* ------------------------------------- */}
            <div className={styles.inputGroup}>
                <label htmlFor='caracter-middlename'>Caracter Middle name</label>
                <input type='text' id='middlename' name='middlename' placeholder='Your caracter middlename'onChange={handleInputChange} value={formData.middlename}/>
            </div>
            {/* ------------------------------------- */}
            <div className={styles.inputGroup}>
                <label htmlFor='email'>Email</label>
                <input type='email' id='email' name='email' placeholder='Jon.w@exemple.com' onChange={handleInputChange} value={formData.email} required />
            </div>
            {/* ------------------------------------- */}
            <div className={styles.inputGroup}>
                <label htmlFor='password'>Password</label>
                <input type='password' id='password' name='password' onChange={handleInputChange} value={formData.password} required />
            </div>
            <div className={styles.inputGroup}>
                <label htmlFor='password'>Confirm Password</label>
                <input type='password' id='confirm-password' name='confirmPassword' onChange={handleInputChange} value={formData.confirmPassword} required />
            </div>
            {/* ------------------------------------- */}
            <div className={styles.terms}>
                <input type='checkbox' id='terms' name='terms' onChange={handleCheckboxChange} checked={formData.terms} required />  
                <label htmlFor='terms'>Agree with terms and conditions</label>
            </div>
            {/* Sends an error back if there is issues */}
            {error && <p> {error} </p>}

            <button className={styles.signUpBtn}>Sign up</button>
            <p>
                Already have an account? Log in {''}
                <NavLink to='/sign-in' className={styles.signInLink}>here</NavLink>
            </p>
            </form>
            
        </div>
    );
}

export default SignUp;