import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import RankBadge from '@/components/RankBadge';
import { useDuel } from '@/contexts/DuelContext';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/lib/supabaseClient';
import { Swords, Timer, Check, X, RefreshCw } from 'lucide-react';

const QUESTION_TIME = 15; // seconds per question

// ── Timer bar ──────────────────────────────────────────────
const TimerBar = ({ timeLeft, total }) => (
  <div className="flex items-center gap-3">
    <Timer className={`w-4 h-4 flex-shrink-0 ${timeLeft <= 5 ? 'text-red-400' : 'text-white/50'}`} />
    <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
      <motion.div
        className={`h-full rounded-full transition-colors ${timeLeft <= 5 ? 'bg-red-500' : 'bg-purple-500'}`}
        style={{ width: `${(timeLeft / total) * 100}%` }}
        transition={{ duration: 0.4 }}
      />
    </div>
    <span className={`text-sm font-mono w-6 ${timeLeft <= 5 ? 'text-red-400' : 'text-white/50'}`}>{timeLeft}s</span>
  </div>
);

const DuelPage = () => {
  const { duelId }   = useParams();
  const navigate     = useNavigate();
  const { user }     = useUser();
  const {
    currentDuel, setCurrentDuel,
    submitAnswer, subscribeToRoom,
    leaveDuel, getUserProfile,
  } = useDuel();

  // ── State ─────────────────────────────────────────────────
  const [duel,           setDuel]           = useState(currentDuel);
  const [qIndex,         setQIndex]         = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect,      setIsCorrect]      = useState(null);
  const [timeLeft,       setTimeLeft]       = useState(QUESTION_TIME);
  const [myScore,        setMyScore]        = useState(0);
  const [localAnswers,   setLocalAnswers]   = useState([]);
  const [hostProfile,    setHostProfile]    = useState(null);
  const [guestProfile,   setGuestProfile]   = useState(null);

  const timerRef    = useRef(null);
  const qStartRef   = useRef(Date.now());
  const answeredRef = useRef(false); // prevent double-submit

  const isHost   = user?.email === duel?.host_email;
  const questions = duel?.questions || [];
  const totalQ    = duel?.total_questions || 10;
  const currentQ  = questions[qIndex];

  // ── Load duel from DB if navigated directly ───────────────
  useEffect(() => {
    if (currentDuel) {
      setDuel(currentDuel);
    } else if (duelId && supabase) {
      supabase.from('duels').select('*').eq('id', duelId).single()
        .then(({ data }) => {
          if (data) { setDuel(data); setCurrentDuel(data); }
        });
    }
  }, []);

  // ── Realtime subscription ─────────────────────────────────
  useEffect(() => {
    if (!duel?.id) return;
    subscribeToRoom(duel.id, (updated) => {
      setDuel(updated);
      setCurrentDuel(updated);
    });
  }, [duel?.id]);

  // ── Load rank profiles ────────────────────────────────────
  useEffect(() => {
    if (!duel) return;
    getUserProfile(duel.host_email).then(setHostProfile);
    if (duel.guest_email) getUserProfile(duel.guest_email).then(setGuestProfile);
  }, [duel?.id]);

  // ── Per-question countdown ────────────────────────────────
  useEffect(() => {
    if (selectedAnswer !== null || !currentQ || duel?.status === 'finished') return;
    setTimeLeft(QUESTION_TIME);
    qStartRef.current = Date.now();
    answeredRef.current = false;

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleAnswer(null); // timeout counts as wrong
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [qIndex, duel?.status]);

  // ── Answer handler ────────────────────────────────────────
  const handleAnswer = useCallback(async (answer) => {
    if (answeredRef.current || !currentQ || !duel) return;
    answeredRef.current = true;
    clearInterval(timerRef.current);

    const elapsed  = (Date.now() - qStartRef.current) / 1000;
    const correct  = answer !== null && answer === currentQ.correct;
    const newScore = myScore + (correct ? 1 : 0);

    setSelectedAnswer(answer ?? '__timeout__');
    setIsCorrect(correct);
    if (correct) setMyScore(newScore);

    const newLocalAnswers = [...localAnswers, { questionIndex: qIndex, isCorrect: correct, timeTaken: elapsed }];
    setLocalAnswers(newLocalAnswers);

    await submitAnswer(duel.id, isHost, qIndex, correct, elapsed, duel);

    setTimeout(() => {
      if (qIndex + 1 < totalQ) {
        setQIndex(i => i + 1);
        setSelectedAnswer(null);
        setIsCorrect(null);
      }
      // else: wait for duel.status === 'finished' from realtime
    }, 1400);
  }, [answeredRef, currentQ, duel, myScore, qIndex, localAnswers, isHost, totalQ]);

  // ── Derived values ────────────────────────────────────────
  const opponentScore   = isHost ? (duel?.guest_score || 0)   : (duel?.host_score || 0);
  const opponentName    = isHost ? (duel?.guest_name  || '…') : (duel?.host_name  || '?');
  const opponentAnswers = isHost ? (duel?.guest_answers || []) : (duel?.host_answers || []);
  const myProfile       = isHost ? hostProfile : guestProfile;
  const theirProfile    = isHost ? guestProfile : hostProfile;

  // ── FINISHED screen ───────────────────────────────────────
  if (duel?.status === 'finished') {
    const iWon    = duel.winner_email === user?.email;
    const isDraw  = !duel.winner_email;
    const myFinal = isHost ? (duel.host_score || 0) : (duel.guest_score || 0);
    const opFinal = isHost ? (duel.guest_score || 0) : (duel.host_score || 0);
    const delta   = isDraw ? '+5' : iWon ? '+25' : '-20';

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg">
          <Card className="bg-slate-800/90 border-slate-700 text-center">
            <CardHeader>
              <div className="text-7xl mb-3">{isDraw ? '🤝' : iWon ? '🏆' : '😔'}</div>
              <CardTitle className="text-4xl text-white font-bold">
                {isDraw ? "It's a Draw!" : iWon ? 'You Won!' : 'You Lost'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'You', name: user?.name, score: myFinal, profile: myProfile, highlight: iWon || isDraw },
                  { label: 'Opponent', name: opponentName, score: opFinal, profile: theirProfile, highlight: !iWon || isDraw },
                ].map(({ label, name, score, profile, highlight }) => (
                  <div
                    key={label}
                    className={`p-4 rounded-xl border-2 ${highlight ? 'border-purple-500 bg-purple-500/20' : 'border-slate-600 bg-slate-800/50'}`}
                  >
                    <p className="text-white/50 text-xs mb-1">{label}</p>
                    <p className="text-white font-bold truncate">{name}</p>
                    <p className="text-5xl font-bold text-white my-2">{score}</p>
                    <RankBadge rating={profile?.rating ?? 1000} size="sm" />
                  </div>
                ))}
              </div>

              <div className={`p-3 rounded-lg font-semibold ${iWon ? 'bg-green-500/20 text-green-300' : isDraw ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'}`}>
                Rating change: <span className="text-xl">{delta}</span>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => { leaveDuel(); navigate('/duel'); }}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Swords className="w-4 h-4 mr-2" /> Play Again
                </Button>
                <Link to="/" className="flex-1">
                  <Button variant="outline" className="w-full border-slate-600 text-white hover:bg-slate-700">Home</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ── WAITING for opponent to finish ────────────────────────
  if (localAnswers.length >= totalQ) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="bg-slate-800/90 border-slate-700 text-center max-w-md w-full">
          <CardContent className="pt-8 pb-10 space-y-4">
            <RefreshCw className="w-12 h-12 mx-auto text-purple-400 animate-spin" />
            <h2 className="text-2xl font-bold text-white">Waiting for {opponentName}…</h2>
            <p className="text-white/60">You scored {myScore}/{totalQ}</p>
            <div className="bg-slate-700 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-blue-500"
                animate={{ width: `${(opponentAnswers.length / totalQ) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <p className="text-white/40 text-sm">{opponentName}: {opponentAnswers.length}/{totalQ} answered</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentQ) return null;

  // ── PLAYING screen ────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Score board */}
        <motion.div
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-2 bg-slate-800/70 border border-slate-700 rounded-xl p-3"
        >
          <div className="text-center">
            <p className="text-white/50 text-xs truncate">{user?.name || 'You'}</p>
            <p className="text-white font-bold text-3xl">{myScore}</p>
            <p className="text-white/30 text-xs">{localAnswers.length}/{totalQ}</p>
          </div>
          <div className="flex flex-col items-center justify-center">
            <Swords className="w-5 h-5 text-purple-400" />
            <p className="text-purple-400 text-sm font-bold mt-1">Q{qIndex + 1}/{totalQ}</p>
          </div>
          <div className="text-center">
            <p className="text-white/50 text-xs truncate">{opponentName}</p>
            <p className="text-white font-bold text-3xl">{opponentScore}</p>
            <p className="text-white/30 text-xs">{opponentAnswers.length}/{totalQ}</p>
          </div>
        </motion.div>

        {/* Timer */}
        <TimerBar timeLeft={timeLeft} total={QUESTION_TIME} />

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={qIndex}
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
          >
            <Card className="bg-slate-800/70 border-slate-700">
              <CardContent className="pt-6 space-y-5">
                {currentQ.flagUrl && (
                  <div className="flex justify-center">
                    <img
                      src={currentQ.flagUrl}
                      alt="Country flag"
                      className="h-24 w-auto rounded-lg shadow-lg object-contain"
                      loading="eager"
                    />
                  </div>
                )}
                <p className="text-white text-xl font-semibold text-center">{currentQ.questionText}</p>
                <div className="grid grid-cols-2 gap-3">
                  {currentQ.options.map((option, i) => {
                    let cls = 'border-slate-600 bg-slate-800/50 text-white hover:border-purple-400 hover:bg-purple-500/10';
                    if (selectedAnswer !== null) {
                      if (option === currentQ.correct)                     cls = 'border-green-500 bg-green-500/20 text-green-300';
                      else if (option === selectedAnswer && !isCorrect)    cls = 'border-red-500 bg-red-500/20 text-red-300';
                      else                                                 cls = 'border-slate-700 bg-slate-900/30 text-white/30';
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

        {/* Answer feedback */}
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
    </div>
  );
};

export default DuelPage;
