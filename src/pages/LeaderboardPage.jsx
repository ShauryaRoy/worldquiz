
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import QuizLayout from '@/components/QuizLayout';
import { useScore } from '@/contexts/ScoreContext';
import { Link } from 'react-router-dom';
import { Trophy, Clock, Hash, RefreshCw, ListChecks, ChevronRight } from 'lucide-react';

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


const LeaderboardPage = () => {
  const { getLeaderboard, fetchLeaderboard, fetchAllQuizTypesForLeaderboard } = useScore();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [availableQuizTypes, setAvailableQuizTypes] = useState([]);

  const loadData = async () => {
    setIsLoading(true);
    await fetchLeaderboard(); 
    setLeaderboardData(getLeaderboard());
    const types = await fetchAllQuizTypesForLeaderboard();
    setAvailableQuizTypes(types);
    setIsLoading(false);
  };
  
  useEffect(() => {
    loadData();
  }, []); 

  return (
    <QuizLayout 
      title="Leaderboards" 
      description="See who's topping the charts or select a specific quiz!"
      isLeaderboardPage={true}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <Card className="bg-slate-800/70 border-slate-700 shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div >
              <CardTitle className="text-3xl gradient-text">Quiz Leaderboards</CardTitle>
              <CardDescription className="text-white/70">View scores for different quizzes.</CardDescription>
            </div>
            <Button onClick={loadData} disabled={isLoading} variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading && availableQuizTypes.length === 0 ? (
               <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400"></div>
                  <p className="ml-4 text-white/70">Loading available quizzes...</p>
               </div>
            ) : availableQuizTypes.length === 0 ? (
              <p className="text-center text-white/70 py-8 text-lg">
                No quiz types with scores found yet. Play some quizzes to see leaderboards here!
              </p>
            ) : (
              <ul className="space-y-3">
                {availableQuizTypes.map(quizType => (
                  <li key={quizType}>
                    <Link to={`/leaderboard/${quizType}`}>
                      <Button variant="outline" className="w-full justify-between hover:bg-slate-700/50 border-slate-600 text-white py-6">
                        <div className="flex items-center">
                          <ListChecks className="w-5 h-5 mr-3 text-purple-400" />
                          {getQuizDisplayName(quizType)}
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-500" />
                      </Button>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>


        <Card className="bg-slate-800/70 border-slate-700 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl gradient-text-alt">Overall Top Scores</CardTitle>
            <CardDescription className="text-white/70">Top 10 scores across all quizzes.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && leaderboardData.length === 0 ? (
               <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-400"></div>
                  <p className="ml-4 text-white/70">Loading top scores...</p>
               </div>
            ): leaderboardData.length === 0 ? (
               <p className="text-center text-white/70 py-8 text-lg">
                No scores recorded yet. Be the first!
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-white/90">
                  <thead className="border-b border-slate-700">
                    <tr>
                      <th className="p-4"><Hash className="inline w-5 h-5 mr-1" />Rank</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Quiz Type</th>
                      <th className="p-4 text-right"><Trophy className="inline w-5 h-5 mr-1" />Score</th>
                      <th className="p-4 text-right"><Clock className="inline w-5 h-5 mr-1" />Time (s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardData.slice(0, 10).map((entry, index) => (
                      <motion.tr 
                        key={entry.id || index} 
                        className="border-b border-slate-700/50 hover:bg-slate-700/50 transition-colors"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <td className="p-4 font-medium">{index + 1}</td>
                        <td className="p-4">{entry.name}</td>
                        <td className="p-4">{getQuizDisplayName(entry.quiz_type)}</td>
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
      </motion.div>
    </QuizLayout>
  );
};

export default LeaderboardPage;
