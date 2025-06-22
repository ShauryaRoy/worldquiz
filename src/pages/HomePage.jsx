import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@/contexts/ThemeContext';
import { useScore } from '@/contexts/ScoreContext';
import { Flag, Building2, Languages, Smile, Clock, Users, Coins, MapPin, Grid3X3, Lightbulb, Moon, Sun, Trophy, Globe, BarChart3 } from 'lucide-react';

const HomePage = () => {
  const {
    theme,
    toggleTheme
  } = useTheme();
  const {
    getAllScores
  } = useScore();
  const scores = getAllScores();
  const totalQuizzes = Object.keys(scores).length;
  const averageScore = totalQuizzes > 0 ? Math.round(Object.values(scores).reduce((acc, score) => acc + (score.percentage || 0), 0) / totalQuizzes) : 0;
  const quizTypes = [{
    title: "Flag Quiz",
    description: "Identify countries by their flags",
    icon: Flag,
    path: "/quiz/flags",
    color: "from-red-500 to-pink-600"
  }, {
    title: "Capital Cities",
    description: "Match countries with their capitals",
    icon: Building2,
    path: "/quiz/capitals",
    color: "from-green-500 to-emerald-600"
  }, {
    title: "Languages",
    description: "Guess the primary language of countries",
    icon: Languages,
    path: "/quiz/languages",
    color: "from-purple-500 to-violet-600"
  }, {
    title: "Time Zones",
    description: "Test your knowledge of world time zones",
    icon: Clock,
    path: "/quiz/timezones",
    color: "from-indigo-500 to-blue-600"
  }, {
    title: "Population Quiz",
    description: "Compare population sizes of countries",
    icon: Users,
    path: "/quiz/population",
    color: "from-teal-500 to-green-600"
  }, {
    title: "Currencies",
    description: "Match countries with their currencies",
    icon: Coins,
    path: "/quiz/currencies",
    color: "from-amber-500 to-yellow-600"
  }, {
    title: "Indian States",
    description: "Explore India's states and capitals",
    icon: MapPin,
    path: "/quiz/indian-states",
    color: "from-orange-500 to-red-600"
  }, {
    title: "Daily Geo Wordle",
    description: "Daily country guessing game",
    icon: Grid3X3,
    path: "/quiz/wordle",
    color: "from-rose-500 to-pink-600"
  }, {
    title: "All Flags",
    description: "Browse all country flags",
    icon: Globe,
    path: "/quiz/all-flags",
    color: "from-sky-500 to-indigo-600"
  }, {
    title: "Country Facts",
    description: "Discover amazing country facts",
    icon: Lightbulb,
    path: "/fact",
    color: "from-cyan-500 to-blue-600"
  }];
  return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
    <motion.header initial={{
      y: -50,
      opacity: 0
    }} animate={{
      y: 0,
      opacity: 1
    }} className="border-b border-white/10 backdrop-blur-md bg-black/20 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">GQ</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">WorldQuiz</h1>
            <p className="text-white/60 text-sm">Ultimate Geography Challenge</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          {totalQuizzes > 0 && <div className="flex items-center space-x-1 sm:space-x-2 text-white/80 bg-white/10 px-3 py-1 rounded-full">
            <Trophy className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">{averageScore}% Average</span>
          </div>}
          <Link to="/leaderboard">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <BarChart3 className="w-5 h-5" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-white hover:bg-white/10">
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
      </div>
    </motion.header>

    <motion.section initial={{
      y: 20,
      opacity: 0
    }} animate={{
      y: 0,
      opacity: 1
    }} transition={{
      delay: 0.1
    }} className="container mx-auto px-4 py-12 text-center">
      <h2 className="text-5xl font-bold gradient-text mb-4">
        Test Your Geography Knowledge
      </h2>
      <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
        Challenge yourself with various geography quizzes covering flags, capitals,
        country shapes, languages, and much more!
      </p>

      <div className="flex justify-center">
        <img className="w-64 h-48 object-cover rounded-2xl shadow-2xl" alt="World map with quiz elements" src="https://images.unsplash.com/photo-1693491276200-fcd36509a2d2?w=512&h=384&q=70&auto=format&fit=crop&fm=webp" loading="lazy" width="256" height="192" />
      </div>
    </motion.section>

    <section className="container mx-auto px-4 pb-12">
      <motion.div initial={{
        y: 20,
        opacity: 0
      }} animate={{
        y: 0,
        opacity: 1
      }} transition={{
        delay: 0.2
      }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {quizTypes.map((quiz, index) => {
          const Icon = quiz.icon;
          const scoreData = scores[quiz.path.split('/').pop()];
          return <motion.div key={quiz.path} initial={{
            y: 20,
            opacity: 0
          }} animate={{
            y: 0,
            opacity: 1
          }} transition={{
            delay: 0.05 * index
          }} whileHover={{
            scale: 1.05
          }} whileTap={{
            scale: 0.95
          }}>
            <Link to={quiz.path}>
              <Card className="quiz-card h-full cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${quiz.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-white group-hover:text-blue-300 transition-colors">
                    {quiz.title}
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    {quiz.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {scoreData && <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Best Score:</span>
                    <span className="text-green-400 font-semibold">
                      {scoreData.percentage}%
                    </span>
                  </div>}
                </CardContent>
              </Card>
            </Link>
          </motion.div>;
        })}
      </motion.div>
    </section>

    {totalQuizzes > 0 && <motion.section initial={{
      y: 20,
      opacity: 0
    }} animate={{
      y: 0,
      opacity: 1
    }} transition={{
      delay: 0.3
    }} className="container mx-auto px-4 pb-12">
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-600/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white text-center">Your Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-400">{totalQuizzes}</div>
              <div className="text-white/70">Quizzes Attempted</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-400">{averageScore}%</div>
              <div className="text-white/70">Average Score</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-400">
                {Object.values(scores).reduce((acc, scoreData) => acc + (scoreData.score || 0), 0)}
              </div>
              <div className="text-white/70">Total Correct Answers</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.section>}

    <footer className="border-t border-white/10 bg-black/20 backdrop-blur-md">
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-white/60">
          Built with ❤️ for geography enthusiasts worldwide. Current Date: {new Date().toLocaleDateString()}
        </p>
      </div>
    </footer>
  </div>;
};

export default HomePage;