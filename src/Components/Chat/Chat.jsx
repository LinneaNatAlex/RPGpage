// importing the nessesarty function that is needed to send messages to the database
import { useState } from "react";
import useChatMessages from "../../hooks/useChatMessages";
import useUsers from "../../hooks/useUser";
import { db, auth } from "../../firebaseConfig";
import styles from "./Chat.module.css";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import Button from "../Button/Button";
import ErrorMessage from "../ErrorMessage/ErrorMessage";

// costume hooks usestate to hold the new message input value
// useChatMessages costume hook to fetch messages, useState manages the states of 'newMess' input value!
const Chat = () => {
  const { messages } = useChatMessages();
  const { users } = useUsers();
  const [newMess, setNewMess] = useState("");
  const [error, setError] = useState(null);

  // ----------------------SEND MESSAGE FUNCTION-----------------------
  const sendtMessage = async (e) => {
    e.preventDefault(); // preventing the form from refresing the page when form is submited

    if (!newMess.trim()) return;

    await addDoc(collection(db, "messages"), {
      text: newMess,
      timestamp: serverTimestamp(), // adds the timestam for the message

      sender: auth.currentUser.displayName,
      // gets the user name from firebase auth
    });

    setNewMess(""); // this clears the input field after pressing enter! Makes sure the input field is empty after sending a message
  };

  // --------------------CHAT FORM AND MESSAGE COMONENT / RENDERING-------------------
  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatMessages}>
        {/* MODULE STYLED CLASSNAME Making sure the style wont interfare or clash with other components */}
        {messages.map((message) => {
          // Find the user object by displayName (case-insensitive)
          const userObj = users.find(
            (u) =>
              u.displayName &&
              u.displayName.toLowerCase() === message.sender?.toLowerCase()
          );
          let roleClass = styles.messageSender;
          if (userObj?.roles?.some((r) => r.toLowerCase() === "headmaster"))
            roleClass += ` ${styles.headmasterSender}`;
          else if (userObj?.roles?.some((r) => r.toLowerCase() === "teacher"))
            roleClass += ` ${styles.teacherSender}`;
          else if (
            userObj?.roles?.some((r) => r.toLowerCase() === "shadowpatrol")
          )
            roleClass += ` ${styles.shadowPatrolSender}`;
          else if (userObj?.roles?.some((r) => r.toLowerCase() === "admin"))
            roleClass += ` ${styles.adminSender}`;
          return (
            <div key={message.id} className={styles.message}>
              <strong className={roleClass}>{message.sender}</strong>:{" "}
              {message.text}
            </div>
          );
        })}
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
        <Button type="submit" className={styles.chatBtn}>
          Send
        </Button>
        {error && <ErrorMessage message={error} />}
      </form>
    </div>
  );
};

export default Chat;
