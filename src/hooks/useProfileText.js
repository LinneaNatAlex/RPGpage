import { useEffect, useState } from "react";
import { getDoc, doc, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../context/authContext";

const useProfileText = () => {
  const { user } = useAuth();
  const [mode, setMode] = useState("text");
  const [text, setText] = useState("");
  const [html, setHtml] = useState("");
  const [css, setCss] = useState("");
  const [loading, setLoading] = useState(true);

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
      }

      setLoading(false);
    };
    fetchText();
  }, [user]);

  const storeText = async (mode, textData, htmlData, cssData) => {
    if (!user) return;
    const dataToStore = {
      profileMode: mode,
      profileText: textData,
      profileHtml: htmlData,
      profileCss: cssData,
    };
    await setDoc(doc(db, "users", user.uid), dataToStore, { merge: true });
    setMode(mode);
    setHtml(htmlData);
    setCss(cssData);
    setText(textData);
  };
  return { text, loading, storeText, mode, html, css };
};

export default useProfileText;
