import { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

const useNewsFeed = () => {
  const [news, setNews] = useState([]);
  const [titles, setTitle] = useState([]);

  const fetchNews = async () => {
    try {
      const snapshot = await getDocs(collection(db, "news"));
      const newsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const titlesOnly = snapshot.docs.map((doc) => ({
        id: doc.id,
        title: doc.data().title,
      }));
      setTitle(titlesOnly);
      setNews(newsData);
    } catch (error) {
      console.error("Error fetching news: ", error);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  return { news, titles, refetchNews: fetchNews };
};

export default useNewsFeed;
