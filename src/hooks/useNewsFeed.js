import { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

const useNewsFeed = () => {
  const [news, setNews] = useState([]); // saves the news data in the state variable

  // fetches the documnet from the NEWS collectins, and stores all the data in the news state variable
  const fetchNews = async () => {
    try {
      // This fetched all of the documents form the news collection in the firestore db.
      const snapshot = await getDocs(collection(db, "news"));
      const newsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNews(newsData);
    } catch (error) {
      console.error("Error fetching news: ", error);
    }
  };
  //  USE EFFECT HOOK uset to gather the news data when the component is mounted
  useEffect(() => {
    fetchNews();
  }, []);

  // Returns data and the to again gather the news data.

  return { news, refetchNews: fetchNews };
};

export default useNewsFeed;
