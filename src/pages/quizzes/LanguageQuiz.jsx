import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import QuizLayout from '@/components/QuizLayout';
import QuizQuestion from '@/components/QuizQuestion';
import { countries } from '@/data/countries';
import { RotateCcw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useScore } from '@/contexts/ScoreContext';
import { useUser } from '@/contexts/UserContext';

const QUIZ_TYPE = "languages";
const TOTAL_QUESTIONS = 10;

const LanguageQuiz = () => {
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
    const shuffledCountries = [...countries].sort(() => Math.random() - 0.5);
    const quizQuestions = shuffledCountries.slice(0, TOTAL_QUESTIONS).map(country => {
      const allLanguages = [...new Set(countries.map(c => c.language))];
      const options = generateUniqueOptions(country.language, allLanguages);

      return {
        displayElement: (
          <Card className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 border-white/20">
            <CardContent className="p-6 text-center">
              <img
                src={country.flag.replace('.png', '.webp')}
                alt={`Flag of ${country.country}`}
                className="w-24 h-16 object-cover rounded-lg mx-auto mb-4 shadow-lg"
                loading="lazy"
                width="96"
                height="64"
              />
              <h3 className="text-2xl font-bold text-white">{country.country}</h3>
            </CardContent>
          </Card>
        ),
        questionText: `What is the primary language spoken in ${country.country}?`,
        options: options.map(opt => ({ label: opt, value: opt })),
        correct: country.language,
        correctFeedback: `${country.language} is indeed the primary language of ${country.country}!`,
        incorrectFeedback: `The primary language of ${country.country} is ${country.language}.`
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
      if (currentQuestionIndex + 1 < TOTAL_QUESTIONS) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        setQuizCompleted(true);
        const finalScore = currentScore + (selectedAnswer === question.correct ? Math.max(0, 100 - timeTaken) : 0);
        updateScore(QUIZ_TYPE, finalScore, TOTAL_QUESTIONS * 100, newTotalTimeTaken);
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

  if (questions.length === 0) {
    return (
      <QuizLayout title="Language Quiz" description="Loading questions..." quizType={QUIZ_TYPE}>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
        </div>
      </QuizLayout>
    );
  }

  if (quizCompleted) {
    const percentage = Math.round((currentScore / (TOTAL_QUESTIONS * 100)) * 100);
    return (
      <QuizLayout title="Language Quiz Complete!" description={`You scored ${currentScore} points! (${percentage}%)`} quizType={QUIZ_TYPE}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md mx-auto text-center"
        >
          <Card className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border-white/20">
            <CardContent className="p-8">
              <div className="text-6xl mb-4">
                {percentage >= 80 ? '🏆' : percentage >= 60 ? '🥈' : '🥉'}
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {percentage >= 80 ? 'Excellent!' : percentage >= 60 ? 'Good Job!' : 'Keep Trying!'}
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
      title="Language Quiz"
      description="Guess the primary language of the country."
      quizType={QUIZ_TYPE}
    >
      <QuizQuestion
        questionData={questions[currentQuestionIndex]}
        onAnswer={handleAnswer}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={TOTAL_QUESTIONS}
        currentScore={currentScore}
      />
    </QuizLayout>
  );
};

export default LanguageQuiz;