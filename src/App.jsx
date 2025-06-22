import React from 'react';
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ScoreProvider } from '@/contexts/ScoreContext';
import { UserProvider } from '@/contexts/UserContext';
import HomePage from '@/pages/HomePage.jsx';
import { LazyQuizRoutes } from '@/pages/LazyQuizRoutes';
import LeaderboardPage from '@/pages/LeaderboardPage.jsx';
import QuizLeaderboardPage from '@/pages/QuizLeaderboardPage.jsx';
import UserInfoModal from '@/components/UserInfoModal';
import FactOfTheDay from '@/pages/FactOfTheDay.jsx';

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <ScoreProvider>
          <Router>
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
              <UserInfoModal />
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/quiz/:type" element={<LazyQuizRoutesWrapper />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/leaderboard/:quizType" element={<QuizLeaderboardPage />} />
                <Route path="/fact" element={<FactOfTheDay />} />
              </Routes>
              <Toaster />
            </div>
          </Router>
        </ScoreProvider>
      </UserProvider>
    </ThemeProvider>
  );
}

// Wrapper to extract route param and pass to LazyQuizRoutes
function LazyQuizRoutesWrapper() {
  const { type } = useParams();
  return <LazyQuizRoutes route={type} />;
}

export default App;
