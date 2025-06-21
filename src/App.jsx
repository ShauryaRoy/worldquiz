
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ScoreProvider } from '@/contexts/ScoreContext';
import { UserProvider } from '@/contexts/UserContext';
import HomePage from '@/pages/HomePage.jsx';
import FlagQuiz from '@/pages/quizzes/FlagQuiz.jsx';
import CapitalQuiz from '@/pages/quizzes/CapitalQuiz.jsx';
import LanguageQuiz from '@/pages/quizzes/LanguageQuiz.jsx';
import EmojiQuiz from '@/pages/quizzes/EmojiQuiz.jsx';
import TimezoneQuiz from '@/pages/quizzes/TimezoneQuiz.jsx';
import PopulationQuiz from '@/pages/quizzes/PopulationQuiz.jsx';
import CurrencyQuiz from '@/pages/quizzes/CurrencyQuiz.jsx';
import IndianStatesQuiz from '@/pages/quizzes/IndianStatesQuiz.jsx';
import WordleQuiz from '@/pages/quizzes/WordleQuiz.jsx';
import FactOfTheDay from '@/pages/FactOfTheDay.jsx';
import AllFlagsQuiz from '@/pages/quizzes/AllFlagsQuiz.jsx';
import LeaderboardPage from '@/pages/LeaderboardPage.jsx';
import QuizLeaderboardPage from '@/pages/QuizLeaderboardPage.jsx';
import UserInfoModal from '@/components/UserInfoModal';
import UsStateFlagQuiz from '@/pages/quizzes/UsStateFlagQuiz.jsx';
import UsFactsQuiz from '@/pages/quizzes/UsFactsQuiz.jsx';

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
                <Route path="/quiz/flags" element={<FlagQuiz />} />
                <Route path="/quiz/capitals" element={<CapitalQuiz />} />
                <Route path="/quiz/languages" element={<LanguageQuiz />} />
                <Route path="/quiz/emoji" element={<EmojiQuiz />} />
                <Route path="/quiz/timezones" element={<TimezoneQuiz />} />
                <Route path="/quiz/population" element={<PopulationQuiz />} />
                <Route path="/quiz/currencies" element={<CurrencyQuiz />} />
                <Route path="/quiz/indian-states" element={<IndianStatesQuiz />} />
                <Route path="/quiz/wordle" element={<WordleQuiz />} />
                <Route path="/quiz/all-flags" element={<AllFlagsQuiz />} />
                <Route path="/quiz/us-state-flags" element={<UsStateFlagQuiz />} />
                <Route path="/quiz/us-facts" element={<UsFactsQuiz />} />
                <Route path="/fact" element={<FactOfTheDay />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/leaderboard/:quizType" element={<QuizLeaderboardPage />} />
              </Routes>
              <Toaster />
            </div>
          </Router>
        </ScoreProvider>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
