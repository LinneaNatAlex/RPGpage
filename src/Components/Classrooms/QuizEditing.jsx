import { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "../../context/authContext";
import useUserRoles from "../../hooks/useUserRoles";
import styles from "./QuizEditing.module.css";

const QuizEditing = ({ classId, quiz, onClose, onComplete }) => {
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
  const [loading, setLoading] = useState(true);

  // Check if user has permission
  const canEditQuiz = roles.includes("professor") || roles.includes("teacher") || roles.includes("admin");

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        setLoading(true);
        
        if (quiz) {
          // If quiz already has full data, use it
          if (quiz.questions && quiz.questions.length > 0) {
            setQuizData({
              title: quiz.title || "",
              description: quiz.description || "",
              gradeLevel: quiz.gradeLevel || 1,
              questions: quiz.questions
            });
          } else {
            // Load full quiz data from quizzes collection
            const quizRef = doc(db, "quizzes", quiz.quizId);
            const quizSnap = await getDoc(quizRef);
            
            if (quizSnap.exists()) {
              const fullQuizData = quizSnap.data();
              setQuizData({
                title: fullQuizData.title || "",
                description: fullQuizData.description || "",
                gradeLevel: fullQuizData.gradeLevel || 1,
                questions: fullQuizData.questions || Array(10).fill().map(() => ({
                  question: "",
                  options: ["", "", "", ""],
                  correctAnswer: null
                }))
              });
            } else {
              setError("Quiz data not found");
            }
          }
        }
      } catch (error) {
        setError("Failed to load quiz");
      } finally {
        setLoading(false);
      }
    };

    if (quiz) {
      loadQuiz();
    }
  }, [quiz]);

  if (!canEditQuiz) {
    return (
      <div className={styles.permissionDenied}>
        <h3>Access Denied</h3>
        <p>Only teachers and admins can edit quizzes.</p>
        <button onClick={onClose} className={styles.closeButton}>
          Close
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.quizEditingOverlay}>
        <div className={styles.quizEditingContent}>
          <div className={styles.loading}>Loading quiz...</div>
        </div>
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

      // Update quiz document
      const quizRef = doc(db, "quizzes", quiz.quizId);
      const quizDoc = {
        ...quiz,
        title: quizData.title,
        description: quizData.description,
        gradeLevel: quizData.gradeLevel,
        questions: quizData.questions,
        updatedBy: user.uid,
        updatedByName: user.displayName || user.email,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(quizRef, quizDoc);
      
      // Update class info to reflect quiz changes
      const classRef = doc(db, "classDescriptions", classId);
      const classSnap = await getDoc(classRef);
      
      if (classSnap.exists()) {
        const classData = classSnap.data();
        const updatedQuizzes = classData.quizzes || [];
        
        // Find and update the quiz in the class quizzes array
        const quizIndex = updatedQuizzes.findIndex(q => q.quizId === quiz.quizId);
        if (quizIndex !== -1) {
          updatedQuizzes[quizIndex] = {
            ...updatedQuizzes[quizIndex],
            title: quizData.title,
            gradeLevel: quizData.gradeLevel,
            updatedAt: new Date().toISOString()
          };
          
          await updateDoc(classRef, { quizzes: updatedQuizzes });
        }
      }
      
      onComplete();
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.quizEditingOverlay} onClick={onClose}>
      <div className={styles.quizEditingContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.quizHeader}>
          <h2>Edit Quiz: {quiz?.title || "Unknown Quiz"}</h2>
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
                id="quiz-edit-title"
                name="quizTitle"
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
                id="quiz-edit-description"
                name="quizDescription"
                value={quizData.description}
                onChange={(e) => setQuizData({ ...quizData, description: e.target.value })}
                placeholder="Enter quiz description"
                className={styles.textArea}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Grade Level:</label>
              <select
                id="quiz-edit-grade-level"
                name="quizGradeLevel"
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
                id={`quiz-edit-question-${currentQuestion}`}
                name={`question-${currentQuestion}`}
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
                    id={`quiz-edit-option-${currentQuestion}-${optionIndex}`}
                    name={`option-${currentQuestion}-${optionIndex}`}
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
              {isSubmitting ? "Updating Quiz..." : "Update Quiz"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizEditing;
