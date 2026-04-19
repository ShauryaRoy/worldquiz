import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import QuizLayout from '@/components/QuizLayout';
import { useStreak } from '@/contexts/StreakContext';
import { useUser } from '@/contexts/UserContext';
import { generateDailyQuestions, getDailyQuizInfo, DUEL_QUIZ_TYPES } from '@/lib/duelQuestions';
import { Flame, Trophy, Timer, Check, X, Calendar, Star } from 'lucide-react';

const QUESTION_TIME = 20;

const DailyChallengePage = () => {
  const navigate = useNavigate();
  const { user, requestUserInfo } = useUser();
  const { streak, longestStreak, todayCompleted, recordDailyCompletion, checkStreakAtRisk } = useStreak();

  // ── Quiz state ────────────────────────────────────────────
  const [phase,          setPhase]          = useState('intro'); // intro | playing | finished
  const [questions,      setQuestions]      = useState([]);
  const [quizType,       setQuizType]       = useState('capitals');
  const [qIndex,         setQIndex]         = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect,      setIsCorrect]      = useState(null);
  const [score,          setScore]          = useState(0);
  const [timeLeft,       setTimeLeft]       = useState(QUESTION_TIME);
  const [startTime,      setStartTime]      = useState(null);
  const [totalTime,      setTotalTime]      = useState(0);
  const [newStreak,      setNewStreak]      = useState(null);

  const timerRef    = useRef(null);
  const qStartRef   = useRef(null);
  const answeredRef = useRef(false);

  const { dateStr } = getDailyQuizInfo();
  const quizTypeInfo = DUEL_QUIZ_TYPES.find(q => q.value === quizType);
  const atRisk       = checkStreakAtRisk();

  // ── Load questions on mount ───────────────────────────────
  useEffect(() => {
    requestUserInfo();
    const { questions: qs, quizType: qt } = generateDailyQuestions(10);
    setQuestions(qs);
    setQuizType(qt);
  }, []);

  // ── Per-question timer ────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing' || selectedAnswer !== null) return;

    setTimeLeft(QUESTION_TIME);
    qStartRef.current  = Date.now();
    answeredRef.current = false;

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleAnswer(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [qIndex, phase]);

  const handleStart = () => {
    if (!user) { requestUserInfo(); return; }
    setStartTime(Date.now());
    setPhase('playing');
  };

  const handleAnswer = useCallback(async (answer) => {
    if (answeredRef.current) return;
    answeredRef.current = true;
    clearInterval(timerRef.current);

    const currentQ = questions[qIndex];
    if (!currentQ) return;

    const correct  = answer !== null && answer === currentQ.correct;
    const newScore = score + (correct ? 1 : 0);

    setSelectedAnswer(answer ?? '__timeout__');
    setIsCorrect(correct);
    if (correct) setScore(newScore);

    setTimeout(async () => {
      if (qIndex + 1 >= questions.length) {
        const elapsed = (Date.now() - startTime) / 1000;
        setTotalTime(elapsed);
        setPhase('finished');
        if (user) {
          const ns = await recordDailyCompletion(user, quizType, newScore, questions.length, elapsed);
          setNewStreak(ns);
        }
      } else {
        setQIndex(i => i + 1);
        setSelectedAnswer(null);
        setIsCorrect(null);
      }
    }, 1400);
  }, [answeredRef, qIndex, questions, score, startTime, user, quizType, recordDailyCompletion]);

  const currentQ = questions[qIndex];

  return (
    <QuizLayout title="Daily Challenge" description="One quiz per day keeps the rust away!">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Streak header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-3">
          <div className={`flex items-center gap-3 p-4 rounded-xl border ${
            atRisk ? 'border-red-500 bg-red-500/10 animate-pulse' : 'border-orange-500/40 bg-orange-500/10'
          }`}>
            <Flame className={`w-8 h-8 flex-shrink-0 ${atRisk ? 'text-red-400' : 'text-orange-400'}`} />
            <div>
              <p className="text-white font-bold text-2xl">{streak}</p>
              <p className={`text-xs ${atRisk ? 'text-red-400 font-semibold' : 'text-orange-300/70'}`}>
                {atRisk ? '⚠️ Streak at risk!' : 'Day streak'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl border border-yellow-500/40 bg-yellow-500/10">
            <Trophy className="w-8 h-8 text-yellow-400 flex-shrink-0" />
            <div>
              <p className="text-white font-bold text-2xl">{longestStreak}</p>
              <p className="text-yellow-300/70 text-xs">Best streak</p>
            </div>
          </div>
        </motion.div>

        {/* ── INTRO ── */}
        {phase === 'intro' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="bg-slate-800/70 border-slate-700">
              <CardHeader className="text-center">
                <div className="text-6xl mb-2">{quizTypeInfo?.emoji}</div>
                <CardTitle className="text-2xl text-white">Today's Challenge</CardTitle>
                <CardDescription className="text-white/60 flex items-center justify-center gap-1.5">
                  <Calendar className="w-4 h-4" /> {dateStr}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-white/80">
                  Category: <span className="text-purple-400 font-semibold">{quizTypeInfo?.label}</span>
                </p>
                <p className="text-white/50 text-sm">
                  10 questions · 20 seconds each · Same quiz for everyone today
                </p>
                {todayCompleted ? (
                  <div className="flex items-center justify-center gap-2 p-4 bg-green-500/15 border border-green-500/50 rounded-xl">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-green-300 font-semibold">Already completed today! Come back tomorrow.</span>
                  </div>
                ) : (
                  <Button
                    onClick={handleStart}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-6 text-lg"
                  >
                    <Flame className="w-5 h-5 mr-2" /> Start Daily Challenge
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── PLAYING ── */}
        {phase === 'playing' && currentQ && (
          <div className="space-y-4">
            {/* Progress + Timer */}
            <div className="flex items-center justify-between text-sm text-white/50">
              <span>Question {qIndex + 1} / {questions.length}</span>
              <span className="text-green-400 font-semibold">{score} correct</span>
            </div>
            <div className="flex items-center gap-3">
              <Timer className={`w-4 h-4 flex-shrink-0 ${timeLeft <= 5 ? 'text-red-400' : 'text-white/50'}`} />
              <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${timeLeft <= 5 ? 'bg-red-500' : 'bg-orange-500'}`}
                  style={{ width: `${(timeLeft / QUESTION_TIME) * 100}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <span className={`text-sm font-mono w-6 ${timeLeft <= 5 ? 'text-red-400' : 'text-white/50'}`}>{timeLeft}s</span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={qIndex}
                initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              >
                <Card className="bg-slate-800/70 border-slate-700">
                  <CardContent className="pt-6 space-y-5">
                    {currentQ.flagUrl && (
                      <div className="flex justify-center">
                        <img src={currentQ.flagUrl} alt="flag" className="h-24 w-auto rounded-lg shadow-lg object-contain" loading="eager" />
                      </div>
                    )}
                    <p className="text-white text-xl font-semibold text-center">{currentQ.questionText}</p>
                    <div className="grid grid-cols-2 gap-3">
                      {currentQ.options.map((option, i) => {
                        let cls = 'border-slate-600 bg-slate-800/50 text-white hover:border-orange-400 hover:bg-orange-500/10';
                        if (selectedAnswer !== null) {
                          if (option === currentQ.correct)                  cls = 'border-green-500 bg-green-500/20 text-green-300';
                          else if (option === selectedAnswer && !isCorrect) cls = 'border-red-500 bg-red-500/20 text-red-300';
                          else                                              cls = 'border-slate-700 bg-slate-900/30 text-white/30';
                        }
                        return (
                          <button
                            key={i}
                            disabled={selectedAnswer !== null}
                            onClick={() => handleAnswer(option)}
                            className={`p-4 rounded-xl border-2 text-left font-medium transition-all ${cls}`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>

            <AnimatePresence>
              {selectedAnswer && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl font-semibold ${
                    isCorrect ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                  }`}
                >
                  {isCorrect ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                  {isCorrect ? 'Correct! +1' : `Wrong! Answer: ${currentQ.correct}`}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── FINISHED ── */}
        {phase === 'finished' && (
          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="bg-slate-800/70 border-slate-700 text-center">
              <CardHeader>
                <div className="text-6xl mb-2">🎯</div>
                <CardTitle className="text-3xl text-white">Challenge Complete!</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-900/50 rounded-xl p-4">
                    <Trophy className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                    <p className="text-white font-bold text-2xl">{score}/{questions.length}</p>
                    <p className="text-white/40 text-xs">Score</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-xl p-4">
                    <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                    <p className="text-white font-bold text-2xl">{newStreak ?? streak}</p>
                    <p className="text-white/40 text-xs">Streak</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-xl p-4">
                    <Timer className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                    <p className="text-white font-bold text-2xl">{totalTime.toFixed(1)}s</p>
                    <p className="text-white/40 text-xs">Time</p>
                  </div>
                </div>

                {(newStreak ?? streak) > 1 && (
                  <div className="flex items-center justify-center gap-2 p-3 bg-orange-500/20 border border-orange-500/50 rounded-xl text-orange-300 font-semibold">
                    <Flame className="w-4 h-4" />
                    {newStreak ?? streak} day streak! Keep it going!
                  </div>
                )}

                {score === questions.length && (
                  <div className="flex items-center justify-center gap-2 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-xl text-yellow-300 font-semibold">
                    <Star className="w-4 h-4" /> Perfect score! 🌟
                  </div>
                )}

                <div className="flex gap-3">
                  <Button onClick={() => navigate('/speed-leaderboard')} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
                    Speed Board
                  </Button>
                  <Button onClick={() => navigate('/duel')} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                    <Trophy className="w-4 h-4 mr-1.5" /> Duel
                  </Button>
                  <Button onClick={() => navigate('/')} variant="outline" className="flex-1 border-slate-600 text-white hover:bg-slate-700">
                    Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

      </div>
    </QuizLayout>
  );
};

export default DailyChallengePage;
