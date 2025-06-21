
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import QuizLayout from '@/components/QuizLayout';
import { useScore } from '@/contexts/ScoreContext';
import { Trophy, Clock, Hash, RefreshCw, ArrowLeft } from 'lucide-react';

const quizTypeDisplayNames = {
  flags: "Flag Quiz",
  shapes: "Shape Quiz",
  capitals: "Capital Cities",
  languages: "Language Quiz",
  emoji: "Emoji Countries",
  timezones: "Time Zone Quiz",
  population: "Population Quiz",
  currencies: "Currency Quiz",
  "indian-states": "Indian States Quiz",
  wordle: "Geo Wordle",
  "all-flags": "All Flags Quiz",
  "us-state-flags": "US State Flags Quiz",
  "us-facts": "US Facts Quiz"
};

const getQuizDisplayName = (quizType) => {
  return quizTypeDisplayNames[quizType] || quizType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const QuizLeaderboardPage = () => {
  const { quizType } = useParams();
  const { getLeaderboard, fetchLeaderboard } = useScore();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    const data = await fetchLeaderboard(quizType);
    setLeaderboardData(data);
    setIsLoading(false);
  };
  
  useEffect(() => {
    loadData();
  }, [quizType]);

  const displayName = getQuizDisplayName(quizType);

  return (
    <QuizLayout 
      title={`${displayName} Leaderboard`}
      description={`Top scores for the ${displayName}.`}
      isLeaderboardPage={true}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-slate-800/70 border-slate-700 shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="text-3xl gradient-text">{displayName} - Top Scores</CardTitle>
                <CardDescription className="text-white/70">See who mastered this quiz!</CardDescription>
            </div>
            <Button onClick={loadData} disabled={isLoading} variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
               <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400"></div>
                  <p className="ml-4 text-white/70">Loading scores...</p>
               </div>
            ) : leaderboardData.length === 0 ? (
              <p className="text-center text-white/70 py-8 text-lg">
                No scores recorded for this quiz yet. Be the first!
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-white/90">
                  <thead className="border-b border-slate-700">
                    <tr>
                      <th className="p-4"><Hash className="inline w-5 h-5 mr-1" />Rank</th>
                      <th className="p-4">Name</th>
                      <th className="p-4 text-right"><Trophy className="inline w-5 h-5 mr-1" />Score</th>
                      <th className="p-4 text-right"><Clock className="inline w-5 h-5 mr-1" />Time (s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardData.map((entry, index) => (
                      <motion.tr 
                        key={entry.id || index} 
                        className="border-b border-slate-700/50 hover:bg-slate-700/50 transition-colors"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <td className="p-4 font-medium">{index + 1}</td>
                        <td className="p-4">{entry.name}</td>
                        <td className="p-4 text-right font-semibold text-green-400">{entry.score}</td>
                        <td className="p-4 text-right text-yellow-400">{entry.time_taken.toFixed(1)}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
        <div className="mt-8 text-center">
            <Link to="/leaderboard">
                <Button variant="outline" className="border-purple-400 text-purple-400 hover:bg-purple-400/10">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to All Leaderboards
                </Button>
            </Link>
        </div>
      </motion.div>
    </QuizLayout>
  );
};

export default QuizLeaderboardPage;
