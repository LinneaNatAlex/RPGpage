import { useState } from "react";
import useChatMessages from "../../hooks/useChatMessages";
import { db, auth } from "../../firebaseConfig";
import styles from "./Chat.module.css";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
// importing the nessesarty function that is needed to send messages to the database

const Chat = () => {
  const messages = useChatMessages();
  const [newMess, setNewMess] = useState("");
  // costume hooks usestate to hold the new message input value
  // useChatMessages costume hook to fetch messages, useState manages the states of 'newMess' input value!

  const sendtMessage = async (e) => {
    e.preventDefault();
    // ^ preventing the form from refresing the page when form is submited
    if (!newMess.trim()) return;

    await addDoc(collection(db, "messages"), {
      text: newMess,
      timestamp: serverTimestamp(),
      // ^ adds the timestam for the mesage
      sender: auth.currentUser.displayName,
      // ^ gets the user name from firebase auth
    });
    // this clears the input field after pressing enter! Makes sure the input field is empty after sending a message
    setNewMess("");
  };

  // Chatbox container.

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatMessages}>
        {/* MODULE STYLED CLASSNAME Making sure the style wont interfare or clash with other components */}
        {messages.map((message) => (
          // ^ this scans throug the messages then return a div for each message.
          <div key={message.id} className={styles.message}>
            {/* This is where the message will be displayed! Sender with caracter name followed by the text */}
            <strong className={styles.messageSender}>{message.sender}</strong>:{" "}
            {/* the message shows the author/user/messanger */}
            {message.text}
          </div>
        ))}
      </div>
      <form className={styles.chatForm} onSubmit={sendtMessage}>
        <input
          value={newMess}
          onChange={(e) => setNewMess(e.target.value)}
          type="text"
          placeholder="your messages..."
          maxLength={200}
          className={`${styles.chatInput} ${styles.textArea}`}
        />
        {/* ^ form input field for new messages */}
        <button type="submit" className={styles.chatBtn}>
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;
