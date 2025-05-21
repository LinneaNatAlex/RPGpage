import { useState, useEffect } from "react";
import { useAuth } from "../../context/authContext"
import useUserRoles from "../../hooks/useUserRoles";
import { db } from "../../firebaseConfig";  
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";

const NewsFeed = () => {
    

    const { user } = useAuth();
    const { userRoles, loading } = useUserRoles();
    const [newsList, setNewsList] = useState([]);
    const [newPost, setNewPost] = useState("");
    const isAdmin = Array.isArray(userRoles) && userRoles.includes("admin");


    useEffect(() => {
        const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (Snapshot) => {
            const newData = Snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log("Fetched news data:", newData);
            
            setNewsList(newData);
        });
        return () => unsubscribe();
        
    }, []);

    const handlePostSubmit = async (e) => {
        e.preventDefault();
        if (!newPost.trim()) return;

        await addDoc(collection(db, "news"), {
            content: newPost,
            createdAt: serverTimestamp(),
            author: user.displayName,
        });
        setNewPost('');

        if (loading || !userRoles) return <p>Loading...</p>;

    return (
        
        <div className={styles.newsFeedContainer}>
            <h2>News Feed</h2>
            {isAdmin && (
                <>
                    <textarea value={newPost} onChange={(e) => setNewPost(e.target.value)} placeholder="newws here" />
                    <Button onClick={handlePostSubmit}>Post</Button>
                </>
            )}
        </div>
    )};
    <ul>
        {newsList.map((item) => (
            <li key={item.id}>
                <h3>{item.title}</h3>
                <strong>{item.displayName}</strong>: {item.content} <br />
            </li>
        ))}
    </ul> 
    console.log("Roller for bruker:", userRoles);
console.log("Er admin?", isAdmin);

};

export default NewsFeed;
