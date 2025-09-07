// Import nessesary libraries and hooks
import { useEffect, useState } from "react";
import { getDoc, doc, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../context/authContext";

// costum hooks fetching storing the user's profile content, from firestore.
const useProfileText = () => {
  // state variables to hold data
  const { user } = useAuth();
  const [mode, setMode] = useState("text");
  const [text, setText] = useState("");
  const [html, setHtml] = useState("");
  const [css, setCss] = useState("");
  const [bbcode, setBBCode] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetches the user profile content from firestore, when user changes.
  useEffect(() => {
    const fetchText = async () => {
      if (!user) return;
      const docRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(docRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        setMode(data.profileMode || "text");
        setText(data.profileText || "");
        setHtml(data.profileHtml || "");
        setCss(data.profileCss || "");
        setBBCode(data.profileBBCode || "");
      }

      setLoading(false);
    };
    fetchText();
  }, [user]);

  // Profile content is stored in the firestore.

  const storeText = async (mode, textData, htmlData, cssData, bbcodeData) => {
    if (!user) return;
    const dataToStore = {
      profileMode: mode,
      profileText: textData,
      profileHtml: htmlData,
      profileCss: cssData,
      profileBBCode: bbcodeData,
    };
    await setDoc(doc(db, "users", user.uid), dataToStore, { merge: true });
    //  Updating the local state to save data
    setMode(mode);
    setHtml(htmlData);
    setCss(cssData);
    setText(textData);
    setBBCode(bbcodeData);
  };
  // returning the userprofile data.
  return { text, loading, storeText, mode, html, css, bbcode };
};

export default useProfileText;
