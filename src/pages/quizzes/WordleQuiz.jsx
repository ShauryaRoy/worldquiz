import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import QuizLayout from '@/components/QuizLayout';
import { countries } from '@/data/countries';
import { RotateCcw, Home, Keyboard, Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useScore } from '@/contexts/ScoreContext';
import { useUser } from '@/contexts/UserContext';

const QUIZ_TYPE = "wordle";
const MAX_GUESSES = 6;

const WordleQuiz = () => {
  const [targetCountry, setTargetCountry] = useState('');
  const [targetCountryData, setTargetCountryData] = useState(null);
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [availableCountries, setAvailableCountries] = useState([]);
  const [startTime, setStartTime] = useState(null);
  
  const { toast } = useToast();
  const { updateScore, addLeaderboardEntry } = useScore();
  const { user, requestUserInfo } = useUser();

  useEffect(() => {
    if (!user) {
      requestUserInfo();
    }
  }, [user, requestUserInfo]);

  const initializeGame = () => {
    const randomCountryData = countries[Math.floor(Math.random() * countries.length)];
    setTargetCountryData(randomCountryData);
    setTargetCountry(randomCountryData.country.toUpperCase());
    setAvailableCountries(countries.map(c => c.country.toUpperCase()));
    setGuesses([]);
    setCurrentGuess('');
    setGameWon(false);
    setGameOver(false);
    setStartTime(Date.now());
  };

  useEffect(() => {
    initializeGame();
  }, []);

  const getLetterStatus = (letter, position) => {
    if (targetCountry[position] === letter) return 'correct';
    if (targetCountry.includes(letter)) return 'partial';
    return 'incorrect';
  };

  const submitGuess = () => {
    if (currentGuess.length < 3) {
      toast({ title: "Too short!", description: "Country name must be at least 3 letters long", variant: "destructive" });
      return;
    }

    const upperGuess = currentGuess.toUpperCase();
    
    if (!availableCountries.includes(upperGuess)) {
      toast({ title: "Invalid country!", description: "Please enter a valid country name", variant: "destructive" });
      return;
    }

    const newGuesses = [...guesses, upperGuess];
    setGuesses(newGuesses);
    setCurrentGuess('');

    const timeTaken = (Date.now() - startTime) / 1000;

    if (upperGuess === targetCountry) {
      setGameWon(true);
      setGameOver(true);
      const score = Math.max(0, 100 - Math.floor(timeTaken / 2) - (newGuesses.length - 1) * 5); 
      updateScore(QUIZ_TYPE, score, 100, timeTaken);
      if(user) {
        addLeaderboardEntry({
          name: user.name, email: user.email, quiz_type: QUIZ_TYPE, score, time_taken: timeTaken, created_at: new Date().toISOString()
        });
      }
      toast({ title: "Congratulations! 🎉", description: `You guessed ${targetCountry} in ${newGuesses.length} tries! Time: ${timeTaken.toFixed(1)}s` });
    } else if (newGuesses.length >= MAX_GUESSES) {
      setGameOver(true);
      updateScore(QUIZ_TYPE, 0, 100, timeTaken);
       if(user) {
        addLeaderboardEntry({
          name: user.name, email: user.email, quiz_type: QUIZ_TYPE, score: 0, time_taken: timeTaken, created_at: new Date().toISOString()
        });
      }
      toast({ title: "Game Over! 😔", description: `The country was ${targetCountry}`, variant: "destructive" });
    }
  };

  const getHint = () => {
    if (!targetCountryData) return '';
    if (guesses.length >= 1) return `Continent: ${targetCountryData.continent || 'N/A'}`;
    if (guesses.length >= 3) return `Continent: ${targetCountryData.continent || 'N/A'}, First letter: ${targetCountry[0]}`;
    return 'Guess a country to get a hint!';
  };

  const resetQuizAndGame = () => {
    if (!user) {
      requestUserInfo();
      return;
    }
    initializeGame();
  };

  if (gameOver) {
    const timeTaken = (Date.now() - startTime) / 1000;
    return (
      <QuizLayout title="Daily Geo Wordle Complete!" description={gameWon ? "Well done!" : "Better luck next time!"} quizType={QUIZ_TYPE}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md mx-auto text-center">
          <Card className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border-white/20">
            <CardContent className="p-8">
              <div className="text-6xl mb-4">{gameWon ? '🏆' : '😔'}</div>
              <h2 className="text-3xl font-bold text-white mb-2">{gameWon ? 'Excellent!' : 'Game Over!'}</h2>
              <p className="text-white/80 mb-2">The country was: <span className="font-bold text-blue-400">{targetCountry}</span></p>
              {gameWon && <p className="text-white/80 mb-2">You guessed it in {guesses.length} tries!</p>}
              <p className="text-white/80 mb-6">Time taken: {timeTaken.toFixed(1)} seconds.</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={resetQuizAndGame} className="flex-1"><RotateCcw className="w-4 h-4 mr-2" /> Play Again</Button>
                <Link to="/" className="flex-1"><Button variant="outline" className="w-full"><Home className="w-4 h-4 mr-2" /> Home</Button></Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </QuizLayout>
    );
  }
  
  const displayLength = targetCountry ? Math.max(6, targetCountry.length) : 6;

  return (
    <QuizLayout title="Daily Geo Wordle" description="Guess the country name!" quizType={QUIZ_TYPE}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-4 text-white/80">
          <p>Guess {guesses.length}/{MAX_GUESSES}</p>
          <p className="flex items-center justify-center gap-1"><Lightbulb className="w-4 h-4 text-yellow-400" /> {getHint()}</p>
        </div>

        <div className="grid gap-1 mb-6" style={{ gridTemplateColumns: `repeat(${displayLength}, minmax(0, 1fr))` }}>
          {Array.from({ length: MAX_GUESSES }).map((_, rowIndex) => (
            <React.Fragment key={rowIndex}>
              {Array.from({ length: displayLength }).map((_, colIndex) => {
                const guess = guesses[rowIndex];
                const letter = guess ? guess[colIndex] : (rowIndex === guesses.length && currentGuess[colIndex] ? currentGuess[colIndex].toUpperCase() : '');
                const status = guess && colIndex < guess.length ? getLetterStatus(guess[colIndex], colIndex) : '';
                return (
                  <motion.div
                    key={`${rowIndex}-${colIndex}`}
                    initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: colIndex * 0.05 }}
                    className={`wordle-cell ${status} aspect-square flex items-center justify-center text-xl sm:text-2xl font-bold uppercase rounded-md border-2 ${
                      status ? `border-${status === 'correct' ? 'green-500' : status === 'partial' ? 'yellow-500' : 'slate-600'}` : 'border-slate-600'
                    } ${
                      status ? `bg-${status === 'correct' ? 'green-500' : status === 'partial' ? 'yellow-500' : 'slate-700'} text-white` : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {letter}
                  </motion.div>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        <div className="mb-6 flex gap-2">
          <input
            type="text" value={currentGuess}
            onChange={(e) => setCurrentGuess(e.target.value.replace(/[^a-zA-Z\s-]/g, ''))}
            onKeyPress={(e) => e.key === 'Enter' && submitGuess()}
            placeholder="Enter country name..."
            className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={gameOver || !user} maxLength={displayLength}
          />
          <Button onClick={submitGuess} disabled={gameOver || !currentGuess.trim() || !user} className="bg-gradient-to-r from-blue-500 to-purple-600">
            <Keyboard className="w-4 h-4 mr-2" /> Guess
          </Button>
        </div>

        <Card className="bg-slate-800/70 border-slate-700">
          <CardContent className="p-4">
            <h3 className="text-white font-semibold mb-3 text-center">How to play:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2 p-2 bg-slate-700 rounded-md">
                <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center text-white font-bold text-xs">A</div>
                <span className="text-white/80">Correct letter & position</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-slate-700 rounded-md">
                <div className="w-6 h-6 bg-yellow-500 rounded flex items-center justify-center text-white font-bold text-xs">B</div>
                <span className="text-white/80">Correct letter, wrong position</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-slate-700 rounded-md">
                <div className="w-6 h-6 bg-slate-600 rounded flex items-center justify-center text-white font-bold text-xs">C</div>
                <span className="text-white/80">Letter not in country name</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </QuizLayout>
  );
};

export default WordleQuiz;