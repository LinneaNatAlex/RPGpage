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
        // this clears the input field after pressing enter!
        setNewMess('');
    }

// Chatbox container.

return <div className={styles.chatContainer}>
    <div className={styles.chatMessages}>
        {messages.map((message) => (
            <div key={message.id} className={styles.message}>
                {/* This is where the message will be displayed! Sender with caracter name followed by the text */}
                <strong>{message.sender}</strong>: {message.text}
            </div>
        ))}
    </div>

    <form className={styles.chatForm} onSubmit={sendtMessage}>
        {/* Input field for new messages */}
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

