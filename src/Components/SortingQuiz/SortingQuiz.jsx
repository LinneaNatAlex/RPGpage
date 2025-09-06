import { useState } from "react";
import styles from "./SortingQuiz.module.css";
import Button from "../Button/Button";

// Magical sorting quiz in English
const questions = [
  {
    question: "What are you most drawn to?",
    answers: [
      { text: "The full moon and the wild power of nature", race: "Werewolf" },
      { text: "The mysteries of the night and immortality", race: "Vampire" },
      { text: "Wands, herbs, and magical rituals", race: "Witch" },
      { text: "Ancient forests and timeless wisdom", race: "Elf" },
    ],
  },
  {
    question: "Which description fits you best?",
    answers: [
      { text: "Strong, loyal, and a bit wild", race: "Werewolf" },
      { text: "Elegant, clever, and resourceful", race: "Vampire" },
      { text: "Creative, intuitive, and curious", race: "Witch" },
      { text: "Just, wise, and harmonious", race: "Elf" },
    ],
  },
  {
    question: "What would you most love to do at a magical academy?",
    answers: [
      {
        text: "Run through the enchanted woods under the moonlight",
        race: "Werewolf",
      },
      { text: "Study ancient tomes about immortality", race: "Vampire" },
      { text: "Brew potions and master new spells", race: "Witch" },
      { text: "Learn nature’s secrets and protect others", race: "Elf" },
    ],
  },
  {
    question: "Which element do you feel most connected to?",
    answers: [
      { text: "Earth and animals", race: "Werewolf" },
      { text: "Night and blood", race: "Vampire" },
      { text: "Fire and magic", race: "Witch" },
      { text: "Air and light", race: "Elf" },
    ],
  },
];

import { raceDescriptions } from "./raceDescriptions";

const SortingQuiz = ({ onClose, onResult }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [resultRace, setResultRace] = useState(null);

  const handleAnswers = (race) => {
    const newAnswers = [...selectedAnswers, race];
    if (currentQuestion + 1 < questions.length) {
      setSelectedAnswers(newAnswers);
      setCurrentQuestion(currentQuestion + 1);
    } else {
      const result = newAnswers.reduce((acc, r) => {
        acc[r] = (acc[r] || 0) + 1;
        return acc;
      }, {});
      const sortedRaces = Object.entries(result).sort((a, b) => b[1] - a[1]);
      setResultRace(sortedRaces[0][0]);
      onResult(sortedRaces[0][0]);
    }
  };

  // Modal med quiz eller resultat
  return (
    <div className={styles.SortingQuizModal}>
      <div className={styles.SortingQuizContent}>
        {!resultRace ? (
          <>
            <div className={styles.questionText}>
              <h3>Magical Race Sorting Quiz</h3>
              <p>{questions[currentQuestion].question}</p>
            </div>
            <div>
              {questions[currentQuestion].answers.map((answer) => (
                <Button
                  className={styles.answerButton}
                  key={answer.text}
                  onClick={() => handleAnswers(answer.race)}
                >
                  <div className={styles.answerText}>{answer.text}</div>
                </Button>
              ))}
            </div>
            <Button onClick={onClose} className={styles.ExitButton}>
              <strong>✕</strong>
            </Button>
          </>
        ) : (
          <div className={styles.resultContainer}>
            <h3>
              Du ble sortert som:{" "}
              {raceDescriptions[resultRace]?.title || resultRace}
            </h3>
            <p>{raceDescriptions[resultRace]?.description}</p>
            {/* Info link removed, description is now longer and in English */}
            <Button onClick={onClose} className={styles.ExitButton}>
              <strong>✕</strong>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SortingQuiz;
