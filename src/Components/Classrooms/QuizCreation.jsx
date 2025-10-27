import { useState } from "react";
import { db } from "../../firebaseConfig";
import { doc, setDoc, updateDoc, getDoc } from "firebase/firestore";
import { useAuth } from "../../context/authContext";
import useUserRoles from "../../hooks/useUserRoles";
import styles from "./QuizCreation.module.css";

const QuizCreation = ({ classId, onClose, onComplete }) => {
  const { user } = useAuth();
  const { roles } = useUserRoles();
  const [quizData, setQuizData] = useState({
    title: "",
    description: "",
    gradeLevel: 1,
    questions: Array(10).fill().map(() => ({
      question: "",
      options: ["", "", "", ""],
      correctAnswer: null
    }))
  });
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Check if user has permission
  const canCreateQuiz = roles.includes("teacher") || roles.includes("admin");

  if (!canCreateQuiz) {
    return (
      <div className={styles.permissionDenied}>
        <h3>Access Denied</h3>
        <p>Only teachers and admins can create quizzes.</p>
        <button onClick={onClose} className={styles.closeButton}>
          Close
        </button>
      </div>
    );
  }

  const handleQuestionChange = (questionIndex, field, value) => {
    const newQuestions = [...quizData.questions];
    if (field === "question") {
      newQuestions[questionIndex].question = value;
    } else if (field === "options") {
      newQuestions[questionIndex].options = value;
    } else if (field === "correctAnswer") {
      newQuestions[questionIndex].correctAnswer = parseInt(value);
    }
    setQuizData({ ...quizData, questions: newQuestions });
  };

  const handleSubmit = async () => {
    setError("");
    setIsSubmitting(true);

    try {
      // Validate quiz data
      if (!quizData.title.trim()) {
        throw new Error("Quiz title is required");
      }
      if (!quizData.description.trim()) {
        throw new Error("Quiz description is required");
      }

      // Validate all questions
      for (let i = 0; i < quizData.questions.length; i++) {
        const q = quizData.questions[i];
        if (!q.question.trim()) {
          throw new Error(`Question ${i + 1} is required`);
        }
        if (q.options.some(opt => !opt.trim())) {
          throw new Error(`All options for question ${i + 1} are required`);
        }
        if (q.correctAnswer === null || q.correctAnswer === undefined) {
          throw new Error(`Please select a correct answer for question ${i + 1}`);
        }
      }

      // Create quiz document
      const quizRef = doc(db, "quizzes", `${classId}_grade${quizData.gradeLevel}`);
      const quizDoc = {
        classId,
        gradeLevel: quizData.gradeLevel,
        title: quizData.title,
        description: quizData.description,
        questions: quizData.questions,
        createdBy: user.uid,
        createdByName: user.displayName || user.email,
        createdAt: new Date().toISOString(),
        isActive: true
      };

      await setDoc(quizRef, quizDoc);
      
      // Update class info to show quiz is available
      const classRef = doc(db, "classDescriptions", classId);
      const classSnap = await getDoc(classRef);
      
      if (!classSnap.exists()) {
        // Create the class document if it doesn't exist
        await setDoc(classRef, {
          classId,
          description: "Class description",
          classInfo: {
            points: 2,
            requirements: "Class for all races and backgrounds",
            activities: "Roleplay, ask questions, or just hang out!"
          },
          quizzes: []
        });
      }
      
      const classData = classSnap.exists() ? classSnap.data() : {
        quizzes: []
      };
      
      const updatedQuizzes = classData.quizzes || [];
      const quizInfo = {
        gradeLevel: quizData.gradeLevel,
        title: quizData.title,
        quizId: `${classId}_grade${quizData.gradeLevel}`,
        createdAt: new Date().toISOString()
      };
      
      // Remove existing quiz for this grade level if it exists
      const filteredQuizzes = updatedQuizzes.filter(q => q.gradeLevel !== quizData.gradeLevel);
      filteredQuizzes.push(quizInfo);
      
      await updateDoc(classRef, { quizzes: filteredQuizzes });
      
      onComplete();
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.quizCreationOverlay} onClick={onClose}>
      <div className={styles.quizCreationContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.quizHeader}>
          <h2>Create Quiz for {classId} - Grade {quizData.gradeLevel}</h2>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        <div className={styles.quizForm}>
          {/* Basic Quiz Info */}
          <div className={styles.basicInfo}>
            <div className={styles.inputGroup}>
              <label>Quiz Title:</label>
              <input
                type="text"
                value={quizData.title}
                onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
                placeholder="Enter quiz title"
                className={styles.textInput}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Description:</label>
              <textarea
                value={quizData.description}
                onChange={(e) => setQuizData({ ...quizData, description: e.target.value })}
                placeholder="Enter quiz description"
                className={styles.textArea}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Grade Level:</label>
              <select
                value={quizData.gradeLevel}
                onChange={(e) => setQuizData({ ...quizData, gradeLevel: parseInt(e.target.value) })}
                className={styles.selectInput}
              >
                {[1, 2, 3, 4, 5, 6, 7].map(grade => (
                  <option key={grade} value={grade}>Grade {grade}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Question Navigation */}
          <div className={styles.questionNavigation}>
            <h3>Questions ({quizData.questions.length} total)</h3>
            <div className={styles.questionTabs}>
              {quizData.questions.map((question, index) => (
                <button
                  key={index}
                  className={`${styles.questionTab} ${currentQuestion === index ? styles.activeTab : ''} ${
                    question.correctAnswer === null || question.correctAnswer === undefined 
                      ? styles.incompleteTab 
                      : styles.completeTab
                  }`}
                  onClick={() => setCurrentQuestion(index)}
                >
                  {index + 1}
                  {question.correctAnswer !== null && question.correctAnswer !== undefined && (
                    <span className={styles.tabCheckmark}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Current Question */}
          <div className={styles.currentQuestion}>
            <div className={styles.questionHeader}>
              <h4>Question {currentQuestion + 1}</h4>
              {quizData.questions[currentQuestion].correctAnswer !== null && 
               quizData.questions[currentQuestion].correctAnswer !== undefined ? (
                <span className={styles.correctIndicator}>✓ Correct answer selected</span>
              ) : (
                <span className={styles.missingIndicator}>⚠ Please select a correct answer</span>
              )}
            </div>
            
            <div className={styles.inputGroup}>
              <label>Question:</label>
              <textarea
                value={quizData.questions[currentQuestion].question}
                onChange={(e) => handleQuestionChange(currentQuestion, "question", e.target.value)}
                placeholder="Enter your question"
                className={styles.textArea}
              />
            </div>

            <div className={styles.optionsSection}>
              <label>Answer Options:</label>
              {quizData.questions[currentQuestion].options.map((option, optionIndex) => (
                <div key={optionIndex} className={styles.optionInput}>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...quizData.questions[currentQuestion].options];
                      newOptions[optionIndex] = e.target.value;
                      handleQuestionChange(currentQuestion, "options", newOptions);
                    }}
                    placeholder={`Option ${optionIndex + 1}`}
                    className={styles.textInput}
                  />
                  <button
                    type="button"
                    className={`${styles.correctButton} ${
                      quizData.questions[currentQuestion].correctAnswer === optionIndex 
                        ? styles.correctButtonSelected 
                        : ''
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleQuestionChange(currentQuestion, "correctAnswer", optionIndex);
                    }}
                  >
                    {quizData.questions[currentQuestion].correctAnswer === optionIndex ? "✓ Correct" : "Mark Correct"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className={styles.navigationButtons}>
            <button
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
              className={styles.navButton}
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentQuestion(Math.min(quizData.questions.length - 1, currentQuestion + 1))}
              disabled={currentQuestion === quizData.questions.length - 1}
              className={styles.navButton}
            >
              Next
            </button>
          </div>

          {/* Submit Button */}
          <div className={styles.submitSection}>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={styles.submitButton}
            >
              {isSubmitting ? "Creating Quiz..." : "Create Quiz"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizCreation;
