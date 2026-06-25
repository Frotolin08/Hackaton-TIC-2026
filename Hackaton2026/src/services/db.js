import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('Supabase client initialized successfully.');
  } catch (error) {
    console.warn('Failed to initialize Supabase client:', error);
  }
} else {
  console.info('Supabase credentials not found. Falling back to local storage database.');
}

export const dbService = {
  isSupabaseConnected: () => supabase !== null,

  saveGameSet: async (gameSet) => {
    if (!supabase) throw new Error('Supabase not connected');
    
    const id = gameSet.id || crypto.randomUUID();
    const preparedSet = {
      ...gameSet,
      id,
      createdAt: gameSet.createdAt || new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('game_sets')
      .insert([preparedSet])
      .select();

    if (error) throw error;
    return data[0];
  },

  getGameSets: async () => {
    if (!supabase) throw new Error('Supabase not connected');
    
    const { data, error } = await supabase
      .from('game_sets')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  getGameSetById: async (id) => {
    if (!supabase) throw new Error('Supabase not connected');
    
    const { data, error } = await supabase
      .from('game_sets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  deleteGameSet: async (id) => {
    if (!supabase) throw new Error('Supabase not connected');
    
    const { error } = await supabase
      .from('game_sets')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  saveUserProgress: async (progressItem) => {
    if (!supabase) throw new Error('Supabase not connected');
    
    const id = progressItem.id || crypto.randomUUID();
    const preparedProgress = {
      ...progressItem,
      id,
      timestamp: progressItem.timestamp || new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('user_progress')
      .insert([preparedProgress])
      .select();

    if (error) throw error;
    return data[0];
  },

  getUserProgress: async () => {
    if (!supabase) throw new Error('Supabase not connected');
    
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  clearAllProgress: async () => {
    if (!supabase) throw new Error('Supabase not connected');
    
    const { error } = await supabase
      .from('user_progress')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw error;
    return true;
  },

  getUserSettings: async () => {
    if (!supabase) throw new Error('Supabase not connected');
    
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        const { data: newData, error: insertError } = await supabase
          .from('user_settings')
          .insert([{ streak: 1, score: 0 }])
          .select()
          .single();
        if (insertError) throw insertError;
        return newData;
      }
      throw error;
    }
    return data;
  },

  updateUserSettings: async (settings) => {
    if (!supabase) throw new Error('Supabase not connected');
    
    const { data, error } = await supabase
      .from('user_settings')
      .update({ ...settings, updated_at: new Date().toISOString() })
      .eq('id', settings.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

