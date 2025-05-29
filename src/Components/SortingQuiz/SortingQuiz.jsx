import { useState } from "react";
import styles from "./SortingQuiz.module.css";
import Button from "../Button/Button";

const questions = [
  {
    question:
      "You’re given an enormous task with no instructions. What do you do first?",
    answers: [
      {
        text: "Start organizing everything logically — you'll figure it out as you go.",
        house: "RavenBird",
      },
      {
        text: "Find allies you trust and split the work fairly.",
        house: "BadgerPuff",
      },
      {
        text: "Dive in headfirst, trusting your instincts to guide you.",
        house: "LionClaw",
      },
      {
        text: "Analyze the situation carefully, considering all possible outcomes.",
        house: "Snake",
      },
    ],
  },
  {
    question: "How do you approach a new project?",
    answers: [
      { text: "I create a detailed plan before starting.", house: "RavenBird" },
      {
        text: "I gather a team and brainstorm ideas together.",
        house: "BadgerPuff",
      },
      {
        text: "I jump in and start building, learning as I go.",
        house: "LionClaw",
      },
      {
        text: "I research extensively to understand all aspects.",
        house: "Snake",
      },
    ],
  },
  {
    question: "What is your ideal working environment?",
    answers: [
      { text: "A quiet space with minimal distractions.", house: "RavenBird" },
      { text: "A collaborative team atmosphere.", house: "BadgerPuff" },
      { text: "A fast-paced, dynamic setting.", house: "LionClaw" },
      {
        text: "A structured environment with clear guidelines.",
        house: "Snake",
      },
    ],
  },
  {
    question: "How do you handle failure?",
    answers: [
      {
        text: "I analyze what went wrong and adjust my approach.",
        house: "RavenBird",
      },
      {
        text: "I seek support from friends and colleagues.",
        house: "BadgerPuff",
      },
      {
        text: "I learn from it and try again with renewed energy.",
        house: "LionClaw",
      },
      {
        text: "I reflect on the experience to gain deeper insights.",
        house: "Snake",
      },
    ],
  },
  {
    question: "What motivates you the most?",
    answers: [
      {
        text: "The pursuit of knowledge and understanding.",
        house: "RavenBird",
      },
      {
        text: "Building strong relationships and community.",
        house: "BadgerPuff",
      },
      { text: "Achieving personal goals and challenges.", house: "LionClaw" },
      { text: "Mastering complex problems and strategies.", house: "Snake" },
    ],
  },
];

const SortingQuiz = ({ onClose, onResult }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);

  const handleAnswers = (house) => {
    const newAnswers = [...selectedAnswers, house];
    if (currentQuestion + 1 < questions.length) {
      setSelectedAnswers(newAnswers);
      setCurrentQuestion(currentQuestion + 1);
    } else {
      const result = newAnswers.reduce((acc, h) => {
        acc[h] = (acc[h] || 0) + 1;
        return acc;
      }, {});
      const sortedHouses = Object.entries(result).sort((a, b) => b[1] - a[1]);
      onResult(sortedHouses[0][0]);
      onClose();
    }
  };

  return (
    <div className={styles.SortingQuizModal}>
      <div className={styles.SortingQuizContent}>
        <h3>Sorting Quiz</h3>
        <p>{questions[currentQuestion].question}</p>
        <div>
          {questions[currentQuestion].answers.map((answer) => (
            <Button
              key={answer.text}
              onClick={() => handleAnswers(answer.house)}
            >
              {answer.text}
            </Button>
          ))}
        </div>
        <Button onClick={onClose} className={styles.ExitButton}>
          Exit question
        </Button>
      </div>
    </div>
  );
};

export default SortingQuiz;
