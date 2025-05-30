// importing the nessesarty function that is needed to send messages to the database
import { useState } from "react";
import useChatMessages from "../../hooks/useChatMessages";
import { db, auth } from "../../firebaseConfig";
import styles from "./LiveRP.module.css"; // importing the css module for styling
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import Button from "../Button/Button";
import ErrorMessage from "../ErrorMessage/ErrorMessage";

// costume hooks usestate to hold the new message input value
// useChatMessages costume hook to fetch messages, useState manages the states of 'newMess' input value!
const LiveRP = () => {
  const { rpgGrateHall } = useChatMessages(); // destructuring the messages to get the rpgGrateHall messages
  const [newMess, setNewMess] = useState("");
  const [error, setError] = useState(null);

  // ----------------------SEND MESSAGE FUNCTION-----------------------
  const sendtMessage = async (e) => {
    e.preventDefault(); // preventing the form from refresing the page when form is submited

    if (!newMess.trim()) return;

    await addDoc(collection(db, "rpgGrateHall"), {
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
        {rpgGrateHall.map(
          (
            message //  this scans throug the messages then return a div for each message.
          ) => (
            <div key={message.id} className={styles.message}>
              <strong className={styles.messageSender}>{message.sender}</strong>
              :{" "}
              {/* This is where the message will be displayed! Sender with caracter name followed by the text */}
              {message.text} {/* the message shows the author/user/messanger */}
            </div>
          )
        )}
      </div>
      <form className={styles.RrchatForm} onSubmit={sendtMessage}>
        <input
          value={newMess}
          onChange={(e) => setNewMess(e.target.value)}
          type="text"
          placeholder="your messages..."
          maxLength={200}
          className={`${styles.chatInput} ${styles.textArea}`}
        />
        {/* ^ form input field for new messages */}
        <Button type="submit" className={styles.RpchatBtn}>
          Send
        </Button>
        {error && <ErrorMessage message={error} />}
      </form>
    </div>
  );
};

export default LiveRP;
