import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { Clock } from 'lucide-react';

const QUESTION_TIME_LIMIT = 30; // seconds

const QuizQuestion = ({ questionData, onAnswer, questionNumber, totalQuestions, currentScore }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const timerRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    setSelectedAnswer(null);
    setShowResult(false);
    setTimeLeft(QUESTION_TIME_LIMIT);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [questionData]);

  const handleTimeOut = () => {
    if (selectedAnswer) return;
    setShowResult(true);
    toast({
      title: "Time's up! ⏰",
      description: `The correct answer was ${questionData.correct}`,
      variant: "destructive",
    });
    onAnswer(null, QUESTION_TIME_LIMIT);
  };

  const handleAnswerClick = (answer) => {
    if (selectedAnswer) return;

    clearInterval(timerRef.current);
    const timeTaken = QUESTION_TIME_LIMIT - timeLeft;
    setSelectedAnswer(answer);
    setShowResult(true);

    const isCorrect = answer === questionData.correct;

    if (isCorrect) {
      toast({
        title: "Correct! 🎉",
        description: questionData.correctFeedback || `Well done!`,
      });
    } else {
      toast({
        title: "Incorrect 😔",
        description: questionData.incorrectFeedback || `The correct answer was ${questionData.correct}`,
        variant: "destructive",
      });
    }
    onAnswer(answer, timeTaken);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="w-full bg-white/20 rounded-full h-2 mb-4">
        <div
          className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((questionNumber) / totalQuestions) * 100}%` }}
        ></div>
      </div>

      <div className="flex justify-between items-center mb-6 text-white/80">
        <span>Question {questionNumber}/{totalQuestions}</span>
        <span>Score: {currentScore}</span>
      </div>

      <div className="flex items-center justify-center mb-4 text-white">
        <Clock className="w-6 h-6 mr-2 text-yellow-400" />
        <span className="text-2xl font-bold">{timeLeft}s</span>
      </div>
      <Progress value={(timeLeft / QUESTION_TIME_LIMIT) * 100} className="w-full h-3 mb-8 bg-white/20 [&>div]:bg-yellow-400" />


      {questionData.image && (
        <motion.div
          key={questionData.image}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flag-container mb-8 mx-auto max-w-md"
        >
          <img
            src={questionData.image && questionData.image.endsWith('.png') ? questionData.image.replace('.png', '.webp') : questionData.image}
            alt={questionData.imageAlt || "Quiz image"}
            className="w-full h-48 object-contain rounded-xl shadow-2xl"
            loading="lazy"
            width="100%"
            height="192"
          />
        </motion.div>
      )}

      {questionData.displayElement && (
        <motion.div
          key={questionNumber}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-8 mx-auto max-w-md"
        >
          {questionData.displayElement}
        </motion.div>
      )}


      <h2 className="text-2xl font-bold text-white text-center mb-8">
        {questionData.questionText}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {questionData.options.map((option, index) => {
          let buttonClass = "quiz-option bg-white/10 hover:bg-white/20 text-white border-white/20";

          if (showResult) {
            if (option === questionData.correct) {
              buttonClass += " correct";
            } else if (option === selectedAnswer && option !== questionData.correct) {
              buttonClass += " incorrect";
            }
          }

          return (
            <motion.div
              key={option.value || option}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Button
                onClick={() => handleAnswerClick(option.value || option)}
                disabled={showResult}
                className={`${buttonClass} w-full p-4 h-auto text-lg font-medium whitespace-normal text-left justify-start`}
              >
                {option.label || option}
              </Button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default QuizQuestion;