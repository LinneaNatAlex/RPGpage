import { useState } from "react"
import  useChatMessages  from "../../hooks/useChatMessages";
import { db, auth } from "../../firebaseConfig";
import styles from './Chat.module.css';
import { addDoc, collection, serverTimestamp } from "firebase/firestore";



const Chat = () => {
    const messages = useChatMessages();
    const [newMess, setNewMess] = useState('');

    const sendtMessage = async (e) => {
        e.preventDefault();
        if (!newMess.trim()) return;
        

        await addDoc(collection(db, 'messages'), {
            text: newMess,
            timestamp: serverTimestamp(),
            sender: auth.currentUser.displayName 
        });

        setNewMess('');
    }


return <div className={styles.chatContainer}>
    <div className={styles.chatMessages}>
        {messages.map((message) => (
            <div key={message.id} className={styles.message}>
                <strong>{message.sender}</strong>: {message.text}
            </div>
        ))}
    </div>

    <form className={styles.chatForm} onSubmit={sendtMessage}>
        <input
            value={newMess}
            onChange={(e) => setNewMess(e.target.value)}
            type='text'
            placeholder='your messages...'
            maxLength={200}
            className={styles.chatInput}
        />
        <button type='submit' className={styles.chatBtn}>Send</button>
    </form>
</div>
};

export default Chat;

