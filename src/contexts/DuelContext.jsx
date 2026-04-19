import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

const DuelContext = createContext();

export const useDuel = () => {
  const ctx = useContext(DuelContext);
  if (!ctx) throw new Error('useDuel must be used within a DuelProvider');
  return ctx;
};

// ── Rank Tiers ─────────────────────────────────────────────
export const RANK_TIERS = [
  { name: 'Bronze',   min: 0,    max: 999,      color: 'text-amber-600',  bg: 'bg-amber-900/30',  border: 'border-amber-600',  icon: '🥉' },
  { name: 'Silver',   min: 1000, max: 1499,     color: 'text-slate-300',  bg: 'bg-slate-700/50',  border: 'border-slate-400',  icon: '🥈' },
  { name: 'Gold',     min: 1500, max: 1999,     color: 'text-yellow-400', bg: 'bg-yellow-900/30', border: 'border-yellow-400', icon: '🥇' },
  { name: 'Platinum', min: 2000, max: 2499,     color: 'text-cyan-300',   bg: 'bg-cyan-900/30',   border: 'border-cyan-300',   icon: '💎' },
  { name: 'Diamond',  min: 2500, max: 2999,     color: 'text-blue-300',   bg: 'bg-blue-900/30',   border: 'border-blue-300',   icon: '💠' },
  { name: 'Master',   min: 3000, max: Infinity, color: 'text-purple-400', bg: 'bg-purple-900/30', border: 'border-purple-400', icon: '👑' },
];

export const getRankTier = (rating = 1000) =>
  RANK_TIERS.find(t => rating >= t.min && rating <= t.max) || RANK_TIERS[0];

// ── Room code generator ────────────────────────────────────
const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

