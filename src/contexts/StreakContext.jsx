import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

const StreakContext = createContext();

export const useStreak = () => {
  const ctx = useContext(StreakContext);
  if (!ctx) throw new Error('useStreak must be used within a StreakProvider');
  return ctx;
};

const getTodayStr = () => new Date().toISOString().split('T')[0];

const getYesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

const readLocal = (key, fallback) => {
  try {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : fallback;
  } catch {
    return fallback;
  }
};

export const StreakProvider = ({ children }) => {
  const [streak,            setStreak]           = useState(() => readLocal('gq-streak', 0));
  const [longestStreak,     setLongestStreak]     = useState(() => readLocal('gq-longest-streak', 0));
  const [lastChallengeDate, setLastChallengeDate] = useState(() => readLocal('gq-last-challenge', null));
  const [todayCompleted,    setTodayCompleted]    = useState(() => readLocal('gq-last-challenge', null) === getTodayStr());

  // Persist to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('gq-streak',         JSON.stringify(streak));
    localStorage.setItem('gq-longest-streak', JSON.stringify(longestStreak));
    localStorage.setItem('gq-last-challenge', JSON.stringify(lastChallengeDate));
  }, [streak, longestStreak, lastChallengeDate]);

  const recordDailyCompletion = useCallback(async (user, quizType, score, total, timeTaken) => {
    const today     = getTodayStr();
    const yesterday = getYesterdayStr();

    if (lastChallengeDate === today) return streak; // already completed

    const newStreak  = lastChallengeDate === yesterday ? streak + 1 : 1;
    const newLongest = Math.max(longestStreak, newStreak);

    setStreak(newStreak);
    setLongestStreak(newLongest);
    setLastChallengeDate(today);
    setTodayCompleted(true);

    if (supabase && user?.email) {
      try {
        // Upsert daily completion record
        await supabase
          .from('daily_challenge_completions')
          .upsert(
            [{ email: user.email, name: user.name, challenge_date: today, quiz_type: quizType, score, total, time_taken: timeTaken }],
            { onConflict: 'email,challenge_date' },
          );

        // Update or create user profile streak
        const { data: profile } = await supabase
          .from('user_profiles').select('id').eq('email', user.email).single();

        if (profile) {
          await supabase.from('user_profiles').update({
            current_streak:      newStreak,
            longest_streak:      newLongest,
            last_challenge_date: today,
            updated_at:          new Date().toISOString(),
          }).eq('id', profile.id);
        } else {
          await supabase.from('user_profiles').insert([{
            name: user.name, email: user.email,
            current_streak: newStreak, longest_streak: newLongest,
            last_challenge_date: today,
          }]);
        }
      } catch (err) {
        console.error('Streak sync error:', err);
      }
    }

    return newStreak;
  }, [streak, longestStreak, lastChallengeDate]);

  // Returns true if the user had a streak yesterday but hasn't played today yet
  const checkStreakAtRisk = useCallback(() => {
    if (todayCompleted || streak === 0) return false;
    return lastChallengeDate === getYesterdayStr();
  }, [todayCompleted, streak, lastChallengeDate]);

  return (
    <StreakContext.Provider value={{
      streak, longestStreak, lastChallengeDate, todayCompleted,
      recordDailyCompletion, checkStreakAtRisk,
    }}>
      {children}
    </StreakContext.Provider>
  );
};
