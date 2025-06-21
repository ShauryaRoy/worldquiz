import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import QuizLayout from '@/components/QuizLayout';
import QuizQuestion from '@/components/QuizQuestion';
import { usStates } from '@/data/countries';
import { RotateCcw, Home, Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useScore } from '@/contexts/ScoreContext';
import { useUser } from '@/contexts/UserContext';

const QUIZ_TYPE = "us-facts";
const TOTAL_QUESTIONS = 10;

const UsFactsQuiz = () => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);
  const [totalTimeTaken, setTotalTimeTaken] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  
  const { updateScore, addLeaderboardEntry } = useScore();
  const { user, requestUserInfo } = useUser();

  useEffect(() => {
    if (!user) {
      requestUserInfo();
    }
  }, [user, requestUserInfo]);

  const generateUniqueOptions = (correctAnswer, allPossibleAnswers, count = 4) => {
    const options = new Set([correctAnswer]);
    const filteredAnswers = allPossibleAnswers.filter(ans => ans !== correctAnswer);
    while (options.size < count && filteredAnswers.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredAnswers.length);
      options.add(filteredAnswers.splice(randomIndex, 1)[0]);
    }
    return Array.from(options).sort(() => Math.random() - 0.5);
  };

  const generateQuestions = () => {
    const statesWithFacts = usStates.filter(state => state.fact);
    if (statesWithFacts.length === 0) {
        setQuestions([]);
        return;
    }
    const shuffledStates = [...statesWithFacts].sort(() => Math.random() - 0.5);
    const numQuestions = Math.min(TOTAL_QUESTIONS, statesWithFacts.length);

    const quizQuestions = shuffledStates.slice(0, numQuestions).map(state => {
      const allStateNames = usStates.map(s => s.name);
      const options = generateUniqueOptions(state.name, allStateNames);
      
      return {
        displayElement: (
            <Card className="bg-gradient-to-br from-yellow-500/20 via-amber-500/20 to-orange-500/20 border-white/20 shadow-xl">
              <CardContent className="p-6 text-center">
                <Lightbulb className="w-12 h-12 text-yellow-400 mx-auto mb-4 animate-pulse" />
                <p className="text-lg text-white font-semibold">{state.fact}</p>
              </CardContent>
            </Card>
        ),
        questionText: "Which US state is this fact about?",
        options: options.map(opt => ({ label: opt, value: opt })),
        correct: state.name,
        correctFeedback: `Correct! That fact is about ${state.name}.`,
        incorrectFeedback: `That fact is about ${state.name}.`
      };
    });
    setQuestions(quizQuestions);
  };

  useEffect(() => {
    generateQuestions();
  }, []);

  const handleAnswer = (selectedAnswer, timeTaken) => {
    const question = questions[currentQuestionIndex];
    let questionScore = 0;
    if (selectedAnswer === question.correct) {
      questionScore = Math.max(0, 100 - timeTaken);
      setCurrentScore(prev => prev + questionScore);
    }
    const newTotalTimeTaken = totalTimeTaken + timeTaken;
    setTotalTimeTaken(newTotalTimeTaken);

    setTimeout(() => {
      if (currentQuestionIndex + 1 < questions.length) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        setQuizCompleted(true);
        const finalScore = currentScore + (selectedAnswer === question.correct ? Math.max(0, 100 - timeTaken) : 0);
        updateScore(QUIZ_TYPE, finalScore, questions.length * 100, newTotalTimeTaken);
        if (user) {
          addLeaderboardEntry({
            name: user.name,
            email: user.email,
            quiz_type: QUIZ_TYPE,
            score: finalScore,
            time_taken: newTotalTimeTaken,
            created_at: new Date().toISOString()
          });
        }
      }
    }, 2000); 
  };

  const resetQuiz = () => {
    if (!user) {
      requestUserInfo();
      return;
    }
    setCurrentQuestionIndex(0);
    setCurrentScore(0);
    setTotalTimeTaken(0);
    setQuizCompleted(false);
    generateQuestions();
  };

  if (questions.length === 0 && usStates.filter(s => s.fact).length > 0) {
    return (
      <QuizLayout title="US Facts Quiz" description="Loading interesting facts..." quizType={QUIZ_TYPE}>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
        </div>
      </QuizLayout>
    );
  }
  
  if (questions.length === 0 && usStates.filter(s => s.fact).length === 0) {
    return (
      <QuizLayout title="US Facts Quiz" description="No fact data available." quizType={QUIZ_TYPE}>
         <p className="text-white text-center">We're currently missing fact data for this quiz. Please check back later!</p>
      </QuizLayout>
    );
  }


  if (quizCompleted) {
    const percentage = questions.length > 0 ? Math.round((currentScore / (questions.length * 100)) * 100) : 0;
    return (
      <QuizLayout title="US Facts Quiz Complete!" description={`You scored ${currentScore} points! (${percentage}%)`} quizType={QUIZ_TYPE}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md mx-auto text-center"
        >
          <Card className="bg-gradient-to-r from-green-500/20 to-yellow-500/20 border-white/20">
            <CardContent className="p-8">
              <div className="text-6xl mb-4">
                {percentage >= 80 ? '💡🏆' : percentage >= 60 ? '💡🥈' : '💡🥉'}
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {percentage >= 80 ? 'Fact Whiz!' : percentage >= 60 ? 'Great Job!' : 'Good Effort!'}
              </h2>
              <p className="text-white/80 mb-2">
                Your final score: <span className="font-bold text-yellow-300">{currentScore}</span> points.
              </p>
              <p className="text-white/80 mb-6">
                Total time taken: {totalTimeTaken.toFixed(1)} seconds.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={resetQuiz} className="flex-1">
                  <RotateCcw className="w-4 h-4 mr-2" /> Play Again
                </Button>
                <Link to="/" className="flex-1">
                  <Button variant="outline" className="w-full">
                    <Home className="w-4 h-4 mr-2" /> Home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </QuizLayout>
    );
  }

  return (
    <QuizLayout 
      title="US Facts Quiz" 
      description="Guess the state based on the fact."
      quizType={QUIZ_TYPE}
    >
      <QuizQuestion
        questionData={questions[currentQuestionIndex]}
        onAnswer={handleAnswer}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        currentScore={currentScore}
      />
    </QuizLayout>
  );
};

export default UsFactsQuiz;