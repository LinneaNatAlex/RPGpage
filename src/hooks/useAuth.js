// import { useState } from 'react';
// import { createUserWithEmailAndPassword } from 'firebase/auth';
// import { auth } from '../firebaseConfig';

// export const useAuth = () => {
//     const [user, setUser] = useState(null);
//     const [signUpError, setSignUpError] = useState(null);

//     const signUp = async (email, password) => {
//         try {
//             const userCredential = await createUserWithEmailAndPassword(
//                 auth,
//                 email,
//                 password
//             );

//             const user = userCredential.user;
//             setSignInError(null);
//             setUser(user);
//             return userCredential;
//         } catch (error) {
//             setSignInError(error.message);
//             throw error;
//            }
//  };

//  return  {
//     user,
//     signUpError,
//     signUp,
//   };
// };
