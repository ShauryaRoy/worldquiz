
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';

const ScoreContext = createContext();

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
};

const sortLeaderboardEntries = (entries = []) => {
  return [...entries].sort((a, b) => (b.score || 0) - (a.score || 0) || safeNumber(a.time_taken) - safeNumber(b.time_taken));
};

const readStoredJson = (key, fallbackValue) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallbackValue;
  } catch (error) {
    console.warn(`Failed to parse localStorage key: ${key}`, error);
    return fallbackValue;
  }
};

export const useScore = () => {
  const context = useContext(ScoreContext);
  if (!context) {
    throw new Error('useScore must be used within a ScoreProvider');
  }
  return context;
};

export const ScoreProvider = ({ children }) => {
  const [scores, setScores] = useState(() => {
    return readStoredJson('quiz-scores-local', {});
  });
  const [leaderboard, setLeaderboard] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem('quiz-scores-local', JSON.stringify(scores));
  }, [scores]);

  const saveEntryLocally = (entry) => {
    const localEntry = { ...entry, id: crypto.randomUUID() };
    const allKey = 'geoquiz-leaderboard-local-all';
    const quizKey = entry.quiz_type ? `geoquiz-leaderboard-local-${entry.quiz_type}` : null;

    const allEntries = readStoredJson(allKey, []);
    const updatedAll = sortLeaderboardEntries([...allEntries, localEntry]);
    localStorage.setItem(allKey, JSON.stringify(updatedAll));

    if (quizKey) {
      const quizEntries = readStoredJson(quizKey, []);
      const updatedQuiz = sortLeaderboardEntries([...quizEntries, localEntry]);
      localStorage.setItem(quizKey, JSON.stringify(updatedQuiz));
      setLeaderboard(updatedQuiz);
      return;
    }

    setLeaderboard(updatedAll);
  };

  const fetchLeaderboard = async (quizType = null) => {
    if (!supabase) {
      const localLeaderboardKey = quizType ? `geoquiz-leaderboard-local-${quizType}` : 'geoquiz-leaderboard-local-all';
      const parsedLocal = readStoredJson(localLeaderboardKey, []);
      const sortedLocal = sortLeaderboardEntries(parsedLocal);
      setLeaderboard(sortedLocal);
      return sortedLocal;
    }

    try {
      let query = supabase
        .from('leaderboard_scores')
        .select('*')
        .order('score', { ascending: false })
        .order('time_taken', { ascending: true })
        .limit(100);
      
      if (quizType) {
        query = query.eq('quiz_type', quizType);
      }

      const { data, error } = await query;
        
      if (error) throw error;
      const sortedData = sortLeaderboardEntries(data || []);
      setLeaderboard(sortedData);
      return sortedData;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      const localLeaderboardKey = quizType ? `geoquiz-leaderboard-local-${quizType}` : 'geoquiz-leaderboard-local-all';
      const parsedLocal = readStoredJson(localLeaderboardKey, []);
      const sortedLocal = sortLeaderboardEntries(parsedLocal);
      setLeaderboard(sortedLocal);
      return sortedLocal;
    }
  };
  
  const fetchAllQuizTypesForLeaderboard = async () => {
    if (!supabase) {
      const allScores = readStoredJson('geoquiz-leaderboard-local-all', []);
      const uniqueTypes = [...new Set(allScores.map((item) => item.quiz_type).filter(Boolean))];
      return uniqueTypes;
    }

    try {
      const { data, error } = await supabase
        .from('leaderboard_scores')
        .select('quiz_type')
      
      if (error) throw error;
      
      const uniqueTypes = [...new Set(data.map(item => item.quiz_type))];
      return uniqueTypes;

    } catch (error) {
      console.error('Error fetching quiz types:', error);
      return [];
    }
  };


  useEffect(() => {
    fetchLeaderboard(); 
  }, []);

  const updateScore = (quizType, score, total, timeTaken) => {
    const newScoreEntry = {
      score,
      total,
      percentage: total > 0 ? Math.round((score / total) * 100) : 0,
      date: new Date().toISOString(),
      timeTaken: timeTaken || null,
    };
    
    setScores(prev => ({
      ...prev,
      [quizType]: newScoreEntry
    }));
  };

  const addLeaderboardEntry = async (entry) => {
    if (!supabase) {
      saveEntryLocally(entry);
      toast({
        title: 'Saved Locally',
        description: 'Your score was saved to local leaderboard.',
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('leaderboard_scores')
        .insert([entry])
        .select();

      if (error) throw error;
      
      if (data) {
        toast({
          title: "Score Submitted!",
          description: "Your score has been added to the leaderboard.",
        });
        await fetchLeaderboard(entry.quiz_type);
      }
    } catch (error) {
      console.error('Error adding leaderboard entry:', error);
      saveEntryLocally(entry);
      toast({
        title: "Saved Locally",
        description: "Could not submit to Supabase right now. Score saved to local leaderboard.",
      });
    }
  };

  const getScore = (quizType) => {
    return scores[quizType] || null;
  };

  const getAllScores = () => {
    return scores;
  };

  const getLeaderboard = (quizType = null) => {
    if (!quizType) return sortLeaderboardEntries(leaderboard);
    return sortLeaderboardEntries(leaderboard.filter(entry => entry.quiz_type === quizType));
  };

  return (
    <ScoreContext.Provider value={{ updateScore, getScore, getAllScores, addLeaderboardEntry, getLeaderboard, fetchLeaderboard, fetchAllQuizTypesForLeaderboard }}>
      {children}
    </ScoreContext.Provider>
  );
};
