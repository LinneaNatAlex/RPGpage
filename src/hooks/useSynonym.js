import { useState, useCallback } from "react";

/**
 * Custom hook for fetching synonyms from Datamuse API
 * Datamuse is completely free with no API key required and no known rate limits
 * @returns {Object} { synonyms, loading, error, fetchSynonyms }
 */
export const useSynonym = () => {
  const [synonyms, setSynonyms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch synonyms for a given word from Datamuse API
   * @param {string} word - The word to find synonyms for
   * @returns {Promise<void>}
   */
  const fetchSynonyms = useCallback(async (word) => {
    if (!word || word.trim().length === 0) {
      setSynonyms([]);
      return;
    }

    // Handle contractions - skip them
    const contractions = {
      "can't": true, "won't": true, "don't": true, "doesn't": true,
      "didn't": true, "isn't": true, "aren't": true, "wasn't": true,
      "weren't": true, "hasn't": true, "haven't": true, "hadn't": true,
      "wouldn't": true, "couldn't": true, "shouldn't": true, "mustn't": true,
      "i'm": true, "you're": true, "he's": true, "she's": true,
      "it's": true, "we're": true, "they're": true,
    };

    let cleanWord = word.trim().toLowerCase();
    
    // Skip contractions
    if (contractions[cleanWord] || cleanWord.includes("'")) {
      setSynonyms([]);
      return;
    }

    // Remove punctuation, keep only letters
    cleanWord = cleanWord.replace(/[^\w]/g, "");
    
    // Skip if word is too short or contains spaces
    if (cleanWord.length < 2 || cleanWord.includes(" ")) {
      setSynonyms([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use Datamuse API - ONLY rel_syn (direct synonyms)
      // ml (means like) gives related words/slang, not synonyms
      const datamuseUrl = `https://api.datamuse.com/words?rel_syn=${encodeURIComponent(cleanWord)}&max=100`;

      const responseSyn = await fetch(datamuseUrl).catch(() => null);

      let dataSyn = [];

      if (responseSyn && responseSyn.ok) {
        dataSyn = await responseSyn.json();
      }

      // ONLY use rel_syn results - these are actual synonyms
      const allResults = [];
      
      if (dataSyn.length > 0) {
        dataSyn.forEach(item => {
          allResults.push({ word: item.word, score: item.score || 0 });
        });
      }

      // Sort by score (higher score = better synonym match)
      allResults.sort((a, b) => (b.score || 0) - (a.score || 0));

      // Filter to only English words: letters only, no spaces, hyphens, or special characters
      const synonymList = allResults
        .map(item => item.word?.trim())
        .filter((syn) => {
          if (!syn || typeof syn !== 'string') return false;
          
          // Must be: only English letters (a-z, A-Z), no spaces, no hyphens, no special chars
          // Must not be the same as the original word
          // Must be reasonable length
          return (
            syn.length >= 2 &&
            syn.length <= 30 &&
            /^[a-zA-Z]+$/.test(syn) && // Only English letters, nothing else
            syn.toLowerCase() !== cleanWord &&
            !syn.includes(' ') && // Double-check no spaces
            !syn.includes('-') && // No hyphens
            !syn.includes('_') // No underscores
          );
        })
        .sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' })) // Sort alphabetically
        // Show all synonyms (no limit)
      
      setSynonyms(synonymList);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setSynonyms([]);
      setLoading(false);
    }
  }, []);

  return { synonyms, loading, error, fetchSynonyms };
};
