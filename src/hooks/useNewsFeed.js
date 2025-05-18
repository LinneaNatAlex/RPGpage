import { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";


const useNewsFeed = () => {
    const [news, setNews] = useState([]);
    const fetchNews = async () => {
            try {
                const snapshot = await getDocs(collection(db, 'news'));
                const newsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setNews(newsData);
            } catch (error) {
                console.error("Error fetching news: ", error);
            }
        }

    useEffect(() => {
        fetchNews();
    }, []);

    return { news, refetchNews: fetchNews };
}

export default useNewsFeed;
