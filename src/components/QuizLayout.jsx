
import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Moon, Sun, Trophy, BarChart3, ArrowLeft } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useScore } from '@/contexts/ScoreContext';
import { useUser } from '@/contexts/UserContext';
import { motion } from 'framer-motion';

const QuizLayout = ({ children, title, description, quizType, isLeaderboardPage = false }) => {
  const { theme, toggleTheme } = useTheme();
  const { getAllScores } = useScore();
  const { user, requestUserInfo } = useUser();
  const params = useParams();
  
  useEffect(() => {
    if (quizType) { 
      requestUserInfo();
    }
  }, [quizType, requestUserInfo]);

  const scores = getAllScores();
  const totalQuizzes = Object.keys(scores).length;
  const averageScore = totalQuizzes > 0 
    ? Math.round(Object.values(scores).reduce((acc, score) => acc + (score.percentage || 0), 0) / totalQuizzes)
    : 0;

  const showBackButton = isLeaderboardPage && params.quizType;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="border-b border-white/10 backdrop-blur-md bg-black/20 sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {showBackButton && (
              <Link to="/leaderboard">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 mr-2">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
            )}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">GQ</span>
              </div>
              <span className="text-xl font-bold gradient-text">GeoQuiz Master</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            {user && (
              <span className="text-sm text-white/70 hidden sm:block">Hi, {user.name}!</span>
            )}
            {totalQuizzes > 0 && !isLeaderboardPage && (
              <div className="flex items-center space-x-1 sm:space-x-2 text-sm text-white/80">
                <Trophy className="w-4 h-4" />
                <span className="hidden sm:inline">{averageScore}% avg</span>
              </div>
            )}
            
            {!isLeaderboardPage && (
                <Link to="/leaderboard">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                        <BarChart3 className="w-4 h-4" />
                    </Button>
                </Link>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-white hover:bg-white/10"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            
            <Link to="/">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <Home className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold gradient-text mb-2">{title}</h1>
          <p className="text-white/80 text-lg">{description}</p>
        </motion.div>
        
        {children}
      </main>
    </div>
  );
};

export default QuizLayout;
