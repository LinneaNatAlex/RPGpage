import { useState, useEffect } from "react";
import styles from "./SortingQuiz.module.css";
import Button from "../Button/Button";

// Enhanced magical sorting quiz with personality-based questions
const allQuestions = [
  {
    question: "What are you most drawn to?",
    answers: [
      { text: "The full moon and the wild power of nature", race: "Werewolf" },
      { text: "The mysteries of the night and immortality", race: "Vampire" },
      { text: "Wands, herbs, and magical rituals", race: "Wizard" },
      { text: "Ancient forests and timeless wisdom", race: "Elf" },
    ],
  },
  {
    question: "Which description fits you best?",
    answers: [
      { text: "Strong, loyal, and a bit wild", race: "Werewolf" },
      { text: "Elegant, clever, and resourceful", race: "Vampire" },
      { text: "Creative, intuitive, and curious", race: "Wizard" },
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
      { text: "Brew potions and master new spells", race: "Wizard" },
      { text: "Learn nature's secrets and protect others", race: "Elf" },
    ],
  },
  {
    question: "Which element do you feel most connected to?",
    answers: [
      { text: "Earth and animals", race: "Werewolf" },
      { text: "Night and blood", race: "Vampire" },
      { text: "Fire and magic", race: "Wizard" },
      { text: "Air and light", race: "Elf" },
    ],
  },
  {
    question: "How do you handle conflict?",
    answers: [
      {
        text: "Face it head-on with raw strength and determination",
        race: "Werewolf",
      },
      {
        text: "Use cunning strategy and psychological manipulation",
        race: "Vampire",
      },
      {
        text: "Find creative solutions and magical alternatives",
        race: "Wizard",
      },
      {
        text: "Seek peaceful resolution and diplomatic solutions",
        race: "Elf",
      },
    ],
  },
  {
    question: "What motivates you most?",
    answers: [
      { text: "Protecting your pack and loved ones", race: "Werewolf" },
      { text: "Gaining power, knowledge, and eternal life", race: "Vampire" },
      {
        text: "Discovering new magic and understanding mysteries",
        race: "Wizard",
      },
      { text: "Maintaining balance and harmony in the world", race: "Elf" },
    ],
  },
  {
    question: "In a group project, you are most likely to:",
    answers: [
      { text: "Take charge and lead with passion", race: "Werewolf" },
      { text: "Manipulate others to achieve your goals", race: "Vampire" },
      { text: "Come up with innovative ideas and solutions", race: "Wizard" },
      { text: "Ensure everyone works together harmoniously", race: "Elf" },
    ],
  },
  {
    question: "Your ideal living environment would be:",
    answers: [
      { text: "A rustic cabin deep in the wilderness", race: "Werewolf" },
      {
        text: "An elegant mansion with dark, mysterious rooms",
        race: "Vampire",
      },
      {
        text: "A magical tower filled with books and experiments",
        race: "Wizard",
      },
      { text: "A treehouse high in an ancient forest", race: "Elf" },
    ],
  },
  {
    question: "When you're stressed, you tend to:",
    answers: [
      { text: "Get aggressive and need physical activity", race: "Werewolf" },
      { text: "Withdraw and become more secretive", race: "Vampire" },
      {
        text: "Immerse yourself in research or creative projects",
        race: "Wizard",
      },
      { text: "Seek nature and quiet contemplation", race: "Elf" },
    ],
  },
  {
    question: "Your greatest fear is:",
    answers: [
      { text: "Losing control and hurting those you love", race: "Werewolf" },
      { text: "Being discovered and losing your power", race: "Vampire" },
      { text: "Running out of knowledge or magical ability", race: "Wizard" },
      {
        text: "Watching the world fall into chaos and destruction",
        race: "Elf",
      },
    ],
  },
  {
    question: "In your free time, you prefer to:",
    answers: [
      { text: "Hunt, run, or engage in physical activities", race: "Werewolf" },
      { text: "Read ancient texts or plan elaborate schemes", race: "Vampire" },
      {
        text: "Experiment with new spells or study magical theory",
        race: "Wizard",
      },
      { text: "Meditate, garden, or commune with nature", race: "Elf" },
    ],
  },
  {
    question: "Your approach to friendship is:",
    answers: [
      {
        text: "Intense loyalty - you'd die for your friends",
        race: "Werewolf",
      },
      {
        text: "Cautious trust - you keep your true self hidden",
        race: "Vampire",
      },
      {
        text: "Intellectual connection - you bond over shared interests",
        race: "Wizard",
      },
      {
        text: "Deep understanding - you value emotional connection",
        race: "Elf",
      },
    ],
  },
  {
    question: "Your ideal pet would be:",
    answers: [
      {
        text: "A loyal wolf companion who runs by your side",
        race: "Werewolf",
      },
      { text: "A mysterious black cat with ancient wisdom", race: "Vampire" },
      {
        text: "A magical owl that delivers messages and spells",
        race: "Wizard",
      },
      {
        text: "A graceful deer that understands nature's secrets",
        race: "Elf",
      },
    ],
  },
  {
    question: "When making decisions, you rely most on:",
    answers: [
      { text: "Your instincts and gut feelings", race: "Werewolf" },
      { text: "Careful analysis and strategic thinking", race: "Vampire" },
      { text: "Research, logic, and magical intuition", race: "Wizard" },
      { text: "Emotional wisdom and moral compass", race: "Elf" },
    ],
  },
  {
    question: "Your favorite time of day is:",
    answers: [
      { text: "Dawn - when the world awakens with energy", race: "Werewolf" },
      {
        text: "Midnight - when shadows dance and secrets whisper",
        race: "Vampire",
      },
      {
        text: "Twilight - when magic is strongest and mysteries unfold",
        race: "Wizard",
      },
      { text: "Sunset - when nature's beauty reaches its peak", race: "Elf" },
    ],
  },
  {
    question: "In a crisis, your first instinct is to:",
    answers: [
      { text: "Protect others with fierce determination", race: "Werewolf" },
      {
        text: "Find the most advantageous position for yourself",
        race: "Vampire",
      },
      {
        text: "Analyze the situation and find a magical solution",
        race: "Wizard",
      },
      { text: "Calm others and restore peace and balance", race: "Elf" },
    ],
  },
  {
    question: "Your greatest strength is:",
    answers: [
      { text: "Physical power and unwavering loyalty", race: "Werewolf" },
      { text: "Mental acuity and persuasive charm", race: "Vampire" },
      {
        text: "Magical knowledge and creative problem-solving",
        race: "Wizard",
      },
      { text: "Emotional intelligence and natural wisdom", race: "Elf" },
    ],
  },
  {
    question: "You're most comfortable when:",
    answers: [
      { text: "Surrounded by your pack or close friends", race: "Werewolf" },
      { text: "Alone in your private sanctuary", race: "Vampire" },
      { text: "Immersed in study or magical experimentation", race: "Wizard" },
      {
        text: "In nature, feeling connected to all living things",
        race: "Elf",
      },
    ],
  },
  {
    question: "Your ideal magical power would be:",
    answers: [
      {
        text: "Shape-shifting and enhanced physical abilities",
        race: "Werewolf",
      },
      { text: "Mind control and immortality", race: "Vampire" },
      { text: "Elemental magic and spell creation", race: "Wizard" },
      { text: "Nature communication and healing abilities", race: "Elf" },
    ],
  },
  {
    question: "When you're angry, you:",
    answers: [
      { text: "Get physically aggressive and need to move", race: "Werewolf" },
      { text: "Become cold, calculating, and manipulative", race: "Vampire" },
      { text: "Channel your anger into powerful magic", race: "Wizard" },
      { text: "Withdraw and seek inner peace", race: "Elf" },
    ],
  },
  {
    question: "Your dream adventure would be:",
    answers: [
      { text: "Leading a pack through uncharted wilderness", race: "Werewolf" },
      {
        text: "Uncovering ancient secrets in forgotten tombs",
        race: "Vampire",
      },
      {
        text: "Discovering lost magical knowledge in hidden libraries",
        race: "Wizard",
      },
      { text: "Journeying to sacred groves and mystical forests", race: "Elf" },
    ],
  },
  {
    question: "You value most in others:",
    answers: [
      { text: "Honesty, loyalty, and raw courage", race: "Werewolf" },
      { text: "Intelligence, ambition, and mysterious depth", race: "Vampire" },
      { text: "Creativity, wisdom, and magical potential", race: "Wizard" },
      { text: "Kindness, harmony, and spiritual connection", race: "Elf" },
    ],
  },
];

