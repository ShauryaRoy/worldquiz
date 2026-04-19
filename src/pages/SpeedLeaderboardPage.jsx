import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import QuizLayout from '@/components/QuizLayout';
import { supabase } from '@/lib/supabaseClient';
import { Zap, RefreshCw, Trophy, Hash, Filter, ArrowLeft } from 'lucide-react';

const QUIZ_NAMES = {
  flags: 'Flag Quiz', shapes: 'Shape Quiz', capitals: 'Capital Cities',
  languages: 'Language Quiz', emoji: 'Emoji Countries', timezones: 'Time Zone Quiz',
  population: 'Population Quiz', currencies: 'Currency Quiz',
  'indian-states': 'Indian States Quiz', wordle: 'Geo Wordle',
  'all-flags': 'All Flags Quiz', 'us-state-flag': 'US State Flags Quiz', 'us-facts': 'US Facts Quiz',
};
const getQuizName = t => QUIZ_NAMES[t] || (t || '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

const PERIODS = [
  { label: 'This Week',  value: 'week',  days: 7   },
  { label: 'This Month', value: 'month', days: 30  },
  { label: 'All Time',   value: 'all',   days: null },
];

const MIN_SCORE = 5; // minimum correct answers to qualify for speed board

const SpeedLeaderboardPage = () => {
  const [data,           setData]           = useState([]);
  const [isLoading,      setIsLoading]      = useState(true);
  const [period,         setPeriod]         = useState('week');
  const [quizFilter,     setQuizFilter]     = useState('all');
  const [availableTypes, setAvailableTypes] = useState([]);

  const fetchData = async () => {
    setIsLoading(true);

    if (!supabase) {
      // Offline fallback from localStorage
      try {
        const stored = localStorage.getItem('geoquiz-leaderboard-local-all');
        const all    = stored ? JSON.parse(stored) : [];
        const ranked = all
          .filter(e => (e.score || 0) >= MIN_SCORE)
          .sort((a, b) => (Number(a.time_taken) || 999) - (Number(b.time_taken) || 999))
          .slice(0, 50);
        setData(ranked);
        setAvailableTypes([...new Set(ranked.map(r => r.quiz_type).filter(Boolean))]);
      } catch { setData([]); }
      setIsLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('leaderboard_scores')
        .select('*')
        .gte('score', MIN_SCORE)
        .order('time_taken', { ascending: true })
        .limit(200);

      const periodCfg = PERIODS.find(p => p.value === period);
      if (periodCfg?.days) {
        const cutoff = new Date(Date.now() - periodCfg.days * 86_400_000).toISOString();
        query = query.gte('created_at', cutoff);
      }

      if (quizFilter !== 'all') query = query.eq('quiz_type', quizFilter);

      const { data: rows, error } = await query;
      if (error) throw error;

      setData(rows || []);
      const types = [...new Set((rows || []).map(r => r.quiz_type).filter(Boolean))];
      setAvailableTypes(prev => [...new Set([...prev, ...types])]);
    } catch (err) {
      console.error('Speed leaderboard error:', err);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch when period or quiz filter changes
  useEffect(() => { fetchData(); }, [period, quizFilter]);

  return (
    <QuizLayout title="Speed Leaderboard" description="Fastest correct answers win!" isLeaderboardPage={true}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

        <Card className="bg-slate-800/70 border-slate-700 shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-3xl gradient-text flex items-center gap-2">
                <Zap className="w-7 h-7 text-yellow-400" /> Speed Rankings
              </CardTitle>
              <CardDescription className="text-white/60">
                Minimum {MIN_SCORE} correct to qualify · sorted by total time
              </CardDescription>
            </div>
            <Button onClick={fetchData} disabled={isLoading} variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Period tabs */}
            <div className="flex gap-2 flex-wrap">
              {PERIODS.map(p => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    period === p.value
                      ? 'bg-yellow-500 text-black'
                      : 'bg-slate-700 text-white/70 hover:bg-slate-600'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Quiz-type filter */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setQuizFilter('all')}
                className={`px-3 py-1.5 rounded-full text-sm transition-all flex items-center gap-1 ${
                  quizFilter === 'all'
                    ? 'bg-purple-500 text-white'
                    : 'bg-slate-700 text-white/60 hover:bg-slate-600'
                }`}
              >
                <Filter className="w-3 h-3" /> All Quizzes
              </button>
              {availableTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setQuizFilter(type)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    quizFilter === type
                      ? 'bg-purple-500 text-white'
                      : 'bg-slate-700 text-white/60 hover:bg-slate-600'
                  }`}
                >
                  {getQuizName(type)}
                </button>
              ))}
            </div>

            {/* Results table */}
            {isLoading ? (
              <div className="flex justify-center items-center py-14">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400" />
              </div>
            ) : data.length === 0 ? (
              <p className="text-center text-white/60 py-14 text-lg">
                No speed records yet for this filter. Play a quiz to get on the board!
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[580px] text-left text-white/90">
                  <thead className="border-b border-slate-700">
                    <tr>
                      <th className="p-3 text-white/50 font-medium"><Hash className="inline w-4 h-4 mr-1" />Rank</th>
                      <th className="p-3 text-white/50 font-medium">Player</th>
                      <th className="p-3 text-white/50 font-medium">Quiz</th>
                      <th className="p-3 text-right text-white/50 font-medium"><Trophy className="inline w-4 h-4 mr-1" />Score</th>
                      <th className="p-3 text-right text-yellow-400 font-medium"><Zap className="inline w-4 h-4 mr-1" />Speed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.slice(0, 50).map((entry, i) => (
                      <motion.tr
                        key={entry.id || i}
                        className={`border-b border-slate-700/40 hover:bg-slate-700/40 transition-colors ${i < 3 ? 'bg-yellow-500/5' : ''}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.025 }}
                      >
                        <td className="p-3 font-medium">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                        </td>
                        <td className="p-3 font-semibold">{entry.name}</td>
                        <td className="p-3 text-white/50 text-sm">{getQuizName(entry.quiz_type)}</td>
                        <td className="p-3 text-right text-green-400 font-semibold">{entry.score}</td>
                        <td className="p-3 text-right text-yellow-400 font-bold font-mono">
                          {Number(entry.time_taken).toFixed(1)}s
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-center gap-3">
          <Link to="/leaderboard">
            <Button variant="outline" className="border-purple-400 text-purple-400 hover:bg-purple-400/10">
              <ArrowLeft className="w-4 h-4 mr-2" /> Regular Leaderboards
            </Button>
          </Link>
        </div>

      </motion.div>
    </QuizLayout>
  );
};

export default SpeedLeaderboardPage;
