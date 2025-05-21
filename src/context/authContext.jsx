import { createContext, useState, useContext, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { doc, setDoc } from "firebase/firestore";


const authContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            
            setUser(currentUser);
            
            
        if (currentUser) {
            // online is added true
            await setDoc(doc(db, 'users', currentUser.uid), {
                displayName: currentUser.displayName || currentUser.email,
                online: true
            }, { merge: true });

            // using event listener to set the user offline when they leave the page, or else page wont update when guiding back and forth to another page.
            const handleUnload = async () => {
                await setDoc(doc(db, 'users', currentUser.uid), {
                    online: false
                }, { merge: true });
            };
            window.addEventListener('beforeunload', handleUnload);             
        }     
        // Set loading to false after checking the user state
        setLoading(false);
        
        
    });
        return () => unsubscribe();
    }, []);

    return (
        <authContext.Provider value={{ user, loading }}>
            {children}
        </authContext.Provider>
    );
};

// Calling useAuth will return the value of the context later in the app
export const useAuth = () => useContext(authContext);
