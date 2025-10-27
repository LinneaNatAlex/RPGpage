import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebaseConfig";

// Cache for topic counts
let cachedTopicCounts = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5000; // 5 seconds cache

const useTopicCounts = () => {
  const [topicCounts, setTopicCounts] = useState({
    commonroom: 0,
    ritualroom: 0,
    moongarden: 0,
    bloodbank: 0,
    nightlibrary: 0,
    gymnasium: 0,
    infirmary: 0,
    greenhouse: 0,
    artstudio: 0,
    kitchen: 0,
    detentionclassroom: 0,
    '16plus': 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTopicCounts = async () => {
      try {
        // Check cache first, but only if we have recent data
        const now = Date.now();
        if (cachedTopicCounts && (now - lastFetchTime) < CACHE_DURATION) {
          setTopicCounts(cachedTopicCounts);
          return;
        }

        // Always fetch fresh data on first load
        setLoading(true);
        const counts = {
          commonroom: 0,
          ritualroom: 0,
          moongarden: 0,
          bloodbank: 0,
          nightlibrary: 0,
          gymnasium: 0,
          infirmary: 0,
          greenhouse: 0,
          artstudio: 0,
          kitchen: 0,
          detentionclassroom: 0,
          '16plus': 0
        };
        
        // List of all forum rooms
        const forumRooms = [
          'ritualroom', 
          'moongarden',
          'bloodbank',
          'nightlibrary',
          'gymnasium',
          'infirmary',
          'greenhouse',
          'artstudio',
          'kitchen',
          'detentionclassroom',
          '16plus'
        ];

        // Race-specific commonrooms
        const raceCommonrooms = ['elf_commonroom', 'witch_commonroom', 'vampire_commonroom', 'werewolf_commonroom'];

        // Fetch topic counts for each room
        for (const room of forumRooms) {
          try {
            const topicsRef = collection(db, `forums/${room}/topics`);
            const topicsSnap = await getDocs(topicsRef);
            counts[room] = topicsSnap.size;
          } catch (error) {
            counts[room] = 0;
          }
        }

        // Fetch topic counts for race-specific commonrooms and combine them
        let totalCommonroomTopics = 0;
        for (const room of raceCommonrooms) {
          try {
            const topicsRef = collection(db, `forums/${room}/topics`);
            const topicsSnap = await getDocs(topicsRef);
            totalCommonroomTopics += topicsSnap.size;
          } catch (error) {
          }
        }
        counts.commonroom = totalCommonroomTopics;

        // Cache the results
        cachedTopicCounts = counts;
        lastFetchTime = Date.now();
        
        setTopicCounts(counts);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    // Fetch immediately on mount
    fetchTopicCounts();
    
    // Update every 30 seconds to keep counts fresh
    const interval = setInterval(fetchTopicCounts, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return { topicCounts, loading };
};

export default useTopicCounts;
