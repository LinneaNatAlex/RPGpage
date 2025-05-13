import { signInWithEmailAndPassword } from 'firebase/auth';
import styles from './SignIn.module.css';
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { auth } from '../../firebaseConfig';
import Train from '../../assets/VideoBackgrounds/Train.mp4';

const SignIn = () => {
    //declare the state variables.
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    })
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    // retrive form data
    const handleChange = (e) => {
        const {name, value } = e.target;
        setFormData((prevData)=>({
            ...prevData,
            [name]: value,
        }));
    };
    // Signing users in
    const handleSignIn = async (e)=> {
        e.preventDefault();
        setError(null);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;
            navigate('/');
            console.log('This wizard had enterd the castle', user);
        } catch (error) {

        }
    }

    return <div className={styles.signInContainer}>
        <video autoPlay loop muted className={styles.backgroundVideo}>
            <source src={Train} type='video/mp4'/>
            </video>

        <form className={styles.signInForm}>
            <h2 className={styles.signInTitle}>Enter the Castle</h2>
            <div className={styles.inputGroup}>
                <label htmlFor='email'>Email</label>
                <input type='email' id='email' name='email' onChange={handleChange}/>
            </div>
            <div className={styles.inputGroup}>
                <label htmlFor='password'>Password</label>
                <input type='password' id='password' name='password'onChange={handleChange}/>
            </div>
            <button className={styles.signInBtn} onClick={handleSignIn}> Enter Castle</button>
            <p>
                Dont have an account? Create one {''}
                <NavLink to='/sign-up' className={styles.signUpLink}>here</NavLink>
            
            </p>
        </form>
    </div>
};

export default SignIn;