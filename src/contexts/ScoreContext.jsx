
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';

const ScoreContext = createContext();

export const useScore = () => {
  const context = useContext(ScoreContext);
  if (!context) {
    throw new Error('useScore must be used within a ScoreProvider');
  }
  return context;
};

export const ScoreProvider = ({ children }) => {
  const [scores, setScores] = useState(() => {
    const saved = localStorage.getItem('quiz-scores-local');
    return saved ? JSON.parse(saved) : {};
  });
  const [leaderboard, setLeaderboard] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem('quiz-scores-local', JSON.stringify(scores));
  }, [scores]);

  const fetchLeaderboard = async (quizType = null) => {
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
      setLeaderboard(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast({
        title: "Error fetching leaderboard",
        description: "Could not load scores. Displaying local data if available.",
        variant: "destructive",
      });
      const localLeaderboardKey = quizType ? `geoquiz-leaderboard-local-${quizType}` : 'geoquiz-leaderboard-local-all';
      const localLeaderboard = localStorage.getItem(localLeaderboardKey);
      const parsedLocal = localLeaderboard ? JSON.parse(localLeaderboard) : [];
      setLeaderboard(parsedLocal);
      return parsedLocal;
    }
  };
  
  const fetchAllQuizTypesForLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('leaderboard_scores')
        .select('quiz_type')
      
      if (error) throw error;
      
      const uniqueTypes = [...new Set(data.map(item => item.quiz_type))];
      return uniqueTypes;

    } catch (error) {
       console.error('Error fetching quiz types:', error);
       toast({
        title: "Error fetching quiz types",
        description: "Could not load available quiz types for leaderboards.",
        variant: "destructive",
      });
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
        fetchLeaderboard(entry.quiz_type); 
        fetchLeaderboard();
      }
    } catch (error) {
      console.error('Error adding leaderboard entry:', error);
      toast({
        title: "Submission Error",
        description: "Could not submit your score. It's saved locally for this session.",
        variant: "destructive",
      });
       const localLeaderboardKey = entry.quiz_type ? `geoquiz-leaderboard-local-${entry.quiz_type}` : 'geoquiz-leaderboard-local-all';
       const currentLocal = JSON.parse(localStorage.getItem(localLeaderboardKey) || '[]');
       const localEntry = {...entry, id: crypto.randomUUID()}; 
       const updatedLocal = [...currentLocal, localEntry].sort((a, b) => b.score - a.score || a.time_taken - b.time_taken);
       localStorage.setItem(localLeaderboardKey, JSON.stringify(updatedLocal));
       setLeaderboard(updatedLocal); 
    }
  };

  const getScore = (quizType) => {
    return scores[quizType] || null;
  };

  const getAllScores = () => {
    return scores;
  };

  const getLeaderboard = (quizType = null) => {
    if (!quizType) return leaderboard.sort((a,b) => b.score - a.score || a.time_taken - b.time_taken);
    return leaderboard.filter(entry => entry.quiz_type === quizType).sort((a,b) => b.score - a.score || a.time_taken - b.time_taken);
  };

  return (
    <ScoreContext.Provider value={{ updateScore, getScore, getAllScores, addLeaderboardEntry, getLeaderboard, fetchLeaderboard, fetchAllQuizTypesForLeaderboard }}>
      {children}
    </ScoreContext.Provider>
  );
};
