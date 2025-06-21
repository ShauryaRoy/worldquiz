
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import QuizLayout from '@/components/QuizLayout';
import QuizQuestion from '@/components/QuizQuestion';
import { countries } from '@/data/countries';
import { RotateCcw, Home, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useScore } from '@/contexts/ScoreContext';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/components/ui/use-toast';

const QUIZ_TYPE = "all-flags"; 

const AllFlagsQuiz = () => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);
  const [totalTimeTaken, setTotalTimeTaken] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  const { updateScore, addLeaderboardEntry } = useScore();
  const { user, requestUserInfo } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      requestUserInfo();
    }
  }, [user, requestUserInfo]);

  const generateUniqueOptions = (correctAnswer, allPossibleAnswers, count = 4) => {
    let options = new Set();
    options.add(correctAnswer);
    
    const filteredAnswers = allPossibleAnswers.filter(ans => ans !== correctAnswer);
    
    let iterationGuard = 0;
    while (options.size < count && filteredAnswers.length > 0 && iterationGuard < allPossibleAnswers.length * 2) {
      const randomIndex = Math.floor(Math.random() * filteredAnswers.length);
      options.add(filteredAnswers.splice(randomIndex, 1)[0]);
      iterationGuard++;
    }
    
    iterationGuard = 0;
    while(options.size < count && allPossibleAnswers.length > options.size && iterationGuard < allPossibleAnswers.length * 2) {
      const randomFallback = allPossibleAnswers[Math.floor(Math.random() * allPossibleAnswers.length)];
      if(!options.has(randomFallback)) options.add(randomFallback);
      iterationGuard++;
    }

    return Array.from(options).sort(() => Math.random() - 0.5);
  };

  const generateQuestions = () => {
    const allCountriesData = [...countries]; 
    const shuffledCountries = allCountriesData.sort(() => Math.random() - 0.5);
    
    const quizQuestions = shuffledCountries.map(country => {
      const allCountryNames = allCountriesData.map(c => c.country);
      const options = generateUniqueOptions(country.country, allCountryNames);
      
      return {
        image: country.flag,
        imageAlt: `Flag of ${country.country}`,
        questionText: "Which country does this flag belong to?",
        options: options.map(opt => ({ label: opt, value: opt })),
        correct: country.country,
        correctFeedback: `That's the flag of ${country.country}!`,
        incorrectFeedback: `That was the flag of ${country.country}.`
      };
    });
    setQuestions(quizQuestions);
    setCurrentQuestionIndex(0);
    setCurrentScore(0);
    setTotalTimeTaken(0);
    setQuizCompleted(false);
    setShowResult(false);
    setSelectedOption(null);
  };

  useEffect(() => {
    generateQuestions();
  }, []);

  const handleAnswer = (selectedAnswer, timeTaken) => {
    if (showResult && selectedOption !== null) return; 

    const question = questions[currentQuestionIndex];
    setSelectedOption(selectedAnswer); 
    setShowResult(true);
    
    let questionScore = 0;
    if (selectedAnswer === question.correct) {
      questionScore = Math.max(0, 100 - timeTaken);
      setCurrentScore(prev => prev + questionScore);
      toast({ title: "Correct! 🎉", description: question.correctFeedback });
    } else {
      toast({ title: "Incorrect 😔", description: question.incorrectFeedback, variant: "destructive" });
    }
    
    const newTotalTimeTaken = totalTimeTaken + timeTaken;
    setTotalTimeTaken(newTotalTimeTaken);

    if (currentQuestionIndex + 1 >= questions.length) { 
       setTimeout(() => {
        setQuizCompleted(true);
        const finalScoreToSubmit = currentScore; 

        updateScore(QUIZ_TYPE, finalScoreToSubmit, questions.length * 100, newTotalTimeTaken);
        if (user) {
          addLeaderboardEntry({
            name: user.name,
            email: user.email,
            quiz_type: QUIZ_TYPE,
            score: finalScoreToSubmit,
            time_taken: newTotalTimeTaken,
            created_at: new Date().toISOString()
          });
        }
      }, 2000);
    } else {
        setTimeout(() => {
            handleNextQuestion();
        }, 2000);
    }
  };
  
  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < questions.length) { 
      setCurrentQuestionIndex(prev => prev + 1);
      setShowResult(false);
      setSelectedOption(null);
    } else if (!quizCompleted) { 
      setQuizCompleted(true); 
    }
  };

  const resetQuiz = () => {
    if (!user) {
      requestUserInfo();
      return;
    }
    generateQuestions();
  };

  if (questions.length === 0) {
    return (
      <QuizLayout title="All Flags Quiz" description="Loading all country flags..." quizType={QUIZ_TYPE}>
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-purple-400"></div>
        </div>
      </QuizLayout>
    );
  }

  if (quizCompleted) {
    const percentage = questions.length > 0 ? Math.round((currentScore / (questions.length * 100)) * 100) : 0;
    return (
      <QuizLayout title="All Flags Quiz Complete!" description={`You reviewed all ${questions.length} flags! Score: ${currentScore} (${percentage}%)`} quizType={QUIZ_TYPE}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md mx-auto text-center"
        >
          <Card className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border-white/20">
            <CardContent className="p-8">
              <div className="text-6xl mb-4">
                 {percentage >= 80 ? '🌍🏆' : percentage >= 60 ? '🌏👍' : '🌎🙂'}
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {percentage >= 80 ? 'Flag Master!' : percentage >= 60 ? 'Great Job!' : 'Good Effort!'}
              </h2>
              <p className="text-white/80 mb-2">
                Your final score: <span className="font-bold text-yellow-300">{currentScore} / {questions.length * 100}</span>.
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
      title="All Flags Flashcards" 
      description={`Flag ${currentQuestionIndex + 1} of ${questions.length}`}
      quizType={QUIZ_TYPE}
    >
      <QuizQuestion
        questionData={questions[currentQuestionIndex]}
        onAnswer={handleAnswer}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        currentScore={currentScore}
      />
      {showResult && currentQuestionIndex < questions.length -1 && !quizCompleted && (
        <div className="mt-6 text-center">
          <Button onClick={handleNextQuestion} className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700">
            Next Flag <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </QuizLayout>
  );
};

export default AllFlagsQuiz;
