import { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { useAuth } from "../../context/authContext";
import { getRPGCalendar } from "../../utils/rpgCalendar";
import styles from "./QuizTaking.module.css";

const QuizTaking = ({ quizId, classId, gradeLevel, onClose, onComplete }) => {
  const { user } = useAuth();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasTakenQuiz, setHasTakenQuiz] = useState(false);
  const [previousResult, setPreviousResult] = useState(null);

  // Calculate grade based on correct answers
  const calculateGrade = (correct, total) => {
    const percentage = (correct / total) * 100;
    
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    if (percentage >= 50) return 'E'; // New grade E
    return 'F';
  };

  // Get color for grade display
  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A': return '#4caf50'; // Green
      case 'B': return '#8bc34a'; // Light green
      case 'C': return '#ffc107'; // Yellow
      case 'D': return '#ff9800'; // Orange
      case 'E': return '#ff5722'; // Deep orange (for E)
      case 'F': return '#f44336'; // Red
      default: return '#757575'; // Gray
    }
  };

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        setLoading(true);
        
        // Check if user has already taken this quiz this month
        const rpgCalendar = getRPGCalendar();
        const currentMonth = `${rpgCalendar.rpgYear}-${rpgCalendar.rpgMonth.toString().padStart(2, '0')}`;
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const takenQuizzes = userData.takenQuizzes || [];
          
          // Check if user has taken this specific quiz this month
          const hasTaken = takenQuizzes.some(quiz => 
            quiz.quizId === quizId && 
            quiz.month === currentMonth &&
            quiz.classId === classId
          );
          
          if (hasTaken) {
            setHasTakenQuiz(true);
            // Find the previous result to show
            const previousQuiz = takenQuizzes.find(quiz => 
              quiz.quizId === quizId && 
              quiz.month === currentMonth &&
              quiz.classId === classId
            );
            if (previousQuiz) {
              setPreviousResult(previousQuiz);
            }
            setLoading(false);
            return;
          }
        }
        
        // Load quiz data directly from quizzes collection
        const quizRef = doc(db, "quizzes", quizId);
        const quizSnap = await getDoc(quizRef);
        
        if (quizSnap.exists()) {
          setQuiz(quizSnap.data());
        } else {
          setError("Quiz not found");
        }
      } catch (error) {
        console.error("Error loading quiz:", error);
        setError("Failed to load quiz");
      } finally {
        setLoading(false);
      }
    };

    if (user && quizId) {
      loadQuiz();
    }
  }, [user, quizId, classId]);

  const handleAnswerSelect = (questionIndex, answerIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  const handleSubmit = async () => {
    if (!quiz || !user) return;
    
    setIsSubmitting(true);
    setError("");
    
    try {
      // Calculate score
      let correct = 0;
      quiz.questions.forEach((question, index) => {
        if (answers[index] === question.correctAnswer) {
          correct++;
        }
      });
      
      const score = {
        correct,
        total: quiz.questions.length,
        percentage: (correct / quiz.questions.length) * 100,
        grade: calculateGrade(correct, quiz.questions.length)
      };
      
      const passed = score.grade !== 'F'; // E or better is passing (5+ correct answers)
      const rpgCalendar = getRPGCalendar();
      const currentMonth = `${rpgCalendar.rpgYear}-${rpgCalendar.rpgMonth.toString().padStart(2, '0')}`;
      
      // Save quiz result
      const resultId = `${user.uid}_${quizId}_${currentMonth}`;
      const resultRef = doc(db, "quizResults", resultId);
      
      await setDoc(resultRef, {
        userId: user.uid,
        quizId,
        classId,
        gradeLevel,
        score: score.correct,
        total: score.total,
        percentage: score.percentage,
        grade: score.grade,
        passed,
        takenAt: new Date().toISOString(),
        month: currentMonth
      });
      
      // Update user's taken quizzes
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : {};
      const takenQuizzes = userData.takenQuizzes || [];
      
      takenQuizzes.push({
        quizId,
        classId,
        gradeLevel,
        month: currentMonth,
        passed,
        score: score.correct,
        grade: score.grade,
        takenAt: new Date().toISOString()
      });
      
      // Check if user should advance to next grade
      let newGrade = userData.year || 1;
      if (passed) {
        // Count passed subjects for current grade
        const passedSubjects = takenQuizzes.filter(q => 
          q.passed && q.month === currentMonth
        ).length;
        
        if (passedSubjects >= 7 && newGrade < 7) {
          newGrade = newGrade + 1;
          // Give bonus points for grade advancement
          await updateDoc(userRef, {
            takenQuizzes,
            year: newGrade,
            points: increment(100) // Bonus points for advancing
          });
        } else {
          await updateDoc(userRef, { takenQuizzes });
        }
      } else {
        await updateDoc(userRef, { takenQuizzes });
      }
      
      // Show result
      if (passed) {
        alert(`Congratulations! You passed with ${score.correct}/10 correct answers (Grade: ${score.grade})!${newGrade > (userData.year || 1) ? ` You've advanced to Grade ${newGrade}!` : ''}`);
      } else {
        alert(`You scored ${score.correct}/10 (Grade: ${score.grade}). You need E grade or better (5+ correct answers) to pass. You can try again next in-game month.`);
      }
      
      onComplete();
    } catch (error) {
      console.error("Error submitting quiz:", error);
      setError("Failed to submit quiz");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.quizOverlay}>
        <div className={styles.quizContent}>
          <div className={styles.loading}>Loading quiz...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.quizOverlay}>
        <div className={styles.quizContent}>
          <div className={styles.errorMessage}>{error}</div>
          <button onClick={onClose} className={styles.closeButton}>Close</button>
        </div>
      </div>
    );
  }

  if (hasTakenQuiz) {
    return (
      <div className={styles.quizOverlay}>
        <div className={styles.quizContent}>
          <div className={styles.alreadyTaken}>
            <h3>Quiz Already Taken</h3>
            <p>You have already taken this quiz this month. You can try again next in-game month.</p>
            {previousResult && (
              <div className={styles.previousResult}>
                <h4>Your Previous Result:</h4>
                <p>Score: {previousResult.score}/10</p>
                <p>Grade: {previousResult.grade || 'N/A'}</p>
                <p>Status: {previousResult.passed ? 'Passed' : 'Failed'}</p>
              </div>
            )}
            <button onClick={onClose} className={styles.closeButton}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className={styles.quizOverlay}>
        <div className={styles.quizContent}>
          <div className={styles.errorMessage}>Quiz not found</div>
          <button onClick={onClose} className={styles.closeButton}>Close</button>
        </div>
      </div>
    );
  }

  const currentQ = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <div className={styles.quizOverlay} onClick={onClose}>
      <div className={styles.quizContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.quizHeader}>
          <h2>{quiz.title}</h2>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>

        <div className={styles.quizInfo}>
          <p>{quiz.description}</p>
          <p>Grade Level: {gradeLevel} | Questions: {quiz.questions.length}</p>
          <p>You need E grade or better (5+ correct answers) to pass.</p>
          <div className={styles.gradeInfo}>
            <h4>Grading Scale:</h4>
            <div className={styles.gradeScale}>
              <span style={{ color: getGradeColor('A') }}>A: 90-100% (9-10 correct) - Excellent</span>
              <span style={{ color: getGradeColor('B') }}>B: 80-89% (8 correct) - Very Good</span>
              <span style={{ color: getGradeColor('C') }}>C: 70-79% (7 correct) - Good</span>
              <span style={{ color: getGradeColor('D') }}>D: 60-69% (6 correct) - Satisfactory</span>
              <span style={{ color: getGradeColor('E') }}>E: 50-59% (5 correct) - Sufficient</span>
              <span style={{ color: getGradeColor('F') }}>F: Below 50% (0-4 correct) - Failed</span>
            </div>
          </div>
        </div>

        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className={styles.questionSection}>
          <h3>Question {currentQuestion + 1} of {quiz.questions.length}</h3>
          <p className={styles.questionText}>{currentQ.question}</p>
          
          <div className={styles.optionsList}>
            {currentQ.options.map((option, index) => (
              <button
                key={index}
                type="button"
                className={`${styles.optionButton} ${answers[currentQuestion] === index ? styles.selectedOption : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAnswerSelect(currentQuestion, index);
                }}
              >
                <div className={styles.optionIndicator}>
                  {answers[currentQuestion] === index ? '✓' : '○'}
                </div>
                <span className={styles.optionText}>{option}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.navigation}>
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className={styles.navButton}
          >
            Previous
          </button>
          
          <span className={styles.questionCounter}>
            {currentQuestion + 1} / {quiz.questions.length}
          </span>
          
          {currentQuestion === quiz.questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={styles.submitButton}
            >
              {isSubmitting ? "Submitting..." : "Submit Quiz"}
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestion(Math.min(quiz.questions.length - 1, currentQuestion + 1))}
              className={styles.navButton}
            >
              Next
            </button>
          )}
        </div>

        {error && (
          <div className={styles.errorMessage}>{error}</div>
        )}
      </div>
    </div>
  );
};

export default QuizTaking;
