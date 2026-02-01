import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/authContext.jsx";
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import "./Chat.mobile.css";

const Chat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const messagesEndRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Only render on mobile
  if (!isMobile) {
    return null;
  }

  // Load messages
  useEffect(() => {
    if (!user) return;
    let unsub = null;
    const messagesRef = collection(db, "messages");
    const q = query(messagesRef, orderBy("timestamp", "desc"), limit(50));
    unsub = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .reverse();
      setMessages(messagesData);
    });
    return () => {
      if (unsub) unsub();
    };
  }, [user]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      await addDoc(collection(db, "messages"), {
        text: newMessage,
        sender: user.displayName || "",
        timestamp: serverTimestamp(),
      });
      setNewMessage("");
    } catch (error) {}
  };

  if (!user) return null;

  return (
    <div className={`mobile-chat-container ${isCollapsed ? "collapsed" : ""}`}>
      <div className="mobile-chat-header">
        <h3 className="mobile-chat-title">Global Chat</h3>
        <button
          className="mobile-chat-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? "▲" : "▼"}
        </button>
      </div>

      {!isCollapsed && (
        <>
          <div className="mobile-chat-messages">
            {messages.map((message) => (
              <div key={message.id} className="mobile-message">
                <div className="mobile-message-header">
                  <span className="mobile-message-sender">
                    {message.sender}
                  </span>
                  <span className="mobile-message-time">
                    {message.timestamp?.toDate?.()?.toLocaleTimeString() ||
                      "Now"}
                  </span>
                </div>
                <div className="mobile-message-text">{message.text}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="mobile-chat-form">
            <div className="mobile-chat-input-container">
              <input
                id="mobile-chat-message"
                name="mobileChatMessage"
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="mobile-chat-input"
                maxLength={500}
              />
              <button
                type="submit"
                className="mobile-chat-send"
                disabled={!newMessage.trim()}
              >
                Send
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default Chat;