import { raceDescriptions } from "./raceDescriptions";

const SortingQuiz = ({ onClose, onResult }) => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [resultRace, setResultRace] = useState(null);

  // Randomize questions on component mount
  useEffect(() => {
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    // Select 8 random questions for each quiz
    const selectedQuestions = shuffled.slice(0, 8);

    // Randomize the order of answers for each question
    const randomizedQuestions = selectedQuestions.map((question) => ({
      ...question,
      answers: [...question.answers].sort(() => Math.random() - 0.5),
    }));

    setQuestions(randomizedQuestions);
  }, []);

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

  // Don't render until questions are loaded
  if (questions.length === 0) {
    return (
      <div className={styles.SortingQuizModal}>
        <div className={styles.SortingQuizModalContent}>
          <div className={styles.SortingQuizContent}>
            <div className={styles.questionText}>
              <h3>Magical Race Sorting Quiz</h3>
              <p>Preparing your personalized quiz...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Modal med quiz eller resultat
  return (
    <div className={styles.SortingQuizModal}>
      <div className={styles.SortingQuizModalContent}>
        <div className={styles.SortingQuizContent}>
          {!resultRace ? (
            <>
              <div className={styles.questionText}>
                <h3>Magical Race Sorting Quiz</h3>
                <p>
                  Question {currentQuestion + 1} of {questions.length}
                </p>
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
                You have been sorted as:{" "}
                {raceDescriptions[resultRace]?.title || resultRace}
              </h3>
              <p>{raceDescriptions[resultRace]?.description}</p>
              <Button onClick={onClose} className={styles.ExitButton}>
                <strong>✕</strong>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SortingQuiz;
