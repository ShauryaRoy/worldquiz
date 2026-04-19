import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import QuizLayout from '@/components/QuizLayout';
import RankBadge from '@/components/RankBadge';
import { useDuel } from '@/contexts/DuelContext';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/components/ui/use-toast';
import { generateDuelQuestions, DUEL_QUIZ_TYPES } from '@/lib/duelQuestions';
import { Swords, Copy, Check, RefreshCw, Users, ArrowRight, Trophy } from 'lucide-react';

const DuelLobbyPage = () => {
  const navigate = useNavigate();
  const { user, requestUserInfo } = useUser();
  const {
    createDuel, joinDuel,
    currentDuel, duelStatus, error,
    setError, setDuelStatus, setCurrentDuel,
    subscribeToRoom, getUserProfile,
  } = useDuel();
  const { toast } = useToast();

  const [mode,             setMode]             = useState('select'); // select | hosting | joining
  const [selectedQuizType, setSelectedQuizType] = useState('capitals');
  const [joinCode,         setJoinCode]         = useState('');
  const [copied,           setCopied]           = useState(false);
  const [userProfile,      setUserProfile]      = useState(null);
  const [guestJoined,      setGuestJoined]      = useState(false);

  useEffect(() => { requestUserInfo(); }, []);

  useEffect(() => {
    if (user) getUserProfile(user.email).then(setUserProfile);
  }, [user]);

  // Host: subscribe to room and detect when guest joins
  useEffect(() => {
    if (!currentDuel || duelStatus !== 'waiting') return;
    subscribeToRoom(currentDuel.id, (updated) => {
      setCurrentDuel(updated);
      if (updated.status === 'active') {
        setDuelStatus('active');
        setGuestJoined(true);
      }
    });
  }, [currentDuel?.id, duelStatus]);

  // Both: navigate once duel is active
  useEffect(() => {
    if (duelStatus === 'active' && currentDuel) {
      const timer = setTimeout(() => navigate(`/duel/${currentDuel.id}`), 1200);
      return () => clearTimeout(timer);
    }
  }, [duelStatus, currentDuel]);

  // Show toast on error
  useEffect(() => {
    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' });
      setError(null);
    }
  }, [error]);

  const handleCreateRoom = async () => {
    if (!user) { requestUserInfo(); return; }
    const questions = generateDuelQuestions(selectedQuizType, 10);
    const duel = await createDuel(user, selectedQuizType, questions);
    if (duel) setMode('hosting');
  };

  const handleJoinRoom = async () => {
    if (!user) { requestUserInfo(); return; }
    const trimmed = joinCode.trim();
    if (trimmed.length !== 6) {
      toast({ title: 'Invalid code', description: 'Enter the full 6-character room code.', variant: 'destructive' });
      return;
    }
    const result = await joinDuel(user, trimmed);
    if (result) setMode('joining');
  };

  const copyCode = () => {
    navigator.clipboard.writeText(currentDuel?.room_code || '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <QuizLayout title="1v1 Duel" description="Challenge a friend to a live geography battle!">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Player profile strip */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between bg-slate-800/50 border border-slate-700 rounded-xl p-4"
          >
            <div>
              <p className="text-white font-semibold">{user.name}</p>
              <p className="text-white/40 text-sm">{user.email}</p>
            </div>
            <RankBadge rating={userProfile?.rating ?? 1000} size="md" />
          </motion.div>
        )}

        {/* Guest-joined notice */}
        <AnimatePresence>
          {guestJoined && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="bg-green-500/20 border border-green-500 rounded-xl p-4 text-center text-green-300 font-semibold text-lg"
            >
              {currentDuel?.guest_name} joined! Starting duel…
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── SELECT MODE ── */}
        {mode === 'select' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

            {/* Quiz type picker */}
            <Card className="bg-slate-800/70 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Swords className="w-5 h-5 text-purple-400" /> Choose Quiz Type
                </CardTitle>
                <CardDescription className="text-white/60">Pick the category for your duel</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                {DUEL_QUIZ_TYPES.map(qt => (
                  <button
                    key={qt.value}
                    onClick={() => setSelectedQuizType(qt.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedQuizType === qt.value
                        ? 'border-purple-500 bg-purple-500/20 text-white'
                        : 'border-slate-600 bg-slate-800/50 text-white/70 hover:border-slate-500'
                    }`}
                  >
                    <span className="text-2xl">{qt.emoji}</span>
                    <p className="font-semibold mt-1">{qt.label}</p>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Create room */}
            <Card className="bg-slate-800/70 border-slate-700">
              <CardContent className="pt-6">
                <Button
                  onClick={handleCreateRoom}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-6 text-lg"
                >
                  <Swords className="w-5 h-5 mr-2" /> Create Duel Room
                </Button>
              </CardContent>
            </Card>

            {/* Join room */}
            <Card className="bg-slate-800/70 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" /> Join a Room
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  placeholder="ABC123"
                  maxLength={6}
                  className="bg-slate-900 border-slate-600 text-white text-center text-2xl tracking-[0.3em] font-mono uppercase h-14"
                />
                <Button
                  onClick={handleJoinRoom}
                  disabled={joinCode.length !== 6}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  <ArrowRight className="w-4 h-4 mr-2" /> Join Duel
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── HOSTING: waiting for guest ── */}
        {mode === 'hosting' && currentDuel && !guestJoined && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="bg-slate-800/70 border-slate-700 text-center">
              <CardHeader>
                <CardTitle className="text-2xl text-white">Waiting for opponent…</CardTitle>
                <CardDescription className="text-white/60">Share this code with your friend</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-slate-900 border-2 border-purple-500 rounded-2xl p-6">
                  <p className="text-purple-400 text-xs font-semibold tracking-widest mb-2">ROOM CODE</p>
                  <p className="text-6xl font-mono font-bold text-white tracking-[0.2em]">
                    {currentDuel.room_code}
                  </p>
                </div>

                <Button onClick={copyCode} variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                  {copied
                    ? <><Check className="w-4 h-4 mr-2 text-green-400" />Copied!</>
                    : <><Copy className="w-4 h-4 mr-2" />Copy Room Code</>
                  }
                </Button>

                <div className="flex items-center justify-center gap-2 text-white/40 text-sm">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Waiting for someone to join…
                </div>

                <p className="text-white/30 text-sm">
                  Quiz: {DUEL_QUIZ_TYPES.find(q => q.value === currentDuel.quiz_type)?.label}
                  &nbsp;·&nbsp;10 Questions
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── JOINING: duel starting ── */}
        {mode === 'joining' && duelStatus === 'active' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="bg-slate-800/70 border-slate-700 text-center">
              <CardContent className="pt-8 pb-10 space-y-4">
                <Swords className="w-16 h-16 mx-auto text-purple-400" />
                <h2 className="text-3xl font-bold text-white">Duel Starting!</h2>
                <p className="text-white/60 text-lg">vs. {currentDuel?.host_name}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

      </div>
    </QuizLayout>
  );
};

export default DuelLobbyPage;
