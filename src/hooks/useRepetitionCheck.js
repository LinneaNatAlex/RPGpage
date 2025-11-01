import { useState, useCallback } from "react";

/**
 * Custom hook to detect repetitive words/phrases in text
 * Returns warnings when text has too much repetition
 * @returns {Object} { checkRepetition, warnings, repetitions }
 */
export const useRepetitionCheck = () => {
  const [warnings, setWarnings] = useState([]);
  const [repetitions, setRepetitions] = useState([]);

  /**
   * Check for repetitive words and phrases in text
   * @param {string} text - The text to analyze
   * @param {Object} options - Configuration options
   * @param {number} options.wordThreshold - Minimum times a word should appear to be flagged (default: 4)
   * @param {number} options.phraseLength - Length of phrases to check (default: 2-3 words)
   * @returns {Array} Array of warning objects
   */
  const checkRepetition = useCallback((text, options = {}) => {
    if (!text || text.trim().length === 0) {
      setWarnings([]);
      setRepetitions([]);
      return [];
    }

    const {
      wordThreshold = 4, // Word must appear at least 4 times to be flagged
      phraseLength = 2, // Check for 2-word phrases
      minWordLength = 3, // Only check words 3+ characters
    } = options;

    // Common words/sentence connectors that are normal to repeat - ignore these
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can',
      'this', 'that', 'these', 'those', 'it', 'its', 'he', 'she', 'they', 'we', 'you', 'i',
      'him', 'her', 'them', 'us', 'his', 'hers', 'their', 'our', 'my', 'your', 'me', 'him',
      'so', 'then', 'than', 'more', 'most', 'very', 'just', 'only', 'also', 'too', 'not', 'no',
      'if', 'when', 'where', 'why', 'how', 'what', 'who', 'which', 'while', 'during', 'after',
      'before', 'since', 'until', 'about', 'into', 'onto', 'upon', 'within', 'without', 'through',
      'between', 'among', 'though', 'although', 'because', 'since', 'unless', 'except'
    ]);

    // Clean and split text into words
    const cleanText = text.toLowerCase();
    // Remove HTML tags for analysis
    const textWithoutHTML = cleanText.replace(/<[^>]*>/g, " ");
    // Split into words (handle punctuation)
    const words = textWithoutHTML
      .split(/\s+/)
      .map((word) => word.replace(/[^\w]/g, ""))
      .filter((word) => 
        word.length >= minWordLength && 
        !commonWords.has(word) // Filter out common sentence connectors
      );

    const warningsList = [];
    const repetitionsList = [];

    // Count word frequencies (only for non-common words)
    const wordCounts = {};
    words.forEach((word) => {
      if (word.length >= minWordLength && !commonWords.has(word)) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    });

    // Find overused words (focus on words that can be varied - like "like", "very", "really", etc.)
    const overusedWords = Object.entries(wordCounts)
      .filter(([word, count]) => count >= wordThreshold)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // Top 5 most overused

    if (overusedWords.length > 0) {
      const totalNonCommonWords = words.length;
      overusedWords.forEach(([word, count]) => {
        // Calculate percentage based on non-common words only
        const percentage = ((count / totalNonCommonWords) * 100).toFixed(1);
        // Lower threshold since we're only checking variable words
        // Warn if word appears 3+ times and is > 2% of variable words
        if (count >= 3 && parseFloat(percentage) > 2) {
          warningsList.push({
            type: "word",
            text: word,
            count,
            percentage: parseFloat(percentage),
            message: `"${word}" is used ${count} times. Consider using synonyms to vary your language.`,
          });
          repetitionsList.push({
            word,
            count,
            percentage: parseFloat(percentage),
          });
        }
      });
    }

    // Check for repeated phrases (2-3 word combinations)
    if (phraseLength > 0 && words.length >= phraseLength) {
      const phraseCounts = {};
      
      // Check 2-word phrases
      for (let i = 0; i < words.length - 1; i++) {
        const phrase = `${words[i]} ${words[i + 1]}`;
        phraseCounts[phrase] = (phraseCounts[phrase] || 0) + 1;
      }

      // Check 3-word phrases if enabled
      if (phraseLength >= 3) {
        for (let i = 0; i < words.length - 2; i++) {
          const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
          phraseCounts[phrase] = (phraseCounts[phrase] || 0) + 1;
        }
      }

      // Find repeated phrases
      const repeatedPhrases = Object.entries(phraseCounts)
        .filter(([phrase, count]) => count >= 3) // Phrase appears 3+ times
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3); // Top 3 most repeated

      repeatedPhrases.forEach(([phrase, count]) => {
        warningsList.push({
          type: "phrase",
          text: phrase,
          count,
          message: `The phrase "${phrase}" is repeated ${count} times. Try varying your language.`,
        });
        repetitionsList.push({
          phrase,
          count,
        });
      });
    }

    setWarnings(warningsList);
    setRepetitions(repetitionsList);
    return warningsList;
  }, []);

  return { checkRepetition, warnings, repetitions };
};