// ── Provider ───────────────────────────────────────────────
export const DuelProvider = ({ children }) => {
  const [currentDuel, setCurrentDuel]   = useState(null);
  const [duelStatus,  setDuelStatus]    = useState('idle'); // idle | creating | waiting | active | finished
  const [error,       setError]         = useState(null);
  const channelRef = useRef(null);

  const unsubscribe = useCallback(() => {
    if (channelRef.current && supabase) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  const subscribeToRoom = useCallback((duelId, onUpdate) => {
    if (!supabase) return;
    unsubscribe();
    const ch = supabase
      .channel(`duel-${duelId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'duels', filter: `id=eq.${duelId}` },
        (payload) => onUpdate(payload.new),
      )
      .subscribe();
    channelRef.current = ch;
  }, [unsubscribe]);

  // ── Upsert user profile ──────────────────────────────────
  const getOrCreateProfile = async (name, email) => {
    if (!supabase) return null;
    const { data: existing } = await supabase
      .from('user_profiles').select('*').eq('email', email).single();
    if (existing) return existing;
    const { data: created } = await supabase
      .from('user_profiles').insert([{ name, email }]).select().single();
    return created;
  };

  // ── ELO-style rating update after duel ───────────────────
  const updateRatings = async (duel) => {
    if (!supabase || !duel.guest_email) return;
    const isHostWin  = duel.winner_email === duel.host_email;
    const isGuestWin = duel.winner_email === duel.guest_email;
    const isDraw     = !duel.winner_email;

    const [hostProf, guestProf] = await Promise.all([
      getOrCreateProfile(duel.host_name,  duel.host_email),
      getOrCreateProfile(duel.guest_name, duel.guest_email),
    ]);

    const apply = async (profile, isWin, isLoss) => {
      if (!profile) return;
      const delta = isDraw ? 5 : isWin ? 25 : -20;
      await supabase.from('user_profiles').update({
        rating:    Math.max(0, profile.rating + delta),
        wins:      profile.wins   + (isWin  ? 1 : 0),
        losses:    profile.losses + (isLoss ? 1 : 0),
        draws:     profile.draws  + (isDraw ? 1 : 0),
        updated_at: new Date().toISOString(),
      }).eq('id', profile.id);
    };

    await Promise.all([
      apply(hostProf,  isHostWin,  !isHostWin  && !isDraw),
      apply(guestProf, isGuestWin, !isGuestWin && !isDraw),
    ]);
  };

  // ── Create a duel room ───────────────────────────────────
  const createDuel = async (user, quizType, questions) => {
    if (!supabase) { setError('Supabase is required for live duels.'); return null; }
    setDuelStatus('creating');
    setError(null);

    try {
      const roomCode = generateRoomCode();
      const { data, error } = await supabase
        .from('duels')
        .insert([{
          room_code:       roomCode,
          host_name:       user.name,
          host_email:      user.email,
          quiz_type:       quizType,
          questions,
          total_questions: questions.length,
          status:          'waiting',
        }])
        .select()
        .single();

      if (error) throw error;
      setCurrentDuel(data);
      setDuelStatus('waiting');
      return data;
    } catch (err) {
      setError(err.message);
      setDuelStatus('idle');
      return null;
    }
  };

  // ── Join a duel room ─────────────────────────────────────
  const joinDuel = async (user, roomCode) => {
    if (!supabase) { setError('Supabase is required for live duels.'); return null; }
    setError(null);

    try {
      const { data: duel, error: fetchErr } = await supabase
        .from('duels').select('*')
        .eq('room_code', roomCode.toUpperCase().trim())
        .single();

      if (fetchErr || !duel) throw new Error('Room not found. Double-check the code.');
      if (duel.status !== 'waiting')  throw new Error('This room is already in progress or has ended.');
      if (duel.host_email === user.email) throw new Error('You cannot join your own room!');

      const { data, error } = await supabase
        .from('duels')
        .update({ guest_name: user.name, guest_email: user.email, status: 'active' })
        .eq('id', duel.id)
        .select().single();

      if (error) throw error;
      setCurrentDuel(data);
      setDuelStatus('active');
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    }
  };

  // ── Submit one answer ────────────────────────────────────
  const submitAnswer = async (duelId, isHost, questionIndex, isCorrect, timeTaken, baseDuel) => {
    if (!supabase) return;

    const answersKey = isHost ? 'host_answers' : 'guest_answers';
    const scoreKey   = isHost ? 'host_score'   : 'guest_score';

    const prevAnswers  = (baseDuel[answersKey] || []);
    const newAnswers   = [...prevAnswers, { questionIndex, isCorrect, timeTaken }];
    const newScore     = (baseDuel[scoreKey] || 0) + (isCorrect ? 1 : 0);
    const otherAnswers = isHost ? (baseDuel.guest_answers || []) : (baseDuel.host_answers || []);
    const totalQ       = baseDuel.total_questions;

    const updates = {
      [answersKey]: newAnswers,
      [scoreKey]:   newScore,
      updated_at:   new Date().toISOString(),
    };

    // Check if both players are done
    if (newAnswers.length >= totalQ && otherAnswers.length >= totalQ) {
      const hostFinal  = isHost ? newScore : baseDuel.host_score;
      const guestFinal = isHost ? baseDuel.guest_score : newScore;
      updates.status       = 'finished';
      updates.winner_email = hostFinal > guestFinal
        ? baseDuel.host_email
        : guestFinal > hostFinal
          ? baseDuel.guest_email
          : null; // draw
    }

    try {
      const { data, error } = await supabase
        .from('duels').update(updates).eq('id', duelId).select().single();
      if (error) throw error;
      setCurrentDuel(data);
      if (data.status === 'finished') await updateRatings(data);
    } catch (err) {
      console.error('submitAnswer error:', err);
    }
  };

  // ── Fetch a user profile by email ────────────────────────
  const getUserProfile = async (email) => {
    if (!supabase || !email) return null;
    const { data } = await supabase
      .from('user_profiles').select('*').eq('email', email).single();
    return data || null;
  };

  const leaveDuel = useCallback(() => {
    unsubscribe();
    setCurrentDuel(null);
    setDuelStatus('idle');
    setError(null);
  }, [unsubscribe]);

  useEffect(() => () => unsubscribe(), [unsubscribe]);

  return (
    <DuelContext.Provider value={{
      currentDuel, setCurrentDuel,
      duelStatus,  setDuelStatus,
      error,       setError,
      createDuel, joinDuel, submitAnswer,
      leaveDuel, subscribeToRoom, getUserProfile,
      RANK_TIERS, getRankTier,
    }}>
      {children}
    </DuelContext.Provider>
  );
};
