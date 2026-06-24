import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabase = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

/**
 * Submit a user score.
 * Falls back to localStorage if Supabase is unavailable.
 */
export async function submitScore(userId, name, score) {
  if (supabase) {
    const { error } = await supabase.from('leaderboard').upsert({ id: userId, name, score }, { onConflict: 'id' });
    if (!error) return;
    console.warn('Supabase upsert error, fallback to localStorage', error);
  }

  const existing = JSON.parse(localStorage.getItem('leaderboard') || '[]');
  const idx = existing.findIndex(e => e.id === userId);
  if (idx >= 0) existing[idx] = { id: userId, name, score };
  else existing.push({ id: userId, name, score });

  localStorage.setItem('leaderboard', JSON.stringify(existing));
}

/**
 * Get top scores, default limit 10.
 * Uses Supabase if available, otherwise localStorage.
 */
export async function getTopScores(limit = 10) {
  if (supabase) {
    const { data, error } = await supabase.from('leaderboard').select('*').order('score', { ascending: false }).limit(limit);
    if (!error) return data;
    console.warn('Supabase fetch error, using local fallback', error);
  }

  const data = JSON.parse(localStorage.getItem('leaderboard') || '[]');
  return data.sort((a, b) => b.score - a.score).slice(0, limit);
}
